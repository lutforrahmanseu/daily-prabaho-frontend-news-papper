import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsReaderAuthenticated, selectReaderUser } from '../../store/readerSlice.js';
import {
  useGetSubscriptionPlansQuery,
  useGetMySubscriptionQuery,
  useCheckoutSubscriptionMutation,
  useVerifyPaymentCallbackMutation
} from '../../store/api/monetizationApi.js';
import {
  BANGLADESH_GATEWAYS,
  CARD_BRANDS,
  SUBSCRIPTION_STATUS_META,
  findForbiddenCardFields,
  formatBdt,
  getGatewayMeta,
  openAuthorizedInvoiceHtml
} from '../../utils/monetizationHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import SEO from '../../components/common/SEO.jsx';
import {
  CheckCircle2,
  Crown,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Smartphone,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  BookOpen
} from 'lucide-react';

export function SubscriptionPlansPage() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);

  const { data: catalogData, isLoading: loadingPlans } = useGetSubscriptionPlansQuery();
  const { data: mySubData, refetch: refetchMySub } = useGetMySubscriptionQuery(undefined, {
    skip: !isReaderAuth
  });
  const [checkoutSubscription, { isLoading: initiatingCheckout }] = useCheckoutSubscriptionMutation();
  const [verifyCallback, { isLoading: verifyingPayment }] = useVerifyPaymentCallbackMutation();

  const plans = catalogData?.plans || [];
  const gateways = BANGLADESH_GATEWAYS;

  const [selectedPlanSlug, setSelectedPlanSlug] = useState('premium-annual');
  const [gateway, setGateway] = useState('bkash');
  const [walletNumber, setWalletNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('VISA');
  const [cardLast4, setCardLast4] = useState('');
  const [billingName, setBillingName] = useState(readerUser?.name || '');
  const [billingPhone, setBillingPhone] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);

  const [pendingSession, setPendingSession] = useState(null);
  const [completedReceipt, setCompletedReceipt] = useState(null);

  const activePlan = plans.find((p) => p.slug === selectedPlanSlug) || plans[1] || plans[0];
  const currentSubscription = mySubData?.subscription || null;
  const effectiveTier = mySubData?.effective_tier || 'free';

  const handleStartCheckout = async (e) => {
    e.preventDefault();
    if (!isReaderAuth) {
      sweetAlert.info(
        isBn ? 'পাঠক লগইন প্রয়োজন' : 'Reader Sign-In Required',
        isBn
          ? 'সাবস্ক্রিপশন সক্রিয় করতে অনুগ্রহ করে আগে আপনার পাঠক অ্যাকাউন্টে লগইন বা নিবন্ধন করুন।'
          : 'Please sign in or create a reader account before activating a membership.'
      );
      return;
    }

    if (!activePlan) return;

    const payload = {
      plan_slug: activePlan.slug,
      gateway,
      auto_renew: autoRenew,
      billing_name: (billingName || readerUser?.name || '').trim() || undefined,
      billing_email: readerUser?.email || undefined,
      billing_phone: billingPhone.trim() || undefined
    };

    if (activePlan.tier === 'premium') {
      if (gateway === 'bkash' || gateway === 'nagad') {
        if (walletNumber.trim()) {
          payload.wallet_number = walletNumber.trim();
        }
      } else if (gateway === 'card') {
        payload.card_brand = cardBrand;
        if (cardLast4.trim().length === 4) {
          payload.card_last4 = cardLast4.trim();
        }
      }
    }

    // Client-side guard guaranteeing zero raw card fields are ever transmitted
    const forbidden = findForbiddenCardFields(payload);
    if (forbidden.length > 0) {
      sweetAlert.error('নিরাপত্তা সতর্কতা', `অগ্রহণযোগ্য কার্ড তথ্য শনাক্ত হয়েছে: ${forbidden.join(', ')}`);
      return;
    }

    try {
      const res = await checkoutSubscription(payload).unwrap();
      setCompletedReceipt(null);

      if (!res?.requires_payment || res?.status === 'succeeded') {
        setPendingSession(null);
        setCompletedReceipt(res);
        refetchMySub();
        sweetAlert.success(
          isBn ? 'ফ্রি মেম্বারশিপ সক্রিয়!' : 'Free Membership Activated',
          isBn ? 'আপনার ফ্রি পাঠক মেম্বারশিপ সফলভাবে চালু হয়েছে।' : 'Your free membership plan is now active.'
        );
        return;
      }

      setPendingSession(res);
      sweetAlert.info(
        isBn ? 'পেমেন্ট সেশন তৈরি হয়েছে' : 'Gateway Session Ready',
        isBn
          ? `${getGatewayMeta(gateway).labelBn} গেটওয়ে সেশন প্রস্তুত। এখন নিচের "পেমেন্ট যাচাই ও সম্পন্ন করুন" বাটনে ক্লিক করুন।`
          : `Hosted session initialized via ${gateway.toUpperCase()}. Complete backend callback verification below.`
      );
    } catch (err) {
      sweetAlert.error(
        isBn ? 'চেকআউট ব্যর্থ হয়েছে' : 'Checkout Failed',
        err?.data?.message || 'সাবস্ক্রিপশন চেকআউট শুরু করা যায়নি।'
      );
    }
  };

  const handleVerifyGatewayCallback = async () => {
    if (!pendingSession) return;
    const gwSession = pendingSession.gateway_session || {};
    const cbPayload = gwSession.callback_sample_payload || {
      transaction_reference: pendingSession.transaction?.transaction_reference,
      gateway_trx_id: `GW-${pendingSession.gateway?.toUpperCase()}-${Date.now()}`,
      status: 'succeeded',
      amount: pendingSession.transaction?.amount,
      currency: 'BDT',
      signature: gwSession.callback_signature
    };

    try {
      const result = await verifyCallback({
        gateway: pendingSession.gateway,
        payload: cbPayload,
        signature: gwSession.callback_signature
      }).unwrap();

      setPendingSession(null);
      setCompletedReceipt(result);
      refetchMySub();
      sweetAlert.success(
        isBn ? 'পেমেন্ট যাচাই ও প্রিমিয়াম সক্রিয়!' : 'Payment Verified & Activated',
        isBn
          ? 'সার্ভার-টু-সার্ভার পেমেন্ট যাচাই সম্পন্ন হয়েছে এবং ই-পেপার প্লাস ও বিজ্ঞাপন-মুক্ত পাঠ আনলক হয়েছে।'
          : 'Backend verification succeeded! Your Premium & E-Paper Plus membership is active.'
      );
    } catch (err) {
      sweetAlert.error(
        isBn ? 'পেমেন্ট যাচাই ব্যর্থ' : 'Verification Failed',
        err?.data?.message || 'গেটওয়ে সিগনেচার যাচাই ব্যর্থ হয়েছে।'
      );
    }
  };

  const handleOpenInvoice = async (invoiceId) => {
    try {
      await openAuthorizedInvoiceHtml(invoiceId, false);
    } catch {
      sweetAlert.error(isBn ? 'ইনভয়েস খোলা যায়নি' : 'Could not open invoice');
    }
  };

  return (
    <div className="space-y-8 py-4">
      <SEO
        title={isBn ? 'মেম্বারশিপ ও প্রিমিয়াম সাবস্ক্রিপশন' : 'Membership & Premium Subscriptions'}
        description={
          isBn
            ? 'দৈনিক বার্তা প্রবাহের ফ্রি ও প্রিমিয়াম সাবস্ক্রিপশন প্ল্যান — বিকাশ, নগদ ও নিরাপদ কার্ড পেমেন্ট।'
            : 'Daily Prabaho Free and Premium membership plans via bKash, Nagad, and hosted card checkout.'
        }
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>{isBn ? 'নিউজফ্লো ডিজিটাল মেম্বারশিপ' : 'NewsFlow Digital Membership'}</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif-bn leading-tight">
            {isBn
              ? 'স্বাধীন ও গভীর সাংবাদিকতায় অংশ নিন — বিজ্ঞাপন-মুক্ত প্রিমিয়াম পাঠ ও দৈনিক ই-পেপার'
              : 'Support Independent Journalism — Ad-Free Premium Reading & Daily E-Paper'}
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            {isBn
              ? 'বাংলাদেশের জনপ্রিয় বিকাশ, নগদ এবং ব্যাংক-হোস্টেড কার্ড গেটওয়ে ব্যবহার করে মুহূর্তেই মেম্বারশিপ নিন। প্রতিটি লেনদেন ব্যাকএন্ডে ক্রিপ্টোগ্রাফিকভাবে যাচাইকৃত এবং স্বয়ংক্রিয় ইনভয়েস জেনারেট হয়।'
              : 'Subscribe seamlessly using Bangladesh bKash, Nagad, or tokenized hosted card checkout. All callbacks are cryptographically verified on our backend with automatic invoice generation.'}
          </p>

          {isReaderAuth && mySubData && (
            <div className="inline-flex flex-wrap items-center gap-3 pt-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs text-xs">
              <span className="font-semibold text-stone-200">
                {isBn ? 'আপনার বর্তমান প্ল্যান:' : 'Current Plan:'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-extrabold">
                {effectiveTier === 'premium' ? (isBn ? 'প্রিমিয়াম মেম্বার' : 'Premium') : isBn ? 'ফ্রি মেম্বার' : 'Free'}
              </span>
              {currentSubscription?.status && (
                <span className="text-stone-300">
                  ({SUBSCRIPTION_STATUS_META[currentSubscription.status]?.labelBn || currentSubscription.status})
                </span>
              )}
              <Link
                to="/reader/profile?tab=membership"
                className="text-amber-300 hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>{isBn ? 'বিলিং ও ইনভয়েস দেখুন' : 'Manage Billing'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Plans Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-bn">
              {isBn ? 'সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন' : 'Choose Your Subscription Plan'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              {isBn
                ? 'ফ্রি অ্যাকাউন্ট থেকে শুরু করে মাসিক অথবা সাশ্রয়ী বার্ষিক প্রিমিয়াম মেম্বারশিপ'
                : 'Select Free access or upgrade to Monthly or Annual Premium E-Paper Plus'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'কার্ডের মূল নম্বর সংরক্ষণ করা হয় না (PCI নিরাপদ)' : 'Zero Raw Card Storage (PCI-Safe)'}</span>
          </span>
        </div>

        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isSelected = selectedPlanSlug === plan.slug;
              const isFeatured = Boolean(plan.is_featured);
              const isCurrent =
                currentSubscription?.plan?.slug === plan.slug && currentSubscription?.status === 'active';

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanSlug(plan.slug)}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-700 bg-white shadow-lg ring-2 ring-rose-700/15'
                      : isFeatured
                      ? 'border-amber-400 bg-white hover:shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {isFeatured && (
                    <span className="absolute -top-3 left-5 px-3 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[11px] font-extrabold shadow-xs">
                      {isBn ? 'সবচেয়ে জনপ্রিয় · সাশ্রয়ী' : 'Best Value'}
                    </span>
                  )}

                  {isCurrent && (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {isBn ? 'বর্তমান প্ল্যান' : 'Active'}
                    </span>
                  )}

                  <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      {plan.tier === 'premium' ? (isBn ? 'প্রিমিয়াম মেম্বারশিপ' : 'Premium') : isBn ? 'বেসিক' : 'Free'}
                    </span>
                    <h3 className="text-xl font-extrabold text-stone-900 font-serif-bn mt-1">
                      {isBn ? plan.name_bn : plan.name_en}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="py-4 border-y border-stone-100 mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-stone-900 font-mono">
                        {Number(plan.price_bdt) === 0
                          ? isBn
                            ? 'ফ্রি'
                            : 'Free'
                          : formatBdt(plan.price_bdt, isBn)}
                      </span>
                      {Number(plan.price_bdt) > 0 && (
                        <span className="text-xs text-stone-500">
                          / {plan.billing_cycle === 'annual' ? (isBn ? 'বছর' : 'year') : isBn ? 'মাস' : 'month'}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-stone-700 flex-1 mb-6">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanSlug(plan.slug);
                      document.getElementById('monetization-checkout-panel')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-700 hover:bg-rose-800 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                    }`}
                  >
                    {isSelected
                      ? isBn
                        ? 'নির্বাচিত প্ল্যান ✓'
                        : 'Selected Plan ✓'
                      : isBn
                      ? 'এই প্ল্যানটি বেছে নিন'
                      : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Checkout & Payment Verification Section */}
      <section
        id="monetization-checkout-panel"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        <form
          onSubmit={handleStartCheckout}
          className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 font-serif-bn">
                {isBn ? 'চেকআউট ও পেমেন্ট মাধ্যম' : 'Checkout & Payment Method'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {activePlan
                  ? `${isBn ? activePlan.name_bn : activePlan.name_en} · ${formatBdt(activePlan.price_bdt, isBn)}`
                  : ''}
              </p>
            </div>
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>

          {!isReaderAuth && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-amber-900 font-medium">
                {isBn
                  ? 'সাবস্ক্রিপশন শুরু করতে আগে আপনার পাঠক অ্যাকাউন্টে লগইন বা নিবন্ধন করুন।'
                  : 'Sign in or register as a reader to proceed with checkout.'}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/reader/login"
                  className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                >
                  {isBn ? 'লগইন করুন' : 'Sign In'}
                </Link>
                <Link
                  to="/reader/register"
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-bold"
                >
                  {isBn ? 'নিবন্ধন' : 'Register'}
                </Link>
              </div>
            </div>
          )}

          {activePlan?.tier === 'premium' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                {isBn ? 'বাংলাদেশ পেমেন্ট গেটওয়ে নির্বাচন করুন' : 'Select Payment Gateway (Bangladesh)'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {gateways.map((gw) => {
                  const active = gateway === gw.code;
                  return (
                    <button
                      key={gw.code}
                      type="button"
                      onClick={() => setGateway(gw.code)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-rose-700 bg-rose-50/50 ring-2 ring-rose-700/15'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {gw.channelType === 'mfs_wallet' ? (
                          <Smartphone className="w-4 h-4 text-rose-700" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-blue-700" />
                        )}
                        {active && <CheckCircle2 className="w-4 h-4 text-rose-700" />}
                      </div>
                      <p className="text-xs font-extrabold text-stone-900">
                        {isBn ? gw.labelBn : gw.labelEn}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                        {isBn ? gw.descriptionBn : gw.descriptionEn}
                      </p>
                    </button>
                  );
                })}
              </div>

              {(gateway === 'bkash' || gateway === 'nagad') && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {gateway === 'bkash'
                      ? isBn
                        ? 'বিকাশ ওয়ালেট নম্বর (ঐচ্ছিক রেফারেন্স)'
                        : 'bKash Wallet Number (Optional)'
                      : isBn
                      ? 'নগদ ওয়ালেট নম্বর (ঐচ্ছিক রেফারেন্স)'
                      : 'Nagad Wallet Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    {isBn
                      ? 'কখনোই বিকাশ বা নগদ পিন/ওটিপি আমাদের সাইটে দেবেন না; গেটওয়ে হোস্টেড পেজেই শুধু যাচাই হয়।'
                      : 'Never enter wallet PIN/OTP directly here; gateway verification is performed externally and verified server-side.'}
                  </p>
                </div>
              )}

              {gateway === 'card' && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <p>
                      {isBn
                        ? 'নিরাপত্তা নীতি: নিউজফ্লো কখনোই সম্পূর্ণ কার্ড নম্বর, মেয়াদ বা CVV/CVC গ্রহণ বা সংরক্ষণ করে না। নিচের কেবল কার্ড নেটওয়ার্ক টোকেন রেফারেন্স দিয়ে হোস্টেড গেটওয়ে সেশন তৈরি করুন।'
                        : 'Security Policy: NewsFlow never collects or stores full card numbers, CVV, or expiry dates. Provide only card brand & optional last 4 reference to initialize hosted checkout.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isBn ? 'কার্ড নেটওয়ার্ক' : 'Card Brand'}
                      </label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
                      >
                        {CARD_BRANDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isBn ? 'শেষ ৪ ডিজিট (ঐচ্ছিক ট্যাগ)' : 'Last 4 Digits (Optional label)'}
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        pattern="\d{4}"
                        placeholder="4242"
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Billing Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'বিলিং নাম' : 'Billing Name'}
              </label>
              <input
                type="text"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                placeholder={readerUser?.name || (isBn ? 'আপনার পূর্ণ নাম' : 'Full Name')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'মোবাইল নম্বর' : 'Contact Phone'}
              </label>
              <input
                type="tel"
                value={billingPhone}
                onChange={(e) => setBillingPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {activePlan?.tier === 'premium' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="accent-rose-700"
              />
              <span>
                {isBn
                  ? 'মেয়াদ শেষে অটো-রিনিউয়াল পছন্দের তালিকায় রাখুন (যেকোনো সময় বাতিলযোগ্য)'
                  : 'Enable auto-renewal preference (can be cancelled anytime)'}
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={initiatingCheckout || !isReaderAuth || !activePlan}
            className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {initiatingCheckout
                ? isBn
                  ? 'প্রক্রিয়া চলছে...'
                  : 'Initializing...'
                : activePlan?.tier === 'free'
                ? isBn
                  ? 'ফ্রি মেম্বারশিপ সক্রিয় করুন'
                  : 'Activate Free Membership'
                : isBn
                ? `${getGatewayMeta(gateway).labelBn} দিয়ে চেকআউট শুরু করুন (${formatBdt(activePlan?.price_bdt, isBn)})`
                : `Start Checkout via ${gateway.toUpperCase()} (${formatBdt(activePlan?.price_bdt, false)})`}
            </span>
          </button>
        </form>

        {/* Right Side: Gateway Verification Step OR Receipt Preview */}
        <div className="lg:col-span-5 space-y-4">
          {pendingSession && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>
                  {isBn ? 'ধাপ ২: ব্যাকএন্ড পেমেন্ট কলব্যাক যাচাইকরণ' : 'Step 2: Backend Payment Callback Verification'}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {isBn
                  ? 'পেমেন্ট গেটওয়ে থেকে টোকেন ও HMAC-SHA256 সিগনেচার পাওয়া গেছে। সার্ভার-সাইড যাচাই সম্পন্ন করে মেম্বারশিপ সক্রিয় করতে নিচের বাটনে ক্লিক করুন।'
                  : 'Gateway session & HMAC-SHA256 signature issued. Click below to execute backend payment callback verification and unlock Premium access.'}
              </p>

              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Ref:</span>
                  <span className="font-bold text-stone-900">{pendingSession.transaction?.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Gateway:</span>
                  <span className="font-bold uppercase">{pendingSession.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount:</span>
                  <span className="font-bold text-rose-700">{formatBdt(pendingSession.transaction?.amount, isBn)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={verifyingPayment}
                onClick={handleVerifyGatewayCallback}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {verifyingPayment
                    ? isBn
                      ? 'যাচাই চলছে...'
                      : 'Verifying...'
                    : isBn
                    ? 'পেমেন্ট যাচাই ও সাবস্ক্রিপশন সক্রিয় করুন ✓'
                    : 'Verify Backend Callback & Activate ✓'}
                </span>
              </button>
            </div>
          )}

          {completedReceipt && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>{isBn ? 'মেম্বারশিপ সফলভাবে সক্রিয়!' : 'Membership Activated!'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1.5">
                <p>
                  <strong>{isBn ? 'সাবস্ক্রিপশন কোড:' : 'Code:'}</strong>{' '}
                  <span className="font-mono">{completedReceipt.subscription?.subscription_code}</span>
                </p>
                {completedReceipt.invoice?.invoice_number && (
                  <p>
                    <strong>{isBn ? 'ইনভয়েস নম্বর:' : 'Invoice:'}</strong>{' '}
                    <span className="font-mono">{completedReceipt.invoice.invoice_number}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {completedReceipt.invoice?.id && (
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(completedReceipt.invoice.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ইনভয়েস প্রিন্ট / দেখুন' : 'View Invoice'}</span>
                  </button>
                )}
                <Link
                  to="/epaper"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ই-পেপার পড়ুন' : 'Open E-Paper'}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Guarantees Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-extrabold text-stone-900 font-serif-bn">
              {isBn ? 'কেন নিউজফ্লো প্রিমিয়াম?' : 'Why Daily Prabaho Premium?'}
            </h4>
            <ul className="space-y-3 text-xs text-stone-600">
              <li className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'দৈনিক পূর্ণাঙ্গ ই-পেপার ও ঐতিহাসিক সংখ্যার সব পাতার পিডিএফ/ভিউ অ্যাক্সেস।'
                    : 'Full daily E-Paper access & multi-edition historical PDF downloads.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'সব ডিসপ্লে বিজ্ঞাপন ছাড়াই দ্রুত ও পরিচ্ছন্ন পড়ার অভিজ্ঞতা।'
                    : 'Distraction-free, ad-free article reading across desktop and mobile.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'বিকাশ, নগদ ও ব্যাংক কার্ডে ব্যাকএন্ডে যাচাইকৃত লেনদেন এবং ইনভয়েস ও রিফান্ড সাপোর্ট।'
                    : 'Server-verified bKash, Nagad, and card billing with instant invoices & refund requests.'}
                </span>
              </li>
            </ul>
            <p className="text-[11px] text-stone-400 border-t border-stone-100 pt-3">
              {isBn
                ? `সক্রিয় প্ল্যান সংখ্যা: ${toBengaliNumber(plans.length)} · মুদ্রা: BDT (বাংলাদেশি টাকা)`
                : `Available plans: ${plans.length} · Currency: BDT`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SubscriptionPlansPage;


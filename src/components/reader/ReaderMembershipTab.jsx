import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetMySubscriptionQuery,
  useRenewMySubscriptionMutation,
  useCancelMySubscriptionMutation,
  useGetMySubscriptionHistoryQuery,
  useGetMyTransactionsQuery,
  useGetMyInvoicesQuery,
  useGetMyRefundsQuery,
  useRequestRefundMutation,
  useVerifyPaymentCallbackMutation
} from '../../store/api/monetizationApi.js';
import {
  BANGLADESH_GATEWAYS,
  SUBSCRIPTION_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  formatBdt,
  getGatewayMeta,
  openAuthorizedInvoiceHtml
} from '../../utils/monetizationHelpers.js';
import { formatBengaliFullDateTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Crown,
  CreditCard,
  FileText,
  History,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
  ExternalLink
} from 'lucide-react';

export function ReaderMembershipTab() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data: subInfo, refetch: refetchSub } = useGetMySubscriptionQuery();
  const { data: historyRes } = useGetMySubscriptionHistoryQuery({ per_page: 20 });
  const { data: txRes, refetch: refetchTx } = useGetMyTransactionsQuery({ per_page: 20 });
  const { data: invoiceRes } = useGetMyInvoicesQuery({ per_page: 20 });
  const { data: refundRes, refetch: refetchRefunds } = useGetMyRefundsQuery({ per_page: 20 });

  const [renewSub, { isLoading: renewing }] = useRenewMySubscriptionMutation();
  const [cancelSub, { isLoading: cancelling }] = useCancelMySubscriptionMutation();
  const [requestRefund, { isLoading: requestingRefund }] = useRequestRefundMutation();
  const [verifyCallback, { isLoading: verifyingCallback }] = useVerifyPaymentCallbackMutation();

  const [renewGateway, setRenewGateway] = useState('bkash');
  const [pendingRenewSession, setPendingRenewSession] = useState(null);

  const [refundTx, setRefundTx] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const subscription = subInfo?.subscription || null;
  const effectiveTier = subInfo?.effective_tier || 'free';
  const historyItems = historyRes?.items || [];
  const transactions = txRes?.items || [];
  const invoices = invoiceRes?.items || [];
  const refunds = refundRes?.items || [];

  const handleRenew = async () => {
    if (!subscription?.id) return;
    try {
      const res = await renewSub({
        subscription_id: subscription.id,
        gateway: renewGateway
      }).unwrap();

      if (res?.requires_payment) {
        setPendingRenewSession(res);
        sweetAlert.info(
          isBn ? 'রিনিউয়াল পেমেন্ট সেশন তৈরি হয়েছে' : 'Renewal Payment Ready',
          isBn
            ? 'নবায়ন সম্পন্ন করতে নিচের "পেমেন্ট যাচাই করুন" বাটনে ক্লিক করুন।'
            : 'Click Verify Callback below to complete your renewal.'
        );
      } else {
        refetchSub();
        sweetAlert.success(isBn ? 'নবায়ন সম্পন্ন হয়েছে' : 'Subscription Renewed');
      }
    } catch (err) {
      sweetAlert.error(
        isBn ? 'নবায়ন ব্যর্থ হয়েছে' : 'Renewal Failed',
        err?.data?.message || 'সাবস্ক্রিপশন নবায়ন করা যায়নি।'
      );
    }
  };

  const handleVerifyRenewal = async () => {
    if (!pendingRenewSession) return;
    const gwSession = pendingRenewSession.gateway_session || {};
    try {
      await verifyCallback({
        gateway: pendingRenewSession.gateway,
        payload: gwSession.callback_sample_payload,
        signature: gwSession.callback_signature
      }).unwrap();
      setPendingRenewSession(null);
      refetchSub();
      refetchTx();
      sweetAlert.success(isBn ? 'নবায়ন যাচাই ও সম্পন্ন!' : 'Renewal Payment Verified!');
    } catch (err) {
      sweetAlert.error(
        isBn ? 'যাচাই ব্যর্থ হয়েছে' : 'Verification Failed',
        err?.data?.message || 'কলব্যাক যাচাই করা যায়নি।'
      );
    }
  };

  const handleCancel = async (immediate) => {
    if (!subscription?.id) return;
    const { isConfirmed } = await sweetAlert.confirm({
      title: isBn ? 'সাবস্ক্রিপশন বাতিল করবেন?' : 'Cancel subscription?',
      text: immediate
        ? isBn
          ? 'তাৎক্ষণিকভাবে প্রিমিয়াম সুবিধা বন্ধ হবে।'
          : 'Premium benefits will stop immediately.'
        : isBn
        ? 'চলমান মেয়াদ শেষ হওয়ার পর স্বয়ংক্রিয় নবায়ন বন্ধ হবে।'
        : 'Auto-renewal will turn off at period end.'
    });
    if (!isConfirmed) return;

    try {
      await cancelSub({
        subscription_id: subscription.id,
        immediate,
        reason: isBn ? 'পাঠক প্রোফাইল থেকে বাতিল করেছেন' : 'Cancelled from reader profile'
      }).unwrap();
      refetchSub();
      sweetAlert.success(isBn ? 'সাবস্ক্রিপশন বাতিলের সিদ্ধান্ত সংরক্ষিত' : 'Cancellation Saved');
    } catch (err) {
      sweetAlert.error(isBn ? 'বাতিল করা যায়নি' : 'Failed', err?.data?.message || '');
    }
  };

  const handleOpenInvoice = async (invoiceId) => {
    try {
      await openAuthorizedInvoiceHtml(invoiceId, false);
    } catch {
      sweetAlert.error(isBn ? 'ইনভয়েস খোলা যায়নি' : 'Could not open invoice');
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!refundTx) return;
    try {
      await requestRefund({
        payment_transaction_id: refundTx.id,
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason.trim()
      }).unwrap();
      setRefundTx(null);
      setRefundAmount('');
      setRefundReason('');
      refetchRefunds();
      refetchTx();
      sweetAlert.success(
        isBn ? 'রিফান্ড আবেদন জমা হয়েছে' : 'Refund Requested',
        isBn ? 'অ্যাডমিন টিম পর্যালোচনা করে ব্যবস্থা নেবে।' : 'Our team will review your request shortly.'
      );
    } catch (err) {
      sweetAlert.error(
        isBn ? 'রিফান্ড আবেদন ব্যর্থ হয়েছে' : 'Request Failed',
        err?.data?.message || 'আবেদন জমা দেওয়া যায়নি।'
      );
    }
  };

  const statusMeta = SUBSCRIPTION_STATUS_META[subscription?.status] || SUBSCRIPTION_STATUS_META.active;

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-stone-900 font-serif-bn">
                  {subscription?.plan
                    ? isBn
                      ? subscription.plan.name_bn
                      : subscription.plan.name_en
                    : isBn
                    ? 'ফ্রি পাঠক মেম্বারশিপ'
                    : 'Free Membership'}
                </h2>
                {subscription?.status && (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                    {isBn ? statusMeta.labelBn : statusMeta.labelEn}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {subscription?.subscription_code ? (
                  <span className="font-mono">{subscription.subscription_code} · </span>
                ) : null}
                {effectiveTier === 'premium'
                  ? isBn
                    ? 'ই-পেপার প্লাস ও বিজ্ঞাপন-মুক্ত পাঠ সক্রিয়'
                    : 'E-Paper Plus & Ad-Free Reading Active'
                  : isBn
                  ? 'স্ট্যান্ডার্ড ফ্রি অ্যাকাউন্ট'
                  : 'Standard Free Access'}
              </p>
              {subscription?.ends_at && (
                <p className="text-xs text-stone-600 mt-1">
                  {isBn ? 'মেয়াদ শেষ:' : 'Valid until:'}{' '}
                  <span className="font-semibold">{formatBengaliFullDateTime(subscription.ends_at)}</span>
                </p>
              )}
            </div>
          </div>

          <Link
            to="/subscribe"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{effectiveTier === 'premium' ? (isBn ? 'প্ল্যান পরিবর্তন' : 'Change Plan') : isBn ? 'প্রিমিয়াম আপগ্রেড' : 'Upgrade to Premium'}</span>
          </Link>
        </div>

        {/* Renew / Cancel Controls for Existing Paid Subscriptions */}
        {subscription && subscription.tier === 'premium' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={renewGateway}
                onChange={(e) => setRenewGateway(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
              >
                {BANGLADESH_GATEWAYS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {isBn ? g.labelBn : g.labelEn}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={renewing}
                onClick={handleRenew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBn ? 'সাবস্ক্রিপশন নবায়ন করুন' : 'Renew Subscription'}</span>
              </button>
            </div>

            {subscription.status === 'active' && (
              <div className="flex flex-wrap items-center gap-2">
                {!subscription.cancel_at_period_end && (
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => handleCancel(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অটো-রিনিউ বন্ধ করুন' : 'Cancel Auto-Renew'}</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => handleCancel(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                >
                  <span>{isBn ? 'তাৎক্ষণিক বাতিল' : 'Cancel Immediately'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {pendingRenewSession && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-900">
              <p className="font-bold">
                {isBn ? 'নবায়ন কলব্যাক যাচাই বাকি আছে' : 'Pending Renewal Payment Verification'}
              </p>
              <p className="font-mono text-[11px] mt-0.5">
                {pendingRenewSession.transaction?.transaction_reference} ·{' '}
                {formatBdt(pendingRenewSession.transaction?.amount, isBn)}
              </p>
            </div>
            <button
              type="button"
              disabled={verifyingCallback}
              onClick={handleVerifyRenewal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'পেমেন্ট যাচাই সম্পন্ন করুন' : 'Complete Verification'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Refund Request Inline Drawer */}
      {refundTx && (
        <form onSubmit={handleSubmitRefund} className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-amber-950 font-serif-bn">
              {isBn ? 'রিফান্ড আবেদন' : 'Submit Refund Request'} ·{' '}
              <span className="font-mono">{refundTx.transaction_reference}</span>
            </h3>
            <button
              type="button"
              onClick={() => setRefundTx(null)}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Close'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                {isBn ? 'রিফান্ডের পরিমাণ (BDT)' : 'Refund Amount (BDT)'}
              </label>
              <input
                type="number"
                min="1"
                max={refundTx.amount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={String(refundTx.amount)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                {isBn ? 'রিফান্ডের কারণ' : 'Reason for Refund'}
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={isBn ? 'যেমন: ভুলবশত ডাবল পেমেন্ট...' : 'e.g. Accidental duplicate payment...'}
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={requestingRefund}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer"
          >
            {requestingRefund ? (isBn ? 'পাঠানো হচ্ছে...' : 'Submitting...') : isBn ? 'আবেদন জমা দিন' : 'Submit Refund Request'}
          </button>
        </form>
      )}

      {/* Payment Transactions & Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <CreditCard className="w-4 h-4 text-rose-700" />
            <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn">
              {isBn ? 'লেনদেনের ইতিহাস' : 'Payment Transactions'}
            </h3>
          </div>
          {transactions.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">
              {isBn ? 'এখনো কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions recorded yet.'}
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {transactions.map((tx) => {
                const gw = getGatewayMeta(tx.gateway);
                const pStatus = PAYMENT_STATUS_META[tx.status] || PAYMENT_STATUS_META.pending;
                const canRefund = tx.status === 'succeeded' && Number(tx.amount) > 0;
                return (
                  <div key={tx.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-stone-900">{tx.transaction_reference}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${pStatus.badgeClass}`}>
                        {isBn ? pStatus.labelBn : pStatus.labelEn}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>
                        {isBn ? gw.labelBn : gw.labelEn}
                        {tx.masked_payment_details ? ` · ${tx.masked_payment_details}` : ''}
                      </span>
                      <span className="font-bold text-stone-900">{formatBdt(tx.amount, isBn)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span>{formatBengaliFullDateTime(tx.paid_at || tx.created_at)}</span>
                      <div className="flex items-center gap-2">
                        {tx.invoice?.id && (
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(tx.invoice.id)}
                            className="text-rose-700 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isBn ? 'ইনভয়েস' : 'Invoice'}</span>
                          </button>
                        )}
                        {canRefund && (
                          <button
                            type="button"
                            onClick={() => {
                              setRefundTx(tx);
                              setRefundAmount(String(tx.amount));
                            }}
                            className="text-amber-700 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isBn ? 'রিফান্ড' : 'Refund'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoices & Refunds */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <FileText className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn">
                {isBn ? 'ডিজিটাল ইনভয়েস' : 'Digital Invoices'}
              </h3>
            </div>
            {invoices.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">
                {isBn ? 'কোনো ইনভয়েস নেই।' : 'No invoices yet.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-stone-200 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-stone-900">{inv.invoice_number}</p>
                      <p className="text-[11px] text-stone-500">
                        {formatBdt(inv.total_amount, isBn)} · {formatBengaliFullDateTime(inv.issued_at || inv.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-[11px] font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{isBn ? 'দেখুন / প্রিন্ট' : 'Print'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refunds */}
          {refunds.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn">
                  {isBn ? 'রিফান্ড আবেদনের অবস্থা' : 'Refund Requests'}
                </h3>
              </div>
              <div className="space-y-2">
                {refunds.map((rf) => {
                  const rMeta = REFUND_STATUS_META[rf.status] || REFUND_STATUS_META.pending;
                  return (
                    <div key={rf.id} className="p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{rf.refund_code}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${rMeta.badgeClass}`}>
                          {isBn ? rMeta.labelBn : rMeta.labelEn}
                        </span>
                      </div>
                      <p className="text-stone-700 font-semibold">{formatBdt(rf.amount, isBn)} — {rf.reason}</p>
                      {rf.admin_notes && <p className="text-[11px] text-stone-500">{rf.admin_notes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription History Timeline */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <History className="w-4 h-4 text-stone-700" />
          <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn">
            {isBn ? 'সাবস্ক্রিপশন জীবনচক্র ইতিহাস' : 'Subscription Lifecycle History'}
          </h3>
        </div>
        {historyItems.length === 0 ? (
          <p className="text-xs text-stone-500 py-3 text-center">
            {isBn ? 'এখনো কোনো ইতিহাস রেকর্ড হয়নি।' : 'No subscription history entries yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {historyItems.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <div>
                  <span className="font-bold uppercase text-rose-700 mr-2">{h.event_type}</span>
                  <span className="text-stone-700">{h.notes || `${h.from_status || '—'} → ${h.to_status || '—'}`}</span>
                </div>
                <span className="text-[11px] text-stone-500">{formatBengaliFullDateTime(h.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReaderMembershipTab;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  KeyRound,
  Webhook,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Plus,
  CreditCard,
  AlertTriangle,
  Globe,
  Terminal,
  Lock
} from 'lucide-react';
import {
  useGetSyndicationPlansQuery,
  useGetSyndicationDocsQuery,
  useGetSyndicationWorkspaceQuery,
  useRegisterDeveloperAccountMutation,
  useCreateDeveloperApplicationMutation,
  useIssueSyndicationKeyMutation,
  useRotateSyndicationKeyMutation,
  useRevokeSyndicationKeyMutation,
  useCreateSyndicationWebhookMutation,
  useRotateSyndicationWebhookSecretMutation,
  useDeleteSyndicationWebhookMutation,
  useGetSyndicationWebhookDeliveriesQuery,
  useInitiateSyndicationPlanCheckoutMutation,
  useVerifySyndicationPlanCheckoutMutation
} from '../../store/api/syndicationApi.js';
import {
  SYNDICATION_SCOPES,
  WEBHOOK_EVENTS,
  getSyndicationStatusMeta,
  formatLicenseAttribution,
  buildCurlExample,
  buildWebhookVerificationSnippet
} from '../../utils/syndicationHelpers.js';

export default function DeveloperPortalPage() {
  const { language } = useSelector((state) => state.ui);
  const authState = useSelector((state) => state.auth);
  const isBn = language === 'bn';

  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('reader_token') || localStorage.getItem('auth_token') || authState?.token);

  const [activeTab, setActiveTab] = useState('plans');
  const [oneTimeSecret, setOneTimeSecret] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [snippetLang, setSnippetLang] = useState('node');
  const [checkoutPending, setCheckoutPending] = useState(null);

  const [regForm, setRegForm] = useState({
    organization_name: '',
    website_url: '',
    contact_email: '',
    country_code: 'BD',
    intended_use_case: ''
  });
  const [appForm, setAppForm] = useState({
    name: '',
    description: '',
    environment: 'sandbox',
    allowed_ips: ''
  });
  const [keyForm, setKeyForm] = useState({
    appKey: '',
    key_name: 'Primary Integration Key',
    scopes: ['articles:read', 'taxonomy:read', 'feeds:read']
  });
  const [webhookForm, setWebhookForm] = useState({
    appKey: '',
    target_url: '',
    subscribed_events: ['article.published', 'article.updated', 'article.retracted']
  });

  const { data: plans = [] } = useGetSyndicationPlansQuery();
  const { data: docs } = useGetSyndicationDocsQuery();
  const { data: workspace, isFetching: wsLoading } = useGetSyndicationWorkspaceQuery(undefined, { skip: !hasToken });
  const { data: deliveries = [] } = useGetSyndicationWebhookDeliveriesQuery(selectedWebhookId, {
    skip: !hasToken || !selectedWebhookId
  });

  const [registerAccount, { isLoading: registering }] = useRegisterDeveloperAccountMutation();
  const [createApp, { isLoading: creatingApp }] = useCreateDeveloperApplicationMutation();
  const [issueKey, { isLoading: issuingKey }] = useIssueSyndicationKeyMutation();
  const [rotateKey] = useRotateSyndicationKeyMutation();
  const [revokeKey] = useRevokeSyndicationKeyMutation();
  const [createWebhook, { isLoading: creatingWebhook }] = useCreateSyndicationWebhookMutation();
  const [rotateWebhookSecret] = useRotateSyndicationWebhookSecretMutation();
  const [deleteWebhook] = useDeleteSyndicationWebhookMutation();
  const [initiateCheckout, { isLoading: initiatingCheckout }] = useInitiateSyndicationPlanCheckoutMutation();
  const [verifyCheckout, { isLoading: verifyingCheckout }] = useVerifySyndicationPlanCheckoutMutation();

  const account = workspace?.account || null;
  const applications = account?.applications || [];
  const quota = workspace?.quota || null;
  const usage = workspace?.usage_summary || { requests_today: 0, requests_30d: 0, error_rate_percent: 0, daily_series: [], by_endpoint: [] };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(label);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard permission errors cleanly
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await registerAccount(regForm).unwrap();
      setFeedback({ type: 'success', text: isBn ? 'ডেভেলপার পার্টনার আবেদন জমা হয়েছে।' : 'Developer partner registration submitted.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Registration failed.' });
    }
  };

  const handleCreateApp = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const allowedIps = appForm.allowed_ips
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await createApp({
        name: appForm.name,
        description: appForm.description,
        environment: appForm.environment,
        allowed_ips: allowedIps
      }).unwrap();
      setAppForm({ name: '', description: '', environment: 'sandbox', allowed_ips: '' });
      setKeyForm((prev) => ({ ...prev, appKey: res?.data?.uuid || prev.appKey }));
      setWebhookForm((prev) => ({ ...prev, appKey: res?.data?.uuid || prev.appKey }));
      setFeedback({ type: 'success', text: isBn ? 'নতুন অ্যাপ্লিকেশন তৈরি হয়েছে।' : 'Application created.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Could not create application.' });
    }
  };

  const handleIssueKey = async (e) => {
    e.preventDefault();
    const targetApp = keyForm.appKey || applications[0]?.uuid;
    if (!targetApp) return;
    setFeedback(null);
    try {
      const res = await issueKey({
        appKey: targetApp,
        key_name: keyForm.key_name,
        scopes: keyForm.scopes
      }).unwrap();
      setOneTimeSecret({
        kind: 'api_key',
        value: res?.data?.plaintext_key,
        label: res?.data?.api_key?.key_name
      });
      setFeedback({ type: 'success', text: isBn ? 'নতুন API কী তৈরি হয়েছে।' : 'API key issued.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Could not issue API key.' });
    }
  };

  const handleRotateKey = async (keyUuid) => {
    setFeedback(null);
    try {
      const res = await rotateKey({ keyId: keyUuid, grace_hours: 24 }).unwrap();
      setOneTimeSecret({
        kind: 'api_key',
        value: res?.data?.plaintext_key,
        label: res?.data?.api_key?.key_name
      });
      setFeedback({ type: 'success', text: isBn ? 'নতুন কী ইস্যু হয়েছে; পুরনো কী ২৪ ঘণ্টা সচল থাকবে।' : 'Key rotated with 24h grace window.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Key rotation failed.' });
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    const targetApp = webhookForm.appKey || applications[0]?.uuid;
    if (!targetApp) return;
    setFeedback(null);
    try {
      const res = await createWebhook({
        appKey: targetApp,
        target_url: webhookForm.target_url,
        subscribed_events: webhookForm.subscribed_events
      }).unwrap();
      setOneTimeSecret({
        kind: 'webhook_secret',
        value: res?.data?.signing_secret,
        label: webhookForm.target_url
      });
      setWebhookForm((prev) => ({ ...prev, target_url: '' }));
      setFeedback({ type: 'success', text: isBn ? 'ওয়েবহুক যুক্ত হয়েছে।' : 'Webhook registered.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Webhook creation failed.' });
    }
  };

  const handleStartCheckout = async (plan) => {
    if (!hasToken || !account || account.approval_status !== 'approved') {
      setFeedback({
        type: 'error',
        text: isBn ? 'প্ল্যান পরিবর্তন করতে অনুমোদিত ডেভেলপার অ্যাকাউন্ট প্রয়োজন।' : 'Approved developer account required to change plans.'
      });
      setActiveTab('apps');
      return;
    }
    setFeedback(null);
    try {
      const res = await initiateCheckout({
        plan_slug: plan.slug,
        gateway: 'bkash',
        wallet_number: '01711223344'
      }).unwrap();
      if (res?.data?.requires_payment) {
        setCheckoutPending({ plan, session: res.data.gateway_session });
      } else {
        setFeedback({ type: 'success', text: isBn ? 'ফ্রি সিন্ডিকেশন প্ল্যান সক্রিয় হয়েছে।' : 'Free syndication plan activated.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Checkout initiation failed.' });
    }
  };

  const handleConfirmSandboxCheckout = async () => {
    if (!checkoutPending?.session?.sandbox_callback_payload) return;
    try {
      await verifyCheckout({
        ...checkoutPending.session.sandbox_callback_payload,
        gateway_trx_id: `BKX-${Date.now().toString(36).toUpperCase()}`
      }).unwrap();
      setCheckoutPending(null);
      setFeedback({ type: 'success', text: isBn ? 'পেমেন্ট যাচাই সফল ও API প্ল্যান সক্রিয় হয়েছে।' : 'Plan payment verified and activated.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.data?.message || 'Payment verification failed.' });
    }
  };

  const toggleArrayValue = (arr, item) => (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);

  const activeGrant = (account?.license_grants || []).find((g) => g.approval_status === 'approved');
  const sampleAttribution = formatLicenseAttribution(activeGrant?.attribution_override || activeGrant?.license?.attribution_template);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600/20 text-rose-200 border border-rose-500/30">
              <Terminal className="w-3.5 h-3.5" />
              {isBn ? 'NewsFlow সিন্ডিকেশন ও ডেভেলপার API প্ল্যাটফর্ম' : 'NewsFlow Content Syndication & News API v1'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-bn tracking-tight">
              {isBn ? 'অনুমোদিত মিডিয়া পার্টনার ও ডেভেলপার পোর্টাল' : 'Licensed Journalism API & Partner Syndication Hub'}
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              {isBn
                ? 'কপিরাইট লাইসেন্স, অ্যাট্রিবিউশন এবং স্বাক্ষরিত ওয়েবহুকের মাধ্যমে NewsFlow-এর যাচাইকৃত প্রকাশিত সংবাদ, সাংবাদিক প্রোফাইল ও আঞ্চলিক ফিড ব্যবহার করুন।'
                : 'Access licensed published journalism, verified journalist profiles, Bangladesh hyperlocal feeds, and HMAC-signed webhooks with strict attribution controls.'}
            </p>
          </div>

          {account && (
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-4 min-w-[260px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-stone-300">{isBn ? 'পার্টনার অবস্থা' : 'Partner Status'}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getSyndicationStatusMeta(account.approval_status, isBn).cls}`}>
                  {getSyndicationStatusMeta(account.approval_status, isBn).label}
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate">{account.organization_name}</div>
              <div className="text-xs text-stone-300 flex items-center justify-between">
                <span>{account.plan?.name_en || 'Sandbox'}</span>
                {quota && (
                  <span className="font-mono text-emerald-300">
                    {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'plans', icon: CreditCard, labelBn: 'API প্ল্যান ও লাইসেন্স', labelEn: 'API Plans & Billing' },
          { id: 'apps', icon: KeyRound, labelBn: 'অ্যাপস ও API কী', labelEn: 'Apps & API Keys' },
          { id: 'webhooks', icon: Webhook, labelBn: 'ওয়েবহুক ও লগ', labelEn: 'Webhooks & Logs' },
          { id: 'docs', icon: BookOpen, labelBn: 'ইন্টারেক্টিভ API ডকস', labelEn: 'API v1 Docs' },
          { id: 'usage', icon: BarChart3, labelBn: 'ব্যবহার ও ইনভয়েস', labelEn: 'Usage & Invoices' }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                active ? 'bg-rose-700 text-white shadow-sm' : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* One-time plaintext credential reveal */}
      {oneTimeSecret && (
        <div className="rounded-xl bg-amber-50 border-2 border-amber-400 p-5 space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {oneTimeSecret.kind === 'api_key'
                  ? (isBn ? 'আপনার নতুন API কী (শুধুমাত্র একবার দেখানো হচ্ছে — নিরাপদে কপি করুন):' : 'One-Time API Key (copy now — never shown again):')
                  : (isBn ? 'ওয়েবহুক সাইনিং সিক্রেট (শুধুমাত্র একবার দেখানো হচ্ছে):' : 'One-Time Webhook Signing Secret (save immediately):')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOneTimeSecret(null)}
              className="text-xs text-stone-600 hover:text-stone-900 underline"
            >
              {isBn ? 'বন্ধ করুন' : 'Dismiss'}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-stone-900 text-emerald-300 px-3 py-2.5 rounded-lg font-mono text-xs overflow-x-auto">
            <span className="flex-1 select-all">{oneTimeSecret.value}</span>
            <button
              type="button"
              onClick={() => copyText(oneTimeSecret.value, 'secret')}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-white inline-flex items-center gap-1 shrink-0"
            >
              {copiedId === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'secret' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Commercial Plans & Sandbox Checkout */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isCurrent = account?.plan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl bg-white border p-5 flex flex-col justify-between shadow-sm ${
                    isCurrent ? 'border-rose-600 ring-2 ring-rose-100' : 'border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{plan.tier}</span>
                      {isCurrent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {isBn ? 'সক্রিয় প্ল্যান' : 'Active'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 font-serif-bn">
                      {isBn ? plan.name_bn : plan.name_en}
                    </h3>
                    <div className="text-2xl font-extrabold text-stone-900">
                      {Number(plan.monthly_price_bdt) === 0
                        ? (isBn ? 'ফ্রি' : 'Free')
                        : `৳${Number(plan.monthly_price_bdt).toLocaleString()}/mo`}
                    </div>
                    <ul className="text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-100">
                      <li>• {plan.requests_per_minute} req/min ({plan.monthly_request_quota?.toLocaleString()}/mo)</li>
                      <li>• {plan.max_apps} Apps, {plan.max_webhooks} Webhooks/App</li>
                      <li>• {plan.allows_full_text ? (isBn ? 'পূর্ণ আর্টিকেল টেক্সট' : 'Full Article Body') : (isBn ? 'সংক্ষিপ্ত সারসংক্ষেপ' : 'Summary + Link Only')}</li>
                      <li>• {plan.allows_commercial_use ? (isBn ? 'বাণিজ্যিক ব্যবহার অনুমোদিত' : 'Commercial Rights') : (isBn ? 'অ-বাণিজ্যিক ব্যবহার' : 'Non-Commercial')}</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={initiatingCheckout || isCurrent}
                    onClick={() => handleStartCheckout(plan)}
                    className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-stone-100 text-stone-400 cursor-default'
                        : 'bg-stone-900 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isCurrent
                      ? (isBn ? 'বর্তমান প্ল্যান' : 'Current Plan')
                      : Number(plan.monthly_price_bdt) === 0
                        ? (isBn ? 'স্যান্ডবক্স চালু করুন' : 'Select Free Sandbox')
                        : (isBn ? 'আপগ্রেড করুন (bKash)' : 'Upgrade Plan (bKash)')}
                  </button>
                </div>
              );
            })}
          </div>

          {checkoutPending && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-950 text-sm">
                  {isBn ? 'টোকেনাইজড স্যান্ডবক্স পেমেন্ট যাচাই' : 'Verify Tokenized Sandbox Plan Checkout'}
                </h4>
                <p className="text-xs text-indigo-800">
                  Plan: <strong>{checkoutPending.plan.name_en}</strong> — Ref:{' '}
                  <span className="font-mono">{checkoutPending.session?.sandbox_callback_payload?.transaction_reference}</span>
                </p>
              </div>
              <button
                type="button"
                disabled={verifyingCheckout}
                onClick={handleConfirmSandboxCheckout}
                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
              >
                {verifyingCheckout ? 'Verifying...' : (isBn ? 'পেমেন্ট সম্পন্ন ও যাচাই করুন' : 'Complete & Verify Payment')}
              </button>
            </div>
          )}

          {/* Attribution Compliance Box */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'বাধ্যতামূলক কনটেন্ট লাইসেন্স ও অ্যাট্রিবিউশন নীতি' : 'Mandatory Attribution & Licensing Compliance'}</span>
            </div>
            <p className="text-xs text-stone-600">
              {isBn
                ? 'প্রতিটি সিন্ডিকেটেড আর্টিকেল পেলোডে ক্যানোনিকাল লিংক ও নির্ধারিত অ্যাট্রিবিউশন টেক্সট স্বয়ংক্রিয়ভাবে যুক্ত থাকে।'
                : 'Every syndicated article response includes a licensing block with canonical attribution and embargo/retraction status.'}
            </p>
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs font-mono text-stone-800">
              {sampleAttribution}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Applications & API Keys */}
      {activeTab === 'apps' && (
        <div className="space-y-6">
          {!hasToken ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center space-y-4">
              <Lock className="w-10 h-10 text-rose-700 mx-auto" />
              <h2 className="text-lg font-bold text-stone-900">
                {isBn ? 'ডেভেলপার পোর্টাল ব্যবহার করতে সাইন-ইন করুন' : 'Sign in to access your Developer Workspace'}
              </h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                {isBn
                  ? 'পার্টনার নিবন্ধন, API কী তৈরি এবং ওয়েবহুক কনফিগার করতে আপনার অ্যাকাউন্ট দিয়ে লগইন করুন।'
                  : 'Sign in with your NewsFlow account to register a partner organization, manage applications, and generate API keys.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/reader/login" className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800">
                  {isBn ? 'লগইন করুন' : 'Sign In'}
                </Link>
                <Link to="/reader/register" className="px-4 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-50">
                  {isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Register'}
                </Link>
              </div>
            </div>
          ) : wsLoading ? (
            <div className="text-sm text-stone-500 py-8 text-center">Loading workspace...</div>
          ) : !account ? (
            <form onSubmit={handleRegister} className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
                {isBn ? 'ডেভেলপার ও মিডিয়া পার্টনার নিবন্ধন' : 'Register Developer / Syndication Partner'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Organization Name</label>
                  <input
                    required
                    value={regForm.organization_name}
                    onChange={(e) => setRegForm({ ...regForm, organization_name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="e.g. Dhaka Press Aggregator"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Technical Contact Email</label>
                  <input
                    required
                    type="email"
                    value={regForm.contact_email}
                    onChange={(e) => setRegForm({ ...regForm, contact_email: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="api-team@partner.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={regForm.website_url}
                    onChange={(e) => setRegForm({ ...regForm, website_url: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="https://partner.example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Country (ISO-2)</label>
                  <input
                    maxLength={2}
                    value={regForm.country_code}
                    onChange={(e) => setRegForm({ ...regForm, country_code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Intended Content Usage & Attribution Plan</label>
                <textarea
                  required
                  rows={3}
                  value={regForm.intended_use_case}
                  onChange={(e) => setRegForm({ ...regForm, intended_use_case: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Describe how your app or publication will display NewsFlow stories and attribution links."
                />
              </div>
              <button
                type="submit"
                disabled={registering}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
              >
                {registering ? 'Submitting...' : (isBn ? 'আবেদন জমা দিন' : 'Submit Partner Application')}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Application & Issue Key Forms */}
              <div className="space-y-6">
                <form onSubmit={handleCreateApp} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-rose-700" />
                    <span>{isBn ? 'নতুন অ্যাপ্লিকেশন তৈরি' : 'Create Application'}</span>
                  </h3>
                  <input
                    required
                    value={appForm.name}
                    onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    placeholder="App Name (e.g. Mobile Feed Reader)"
                  />
                  <select
                    value={appForm.environment}
                    onChange={(e) => setAppForm({ ...appForm, environment: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  >
                    <option value="sandbox">Sandbox (nf_test_)</option>
                    <option value="production">Production (nf_live_)</option>
                  </select>
                  <input
                    value={appForm.allowed_ips}
                    onChange={(e) => setAppForm({ ...appForm, allowed_ips: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    placeholder="Optional IP allowlist (comma-separated)"
                  />
                  <button
                    type="submit"
                    disabled={creatingApp || account.approval_status !== 'approved'}
                    className="w-full py-2 rounded-xl bg-stone-900 hover:bg-rose-700 disabled:bg-stone-300 text-white text-xs font-bold"
                  >
                    {creatingApp ? 'Creating...' : (isBn ? 'অ্যাপ তৈরি করুন' : 'Create Application')}
                  </button>
                </form>

                {applications.length > 0 && (
                  <form onSubmit={handleIssueKey} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-rose-700" />
                      <span>{isBn ? 'নতুন স্কোপড API কী ইস্যু' : 'Generate Scoped API Key'}</span>
                    </h3>
                    <select
                      value={keyForm.appKey || applications[0]?.uuid || ''}
                      onChange={(e) => setKeyForm({ ...keyForm, appKey: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    >
                      {applications.map((app) => (
                        <option key={app.uuid} value={app.uuid}>
                          {app.name} ({app.environment})
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      value={keyForm.key_name}
                      onChange={(e) => setKeyForm({ ...keyForm, key_name: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      placeholder="Key Name"
                    />
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-stone-600">Scopes</div>
                      <div className="grid grid-cols-1 gap-1">
                        {SYNDICATION_SCOPES.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={keyForm.scopes.includes(s.id)}
                              onChange={() => setKeyForm({ ...keyForm, scopes: toggleArrayValue(keyForm.scopes, s.id) })}
                            />
                            <span className="font-mono text-[11px]">{s.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={issuingKey}
                      className="w-full py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                    >
                      {issuingKey ? 'Generating...' : (isBn ? 'API কী তৈরি করুন' : 'Generate Key')}
                    </button>
                  </form>
                )}
              </div>

              {/* Applications & Issued Keys List */}
              <div className="lg:col-span-2 space-y-4">
                {applications.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-stone-200 p-6 text-xs text-stone-500">
                    {account.approval_status !== 'approved'
                      ? (isBn ? 'আপনার পার্টনার অ্যাকাউন্ট অনুমোদিত হওয়ার পর অ্যাপ্লিকেশন ও API কী তৈরি করতে পারবেন।' : 'Wait for editorial/partner approval before creating applications and keys.')
                      : (isBn ? 'এখনও কোনো অ্যাপ্লিকেশন তৈরি হয়নি।' : 'No applications created yet.')}
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.uuid} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900">{app.name}</h4>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                              {app.environment}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono">{app.uuid}</div>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getSyndicationStatusMeta(app.status, isBn).cls}`}>
                          {getSyndicationStatusMeta(app.status, isBn).label}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-stone-700">{isBn ? 'ইস্যুকৃত API কীসমূহ' : 'API Keys'}</div>
                        {(app.api_keys || []).length === 0 ? (
                          <p className="text-xs text-stone-500">No API keys issued for this application.</p>
                        ) : (
                          (app.api_keys || []).map((k) => (
                            <div key={k.uuid} className="rounded-xl bg-stone-50 border border-stone-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-stone-900">{k.key_name}</span>
                                  <span className="font-mono text-[11px] text-stone-600">{k.key_prefix}••••••••</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSyndicationStatusMeta(k.status, isBn).cls}`}>
                                    {getSyndicationStatusMeta(k.status, isBn).label}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(k.scopes || []).map((sc) => (
                                    <span key={sc} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                                      {sc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {k.status !== 'revoked' && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleRotateKey(k.uuid)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-[11px] font-semibold text-stone-800"
                                  >
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>Rotate</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => revokeKey(k.uuid)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold text-rose-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Revoke</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Webhooks & Delivery Logs */}
      {activeTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <form onSubmit={handleCreateWebhook} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'ওয়েবহুক এন্ডপয়েন্ট যুক্ত করুন' : 'Register Webhook Endpoint'}</span>
              </h3>
              {applications.length > 0 && (
                <select
                  value={webhookForm.appKey || applications[0]?.uuid || ''}
                  onChange={(e) => setWebhookForm({ ...webhookForm, appKey: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                >
                  {applications.map((app) => (
                    <option key={app.uuid} value={app.uuid}>
                      {app.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                required
                type="url"
                value={webhookForm.target_url}
                onChange={(e) => setWebhookForm({ ...webhookForm, target_url: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                placeholder="https://partner.example.com/webhooks/newsflow"
              />
              <div className="space-y-1">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookForm.subscribed_events.includes(ev.id)}
                      onChange={() =>
                        setWebhookForm({
                          ...webhookForm,
                          subscribed_events: toggleArrayValue(webhookForm.subscribed_events, ev.id)
                        })
                      }
                    />
                    <span className="font-mono text-[11px]">{ev.id}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={creatingWebhook || applications.length === 0}
                className="w-full py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:bg-stone-300 text-white text-xs font-bold"
              >
                {creatingWebhook ? 'Saving...' : (isBn ? 'ওয়েবহুক সংরক্ষণ করুন' : 'Save Webhook')}
              </button>
            </form>

            <div className="rounded-2xl bg-stone-900 text-stone-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">HMAC-SHA256 Verification</span>
                <div className="flex gap-1">
                  {['node', 'php'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSnippetLang(l)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        snippetLang === l ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {buildWebhookVerificationSnippet(snippetLang)}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {applications.flatMap((app) => app.webhooks || []).length === 0 ? (
              <div className="rounded-2xl bg-white border border-stone-200 p-6 text-xs text-stone-500">
                {isBn ? 'কোনো সক্রিয় ওয়েবহুক নেই।' : 'No webhooks configured yet.'}
              </div>
            ) : (
              applications.flatMap((app) => app.webhooks || []).map((wh) => (
                <div key={wh.uuid} className="rounded-2xl bg-white border border-stone-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono text-stone-900 break-all">
                        <Globe className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>{wh.target_url}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(wh.subscribed_events || []).map((e) => (
                          <span key={e} className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWebhookId(wh.uuid)}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-[11px] font-semibold hover:bg-stone-50"
                      >
                        Deliveries
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await rotateWebhookSecret(wh.uuid).unwrap();
                          setOneTimeSecret({ kind: 'webhook_secret', value: res?.data?.signing_secret, label: wh.target_url });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-[11px] font-semibold hover:bg-stone-50"
                      >
                        Rotate Secret
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWebhook(wh.uuid)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {selectedWebhookId && (
              <div className="rounded-2xl bg-white border border-stone-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-900">Recent Webhook Delivery Attempts</h4>
                {deliveries.length === 0 ? (
                  <p className="text-xs text-stone-500">No deliveries logged for this webhook yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {deliveries.map((d) => (
                      <div key={d.id} className="text-xs border border-stone-100 rounded-lg p-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-stone-800">{d.event_type}</span>
                          <span className="text-stone-500 ml-2">{d.article_public_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-600">HTTP {d.http_status || 'ERR'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSyndicationStatusMeta(d.status, isBn).cls}`}>
                            {getSyndicationStatusMeta(d.status, isBn).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Interactive OpenAPI v1 Documentation */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-stone-900">{docs?.info?.title || 'NewsFlow Syndication API v1'}</h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-stone-900 text-emerald-300">
                Base URL: {docs?.base_url || '/api/syndication/v1'}
              </span>
            </div>
            <p className="text-xs text-stone-600">{docs?.info?.description}</p>

            <div className="space-y-2">
              {(docs?.endpoints || []).map((ep) => (
                <div key={ep.path} className="rounded-xl border border-stone-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">{ep.method}</span>
                      <code className="text-xs font-mono font-bold text-stone-900">{ep.path}</code>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                        {ep.scope}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{ep.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(buildCurlExample(ep.path), ep.path)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold hover:bg-stone-100 shrink-0"
                  >
                    {copiedId === ep.path ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy cURL</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Usage Dashboard & Billing Invoices */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200 p-5">
              <div className="text-xs text-stone-500">{isBn ? 'আজকের রিকোয়েস্ট' : 'Requests Today'}</div>
              <div className="text-2xl font-extrabold text-stone-900 mt-1">{usage.requests_today.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200 p-5">
              <div className="text-xs text-stone-500">{isBn ? '৩০ দিনের রিকোয়েস্ট' : '30-Day Requests'}</div>
              <div className="text-2xl font-extrabold text-stone-900 mt-1">{usage.requests_30d.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200 p-5">
              <div className="text-xs text-stone-500">{isBn ? 'ত্রুটি হার (Error Rate)' : 'Error Rate'}</div>
              <div className="text-2xl font-extrabold text-stone-900 mt-1">{usage.error_rate_percent}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-stone-900">{isBn ? 'এন্ডপয়েন্ট অনুযায়ী ব্যবহার' : 'Usage by Endpoint'}</h3>
              {(usage.by_endpoint || []).length === 0 ? (
                <p className="text-xs text-stone-500">No API requests recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {usage.by_endpoint.map((row) => (
                    <div key={row.endpoint_name} className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                      <span className="font-mono text-stone-800">{row.endpoint_name}</span>
                      <span className="text-stone-600">{row.total} reqs ({row.avg_ms} ms avg)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-stone-900">{isBn ? 'কমার্শিয়াল API ইনভয়েস' : 'API Billing Invoices'}</h3>
              {(workspace?.invoices || []).length === 0 ? (
                <p className="text-xs text-stone-500">No paid syndication invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {workspace.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                      <div>
                        <div className="font-mono font-bold text-stone-900">{inv.invoice_number}</div>
                        <div className="text-[11px] text-stone-500">{inv.status}</div>
                      </div>
                      <div className="font-bold text-stone-900">৳{Number(inv.total_amount).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


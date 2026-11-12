import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetAdminMonetizationOverviewQuery,
  useGetAdminSubscriptionPlansQuery,
  useUpdateAdminSubscriptionPlanMutation,
  useGetAdminSubscriptionsQuery,
  useAdminRenewSubscriptionMutation,
  useAdminCancelSubscriptionMutation,
  useGetAdminTransactionsQuery,
  useGetAdminInvoicesQuery,
  useGetAdminRefundsQuery,
  useProcessAdminRefundMutation,
  useGetAdminAdvertisersQuery,
  useCreateAdminAdvertiserMutation,
  useApproveAdminAdvertiserMutation,
  useGetAdminAdPlacementsQuery,
  useUpdateAdminAdPlacementMutation,
  useGetAdminCampaignsQuery,
  useCreateAdminCampaignMutation,
  useUpdateAdminCampaignMutation,
  useGetAdminCampaignReportQuery,
  useGetAdminSponsoredContentsQuery,
  useCreateAdminSponsoredContentMutation,
  useReviewSponsoredAdvertiserMutation,
  useReviewSponsoredEditorialMutation
} from '../../store/api/monetizationApi.js';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import {
  AD_PLACEMENT_LABELS,
  APPROVAL_STATUS_META,
  CAMPAIGN_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  SUBSCRIPTION_STATUS_META,
  formatBdt,
  formatCtr,
  getGatewayMeta,
  openAuthorizedInvoiceHtml
} from '../../utils/monetizationHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Wallet,
  Crown,
  CreditCard,
  Building2,
  Megaphone,
  BarChart3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Plus,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const ADMIN_TABS = [
  { id: 'overview', label: 'সারসংক্ষেপ', icon: Wallet },
  { id: 'subscriptions', label: 'সাবস্ক্রিপশন ও প্ল্যান', icon: Crown },
  { id: 'payments', label: 'পেমেন্ট, ইনভয়েস ও রিফান্ড', icon: CreditCard },
  { id: 'advertisers', label: 'বিজ্ঞাপনদাতা', icon: Building2 },
  { id: 'campaigns', label: 'ক্যাম্পেইন ও রিপোর্ট', icon: BarChart3 },
  { id: 'sponsored', label: 'স্পনসরড কনটেন্ট', icon: Megaphone }
];

export function AdminMonetizationPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canManageSubs = hasEffectivePermission(authState, adminState, 'subscriptions.manage');
  const canViewPayments = hasEffectivePermission(authState, adminState, 'payments.view');
  const canProcessRefunds = hasEffectivePermission(authState, adminState, 'payments.refund');
  const canManageAdvertisers = hasEffectivePermission(authState, adminState, 'advertisers.manage');
  const canManageCampaigns = hasEffectivePermission(authState, adminState, ['campaigns.manage', 'ads.manage']);
  const canManageSponsored = hasEffectivePermission(authState, adminState, 'sponsored.manage');
  const canApproveSponsored = hasEffectivePermission(authState, adminState, 'sponsored.approve');

  const [activeTab, setActiveTab] = useState('overview');
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [txGatewayFilter, setTxGatewayFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [reportRange, setReportRange] = useState({ date_from: '', date_to: '' });

  // Advertiser Form
  const [advForm, setAdvForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    tax_bin: '',
    approval_status: 'approved',
    status: 'active'
  });

  // Campaign Form
  const [campForm, setCampForm] = useState({
    advertiser_id: '',
    name: '',
    campaign_type: 'display',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
    total_budget: '50000',
    pricing_model: 'cpm',
    rate_amount: '150',
    target_placements: ['homepage_top']
  });

  // Sponsored Link Form
  const [sponForm, setSponForm] = useState({
    news_id: '',
    advertiser_id: '',
    campaign_id: '',
    label: 'স্পনসরড কনটেন্ট',
    disclosure_text: 'এই প্রতিবেদনটি বিজ্ঞাপনদাতার সহযোগিতায় প্রকাশিত এবং প্রযোজ্য নীতিমালা অনুযায়ী চিহ্নিত।',
    cta_label: 'বিস্তারিত দেখুন',
    cta_url: '',
    budget: '15000'
  });

  // Queries (conditionally skipped according to active tab / permissions)
  const { data: overview, refetch: refetchOverview } = useGetAdminMonetizationOverviewQuery();
  const { data: plans = [] } = useGetAdminSubscriptionPlansQuery(undefined, { skip: !canManageSubs });
  const { data: subsRes, refetch: refetchSubs } = useGetAdminSubscriptionsQuery(
    { search: subSearch || undefined, status: subStatusFilter !== 'all' ? subStatusFilter : undefined },
    { skip: !canManageSubs || activeTab !== 'subscriptions' }
  );
  const { data: txRes } = useGetAdminTransactionsQuery(
    {
      gateway: txGatewayFilter !== 'all' ? txGatewayFilter : undefined,
      status: txStatusFilter !== 'all' ? txStatusFilter : undefined
    },
    { skip: !canViewPayments || activeTab !== 'payments' }
  );
  const { data: invRes } = useGetAdminInvoicesQuery({}, { skip: !canViewPayments || activeTab !== 'payments' });
  const { data: refundsRes, refetch: refetchRefunds } = useGetAdminRefundsQuery(
    {},
    { skip: (!canViewPayments && !canProcessRefunds) || activeTab !== 'payments' }
  );
  const { data: advertisersRes, refetch: refetchAdvertisers } = useGetAdminAdvertisersQuery(
    { per_page: 50 },
    { skip: !canManageAdvertisers && !canManageCampaigns && !canManageSponsored }
  );
  const { data: placements = [], refetch: refetchPlacements } = useGetAdminAdPlacementsQuery(undefined, {
    skip: !canManageCampaigns || activeTab !== 'campaigns'
  });
  const { data: campaignsRes, refetch: refetchCampaigns } = useGetAdminCampaignsQuery(
    { per_page: 50 },
    { skip: !canManageCampaigns && !canManageSponsored }
  );
  const { data: reportData } = useGetAdminCampaignReportQuery(
    {
      ...(reportRange.date_from ? { date_from: reportRange.date_from } : {}),
      ...(reportRange.date_to ? { date_to: reportRange.date_to } : {})
    },
    { skip: !canManageCampaigns || activeTab !== 'campaigns' }
  );
  const { data: sponsoredRes, refetch: refetchSponsored } = useGetAdminSponsoredContentsQuery(
    {},
    { skip: (!canManageSponsored && !canApproveSponsored) || activeTab !== 'sponsored' }
  );
  const { data: adminNewsRes } = useGetAdminNewsListQuery(
    { per_page: 50 },
    { skip: !canManageSponsored || activeTab !== 'sponsored' }
  );

  // Mutations
  const [updatePlan] = useUpdateAdminSubscriptionPlanMutation();
  const [adminRenewSub] = useAdminRenewSubscriptionMutation();
  const [adminCancelSub] = useAdminCancelSubscriptionMutation();
  const [processRefund] = useProcessAdminRefundMutation();
  const [createAdvertiser, { isLoading: savingAdv }] = useCreateAdminAdvertiserMutation();
  const [approveAdvertiser] = useApproveAdminAdvertiserMutation();
  const [updatePlacement] = useUpdateAdminAdPlacementMutation();
  const [createCampaign, { isLoading: savingCamp }] = useCreateAdminCampaignMutation();
  const [updateCampaign] = useUpdateAdminCampaignMutation();
  const [createSponsored, { isLoading: savingSpon }] = useCreateAdminSponsoredContentMutation();
  const [reviewSponAdvertiser] = useReviewSponsoredAdvertiserMutation();
  const [reviewSponEditorial] = useReviewSponsoredEditorialMutation();

  const subscriptions = subsRes?.items || [];
  const transactions = txRes?.items || [];
  const invoices = invRes?.items || [];
  const refunds = refundsRes?.items || [];
  const advertisers = advertisersRes?.items || [];
  const campaigns = campaignsRes?.items || [];
  const sponsoredItems = sponsoredRes?.items || [];
  const newsArticles = adminNewsRes?.items || [];

  const handleTogglePlanActive = async (plan) => {
    try {
      await updatePlan({ id: plan.id, is_active: !plan.is_active }).unwrap();
      sweetAlert.success('প্ল্যান হালনাগাদ হয়েছে');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || 'প্ল্যান পরিবর্তন করা যায়নি।');
    }
  };

  const handleAdminRenew = async (sub) => {
    try {
      await adminRenewSub({ id: sub.id, notes: 'Admin manual renewal' }).unwrap();
      refetchSubs();
      refetchOverview();
      sweetAlert.success('সাবস্ক্রিপশন নবায়ন সম্পন্ন!');
    } catch (err) {
      sweetAlert.error('নবায়ন ব্যর্থ হয়েছে', err?.data?.message || '');
    }
  };

  const handleAdminCancel = async (sub) => {
    const { isConfirmed } = await sweetAlert.confirm({
      title: 'সাবস্ক্রিপশন বাতিল করবেন?',
      text: `${sub.subscription_code} মেয়াদ শেষে বাতিল হবে।`
    });
    if (!isConfirmed) return;
    try {
      await adminCancelSub({ id: sub.id, immediate: false, reason: 'Cancelled by administrator' }).unwrap();
      refetchSubs();
      sweetAlert.success('সাবস্ক্রিপশন বাতিলকৃত হিসেবে চিহ্নিত হয়েছে');
    } catch (err) {
      sweetAlert.error('বাতিল ব্যর্থ হয়েছে', err?.data?.message || '');
    }
  };

  const handleRefundDecision = async (refund, decision) => {
    try {
      await processRefund({
        id: refund.id,
        decision,
        admin_notes: decision === 'approve' ? 'Approved and refunded from CMS desk' : 'Refund request declined'
      }).unwrap();
      refetchRefunds();
      refetchOverview();
      sweetAlert.success(decision === 'approve' ? 'রিফান্ড অনুমোদিত ও সম্পন্ন' : 'রিফান্ড প্রত্যাখ্যাত');
    } catch (err) {
      sweetAlert.error('রিফান্ড প্রক্রিয়া ব্যর্থ', err?.data?.message || '');
    }
  };

  const handleCreateAdvertiser = async (e) => {
    e.preventDefault();
    try {
      await createAdvertiser(advForm).unwrap();
      setAdvForm({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        industry: '',
        tax_bin: '',
        approval_status: 'approved',
        status: 'active'
      });
      refetchAdvertisers();
      refetchOverview();
      sweetAlert.success('নতুন বিজ্ঞাপনদাতা যুক্ত হয়েছে!');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || 'বিজ্ঞাপনদাতা যোগ করা যায়নি।');
    }
  };

  const handleAdvertiserDecision = async (adv, decision) => {
    try {
      await approveAdvertiser({ id: adv.id, decision }).unwrap();
      refetchAdvertisers();
      refetchOverview();
      sweetAlert.success(`বিজ্ঞাপনদাতা ${decision === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`);
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || '');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await createCampaign({
        ...campForm,
        advertiser_id: campForm.advertiser_id ? Number(campForm.advertiser_id) : undefined,
        total_budget: Number(campForm.total_budget || 0),
        rate_amount: Number(campForm.rate_amount || 0)
      }).unwrap();
      refetchCampaigns();
      refetchOverview();
      sweetAlert.success('ক্যাম্পেইন সফলভাবে তৈরি হয়েছে!');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || 'ক্যাম্পেইন তৈরি করা যায়নি।');
    }
  };

  const handleToggleCampaignStatus = async (camp) => {
    const nextStatus = camp.status === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign({ id: camp.id, status: nextStatus }).unwrap();
      refetchCampaigns();
      sweetAlert.success('ক্যাম্পেইন অবস্থা পরিবর্তিত হয়েছে');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || '');
    }
  };

  const handleTogglePlacement = async (pl) => {
    try {
      await updatePlacement({ id: pl.id, is_active: !pl.is_active }).unwrap();
      refetchPlacements();
      sweetAlert.success('প্লেসমেন্ট স্লট হালনাগাদ হয়েছে');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || '');
    }
  };

  const handleCreateSponsored = async (e) => {
    e.preventDefault();
    if (!sponForm.news_id || !sponForm.advertiser_id) {
      sweetAlert.warning('তথ্য অসম্পূর্ণ', 'সংবাদ ও বিজ্ঞাপনদাতা উভয়ই নির্বাচন করুন।');
      return;
    }
    try {
      await createSponsored({
        news_id: Number(sponForm.news_id),
        advertiser_id: Number(sponForm.advertiser_id),
        campaign_id: sponForm.campaign_id ? Number(sponForm.campaign_id) : undefined,
        label: sponForm.label.trim() || 'স্পনসরড কনটেন্ট',
        disclosure_text: sponForm.disclosure_text.trim(),
        cta_label: sponForm.cta_label.trim() || undefined,
        cta_url: sponForm.cta_url.trim() || undefined,
        budget: Number(sponForm.budget || 0)
      }).unwrap();
      refetchSponsored();
      refetchOverview();
      sweetAlert.success('স্পনসরড কনটেন্ট সফলভাবে যুক্ত হয়েছে!');
    } catch (err) {
      sweetAlert.error('ত্রুটি', err?.data?.message || 'স্পনসরড কনটেন্ট যুক্ত করা যায়নি।');
    }
  };

  const handleOpenInvoice = async (invoiceId) => {
    try {
      await openAuthorizedInvoiceHtml(invoiceId, true);
    } catch {
      sweetAlert.error('ইনভয়েস খোলা যায়নি');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            নিউজফ্লো মনিটাইজেশন, সাবস্ক্রিপশন ও বিজ্ঞাপন কেন্দ্র
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            বাংলাদেশি পেমেন্ট (বিকাশ, নগদ ও হোস্টেড কার্ড), প্রিমিয়াম মেম্বারশিপ, ক্যাম্পেইন রিপোর্ট ও স্পনসরড কনটেন্ট অনুমোদন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/subscribe"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>পাবলিক মেম্বারশিপ পাতা</span>
          </Link>
          <Link
            to="/admin/ads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>ব্যানার স্লট ম্যানেজার</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white border border-stone-200 rounded-xl p-2">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active ? 'bg-rose-700 text-white shadow-2xs' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-stone-500 uppercase">সক্রিয় প্রিমিয়াম মেম্বার</p>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                {toBengaliNumber(overview?.active_premium_subscribers || 0)}
              </h3>
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                মোট নিবন্ধিত গ্রাহক: {toBengaliNumber(overview?.total_subscribed_users || 0)}
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-stone-500 uppercase">নিট সাবস্ক্রিপশন আয়</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {formatBdt(overview?.net_subscription_revenue_bdt || 0, true)}
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                মোট রিফান্ড: {formatBdt(overview?.refunded_total_bdt || 0, true)}
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-stone-500 uppercase">মোট ইম্প্রেশন ও CTR</p>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                {toBengaliNumber(overview?.total_ad_impressions || 0)}
              </h3>
              <p className="text-[11px] text-rose-700 font-semibold mt-1">
                ক্লিক: {toBengaliNumber(overview?.total_ad_clicks || 0)} · গড় CTR: {overview?.overall_ctr ?? 0}%
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-stone-500 uppercase">অপেক্ষমাণ রিভিউ</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1">
                {toBengaliNumber((overview?.pending_refunds_count || 0) + (overview?.pending_sponsored_approvals || 0))}
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                রিফান্ড: {toBengaliNumber(overview?.pending_refunds_count || 0)} · স্পনসরড:{' '}
                {toBengaliNumber(overview?.pending_sponsored_approvals || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gateway Breakdown */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
                বাংলাদেশ পেমেন্ট গেটওয়ে অনুযায়ী আয়
              </h3>
              {(overview?.gateway_breakdown || []).length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">এখনো কোনো সফল পেমেন্ট রেকর্ড নেই।</p>
              ) : (
                <div className="space-y-2.5">
                  {overview.gateway_breakdown.map((gwRow) => {
                    const meta = getGatewayMeta(gwRow.gateway);
                    return (
                      <div
                        key={gwRow.gateway}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-200 text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-stone-900">{meta.labelBn}</p>
                          <p className="text-[11px] text-stone-500">
                            সফল লেনদেন: {toBengaliNumber(gwRow.transactions)}টি
                          </p>
                        </div>
                        <span className="text-sm font-black text-emerald-700">
                          {formatBdt(gwRow.amount_bdt, true)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Security & Compliance Summary */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn">
                  নিরাপত্তা ও পেমেন্ট কমপ্লায়েন্স অবস্থা
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-stone-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>কাঁচা কার্ড নম্বর / CVV / PIN হার্ড-ব্লকড (HTTP 422) এবং কখনো ডাটাবেজে সংরক্ষিত হয় না।</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>বিকাশ, নগদ ও কার্ড কলব্যাক HMAC-SHA256 সিগনেচার ও নির্ভুল BDT পরিমাণ দ্বারা ব্যাকএন্ডে যাচাইকৃত।</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>স্পনসরড কনটেন্টে স্বয়ংক্রিয় বিজ্ঞাপনদাতা ও সম্পাদকীয় দ্বৈত অনুমোদন ব্যবস্থা সক্রিয়।</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS & PLANS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {!canManageSubs ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              সাবস্ক্রিপশন পরিচালনার জন্য আপনার `subscriptions.manage` অনুমতি প্রয়োজন।
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-rose-700 font-bold">{plan.slug}</span>
                      <button
                        type="button"
                        onClick={() => handleTogglePlanActive(plan)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {plan.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </div>
                    <h4 className="text-base font-extrabold text-stone-900 font-serif-bn">{plan.name_bn}</h4>
                    <p className="text-sm font-black text-stone-800">{formatBdt(plan.price_bdt, true)}</p>
                    <p className="text-[11px] text-stone-500">
                      ই-পেপার: {plan.epaper_access ? 'হ্যাঁ' : 'না'} · বিজ্ঞাপন-মুক্ত:{' '}
                      {plan.ad_free_reading ? 'হ্যাঁ' : 'না'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">পাঠক সাবস্ক্রিপশন তালিকা</h3>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="search"
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      placeholder="কোড, নাম বা ইমেইল খুঁজুন..."
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-300"
                    />
                    <select
                      value={subStatusFilter}
                      onChange={(e) => setSubStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="all">সব অবস্থা</option>
                      <option value="active">সক্রিয়</option>
                      <option value="pending_payment">অপেক্ষমাণ</option>
                      <option value="cancelled">বাতিল</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 uppercase text-[11px]">
                      <tr>
                        <th className="p-2.5">কোড</th>
                        <th className="p-2.5">পাঠক</th>
                        <th className="p-2.5">প্ল্যান</th>
                        <th className="p-2.5">অবস্থা</th>
                        <th className="p-2.5">মেয়াদ</th>
                        <th className="p-2.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {subscriptions.map((sub) => {
                        const sMeta = SUBSCRIPTION_STATUS_META[sub.status] || SUBSCRIPTION_STATUS_META.active;
                        return (
                          <tr key={sub.id} className="hover:bg-stone-50/70">
                            <td className="p-2.5 font-mono font-bold">{sub.subscription_code}</td>
                            <td className="p-2.5">
                              <p className="font-bold text-stone-900">{sub.user?.name}</p>
                              <p className="text-[11px] text-stone-500">{sub.user?.email}</p>
                            </td>
                            <td className="p-2.5 font-semibold">{sub.plan?.name_bn || sub.tier}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${sMeta.badgeClass}`}>
                                {sMeta.labelBn}
                              </span>
                            </td>
                            <td className="p-2.5 text-[11px] text-stone-600">
                              {sub.ends_at ? formatBengaliFullDateTime(sub.ends_at) : 'আজীবন ফ্রি'}
                            </td>
                            <td className="p-2.5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdminRenew(sub)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>নবায়ন</span>
                              </button>
                              {sub.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminCancel(sub)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>বাতিল</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS, INVOICES & REFUNDS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {!canViewPayments && !canProcessRefunds ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              পেমেন্ট ও রিফান্ড দেখার জন্য আপনার `payments.view` অনুমতি প্রয়োজন।
            </div>
          ) : (
            <>
              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">সকল পেমেন্ট লেনদেন</h3>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={txGatewayFilter}
                      onChange={(e) => setTxGatewayFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="all">সব গেটওয়ে</option>
                      <option value="bkash">বিকাশ (bKash)</option>
                      <option value="nagad">নগদ (Nagad)</option>
                      <option value="card">কার্ড (Hosted)</option>
                    </select>
                    <select
                      value={txStatusFilter}
                      onChange={(e) => setTxStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="all">সব অবস্থা</option>
                      <option value="succeeded">সফল</option>
                      <option value="initiated">শুরু হয়েছে</option>
                      <option value="refunded">রিফান্ড</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 uppercase text-[11px]">
                      <tr>
                        <th className="p-2.5">রেফারেন্স</th>
                        <th className="p-2.5">পাঠক</th>
                        <th className="p-2.5">গেটওয়ে</th>
                        <th className="p-2.5">পরিমাণ</th>
                        <th className="p-2.5">অবস্থা</th>
                        <th className="p-2.5 text-right">ইনভয়েস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {transactions.map((tx) => {
                        const pMeta = PAYMENT_STATUS_META[tx.status] || PAYMENT_STATUS_META.pending;
                        return (
                          <tr key={tx.id}>
                            <td className="p-2.5 font-mono font-bold">{tx.transaction_reference}</td>
                            <td className="p-2.5">{tx.user?.name || tx.user?.email}</td>
                            <td className="p-2.5">
                              <span className="font-bold">{getGatewayMeta(tx.gateway).labelBn}</span>
                              {tx.masked_payment_details && (
                                <p className="text-[10px] font-mono text-stone-500">{tx.masked_payment_details}</p>
                              )}
                            </td>
                            <td className="p-2.5 font-bold">{formatBdt(tx.amount, true)}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${pMeta.badgeClass}`}>
                                {pMeta.labelBn}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {tx.invoice?.id && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoice(tx.invoice.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{tx.invoice.invoice_number}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refund Requests Queue */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">
                  রিফান্ড আবেদন ({toBengaliNumber(refunds.length)})
                </h3>
                {refunds.length === 0 ? (
                  <p className="text-xs text-stone-500 py-3">কোনো রিফান্ড আবেদন নেই।</p>
                ) : (
                  <div className="space-y-2.5">
                    {refunds.map((rf) => {
                      const rMeta = REFUND_STATUS_META[rf.status] || REFUND_STATUS_META.pending;
                      return (
                        <div
                          key={rf.id}
                          className="p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{rf.refund_code}</span>
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${rMeta.badgeClass}`}>
                                {rMeta.labelBn}
                              </span>
                            </div>
                            <p className="font-semibold text-stone-800">
                              {rf.user?.name} · {formatBdt(rf.amount, true)}
                            </p>
                            <p className="text-stone-600">{rf.reason}</p>
                          </div>

                          {canProcessRefunds && rf.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRefundDecision(rf, 'approve')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                              >
                                অনুমোদন ও রিফান্ড
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefundDecision(rf, 'reject')}
                                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                              >
                                প্রত্যাখ্যান
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Invoices archive count */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h3 className="text-sm font-extrabold text-stone-900 font-serif-bn mb-2">
                  সাম্প্রতিক ইনভয়েসসমূহ ({toBengaliNumber(invoices.length)})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {invoices.map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => handleOpenInvoice(inv.id)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-mono cursor-pointer"
                    >
                      {inv.invoice_number} ({formatBdt(inv.total_amount, true)})
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: ADVERTISERS */}
      {activeTab === 'advertisers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateAdvertiser} className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              নতুন বিজ্ঞাপনদাতা নিবন্ধন
            </h3>
            <input
              type="text"
              required
              placeholder="প্রতিষ্ঠানের নাম (যেমন: গ্রামীণফোন)"
              value={advForm.company_name}
              onChange={(e) => setAdvForm((s) => ({ ...s, company_name: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="যোগাযোগকারীর নাম"
                value={advForm.contact_name}
                onChange={(e) => setAdvForm((s) => ({ ...s, contact_name: e.target.value }))}
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
              <input
                type="email"
                required
                placeholder="ইমেইল"
                value={advForm.contact_email}
                onChange={(e) => setAdvForm((s) => ({ ...s, contact_email: e.target.value }))}
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="ফোন নম্বর"
                value={advForm.contact_phone}
                onChange={(e) => setAdvForm((s) => ({ ...s, contact_phone: e.target.value }))}
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
              <input
                type="text"
                placeholder="শিল্প খাত / BIN"
                value={advForm.industry}
                onChange={(e) => setAdvForm((s) => ({ ...s, industry: e.target.value }))}
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingAdv || !canManageAdvertisers}
              className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>বিজ্ঞাপনদাতা যোগ করুন</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              নিবন্ধিত বিজ্ঞাপনদাতা তালিকা ({toBengaliNumber(advertisers.length)})
            </h3>
            <div className="space-y-2.5">
              {advertisers.map((adv) => {
                const aMeta = APPROVAL_STATUS_META[adv.approval_status] || APPROVAL_STATUS_META.pending;
                return (
                  <div key={adv.id} className="p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-stone-900 text-sm">{adv.company_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${aMeta.badgeClass}`}>
                          {aMeta.labelBn}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5">
                        {adv.contact_name} · {adv.contact_email} {adv.contact_phone ? `· ${adv.contact_phone}` : ''}
                      </p>
                    </div>
                    {canManageAdvertisers && (
                      <div className="flex items-center gap-1.5">
                        {adv.approval_status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleAdvertiserDecision(adv, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            অনুমোদন
                          </button>
                        )}
                        {adv.approval_status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleAdvertiserDecision(adv, 'rejected')}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 font-bold cursor-pointer"
                          >
                            স্থগিত
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAMPAIGNS, PLACEMENTS & PERFORMANCE REPORTS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleCreateCampaign} className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
                নতুন বিজ্ঞাপন ক্যাম্পেইন ও শিডিউল
              </h3>
              <select
                value={campForm.advertiser_id}
                onChange={(e) => setCampForm((s) => ({ ...s, advertiser_id: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
              >
                <option value="">বিজ্ঞাপনদাতা নির্বাচন করুন (ঐচ্ছিক)</option>
                {advertisers.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.company_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="ক্যাম্পেইনের শিরোনাম"
                value={campForm.name}
                onChange={(e) => setCampForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={campForm.start_date}
                  onChange={(e) => setCampForm((s) => ({ ...s, start_date: e.target.value }))}
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
                <input
                  type="date"
                  required
                  value={campForm.end_date}
                  onChange={(e) => setCampForm((s) => ({ ...s, end_date: e.target.value }))}
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  required
                  placeholder="বাজেট (BDT)"
                  value={campForm.total_budget}
                  onChange={(e) => setCampForm((s) => ({ ...s, total_budget: e.target.value }))}
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
                <select
                  value={campForm.pricing_model}
                  onChange={(e) => setCampForm((s) => ({ ...s, pricing_model: e.target.value }))}
                  className="px-2 py-2 text-xs rounded-lg border border-stone-300 bg-white"
                >
                  <option value="cpm">CPM</option>
                  <option value="cpc">CPC</option>
                  <option value="flat">Flat</option>
                </select>
                <input
                  type="number"
                  placeholder="দর (BDT)"
                  value={campForm.rate_amount}
                  onChange={(e) => setCampForm((s) => ({ ...s, rate_amount: e.target.value }))}
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
              </div>
              <button
                type="submit"
                disabled={savingCamp || !canManageCampaigns}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                ক্যাম্পেইন চালু করুন
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
                সক্রিয় ও নির্ধারিত ক্যাম্পেইন ({toBengaliNumber(campaigns.length)})
              </h3>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {campaigns.map((camp) => {
                  const cMeta = CAMPAIGN_STATUS_META[camp.status] || CAMPAIGN_STATUS_META.draft;
                  return (
                    <div key={camp.id} className="p-3 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900">{camp.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cMeta.badgeClass}`}>
                            {cMeta.labelBn}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {camp.advertiser?.company_name || camp.advertiser_name} · বাজেট: {formatBdt(camp.total_budget, true)} · খরচ:{' '}
                          {formatBdt(camp.spent_amount, true)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp)}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-800 font-bold cursor-pointer"
                      >
                        {camp.status === 'active' ? 'বিরতি দিন' : 'সক্রিয় করুন'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ad Placements Rate Cards */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">বিজ্ঞাপন স্লট ও মূল্যতালিকা (Placements)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {placements.map((pl) => (
                <div key={pl.id} className="p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{AD_PLACEMENT_LABELS[pl.key]?.labelBn || pl.name_bn}</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePlacement(pl)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        pl.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {pl.is_active ? 'চালু' : 'বন্ধ'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-stone-500">{pl.key} · {pl.dimensions}</p>
                  <p className="text-stone-700 font-semibold">
                    CPM: {formatBdt(pl.base_cpm_bdt, true)} · CPC: {formatBdt(pl.base_cpc_bdt, true)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Report */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">পারফরম্যান্স রিপোর্ট (অবস্থান ও ক্যাম্পেইন)</h3>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={reportRange.date_from}
                  onChange={(e) => setReportRange((r) => ({ ...r, date_from: e.target.value }))}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300"
                />
                <span>–</span>
                <input
                  type="date"
                  value={reportRange.date_to}
                  onChange={(e) => setReportRange((r) => ({ ...r, date_to: e.target.value }))}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="font-bold text-stone-800 mb-2">প্লেসমেন্ট অনুযায়ী ফলাফল</h4>
                <table className="w-full text-left border border-stone-200 rounded-xl overflow-hidden">
                  <thead className="bg-stone-50 text-stone-600">
                    <tr>
                      <th className="p-2">স্লট</th>
                      <th className="p-2">ইম্প্রেশন</th>
                      <th className="p-2">ক্লিক</th>
                      <th className="p-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(reportData?.by_placement || []).map((row) => (
                      <tr key={row.placement}>
                        <td className="p-2 font-mono font-bold">{row.placement}</td>
                        <td className="p-2">{toBengaliNumber(row.impressions)}</td>
                        <td className="p-2">{toBengaliNumber(row.clicks)}</td>
                        <td className="p-2 font-bold text-emerald-700">{row.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold text-stone-800 mb-2">ক্যাম্পেইন অনুযায়ী ফলাফল</h4>
                <table className="w-full text-left border border-stone-200 rounded-xl overflow-hidden">
                  <thead className="bg-stone-50 text-stone-600">
                    <tr>
                      <th className="p-2">ক্যাম্পেইন</th>
                      <th className="p-2">ইম্প্রেশন</th>
                      <th className="p-2">ক্লিক</th>
                      <th className="p-2">খরচ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(reportData?.by_campaign || []).map((row) => (
                      <tr key={row.id}>
                        <td className="p-2 font-bold">{row.name}</td>
                        <td className="p-2">{toBengaliNumber(row.impressions)}</td>
                        <td className="p-2">{toBengaliNumber(row.clicks)}</td>
                        <td className="p-2 font-mono">{formatBdt(row.spent_amount_bdt, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SPONSORED CONTENT */}
      {activeTab === 'sponsored' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateSponsored} className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              সংবাদকে স্পনসরড কনটেন্ট হিসেবে যুক্ত করুন
            </h3>
            <select
              required
              value={sponForm.news_id}
              onChange={(e) => setSponForm((s) => ({ ...s, news_id: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
            >
              <option value="">সংবাদ নির্বাচন করুন...</option>
              {newsArticles.map((art) => (
                <option key={art.id} value={art.id}>
                  #{art.id} — {art.title}
                </option>
              ))}
            </select>
            <select
              required
              value={sponForm.advertiser_id}
              onChange={(e) => setSponForm((s) => ({ ...s, advertiser_id: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
            >
              <option value="">বিজ্ঞাপনদাতা নির্বাচন করুন...</option>
              {advertisers.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.company_name}
                </option>
              ))}
            </select>
            <select
              value={sponForm.campaign_id}
              onChange={(e) => setSponForm((s) => ({ ...s, campaign_id: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
            >
              <option value="">সংশ্লিষ্ট ক্যাম্পেইন (ঐচ্ছিক)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={sponForm.label}
              onChange={(e) => setSponForm((s) => ({ ...s, label: e.target.value }))}
              placeholder="স্পনসর লেবেল"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
            />
            <textarea
              rows={2}
              value={sponForm.disclosure_text}
              onChange={(e) => setSponForm((s) => ({ ...s, disclosure_text: e.target.value }))}
              placeholder="স্বচ্ছতা ঘোষণা বার্তা"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={sponForm.cta_label}
                onChange={(e) => setSponForm((s) => ({ ...s, cta_label: e.target.value }))}
                placeholder="CTA বাটনের লেখা"
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
              <input
                type="url"
                value={sponForm.cta_url}
                onChange={(e) => setSponForm((s) => ({ ...s, cta_url: e.target.value }))}
                placeholder="https://example.com"
                className="px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingSpon || !canManageSponsored}
              className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              স্পনসরড কনটেন্ট যুক্ত করুন
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              স্পনসরড কনটেন্ট ও অনুমোদন সারি ({toBengaliNumber(sponsoredItems.length)})
            </h3>
            <div className="space-y-3">
              {sponsoredItems.map((sc) => {
                const advMeta = APPROVAL_STATUS_META[sc.advertiser_approval_status] || APPROVAL_STATUS_META.pending;
                const edMeta = APPROVAL_STATUS_META[sc.editorial_approval_status] || APPROVAL_STATUS_META.pending;
                return (
                  <div key={sc.id} className="p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {sc.label}
                        </span>
                        <h4 className="font-extrabold text-stone-900 text-sm mt-1">
                          {sc.news?.title || `News #${sc.news_id}`}
                        </h4>
                        <p className="text-stone-500">
                          বিজ্ঞাপনদাতা: <strong>{sc.advertiser?.company_name}</strong> · ইম্প্রেশন:{' '}
                          {toBengaliNumber(sc.impressions_count)} · ক্লিক: {toBengaliNumber(sc.clicks_count)} · CTR:{' '}
                          {formatCtr(sc.impressions_count, sc.clicks_count)}
                        </p>
                      </div>
                      {sc.news?.slug && (
                        <Link
                          to={`/news/${sc.news.slug}`}
                          target="_blank"
                          className="text-rose-700 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>দেখুন</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${advMeta.badgeClass}`}>
                        বিজ্ঞাপনদাতা: {advMeta.labelBn}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${edMeta.badgeClass}`}>
                        সম্পাদকীয়: {edMeta.labelBn}
                      </span>

                      <div className="ml-auto flex flex-wrap gap-1.5">
                        {sc.advertiser_approval_status !== 'approved' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await reviewSponAdvertiser({ id: sc.id, decision: 'approved' }).unwrap();
                              refetchSponsored();
                              sweetAlert.success('বিজ্ঞাপনদাতার অনুমোদন সংরক্ষিত');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-bold cursor-pointer"
                          >
                            বিজ্ঞাপনদাতা অনুমোদন
                          </button>
                        )}
                        {canApproveSponsored && sc.editorial_approval_status !== 'approved' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await reviewSponEditorial({ id: sc.id, decision: 'approved' }).unwrap();
                              refetchSponsored();
                              sweetAlert.success('সম্পাদকীয় অনুমোদন সম্পন্ন');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            সম্পাদকীয় অনুমোদন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMonetizationPage;

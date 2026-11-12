import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  KeyRound,
  ShieldAlert,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Users,
  Activity,
  Webhook
} from 'lucide-react';
import {
  useGetAdminSyndicationOverviewQuery,
  useGetAdminSyndicationPartnersQuery,
  useReviewAdminSyndicationPartnerMutation,
  useGetAdminSyndicationLicensesQuery,
  useSaveAdminSyndicationLicenseMutation,
  useSaveAdminPartnerGrantMutation,
  useUpdateAdminPartnerGrantMutation,
  useGetAdminSyndicationPlansQuery,
  useSaveAdminSyndicationPlanMutation
} from '../../store/api/syndicationApi.js';
import { getSyndicationStatusMeta } from '../../utils/syndicationHelpers.js';

export default function AdminSyndicationPage() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [tab, setTab] = useState('partners');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState(null);

  const [licenseForm, setLicenseForm] = useState({
    license_code: '',
    title: '',
    attribution_template: 'Source: NewsFlow ({reporter}) — {canonical_url}',
    allows_full_text: false,
    allows_commercial_use: false
  });
  const [grantForm, setGrantForm] = useState({
    developer_account_id: '',
    license_id: '',
    approval_status: 'approved',
    restriction_notes: ''
  });
  const [planForm, setPlanForm] = useState({
    slug: '',
    name_bn: '',
    name_en: '',
    tier: 'starter',
    monthly_price_bdt: 5000,
    requests_per_minute: 120,
    monthly_request_quota: 250000,
    max_apps: 5,
    max_webhooks: 3,
    allows_full_text: false,
    allows_commercial_use: true
  });

  const { data: overview } = useGetAdminSyndicationOverviewQuery();
  const { data: partnersRes } = useGetAdminSyndicationPartnersQuery({ approval_status: statusFilter });
  const { data: licensesRes } = useGetAdminSyndicationLicensesQuery();
  const { data: plans = [] } = useGetAdminSyndicationPlansQuery();

  const [reviewPartner] = useReviewAdminSyndicationPartnerMutation();
  const [saveLicense] = useSaveAdminSyndicationLicenseMutation();
  const [saveGrant] = useSaveAdminPartnerGrantMutation();
  const [updateGrant] = useUpdateAdminPartnerGrantMutation();
  const [savePlan] = useSaveAdminSyndicationPlanMutation();

  const partners = partnersRes?.data || [];
  const licenses = licensesRes?.licenses || [];
  const grants = licensesRes?.grants || [];

  const handleReview = async (accountUuid, approvalStatus) => {
    setNotice(null);
    try {
      await reviewPartner({ accountKey: accountUuid, approval_status: approvalStatus }).unwrap();
      setNotice({ type: 'success', text: `Partner status updated to ${approvalStatus}.` });
    } catch (err) {
      setNotice({ type: 'error', text: err?.data?.message || 'Partner review update failed.' });
    }
  };

  const handleSaveLicense = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      await saveLicense(licenseForm).unwrap();
      setLicenseForm({
        license_code: '',
        title: '',
        attribution_template: 'Source: NewsFlow ({reporter}) — {canonical_url}',
        allows_full_text: false,
        allows_commercial_use: false
      });
      setNotice({ type: 'success', text: isBn ? 'লাইসেন্স টেমপ্লেট সংরক্ষিত হয়েছে।' : 'Content license saved.' });
    } catch (err) {
      setNotice({ type: 'error', text: err?.data?.message || 'Failed to save license.' });
    }
  };

  const handleSaveGrant = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      await saveGrant({
        developer_account_id: Number(grantForm.developer_account_id),
        license_id: Number(grantForm.license_id),
        approval_status: grantForm.approval_status,
        restriction_notes: grantForm.restriction_notes
      }).unwrap();
      setNotice({ type: 'success', text: isBn ? 'পার্টনার লাইসেন্স গ্রান্ট ইস্যু হয়েছে।' : 'Partner license grant created.' });
    } catch (err) {
      setNotice({ type: 'error', text: err?.data?.message || 'Could not issue partner grant.' });
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      await savePlan({
        ...planForm,
        monthly_price_bdt: Number(planForm.monthly_price_bdt),
        requests_per_minute: Number(planForm.requests_per_minute),
        monthly_request_quota: Number(planForm.monthly_request_quota),
        max_apps: Number(planForm.max_apps),
        max_webhooks: Number(planForm.max_webhooks),
        allows_media_urls: true,
        attribution_required: true,
        is_active: true
      }).unwrap();
      setNotice({ type: 'success', text: isBn ? 'কমার্শিয়াল API প্ল্যান সংরক্ষিত হয়েছে।' : 'Commercial plan saved.' });
    } catch (err) {
      setNotice({ type: 'error', text: err?.data?.message || 'Could not save plan.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 font-serif-bn">
          {isBn ? 'নিউজ API ও কনটেন্ট সিন্ডিকেশন কনসোল' : 'News API & Content Syndication Governance'}
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          {isBn
            ? 'পার্টনার অনুমোদন, কপিরাইট লাইসেন্সিং, ওয়েবহুক স্বাস্থ্য, কমার্শিয়াল প্ল্যান এবং API নিরাপত্তা তদারকি করুন।'
            : 'Manage third-party syndication partners, content licensing grants, commercial API tiers, webhooks, and abuse telemetry.'}
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Users className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'অনুমোদিত পার্টনার' : 'Approved Partners'}</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">
            {overview?.partners?.approved ?? 0} / {overview?.partners?.total ?? 0}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span>{isBn ? 'সক্রিয় API কী' : 'Active API Keys'}</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{overview?.active_api_keys ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? '৩০ দিনের API কল' : '30d API Requests'}</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{(overview?.requests_30d ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Webhook className="w-4 h-4 text-sky-600" />
            <span>{isBn ? 'ওয়েবহুক সফলতা' : 'Webhooks Delivered'}</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">
            {overview?.webhook_deliveries?.delivered ?? 0} ({overview?.webhook_deliveries?.failed ?? 0} failed)
          </div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>{isBn ? '৩০ দিনের API আয়' : '30d API Revenue'}</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">৳{(overview?.revenue_30d_bdt ?? 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'partners', icon: Users, label: isBn ? 'পার্টনার অনুমোদন' : 'Partner Approvals' },
          { id: 'licenses', icon: FileText, label: isBn ? 'কনটেন্ট লাইসেন্স ও গ্রান্ট' : 'Licenses & Grants' },
          { id: 'plans', icon: CreditCard, label: isBn ? 'কমার্শিয়াল প্ল্যান' : 'API Plans' },
          { id: 'security', icon: ShieldAlert, label: isBn ? 'নিরাপত্তা ও রিপোর্ট' : 'Abuse & Reports' }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${
                tab === t.id ? 'bg-rose-700 text-white' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold border ${
            notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Partner Approvals */}
      {tab === 'partners' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'suspended', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  statusFilter === st ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {partners.map((p) => (
              <div key={p.uuid} className="rounded-xl bg-white border border-stone-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{p.organization_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSyndicationStatusMeta(p.approval_status, isBn).cls}`}>
                      {getSyndicationStatusMeta(p.approval_status, isBn).label}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">{p.plan?.name_en || 'Unassigned'}</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    {p.contact_email} • {p.website_url || 'No website'} • Apps: {(p.applications || []).length}
                  </div>
                  <p className="text-xs text-stone-500">{p.intended_use_case}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReview(p.uuid, 'approved')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(p.uuid, 'suspended')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(p.uuid, 'rejected')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Licenses & Grants */}
      {tab === 'licenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveLicense} className="rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">{isBn ? 'লাইসেন্স টেমপ্লেট তৈরি/হালনাগাদ' : 'Create / Update License Template'}</h3>
            <input
              required
              value={licenseForm.license_code}
              onChange={(e) => setLicenseForm({ ...licenseForm, license_code: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono"
              placeholder="LICENSE-CODE"
            />
            <input
              required
              value={licenseForm.title}
              onChange={(e) => setLicenseForm({ ...licenseForm, title: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              placeholder="License Title"
            />
            <textarea
              required
              rows={2}
              value={licenseForm.attribution_template}
              onChange={(e) => setLicenseForm({ ...licenseForm, attribution_template: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono"
            />
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={licenseForm.allows_full_text}
                  onChange={(e) => setLicenseForm({ ...licenseForm, allows_full_text: e.target.checked })}
                />
                <span>Allow Full Text</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={licenseForm.allows_commercial_use}
                  onChange={(e) => setLicenseForm({ ...licenseForm, allows_commercial_use: e.target.checked })}
                />
                <span>Allow Commercial Use</span>
              </label>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold">
              Save License Template
            </button>
          </form>

          <form onSubmit={handleSaveGrant} className="rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">{isBn ? 'পার্টনারকে লাইসেন্স গ্রান্ট প্রদান' : 'Assign License Grant to Partner'}</h3>
            <select
              required
              value={grantForm.developer_account_id}
              onChange={(e) => setGrantForm({ ...grantForm, developer_account_id: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
            >
              <option value="">Select Developer Partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.organization_name} ({p.approval_status})
                </option>
              ))}
            </select>
            <select
              required
              value={grantForm.license_id}
              onChange={(e) => setGrantForm({ ...grantForm, license_id: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
            >
              <option value="">Select Content License</option>
              {licenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.license_code} — {l.title}
                </option>
              ))}
            </select>
            <input
              value={grantForm.restriction_notes}
              onChange={(e) => setGrantForm({ ...grantForm, restriction_notes: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              placeholder="Restriction or exclusivity notes"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold">
              Issue License Grant
            </button>
          </form>

          <div className="lg:col-span-2 rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Active & Historical Partner Grants</h3>
            <div className="space-y-2">
              {grants.map((g) => (
                <div key={g.uuid} className="flex flex-wrap items-center justify-between gap-2 border border-stone-100 rounded-lg p-3 text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{g.developer_account?.organization_name}</span>
                    <span className="ml-2 font-mono text-stone-600">{g.license?.license_code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSyndicationStatusMeta(g.approval_status, isBn).cls}`}>
                      {getSyndicationStatusMeta(g.approval_status, isBn).label}
                    </span>
                    {g.approval_status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => updateGrant({ grantKey: g.uuid, approval_status: 'revoked' })}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold"
                      >
                        Revoke Grant
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commercial Plans */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSavePlan} className="rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">{isBn ? 'কমার্শিয়াল প্ল্যান সংরক্ষণ' : 'Save Commercial API Plan'}</h3>
            <input
              required
              value={planForm.slug}
              onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono"
              placeholder="plan-slug"
            />
            <input
              required
              value={planForm.name_bn}
              onChange={(e) => setPlanForm({ ...planForm, name_bn: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              placeholder="Name (Bangla)"
            />
            <input
              required
              value={planForm.name_en}
              onChange={(e) => setPlanForm({ ...planForm, name_en: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              placeholder="Name (English)"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={planForm.monthly_price_bdt}
                onChange={(e) => setPlanForm({ ...planForm, monthly_price_bdt: e.target.value })}
                className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                placeholder="BDT/Month"
              />
              <input
                type="number"
                value={planForm.requests_per_minute}
                onChange={(e) => setPlanForm({ ...planForm, requests_per_minute: e.target.value })}
                className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                placeholder="Req/min"
              />
            </div>
            <button type="submit" className="w-full py-2 rounded-lg bg-stone-900 text-white text-xs font-bold">
              Save Plan
            </button>
          </form>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((pl) => (
              <div key={pl.id} className="rounded-xl bg-white border border-stone-200 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{pl.name_en}</span>
                  <span className="font-mono text-xs text-rose-700 font-bold">৳{Number(pl.monthly_price_bdt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-stone-600">
                  {pl.requests_per_minute} RPM • {pl.monthly_request_quota?.toLocaleString()}/mo • {pl.allows_full_text ? 'Full Text' : 'Summary'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security & Partner Reports */}
      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">{isBn ? 'সাম্প্রতিক API অপব্যবহার সতর্কতা' : 'Recent API Security & Abuse Events'}</h3>
            {(overview?.recent_abuse_events || []).length === 0 ? (
              <p className="text-xs text-stone-500">No abuse or rate-limit events recorded.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {overview.recent_abuse_events.map((ev) => (
                  <div key={ev.id} className="border border-stone-100 rounded-lg p-3 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-rose-700">{ev.abuse_type}</span>
                      <span className="ml-2 text-stone-700">{ev.developer_account?.organization_name || 'Anonymous IP'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">{ev.auto_action_taken}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">{isBn ? 'শীর্ষ API পার্টনার (৩০ দিন)' : 'Top Syndication Partners (30d)'}</h3>
            {(overview?.top_partners || []).length === 0 ? (
              <p className="text-xs text-stone-500">No partner traffic recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {overview.top_partners.map((row) => (
                  <div key={row.uuid} className="border-b border-stone-100 pb-2 text-xs flex items-center justify-between">
                    <span className="font-semibold text-stone-800">{row.organization_name}</span>
                    <span className="font-mono text-stone-600">{row.request_count} reqs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


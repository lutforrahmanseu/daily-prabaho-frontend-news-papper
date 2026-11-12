import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin,
  Users,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Plus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3
} from 'lucide-react';
import {
  useGetAdminGeoLocationsQuery,
  useCreateGeoLocationMutation,
  useUpdateGeoLocationMutation,
  useGetAdminCorrespondentsQuery,
  useCreateCorrespondentMutation,
  useVerifyCorrespondentMutation,
  useAssignCorrespondentCoverageMutation,
  useGetHyperlocalAssignmentsQuery,
  useCreateHyperlocalAssignmentMutation,
  useGetRegionalApprovalQueueQuery,
  useReviewRegionalStoryMutation,
  useGetCorrespondentPerformanceQuery,
  useGetHyperlocalAnalyticsQuery
} from '../../store/api/hyperlocalApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import {
  GEO_LEVEL_META,
  CORRESPONDENT_VERIFICATION_BADGES,
  REGIONAL_APPROVAL_BADGES,
  GAP_SEVERITY_STYLES,
  getArticlePrimaryGeo
} from '../../utils/hyperlocalHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function AdminHyperlocalPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});

  const canManageLocations = hasEffectivePermission(authState, adminState, 'hyperlocal.locations.manage');
  const canManageCorrespondents = hasEffectivePermission(authState, adminState, 'hyperlocal.correspondents.manage');
  const canManageAssignments = hasEffectivePermission(authState, adminState, 'hyperlocal.assignments.manage');
  const canApproveRegional = hasEffectivePermission(authState, adminState, 'hyperlocal.regional.approve');
  const canViewAnalytics = hasEffectivePermission(authState, adminState, 'hyperlocal.analytics.view');

  const [activeTab, setActiveTab] = useState('approvals');
  const [levelFilter, setLevelFilter] = useState('district');
  const [locationSearch, setLocationSearch] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('pending_regional_review');
  const [reviewNotes, setReviewNotes] = useState({});

  const [locForm, setLocForm] = useState({
    level: 'upazila',
    location_type: 'upazila',
    parent_id: '',
    bbs_code: '',
    name_bn: '',
    name_en: ''
  });

  const [corrForm, setCorrForm] = useState({
    full_name_bn: '',
    full_name_en: '',
    work_email: '',
    phone: '',
    designation_bn: 'উপজেলা প্রতিনিধি',
    press_card_number: '',
    geo_location_id: '',
    can_publish_directly: false
  });

  const [asgForm, setAsgForm] = useState({
    title: '',
    category_id: '',
    district_id: '',
    correspondent_id: '',
    priority: 'normal',
    instructions: ''
  });

  const { data: allLocations = [] } = useGetAdminGeoLocationsQuery({ with_counts: 1 });
  const { data: approvalQueueData } = useGetRegionalApprovalQueueQuery({ regional_approval_status: approvalStatusFilter });
  const { data: correspondentsData } = useGetAdminCorrespondentsQuery({ per_page: 50 });
  const { data: assignmentsData } = useGetHyperlocalAssignmentsQuery({ per_page: 30 });
  const { data: performanceRows = [] } = useGetCorrespondentPerformanceQuery();
  const { data: analyticsData } = useGetHyperlocalAnalyticsQuery({}, { skip: !canViewAnalytics || activeTab !== 'analytics' });
  const { data: categories = [] } = useGetCategoriesQuery();

  const [createLocation, { isLoading: creatingLoc }] = useCreateGeoLocationMutation();
  const [updateLocation] = useUpdateGeoLocationMutation();
  const [createCorrespondent, { isLoading: creatingCorr }] = useCreateCorrespondentMutation();
  const [verifyCorrespondent] = useVerifyCorrespondentMutation();
  const [assignCoverage] = useAssignCorrespondentCoverageMutation();
  const [createAssignment, { isLoading: creatingAsg }] = useCreateHyperlocalAssignmentMutation();
  const [reviewStory, { isLoading: reviewingStory }] = useReviewRegionalStoryMutation();

  const divisions = useMemo(() => allLocations.filter((l) => l.level === 'division'), [allLocations]);
  const districts = useMemo(() => allLocations.filter((l) => l.level === 'district'), [allLocations]);

  const expectedParentLevel = GEO_LEVEL_META[locForm.level]?.order > 1
    ? Object.keys(GEO_LEVEL_META).find((k) => GEO_LEVEL_META[k].order === GEO_LEVEL_META[locForm.level].order - 1)
    : null;

  const eligibleParents = useMemo(
    () => (expectedParentLevel ? allLocations.filter((l) => l.level === expectedParentLevel) : []),
    [allLocations, expectedParentLevel]
  );

  const visibleLocations = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    return allLocations.filter((loc) => {
      if (levelFilter !== 'all' && loc.level !== levelFilter) return false;
      if (!q) return true;
      return (
        String(loc.name_bn || '').toLowerCase().includes(q) ||
        String(loc.name_en || '').toLowerCase().includes(q) ||
        String(loc.geo_code || '').toLowerCase().includes(q)
      );
    });
  }, [allLocations, levelFilter, locationSearch]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      await createLocation({
        ...locForm,
        parent_id: locForm.parent_id ? Number(locForm.parent_id) : null
      }).unwrap();
      setLocForm({ ...locForm, bbs_code: '', name_bn: '', name_en: '' });
      sweetAlert.success('নতুন এলাকা যোগ হয়েছে');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'এলাকা তৈরি ব্যর্থ হয়েছে');
    }
  };

  const handleToggleActiveLocation = async (loc) => {
    try {
      await updateLocation({ id: loc.id, is_active: !loc.is_active }).unwrap();
      sweetAlert.success('অবস্থানের স্ট্যাটাস হালনাগাদ হয়েছে');
    } catch {
      sweetAlert.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleCreateCorrespondent = async (e) => {
    e.preventDefault();
    try {
      await createCorrespondent({
        ...corrForm,
        coverage_areas: corrForm.geo_location_id ? [{ geo_location_id: Number(corrForm.geo_location_id), is_primary: true }] : []
      }).unwrap();
      setCorrForm({
        full_name_bn: '',
        full_name_en: '',
        work_email: '',
        phone: '',
        designation_bn: 'উপজেলা প্রতিনিধি',
        press_card_number: '',
        geo_location_id: '',
        can_publish_directly: false
      });
      sweetAlert.success('নতুন স্থানীয় প্রতিনিধি নিবন্ধিত হয়েছেন');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'নিবন্ধন ব্যর্থ হয়েছে');
    }
  };

  const handleVerifyCorrespondent = async (corrId, verificationStatus) => {
    try {
      await verifyCorrespondent({ id: corrId, verification_status: verificationStatus }).unwrap();
      sweetAlert.success(`প্রতিনিধির অবস্থা "${verificationStatus}" করা হয়েছে`);
    } catch {
      sweetAlert.error('যাচাইকরণ প্রক্রিয়া ব্যর্থ হয়েছে');
    }
  };

  const handleQuickCoverageAdd = async (corr, newGeoId) => {
    if (!newGeoId) return;
    const existing = (corr.coverage_areas || []).map((a) => ({
      geo_location_id: a.geo_location_id,
      is_primary: a.is_primary,
      is_regional_editor: a.is_regional_editor
    }));
    if (existing.some((x) => Number(x.geo_location_id) === Number(newGeoId))) return;
    try {
      await assignCoverage({
        id: corr.id,
        coverage_areas: [...existing, { geo_location_id: Number(newGeoId), is_primary: existing.length === 0 }]
      }).unwrap();
      sweetAlert.success('নতুন কাভারেজ এলাকা যুক্ত হয়েছে');
    } catch {
      sweetAlert.error('কাভারেজ এলাকা নির্ধারণ ব্যর্থ হয়েছে');
    }
  };

  const handleReviewStory = async (newsId, decision, publishImmediately = false) => {
    try {
      await reviewStory({
        newsId,
        decision,
        note: reviewNotes[newsId] || '',
        publish_immediately: publishImmediately
      }).unwrap();
      sweetAlert.success('আঞ্চলিক পর্যালোচনা সিদ্ধান্ত সংরক্ষিত হয়েছে');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'সিদ্ধান্ত সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await createAssignment({
        ...asgForm,
        category_id: asgForm.category_id ? Number(asgForm.category_id) : null,
        district_id: asgForm.district_id ? Number(asgForm.district_id) : null,
        correspondent_id: asgForm.correspondent_id ? Number(asgForm.correspondent_id) : null
      }).unwrap();
      setAsgForm({ title: '', category_id: '', district_id: '', correspondent_id: '', priority: 'normal', instructions: '' });
      sweetAlert.success('আঞ্চলিক অ্যাসাইনমেন্ট তৈরি হয়েছে');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'অ্যাসাইনমেন্ট তৈরি ব্যর্থ হয়েছে');
    }
  };

  const tabs = [
    { id: 'approvals', label: 'আঞ্চলিক অনুমোদন', icon: CheckSquare, visible: true },
    { id: 'assignments', label: 'আঞ্চলিক অ্যাসাইনমেন্ট', icon: ClipboardList, visible: true },
    { id: 'correspondents', label: 'প্রতিনিধি ও কর্মদক্ষতা', icon: Users, visible: true },
    { id: 'locations', label: 'বাংলাদেশ অবস্থান কাঠামো', icon: MapPin, visible: true },
    { id: 'analytics', label: 'বিশ্লেষণ ও কাভারেজ ঘাটতি', icon: BarChart3, visible: canViewAnalytics }
  ].filter((t) => t.visible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>Phase 30 • বাংলাদেশ হাইপারলোকাল নেটওয়ার্ক</span>
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-bn mt-1">
            দেশ ও জনপদ — আঞ্চলিক বার্তাকক্ষ কমান্ড সেন্টার
          </h1>
          <p className="text-xs text-stone-500">
            ৮ বিভাগ, ৬৪ জেলা, উপজেলা-ইউনিয়ন-ওয়ার্ড পরিচালনা, স্থানীয় প্রতিনিধি যাচাই, আঞ্চলিক অনুমোদন ও কাভারেজ বিশ্লেষণ
          </p>
        </div>

        <Link
          to="/local"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shrink-0"
        >
          <span>পাবলিক লোকাল হাব দেখুন</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                active ? 'bg-rose-700 text-white shadow-xs' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Regional Approval Queue */}
      {activeTab === 'approvals' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900 font-serif-bn">আঞ্চলিক সম্পাদনা অনুমোদন সারি</h2>
            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
            >
              <option value="pending_regional_review">অপেক্ষমাণ অনুমোদন</option>
              <option value="approved">অনুমোদিত</option>
              <option value="changes_requested">সংশোধনের জন্য ফেরত</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
              <option value="all">সকল আঞ্চলিক প্রতিবেদন</option>
            </select>
          </div>

          <div className="space-y-3">
            {(approvalQueueData?.items || []).map((item) => {
              const geo = getArticlePrimaryGeo(item, true);
              const badge = REGIONAL_APPROVAL_BADGES[item.regionalApprovalStatus] || REGIONAL_APPROVAL_BADGES.not_required;
              return (
                <div key={item.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${badge.className}`}>{badge.labelBn}</span>
                        {geo && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                            {geo.label}
                          </span>
                        )}
                        {item.correspondent && (
                          <span className="text-stone-600 font-medium">প্রতিনিধি: {item.correspondent.full_name_bn}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 font-serif-bn">{item.title}</h3>
                      {item.excerpt && <p className="text-xs text-stone-600">{item.excerpt}</p>}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-800">{item.status}</span>
                  </div>

                  {canApproveRegional && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-stone-200">
                      <input
                        type="text"
                        value={reviewNotes[item.id] || ''}
                        onChange={(e) => setReviewNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                        placeholder="আঞ্চলিক সম্পাদকের মন্তব্য লিখুন..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                      <button
                        type="button"
                        disabled={reviewingStory}
                        onClick={() => handleReviewStory(item.id, 'approved', true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                      >
                        অনুমোদন ও প্রকাশ
                      </button>
                      <button
                        type="button"
                        disabled={reviewingStory}
                        onClick={() => handleReviewStory(item.id, 'changes_requested', false)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                      >
                        সংশোধন ফেরত
                      </button>
                      <button
                        type="button"
                        disabled={reviewingStory}
                        onClick={() => handleReviewStory(item.id, 'rejected', false)}
                        className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                      >
                        প্রত্যাখ্যান
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {(approvalQueueData?.items || []).length === 0 && (
              <p className="text-sm text-stone-500 text-center py-6">এই ফিল্টারে কোনো প্রতিবেদন নেই।</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Local Assignment Board */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {canManageAssignments && (
            <form onSubmit={handleCreateAssignment} className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 h-fit">
              <h2 className="text-base font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-rose-700" />
                <span>নতুন স্থানীয় অ্যাসাইনমেন্ট</span>
              </h2>
              <input
                type="text"
                required
                value={asgForm.title}
                onChange={(e) => setAsgForm({ ...asgForm, title: e.target.value })}
                placeholder="অ্যাসাইনমেন্টের শিরোনাম..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
              <select
                value={asgForm.district_id}
                onChange={(e) => setAsgForm({ ...asgForm, district_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="">-- জেলা নির্বাচন করুন --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_bn} ({d.name_en})
                  </option>
                ))}
              </select>
              <select
                value={asgForm.correspondent_id}
                onChange={(e) => setAsgForm({ ...asgForm, correspondent_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="">-- স্থানীয় প্রতিনিধি নির্বাচন --</option>
                {(correspondentsData?.items || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name_bn} ({c.designation_bn})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={asgForm.category_id}
                  onChange={(e) => setAsgForm({ ...asgForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">বিভাগ</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={asgForm.priority}
                  onChange={(e) => setAsgForm({ ...asgForm, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="normal">সাধারণ</option>
                  <option value="high">উচ্চ অগ্রাধিকার</option>
                  <option value="urgent">জরুরি</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={asgForm.instructions}
                onChange={(e) => setAsgForm({ ...asgForm, instructions: e.target.value })}
                placeholder="মাঠ পর্যায়ের নির্দেশনা..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
              <button
                type="submit"
                disabled={creatingAsg}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
              >
                {creatingAsg ? 'তৈরি হচ্ছে...' : 'অ্যাসাইনমেন্ট পাঠান'}
              </button>
            </form>
          )}

          <div className={`${canManageAssignments ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-stone-200 rounded-2xl p-5 space-y-3`}>
            <h2 className="text-base font-bold text-stone-900 font-serif-bn">আঞ্চলিক অ্যাসাইনমেন্ট বোর্ড</h2>
            <div className="space-y-2.5">
              {(assignmentsData?.items || []).map((asg) => (
                <div key={asg.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-stone-900 text-white font-bold">{asg.status}</span>
                      {asg.district && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                          {asg.upazila?.name_bn ? `${asg.upazila.name_bn}, ` : ''}
                          {asg.district.name_bn}
                        </span>
                      )}
                      {asg.correspondent && <span className="text-stone-600">{asg.correspondent.full_name_bn}</span>}
                    </div>
                    <p className="text-sm font-bold text-stone-900 font-serif-bn">{asg.title}</p>
                  </div>
                  <Link
                    to={`/admin/newsroom/assignments/${asg.id}`}
                    className="text-xs font-bold text-rose-700 hover:underline"
                  >
                    বিস্তারিত →
                  </Link>
                </div>
              ))}
              {(assignmentsData?.items || []).length === 0 && (
                <p className="text-sm text-stone-500 text-center py-6">কোনো আঞ্চলিক অ্যাসাইনমেন্ট নেই।</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Correspondents & Performance */}
      {activeTab === 'correspondents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {canManageCorrespondents && (
              <form onSubmit={handleCreateCorrespondent} className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 h-fit">
                <h2 className="text-base font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-700" />
                  <span>নতুন প্রতিনিধি নিবন্ধন</span>
                </h2>
                <input
                  type="text"
                  required
                  value={corrForm.full_name_bn}
                  onChange={(e) => setCorrForm({ ...corrForm, full_name_bn: e.target.value })}
                  placeholder="বাংলা নাম *"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
                <input
                  type="text"
                  value={corrForm.full_name_en}
                  onChange={(e) => setCorrForm({ ...corrForm, full_name_en: e.target.value })}
                  placeholder="ইংরেজি নাম"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={corrForm.work_email}
                    onChange={(e) => setCorrForm({ ...corrForm, work_email: e.target.value })}
                    placeholder="কর্মস্থল ইমেইল"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                  <input
                    type="text"
                    value={corrForm.phone}
                    onChange={(e) => setCorrForm({ ...corrForm, phone: e.target.value })}
                    placeholder="এনক্রিপ্টেড ফোন"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={corrForm.press_card_number}
                  onChange={(e) => setCorrForm({ ...corrForm, press_card_number: e.target.value })}
                  placeholder="প্রেস কার্ড নম্বর (যেমন: NF-PC-9012)"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
                <select
                  value={corrForm.geo_location_id}
                  onChange={(e) => setCorrForm({ ...corrForm, geo_location_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">-- প্রাথমিক কাভারেজ এলাকা --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      জেলা: {d.name_bn}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={corrForm.can_publish_directly}
                    onChange={(e) => setCorrForm({ ...corrForm, can_publish_directly: e.target.checked })}
                    className="accent-rose-700"
                  />
                  <span>আঞ্চলিক সম্পাদকের অনুমোদন ছাড়াই সরাসরি প্রকাশের অনুমতি</span>
                </label>
                <button
                  type="submit"
                  disabled={creatingCorr}
                  className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                >
                  {creatingCorr ? 'নিবন্ধন হচ্ছে...' : 'প্রতিনিধি যুক্ত করুন'}
                </button>
              </form>
            )}

            <div className={`${canManageCorrespondents ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-stone-200 rounded-2xl p-5 space-y-3`}>
              <h2 className="text-base font-bold text-stone-900 font-serif-bn">স্থানীয় প্রতিনিধি তালিকা ও যাচাইকরণ</h2>
              <div className="space-y-3">
                {(correspondentsData?.items || []).map((corr) => {
                  const badge = CORRESPONDENT_VERIFICATION_BADGES[corr.verification_status] || CORRESPONDENT_VERIFICATION_BADGES.pending;
                  return (
                    <div key={corr.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 font-serif-bn">{corr.full_name_bn}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.labelBn}
                            </span>
                            <span className="text-[11px] font-mono text-stone-500">{corr.correspondent_code}</span>
                          </div>
                          <p className="text-xs text-stone-600">{corr.designation_bn}</p>
                        </div>

                        {canManageCorrespondents && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {corr.verification_status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyCorrespondent(corr.id, 'verified')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>যাচাই করুন</span>
                              </button>
                            )}
                            {corr.verification_status === 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyCorrespondent(corr.id, 'suspended')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>স্থগিত</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {(corr.coverage_areas || []).map((area) => (
                          <span
                            key={area.id}
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              area.is_primary ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {area.location?.name_bn} {area.is_primary ? '(প্রধান)' : ''}
                          </span>
                        ))}
                        {canManageCorrespondents && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              handleQuickCoverageAdd(corr, e.target.value);
                              e.target.value = '';
                            }}
                            className="px-2 py-0.5 rounded-lg border border-stone-300 bg-white text-[11px]"
                          >
                            <option value="">+ কাভারেজ জেলা যোগ</option>
                            {districts.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name_bn}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Correspondent Performance Dashboard */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 overflow-x-auto">
            <h2 className="text-base font-bold text-stone-900 font-serif-bn">প্রতিনিধি কর্মদক্ষতা ড্যাশবোর্ড</h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 pr-4">প্রতিনিধি</th>
                  <th className="py-2 px-3">প্রধান এলাকা</th>
                  <th className="py-2 px-3">মোট প্রতিবেদন</th>
                  <th className="py-2 px-3">প্রকাশিত</th>
                  <th className="py-2 px-3">মোট পাঠক</th>
                  <th className="py-2 px-3">অ্যাসাইনমেন্ট সম্পন্ন</th>
                  <th className="py-2 pl-3">অনুমোদন হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {performanceRows.map((row) => (
                  <tr key={row.correspondent_id}>
                    <td className="py-2.5 pr-4 font-bold text-stone-900">{row.full_name_bn}</td>
                    <td className="py-2.5 px-3 text-stone-600">{row.primary_area?.name_bn || '—'}</td>
                    <td className="py-2.5 px-3 font-semibold">{toBengaliNumber(row.total_articles)}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">{toBengaliNumber(row.published_articles)}</td>
                    <td className="py-2.5 px-3 font-semibold">{toBengaliNumber(row.total_views)}</td>
                    <td className="py-2.5 px-3">{toBengaliNumber(row.completed_assignments)} / {toBengaliNumber(row.total_assignments)}</td>
                    <td className="py-2.5 pl-3 font-bold text-rose-700">{toBengaliNumber(row.approval_rate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: 5-Level Location Hierarchy Management */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {canManageLocations && (
            <form onSubmit={handleCreateLocation} className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 h-fit">
              <h2 className="text-base font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-rose-700" />
                <span>নতুন ভৌগোলিক ইউনিট যোগ</span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={locForm.level}
                  onChange={(e) => setLocForm({ ...locForm, level: e.target.value, location_type: e.target.value, parent_id: '' })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  {Object.entries(GEO_LEVEL_META).map(([lvl, meta]) => (
                    <option key={lvl} value={lvl}>
                      {meta.labelBn} ({lvl})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={locForm.bbs_code}
                  onChange={(e) => setLocForm({ ...locForm, bbs_code: e.target.value })}
                  placeholder="BBS কোড (ঐচ্ছিক)"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              {expectedParentLevel && (
                <select
                  required
                  value={locForm.parent_id}
                  onChange={(e) => setLocForm({ ...locForm, parent_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">-- অভিভাবক ({GEO_LEVEL_META[expectedParentLevel]?.labelBn}) নির্বাচন --</option>
                  {eligibleParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_bn} ({p.name_en})
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                required
                value={locForm.name_bn}
                onChange={(e) => setLocForm({ ...locForm, name_bn: e.target.value })}
                placeholder="বাংলা নাম *"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
              <input
                type="text"
                required
                value={locForm.name_en}
                onChange={(e) => setLocForm({ ...locForm, name_en: e.target.value })}
                placeholder="ইংরেজি নাম *"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
              <button
                type="submit"
                disabled={creatingLoc}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
              >
                {creatingLoc ? 'সংরক্ষণ হচ্ছে...' : 'অবস্থান সংরক্ষণ করুন'}
              </button>
            </form>
          )}

          <div className={`${canManageLocations ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-stone-200 rounded-2xl p-5 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {['all', 'division', 'district', 'upazila', 'union', 'ward'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      levelFilter === lvl ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {lvl === 'all' ? 'সব স্তর' : GEO_LEVEL_META[lvl]?.labelBn}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="নাম বা geo_code দিয়ে খুঁজুন..."
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <div className="max-h-[480px] overflow-y-auto divide-y divide-stone-100">
              {visibleLocations.map((loc) => (
                <div key={loc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-stone-900">
                      {loc.name_bn} <span className="font-normal text-stone-500">({loc.name_en})</span>
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {loc.geo_code} • {loc.level} • প্রকাশিত সংবাদ: {toBengaliNumber(loc.published_news_count || 0)}
                    </p>
                  </div>
                  {canManageLocations && (
                    <button
                      type="button"
                      onClick={() => handleToggleActiveLocation(loc)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        loc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {loc.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Regional Analytics & Coverage Gaps */}
      {activeTab === 'analytics' && canViewAnalytics && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              <strong>প্রাইভেসি নিরাপত্তা:</strong> এই বিশ্লেষণ সম্পূর্ণরূপে প্রকাশিত সংবাদের ভৌগোলিক ট্যাগ এবং পাঠকদের ম্যানুয়ালি নির্বাচিত জেলা/উপজেলা সম্মতি থেকে তৈরি — কোনো ব্যবহারকারীর GPS বা IP ট্র্যাক করা হয়নি।
            </span>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'মোট আঞ্চলিক সংবাদ', val: toBengaliNumber(analyticsData?.summary?.total_hyperlocal_articles || 0) },
              { label: 'আঞ্চলিক পাঠক ভিউ', val: toBengaliNumber(analyticsData?.summary?.total_local_views || 0) },
              {
                label: 'সংবাদ কাভারেজপ্রাপ্ত জেলা',
                val: `${toBengaliNumber(analyticsData?.summary?.covered_districts_count || 0)} / ${toBengaliNumber(analyticsData?.summary?.total_districts || 64)}`
              },
              { label: 'অপ্ট-ইন লোকাল গ্রাহক', val: toBengaliNumber(analyticsData?.summary?.opted_in_local_subscribers || 0) }
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-stone-200 rounded-2xl p-4">
                <p className="text-xs text-stone-500 font-semibold">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">{kpi.val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Volume by Division */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 font-serif-bn">বিভাগভিত্তিক সংবাদ ও জেলা কাভারেজ</h3>
              <div className="space-y-3">
                {(analyticsData?.news_volume_by_division || []).map((div) => {
                  const pct = div.districts_total > 0 ? Math.round((div.covered_districts / div.districts_total) * 100) : 0;
                  return (
                    <div key={div.division_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">{div.name_bn}</span>
                        <span className="text-stone-600">
                          {toBengaliNumber(div.articles_count)} সংবাদ • {toBengaliNumber(div.covered_districts)}/{toBengaliNumber(div.districts_total)} জেলা ({toBengaliNumber(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full bg-rose-700 rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional Coverage Gaps */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>আঞ্চলিক কাভারেজ ঘাটতি (পিছিয়ে থাকা জেলা)</span>
              </h3>
              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {(analyticsData?.coverage_gaps || []).map((gap) => {
                  const sev = GAP_SEVERITY_STYLES[gap.gap_severity] || GAP_SEVERITY_STYLES.moderate;
                  return (
                    <div key={gap.district_id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-stone-900">
                          {gap.name_bn} <span className="text-stone-500 font-normal">({gap.division_name_bn})</span>
                        </p>
                        <p className="text-[11px] text-stone-500">
                          প্রতিনিধি: {toBengaliNumber(gap.correspondents_count)} • সংবাদ: {toBengaliNumber(gap.articles_count)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.className}`}>
                        {sev.labelBn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Engagement by District Table */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 overflow-x-auto">
            <h3 className="text-sm font-bold text-stone-900 font-serif-bn">জেলাভিত্তিক পাঠক এনগেজমেন্ট</h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 pr-4">জেলা</th>
                  <th className="py-2 px-3">বিভাগ</th>
                  <th className="py-2 px-3">সংবাদ</th>
                  <th className="py-2 px-3">মোট ভিউ</th>
                  <th className="py-2 px-3">গড় সময় (সেকেন্ড)</th>
                  <th className="py-2 pl-3">ম্যানুয়াল গ্রাহক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(analyticsData?.engagement_by_district || []).slice(0, 12).map((row) => (
                  <tr key={row.district_id}>
                    <td className="py-2 pr-4 font-bold text-stone-900">{row.name_bn}</td>
                    <td className="py-2 px-3 text-stone-600">{row.division_name_bn}</td>
                    <td className="py-2 px-3">{toBengaliNumber(row.articles_count)}</td>
                    <td className="py-2 px-3 font-bold text-rose-700">{toBengaliNumber(row.views_count)}</td>
                    <td className="py-2 px-3">{toBengaliNumber(row.avg_engagement_seconds)}</td>
                    <td className="py-2 pl-3">{toBengaliNumber(row.manual_readers_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHyperlocalPage;


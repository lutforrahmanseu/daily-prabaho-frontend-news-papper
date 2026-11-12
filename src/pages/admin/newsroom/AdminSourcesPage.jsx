import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetNewsSourcesQuery,
  useGetNewsSourceDetailQuery,
  useCreateNewsSourceMutation,
  useUpdateNewsSourceMutation,
  useDeleteNewsSourceMutation,
  useLinkNewsSourceMutation,
  useGetAssignmentsQuery
} from '../../../store/api/newsroomApi.js';
import { useGetAdminNewsListQuery } from '../../../store/api/newsApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { MotionOverlay } from '../../../components/common/MotionPrimitives.jsx';
import {
  SOURCE_TYPE_LABELS,
  RELIABILITY_META,
  VERIFICATION_STATUS_META,
  formatBnCount,
  formatDateTimeBn
} from '../../../utils/newsroomHelpers.js';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Link2,
  Edit3,
  Trash2,
  Eye,
  Building2,
  X,
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';

const STORY_ROLE_LABELS = {
  primary: 'মূল উৎস (Primary)',
  corroborating: 'সমর্থনকারী উৎস (Corroborating)',
  background: 'পটভূমি / রেফারেন্স (Background)'
};

const INITIAL_SOURCE_FORM = {
  name: '',
  organization: '',
  designation: '',
  beat: '',
  source_type: 'official',
  reliability_rating: 'B',
  verification_status: 'pending',
  is_confidential: false,
  contact_email: '',
  contact_phone: '',
  alternate_contact: '',
  location: '',
  verification_notes: '',
  bio: ''
};

export default function AdminSourcesPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canManageSources = hasEffectivePermission(authState, adminState, 'source.manage');
  const canViewConfidential = hasEffectivePermission(authState, adminState, 'source.confidential');

  const [search, setSearch] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');
  const [reliabilityFilter, setReliabilityFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [confidentialOnly, setConfidentialOnly] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState(INITIAL_SOURCE_FORM);

  const [detailSourceId, setDetailSourceId] = useState(null);
  const [linkModalSource, setLinkModalSource] = useState(null);
  const [linkTargetType, setLinkTargetType] = useState('news');
  const [linkForm, setLinkForm] = useState({
    news_id: '',
    assignment_id: '',
    role_in_story: 'primary',
    notes: ''
  });

  const { data: sourcesData, isLoading, isFetching, refetch } = useGetNewsSourcesQuery({
    search: search || undefined,
    source_type: sourceTypeFilter || undefined,
    reliability_rating: reliabilityFilter || undefined,
    verification_status: verificationFilter || undefined,
    confidential_only: canViewConfidential && confidentialOnly ? true : undefined,
    per_page: 50
  });

  const { data: detailSource, isLoading: detailLoading } = useGetNewsSourceDetailQuery(detailSourceId, {
    skip: !detailSourceId
  });

  const { data: adminNewsData } = useGetAdminNewsListQuery(
    { per_page: 50 },
    { skip: !linkModalSource }
  );
  const { data: assignmentsData } = useGetAssignmentsQuery(
    { per_page: 50 },
    { skip: !linkModalSource }
  );

  const [createSource, { isLoading: isCreating }] = useCreateNewsSourceMutation();
  const [updateSource, { isLoading: isUpdating }] = useUpdateNewsSourceMutation();
  const [deleteSource] = useDeleteNewsSourceMutation();
  const [linkSource, { isLoading: isLinking }] = useLinkNewsSourceMutation();

  const sources = useMemo(() => sourcesData?.items || [], [sourcesData]);
  const backendCanViewConfidential = Boolean(
    sourcesData?.can_view_confidential ?? canViewConfidential
  );
  const newsOptions = adminNewsData?.items || [];
  const assignmentOptions = assignmentsData?.items || [];

  const openCreateModal = () => {
    setEditingSource(null);
    setFormData(INITIAL_SOURCE_FORM);
    setFormModalOpen(true);
  };

  const openEditModal = (src) => {
    if (src.is_confidential && !backendCanViewConfidential) {
      sweetAlert.error('অনুমতি সীমিত', 'গোপনীয় উৎসের তথ্য সম্পাদনার অনুমোদন আপনার নেই।');
      return;
    }
    setEditingSource(src);
    setFormData({
      name: src.name || '',
      organization: src.organization || '',
      designation: src.designation || '',
      beat: src.beat || '',
      source_type: src.source_type || 'official',
      reliability_rating: src.reliability_rating || 'B',
      verification_status: src.verification_status || 'pending',
      is_confidential: Boolean(src.is_confidential),
      contact_email: src.contact_email || '',
      contact_phone: src.contact_phone || '',
      alternate_contact: src.alternate_contact || '',
      location: src.location || '',
      verification_notes: src.verification_notes || '',
      bio: src.bio || ''
    });
    setFormModalOpen(true);
  };

  const handleSaveSource = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      await sweetAlert.error('আবশ্যক তথ্য', 'উৎসের নাম বা ছদ্মনাম প্রদান করুন।');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      organization: formData.organization.trim() || null,
      designation: formData.designation.trim() || null,
      beat: formData.beat.trim() || null,
      source_type: formData.source_type,
      reliability_rating: formData.reliability_rating,
      verification_status: formData.verification_status,
      is_confidential: backendCanViewConfidential ? Boolean(formData.is_confidential) : false,
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      alternate_contact: formData.alternate_contact.trim() || null,
      location: formData.location.trim() || null,
      verification_notes: formData.verification_notes.trim() || null,
      bio: formData.bio.trim() || null
    };

    try {
      if (editingSource) {
        await updateSource({ id: editingSource.id, ...payload }).unwrap();
        await sweetAlert.success('হালনাগাদ সম্পন্ন', 'সংবাদ উৎসের তথ্য সফলভাবে হালনাগাদ হয়েছে।');
      } else {
        await createSource(payload).unwrap();
        await sweetAlert.success('নতুন উৎস যুক্ত', 'সংবাদ উৎসটি ডিরেক্টরিতে সংরক্ষিত হয়েছে।');
      }
      setFormModalOpen(false);
    } catch (err) {
      await sweetAlert.error('সংরক্ষণ ব্যর্থ', extractApiError(err, 'সংবাদ উৎস সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleDeleteSource = async (src) => {
    const confirm = await sweetAlert.confirmDelete(
      'উৎস অপসারণ করবেন?',
      `"${src.name}" সংবাদ উৎস ডিরেক্টরি থেকে অপসারণ করা হবে।`
    );
    if (!confirm.isConfirmed) return;

    try {
      await deleteSource(src.id).unwrap();
      if (detailSourceId === src.id) setDetailSourceId(null);
      await sweetAlert.success('অপসারিত', 'সংবাদ উৎস অপসারণ করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('অপসারণ ব্যর্থ', extractApiError(err, 'উৎস অপসারণ করা যায়নি।'));
    }
  };

  const openLinkModal = (src) => {
    setLinkModalSource(src);
    setLinkTargetType('news');
    setLinkForm({
      news_id: '',
      assignment_id: '',
      role_in_story: 'primary',
      notes: ''
    });
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkModalSource) return;

    const payload = {
      id: linkModalSource.id,
      role_in_story: linkForm.role_in_story,
      notes: linkForm.notes.trim() || null
    };

    if (linkTargetType === 'news') {
      if (!linkForm.news_id) {
        await sweetAlert.error('সংবাদ নির্বাচন', 'সংযুক্ত করার জন্য একটি সংবাদ নির্বাচন করুন।');
        return;
      }
      payload.news_id = Number(linkForm.news_id);
    } else {
      if (!linkForm.assignment_id) {
        await sweetAlert.error('অ্যাসাইনমেন্ট নির্বাচন', 'সংযুক্ত করার জন্য একটি অ্যাসাইনমেন্ট নির্বাচন করুন।');
        return;
      }
      payload.assignment_id = Number(linkForm.assignment_id);
    }

    try {
      await linkSource(payload).unwrap();
      await sweetAlert.success('সংযুক্তি সম্পন্ন', 'সংবাদ উৎসটি সফলভাবে সংযুক্ত করা হয়েছে।');
      setLinkModalSource(null);
    } catch (err) {
      await sweetAlert.error('সংযুক্তি ব্যর্থ', extractApiError(err, 'উৎস সংযুক্ত করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-serif-bn text-stone-900">
              সংবাদ উৎস ও যাচাইকরণ ডিরেক্টরি
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              সোর্স নির্ভরযোগ্যতা, যোগাযোগের তথ্য, যাচাইকরণ নোট এবং গোপনীয় হুইসেলব্লোয়ার সুরক্ষা ({formatBnCount(sources.length)}টি উৎস)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            {canManageSources && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন উৎস যুক্ত করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Confidential Access Notice */}
        {!backendCanViewConfidential && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">গোপনীয় উৎস অ্যাক্সেস সীমিত: </span>
              নিরাপত্তা নীতিমালা অনুযায়ী গোপনীয় (Confidential) হুইসেলব্লোয়ার বা সংরক্ষিত উৎসের পরিচয় ও যোগাযোগের তথ্য আপনার প্রোফাইল থেকে গোপন রাখা হয়েছে। প্রতিটি গোপনীয় প্রবেশাধিকার প্রচেষ্টা অডিট লগে সংরক্ষিত হয়।
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-stone-100">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, প্রতিষ্ঠান বা বিট দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 text-xs outline-none focus:border-rose-600"
            />
          </div>

          <select
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
          >
            <option value="">সকল উৎসের ধরন</option>
            {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <select
            value={reliabilityFilter}
            onChange={(e) => setReliabilityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
          >
            <option value="">সকল নির্ভরযোগ্যতা গ্রেড</option>
            {Object.entries(RELIABILITY_META).map(([k, meta]) => (
              <option key={k} value={k}>{meta.labelBn}</option>
            ))}
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
          >
            <option value="">সকল যাচাই অবস্থা</option>
            {Object.entries(VERIFICATION_STATUS_META).map(([k, meta]) => (
              <option key={k} value={k}>{meta.labelBn}</option>
            ))}
          </select>
        </div>

        {backendCanViewConfidential && (
          <div className="flex items-center gap-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={confidentialOnly}
                onChange={(e) => setConfidentialOnly(e.target.checked)}
                className="rounded border-stone-300 text-rose-700 focus:ring-rose-600"
              />
              <Lock className="w-3.5 h-3.5 text-rose-700" />
              <span>শুধুমাত্র গোপনীয় (Confidential) উৎস দেখুন</span>
            </label>
          </div>
        )}
      </div>

      {/* Sources Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin text-rose-700" />
          <span>সংবাদ উৎস তালিকা লোড হচ্ছে...</span>
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500 text-sm">
          কোনো সংবাদ উৎস পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন বা নতুন উৎস যুক্ত করুন।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sources.map((src) => {
            const relMeta = RELIABILITY_META[src.reliability_rating] || RELIABILITY_META.B;
            const verMeta = VERIFICATION_STATUS_META[src.verification_status] || VERIFICATION_STATUS_META.pending;
            const redacted = Boolean(src.redacted);

            return (
              <div
                key={src.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between gap-4 ${
                  src.is_confidential ? 'border-rose-200 bg-rose-50/15' : 'border-stone-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${relMeta.badgeClass}`}>
                        গ্রেড {src.reliability_rating}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${verMeta.badgeClass}`}>
                        {verMeta.labelBn}
                      </span>
                      {src.is_confidential && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-800 text-white">
                          <Lock className="w-2.5 h-2.5" />
                          <span>গোপনীয়</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {SOURCE_TYPE_LABELS[src.source_type] || src.source_type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold font-serif-bn text-stone-900">
                      {src.name}
                    </h3>
                    {(src.designation || src.organization) && (
                      <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{[src.designation, src.organization].filter(Boolean).join(' • ')}</span>
                      </p>
                    )}
                    {src.beat && (
                      <p className="text-[11px] text-rose-700 font-semibold mt-1">
                        বিট / ক্ষেত্র: {src.beat}
                      </p>
                    )}
                  </div>

                  {/* Contact Info (Redacted if confidential & unauthorized) */}
                  {redacted ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>যোগাযোগ ও পরিচয় সার্ভার-সাইডে সংরক্ষিত</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-stone-600 bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                      {src.contact_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{src.contact_phone}</span>
                        </div>
                      )}
                      {src.contact_email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{src.contact_email}</span>
                        </div>
                      )}
                      {src.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{src.location}</span>
                        </div>
                      )}
                      {!src.contact_phone && !src.contact_email && !src.location && (
                        <span className="text-[11px] text-stone-400">সরাসরি যোগাযোগ তথ্য যুক্ত নেই</span>
                      )}
                    </div>
                  )}

                  {!redacted && src.verification_notes && (
                    <p className="text-[11px] text-stone-600 line-clamp-2 border-l-2 border-emerald-500 pl-2">
                      {src.verification_notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-stone-500">
                    সংযুক্ত স্টোরি: <strong className="text-stone-800">{formatBnCount(src.links_count ?? 0)}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDetailSourceId(src.id)}
                      title="বিস্তারিত দেখুন"
                      className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!redacted && (
                      <button
                        type="button"
                        onClick={() => openLinkModal(src)}
                        title="সংবাদ বা অ্যাসাইনমেন্টে সংযুক্ত করুন"
                        className="p-1.5 rounded-lg text-stone-600 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    )}
                    {canManageSources && !redacted && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(src)}
                          title="সম্পাদনা"
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(src)}
                          title="অপসারণ"
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailSourceId && (
        <MotionOverlay isOpen={Boolean(detailSourceId)} onClose={() => setDetailSourceId(null)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-700" />
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  উৎসের প্রোফাইল ও যাচাই ইতিহাস
                </h3>
              </div>
              <button type="button" onClick={() => setDetailSourceId(null)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-sm">
              {detailLoading || !detailSource ? (
                <div className="py-10 flex items-center justify-center gap-2 text-stone-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
                  <span>তথ্য লোড হচ্ছে...</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-bold font-serif-bn text-stone-900">{detailSource.name}</h4>
                      <p className="text-xs text-stone-600">
                        {[detailSource.designation, detailSource.organization].filter(Boolean).join(' • ') || 'স্বতন্ত্র উৎস'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${(RELIABILITY_META[detailSource.reliability_rating] || RELIABILITY_META.B).badgeClass}`}>
                        {detailSource.reliability_rating} গ্রেড
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${(VERIFICATION_STATUS_META[detailSource.verification_status] || VERIFICATION_STATUS_META.pending).badgeClass}`}>
                        {(VERIFICATION_STATUS_META[detailSource.verification_status] || VERIFICATION_STATUS_META.pending).labelBn}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div><span className="text-stone-500">ধরন:</span> <strong>{SOURCE_TYPE_LABELS[detailSource.source_type]}</strong></div>
                    <div><span className="text-stone-500">বিট:</span> <strong>{detailSource.beat || 'নির্ধারিত নয়'}</strong></div>
                    <div><span className="text-stone-500">ফোন:</span> <strong>{detailSource.contact_phone || 'নেই'}</strong></div>
                    <div><span className="text-stone-500">ইমেইল:</span> <strong>{detailSource.contact_email || 'নেই'}</strong></div>
                    <div><span className="text-stone-500">বিকল্প মাধ্যম:</span> <strong>{detailSource.alternate_contact || 'নেই'}</strong></div>
                    <div><span className="text-stone-500">অবস্থান:</span> <strong>{detailSource.location || 'নেই'}</strong></div>
                    <div><span className="text-stone-500">যাচাইকারী:</span> <strong>{detailSource.verifier?.name || 'অপেক্ষমাণ'}</strong></div>
                    <div><span className="text-stone-500">সর্বশেষ যাচাই:</span> <strong>{formatDateTimeBn(detailSource.last_verified_at)}</strong></div>
                  </div>

                  {detailSource.verification_notes && (
                    <div>
                      <h5 className="text-xs font-bold text-stone-800 mb-1">যাচাইকরণ ও সম্পাদকীয় নোট</h5>
                      <p className="text-xs text-stone-700 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 whitespace-pre-line">
                        {detailSource.verification_notes}
                      </p>
                    </div>
                  )}

                  {detailSource.bio && (
                    <div>
                      <h5 className="text-xs font-bold text-stone-800 mb-1">পটভূমি / বিবরণ</h5>
                      <p className="text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-3 whitespace-pre-line">
                        {detailSource.bio}
                      </p>
                    </div>
                  )}

                  <div>
                    <h5 className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-700" />
                      <span>সংযুক্ত প্রতিবেদন ও অ্যাসাইনমেন্ট ({formatBnCount(detailSource.links?.length || 0)})</span>
                    </h5>
                    {(!detailSource.links || detailSource.links.length === 0) ? (
                      <p className="text-xs text-stone-500">এখনো কোনো সংবাদ বা অ্যাসাইনমেন্টে এই উৎস সংযুক্ত করা হয়নি।</p>
                    ) : (
                      <div className="space-y-2">
                        {detailSource.links.map((lk) => (
                          <div key={lk.id} className="rounded-lg border border-stone-200 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-stone-900">
                                {lk.news?.title || lk.assignment?.title || 'সংযুক্ত আইটেম'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                {STORY_ROLE_LABELS[lk.role_in_story] || lk.role_in_story}
                              </span>
                            </div>
                            {lk.notes && <p className="text-stone-600">{lk.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </MotionOverlay>
      )}

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <MotionOverlay isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {editingSource ? 'সংবাদ উৎস হালনাগাদ করুন' : 'নতুন সংবাদ উৎস নিবন্ধন করুন'}
              </h3>
              <button type="button" onClick={() => setFormModalOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">নাম / কোডনেম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="যেমন: ড. আনিসুর রহমান বা সূত্র-অর্থনীতি-০১"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিট / বিষয়ক্ষেত্র</label>
                  <input
                    type="text"
                    value={formData.beat}
                    onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                    placeholder="যেমন: অর্থনীতি, জ্বালানি, বিচার বিভাগ"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রতিষ্ঠান / দপ্তর</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">উৎসের ধরন</label>
                  <select
                    value={formData.source_type}
                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">নির্ভরযোগ্যতা</label>
                  <select
                    value={formData.reliability_rating}
                    onChange={(e) => setFormData({ ...formData, reliability_rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(RELIABILITY_META).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.labelBn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">যাচাই অবস্থা</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(VERIFICATION_STATUS_META).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.labelBn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ফোন নম্বর</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিকল্প নিরাপদ মাধ্যম</label>
                  <input
                    type="text"
                    value={formData.alternate_contact}
                    onChange={(e) => setFormData({ ...formData, alternate_contact: e.target.value })}
                    placeholder="Signal / ProtonMail"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">অবস্থান / শহর</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">যাচাইকরণ নোট (Verification Notes)</label>
                <textarea
                  rows={3}
                  value={formData.verification_notes}
                  onChange={(e) => setFormData({ ...formData, verification_notes: e.target.value })}
                  placeholder="নথিপত্র ক্রস-চেক ও নির্ভরযোগ্যতা যাচাইয়ের তথ্য লিখুন..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সংক্ষিপ্ত পরিচিতি / পটভূমি</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              {backendCanViewConfidential && (
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_confidential}
                    onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                    className="rounded border-rose-300 text-rose-700 focus:ring-rose-600"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-rose-900 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>গোপনীয় উৎস (Confidential Whistleblower Protection)</span>
                    </div>
                    <p className="text-rose-700 mt-0.5">
                      সক্রিয় করলে কেবল জ্যেষ্ঠ সম্পাদক ও গোপনীয় অনুমোদনপ্রাপ্ত ব্যবহারকারীরাই পরিচয় দেখতে পারবেন।
                    </p>
                  </div>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {(isCreating || isUpdating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSource ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}

      {/* Link to News / Assignment Modal */}
      {linkModalSource && (
        <MotionOverlay isOpen={Boolean(linkModalSource)} onClose={() => setLinkModalSource(null)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                সংবাদ বা অ্যাসাইনমেন্টে উৎস সংযুক্ত করুন
              </h3>
              <button type="button" onClick={() => setLinkModalSource(null)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
              <div className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-3">
                নির্বাচিত উৎস: <strong className="text-stone-900">{linkModalSource.name}</strong>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLinkTargetType('news')}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    linkTargetType === 'news' ? 'bg-rose-700 text-white border-rose-700' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  সংবাদ নিবন্ধের সাথে
                </button>
                <button
                  type="button"
                  onClick={() => setLinkTargetType('assignment')}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    linkTargetType === 'assignment' ? 'bg-rose-700 text-white border-rose-700' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  অ্যাসাইনমেন্টের সাথে
                </button>
              </div>

              {linkTargetType === 'news' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সংবাদ নির্বাচন *</label>
                  <select
                    value={linkForm.news_id}
                    onChange={(e) => setLinkForm({ ...linkForm, news_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="">-- সংবাদ নির্বাচন করুন --</option>
                    {newsOptions.map((n) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">অ্যাসাইনমেন্ট নির্বাচন *</label>
                  <select
                    value={linkForm.assignment_id}
                    onChange={(e) => setLinkForm({ ...linkForm, assignment_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="">-- অ্যাসাইনমেন্ট নির্বাচন করুন --</option>
                    {assignmentOptions.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">প্রতিবেদনে ভূমিকা</label>
                <select
                  value={linkForm.role_in_story}
                  onChange={(e) => setLinkForm({ ...linkForm, role_in_story: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  {Object.entries(STORY_ROLE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সংযুক্তি নোট</label>
                <textarea
                  rows={2}
                  value={linkForm.notes}
                  onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                  placeholder="এই উৎস কোন তথ্যটি নিশ্চিত করেছেন..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setLinkModalSource(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isLinking}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {isLinking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>সংযুক্ত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}
    </div>
  );
}


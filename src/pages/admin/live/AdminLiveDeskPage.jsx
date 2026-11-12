import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  ExternalLink,
  PauseCircle,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  StopCircle,
  Trash2,
  Archive,
  X
} from 'lucide-react';
import {
  useCreateLiveBlogMutation,
  useDeleteLiveBlogMutation,
  useGetAdminLiveBlogsQuery,
  useGetAdminSpecialCoveragesQuery,
  useTransitionLiveBlogMutation
} from '../../../store/api/liveCoverageApi.js';
import { useGetCategoriesQuery } from '../../../store/api/categoryApi.js';
import {
  LIVE_BLOG_STATUS_META,
  LIVE_EVENT_TYPE_META,
  formatLiveTimestampBadge
} from '../../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { LiveBadgePill } from '../../../components/live/LiveCoverageShared.jsx';

export function AdminLiveDeskPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canContribute = hasEffectivePermission(authState, adminState, 'live.contribute');
  const canPublish = hasEffectivePermission(authState, adminState, 'live.publish');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    location: '',
    cover_image: '',
    event_type: 'breaking',
    status: canPublish ? 'live' : 'submitted',
    requires_editorial_approval: true,
    is_pinned_homepage: false,
    category_id: '',
    special_coverage_id: ''
  });

  const { data, isLoading } = useGetAdminLiveBlogsQuery({
    per_page: 50,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(eventFilter !== 'all' ? { event_type: eventFilter } : {})
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: coveragesData } = useGetAdminSpecialCoveragesQuery({ per_page: 50 });

  const [createLiveBlog, { isLoading: isCreating }] = useCreateLiveBlogMutation();
  const [transitionLiveBlog] = useTransitionLiveBlogMutation();
  const [deleteLiveBlog] = useDeleteLiveBlogMutation();

  const blogs = data?.items || [];
  const coverages = coveragesData?.items || [];

  const stats = useMemo(() => {
    return {
      total: blogs.length,
      live: blogs.filter((b) => b.status === 'live').length,
      submitted: blogs.filter((b) => b.status === 'submitted' || (b.pending_updates_count || 0) > 0).length,
      ended: blogs.filter((b) => b.status === 'ended').length
    };
  }, [blogs]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      sweetAlert.warning('শিরোনাম প্রয়োজন', 'অনুগ্রহ করে লাইভ ব্লগের শিরোনাম দিন।');
      return;
    }

    try {
      const payload = {
        ...formState,
        status: canPublish ? formState.status : (formState.status === 'draft' ? 'draft' : 'submitted'),
        category_id: formState.category_id ? Number(formState.category_id) : null,
        special_coverage_id: formState.special_coverage_id ? Number(formState.special_coverage_id) : null
      };
      await createLiveBlog(payload).unwrap();
      sweetAlert.success('লাইভ ব্লগ তৈরি হয়েছে', 'নতুন লাইভ ব্লগ স্টুডিওতে যুক্ত হয়েছে।');
      setShowCreateModal(false);
      setFormState({
        title: '',
        summary: '',
        location: '',
        cover_image: '',
        event_type: 'breaking',
        status: canPublish ? 'live' : 'submitted',
        requires_editorial_approval: true,
        is_pinned_homepage: false,
        category_id: '',
        special_coverage_id: ''
      });
    } catch (err) {
      sweetAlert.error('তৈরি ব্যর্থ হয়েছে', err?.data?.message || 'তথ্য যাচাই করে আবার চেষ্টা করুন।');
    }
  };

  const handleTransition = async (blog, action, label) => {
    let wrapUpNote = null;
    if (action === 'end') {
      const res = await sweetAlert.confirm(
        'লাইভ কভারেজ সমাপ্ত করবেন?',
        `"${blog.title}" সরাসরি সম্প্রচার সমাপ্ত করলে একটি সমাপনী বার্তা স্বয়ংক্রিয়ভাবে যুক্ত হবে।`
      );
      if (!res.isConfirmed) return;
      wrapUpNote = 'সম্পাদকীয় ডেস্ক কর্তৃক এই ঘটনার সরাসরি সম্প্রচার সমাপ্ত ঘোষণা করা হলো।';
    } else {
      const res = await sweetAlert.confirm(`${label} নিশ্চিত করুন`, `"${blog.title}" এর অবস্থা পরিবর্তন করতে চান?`);
      if (!res.isConfirmed) return;
    }

    try {
      await transitionLiveBlog({ id: blog.id, action, wrap_up_note: wrapUpNote }).unwrap();
      sweetAlert.success('সফল হয়েছে', `লাইভ ব্লগ "${label}" সম্পন্ন হয়েছে।`);
    } catch (err) {
      sweetAlert.error('অপারেশন ব্যর্থ হয়েছে', err?.data?.message || 'অনুমতি বা তথ্য যাচাই করুন।');
    }
  };

  const handleDelete = async (blog) => {
    const res = await sweetAlert.confirmDelete(blog.title);
    if (!res.isConfirmed) return;

    try {
      await deleteLiveBlog(blog.id).unwrap();
      sweetAlert.success('অপসারিত হয়েছে', 'লাইভ ব্লগটি মুছে ফেলা হয়েছে।');
    } catch (err) {
      sweetAlert.error('মুছে ফেলা ব্যর্থ', err?.data?.message || 'মুছে ফেলার অনুমতি নেই।');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-bn text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-700" />
            <span>লাইভ নিউজ ডেস্ক (Live Desk)</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            তাৎক্ষণিক লাইভ ব্লগ, সম্পাদকীয় অনুমোদন, পিন ও রিয়েল-টাইম ফিড নিয়ন্ত্রণ কেন্দ্র।
          </p>
        </div>

        {(canContribute || canPublish) && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন লাইভ ব্লগ</span>
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'সরাসরি চলছে', value: stats.live, color: 'text-rose-700' },
          { label: 'অনুমোদন অপেক্ষমান', value: stats.submitted, color: 'text-amber-700' },
          { label: 'মোট লাইভ ডেস্ক', value: stats.total, color: 'text-stone-900 dark:text-stone-100' },
          { label: 'সমাপ্ত কভারেজ', value: stats.ended, color: 'text-emerald-700' }
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
          >
            <div className="text-xs text-stone-500 dark:text-stone-400">{card.label}</div>
            <div className={`text-2xl font-extrabold mt-1 ${card.color}`}>{toBengaliNumber(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="শিরোনাম বা স্থান খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
        >
          <option value="all">সকল অবস্থা</option>
          {Object.values(LIVE_BLOG_STATUS_META).map((st) => (
            <option key={st.id} value={st.id}>{st.label}</option>
          ))}
        </select>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
        >
          <option value="all">সকল ইভেন্ট টাইপ</option>
          {Object.values(LIVE_EVENT_TYPE_META).map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.label}</option>
          ))}
        </select>
      </div>

      {/* Live Blogs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-sm text-stone-500">
          কোনো লাইভ ব্লগ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => {
            const eventMeta = LIVE_EVENT_TYPE_META[blog.event_type] || LIVE_EVENT_TYPE_META.general;
            return (
              <div
                key={blog.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LiveBadgePill status={blog.status} size="sm" />
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${eventMeta.badgeClass}`}>
                      {eventMeta.label}
                    </span>
                    {blog.pending_updates_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                        {toBengaliNumber(blog.pending_updates_count)}টি আপডেট অনুমোদনের অপেক্ষায়
                      </span>
                    )}
                    {blog.requires_editorial_approval && (
                      <span className="text-[11px] text-stone-500">সম্পাদকীয় অনুমোদন বাধ্যতামূলক</span>
                    )}
                  </div>

                  <Link
                    to={`/admin/live-desk/${blog.id}`}
                    className="block font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100 hover:text-rose-700"
                  >
                    {blog.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                    <span>মোট আপডেট: <strong>{toBengaliNumber(blog.updates_count || 0)}</strong></span>
                    <span>সাবস্ক্রাইবার: <strong>{toBengaliNumber(blog.subscribers_count || 0)}</strong></span>
                    <span>আপডেট: {formatLiveTimestampBadge(blog.last_update_at || blog.updated_at)}</span>
                    {blog.special_coverage && (
                      <span className="text-rose-700 font-semibold">আয়োজন: {blog.special_coverage.title}</span>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to={`/admin/live-desk/${blog.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-900 dark:bg-rose-700 text-white text-xs font-bold hover:opacity-90"
                  >
                    <span>স্টুডিও খুলুন</span>
                  </Link>

                  {blog.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleTransition(blog, 'submit', 'অনুমোদনের জন্য জমা')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>জমা দিন</span>
                    </button>
                  )}

                  {canPublish && ['draft', 'submitted'].includes(blog.status) && (
                    <button
                      type="button"
                      onClick={() => handleTransition(blog, 'approve', 'অনুমোদন')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>অনুমোদন</span>
                    </button>
                  )}

                  {canPublish && ['submitted', 'approved', 'paused', 'draft'].includes(blog.status) && (
                    <button
                      type="button"
                      onClick={() => handleTransition(blog, 'start', 'সরাসরি শুরু')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>লাইভ চালু</span>
                    </button>
                  )}

                  {canPublish && blog.status === 'live' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransition(blog, 'pause', 'বিরতি')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-800 text-xs font-bold cursor-pointer"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>বিরতি</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransition(blog, 'end', 'সমাপ্ত')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-300 bg-stone-100 text-stone-800 text-xs font-bold cursor-pointer"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>সমাপ্ত</span>
                      </button>
                    </>
                  )}

                  {canPublish && blog.status === 'ended' && (
                    <button
                      type="button"
                      onClick={() => handleTransition(blog, 'archive', 'আর্কাইভ')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>আর্কাইভ</span>
                    </button>
                  )}

                  {['live', 'paused', 'ended'].includes(blog.status) && (
                    <Link
                      to={`/live/${blog.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50"
                      title="পাবলিক ভিউ দেখুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}

                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => handleDelete(blog)}
                      className="p-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Live Blog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100">
                নতুন লাইভ ব্লগ তৈরি করুন
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="যেমন: জাতীয় সংসদে বাজেট অধিবেশন সরাসরি"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  সংক্ষিপ্ত সারসংক্ষেপ
                </label>
                <textarea
                  rows={2}
                  value={formState.summary}
                  onChange={(e) => setFormState((s) => ({ ...s, summary: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ঘটনার ধরন
                  </label>
                  <select
                    value={formState.event_type}
                    onChange={(e) => setFormState((s) => ({ ...s, event_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    {Object.values(LIVE_EVENT_TYPE_META).map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    প্রাথমিক অবস্থা {canPublish ? '' : '(সম্পাদকীয় অনুমোদন প্রযোজ্য)'}
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState((s) => ({ ...s, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="draft">খসড়া</option>
                    <option value="submitted">অনুমোদনের জন্য জমা</option>
                    {canPublish && <option value="approved">অনুমোদিত</option>}
                    {canPublish && <option value="live">সরাসরি চালু (Live)</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    বিভাগ (Category)
                  </label>
                  <select
                    value={formState.category_id}
                    onChange={(e) => setFormState((s) => ({ ...s, category_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    সংযুক্ত বিশেষ আয়োজন
                  </label>
                  <select
                    value={formState.special_coverage_id}
                    onChange={(e) => setFormState((s) => ({ ...s, special_coverage_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="">কোনোটিই নয়</option>
                    {coverages.map((cov) => (
                      <option key={cov.id} value={cov.id}>{cov.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    স্থান (Location)
                  </label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
                    placeholder="যেমন: শেরেবাংলা নগর, ঢাকা"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    কভার ছবির URL
                  </label>
                  <input
                    type="url"
                    value={formState.cover_image}
                    onChange={(e) => setFormState((s) => ({ ...s, cover_image: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.requires_editorial_approval}
                    onChange={(e) => setFormState((s) => ({ ...s, requires_editorial_approval: e.target.checked }))}
                  />
                  <span>প্রতিবেদকদের আপডেটে সম্পাদকের অনুমোদন লাগবে</span>
                </label>

                {canPublish && (
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.is_pinned_homepage}
                      onChange={(e) => setFormState((s) => ({ ...s, is_pinned_homepage: e.target.checked }))}
                    />
                    <span>হোমপেজ শীর্ষে প্রদর্শন</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {isCreating ? 'তৈরি হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLiveDeskPage;


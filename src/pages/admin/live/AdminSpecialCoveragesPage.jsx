import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  Globe,
  Layers,
  Plus,
  Search,
  Send,
  Trash2,
  X
} from 'lucide-react';
import {
  useCreateSpecialCoverageMutation,
  useDeleteSpecialCoverageMutation,
  useGetAdminSpecialCoveragesQuery,
  useTransitionSpecialCoverageMutation
} from '../../../store/api/liveCoverageApi.js';
import {
  COVERAGE_STATUS_META,
  SPECIAL_COVERAGE_TYPE_META,
  formatBengaliFullDateTime
} from '../../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { normalizeMediaUrl } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export function AdminSpecialCoveragesPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canManage = hasEffectivePermission(authState, adminState, 'coverage.manage');
  const canPublish = hasEffectivePermission(authState, adminState, 'coverage.publish');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    description: '',
    coverage_type: 'election',
    status: canPublish ? 'published' : 'submitted',
    badge_text: '',
    hero_image: '',
    is_featured: true,
    show_in_navbar: true
  });

  const { data, isLoading } = useGetAdminSpecialCoveragesQuery({
    per_page: 50,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(typeFilter !== 'all' ? { coverage_type: typeFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {})
  });

  const [createCoverage, { isLoading: isCreating }] = useCreateSpecialCoverageMutation();
  const [transitionCoverage] = useTransitionSpecialCoverageMutation();
  const [deleteCoverage] = useDeleteSpecialCoverageMutation();

  const coverages = data?.items || [];

  const counts = useMemo(() => {
    return {
      total: coverages.length,
      published: coverages.filter((c) => c.status === 'published').length,
      pending: coverages.filter((c) => ['submitted', 'approved'].includes(c.status)).length
    };
  }, [coverages]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      sweetAlert.warning('শিরোনাম প্রয়োজন', 'বিশেষ আয়োজনের শিরোনাম লিখুন।');
      return;
    }

    try {
      const payload = {
        ...formState,
        status: canPublish ? formState.status : (formState.status === 'draft' ? 'draft' : 'submitted')
      };
      await createCoverage(payload).unwrap();
      sweetAlert.success('বিশেষ আয়োজন তৈরি হয়েছে', 'এখন আপনি টাইমলাইন, সংবাদ, গ্যালারি ও ইনফোগ্রাফিক যুক্ত করতে পারবেন।');
      setShowCreateModal(false);
      setFormState({
        title: '',
        subtitle: '',
        description: '',
        coverage_type: 'election',
        status: canPublish ? 'published' : 'submitted',
        badge_text: '',
        hero_image: '',
        is_featured: true,
        show_in_navbar: true
      });
    } catch (err) {
      sweetAlert.error('তৈরি ব্যর্থ', err?.data?.message || 'তথ্য যাচাই করুন।');
    }
  };

  const handleTransition = async (cov, action, label) => {
    const res = await sweetAlert.confirm(`${label} নিশ্চিত করুন`, `"${cov.title}" এর অবস্থা পরিবর্তন করতে চান?`);
    if (!res.isConfirmed) return;

    try {
      await transitionCoverage({ id: cov.id, action }).unwrap();
      sweetAlert.success('সফল হয়েছে', `"${label}" সম্পন্ন হয়েছে।`);
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'অনুমতি যাচাই করুন।');
    }
  };

  const handleDelete = async (cov) => {
    const res = await sweetAlert.confirmDelete(cov.title);
    if (!res.isConfirmed) return;

    try {
      await deleteCoverage(cov.id).unwrap();
      sweetAlert.success('অপসারণ সফল', 'বিশেষ আয়োজন মুছে ফেলা হয়েছে।');
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'অনুমতি নেই।');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-bn text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-rose-700" />
            <span>বিশেষ আয়োজন (Special Coverage CMS)</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            নির্বাচন, ক্রীড়া আসর, জাতীয় দিবস, দুর্যোগ, বাজেট ও জরুরি ঘটনার ডেডিকেটেড মাইক্রোসাইট ব্যবস্থাপনা।
          </p>
        </div>

        {(canManage || canPublish) && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিশেষ আয়োজন</span>
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'মোট আয়োজন', value: counts.total, color: 'text-stone-900 dark:text-stone-100' },
          { label: 'প্রকাশিত পাতা', value: counts.published, color: 'text-emerald-700' },
          { label: 'পর্যালোচনা ও অনুমোদনাধীন', value: counts.pending, color: 'text-amber-700' }
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <div className="text-xs text-stone-500">{card.label}</div>
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
            placeholder="আয়োজনের শিরোনাম খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
        >
          <option value="all">সকল শ্রেণি (৬টি ধরন)</option>
          {Object.values(SPECIAL_COVERAGE_TYPE_META).map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
        >
          <option value="all">সকল অবস্থা</option>
          {Object.values(COVERAGE_STATUS_META).map((st) => (
            <option key={st.id} value={st.id}>{st.label}</option>
          ))}
        </select>
      </div>

      {/* Coverage Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : coverages.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-sm text-stone-500">
          কোনো বিশেষ আয়োজন পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-3">
          {coverages.map((cov) => {
            const typeMeta = SPECIAL_COVERAGE_TYPE_META[cov.coverage_type] || SPECIAL_COVERAGE_TYPE_META.breaking_event;
            const statusMeta = COVERAGE_STATUS_META[cov.status] || COVERAGE_STATUS_META.draft;
            return (
              <div
                key={cov.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  {cov.hero_image && (
                    <img
                      src={normalizeMediaUrl(cov.hero_image)}
                      alt={cov.title}
                      className="w-24 h-20 rounded-lg object-cover shrink-0 hidden sm:block bg-stone-100"
                    />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>
                      {cov.is_featured && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-bold">ফিচার্ড</span>
                      )}
                    </div>

                    <Link
                      to={`/admin/special-coverage/${cov.id}`}
                      className="block font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100 hover:text-rose-700"
                    >
                      {cov.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                      <span>সেকশন উপাদান: <strong>{toBengaliNumber(cov.items_count || 0)}</strong></span>
                      <span>সংযুক্ত লাইভ ব্লগ: <strong>{toBengaliNumber(cov.live_blogs_count || 0)}</strong></span>
                      <span>সাবস্ক্রাইবার: <strong>{toBengaliNumber(cov.subscribers_count || 0)}</strong></span>
                      {cov.published_at && <span>প্রকাশ: {formatBengaliFullDateTime(cov.published_at)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to={`/admin/special-coverage/${cov.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-900 dark:bg-rose-700 text-white text-xs font-bold hover:opacity-90"
                  >
                    <span>বিল্ডার ও এডিটর</span>
                  </Link>

                  {cov.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleTransition(cov, 'submit', 'অনুমোদনের জন্য জমা')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>জমা দিন</span>
                    </button>
                  )}

                  {canPublish && ['draft', 'submitted'].includes(cov.status) && (
                    <button
                      type="button"
                      onClick={() => handleTransition(cov, 'approve', 'অনুমোদন')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>অনুমোদন</span>
                    </button>
                  )}

                  {canPublish && ['draft', 'submitted', 'approved', 'archived'].includes(cov.status) && (
                    <button
                      type="button"
                      onClick={() => handleTransition(cov, 'publish', 'প্রকাশ')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>প্রকাশ করুন</span>
                    </button>
                  )}

                  {canPublish && cov.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => handleTransition(cov, 'archive', 'আর্কাইভ')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-300 text-xs font-bold cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>আর্কাইভ</span>
                    </button>
                  )}

                  {cov.status === 'published' && (
                    <Link
                      to={`/coverage/${cov.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50"
                      title="পাবলিক পাতা দেখুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}

                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => handleDelete(cov)}
                      className="p-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                      title="মুছুন"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-serif-bn text-lg font-extrabold">নতুন বিশেষ আয়োজন তৈরি করুন</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">আয়োজনের ধরন (Archetype) *</label>
                  <select
                    value={formState.coverage_type}
                    onChange={(e) => setFormState((s) => ({ ...s, coverage_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    {Object.values(SPECIAL_COVERAGE_TYPE_META).map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
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
                    {canPublish && <option value="published">সরাসরি প্রকাশ (Published)</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="যেমন: ত্রয়োদশ জাতীয় সংসদ নির্বাচন ২০২৬"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">উপ-শিরোনাম</label>
                <input
                  type="text"
                  value={formState.subtitle}
                  onChange={(e) => setFormState((s) => ({ ...s, subtitle: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">ব্যাজ টেক্সট</label>
                  <input
                    type="text"
                    value={formState.badge_text}
                    onChange={(e) => setFormState((s) => ({ ...s, badge_text: e.target.value }))}
                    placeholder="যেমন: বিশেষ নির্বাচন কাভারেজ"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">হিরো ব্যানার ছবি URL</label>
                  <input
                    type="url"
                    value={formState.hero_image}
                    onChange={(e) => setFormState((s) => ({ ...s, hero_image: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_featured}
                    onChange={(e) => setFormState((s) => ({ ...s, is_featured: e.target.checked }))}
                  />
                  <span>হোমপেজ ফিচার্ড বারে রাখুন</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.show_in_navbar}
                    onChange={(e) => setFormState((s) => ({ ...s, show_in_navbar: e.target.checked }))}
                  />
                  <span>নেভিগেশন মেনুতে দেখান</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer">
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isCreating ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSpecialCoveragesPage;


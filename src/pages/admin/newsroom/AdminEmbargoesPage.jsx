import React, { useMemo, useState } from 'react';
import {
  useGetEmbargoesQuery,
  useSetArticleEmbargoMutation,
  useAuthorizeArticleEmbargoMutation,
  useReleaseArticleEmbargoNowMutation,
  useReleaseDueEmbargoesMutation
} from '../../../store/api/newsroomApi.js';
import { useGetAdminNewsListQuery } from '../../../store/api/newsApi.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { MotionOverlay } from '../../../components/common/MotionPrimitives.jsx';
import { formatBnCount, formatDateTimeBn } from '../../../utils/newsroomHelpers.js';
import {
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  Plus,
  Zap,
  RefreshCw,
  Loader2,
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

function toLocalDateTimeInput(isoValue) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminEmbargoesPage() {
  const [stateFilter, setStateFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    newsId: '',
    embargo_until: '',
    embargo_reason: '',
    authorize: true,
    auto_release_embargo: true
  });

  const { data: embargoesData, isLoading, isFetching, refetch } = useGetEmbargoesQuery({
    state: stateFilter || undefined,
    per_page: 50
  });

  const { data: adminNewsData } = useGetAdminNewsListQuery(
    { per_page: 50 },
    { skip: !modalOpen }
  );

  const [setArticleEmbargo, { isLoading: isSaving }] = useSetArticleEmbargoMutation();
  const [authorizeEmbargo, { isLoading: isAuthorizing }] = useAuthorizeArticleEmbargoMutation();
  const [releaseEmbargoNow, { isLoading: isReleasingNow }] = useReleaseArticleEmbargoNowMutation();
  const [releaseDueEmbargoes, { isLoading: isReleasingDue }] = useReleaseDueEmbargoesMutation();

  const embargoes = useMemo(() => embargoesData?.items || [], [embargoesData]);
  const newsOptions = adminNewsData?.items || [];

  const openSetModal = (article = null) => {
    setFormData({
      newsId: article?.id ? String(article.id) : '',
      embargo_until: article?.embargo_until ? toLocalDateTimeInput(article.embargo_until) : '',
      embargo_reason: article?.embargo_reason || '',
      authorize: true,
      auto_release_embargo: article?.auto_release_embargo ?? true
    });
    setModalOpen(true);
  };

  const handleSetEmbargo = async (e) => {
    e.preventDefault();
    if (!formData.newsId || !formData.embargo_until) {
      await sweetAlert.error('তথ্য অসম্পূর্ণ', 'সংবাদ ও এমবার্গো মুক্তির সময়সীমা নির্বাচন করুন।');
      return;
    }

    try {
      await setArticleEmbargo({
        newsId: Number(formData.newsId),
        embargo_until: new Date(formData.embargo_until).toISOString(),
        embargo_reason: formData.embargo_reason.trim() || null,
        authorize: Boolean(formData.authorize),
        auto_release_embargo: Boolean(formData.auto_release_embargo)
      }).unwrap();
      await sweetAlert.success('এমবার্গো আরোপিত', 'নির্ধারিত সময়সীমা পর্যন্ত সংবাদটি পাবলিক সাইট থেকে কঠোরভাবে সংরক্ষিত রাখা হয়েছে।');
      setModalOpen(false);
    } catch (err) {
      await sweetAlert.error('এমবার্গো ব্যর্থ', extractApiError(err, 'এমবার্গো আরোপ করা যায়নি।'));
    }
  };

  const handleAuthorize = async (item) => {
    try {
      await authorizeEmbargo(item.id).unwrap();
      await sweetAlert.success('অনুমোদিত', 'নির্ধারিত সময়ে স্বয়ংক্রিয় এমবার্গো মুক্তির অনুমোদন সম্পন্ন হয়েছে।');
    } catch (err) {
      await sweetAlert.error('অনুমোদন ব্যর্থ', extractApiError(err, 'অনুমোদন সম্পন্ন করা যায়নি।'));
    }
  };

  const handleReleaseNow = async (item) => {
    const confirm = await sweetAlert.confirm({
      title: 'এমবার্গো এখনই অবমুক্ত করবেন?',
      text: `"${item.title}" সংবাদটির এমবার্গো তুলে নেওয়া হবে এবং অনুমোদিত থাকলে প্রকাশ করা হবে।`,
      confirmButtonText: 'হ্যাঁ, অবমুক্ত করুন'
    });
    if (!confirm.isConfirmed) return;

    try {
      await releaseEmbargoNow({ newsId: item.id, publish_if_approved: true }).unwrap();
      await sweetAlert.success('এমবার্গো অবমুক্ত', 'সংবাদটির এমবার্গো প্রত্যাহার করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('মুক্তি ব্যর্থ', extractApiError(err, 'এমবার্গো অবমুক্ত করা যায়নি।'));
    }
  };

  const handleReleaseDue = async () => {
    try {
      const res = await releaseDueEmbargoes().unwrap();
      const count = res?.released_count ?? 0;
      await sweetAlert.success(
        'মেয়াদোত্তীর্ণ এমবার্গো প্রক্রিয়াকরণ',
        `${formatBnCount(count)}টি মেয়াদোত্তীর্ণ অনুমোদিত সংবাদ স্বয়ংক্রিয়ভাবে অবমুক্ত করা হয়েছে।`
      );
    } catch (err) {
      await sweetAlert.error('প্রক্রিয়াকরণ ব্যর্থ', extractApiError(err, 'স্বয়ংক্রিয় মুক্তি চালানো যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-serif-bn text-stone-900">
              নিউজ এমবার্গো ও নির্ধারিত প্রকাশ নিয়ন্ত্রণ
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              সময়বদ্ধ নিষেধাজ্ঞা, কঠোর পাবলিক/এপিআই সুরক্ষা, সম্পাদকীয় অনুমোদন এবং স্বয়ংক্রিয় রিলিজ ব্যবস্থাপনা ({formatBnCount(embargoes.length)}টি আইটেম)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              type="button"
              onClick={handleReleaseDue}
              disabled={isReleasingDue}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 cursor-pointer disabled:opacity-60"
            >
              {isReleasingDue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>মেয়াদোত্তীর্ণ মুক্তি চালান</span>
            </button>
            <button
              type="button"
              onClick={() => openSetModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন এমবার্গো আরোপ</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          {[
            { key: 'active', label: 'সক্রিয় এমবার্গো' },
            { key: 'authorized', label: 'স্বয়ংক্রিয় মুক্তির অনুমোদিত' },
            { key: 'pending_authorization', label: 'অনুমোদনের অপেক্ষায়' },
            { key: 'released', label: 'অবমুক্ত ইতিহাস' },
            { key: '', label: 'সকল' }
          ].map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => setStateFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                stateFilter === tab.key
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embargoes List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin text-rose-700" />
          <span>এমবার্গো তালিকা লোড হচ্ছে...</span>
        </div>
      ) : embargoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-sm text-stone-500">
          এই ফিল্টারে কোনো এমবার্গোযুক্ত সংবাদ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-4">
          {embargoes.map((item) => {
            const isActive = Boolean(item.is_embargoed);
            const isAuthorized = Boolean(item.embargo_authorized_by);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isActive ? 'border-rose-200 bg-rose-50/10' : 'border-stone-200'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-rose-800 text-white">
                        <Lock className="w-3 h-3" />
                        <span>সক্রিয় এমবার্গো</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Unlock className="w-3 h-3" />
                        <span>অবমুক্ত</span>
                      </span>
                    )}

                    {isActive && (
                      isAuthorized ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>অটো-রিলিজ অনুমোদিত</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>অনুমোদন বকেয়া</span>
                        </span>
                      )
                    )}

                    <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                      অবস্থা: {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-serif-bn text-stone-900">
                    {item.title}
                  </h3>

                  {item.embargo_reason && (
                    <p className="text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                      <strong>কারণ:</strong> {item.embargo_reason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-700" />
                      <span>মুক্তির সময়: <strong className="text-stone-900">{formatDateTimeBn(item.embargo_until)}</strong></span>
                    </span>
                    {item.embargo_released_at && (
                      <span>
                        প্রকৃত অবমুক্তি: <strong className="text-emerald-800">{formatDateTimeBn(item.embargo_released_at)}</strong>
                      </span>
                    )}
                    {item.author?.name && (
                      <span>প্রতিবেদক: <strong>{item.author.name}</strong></span>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openSetModal(item)}
                      className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      সময় পরিবর্তন
                    </button>

                    {!isAuthorized && (
                      <button
                        type="button"
                        onClick={() => handleAuthorize(item)}
                        disabled={isAuthorizing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>স্বয়ংক্রিয় মুক্তি অনুমোদন</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReleaseNow(item)}
                      disabled={isReleasingNow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>এখনই অবমুক্ত করুন</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Update Embargo Modal */}
      {modalOpen && (
        <MotionOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                সংবাদে এমবার্গো নির্ধারণ করুন
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSetEmbargo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সংবাদ নিবন্ধ নির্বাচন *</label>
                <select
                  required
                  value={formData.newsId}
                  onChange={(e) => setFormData({ ...formData, newsId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">-- সংবাদ নির্বাচন করুন --</option>
                  {newsOptions.map((n) => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">এমবার্গো শেষ হওয়ার তারিখ ও সময় *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.embargo_until}
                  onChange={(e) => setFormData({ ...formData, embargo_until: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">এমবার্গোর কারণ ও নির্দেশনা</label>
                <textarea
                  rows={3}
                  value={formData.embargo_reason}
                  onChange={(e) => setFormData({ ...formData, embargo_reason: e.target.value })}
                  placeholder="যেমন: বাজেট বক্তৃতা বা আদালতের রায় আনুষ্ঠানিক ঘোষণার আগে প্রকাশ সম্পূর্ণ নিষিদ্ধ।"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.authorize}
                    onChange={(e) => setFormData({ ...formData, authorize: e.target.checked })}
                    className="rounded border-stone-300 text-rose-700 focus:ring-rose-600"
                  />
                  <span>এমবার্গো স্বয়ংক্রিয় রিলিজ অনুমোদন করুন</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_release_embargo}
                    onChange={(e) => setFormData({ ...formData, auto_release_embargo: e.target.checked })}
                    className="rounded border-stone-300 text-rose-700 focus:ring-rose-600"
                  />
                  <span>সময়সীমা শেষ হলে স্বয়ংক্রিয়ভাবে এমবার্গো অবমুক্ত ও প্রকাশ করুন</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>এমবার্গো কার্যকর করুন</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}
    </div>
  );
}

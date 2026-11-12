import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetNewsCorrectionsQuery,
  useCreateCorrectionRequestMutation,
  useReviewNewsCorrectionMutation,
  usePublishNewsCorrectionMutation
} from '../../../store/api/newsroomApi.js';
import { useGetAdminNewsListQuery } from '../../../store/api/newsApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { MotionOverlay } from '../../../components/common/MotionPrimitives.jsx';
import {
  CORRECTION_TYPE_LABELS,
  CORRECTION_STATUS_META,
  formatBnCount,
  formatDateTimeBn
} from '../../../utils/newsroomHelpers.js';
import {
  FileWarning,
  Plus,
  CheckCircle2,
  XCircle,
  Globe,
  GitBranch,
  RefreshCw,
  Loader2,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const SEVERITY_META = {
  minor: { labelBn: 'সামান্য', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  major: { labelBn: 'গুরুত্বপূর্ণ', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  critical: { labelBn: 'গুরুতর তথ্যভ্রান্তি', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' }
};

const INITIAL_REQUEST_FORM = {
  news_id: '',
  correction_type: 'factual_error',
  severity: 'major',
  incorrect_text: '',
  corrected_text: '',
  public_note: '',
  internal_reason: '',
  show_public_note: true
};

export default function AdminCorrectionsPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canRequest = hasEffectivePermission(authState, adminState, 'correction.request');
  const canApprove = hasEffectivePermission(authState, adminState, 'correction.approve');

  const [statusFilter, setStatusFilter] = useState('');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState(INITIAL_REQUEST_FORM);

  const [reviewItem, setReviewItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    decision: 'published',
    public_note: '',
    internal_reason: '',
    show_public_note: true,
    updated_title: '',
    updated_content: ''
  });

  const { data: correctionsData, isLoading, isFetching, refetch } = useGetNewsCorrectionsQuery({
    status: statusFilter || undefined,
    per_page: 50
  });

  const { data: adminNewsData } = useGetAdminNewsListQuery(
    { per_page: 50 },
    { skip: !requestModalOpen }
  );

  const [createCorrection, { isLoading: isSubmitting }] = useCreateCorrectionRequestMutation();
  const [reviewCorrection, { isLoading: isReviewing }] = useReviewNewsCorrectionMutation();
  const [publishCorrection, { isLoading: isPublishing }] = usePublishNewsCorrectionMutation();

  const corrections = useMemo(() => correctionsData?.items || [], [correctionsData]);
  const newsOptions = adminNewsData?.items || [];

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.news_id) {
      await sweetAlert.error('সংবাদ নির্বাচন', 'সংশোধনী অনুরোধের জন্য একটি সংবাদ নির্বাচন করুন।');
      return;
    }

    try {
      await createCorrection({
        news_id: Number(requestForm.news_id),
        correction_type: requestForm.correction_type,
        severity: requestForm.severity,
        incorrect_text: requestForm.incorrect_text.trim() || null,
        corrected_text: requestForm.corrected_text.trim() || null,
        public_note: requestForm.public_note.trim() || null,
        internal_reason: requestForm.internal_reason.trim() || null,
        show_public_note: Boolean(requestForm.show_public_note)
      }).unwrap();
      await sweetAlert.success('অনুরোধ জমা হয়েছে', 'সংবাদ সংশোধনী অনুরোধ সম্পাদকের পর্যালোচনার জন্য পাঠানো হয়েছে।');
      setRequestModalOpen(false);
      setRequestForm(INITIAL_REQUEST_FORM);
    } catch (err) {
      await sweetAlert.error('জমা ব্যর্থ', extractApiError(err, 'সংশোধনী অনুরোধ তৈরি করা যায়নি।'));
    }
  };

  const openReviewModal = (item) => {
    setReviewItem(item);
    setReviewForm({
      decision: 'published',
      public_note: item.public_note || '',
      internal_reason: item.internal_reason || '',
      show_public_note: item.show_public_note ?? true,
      updated_title: '',
      updated_content: ''
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewItem) return;

    const payload = {
      id: reviewItem.id,
      decision: reviewForm.decision,
      public_note: reviewForm.public_note.trim() || null,
      internal_reason: reviewForm.internal_reason.trim() || null,
      show_public_note: Boolean(reviewForm.show_public_note)
    };

    if (reviewForm.updated_title.trim()) {
      payload.updated_title = reviewForm.updated_title.trim();
    }
    if (reviewForm.updated_content.trim()) {
      payload.updated_content = reviewForm.updated_content.trim();
    }

    try {
      await reviewCorrection(payload).unwrap();
      await sweetAlert.success(
        'সিদ্ধান্ত কার্যকর হয়েছে',
        reviewForm.decision === 'rejected'
          ? 'সংশোধনী অনুরোধ প্রত্যাখ্যান করা হয়েছে।'
          : 'সংশোধনী অনুমোদিত হয়ে রিভিশন ইতিহাস সংরক্ষিত হয়েছে।'
      );
      setReviewItem(null);
    } catch (err) {
      await sweetAlert.error('পর্যালোচনা ব্যর্থ', extractApiError(err, 'সিদ্ধান্ত সংরক্ষণ করা যায়নি।'));
    }
  };

  const handlePublishNote = async (item) => {
    try {
      await publishCorrection({
        id: item.id,
        public_note: item.public_note || undefined
      }).unwrap();
      await sweetAlert.success('প্রকাশিত', 'পাবলিক সংশোধনী নোটটি এখন সংবাদ পাতায় দৃশ্যমান হবে।');
    } catch (err) {
      await sweetAlert.error('প্রকাশ ব্যর্থ', extractApiError(err, 'পাবলিক নোট প্রকাশ করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-serif-bn text-stone-900">
              সংবাদ সংশোধনী ও রিভিশন ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              তথ্য সংশোধন অনুরোধ, সম্পাদকীয় অনুমোদন, স্বয়ংক্রিয় রিভিশন ইতিহাস ও পাবলিক কারেকশন নোট ({formatBnCount(corrections.length)}টি)
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
            {canRequest && (
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সংশোধনী অনুরোধ</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          {[
            { key: '', label: 'সকল' },
            { key: 'pending', label: 'পর্যালোচনাধীন' },
            { key: 'approved', label: 'অনুমোদিত' },
            { key: 'published', label: 'প্রকাশিত নোট' },
            { key: 'rejected', label: 'প্রত্যাখ্যাত' }
          ].map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                statusFilter === tab.key
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corrections List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin text-rose-700" />
          <span>সংশোধনী তালিকা লোড হচ্ছে...</span>
        </div>
      ) : corrections.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-sm text-stone-500">
          এই অবস্থায় কোনো সংশোধনী অনুরোধ নেই।
        </div>
      ) : (
        <div className="space-y-4">
          {corrections.map((item) => {
            const stMeta = CORRECTION_STATUS_META[item.status] || CORRECTION_STATUS_META.pending;
            const sevMeta = SEVERITY_META[item.severity] || SEVERITY_META.minor;

            return (
              <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${stMeta.badgeClass}`}>
                        {stMeta.labelBn}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${sevMeta.badgeClass}`}>
                        {sevMeta.labelBn}
                      </span>
                      <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        {CORRECTION_TYPE_LABELS[item.correction_type] || item.correction_type}
                      </span>
                      {item.revision && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          <GitBranch className="w-3 h-3" />
                          <span>রিভিশন #{formatBnCount(item.revision.revision_number)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-serif-bn text-stone-900">
                        {item.news?.title || `সংবাদ #${item.news_id}`}
                      </h3>
                      {item.news?.slug && (
                        <Link
                          to={`/news/${item.news.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-700 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-500">
                      অনুরোধকারী: <strong className="text-stone-700">{item.requester?.name || 'নিউজরুম সদস্য'}</strong> • {formatDateTimeBn(item.created_at)}
                      {item.reviewer?.name && (
                        <> • পর্যালোচক: <strong className="text-stone-700">{item.reviewer.name}</strong></>
                      )}
                    </p>
                  </div>

                  {canApprove && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>পর্যালোচনা ও অনুমোদন</span>
                        </button>
                      )}
                      {item.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handlePublishNote(item)}
                          disabled={isPublishing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>পাবলিক নোট প্রকাশ করুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Before / After Diff Comparison */}
                {(item.incorrect_text || item.corrected_text) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 space-y-1">
                      <div className="font-bold text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>পূর্ববর্তী / ত্রুটিপূর্ণ অংশ</span>
                      </div>
                      <p className="text-stone-700 whitespace-pre-line">{item.incorrect_text || 'উল্লেখ নেই'}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 space-y-1">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>সংশোধিত পাঠ্য</span>
                      </div>
                      <p className="text-stone-800 whitespace-pre-line">{item.corrected_text || 'উল্লেখ নেই'}</p>
                    </div>
                  </div>
                )}

                {/* Public Note & Internal Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {item.public_note && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                      <div className="font-bold text-sky-900 mb-1 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>প্রকাশিতব্য পাবলিক সংশোধনী নোট</span>
                      </div>
                      <p className="text-stone-800 whitespace-pre-line">{item.public_note}</p>
                    </div>
                  )}
                  {item.internal_reason && (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                      <div className="font-bold text-stone-700 mb-1 flex items-center gap-1">
                        <FileWarning className="w-3.5 h-3.5" />
                        <span>অভ্যন্তরীণ সম্পাদকীয় কারণ (অপ্রকাশ্য)</span>
                      </div>
                      <p className="text-stone-600 whitespace-pre-line">{item.internal_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Correction Request Modal */}
      {requestModalOpen && (
        <MotionOverlay isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                নতুন সংবাদ সংশোধনী অনুরোধ
              </h3>
              <button type="button" onClick={() => setRequestModalOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সংবাদ নিবন্ধ নির্বাচন *</label>
                <select
                  required
                  value={requestForm.news_id}
                  onChange={(e) => setRequestForm({ ...requestForm, news_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">-- সংশোধনযোগ্য সংবাদ নির্বাচন করুন --</option>
                  {newsOptions.map((n) => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সংশোধনীর ধরন</label>
                  <select
                    value={requestForm.correction_type}
                    onChange={(e) => setRequestForm({ ...requestForm, correction_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(CORRECTION_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">গুরুত্বের মাত্রা</label>
                  <select
                    value={requestForm.severity}
                    onChange={(e) => setRequestForm({ ...requestForm, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(SEVERITY_META).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.labelBn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পূর্ববর্তী ভুল তথ্য</label>
                  <textarea
                    rows={3}
                    value={requestForm.incorrect_text}
                    onChange={(e) => setRequestForm({ ...requestForm, incorrect_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সঠিক তথ্য / প্রস্তাবিত পাঠ্য</label>
                  <textarea
                    rows={3}
                    value={requestForm.corrected_text}
                    onChange={(e) => setRequestForm({ ...requestForm, corrected_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">প্রস্তাবিত পাবলিক সংশোধনী নোট</label>
                <textarea
                  rows={2}
                  value={requestForm.public_note}
                  onChange={(e) => setRequestForm({ ...requestForm, public_note: e.target.value })}
                  placeholder="পাঠকদের জন্য সংবাদ পাতায় প্রদর্শিত ব্যাখ্যা..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">অভ্যন্তরীণ কারণ (শুধুমাত্র নিউজরুমের জন্য)</label>
                <textarea
                  rows={2}
                  value={requestForm.internal_reason}
                  onChange={(e) => setRequestForm({ ...requestForm, internal_reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestForm.show_public_note}
                  onChange={(e) => setRequestForm({ ...requestForm, show_public_note: e.target.checked })}
                  className="rounded border-stone-300 text-rose-700 focus:ring-rose-600"
                />
                <span>অনুমোদনের পর সংবাদ পাতায় পাবলিক কারেকশন নোট প্রদর্শন করুন</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>অনুরোধ জমা দিন</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}

      {/* Editor Review & Revision Modal */}
      {reviewItem && (
        <MotionOverlay isOpen={Boolean(reviewItem)} onClose={() => setReviewItem(null)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                সংশোধনী পর্যালোচনা ও অনুমোদন
              </h3>
              <button type="button" onClick={() => setReviewItem(null)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-3">
                সংবাদ: <strong className="text-stone-900">{reviewItem.news?.title || `#${reviewItem.news_id}`}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সম্পাদকীয় সিদ্ধান্ত *</label>
                <select
                  value={reviewForm.decision}
                  onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="published">অনুমোদন ও পাবলিক নোট প্রকাশ করুন</option>
                  <option value="approved">শুধু অনুমোদন ও রিভিশন সংরক্ষণ করুন (এখনো অপ্রকাশিত)</option>
                  <option value="rejected">প্রত্যাখ্যান করুন</option>
                </select>
              </div>

              {reviewForm.decision !== 'rejected' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">পাবলিক সংশোধনী নোট (পাঠক দেখতে পাবেন)</label>
                    <textarea
                      rows={3}
                      value={reviewForm.public_note}
                      onChange={(e) => setReviewForm({ ...reviewForm, public_note: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" />
                      <span>মূল সংবাদে তাৎক্ষণিক পরিবর্তন ও রিভিশন তৈরি (ঐচ্ছিক)</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">সংশোধিত শিরোনাম (যদি পরিবর্তন হয়)</label>
                      <input
                        type="text"
                        value={reviewForm.updated_title}
                        onChange={(e) => setReviewForm({ ...reviewForm, updated_title: e.target.value })}
                        placeholder="অপরিবর্তিত রাখতে ফাঁকা রাখুন"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">সংশোধিত মূল প্রতিবেদন (HTML/Text)</label>
                      <textarea
                        rows={3}
                        value={reviewForm.updated_content}
                        onChange={(e) => setReviewForm({ ...reviewForm, updated_content: e.target.value })}
                        placeholder="অপরিবর্তিত রাখতে ফাঁকা রাখুন; নতুন পাঠ্য দিলে স্বয়ংক্রিয়ভাবে NewsRevision তৈরি হবে"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">অভ্যন্তরীণ মন্তব্য</label>
                <textarea
                  rows={2}
                  value={reviewForm.internal_reason}
                  onChange={(e) => setReviewForm({ ...reviewForm, internal_reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {isReviewing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>সিদ্ধান্ত সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}
    </div>
  );
}


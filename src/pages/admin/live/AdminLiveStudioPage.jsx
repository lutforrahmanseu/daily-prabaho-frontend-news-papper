import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Edit3,
  ExternalLink,
  History,
  ImagePlus,
  PauseCircle,
  Pin,
  Play,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  StopCircle,
  Trash2,
  Video,
  X
} from 'lucide-react';
import {
  useApproveLiveUpdateMutation,
  useCreateLiveUpdateMutation,
  useDeleteLiveUpdateMutation,
  useGetAdminLiveBlogQuery,
  useRetractLiveUpdateMutation,
  useTogglePinLiveUpdateMutation,
  useTransitionLiveBlogMutation,
  useUpdateLiveUpdateMutation
} from '../../../store/api/liveCoverageApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import {
  LIVE_UPDATE_TYPE_META,
  REVISION_ACTION_LABELS,
  UPDATE_STATUS_META,
  formatBengaliFullDateTime,
  formatLiveTimestampBadge
} from '../../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { normalizeMediaUrl } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { LiveBadgePill } from '../../../components/live/LiveCoverageShared.jsx';

export function AdminLiveStudioPage() {
  const { id } = useParams();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canPublish = hasEffectivePermission(authState, adminState, 'live.publish');

  const { data: blog, isLoading, refetch } = useGetAdminLiveBlogQuery(id, { skip: !id });
  const { data: mediaData } = useGetMediaListQuery({ per_page: 24 });

  const [transitionLiveBlog] = useTransitionLiveBlogMutation();
  const [createLiveUpdate, { isLoading: isPosting }] = useCreateLiveUpdateMutation();
  const [approveLiveUpdate] = useApproveLiveUpdateMutation();
  const [updateLiveUpdate, { isLoading: isUpdating }] = useUpdateLiveUpdateMutation();
  const [togglePinLiveUpdate] = useTogglePinLiveUpdateMutation();
  const [retractLiveUpdate] = useRetractLiveUpdateMutation();
  const [deleteLiveUpdate] = useDeleteLiveUpdateMutation();

  const [composer, setComposer] = useState({
    update_type: 'update',
    title: '',
    content: '',
    is_key_event: false,
    is_pinned: false,
    notify_readers: true
  });
  const [attachments, setAttachments] = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [customAttUrl, setCustomAttUrl] = useState('');
  const [customAttType, setCustomAttType] = useState('image');
  const [customAttCaption, setCustomAttCaption] = useState('');

  // Edit / Correction modal state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    update_type: 'update',
    mark_as_correction: true,
    correction_note: '',
    change_note: ''
  });

  // Revisions inspector modal
  const [revisionEntry, setRevisionEntry] = useState(null);

  const mediaAssets = mediaData?.items || [];
  const updates = useMemo(() => (Array.isArray(blog?.updates) ? blog.updates : []), [blog]);
  const pendingUpdates = useMemo(() => updates.filter((u) => u.status === 'pending_approval'), [updates]);
  const feedUpdates = useMemo(() => updates.filter((u) => u.status !== 'pending_approval'), [updates]);

  const handleLifecycle = async (action, label) => {
    const confirmRes = await sweetAlert.confirm(`${label} নিশ্চিত করুন`, `"${blog?.title}" এ অ্যাকশন প্রয়োগ করতে চান?`);
    if (!confirmRes.isConfirmed) return;

    try {
      await transitionLiveBlog({
        id: blog.id,
        action,
        wrap_up_note: action === 'end' ? 'সম্পাদকীয় ডেস্ক কর্তৃক এই ঘটনার সরাসরি কভারেজ সমাপ্ত করা হলো।' : undefined
      }).unwrap();
      sweetAlert.success('সফল হয়েছে', `লাইভ কভারেজ "${label}" সম্পন্ন।`);
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'অ্যাকশন সম্পন্ন করা যায়নি।');
    }
  };

  const handleAddMediaAttachment = (item) => {
    const isVideo = item.type === 'video' || (item.mime_type || '').startsWith('video');
    setAttachments((prev) => [
      ...prev,
      {
        media_id: item.id,
        type: isVideo ? 'video' : 'image',
        url: item.url,
        caption: item.caption || item.title || '',
        credit: item.credit || ''
      }
    ]);
    setShowMediaPicker(false);
  };

  const handleAddCustomAttachment = () => {
    if (!customAttUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        type: customAttType,
        url: customAttUrl.trim(),
        caption: customAttCaption.trim() || undefined
      }
    ]);
    setCustomAttUrl('');
    setCustomAttCaption('');
  };

  const handlePublishUpdate = async (e) => {
    e.preventDefault();
    if (!composer.content.trim()) {
      sweetAlert.warning('মূল বিবরণ দিন', 'লাইভ আপডেটের মূল লেখা খালি রাখা যাবে না।');
      return;
    }

    try {
      const created = await createLiveUpdate({
        blogId: blog.id,
        ...composer,
        is_pinned: canPublish ? composer.is_pinned : false,
        attachments
      }).unwrap();

      setComposer({
        update_type: 'update',
        title: '',
        content: '',
        is_key_event: false,
        is_pinned: false,
        notify_readers: true
      });
      setAttachments([]);

      sweetAlert.success(
        created?.status === 'published' ? 'লাইভ আপডেট প্রকাশিত' : 'অনুমোদনের জন্য জমা হয়েছে',
        created?.status === 'published'
          ? 'রিয়েল-টাইম ফিডে আপডেটটি যুক্ত হয়েছে।'
          : 'সম্পাদকীয় অনুমোদনের পর এটি পাবলিক ফিডে দৃশ্যমান হবে।'
      );
    } catch (err) {
      sweetAlert.error('প্রকাশ ব্যর্থ হয়েছে', err?.data?.message || 'দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleApproveEntry = async (entry) => {
    try {
      await approveLiveUpdate({ blogId: blog.id, updateId: entry.id }).unwrap();
      sweetAlert.success('অনুমোদিত ও প্রকাশিত', 'প্রতিবেদকের আপডেটটি লাইভ ফিডে যুক্ত হয়েছে।');
    } catch (err) {
      sweetAlert.error('অনুমোদন ব্যর্থ', err?.data?.message || 'অনুমতি যাচাই করুন।');
    }
  };

  const handleTogglePin = async (entry) => {
    try {
      await togglePinLiveUpdate({ blogId: blog.id, updateId: entry.id, is_pinned: !entry.is_pinned }).unwrap();
      sweetAlert.success(entry.is_pinned ? 'পিন সরানো হয়েছে' : 'গুরুত্বপূর্ণ হিসেবে পিন করা হয়েছে');
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'পিন পরিবর্তন করা যায়নি।');
    }
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      title: entry.title || '',
      content: entry.content || '',
      update_type: entry.update_type || 'update',
      mark_as_correction: true,
      correction_note: entry.correction_note || '',
      change_note: ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.content.trim()) return;
    try {
      await updateLiveUpdate({
        blogId: blog.id,
        updateId: editingEntry.id,
        ...editForm
      }).unwrap();
      setEditingEntry(null);
      sweetAlert.success('সংশোধন সংরক্ষিত হয়েছে', 'রিভিশন ইতিহাসে পরিবর্তনটি নথিভুক্ত হয়েছে।');
    } catch (err) {
      sweetAlert.error('সংশোধন ব্যর্থ', err?.data?.message || 'দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleRetractEntry = async (entry) => {
    const res = await sweetAlert.confirm(
      'আপডেট প্রত্যাহার করবেন?',
      'প্রত্যাহার করলে পাবলিক ফিডে মূল লেখা সরিয়ে স্বচ্ছ প্রত্যাহার নোট প্রদর্শিত হবে।'
    );
    if (!res.isConfirmed) return;

    try {
      await retractLiveUpdate({
        blogId: blog.id,
        updateId: entry.id,
        reason: 'তথ্যগত যাচাই-বাছাই শেষে সম্পাদকীয় ডেস্ক কর্তৃক প্রত্যাহারকৃত।'
      }).unwrap();
      sweetAlert.success('প্রত্যাহার হয়েছে', 'রিভিশন লগে কারণ সংরক্ষিত হয়েছে।');
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'প্রত্যাহার করা যায়নি।');
    }
  };

  const handleDeleteEntry = async (entry) => {
    const res = await sweetAlert.confirmDelete(entry.title || 'এই লাইভ আপডেট');
    if (!res.isConfirmed) return;

    try {
      await deleteLiveUpdate({
        blogId: blog.id,
        updateId: entry.id,
        reason: 'অ্যাডমিন স্টুডিও থেকে অপসারণ করা হয়েছে'
      }).unwrap();
      sweetAlert.success('মুছে ফেলা হয়েছে', 'অডিট ইতিহাসে মুছে ফেলার রেকর্ড সংরক্ষিত থাকবে।');
    } catch (err) {
      sweetAlert.error('মুছে ফেলা ব্যর্থ', err?.data?.message || 'অনুমতি নেই।');
    }
  };

  if (isLoading || !blog) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
        <div className="h-72 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Top Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/live-desk"
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-rose-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>লাইভ ডেস্ক তালিকা</span>
            </Link>
            <LiveBadgePill status={blog.status} size="sm" />
            <span className="text-[11px] text-stone-400">ভার্সন #{toBengaliNumber(blog.stream_version || 1)}</span>
          </div>
          <h1 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {blog.title}
          </h1>
          <p className="text-xs text-stone-500">
            {blog.requires_editorial_approval
              ? 'সম্পাদকীয় অনুমোদন নিয়ম সক্রিয়: প্রতিবেদকদের পোস্ট অনুমোদনের পর লাইভ হবে।'
              : 'তাৎক্ষণিক প্রকাশনা সক্রিয়।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPublish && ['draft', 'submitted'].includes(blog.status) && (
            <button
              type="button"
              onClick={() => handleLifecycle('approve', 'অনুমোদন')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>অনুমোদন</span>
            </button>
          )}
          {canPublish && ['submitted', 'approved', 'paused', 'draft'].includes(blog.status) && (
            <button
              type="button"
              onClick={() => handleLifecycle('start', 'লাইভ শুরু')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>সরাসরি শুরু করুন</span>
            </button>
          )}
          {canPublish && blog.status === 'live' && (
            <>
              <button
                type="button"
                onClick={() => handleLifecycle('pause', 'বিরতি')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-100 text-orange-800 text-xs font-bold cursor-pointer"
              >
                <PauseCircle className="w-4 h-4" />
                <span>বিরতি</span>
              </button>
              <button
                type="button"
                onClick={() => handleLifecycle('end', 'সমাপ্তি')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>সম্প্রচার সমাপ্ত</span>
              </button>
            </>
          )}
          <Link
            to={`/live/${blog.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>পাবলিক লাইভ পাতা</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Composer + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Update Composer */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handlePublishUpdate}
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4 sticky top-20"
          >
            <h2 className="font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-700" />
              <span>নতুন লাইভ আপডেট প্রকাশ</span>
            </h2>

            {!canPublish && blog.requires_editorial_approval && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>আপনার পোস্টটি সম্পাদকের অনুমোদনের পর সরাসরি ফিডে যুক্ত হবে।</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">আপডেটের ধরন</label>
                <select
                  value={composer.update_type}
                  onChange={(e) => setComposer((s) => ({ ...s, update_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm"
                >
                  {Object.values(LIVE_UPDATE_TYPE_META).map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end gap-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composer.is_key_event}
                    onChange={(e) => setComposer((s) => ({ ...s, is_key_event: e.target.checked }))}
                  />
                  <span>মূল ঘটনা (Key Event)</span>
                </label>
                {canPublish && (
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={composer.is_pinned}
                      onChange={(e) => setComposer((s) => ({ ...s, is_pinned: e.target.checked }))}
                    />
                    <span>শীর্ষে পিন করুন</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                সংক্ষিপ্ত শিরোনাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={composer.title}
                onChange={(e) => setComposer((s) => ({ ...s, title: e.target.value }))}
                placeholder="যেমন: সংবাদ সম্মেলনে মূল ঘোষণা"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                মূল আপডেট বিবরণ *
              </label>
              <textarea
                rows={4}
                required
                value={composer.content}
                onChange={(e) => setComposer((s) => ({ ...s, content: e.target.value }))}
                placeholder="মাঠ পর্যায়ের সর্বশেষ তথ্য স্পষ্টভাবে লিখুন..."
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              />
            </div>

            {/* Photo & Video Attachments */}
            <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">ছবি বা ভিডিও সংযুক্তি</span>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-bold hover:bg-stone-200 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-rose-700" />
                  <span>মিডিয়া লাইব্রেরি</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <select
                  value={customAttType}
                  onChange={(e) => setCustomAttType(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
                >
                  <option value="image">ছবি URL</option>
                  <option value="video">ভিডিও URL</option>
                </select>
                <input
                  type="url"
                  value={customAttUrl}
                  onChange={(e) => setCustomAttUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAttachment}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {customAttUrl && (
                <input
                  type="text"
                  value={customAttCaption}
                  onChange={(e) => setCustomAttCaption(e.target.value)}
                  placeholder="ছবির/ভিডিও ক্যাপশন (ঐচ্ছিক)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
                />
              )}

              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((att, idx) => (
                    <div
                      key={`${att.url}-${idx}`}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        {att.type === 'video' ? <Video className="w-3.5 h-3.5 text-sky-600" /> : <Camera className="w-3.5 h-3.5 text-rose-600" />}
                        <span className="truncate">{att.caption || att.url}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments((p) => p.filter((_, i) => i !== idx))}
                        className="text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showMediaPicker && (
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {mediaAssets.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddMediaAttachment(item)}
                      className="rounded-lg overflow-hidden border border-stone-200 hover:border-rose-500 aspect-video bg-stone-900 cursor-pointer"
                    >
                      <img
                        src={normalizeMediaUrl(item.url)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={composer.notify_readers}
                  onChange={(e) => setComposer((s) => ({ ...s, notify_readers: e.target.checked }))}
                />
                <span>পাঠক অ্যালার্ট পাঠান</span>
              </label>

              <button
                type="submit"
                disabled={isPosting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{canPublish ? 'প্রকাশ করুন' : 'জমা দিন'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Approval Queue + Feed Entries */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pending Editorial Approval Queue */}
          {pendingUpdates.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>সম্পাদকীয় অনুমোদনের অপেক্ষায় ({toBengaliNumber(pendingUpdates.length)})</span>
              </h3>

              {pendingUpdates.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                    <span>প্রেরক: <strong className="text-stone-800 dark:text-stone-200">{entry.author?.name}</strong></span>
                    <span>{formatLiveTimestampBadge(entry.created_at)}</span>
                  </div>
                  {entry.title && <h4 className="font-serif-bn font-bold text-base">{entry.title}</h4>}
                  <p className="text-sm text-stone-700 dark:text-stone-300">{entry.content}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => handleApproveEntry(entry)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>অনুমোদন ও প্রকাশ</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(entry)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Published / Active Updates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100">
                ফিড তালিকা ও মডারেশন ({toBengaliNumber(feedUpdates.length)})
              </h2>
              <button
                type="button"
                onClick={refetch}
                className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
              >
                রিফ্রেশ
              </button>
            </div>

            {feedUpdates.map((entry) => {
              const statusMeta = UPDATE_STATUS_META[entry.status] || UPDATE_STATUS_META.published;
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                      {entry.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-700 text-white text-[11px] font-bold">
                          <Pin className="w-3 h-3" />
                          <span>পিনকৃত</span>
                        </span>
                      )}
                      <span className="text-xs text-stone-500">
                        {formatLiveTimestampBadge(entry.published_at || entry.created_at)} • {entry.author?.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRevisionEntry(entry)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-rose-700 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>ইতিহাস ({toBengaliNumber(entry.revisions?.length || 0)})</span>
                    </button>
                  </div>

                  {entry.title && <h3 className="font-serif-bn font-bold text-base">{entry.title}</h3>}
                  <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">{entry.content}</p>

                  {entry.correction_note && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-amber-900 dark:text-amber-200">
                      <strong>সংশোধনী:</strong> {entry.correction_note}
                    </div>
                  )}

                  {entry.deleted_at && (
                    <div className="text-xs bg-rose-50 text-rose-700 rounded-lg px-3 py-2">
                      মুছে ফেলা হয়েছে: {entry.deleted_reason || formatBengaliFullDateTime(entry.deleted_at)}
                    </div>
                  )}

                  {!entry.deleted_at && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                      {canPublish && entry.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(entry)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            entry.is_pinned
                              ? 'bg-rose-700 text-white border-rose-700'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{entry.is_pinned ? 'পিন সরান' : 'পিন করুন'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(entry)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>সংশোধন / সম্পাদনা</span>
                      </button>

                      {canPublish && entry.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => handleRetractEntry(entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer"
                        >
                          <span>প্রত্যাহার</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit / Correction Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif-bn font-extrabold text-base">আপডেট সংশোধন ও রিভিশন নথিভুক্তি</h3>
              <button type="button" onClick={() => setEditingEntry(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">শিরোনাম</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">মূল পাঠ *</label>
                <textarea
                  rows={4}
                  required
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.mark_as_correction}
                  onChange={(e) => setEditForm((f) => ({ ...f, mark_as_correction: e.target.checked }))}
                />
                <span>পাবলিক সংশোধনী (Correction Notice) হিসেবে চিহ্নিত করুন</span>
              </label>
              {editForm.mark_as_correction && (
                <div>
                  <label className="block text-xs font-bold mb-1">সংশোধনী নোট (পাঠকরা দেখতে পাবেন)</label>
                  <input
                    type="text"
                    value={editForm.correction_note}
                    onChange={(e) => setEditForm((f) => ({ ...f, correction_note: e.target.value }))}
                    placeholder="যেমন: সর্বশেষ সরকারি তথ্য অনুযায়ী সংখ্যা সংশোধন করা হলো"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1">অভ্যন্তরীণ পরিবর্তন নোট</label>
                <input
                  type="text"
                  value={editForm.change_note}
                  onChange={(e) => setEditForm((f) => ({ ...f, change_note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button type="button" onClick={() => setEditingEntry(null)} className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer">
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isUpdating ? 'সংরক্ষণ হচ্ছে...' : 'সংশোধন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revisions Inspector Modal */}
      {revisionEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif-bn font-extrabold text-base flex items-center gap-2">
                <History className="w-4 h-4 text-rose-700" />
                <span>অপরিবর্তনীয় রিভিশন ইতিহাস</span>
              </h3>
              <button type="button" onClick={() => setRevisionEntry(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {(revisionEntry.revisions || []).length === 0 ? (
                <p className="text-xs text-stone-500">কোনো রিভিশন পাওয়া যায়নি।</p>
              ) : (
                revisionEntry.revisions.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>#{toBengaliNumber(rev.revision_number)} • {REVISION_ACTION_LABELS[rev.action] || rev.action}</span>
                      <span className="text-stone-500">{formatBengaliFullDateTime(rev.created_at)}</span>
                    </div>
                    {rev.actor?.name && <div className="text-stone-500">সম্পাদনাকারী: {rev.actor.name}</div>}
                    {rev.change_note && <div className="text-stone-700 dark:text-stone-200">{rev.change_note}</div>}
                    {rev.previous_content && (
                      <div className="p-2 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500">
                        পূর্বের পাঠ: {rev.previous_content}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLiveStudioPage;


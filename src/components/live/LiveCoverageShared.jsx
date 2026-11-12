import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Info,
  Pin,
  PlayCircle,
  Sparkles,
  UserCheck,
  Video,
  X
} from 'lucide-react';
import {
  LIVE_BLOG_STATUS_META,
  LIVE_UPDATE_TYPE_META,
  REVISION_ACTION_LABELS,
  formatBengaliFullDateTime,
  formatLiveTimestampBadge,
  getSubscriberStorageKey,
  parseVideoEmbedUrl
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function LiveBadgePill({ status = 'live', size = 'md' }) {
  const isLive = status === 'live';
  const meta = LIVE_BLOG_STATUS_META[status] || LIVE_BLOG_STATUS_META.draft;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${paddingClass} ${meta.badgeClass}`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      <span>{meta.label}</span>
    </span>
  );
}

/**
 * Shared media lightbox & video modal viewer.
 */
export function MediaLightboxModal({ media, onClose }) {
  if (!media) return null;
  const isVideo = media.type === 'video' || Boolean(media.video_url);
  const videoSpec = isVideo ? parseVideoEmbedUrl(media.video_url || media.url) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl bg-stone-950 rounded-xl border border-stone-800 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 text-stone-200">
          <span className="text-sm font-semibold truncate pr-4">
            {media.caption || media.title || 'মিডিয়া প্রদর্শনী'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black flex items-center justify-center max-h-[75vh]">
          {isVideo ? (
            videoSpec?.kind === 'iframe' ? (
              <div className="w-full aspect-video">
                <iframe
                  src={videoSpec.src}
                  title={media.caption || media.title || 'ভিডিও'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={normalizeMediaUrl(videoSpec?.src || media.url)}
                poster={media.thumbnail_url ? normalizeMediaUrl(media.thumbnail_url) : undefined}
                controls
                autoPlay
                className="w-full max-h-[75vh]"
              />
            )
          ) : (
            <img
              src={normalizeMediaUrl(media.media_url || media.url)}
              alt={media.caption || media.title || 'সংযুক্ত ছবি'}
              className="max-h-[72vh] w-auto object-contain"
            />
          )}
        </div>

        {(media.caption || media.credit) && (
          <div className="px-4 py-2.5 bg-stone-900 border-t border-stone-800 text-xs text-stone-300 flex flex-wrap justify-between gap-2">
            <span>{media.caption}</span>
            {media.credit && <span className="text-stone-400">সূত্র/চিত্রগ্রাহক: {media.credit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reader subscription bar (backend DB subscription + optional Web Notification API alert).
 */
export function ReaderNotificationPanel({
  targetType,
  slug,
  subscribersCount = 0,
  onSubscribe,
  isSubscribing = false,
  enableBrowserPush,
  onToggleBrowserPush
}) {
  const storageKey = getSubscriberStorageKey(targetType, slug);
  const [savedSub, setSavedSub] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [breakingOnly, setBreakingOnly] = useState(Boolean(savedSub?.notify_on_breaking_only));
  const [count, setCount] = useState(Number(subscribersCount) || 0);

  const isSubscribed = Boolean(savedSub?.is_active);

  const handleToggleSubscription = async () => {
    try {
      const nextActive = !isSubscribed;
      const result = await onSubscribe({
        slug,
        subscriber_token: savedSub?.subscriber_token || undefined,
        channel: 'in_app',
        notify_on_breaking_only: breakingOnly,
        active: nextActive
      }).unwrap();

      const nextRecord = {
        subscriber_token: result.subscriber_token,
        is_active: Boolean(result.is_active),
        notify_on_breaking_only: Boolean(result.notify_on_breaking_only)
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(nextRecord));
      }
      setSavedSub(nextRecord);
      if (typeof result.subscribers_count === 'number') {
        setCount(result.subscribers_count);
      }

      if (nextRecord.is_active && onToggleBrowserPush && !enableBrowserPush) {
        await onToggleBrowserPush(true, { silentIfDenied: true });
      }

      sweetAlert.success(
        nextRecord.is_active ? 'লাইভ অ্যালার্ট চালু হয়েছে' : 'লাইভ অ্যালার্ট বন্ধ হয়েছে',
        nextRecord.is_active
          ? 'নতুন আপডেট প্রকাশিত হলে আপনি তাৎক্ষণিক বার্তা পাবেন।'
          : 'এই কাভারেজের অ্যালার্ট সাময়িকভাবে বন্ধ রাখা হয়েছে।'
      );
    } catch (err) {
      sweetAlert.error('অ্যালার্ট সেটিংস ব্যর্থ হয়েছে', err?.data?.message || 'আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5">
      <button
        type="button"
        onClick={handleToggleSubscription}
        disabled={isSubscribing}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
          isSubscribed
            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
            : 'bg-rose-700 hover:bg-rose-800 text-white'
        } disabled:opacity-60`}
      >
        {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
        <span>{isSubscribed ? 'অ্যালার্ট চালু আছে' : 'সরাসরি অ্যালার্ট পান'}</span>
      </button>

      {targetType === 'live_blog' && (
        <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={breakingOnly}
            onChange={(e) => setBreakingOnly(e.target.checked)}
            className="rounded border-stone-300 text-rose-700 focus:ring-rose-500"
          />
          <span>শুধু ব্রেকিং অ্যালার্ট</span>
        </label>
      )}

      {onToggleBrowserPush && (
        <button
          type="button"
          onClick={() => onToggleBrowserPush(!enableBrowserPush)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
            enableBrowserPush
              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
              : 'bg-white text-stone-600 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
          }`}
        >
          <span>{enableBrowserPush ? 'ডেস্কটপ পপ-আপ সক্রিয়' : 'ডেস্কটপ অ্যালার্ট'}</span>
        </button>
      )}

      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 ml-auto">
        অনুসারী পাঠক: <strong className="text-stone-800 dark:text-stone-200">{toBengaliNumber(count)}</strong>
      </span>
    </div>
  );
}

/**
 * Single Live Update Card with attachments, author meta, correction notice, and revision drawer toggle.
 */
export function LiveUpdateCard({ update, showAuthorAvatars = true, onOpenMedia }) {
  const [showRevisions, setShowRevisions] = useState(false);

  const typeMeta = LIVE_UPDATE_TYPE_META[update.update_type] || LIVE_UPDATE_TYPE_META.update;
  const isRetracted = update.status === 'retracted';
  const attachments = Array.isArray(update.attachments) ? update.attachments : [];
  const revisions = Array.isArray(update.revisions) ? update.revisions : [];
  const hasCorrectionOrEdit = Boolean(update.correction_note) || Boolean(update.edited_at) || isRetracted;

  return (
    <article
      id={`live-update-${update.id}`}
      className={`rounded-xl border p-4 sm:p-5 transition-colors ${
        update.is_pinned
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
          : isRetracted
            ? 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 opacity-90'
            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
      }`}
    >
      {/* Header Row: Timestamp + Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <time
            dateTime={update.published_at || update.created_at}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatLiveTimestampBadge(update.published_at || update.created_at)}</span>
          </time>

          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${typeMeta.badgeClass}`}>
            {typeMeta.label}
          </span>

          {update.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-700 text-white">
              <Pin className="w-3 h-3" />
              <span>গুরুত্বপূর্ণ পিন</span>
            </span>
          )}

          {update.is_key_event && !update.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Sparkles className="w-3 h-3" />
              <span>মূল ঘটনা</span>
            </span>
          )}
        </div>

        {hasCorrectionOrEdit && revisions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowRevisions((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>সংশোধন ইতিহাস ({toBengaliNumber(revisions.length)})</span>
          </button>
        )}
      </div>

      {/* Headline */}
      {update.title && (
        <h3 className="font-serif-bn text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 leading-snug">
          {update.title}
        </h3>
      )}

      {/* Body Content */}
      <div
        className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-line ${
          isRetracted ? 'italic text-stone-500 dark:text-stone-400' : 'text-stone-700 dark:text-stone-300'
        }`}
      >
        {update.content}
      </div>

      {/* Correction / Retraction Transparent Notice */}
      {(update.correction_note || isRetracted) && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
          <div>
            <strong className="font-bold">
              {isRetracted ? 'সম্পাদকীয় প্রত্যাহার নোট:' : 'সংশোধনী নোট:'}
            </strong>{' '}
            <span>{update.correction_note || update.deleted_reason}</span>
            {update.edited_at && (
              <span className="block text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                হালনাগাদ: {formatBengaliFullDateTime(update.edited_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Photo & Video Attachments */}
      {attachments.length > 0 && (
        <div
          className={`mt-3.5 grid gap-2.5 ${
            attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {attachments.map((att, idx) => {
            const isVideo = att.type === 'video';
            return (
              <button
                key={`${att.url}-${idx}`}
                type="button"
                onClick={() => onOpenMedia?.(att)}
                className="group relative text-left rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 cursor-pointer"
              >
                {isVideo ? (
                  <div className="relative aspect-video flex items-center justify-center bg-stone-900">
                    {att.thumbnail_url ? (
                      <img
                        src={normalizeMediaUrl(att.thumbnail_url)}
                        alt={att.caption || 'ভিডিও থাম্বনেইল'}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                      />
                    ) : (
                      <Video className="w-10 h-10 text-stone-400" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                      <PlayCircle className="w-12 h-12 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={normalizeMediaUrl(att.url)}
                      alt={att.caption || 'সংযুক্ত ছবি'}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/65 text-white text-[10px] inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>বড় করে দেখুন</span>
                    </span>
                  </div>
                )}
                {(att.caption || att.credit) && (
                  <div className="px-2.5 py-1.5 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/90 flex justify-between gap-2">
                    <span className="truncate">{att.caption}</span>
                    {att.credit && <span className="text-stone-400 shrink-0">{att.credit}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Footer: Author & Verification Meta */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          {showAuthorAvatars && (
            <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex items-center justify-center shrink-0">
              {update.author?.avatar ? (
                <img
                  src={normalizeMediaUrl(update.author.avatar)}
                  alt={update.author?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200">
                  {(update.author?.name || 'ড').slice(0, 1)}
                </span>
              )}
            </div>
          )}
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200">{update.author?.name || 'নিউজরুম ডেস্ক'}</span>
            {update.author?.designation && (
              <span className="text-stone-500 dark:text-stone-400"> • {update.author.designation}</span>
            )}
          </div>
        </div>

        {update.approver?.name && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
            <UserCheck className="w-3.5 h-3.5" />
            <span>যাচাইকৃত: {update.approver.name}</span>
          </span>
        )}
      </div>

      {/* Expandable Transparent Revision History */}
      {showRevisions && revisions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-stone-200 dark:border-stone-700 space-y-2">
          <p className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-rose-700" />
            <span>সম্পাদনা ও সংশোধন লগ</span>
          </p>
          <div className="space-y-1.5">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="text-xs p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    সংস্করণ #{toBengaliNumber(rev.revision_number)} • {REVISION_ACTION_LABELS[rev.action] || rev.action}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {formatBengaliFullDateTime(rev.created_at)}
                    {rev.actor?.name ? ` • ${rev.actor.name}` : ''}
                  </span>
                </div>
                {rev.change_note && <p className="text-stone-600 dark:text-stone-300 mt-1">{rev.change_note}</p>}
                {rev.previous_content && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    পূর্ববর্তী পাঠ: “{rev.previous_content}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * Dynamic Infographic Card supporting KPI highlights and comparative horizontal bar datasets.
 */
export function DynamicInfographicCard({ item }) {
  const payload = item?.payload || {};
  const bars = Array.isArray(payload.bars) ? payload.bars : [];
  const metrics = Array.isArray(payload.metrics) ? payload.metrics : [];

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            {item.badge && (
              <span className="inline-block px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold mb-1.5">
                {item.badge}
              </span>
            )}
            <h4 className="font-serif-bn text-lg font-bold text-stone-900 dark:text-stone-100">{item.title}</h4>
          </div>
          {payload.highlight_value && (
            <div className="text-right shrink-0">
              <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">{payload.highlight_value}</div>
              {payload.highlight_label && (
                <div className="text-[11px] text-stone-500 dark:text-stone-400">{payload.highlight_label}</div>
              )}
            </div>
          )}
        </div>

        {item.summary && (
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
            {item.summary}
          </p>
        )}

        {/* Comparative Bars */}
        {bars.length > 0 && (
          <div className="space-y-3 mt-3">
            {bars.map((bar, idx) => {
              const numVal = Number(bar.value) || 0;
              const maxVal = Number(bar.max) || Math.max(...bars.map((b) => Number(b.value) || 0), 100);
              const pct = Math.min(100, Math.max(4, Math.round((numVal / maxVal) * 100)));

              return (
                <div key={`${bar.label}-${idx}`}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-stone-700 dark:text-stone-200">{bar.label}</span>
                    <span className="text-stone-900 dark:text-stone-100">
                      {bar.display_value || toBengaliNumber(bar.value)}
                      {bar.unit ? ` ${bar.unit}` : ''}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bar.color || '#be123c'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Secondary Mini Metrics Grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {metrics.map((m, idx) => (
              <div
                key={`${m.label}-${idx}`}
                className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700"
              >
                <div className="text-[11px] text-stone-500 dark:text-stone-400">{m.label}</div>
                <div className="text-sm font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {payload.source && (
        <div className="mt-4 pt-2.5 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span>তথ্যসূত্র: {payload.source}</span>
          {item.credit && <span>{item.credit}</span>}
        </div>
      )}
    </div>
  );
}


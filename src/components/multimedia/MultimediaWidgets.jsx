import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Calendar,
  Share2
} from 'lucide-react';
import {
  formatDurationLabel,
  parseSafeSocialEmbedUrl,
  SOCIAL_PLATFORM_META
} from '../../utils/multimediaHelpers.js';

/**
 * Accessible HTML5 Audio Player with speed controls, scrubber, ARIA attributes,
 * and collapsible full transcript support for Audio News & Podcasts.
 */
export function AccessibleAudioPlayer({
  src,
  title = 'অডিও প্লেয়ার',
  durationSeconds = 0,
  durationLabel = '',
  transcript = '',
  compact = false
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(Number(durationSeconds || 0));
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(Number(durationSeconds || 0));
  }, [src, durationSeconds]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const handleRateCycle = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const resolvedTotal = totalDuration || Number(durationSeconds || 0);

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 ${
        compact ? 'p-3' : 'p-4'
      } space-y-3`}
      role="region"
      aria-label={`অডিও প্লেয়ার: ${title}`}
    >
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(Math.floor(e.currentTarget.currentTime || 0))}
        onLoadedMetadata={(e) => {
          const d = Math.floor(e.currentTarget.duration || 0);
          if (d > 0) setTotalDuration(d);
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!src}
          aria-label={isPlaying ? `${title} বিরতি দিন` : `${title} চালু করুন`}
          className="w-11 h-11 rounded-full bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-stone-900 dark:text-stone-100 truncate font-serif-bn flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-rose-700 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 shrink-0">
              {formatDurationLabel(currentTime)} / {formatDurationLabel(resolvedTotal, durationLabel)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={resolvedTotal > 0 ? resolvedTotal : 100}
            value={Math.min(currentTime, resolvedTotal > 0 ? resolvedTotal : 100)}
            onChange={handleSeek}
            disabled={!src || resolvedTotal <= 0}
            aria-label="অডিও অগ্রগতি স্লাইডার"
            className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg accent-rose-700 cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={handleRateCycle}
          aria-label={`প্লেব্যাক স্পিড পরিবর্তন (${playbackRate}x)`}
          className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-[11px] font-mono font-bold text-stone-700 dark:text-stone-200 hover:border-rose-400 cursor-pointer shrink-0"
        >
          {playbackRate}x
        </button>

        {transcript && (
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            aria-expanded={showTranscript}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-200 hover:border-rose-400 inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-rose-700" />
            <span className="hidden sm:inline">ট্রান্সক্রিপ্ট</span>
          </button>
        )}
      </div>

      {showTranscript && transcript && (
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
          {transcript}
        </div>
      )}
    </div>
  );
}

/**
 * Accessible Slideshow Modal for Photo Galleries & Photo Stories
 * Supports ArrowLeft / ArrowRight / Escape keys, auto-advance toggle, and figure captions.
 */
export function AccessibleSlideshowModal({ items = [], startIndex = 0, isOpen, title = '', onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || items.length === 0) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') setIndex((prev) => (prev + 1) % items.length);
      if (e.key === 'ArrowLeft') setIndex((prev) => (prev - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, items.length, onClose]);

  useEffect(() => {
    if (!isOpen || !autoPlay || items.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, autoPlay, items.length]);

  if (!isOpen || !items.length) return null;

  const active = items[index] || items[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/95 text-white flex flex-col justify-between p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'স্লাইডশো মোড'}
    >
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-800">
        <div>
          <p className="text-xs font-mono text-rose-400" aria-live="polite">
            স্লাইড {index + 1} / {items.length}
          </p>
          {title && <h2 className="text-base sm:text-lg font-bold font-serif-bn">{title}</h2>}
        </div>

        <div className="flex items-center gap-2">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                autoPlay
                  ? 'bg-rose-700 border-rose-600 text-white'
                  : 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              {autoPlay ? 'অটো-প্লে চালু' : 'অটো-স্লাইড'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="স্লাইডশো বন্ধ করুন"
            className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative my-4 overflow-hidden">
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
            aria-label="পূর্ববর্তী ছবি"
            className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/70 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <figure className="max-h-full max-w-5xl flex flex-col items-center gap-3">
          <img
            src={active.image_url}
            alt={active.title || active.caption || title}
            referrerPolicy="no-referrer"
            className="max-h-[64vh] w-auto object-contain rounded-xl shadow-2xl"
          />
          <figcaption className="text-center max-w-2xl space-y-1">
            {active.title && <div className="text-sm sm:text-base font-bold font-serif-bn">{active.title}</div>}
            {active.caption && <p className="text-xs sm:text-sm text-stone-300">{active.caption}</p>}
            {(active.credit || active.location) && (
              <p className="text-[11px] text-stone-400">
                {[active.location, active.credit ? `ছবি: ${active.credit}` : ''].filter(Boolean).join(' • ')}
              </p>
            )}
          </figcaption>
        </figure>

        {items.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % items.length)}
            aria-label="পরবর্তী ছবি"
            className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/70 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
          {items.map((slide, idx) => (
            <button
              key={slide.id || idx}
              type="button"
              onClick={() => setIndex(idx)}
              aria-label={`স্লাইড ${idx + 1} নির্বাচন করুন`}
              className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                idx === index ? 'border-rose-500 scale-105' : 'border-stone-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={slide.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Interactive Chronological Timeline Viewer for Standalone & Embedded Story Timelines.
 */
export function InteractiveTimelineViewer({ events = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!events.length) {
    return (
      <p className="text-xs text-stone-500 py-6 text-center border border-dashed border-stone-200 rounded-xl">
        এই টাইমলাইনে এখনো কোনো ঘটনা যুক্ত করা হয়নি।
      </p>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-5 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-rose-200 dark:before:bg-rose-900">
      {events.map((ev, idx) => {
        const isSelected = activeIndex === idx;
        return (
          <article
            key={ev.id || idx}
            className={`relative rounded-2xl border p-4 transition-all ${
              isSelected
                ? 'bg-white dark:bg-stone-900 border-rose-400 shadow-sm'
                : 'bg-stone-50/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-stone-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="w-full text-left cursor-pointer"
              aria-expanded={isSelected}
            >
              <span
                className={`absolute -left-6 sm:-left-8 top-5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-950 ${
                  isSelected ? 'bg-rose-700 ring-4 ring-rose-100 dark:ring-rose-950' : 'bg-stone-400'
                }`}
              />
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                  <Calendar className="w-3 h-3" />
                  <span>{ev.date_label}</span>
                </span>
                {ev.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                    {ev.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold font-serif-bn text-stone-900 dark:text-stone-100">
                {ev.title}
              </h3>
            </button>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
              {ev.description}
            </p>

            {(ev.media_url || ev.link_url) && isSelected && (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                {ev.media_url && (
                  <img
                    src={ev.media_url}
                    alt={ev.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-60 object-cover rounded-xl"
                  />
                )}
                {ev.link_url && (
                  <a
                    href={ev.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                  >
                    <span>বিস্তারিত সূত্র দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/**
 * XSS-Safe Social Post & Video Embed Renderer.
 * Renders safe YouTube/Vimeo iframes or structured platform link cards; never injects raw HTML/script.
 */
export function SafeSocialEmbedCard({ item }) {
  const parsed = parseSafeSocialEmbedUrl(item?.media_url || item?.url || '');
  const platformKey = item?.platform || parsed.platform || 'x';
  const platformMeta = SOCIAL_PLATFORM_META[platformKey] || { label: 'Social Post', accent: 'bg-stone-900 text-white' };

  if (!parsed.safe) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700">
        অনিরাপদ এমবেড লিংক নিরাপত্তা কারণে প্রদর্শন করা হয়নি।
      </div>
    );
  }

  return (
    <article className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
      <div>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${platformMeta.accent}`}>
              {platformMeta.label}
            </span>
            <div className="truncate text-xs font-semibold text-stone-700 dark:text-stone-200">
              {item?.embed_author_name || 'Verified Post'}
              {item?.embed_author_handle && (
                <span className="text-stone-400 ml-1 font-normal">{item.embed_author_handle}</span>
              )}
            </div>
          </div>
          <Share2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        </div>

        {parsed.kind === 'iframe' && parsed.embedUrl ? (
          <div className="aspect-video bg-black">
            <iframe
              src={parsed.embedUrl}
              title={item?.title || 'Embedded Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : parsed.kind === 'video' ? (
          <video src={parsed.url} controls playsInline className="w-full aspect-video bg-black object-contain" />
        ) : null}

        <div className="p-4 space-y-1.5">
          {item?.title && (
            <h3 className="text-sm font-bold font-serif-bn text-stone-900 dark:text-stone-100">{item.title}</h3>
          )}
          {item?.summary && (
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{item.summary}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
        <span className="text-[11px] text-stone-500">নিরাপদ বাহ্যিক পোস্ট</span>
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
        >
          <span>মূল পোস্ট দেখুন</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  );
}


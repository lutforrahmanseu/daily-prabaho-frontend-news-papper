import { parseVideoEmbedUrl } from './liveCoverageHelpers.js';
import { toBengaliNumber } from './bengaliFormatter.js';

export const MULTIMEDIA_STATUS_META = {
  draft: {
    id: 'draft',
    label: 'খসড়া',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
  },
  submitted: {
    id: 'submitted',
    label: 'অনুমোদনের অপেক্ষায়',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  approved: {
    id: 'approved',
    label: 'অনুমোদিত',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
  },
  published: {
    id: 'published',
    label: 'প্রকাশিত',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  archived: {
    id: 'archived',
    label: 'সংরক্ষিত',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
  }
};

export const MULTIMEDIA_ITEM_TYPE_META = {
  video: {
    id: 'video',
    label: 'ভিডিও সংবাদ',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
  },
  audio: {
    id: 'audio',
    label: 'অডিও সংবাদ',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
  },
  infographic: {
    id: 'infographic',
    label: 'ইনফোগ্রাফিক',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  social_embed: {
    id: 'social_embed',
    label: 'সোশ্যাল পোস্ট',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
  }
};

export const MEDIA_VISIBILITY_META = {
  public: {
    id: 'public',
    label: 'সর্বজনীন (Public)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  private: {
    id: 'private',
    label: 'সংরক্ষিত প্রাইভেট',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  restricted: {
    id: 'restricted',
    label: 'এমবার্গো / সীমাবদ্ধ',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export const SOCIAL_PLATFORM_META = {
  youtube: { id: 'youtube', label: 'YouTube', accent: 'bg-red-600 text-white' },
  x: { id: 'x', label: 'X / Twitter', accent: 'bg-stone-900 text-white' },
  facebook: { id: 'facebook', label: 'Facebook', accent: 'bg-blue-600 text-white' },
  instagram: { id: 'instagram', label: 'Instagram', accent: 'bg-pink-600 text-white' },
  tiktok: { id: 'tiktok', label: 'TikTok', accent: 'bg-zinc-900 text-white' },
  vimeo: { id: 'vimeo', label: 'Vimeo', accent: 'bg-sky-600 text-white' }
};

export const STORY_BLOCK_TYPE_META = {
  heading: { id: 'heading', label: 'অধ্যায় শিরোনাম (Heading)' },
  text: { id: 'text', label: 'সম্পাদকীয় অনুচ্ছেদ (Text)' },
  quote: { id: 'quote', label: 'বিশেষ উদ্ধৃতি (Pull Quote)' },
  image: { id: 'image', label: 'আলোকচিত্র (Full/Wide Photo)' },
  video: { id: 'video', label: 'ভিডিও সংযোগ (Video)' },
  audio: { id: 'audio', label: 'অডিও ক্লিপ (Audio)' },
  timeline: { id: 'timeline', label: 'ইন্টারঅ্যাক্টিভ টাইমলাইন' },
  embed: { id: 'embed', label: 'সোশ্যাল / ভিডিও এমবেড' }
};

export const getMultimediaStatusMeta = (status) =>
  MULTIMEDIA_STATUS_META[status] || MULTIMEDIA_STATUS_META.draft;

export const getMultimediaItemTypeMeta = (itemType) =>
  MULTIMEDIA_ITEM_TYPE_META[itemType] || MULTIMEDIA_ITEM_TYPE_META.video;

export const getVisibilityMeta = (visibility) =>
  MEDIA_VISIBILITY_META[visibility] || MEDIA_VISIBILITY_META.public;

/**
 * Format duration seconds into human readable MM:SS or HH:MM:SS label.
 */
export const formatDurationLabel = (seconds, explicitLabel = '', useBengali = true) => {
  if (explicitLabel && String(explicitLabel).trim()) {
    return String(explicitLabel).trim();
  }
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return '০০:০০';
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const raw =
    hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return useBengali ? toBengaliNumber(raw) : raw;
};

/**
 * Strictly validate and parse safe external URLs for Social Posts & Multimedia embeds.
 * Rejects javascript:, data:, vbscript:, and inline <script> patterns to prevent XSS.
 */
export const parseSafeSocialEmbedUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, url: '', kind: 'invalid', platform: 'unknown', embedUrl: null };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || /<\s*script|javascript:|data:|vbscript:/i.test(trimmed)) {
    return { safe: false, url: '', kind: 'unsafe', platform: 'unknown', embedUrl: null };
  }

  if (trimmed.startsWith('/')) {
    const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed);
    const isDirectAudio = /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i.test(trimmed);
    return {
      safe: true,
      url: trimmed,
      kind: isDirectAudio ? 'audio' : isDirectVideo ? 'video' : 'link',
      platform: 'local',
      embedUrl: null
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { safe: false, url: '', kind: 'invalid', platform: 'unknown', embedUrl: null };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { safe: false, url: '', kind: 'unsafe', platform: 'unknown', embedUrl: null };
  }

  const videoCheck = parseVideoEmbedUrl(trimmed);
  const isDirectVideoFile = /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(trimmed);
  const isDirectAudioFile = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(trimmed);

  if (videoCheck.kind === 'iframe' || isDirectVideoFile) {
    const resolvedSrc = videoCheck.src || trimmed;
    return {
      safe: true,
      url: trimmed,
      kind: videoCheck.kind === 'iframe' ? 'iframe' : 'video',
      platform: resolvedSrc.includes('vimeo.com') ? 'vimeo' : videoCheck.kind === 'iframe' ? 'youtube' : 'video',
      embedUrl: videoCheck.kind === 'iframe' ? resolvedSrc : null
    };
  }

  if (isDirectAudioFile) {
    return {
      safe: true,
      url: trimmed,
      kind: 'audio',
      platform: 'audio',
      embedUrl: null
    };
  }

  const host = parsedUrl.hostname.toLowerCase();
  let platform = 'x';
  if (host.includes('facebook.com') || host.includes('fb.watch')) {
    platform = 'facebook';
  } else if (host.includes('instagram.com')) {
    platform = 'instagram';
  } else if (host.includes('tiktok.com')) {
    platform = 'tiktok';
  } else if (host.includes('twitter.com') || host.includes('x.com')) {
    platform = 'x';
  }

  return {
    safe: true,
    url: trimmed,
    kind: 'card',
    platform,
    embedUrl: null
  };
};

import { fetchWithTimeout } from './fetchWithTimeout.js';

/**
 * Phase 26 — News Creator Studio Frontend Pure Helpers
 * Covers SRT/VTT cue parsing & serialization, Bangla/English speaking duration
 * math, aspect-ratio canvas safe-zone geometry, workflow badges, and permissions.
 */

export const STUDIO_STATUS_META = {
  draft: { label: 'খসড়া (Draft)', en: 'Draft', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
  in_review: { label: 'সম্পাদনা পর্যালোচনায়', en: 'In Review', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  approved: { label: 'অনুমোদিত', en: 'Approved', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  scheduled: { label: 'নির্ধারিত (Scheduled)', en: 'Scheduled', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  published: { label: 'প্রকাশিত', en: 'Published', badgeClass: 'bg-green-600 text-white border-green-700' },
  archived: { label: 'আর্কাইভ', en: 'Archived', badgeClass: 'bg-zinc-200 text-zinc-700 border-zinc-300' },
};

export const SCRIPT_APPROVAL_META = {
  pending_review: { label: 'সাংবাদিকের অনুমোদন প্রয়োজন', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  approved: { label: 'অনুমোদিত স্ক্রিপ্ট', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  rejected: { label: 'সংশোধনের জন্য ফেরত', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300' },
};

export const STUDIO_CHANNELS = [
  { id: 'newsflow_internal', label: 'NewsFlow Public Showcase', external: false },
  { id: 'multimedia_cms', label: 'NewsFlow Multimedia CMS (Phase 17)', external: false },
  { id: 'youtube_shorts', label: 'YouTube Shorts', external: true },
  { id: 'facebook_reels', label: 'Facebook Reels', external: true },
  { id: 'instagram_reels', label: 'Instagram Reels', external: true },
  { id: 'x_video', label: 'X (Twitter) Video', external: true },
  { id: 'tiktok', label: 'TikTok Reels', external: true },
  { id: 'webhook', label: 'Signed Outbound Webhook', external: true },
];

export const ASSET_TYPE_OPTIONS = [
  { id: 'quote_card', label: 'Quote Card (১:১ / ৪:৫)', defaultAspect: '1:1' },
  { id: 'vertical_video', label: 'Vertical Video Layout (৯:১৬)', defaultAspect: '9:16' },
  { id: 'thumbnail', label: 'Video Thumbnail (১৬:৯)', defaultAspect: '16:9' },
  { id: 'story_card', label: 'Story Card (৯:১৬)', defaultAspect: '9:16' },
  { id: 'caption_pack', label: 'Social Caption & Hashtags', defaultAspect: '1:1' },
];

export function msToTimecode(ms, decimalSeparator = ',') {
  const safeMs = Math.max(0, Math.round(Number(ms) || 0));
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${decimalSeparator}${String(millis).padStart(3, '0')}`;
}

export function timecodeToMs(tc) {
  const clean = String(tc || '').trim().replace(',', '.');
  if (!clean) return 0;

  const parts = clean.split(':');
  if (parts.length === 2) parts.unshift('0');
  if (parts.length !== 3) return 0;

  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  const [secRaw = '0', msRaw = '0'] = String(parts[2]).split('.');
  const seconds = Number(secRaw) || 0;
  const millis = Number(String(msRaw).slice(0, 3).padEnd(3, '0')) || 0;

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
}

export function serializeCuesToSrt(cues = []) {
  return cues
    .map((cue, idx) => `${idx + 1}\n${msToTimecode(cue.start_ms, ',')} --> ${msToTimecode(cue.end_ms, ',')}\n${String(cue.text || '').trim()}`)
    .join('\n\n')
    .concat(cues.length ? '\n' : '');
}

export function serializeCuesToVtt(cues = []) {
  if (!cues.length) return 'WEBVTT\n\n';
  return (
    'WEBVTT\n\n' +
    cues
      .map((cue) => `${msToTimecode(cue.start_ms, '.')} --> ${msToTimecode(cue.end_ms, '.')}\n${String(cue.text || '').trim()}`)
      .join('\n\n')
      .concat('\n')
  );
}

export function parseSrtOrVtt(raw = '') {
  const clean = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^WEBVTT[^\n]*\n+/i, '')
    .trim();

  if (!clean) return [];

  const blocks = clean.split(/\n{2,}/);
  const cues = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const arrowIdx = lines.findIndex((line) => line.includes('-->'));
    if (arrowIdx === -1) continue;

    const match = lines[arrowIdx].match(/(\d{1,2}:)?\d{2}:\d{2}[,.]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[,.]\d{3}/);
    if (!match) continue;

    const [startRaw, endRaw] = match[0].split('-->').map((s) => s.trim());
    const start_ms = timecodeToMs(startRaw);
    const end_ms = timecodeToMs(endRaw.split(' ')[0]);
    const text = lines.slice(arrowIdx + 1).join(' ').replace(/<[^>]*>/g, '').trim();

    if (text && end_ms > start_ms) {
      cues.push({
        index: cues.length + 1,
        start_ms,
        end_ms,
        text,
        speaker: 'Anchor',
      });
    }
  }

  return cues;
}

export function validateCueList(cues = []) {
  if (!Array.isArray(cues) || cues.length === 0) {
    return { valid: false, error: 'কমপক্ষে একটি সাবটাইটেল কিউ যোগ করুন।' };
  }
  for (let i = 0; i < cues.length; i += 1) {
    const cue = cues[i];
    if (!cue || !String(cue.text || '').trim()) {
      return { valid: false, error: `কিউ #${i + 1}-এ টেক্সট খালি রয়েছে।` };
    }
    if ((Number(cue.end_ms) || 0) <= (Number(cue.start_ms) || 0)) {
      return { valid: false, error: `কিউ #${i + 1}-এ শেষের সময় শুরুর সময়ের চেয়ে বড় হতে হবে।` };
    }
  }
  return { valid: true, error: null };
}

export function estimateSpokenSeconds(text = '', language = 'bn') {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) return 0;
  const wordsPerSecond = language === 'bn' ? 1.85 : 2.3;
  return Math.max(1, Math.round(words / wordsPerSecond));
}

export function resolveCanvasGeometry(aspectRatio = '1:1') {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920, safeTop: 180, safeBottom: 340, pad: 72 };
    case '4:5':
      return { width: 1080, height: 1350, safeTop: 80, safeBottom: 110, pad: 64 };
    case '16:9':
      return { width: 1280, height: 720, safeTop: 54, safeBottom: 72, pad: 56 };
    default:
      return { width: 1080, height: 1080, safeTop: 72, safeBottom: 96, pad: 64 };
  }
}

export function canExecuteExternalPublish(project, settings, hasExternalPermission) {
  if (!hasExternalPermission) return false;
  if (!settings?.allow_external_publish) return false;
  if (!project || !['approved', 'scheduled', 'published'].includes(project.status)) return false;
  if (settings?.require_explicit_external_auth !== false && !project.external_publish_authorized) {
    return false;
  }
  return true;
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return import.meta.env?.VITE_API_URL || '/api/v1';
  }
  return 'http://localhost:3000/api/v1';
}

export async function fetchAuthorizedBlobUrl(relativeApiPath) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetchWithTimeout(`${getApiBaseUrl()}${relativeApiPath}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function downloadAuthorizedFile(relativeApiPath, fallbackFilename) {
  const blobUrl = await fetchAuthorizedBlobUrl(relativeApiPath);
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fallbackFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
  }
}

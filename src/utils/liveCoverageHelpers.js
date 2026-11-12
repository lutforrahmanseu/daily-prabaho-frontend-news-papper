import { formatBengaliRelativeTime, toBengaliNumber } from './bengaliFormatter.js';
import { BASE_SITE_URL, SITE_NAME } from './seoHelpers.js';

export const LIVE_EVENT_TYPE_META = {
  breaking: {
    id: 'breaking',
    label: 'জরুরি সরাসরি',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
  },
  election: {
    id: 'election',
    label: 'নির্বাচন',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
  },
  sports: {
    id: 'sports',
    label: 'খেলাধুলা',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
  },
  budget: {
    id: 'budget',
    label: 'বাজেট',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
  },
  disaster: {
    id: 'disaster',
    label: 'দুর্যোগ ও আবহাওয়া',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800'
  },
  national: {
    id: 'national',
    label: 'জাতীয়',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
  },
  court: {
    id: 'court',
    label: 'আদালত ও আইন',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700'
  },
  general: {
    id: 'general',
    label: 'সাধারণ',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
  }
};

export const LIVE_BLOG_STATUS_META = {
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
  live: {
    id: 'live',
    label: 'সরাসরি চলছে',
    badgeClass: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-700 dark:border-rose-600'
  },
  paused: {
    id: 'paused',
    label: 'বিরতি',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
  },
  ended: {
    id: 'ended',
    label: 'সমাপ্ত',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  archived: {
    id: 'archived',
    label: 'সংরক্ষিত',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
  }
};

export const LIVE_UPDATE_TYPE_META = {
  update: {
    id: 'update',
    label: 'আপডেট',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
  },
  breaking: {
    id: 'breaking',
    label: 'ব্রেকিং',
    badgeClass: 'bg-rose-600 text-white border-rose-600'
  },
  quote: {
    id: 'quote',
    label: 'উদ্ধৃতি',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
  },
  score: {
    id: 'score',
    label: 'স্কোর/ফল',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
  },
  media: {
    id: 'media',
    label: 'ছবি ও ভিডিও',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
  },
  summary: {
    id: 'summary',
    label: 'সারসংক্ষেপ',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
  }
};

export const UPDATE_STATUS_META = {
  draft: { id: 'draft', label: 'খসড়া', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  pending_approval: { id: 'pending_approval', label: 'সম্পাদকীয় যাচাইয়ে', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  published: { id: 'published', label: 'প্রকাশিত', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  retracted: { id: 'retracted', label: 'প্রত্যাহারকৃত', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
};

export const REVISION_ACTION_LABELS = {
  created: 'তৈরি হয়েছে',
  approved: 'সম্পাদক কর্তৃক অনুমোদিত',
  edited: 'সম্পাদনা করা হয়েছে',
  corrected: 'সংশোধনী যুক্ত হয়েছে',
  pinned: 'গুরুত্বপূর্ণ হিসেবে পিন করা হয়েছে',
  unpinned: 'পিন সরানো হয়েছে',
  retracted: 'প্রত্যাহার করা হয়েছে',
  deleted: 'মুছে ফেলা হয়েছে',
  restored: 'পুনরুদ্ধার করা হয়েছে'
};

export const SPECIAL_COVERAGE_TYPE_META = {
  election: {
    id: 'election',
    label: 'নির্বাচন কাভারেজ',
    shortLabel: 'নির্বাচন',
    defaultColor: '#1d4ed8',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    accentBg: 'from-blue-950 via-indigo-950 to-stone-950'
  },
  sports: {
    id: 'sports',
    label: 'ক্রীড়া টুর্নামেন্ট',
    shortLabel: 'ক্রীড়া আসর',
    defaultColor: '#047857',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    accentBg: 'from-emerald-950 via-teal-950 to-stone-950'
  },
  national_event: {
    id: 'national_event',
    label: 'জাতীয় দিবস ও আয়োজন',
    shortLabel: 'জাতীয় আয়োজন',
    defaultColor: '#7c2d12',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    accentBg: 'from-amber-950 via-stone-900 to-stone-950'
  },
  disaster: {
    id: 'disaster',
    label: 'প্রাকৃতিক দুর্যোগ',
    shortLabel: 'দুর্যোগ',
    defaultColor: '#c2410c',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
    accentBg: 'from-orange-950 via-stone-900 to-stone-950'
  },
  budget: {
    id: 'budget',
    label: 'জাতীয় বাজেট',
    shortLabel: 'বাজেট',
    defaultColor: '#0f766e',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    accentBg: 'from-teal-950 via-slate-900 to-stone-950'
  },
  breaking_event: {
    id: 'breaking_event',
    label: 'মেজর ব্রেকিং ইভেন্ট',
    shortLabel: 'জরুরি ইভেন্ট',
    defaultColor: '#be123c',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    accentBg: 'from-rose-950 via-stone-900 to-stone-950'
  }
};

export const COVERAGE_STATUS_META = {
  draft: { id: 'draft', label: 'খসড়া', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  submitted: { id: 'submitted', label: 'অনুমোদনের অপেক্ষায়', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { id: 'approved', label: 'অনুমোদিত', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  published: { id: 'published', label: 'প্রকাশিত', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { id: 'archived', label: 'সংরক্ষিত', badgeClass: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export const COVERAGE_SECTION_META = {
  related_news: { id: 'related_news', label: 'সংশ্লিষ্ট সংবাদ' },
  timeline: { id: 'timeline', label: 'টাইমলাইন' },
  gallery: { id: 'gallery', label: 'ফটো গ্যালারি' },
  video: { id: 'video', label: 'ভিডিও প্রতিবেদন' },
  infographic: { id: 'infographic', label: 'ইনফোগ্রাফিক' },
  topic_update: { id: 'topic_update', label: 'বিষয়ভিত্তিক নোট' }
};

export function formatBengaliClockTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
    return formatted;
  } catch {
    return toBengaliNumber(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
}

export function formatBengaliFullDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
}

export function formatLiveTimestampBadge(isoString) {
  if (!isoString) return 'এইমাত্র';
  return `${formatBengaliClockTime(isoString)} • ${formatBengaliRelativeTime(isoString)}`;
}

/**
 * Convert YouTube / Vimeo URLs into safe embed URLs, or return null for native <video> sources.
 */
export function parseVideoEmbedUrl(url) {
  if (!url || typeof url !== 'string') return { kind: 'none', src: '' };
  const trimmed = url.trim();
  if (!trimmed) return { kind: 'none', src: '' };

  try {
    const parsed = new URL(trimmed, 'https://dailyprabaho.com');
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return { kind: 'iframe', src: trimmed };
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
        if (id) return { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` };
      }
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return { kind: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
      }
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id) return { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` };
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id && /^\d+$/.test(id)) {
        return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` };
      }
    }
  } catch {
    // Fallback to raw media URL check below
  }

  return { kind: 'video', src: trimmed };
}

export function getNextStreamCursor(currentVersion = 0, incomingVersion = 0) {
  const curr = Number(currentVersion) || 0;
  const next = Number(incomingVersion) || 0;
  return next > curr ? next : curr;
}

export function getSubscriberStorageKey(targetType, slug) {
  return `dp_sub_v1_${targetType}_${slug}`;
}

export function buildLiveBlogSchema(blog, domain = BASE_SITE_URL) {
  if (!blog) return null;
  const canonical = `${domain}/live/${blog.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    '@id': `${canonical}#liveblog`,
    headline: blog.title || '',
    description: blog.summary || blog.title || '',
    coverageStartTime: blog.started_at || blog.created_at || new Date().toISOString(),
    coverageEndTime: blog.ended_at || undefined,
    dateModified: blog.last_update_at || blog.updated_at || new Date().toISOString(),
    inLanguage: 'bn',
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: domain
    },
    liveBlogUpdate: Array.isArray(blog.updates)
      ? blog.updates
          .filter((u) => u.status === 'published')
          .slice(0, 15)
          .map((u) => ({
            '@type': 'BlogPosting',
            headline: u.title || blog.title,
            articleBody: u.content,
            datePublished: u.published_at || u.created_at,
            dateModified: u.edited_at || u.published_at || u.created_at,
            author: {
              '@type': 'Person',
              name: u.author?.name || 'নিউজরুম ডেস্ক'
            }
          }))
      : []
  };
}


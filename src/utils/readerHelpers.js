/**
 * Pure utility helpers for Phase 18 Reader Engagement Platform.
 */

export const isReaderOnlySession = (roles = []) => {
  const normalized = (Array.isArray(roles) ? roles : [])
    .map((r) => (typeof r === 'string' ? r : r?.slug))
    .filter(Boolean);
  return normalized.length > 0 && normalized.every((r) => r === 'reader');
};

export const getOrCreateReaderClientId = () => {
  if (typeof window === 'undefined') return 'ssr-reader-client';
  const key = 'nf_reader_client_seed';
  try {
    let existing = localStorage.getItem(key);
    if (!existing) {
      const rand =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      existing = `rc_${rand}`;
      localStorage.setItem(key, existing);
    }
    return existing;
  } catch {
    return 'fallback-reader-client';
  }
};

export const calculatePollOptionPercentage = (votesCount, totalVotes) => {
  const votes = Number(votesCount || 0);
  const total = Number(totalVotes || 0);
  if (total <= 0 || votes <= 0) return 0;
  return Math.round((votes / total) * 1000) / 10;
};

export const normalizePollData = (poll) => {
  if (!poll) return null;
  const options = Array.isArray(poll.options) ? poll.options : [];
  const totalVotes =
    poll.total_votes !== undefined
      ? Number(poll.total_votes)
      : options.reduce((sum, opt) => sum + Number(opt.votes_count || 0), 0);

  return {
    id: poll.id,
    slug: poll.slug,
    questionBn: poll.question_bn || '',
    questionEn: poll.question_en || poll.question_bn || '',
    descriptionBn: poll.description_bn || '',
    descriptionEn: poll.description_en || poll.description_bn || '',
    status: poll.status || 'published',
    allowMultiple: Boolean(poll.allow_multiple),
    isFeatured: Boolean(poll.is_featured),
    isOpen: poll.is_open !== undefined ? Boolean(poll.is_open) : poll.status === 'published',
    totalVotes,
    userVoted: Boolean(poll.user_voted),
    userVotedOptionIds: Array.isArray(poll.user_voted_option_ids) ? poll.user_voted_option_ids : [],
    closesAt: poll.closes_at || null,
    options: options.map((opt) => ({
      id: opt.id,
      labelBn: opt.label_bn || '',
      labelEn: opt.label_en || opt.label_bn || '',
      votesCount: Number(opt.votes_count || 0),
      percentage:
        opt.percentage !== undefined
          ? Number(opt.percentage)
          : calculatePollOptionPercentage(opt.votes_count, totalVotes),
      sortOrder: Number(opt.sort_order || 0)
    }))
  };
};

export const getPersonalizationReasonLabels = (reasons = [], isBn = true) => {
  const labels = {
    author: isBn ? 'অনুসরণকৃত লেখক' : 'Followed Author',
    category: isBn ? 'অনুসরণকৃত বিভাগ' : 'Followed Section',
    topic: isBn ? 'পছন্দের বিষয়' : 'Followed Topic'
  };
  return (Array.isArray(reasons) ? reasons : []).map((r) => labels[r] || r);
};

export const REACTION_META = [
  { type: 'like', emoji: '👍', labelBn: 'পছন্দ', labelEn: 'Like' },
  { type: 'love', emoji: '❤️', labelBn: 'ভালোবাসা', labelEn: 'Love' },
  { type: 'insightful', emoji: '💡', labelBn: 'তথ্যবহুল', labelEn: 'Insightful' },
  { type: 'clap', emoji: '👏', labelBn: 'প্রশংসনীয়', labelEn: 'Appreciated' },
  { type: 'concerned', emoji: '😟', labelBn: 'উদ্বেগজনক', labelEn: 'Concerned' }
];

export const NEWSLETTER_FREQUENCIES = [
  { value: 'daily', labelBn: 'প্রতিদিনের শীর্ষ সংবাদ', labelEn: 'Daily Digest' },
  { value: 'weekly', labelBn: 'সাপ্তাহিক নির্বাচিত বিশ্লেষণ', labelEn: 'Weekly Roundup' },
  { value: 'breaking', labelBn: 'শুধুমাত্র ব্রেকিং সংবাদ', labelEn: 'Breaking Alerts Only' },
  { value: 'none', labelBn: 'ইমেইল নিউজলেটার বন্ধ', labelEn: 'Paused / None' }
];

export const buildDataExportFilename = (date = new Date()) => {
  const iso = date.toISOString().slice(0, 10);
  return `daily-prabaho-reader-data-${iso}.json`;
};


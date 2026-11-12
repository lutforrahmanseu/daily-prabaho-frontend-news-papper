export const AI_FEATURES = [
  {
    key: 'headline_suggestions',
    nameBn: 'শিরোনাম প্রস্তাবনা',
    nameEn: 'Headline Suggestions',
    category: 'writing',
    descriptionBn: 'প্রদত্ত প্রতিবেদনের তথ্যের ভিত্তিতে একাধিক সাংবাদিকসুলভ শিরোনাম প্রস্তাব করে।',
    appliesToFields: ['title']
  },
  {
    key: 'subheadline_suggestions',
    nameBn: 'উপ-শিরোনাম প্রস্তাবনা',
    nameEn: 'Subheadline Suggestions',
    category: 'writing',
    descriptionBn: 'মূল শিরোনামের পরিপূরক সংক্ষিপ্ত উপ-শিরোনাম (Deck) তৈরি করে।',
    appliesToFields: ['subheadline']
  },
  {
    key: 'summarization',
    nameBn: 'সংবাদ সারাংশ',
    nameEn: 'Article Summarization',
    category: 'writing',
    descriptionBn: 'মূল পাঠ্যের বাক্য থেকে তথ্যনিষ্ঠ সারাংশ ও বুলেট পয়েন্ট তৈরি করে।',
    appliesToFields: ['summary']
  },
  {
    key: 'translate_bn_to_en',
    nameBn: 'বাংলা → ইংরেজি অনুবাদ',
    nameEn: 'Bengali to English Translation',
    category: 'translation',
    descriptionBn: 'বাংলা সংবাদ ইংরেজি সংস্করণের জন্য খসড়া অনুবাদ ও অনিশ্চিত শব্দ চিহ্নিত করে।',
    appliesToFields: ['title', 'subheadline', 'summary', 'content']
  },
  {
    key: 'translate_en_to_bn',
    nameBn: 'ইংরেজি → বাংলা অনুবাদ',
    nameEn: 'English to Bengali Translation',
    category: 'translation',
    descriptionBn: 'ইংরেজি বার্তা বা প্রেস রিলিজ প্রমিত সংবাদ বাংলায় রূপান্তর করে।',
    appliesToFields: ['title', 'subheadline', 'summary', 'content']
  },
  {
    key: 'seo_metadata',
    nameBn: 'এসইও মেটাডাটা',
    nameEn: 'SEO Metadata Generation',
    category: 'seo_media',
    descriptionBn: 'SEO টাইটেল (<=৬০), মেটা বিবরণ (<=১৬০), স্লাগ ও ফোকাস কিওয়ার্ড তৈরি করে।',
    appliesToFields: ['meta_title', 'meta_description', 'slug']
  },
  {
    key: 'tag_suggestions',
    nameBn: 'স্বয়ংক্রিয় ট্যাগ প্রস্তাব',
    nameEn: 'Automatic Tag Suggestions',
    category: 'seo_media',
    descriptionBn: 'বিদ্যমান ট্যাগ ডিরেক্টরি ও লেখার বিষয়বস্তু মিলিয়ে প্রাসঙ্গিক ট্যাগ প্রস্তাব করে।',
    appliesToFields: ['tags']
  },
  {
    key: 'image_alt_text',
    nameBn: 'ছবির Alt Text তৈরি',
    nameEn: 'Image Alt Text Generation',
    category: 'seo_media',
    descriptionBn: 'অ্যাক্সেসিবল ছবির বিবরণ তৈরি করে ও ভিজ্যুয়াল যাচাইয়ের সতর্কতা দেখায়।',
    appliesToFields: ['alt_text']
  },
  {
    key: 'duplicate_detection',
    nameBn: 'ডুপ্লিকেট সংবাদ শনাক্ত',
    nameEn: 'Duplicate Story Detection',
    category: 'verification',
    descriptionBn: 'বিদ্যমান প্রকাশিত ও খসড়া সংবাদের সাথে সাদৃশ্য (এমবার্গো সুরক্ষাসহ) যাচাই করে।',
    appliesToFields: []
  },
  {
    key: 'transcript_generation',
    nameBn: 'খসড়া ট্রান্সক্রিপ্ট তৈরি',
    nameEn: 'Transcript Generation',
    category: 'seo_media',
    descriptionBn: 'পডকাস্ট ও অডিও/ভিডিও নোট থেকে টাইমস্ট্যাম্পযুক্ত খসড়া ট্রান্সক্রিপ্ট তৈরি করে।',
    appliesToFields: ['transcript']
  },
  {
    key: 'content_quality',
    nameBn: 'মান ও পাঠযোগ্যতা সহায়তা',
    nameEn: 'Content Quality Assistance',
    category: 'verification',
    descriptionBn: '৫W১H কভারেজ, শিরোনাম-লেখা সামঞ্জস্য, উদ্ধৃতি ও বাক্য দৈর্ঘ্য বিশ্লেষণ করে।',
    appliesToFields: []
  },
  {
    key: 'source_verification',
    nameBn: 'সূত্র ও দাবি যাচাই সহায়তা',
    nameEn: 'Source Verification Assistance',
    category: 'verification',
    descriptionBn: 'সংযুক্ত NewsSource রেটিং ও উদ্ধৃতিবিহীন সংখ্যাসূচক দাবি চিহ্নিত করে।',
    appliesToFields: []
  }
];

export const AI_FEATURE_MAP = Object.fromEntries(AI_FEATURES.map((f) => [f.key, f]));

export const CONFIDENCE_LEVEL_META = {
  high: {
    labelBn: 'উচ্চ আত্মবিশ্বাস',
    labelEn: 'High Confidence',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  medium: {
    labelBn: 'মাঝারি আত্মবিশ্বাস (যাচাই করুন)',
    labelEn: 'Medium Confidence',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  low: {
    labelBn: 'নিম্ন আত্মবিশ্বাস (সম্পাদকীয় সতর্কতা)',
    labelEn: 'Low Confidence — Review Carefully',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  }
};

export const REVIEW_STATUS_META = {
  pending_review: {
    labelBn: 'মানব অনুমোদনের অপেক্ষায়',
    labelEn: 'Pending Human Review',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  approved: {
    labelBn: 'অনুমোদিত',
    labelEn: 'Approved',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  applied: {
    labelBn: 'প্রয়োগকৃত (ট্র্যাকড)',
    labelEn: 'Applied with Provenance',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  rejected: {
    labelBn: 'প্রত্যাখ্যাত',
    labelEn: 'Rejected',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-300'
  }
};

export const LOG_STATUS_META = {
  completed: {
    labelBn: 'সম্পন্ন',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  blocked_confidential: {
    labelBn: 'গোপনীয়তায় ব্লকড',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  blocked_quota: {
    labelBn: 'কোটায় ব্লকড',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  blocked_disabled: {
    labelBn: 'ফিচার বন্ধ',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-300'
  },
  failed: {
    labelBn: 'ব্যর্থ',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export const PRIVACY_MODE_META = {
  local_only: {
    labelBn: 'অভ্যন্তরীণ সার্ভার (Local Only)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  redacted_external: {
    labelBn: 'PII অপসারিত বাহ্যিক LLM',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  standard_external: {
    labelBn: 'বাহ্যিক LLM (সুরক্ষিত)',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200'
  }
};

export const getConfidenceMeta = (level = 'medium', score = 0.7) => {
  const meta = CONFIDENCE_LEVEL_META[level] || CONFIDENCE_LEVEL_META.medium;
  const numeric = Number(score);
  const percent = Number.isFinite(numeric) ? Math.round(numeric * 100) : 70;
  return { ...meta, percent };
};

export const normalizeAiGeneration = (raw = {}) => ({
  id: raw.id || null,
  feature_key: raw.feature_key || '',
  target_type: raw.target_type || null,
  target_id: raw.target_id || null,
  provider: raw.provider || 'local_safe',
  model: raw.model || 'newsflow-editorial-v1',
  input_payload: raw.input_payload || {},
  output_payload: raw.output_payload || {},
  confidence_score: Number(raw.confidence_score) || 0,
  confidence_level: raw.confidence_level || 'medium',
  uncertainty_notes: Array.isArray(raw.uncertainty_notes) ? raw.uncertainty_notes : [],
  safety_warnings: Array.isArray(raw.safety_warnings) ? raw.safety_warnings : [],
  grounded_facts_only: Boolean(raw.grounded_facts_only ?? true),
  contained_confidential: Boolean(raw.contained_confidential),
  external_transmission_blocked: Boolean(raw.external_transmission_blocked),
  review_status: raw.review_status || 'pending_review',
  review_notes: raw.review_notes || '',
  applied_fields: Array.isArray(raw.applied_fields) ? raw.applied_fields : [],
  prompt_tokens: Number(raw.prompt_tokens) || 0,
  completion_tokens: Number(raw.completion_tokens) || 0,
  total_tokens: Number(raw.total_tokens) || 0,
  latency_ms: Number(raw.latency_ms) || 0,
  user: raw.user || null,
  reviewer: raw.reviewer || null,
  reviewed_at: raw.reviewed_at || null,
  created_at: raw.created_at || null
});

export const canApplyAiSuggestion = (generation = {}, featureKey = '') => {
  if (!generation?.id || generation.review_status === 'rejected') {
    return false;
  }
  const feature = AI_FEATURE_MAP[featureKey || generation.feature_key];
  return Boolean(feature && Array.isArray(feature.appliesToFields) && feature.appliesToFields.length > 0);
};


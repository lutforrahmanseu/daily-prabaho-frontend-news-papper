// Phase 22: Citizen Journalism, Safety, Privacy & Community Helpers

export const SUBMISSION_TYPES = [
  { value: 'story', labelBn: 'নাগরিক প্রতিবেদন', labelEn: 'Citizen Story' },
  { value: 'photo', labelBn: 'আলোকচিত্র প্রতিবেদন', labelEn: 'Photo Story' },
  { value: 'video', labelBn: 'ভিডিও প্রতিবেদন', labelEn: 'Video Report' },
  { value: 'tip', labelBn: 'সংবাদ তথ্য / টিপ', labelEn: 'News Tip' }
];

export const LOCATION_PRIVACY_MODES = [
  {
    value: 'district_only',
    labelBn: 'শুধু জেলা/বিভাগ দেখান (প্রস্তাবিত)',
    labelEn: 'District / Division Only (Recommended)',
    hintBn: 'আপনার সুনির্দিষ্ট বাড়ির নম্বর, সড়ক বা GPS স্থানাঙ্ক কখনোই জনসম্মুখে প্রকাশিত হবে না।',
    hintEn: 'Exact street details and GPS coordinates remain strictly hidden from public endpoints.'
  },
  {
    value: 'masked_approximate',
    labelBn: 'সাধারণ এলাকার নাম দেখান',
    labelEn: 'General Neighborhood Label',
    hintBn: 'কেবল এলাকার সাধারণ পরিচয় (যেমন: মিরপুর, ঢাকা) প্রকাশিত হবে; ব্যক্তিগত ঠিকানা গোপন থাকবে।',
    hintEn: 'Displays only the general locality label while keeping private address & GPS hidden.'
  },
  {
    value: 'hidden',
    labelBn: 'অবস্থান সম্পূর্ণ গোপন রাখুন',
    labelEn: 'Keep Location Completely Hidden',
    hintBn: 'জনসম্মুখে কোনো অবস্থান দেখানো হবে না; শুধু বার্তাকক্ষের যাচাইয়ের জন্য সংরক্ষিত থাকবে।',
    hintEn: 'Location is withheld from public display and visible strictly to newsroom reviewers.'
  }
];

export const CREDIT_MODES = [
  {
    value: 'public_profile',
    labelBn: 'আমার কন্ট্রিবিউটর প্রোফাইল নাম দেখান',
    labelEn: 'Show Public Contributor Profile'
  },
  {
    value: 'alias',
    labelBn: 'ছদ্মনাম / ক্রেডিট নাম ব্যবহার করুন',
    labelEn: 'Use Custom Alias / Credit'
  },
  {
    value: 'anonymous',
    labelBn: 'পরিচয় সম্পূর্ণ গোপন রাখুন (Anonymous)',
    labelEn: 'Publish Anonymously (Protect Identity)'
  }
];

export const SUBMISSION_STATUS_META = {
  submitted: { labelBn: 'জমা হয়েছে', labelEn: 'Submitted', tone: 'bg-stone-100 text-stone-700 border-stone-200' },
  under_review: { labelBn: 'পর্যালোচনাধীন', labelEn: 'Under Review', tone: 'bg-sky-50 text-sky-800 border-sky-200' },
  verification_in_progress: { labelBn: 'তথ্য যাচাই চলছে', labelEn: 'Verifying', tone: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  changes_requested: { labelBn: 'সংশোধন প্রয়োজন', labelEn: 'Changes Requested', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  assigned_to_reporter: { labelBn: 'প্রতিবেদকের নিকট অর্পিত', labelEn: 'Reporter Assigned', tone: 'bg-purple-50 text-purple-800 border-purple-200' },
  approved: { labelBn: 'অনুমোদিত', labelEn: 'Approved', tone: 'bg-teal-50 text-teal-800 border-teal-200' },
  published: { labelBn: 'প্রকাশিত', labelEn: 'Published', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', labelEn: 'Rejected', tone: 'bg-rose-50 text-rose-800 border-rose-200' },
  removed: { labelBn: 'অপসারিত', labelEn: 'Removed', tone: 'bg-red-100 text-red-900 border-red-200' }
};

export const VERIFICATION_STATUS_META = {
  pending: { labelBn: 'যাচাই অপেক্ষমাণ', labelEn: 'Pending Verification', tone: 'bg-stone-100 text-stone-700' },
  in_progress: { labelBn: 'যাচাই প্রক্রিয়াধীন', labelEn: 'In Verification', tone: 'bg-amber-50 text-amber-800' },
  verified: { labelBn: 'যাচাইকৃত', labelEn: 'Fact-Verified', tone: 'bg-emerald-100 text-emerald-800' },
  disputed: { labelBn: 'বিতর্কিত', labelEn: 'Disputed', tone: 'bg-orange-100 text-orange-800' },
  unverified: { labelBn: 'অপ্রমাণিত', labelEn: 'Unverified', tone: 'bg-stone-200 text-stone-700' },
  failed: { labelBn: 'যাচাই উত্তীর্ণ নয়', labelEn: 'Failed Verification', tone: 'bg-rose-100 text-rose-800' }
};

export const VERIFICATION_CHECKLIST_ITEMS = [
  { key: 'source_contacted', labelBn: 'অবদানকারী / প্রত্যক্ষদর্শীর সাথে যোগাযোগ', labelEn: 'Source / eyewitness contacted' },
  { key: 'location_checked', labelBn: 'ঘটনাস্থল ও সময়কাল যাচাই', labelEn: 'Location & incident timeline verified' },
  { key: 'media_authenticity_checked', labelBn: 'ছবি/ভিডিওর মৌলিকত্ব পরীক্ষা', labelEn: 'Photo/video authenticity checked' },
  { key: 'copyright_verified', labelBn: 'কপিরাইট ও মালিকানা যাচাই', labelEn: 'Copyright & ownership verified' },
  { key: 'public_interest_confirmed', labelBn: 'জনস্বার্থ ও নৈতিক মানদণ্ড নিশ্চিত', labelEn: 'Public interest & safety confirmed' }
];

export const ABUSE_REASONS = [
  { value: 'misinformation', labelBn: 'ভুয়া তথ্য / বিভ্রান্তি', labelEn: 'Misinformation / False Claim' },
  { value: 'privacy_violation', labelBn: 'ব্যক্তিগত গোপনীয়তা লঙ্ঘন', labelEn: 'Privacy / Personal Info Exposure' },
  { value: 'copyright', labelBn: 'কপিরাইট বা মালিকানা লঙ্ঘন', labelEn: 'Copyright Infringement' },
  { value: 'hate_speech', labelBn: 'বিদ্বেষমূলক বক্তব্য', labelEn: 'Hate Speech' },
  { value: 'harassment', labelBn: 'হয়রানি বা হুমকি', labelEn: 'Harassment / Threats' },
  { value: 'graphic_violence', labelBn: 'সহিংস বা আপত্তিকর দৃশ্য', labelEn: 'Graphic / Unsafe Content' },
  { value: 'spam', labelBn: 'স্প্যাম বা প্রচারণা', labelEn: 'Spam / Manipulation' },
  { value: 'other', labelBn: 'অন্যান্য নীতিমালা ভঙ্গ', labelEn: 'Other Policy Violation' }
];

export const EVENT_TYPES = [
  { value: 'townhall', labelBn: 'পাঠক সংলাপ (Townhall)', labelEn: 'Reader Townhall' },
  { value: 'workshop', labelBn: 'কর্মশালা (Workshop)', labelEn: 'Workshop' },
  { value: 'meetup', labelBn: 'সাক্ষাৎ ও আড্ডা (Meetup)', labelEn: 'Community Meetup' },
  { value: 'webinar', labelBn: 'ওয়েবিনার (Webinar)', labelEn: 'Webinar' },
  { value: 'contest', labelBn: 'প্রতিযোগিতা (Contest)', labelEn: 'Reporting Contest' }
];

export const ANNOUNCEMENT_TYPES = [
  { value: 'call_for_stories', labelBn: 'প্রতিবেদন আহ্বান', labelEn: 'Call for Stories', tone: 'bg-rose-50 text-rose-800 border-rose-200' },
  { value: 'guideline', labelBn: 'নীতিমালা ও নির্দেশিকা', labelEn: 'Editorial Guidelines', tone: 'bg-sky-50 text-sky-800 border-sky-200' },
  { value: 'safety_notice', labelBn: 'নিরাপত্তা সতর্কবার্তা', labelEn: 'Safety Notice', tone: 'bg-amber-50 text-amber-900 border-amber-200' },
  { value: 'community_update', labelBn: 'কমিউনিটি বার্তা', labelEn: 'Community Update', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
];

export const TRUST_LEVEL_META = {
  standard: { labelBn: 'সাধারণ সদস্য', labelEn: 'Standard', tone: 'bg-stone-100 text-stone-700' },
  trusted: { labelBn: 'বিশ্বস্ত অবদানকারী', labelEn: 'Trusted Contributor', tone: 'bg-emerald-100 text-emerald-800' },
  restricted: { labelBn: 'সীমিত সুবিধা', labelEn: 'Restricted', tone: 'bg-amber-100 text-amber-800' },
  suspended: { labelBn: 'স্থগিত', labelEn: 'Suspended', tone: 'bg-rose-100 text-rose-800' }
};

export const BANGLADESH_DIVISIONS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'খুলনা',
  'বরিশাল',
  'সিলেট',
  'রংপুর',
  'ময়মনসিংহ'
];

export function hasRequiredSubmissionConsents(form = {}) {
  const requiredFields = [
    'consent_editorial_review',
    'consent_privacy_policy',
    'copyright_declared',
    'media_ownership_declared'
  ];
  const missing = requiredFields.filter((key) => !form?.[key]);
  return {
    valid: missing.length === 0,
    missing
  };
}

export function sanitizeSubmissionLocationPreview({
  location_privacy_mode = 'district_only',
  public_location_label = '',
  district = '',
  division = ''
} = {}) {
  if (location_privacy_mode === 'hidden') {
    return null;
  }
  const cleanDistrict = String(district || '').trim();
  const cleanDivision = String(division || '').trim();
  const cleanLabel = String(public_location_label || '').trim();

  if (location_privacy_mode === 'district_only') {
    const parts = [cleanDistrict, cleanDivision].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (cleanLabel || null);
  }

  return cleanLabel || ([cleanDistrict, cleanDivision].filter(Boolean).join(', ') || null);
}

export function validateSafeSubmissionDraft(form = {}) {
  const errors = {};
  if (!String(form.title || '').trim() || String(form.title || '').trim().length < 8) {
    errors.title = 'শিরোনাম কমপক্ষে ৮ অক্ষরের হতে হবে।';
  }
  if (!String(form.district || '').trim()) {
    errors.district = 'জেলার নাম উল্লেখ করা আবশ্যক।';
  }
  const consents = hasRequiredSubmissionConsents(form);
  if (!consents.valid) {
    errors.consents = 'সম্পাদকীয় পর্যালোচনা, গোপনীয়তা নীতি, কপিরাইট এবং মিডিয়া মালিকানা ঘোষণা সম্মতি বাধ্যতামূলক।';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}


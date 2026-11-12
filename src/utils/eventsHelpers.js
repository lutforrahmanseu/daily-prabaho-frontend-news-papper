import { resolveEpaperApiUrl } from './epaperHelpers.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';

export const resolveEventMediaUrl = (pathOrUrl = '') => resolveEpaperApiUrl(pathOrUrl);

export const openPrintableCertificate = async (certId, token = null) => {
  const url = resolveEpaperApiUrl(`/api/v1/reader/events/certificates/${certId}/download`);
  const headers = { Accept: 'text/html' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) {
    throw new Error(`Certificate download failed (${response.status})`);
  }
  const html = await response.text();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const SPECIAL_PROJECT_TRACKS = [
  {
    key: 'education',
    labelBn: 'শিক্ষা উদ্যোগ',
    labelEn: 'Education Initiatives',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    accentColor: '#0369a1'
  },
  {
    key: 'science',
    labelBn: 'বিজ্ঞান উৎসব',
    labelEn: 'Science Festivals',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentColor: '#4338ca'
  },
  {
    key: 'youth',
    labelBn: 'যুব কার্যক্রম',
    labelEn: 'Youth Programs',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentColor: '#047857'
  },
  {
    key: 'cultural',
    labelBn: 'সাংস্কৃতিক অনুষ্ঠান',
    labelEn: 'Cultural Events',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    accentColor: '#be123c'
  },
  {
    key: 'agriculture',
    labelBn: 'কৃষি উদ্যোগ',
    labelEn: 'Agriculture Initiatives',
    badgeClass: 'bg-lime-50 text-lime-800 border-lime-200',
    accentColor: '#4d7c0f'
  },
  {
    key: 'awareness',
    labelBn: 'জনসচেতনতা প্রচারণা',
    labelEn: 'Public Awareness Campaigns',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    accentColor: '#b45309'
  }
];

export const SPECIAL_PROJECT_TRACK_MAP = Object.fromEntries(
  SPECIAL_PROJECT_TRACKS.map((track) => [track.key, track])
);

export const EVENT_TYPES = [
  { key: 'festival', labelBn: 'উৎসব', labelEn: 'Festival' },
  { key: 'competition', labelBn: 'প্রতিযোগিতা', labelEn: 'Competition' },
  { key: 'workshop', labelBn: 'কর্মশালা', labelEn: 'Workshop' },
  { key: 'townhall', labelBn: 'টাউনহল', labelEn: 'Townhall' },
  { key: 'campaign', labelBn: 'জনসচেতনতা ক্যাম্পেইন', labelEn: 'Campaign' },
  { key: 'webinar', labelBn: 'ওয়েবিনার', labelEn: 'Webinar' },
  { key: 'meetup', labelBn: 'সাক্ষাৎকার / মিটআপ', labelEn: 'Meetup' },
  { key: 'qa', labelBn: 'প্রশ্নোত্তর', labelEn: 'Q&A' }
];

export const EVENT_LIFECYCLE_STATUSES = {
  draft: { labelBn: 'খসড়া', labelEn: 'Draft', badgeClass: 'bg-stone-100 text-stone-700 border-stone-300' },
  published: { labelBn: 'উন্মুক্ত / প্রকাশিত', labelEn: 'Published', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ongoing: { labelBn: 'চলমান', labelEn: 'Ongoing', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' },
  completed: { labelBn: 'সম্পন্ন', labelEn: 'Completed', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  cancelled: { labelBn: 'বাতিল', labelEn: 'Cancelled', badgeClass: 'bg-red-50 text-red-700 border-red-200' }
};

export const PARTICIPANT_STATUS_META = {
  registered: { labelBn: 'নিবন্ধিত', labelEn: 'Registered', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' },
  confirmed: { labelBn: 'নিশ্চিত', labelEn: 'Confirmed', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  waitlisted: { labelBn: 'অপেক্ষমাণ', labelEn: 'Waitlisted', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  attended: { labelBn: 'উপস্থিত', labelEn: 'Attended', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' },
  cancelled: { labelBn: 'বাতিল', labelEn: 'Cancelled', badgeClass: 'bg-stone-100 text-stone-600 border-stone-200' }
};

export const COMPETITION_ENTRY_STATUSES = {
  submitted: { labelBn: 'জমাকৃত', badgeClass: 'bg-stone-100 text-stone-700' },
  shortlisted: { labelBn: 'সংক্ষিপ্ত তালিকাভুক্ত', badgeClass: 'bg-sky-100 text-sky-800' },
  finalist: { labelBn: 'ফাইনালিস্ট', badgeClass: 'bg-indigo-100 text-indigo-800' },
  winner: { labelBn: 'বিজয়ী', badgeClass: 'bg-emerald-100 text-emerald-800' },
  runner_up: { labelBn: 'রানার-আপ', badgeClass: 'bg-amber-100 text-amber-800' },
  honorable_mention: { labelBn: 'বিশেষ সম্মাননা', badgeClass: 'bg-teal-100 text-teal-800' },
  disqualified: { labelBn: 'বাতিলকৃত', badgeClass: 'bg-red-100 text-red-700' }
};

export const CERTIFICATE_TYPES = [
  { key: 'participation', labelBn: 'অংশগ্রহণ সনদ', labelEn: 'Participation' },
  { key: 'winner', labelBn: 'বিজয়ী সনদ', labelEn: 'Winner' },
  { key: 'merit', labelBn: 'মেধা সম্মাননা সনদ', labelEn: 'Merit' },
  { key: 'speaker', labelBn: 'বক্তা সম্মাননা', labelEn: 'Speaker' },
  { key: 'volunteer', labelBn: 'স্বেচ্ছাসেবক সনদ', labelEn: 'Volunteer' }
];

export const EVENT_ANNOUNCEMENT_TYPES = [
  { key: 'general', labelBn: 'সাধারণ ঘোষণা' },
  { key: 'schedule_change', labelBn: 'সময়সূচি পরিবর্তন' },
  { key: 'venue_update', labelBn: 'স্থান সংক্রান্ত আপডেট' },
  { key: 'deadline_extension', labelBn: 'সময়সীমা বর্ধিত' },
  { key: 'result_notice', labelBn: 'ফলাফল বিজ্ঞপ্তি' }
];

export const isRegistrationOpen = (event, now = new Date()) => {
  if (!event || event.status !== 'published') return false;
  if (event.registration_deadline_at) {
    const deadline = new Date(event.registration_deadline_at);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime()) {
      return false;
    }
  }
  if (event.capacity !== null && event.capacity !== undefined) {
    const count = Number(event.registered_count || 0);
    if (count >= Number(event.capacity) && !event.allow_waitlist) {
      return false;
    }
  }
  return true;
};

export const validateEventRegistrationForm = (form = {}, event = null) => {
  const errors = [];

  if (!event || !isRegistrationOpen(event)) {
    errors.push('এই ইভেন্টে বর্তমানে নিবন্ধন উন্মুক্ত নয় বা সময়সীমা/আসন পূর্ণ হয়েছে।');
  }

  const name = String(form.participant_name || '').trim();
  if (name.length < 2) {
    errors.push('অংশগ্রহণকারীর পূর্ণ নাম প্রদান করুন।');
  }

  if (event?.require_phone && !String(form.participant_phone || '').trim()) {
    errors.push('এই ইভেন্টের জন্য মোবাইল নম্বর প্রদান বাধ্যতামূলক।');
  }

  if (event?.require_organization && !String(form.organization || '').trim()) {
    errors.push('শিক্ষাপ্রতিষ্ঠান বা সংগঠনের নাম উল্লেখ করা বাধ্যতামূলক।');
  }

  if (!form.consent_event_updates) {
    errors.push('ইভেন্ট সংক্রান্ত আপডেট গ্রহণের সম্মতি দিন।');
  }

  if (!form.consent_privacy_policy) {
    errors.push('অংশগ্রহণকারী গোপনীয়তা ও প্রাইভেসি নীতিমালায় সম্মতি দিন।');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const maskPrivateParticipantText = (name, district = '', consentPublic = false) => {
  const cleanName = String(name || '').trim();
  if (!cleanName) return district ? `অংশগ্রহণকারী (${district})` : 'অংশগ্রহণকারী';
  if (consentPublic) return cleanName;
  const first = cleanName.split(/\s+/)[0] || 'অংশগ্রহণকারী';
  return district ? `${first} (${district})` : first;
};

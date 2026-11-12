import { toBengaliNumber } from './bengaliFormatter.js';

export const ASSIGNMENT_PRIORITY_META = {
  low: { labelBn: 'সাধারণ', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  normal: { labelBn: 'মাঝারি', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  high: { labelBn: 'উচ্চ অগ্রাধিকার', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  urgent: { labelBn: 'জরুরি ব্রেকিং', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' }
};

export const ASSIGNMENT_STATUS_META = {
  assigned: { labelBn: 'নির্ধারিত', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' },
  accepted: { labelBn: 'গৃহীত', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { labelBn: 'কাজ চলমান', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  submitted: { labelBn: 'জমা হয়েছে', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  revision_requested: { labelBn: 'সংশোধন প্রয়োজন', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  completed: { labelBn: 'সম্পন্ন', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  cancelled: { labelBn: 'বাতিল', badgeClass: 'bg-stone-200 text-stone-600 border-stone-300' }
};

export const AVAILABILITY_STATUS_META = {
  available: { labelBn: 'উপলব্ধ', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  on_assignment: { labelBn: 'মাঠে / অ্যাসাইনমেন্টে', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  leave: { labelBn: 'ছুটিতে', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  sick: { labelBn: 'অসুস্থ', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  off_duty: { labelBn: 'অফ-ডিউটি', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  unavailable: { labelBn: 'অনুপলব্ধ', badgeClass: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export const SHIFT_LABELS = {
  morning: 'সকাল শিফট',
  day: 'দিবা শিফট',
  evening: 'সন্ধ্যা শিফট',
  night: 'রাত শিফট',
  full_day: 'পূর্ণ দিবস'
};

export const SOURCE_TYPE_LABELS = {
  official: 'সরকারি / প্রাতিষ্ঠানিক',
  whistleblower: 'গোপন তথ্যদাতা',
  expert: 'বিশেষজ্ঞ / গবেষক',
  eyewitness: 'প্রত্যক্ষদর্শী',
  document: 'নথি / দলিল',
  agency: 'বার্তা সংস্থা'
};

export const RELIABILITY_META = {
  A: { labelBn: 'গ্রেড A (সর্বোচ্চ নির্ভরযোগ্য)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  B: { labelBn: 'গ্রেড B (নির্ভরযোগ্য)', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
  C: { labelBn: 'গ্রেড C (দ্বিতীয় যাচাই প্রয়োজন)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  D: { labelBn: 'গ্রেড D (সতর্কতামূলক)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' }
};

export const VERIFICATION_STATUS_META = {
  verified: { labelBn: 'যাচাইকৃত', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pending: { labelBn: 'অপেক্ষমাণ', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  flagged: { labelBn: 'সতর্কতা চিহ্নিত', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  blacklisted: { labelBn: 'কালোতালিকাভুক্ত', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' }
};

export const CORRECTION_TYPE_LABELS = {
  factual_error: 'তথ্যগত ত্রুটি',
  spelling_grammar: 'বানান ও ভাষা',
  attribution: 'উদ্ধৃতি / সূত্র সংশোধন',
  headline: 'শিরোনাম সংশোধন',
  clarification: 'সম্পাদকীয় ব্যাখ্যা',
  retraction: 'সংবাদ প্রত্যাহার'
};

export const CORRECTION_STATUS_META = {
  pending: { labelBn: 'পর্যালোচনাধীন', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { labelBn: 'অনুমোদিত (অপ্রকাশিত)', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  published: { labelBn: 'প্রকাশিত সংশোধনী', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', badgeClass: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export const PLAN_SLOT_LABELS = {
  lead: 'প্রধান লিড (Lead)',
  second_lead: 'সেকেন্ড লিড',
  special: 'বিশেষ প্রতিবেদন',
  multimedia: 'ভিডিও / মাল্টিমিডিয়া',
  standard: 'নিয়মিত সংবাদ'
};

export function formatDateTimeBn(value) {
  if (!value) return 'নির্ধারিত নয়';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateBn(value) {
  if (!value) return 'নির্ধারিত নয়';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('bn-BD', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatBnCount(val) {
  return toBengaliNumber(Number(val ?? 0));
}


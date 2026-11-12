import { fetchWithTimeout } from './fetchWithTimeout.js';

export const EPAPER_EDITION_CODES = [
  { code: 'national', nameBn: 'জাতীয় সংস্করণ', nameEn: 'National Edition' },
  { code: 'dhaka', nameBn: 'ঢাকা সংস্করণ', nameEn: 'Dhaka Edition' },
  { code: 'chattogram', nameBn: 'চট্টগ্রাম সংস্করণ', nameEn: 'Chattogram Edition' },
  { code: 'sylhet', nameBn: 'সিলেট সংস্করণ', nameEn: 'Sylhet Edition' },
  { code: 'international', nameBn: 'আন্তর্জাতিক সংস্করণ', nameEn: 'International Edition' }
];

export const EPAPER_ACCESS_LEVELS = [
  {
    id: 'public',
    labelBn: 'সবার জন্য উন্মুক্ত',
    labelEn: 'Public (Open Access)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'registered',
    labelBn: 'নিবন্ধিত পাঠক',
    labelEn: 'Registered Readers Only',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'subscriber',
    labelBn: 'ই-পেপার প্লাস সাবস্ক্রাইবার',
    labelEn: 'Subscriber Only (E-Paper Plus)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export const EPAPER_DOWNLOAD_POLICIES = [
  {
    id: 'disabled',
    labelBn: 'ডাউনলোড বন্ধ (শুধু পড়া)',
    labelEn: 'Disabled (View Only)',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200'
  },
  {
    id: 'registered',
    labelBn: 'নিবন্ধিত পাঠকের ডাউনলোড',
    labelEn: 'Registered Users Only',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    id: 'public',
    labelBn: 'সবার জন্য ডাউনলোড অনুমোদিত',
    labelEn: 'Public Download Allowed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
];

export const EPAPER_STATUS_META = {
  draft: { id: 'draft', labelBn: 'খসড়া', labelEn: 'Draft', badgeClass: 'bg-stone-100 text-stone-700 border-stone-300' },
  published: { id: 'published', labelBn: 'প্রকাশিত', labelEn: 'Published', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { id: 'archived', labelBn: 'সংরক্ষিত', labelEn: 'Archived', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' }
};

export const BENGALI_MONTHS = [
  { value: 1, nameBn: 'জানুয়ারি', nameEn: 'January' },
  { value: 2, nameBn: 'ফেব্রুয়ারি', nameEn: 'February' },
  { value: 3, nameBn: 'মার্চ', nameEn: 'March' },
  { value: 4, nameBn: 'এপ্রিল', nameEn: 'April' },
  { value: 5, nameBn: 'মে', nameEn: 'May' },
  { value: 6, nameBn: 'জুন', nameEn: 'June' },
  { value: 7, nameBn: 'জুলাই', nameEn: 'July' },
  { value: 8, nameBn: 'আগস্ট', nameEn: 'August' },
  { value: 9, nameBn: 'সেপ্টেম্বর', nameEn: 'September' },
  { value: 10, nameBn: 'অক্টোবর', nameEn: 'October' },
  { value: 11, nameBn: 'নভেম্বর', nameEn: 'November' },
  { value: 12, nameBn: 'ডিসেম্বর', nameEn: 'December' }
];

export const getApiOriginBase = () => {
  if (typeof window === 'undefined') return '';
  const configured = import.meta?.env?.VITE_API_URL || '/api/v1';
  return configured.replace(/\/api\/v1\/?$/, '');
};

export const resolveEpaperApiUrl = (relativeApiPath = '') => {
  if (!relativeApiPath) return '';
  if (/^https?:\/\//i.test(relativeApiPath)) return relativeApiPath;
  const base = getApiOriginBase();
  return `${base}${relativeApiPath.startsWith('/') ? '' : '/'}${relativeApiPath}`;
};

export const formatPdfBytes = (bytes = 0) => {
  const value = Number(bytes) || 0;
  if (value <= 0) return '0 KB';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

export const buildPdfFragmentUrl = (blobUrl, pageNumber = 1, zoomPercent = 100) => {
  if (!blobUrl) return '';
  const safePage = Math.max(1, parseInt(pageNumber, 10) || 1);
  const safeZoom = Math.max(50, Math.min(200, parseInt(zoomPercent, 10) || 100));
  return `${blobUrl}#page=${safePage}&zoom=${safeZoom}&toolbar=0&navpanes=0`;
};

export const normalizeEpaperPage = (page = {}) => ({
  id: page.id,
  epaper_edition_id: page.epaper_edition_id,
  page_number: Number(page.page_number) || 1,
  pdf_source_page: Number(page.pdf_source_page || page.page_number) || 1,
  section_name_bn: page.section_name_bn || 'সাধারণ পাতা',
  section_name_en: page.section_name_en || 'General Page',
  headline: page.headline || '',
  summary: page.summary || '',
  extracted_text: page.extracted_text || '',
  related_news_ids: Array.isArray(page.related_news_ids) ? page.related_news_ids : [],
  has_own_pdf: Boolean(page.has_own_pdf),
  has_pdf: Boolean(page.has_pdf),
  pdf_size: Number(page.pdf_size) || 0,
  has_preview: Boolean(page.has_preview),
  pdf_stream_url: page.pdf_stream_url || null,
  preview_url: page.preview_url || null,
  views_count: Number(page.views_count) || 0
});

export const normalizeEpaperEdition = (edition = {}) => ({
  id: edition.id,
  title: edition.title || '',
  title_en: edition.title_en || edition.title || '',
  slug: edition.slug || String(edition.id || ''),
  publication_date: edition.publication_date || '',
  edition_code: edition.edition_code || 'national',
  edition_name_bn: edition.edition_name_bn || 'জাতীয় সংস্করণ',
  edition_name_en: edition.edition_name_en || 'National Edition',
  volume_number: edition.volume_number || '',
  issue_number: edition.issue_number || '',
  price_label: edition.price_label || '',
  summary: edition.summary || '',
  status: edition.status || 'draft',
  access_level: edition.access_level || 'public',
  download_policy: edition.download_policy || 'registered',
  is_featured: Boolean(edition.is_featured),
  access_granted: Boolean(edition.access_granted),
  can_download: Boolean(edition.can_download),
  lock_reason: edition.lock_reason || null,
  has_pdf: Boolean(edition.has_pdf),
  has_cover: Boolean(edition.has_cover),
  pdf_original_name: edition.pdf_original_name || '',
  pdf_mime_type: edition.pdf_mime_type || 'application/pdf',
  pdf_size: Number(edition.pdf_size) || 0,
  pdf_version: edition.pdf_version || '',
  pdf_page_count: Number(edition.pdf_page_count) || 0,
  pdf_checksum_sha256: edition.pdf_checksum_sha256 || null,
  pdf_metadata: edition.pdf_metadata || null,
  stream_url: edition.stream_url || null,
  download_url: edition.download_url || null,
  cover_url: edition.cover_url || null,
  pages_count: Number(edition.pages_count) || (Array.isArray(edition.pages) ? edition.pages.length : 0),
  pages: Array.isArray(edition.pages) ? edition.pages.map(normalizeEpaperPage) : [],
  views_count: Number(edition.views_count) || 0,
  downloads_count: Number(edition.downloads_count) || 0,
  published_at: edition.published_at || null
});

export const getAccessControlMessage = (lockReason, isBn = true) => {
  switch (lockReason) {
    case 'login_required':
      return isBn
        ? 'এই সংস্করণটি পড়তে আপনার পাঠক অ্যাকাউন্টে লগইন করতে হবে।'
        : 'Please sign in with your reader account to read this E-paper edition.';
    case 'subscription_required':
    case 'login_and_subscription_required':
      return isBn
        ? 'এই বিশেষ সংস্করণটি কেবল ই-পেপার প্লাস (সাবস্ক্রাইবার) পাঠকদের জন্য সংরক্ষিত।'
        : 'This edition requires an active E-Paper Plus subscription.';
    default:
      return isBn
        ? 'এই ই-পেপার সংস্করণটিতে প্রবেশাধিকার সীমাবদ্ধ।'
        : 'Access to this E-paper edition is restricted.';
  }
};

export const getDownloadPermissionMessage = (edition = {}, isReaderAuth = false, isBn = true) => {
  if (edition.can_download) {
    return isBn ? 'PDF ডাউনলোড' : 'Download PDF';
  }
  if (edition.download_policy === 'disabled') {
    return isBn ? 'ডাউনলোড বন্ধ (শুধু অনলাইনে পড়া যাবে)' : 'Download disabled (View Only)';
  }
  if (!isReaderAuth && edition.download_policy === 'registered') {
    return isBn ? 'ডাউনলোড করতে লগইন করুন' : 'Sign in to Download PDF';
  }
  return isBn ? 'ডাউনলোড অনুমোদিত নয়' : 'Download Restricted';
};

export const fetchProtectedEpaperBlob = async (apiRelativePath, token = null) => {
  const url = resolveEpaperApiUrl(apiRelativePath);
  const headers = { Accept: 'application/pdf,image/*,*/*' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) {
    const error = new Error(`Failed to load protected resource (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return await response.blob();
};


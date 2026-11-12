/**
 * Phase 24: Privacy-First Advanced News Analytics & Experimentation Helpers
 */
import { fetchWithTimeout } from './fetchWithTimeout.js';

export const ANALYTICS_DATE_PRESETS = [
  { value: 'today', label: 'আজ' },
  { value: '7d', label: '৭ দিন' },
  { value: '14d', label: '১৪ দিন' },
  { value: '30d', label: '৩০ দিন' },
  { value: '90d', label: '৯০ দিন' },
  { value: 'custom', label: 'কাস্টম তারিখ' }
];

export const TRAFFIC_SOURCE_LABELS = {
  direct: 'সরাসরি ভিজিট (Direct)',
  organic_search: 'অর্গানিক সার্চ',
  social: 'সোশ্যাল মিডিয়া',
  referral: 'রেফারেল লিংক',
  newsletter: 'নিউজলেটার',
  internal: 'অভ্যন্তরীণ লিংক'
};

export const DEVICE_TYPE_LABELS = {
  mobile: 'মোবাইল',
  desktop: 'ডেস্কটপ',
  tablet: 'ট্যাবলেট'
};

export const EXPERIMENT_TYPE_LABELS = {
  headline: 'শিরোনাম A/B পরীক্ষা',
  featured_image: 'ফিচার্ড ছবি A/B পরীক্ষা',
  homepage_layout: 'হোমপেজ লেআউট A/B পরীক্ষা'
};

export const FORMAT_DURATION_BN = (seconds = 0) => {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins === 0) return `${rem} সেকেন্ড`;
  return `${mins} মি. ${rem} সে.`;
};

/**
 * Compute two-proportion Z-test confidence percentage (0 to 99.9) & relative CTR lift.
 */
export const computeVariantStatistics = (control = {}, variant = {}) => {
  const n1 = Number(control.impressions_count || 0);
  const c1 = Number(control.clicks_count || 0);
  const n2 = Number(variant.impressions_count || 0);
  const c2 = Number(variant.clicks_count || 0);

  const ctr1 = n1 > 0 ? c1 / n1 : 0;
  const ctr2 = n2 > 0 ? c2 / n2 : 0;
  const liftPercent = ctr1 > 0 ? Number((((ctr2 - ctr1) / ctr1) * 100).toFixed(2)) : 0;

  if (n1 < 20 || n2 < 20) {
    return { liftPercent, confidencePercent: 0, isSignificant: false };
  }

  const pooled = (c1 + c2) / (n1 + n2);
  const seSquared = pooled * (1 - pooled) * (1 / n1 + 1 / n2);
  if (seSquared <= 0) {
    return { liftPercent, confidencePercent: 0, isSignificant: false };
  }

  const z = Math.abs(ctr2 - ctr1) / Math.sqrt(seSquared);
  const pValue = 1 - erfApprox(z / Math.SQRT2);
  const confidencePercent = Number(Math.max(0, Math.min(99.9, (1 - pValue) * 100)).toFixed(1));

  return {
    liftPercent,
    confidencePercent,
    isSignificant: confidencePercent >= 95.0
  };
};

const erfApprox = (x) => {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
};

/**
 * Check browser Do-Not-Track / local consent flag before dispatching analytics telemetry.
 */
export const canSendClientAnalyticsTelemetry = (explicitConsent = true, navObj = null, storageObj = null) => {
  if (explicitConsent === false) return false;

  const nav = navObj || (typeof navigator !== 'undefined' ? navigator : null);
  if (nav && (nav.doNotTrack === '1' || nav.msDoNotTrack === '1')) {
    return false;
  }

  try {
    const store = storageObj || (typeof window !== 'undefined' ? window.localStorage : null);
    if (store && store.getItem('newsflow_analytics_consent') === 'false') {
      return false;
    }
  } catch {
    // Ignore storage restriction
  }

  return true;
};

/**
 * Neutralize CSV formula characters (=, +, -, @, tab, cr) safely before browser export.
 */
export const sanitizeExportCsvCell = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  const trimmed = str.replace(/^\s+/, '');
  if (trimmed && ['=', '+', '-', '@', '\t', '\r'].includes(trimmed[0])) {
    return `'${str}`;
  }
  return str;
};

/**
 * Trigger authenticated file download for Phase 24 CSV/JSON export endpoint.
 */
export const downloadAnalyticsExport = async ({ baseUrl, token, section = 'overview', format = 'csv', filters = {} }) => {
  const params = new URLSearchParams({
    section,
    format,
    ...(filters.preset ? { preset: filters.preset } : {}),
    ...(filters.start_date ? { start_date: filters.start_date } : {}),
    ...(filters.end_date ? { end_date: filters.end_date } : {}),
    ...(filters.category_id ? { category_id: String(filters.category_id) } : {})
  });

  const cleanBase = (baseUrl || '/api/v1').replace(/\/$/, '');
  const response = await fetchWithTimeout(`${cleanBase}/analytics/advanced/export?${params.toString()}`, {
    headers: {
      Accept: format === 'json' ? 'application/json' : 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error('রিপোর্ট ডাউনলোড করতে ব্যর্থ হয়েছে');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `newsflow-analytics-${section}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


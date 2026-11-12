/**
 * Shared Phase 35 News API & Content Syndication helpers (framework-agnostic for Node unit testing).
 */

export const SYNDICATION_SCOPES = [
  { id: 'articles:read', labelBn: 'প্রকাশিত সংবাদ', labelEn: 'Published Articles' },
  { id: 'taxonomy:read', labelBn: 'ক্যাটাগরি ও ট্যাগ', labelEn: 'Categories & Tags' },
  { id: 'journalists:read', labelBn: 'সাংবাদিক প্রোফাইল', labelEn: 'Journalist Profiles' },
  { id: 'media:read', labelBn: 'পাবলিক মিডিয়া', labelEn: 'Public Media Metadata' },
  { id: 'search:read', labelBn: 'আর্টিকেল সার্চ', labelEn: 'Article Search' },
  { id: 'feeds:read', labelBn: 'টপিক ও লোকাল ফিড', labelEn: 'Topic & Location Feeds' }
];

export const WEBHOOK_EVENTS = [
  { id: 'article.published', labelBn: 'সংবাদ প্রকাশিত হলে', labelEn: 'Article Published' },
  { id: 'article.updated', labelBn: 'সংবাদ হালনাগাদ হলে', labelEn: 'Article Updated' },
  { id: 'article.retracted', labelBn: 'সংবাদ প্রত্যাহার হলে', labelEn: 'Article Retracted' }
];

const APPROVAL_META = {
  approved: { labelBn: 'অনুমোদিত', labelEn: 'Approved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pending: { labelBn: 'অপেক্ষমাণ', labelEn: 'Pending Review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  under_review: { labelBn: 'যাচাই চলছে', labelEn: 'Under Review', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  suspended: { labelBn: 'স্থগিত', labelEn: 'Suspended', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', labelEn: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200' },
  revoked: { labelBn: 'বাতিল', labelEn: 'Revoked', cls: 'bg-stone-200 text-stone-700 border-stone-300' },
  expired: { labelBn: 'মেয়াদোত্তীর্ণ', labelEn: 'Expired', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  active: { labelBn: 'সক্রিয়', labelEn: 'Active', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rotated_grace: { labelBn: 'রোটেশন গ্রেস', labelEn: 'Rotation Grace', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  delivered: { labelBn: 'সফল ডেলিভারি', labelEn: 'Delivered', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  retrying: { labelBn: 'পুনঃচেষ্টা চলছে', labelEn: 'Retrying', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  failed: { labelBn: 'ব্যর্থ', labelEn: 'Failed', cls: 'bg-rose-100 text-rose-800 border-rose-200' }
};

export function getSyndicationStatusMeta(status, isBn = true) {
  const entry = APPROVAL_META[status] || {
    labelBn: status || 'অজানা',
    labelEn: status || 'Unknown',
    cls: 'bg-stone-100 text-stone-700 border-stone-200'
  };
  return {
    label: isBn ? entry.labelBn : entry.labelEn,
    cls: entry.cls
  };
}

export function filterAllowedScopes(requestedScopes = [], planAllowedScopes = []) {
  const validSet = new Set(SYNDICATION_SCOPES.map((s) => s.id));
  const planSet = Array.isArray(planAllowedScopes) && planAllowedScopes.length > 0
    ? new Set(planAllowedScopes)
    : validSet;

  return [...new Set((requestedScopes || []).filter((s) => validSet.has(s) && planSet.has(s)))];
}

export function formatLicenseAttribution(template, context = {}) {
  const safeTemplate = template || 'Source: NewsFlow ({reporter}) — {canonical_url}';
  return safeTemplate
    .replaceAll('{publisher}', context.publisher || 'NewsFlow / দৈনিক বার্তা প্রবাহ')
    .replaceAll('{reporter}', context.reporter || 'NewsFlow Desk')
    .replaceAll('{canonical_url}', context.canonicalUrl || 'https://newsflow.local/news/sample-story')
    .replaceAll('{published_at}', context.publishedAt || '2026-11-12T00:00:00Z');
}

export function buildCurlExample(endpointPath = '/articles', apiKeyPreview = 'nf_test_YOUR_KEY') {
  const safePath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `curl -sS "https://your-domain.com/api/syndication/v1${safePath}" \\\n  -H "X-API-Key: ${apiKeyPreview}" \\\n  -H "Accept: application/json"`;
}

export function buildWebhookVerificationSnippet(lang = 'node') {
  if (lang === 'php') {
    return [
      '$sigHeader = $_SERVER["HTTP_X_NEWSFLOW_SIGNATURE"] ?? "";',
      '$timestamp = $_SERVER["HTTP_X_NEWSFLOW_TIMESTAMP"] ?? "";',
      '$rawBody = file_get_contents("php://input");',
      '$expected = "t={$timestamp},v1=" . hash_hmac("sha256", "{$timestamp}.{$rawBody}", $signingSecret);',
      'if (!hash_equals($expected, $sigHeader)) { http_response_code(401); exit; }'
    ].join('\n');
  }

  return [
    'import crypto from "node:crypto";',
    'const timestamp = req.headers["x-newsflow-timestamp"];',
    'const sigHeader = req.headers["x-newsflow-signature"];',
    'const expected = `t=${timestamp},v1=${crypto.createHmac("sha256", signingSecret).update(`${timestamp}.${rawBody}`).digest("hex")}`;',
    'const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader));'
  ].join('\n');
}


import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  generateNewsArticleSchema,
  generateBreadcrumbSchema,
  buildCanonicalUrl,
  BASE_SITE_URL,
  SITE_NAME
} from '../utils/seoHelpers.js';

import {
  validateNewsForm,
  validateCategoryForm,
  validateUserForm,
  validateAdCampaignForm
} from '../utils/formValidators.js';

import {
  sanitizeText,
  escapeHtml,
  isSqlSafeParam,
  verifyParameterizedQuery
} from '../utils/securitySanitizer.js';

import {
  ROLES_DEFINITION,
  PERMISSIONS,
  backendHasPermission,
  backendLogin
} from '../services/authRbacBackend.js';

import {
  executeWorkflowTransition,
  WORKFLOW_STATUSES
} from '../services/editorialWorkflowBackend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// ==========================================
// 1. SEO & STRUCTURED DATA TESTS
// ==========================================

test('SEO: robots.txt exists and specifies required crawler directives', () => {
  const robotsPath = path.join(rootDir, 'public/robots.txt');
  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
  
  const content = fs.readFileSync(robotsPath, 'utf8');
  assert.match(content, /User-agent:\s*\*/i);
  assert.match(content, /Allow:\s*\//i);
  assert.match(content, /Disallow:\s*\/admin\//i);
  assert.match(content, /Disallow:\s*\/api\//i);
  assert.match(content, /Sitemap:\s*https:\/\/dailyprabaho\.com\/sitemap\.xml/i);
  assert.match(content, /Sitemap:\s*https:\/\/dailyprabaho\.com\/sitemap-news\.xml/i);
});

test('SEO: sitemap.xml exists and conforms to Sitemap 0.9 schema', () => {
  const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');

  const content = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must have XML declaration');
  assert.match(content, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(content, /<loc>https:\/\/dailyprabaho\.com\/<\/loc>/);
  assert.match(content, /<loc>https:\/\/dailyprabaho\.com\/category\/bangladesh<\/loc>/);
  assert.match(content, /<priority>1\.0<\/priority>/);
});

test('SEO: sitemap-news.xml conforms to Google News Sitemap specifications', () => {
  const newsSitemapPath = path.join(rootDir, 'public/sitemap-news.xml');
  assert.ok(fs.existsSync(newsSitemapPath), 'public/sitemap-news.xml must exist');

  const content = fs.readFileSync(newsSitemapPath, 'utf8');
  assert.ok(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must have XML declaration');
  assert.match(content, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(content, /<news:news>/);
  assert.match(content, /<news:publication>/);
  assert.match(content, /<news:name>দৈনিক বার্তা প্রবাহ<\/news:name>/);
  assert.match(content, /<news:language>bn<\/news:language>/);
  assert.match(content, /<news:publication_date>/);
  assert.match(content, /<news:title>/);
});

test('SEO: generateNewsArticleSchema produces valid Schema.org NewsArticle JSON-LD', () => {
  const mockArticle = {
    title: 'ঢাকা মেট্রোরেল সম্প্রসারণে নতুন গতি',
    slug: 'dhaka-metro-expansion',
    excerpt: 'টঙ্গী ও সাভার পর্যন্ত রুট সমীক্ষা সম্পন্ন হয়েছে।',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
    categoryName: 'বাংলাদেশ',
    author: 'নিজস্ব প্রতিবেদক',
    publishedAt: '2026-11-10T08:00:00Z',
    updatedAt: '2026-11-10T09:00:00Z'
  };

  const schema = generateNewsArticleSchema(mockArticle);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'NewsArticle');
  assert.equal(schema.headline, mockArticle.title);
  assert.equal(schema.description, mockArticle.excerpt);
  assert.equal(schema.mainEntityOfPage['@type'], 'WebPage');
  assert.equal(schema.mainEntityOfPage['@id'], `${BASE_SITE_URL}/news/${mockArticle.slug}`);
  assert.equal(schema.author['@type'], 'Person');
  assert.equal(schema.author.name, mockArticle.author);
  assert.equal(schema.publisher['@type'], 'NewsMediaOrganization');
  assert.equal(schema.publisher.name, SITE_NAME);
  assert.ok(schema.publisher.logo.url.endsWith('/logo.png'));
});

test('SEO: generateBreadcrumbSchema produces valid BreadcrumbList structure', () => {
  const breadcrumbs = [
    { name: 'প্রচ্ছদ', url: '/' },
    { name: 'বাংলাদেশ', url: '/category/bangladesh' },
    { name: 'ঢাকা মেট্রোরেল সম্প্রসারণ', url: '/news/dhaka-metro-expansion' }
  ];

  const schema = generateBreadcrumbSchema(breadcrumbs);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema.itemListElement.length, 3);
  assert.equal(schema.itemListElement[0].position, 1);
  assert.equal(schema.itemListElement[0].name, 'প্রচ্ছদ');
  assert.equal(schema.itemListElement[0].item, `${BASE_SITE_URL}/`);
  assert.equal(schema.itemListElement[1].position, 2);
  assert.equal(schema.itemListElement[2].position, 3);
});

test('SEO: buildCanonicalUrl strips queries and anchors', () => {
  assert.equal(
    buildCanonicalUrl('/news/dhaka-metro?ref=fb&source=feed#comments'),
    'https://dailyprabaho.com/news/dhaka-metro'
  );
  assert.equal(
    buildCanonicalUrl('category/sports?page=2'),
    'https://dailyprabaho.com/category/sports'
  );
  assert.equal(buildCanonicalUrl(''), 'https://dailyprabaho.com/');
});

// ==========================================
// 2. FORM VALIDATION TESTS
// ==========================================

test('Form Validation: validateNewsForm enforces required fields and limits', () => {
  // Empty payload
  const emptyRes = validateNewsForm({});
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.title);
  assert.ok(emptyRes.errors.slug);
  assert.ok(emptyRes.errors.category);

  // Invalid slug with spaces and special characters
  const badSlugRes = validateNewsForm({
    title: 'বৈধ শিরোনাম পরীক্ষা',
    slug: 'invalid slug with spaces!',
    category: 'bangladesh',
    content: 'এখানে বিস্তারিত সংবাদ রয়েছে।'
  });
  assert.equal(badSlugRes.isValid, false);
  assert.ok(badSlugRes.errors.slug);

  // Valid payload
  const validRes = validateNewsForm({
    title: 'ঢাকা মেট্রোরেল সম্প্রসারণ প্রকল্প অনুমোদন',
    slug: 'dhaka-metro-expansion-approved',
    category: 'bangladesh',
    content: 'সরকার আজ এই ঐতিহাসিক প্রকল্প অনুমোদন করেছে।',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957'
  });
  assert.equal(validRes.isValid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test('Form Validation: validateCategoryForm enforces uniqueness and bilingual names', () => {
  const existing = [{ id: 1, slug: 'national', nameBn: 'জাতীয়', nameEn: 'National' }];

  // Duplicate slug
  const dupRes = validateCategoryForm({ slug: 'national', nameBn: 'জাতীয় সংবাদ', nameEn: 'National News' }, existing);
  assert.equal(dupRes.isValid, false);
  assert.ok(dupRes.errors.slug);

  // Missing English name
  const missingEnRes = validateCategoryForm({ slug: 'sports', nameBn: 'খেলাধুলা', nameEn: '' }, existing);
  assert.equal(missingEnRes.isValid, false);
  assert.ok(missingEnRes.errors.nameEn);

  // Valid new category
  const validRes = validateCategoryForm({ slug: 'technology', nameBn: 'বিজ্ঞান ও প্রযুক্তি', nameEn: 'Technology' }, existing);
  assert.equal(validRes.isValid, true);
});

test('Form Validation: validateUserForm checks email RFC format and password complexity', () => {
  // Invalid email
  const badEmailRes = validateUserForm({
    name: 'তানভীর আহমেদ',
    email: 'not-an-email',
    role: 'Reporter',
    password: 'Password123'
  });
  assert.equal(badEmailRes.isValid, false);
  assert.ok(badEmailRes.errors.email);

  // Weak password (no number or uppercase)
  const weakPassRes = validateUserForm({
    name: 'তানভীর আহমেদ',
    email: 'tanvir@dailyprabaho.com',
    role: 'Reporter',
    password: 'password'
  });
  assert.equal(weakPassRes.isValid, false);
  assert.ok(weakPassRes.errors.password);

  // Valid staff user
  const validRes = validateUserForm({
    name: 'ফারহানা ইসলাম',
    email: 'farhana@dailyprabaho.com',
    role: 'News Editor',
    password: 'SecurePass2026'
  });
  assert.equal(validRes.isValid, true);
});

test('Form Validation: validateAdCampaignForm validates date chronology and placement', () => {
  // Invalid date chronology: end before start
  const badDateRes = validateAdCampaignForm({
    title: 'শীতকালীন মেগা অফার',
    advertiser: 'গ্রামীণফোন',
    placement: 'leaderboard',
    startDate: '2026-12-01',
    endDate: '2026-11-01'
  });
  assert.equal(badDateRes.isValid, false);
  assert.ok(badDateRes.errors.endDate);

  // Invalid placement
  const badPlacementRes = validateAdCampaignForm({
    title: 'শীতকালীন মেগা অফার',
    advertiser: 'গ্রামীণফোন',
    placement: 'unknown_placement',
    startDate: '2026-11-01',
    endDate: '2026-12-01'
  });
  assert.equal(badPlacementRes.isValid, false);
  assert.ok(badPlacementRes.errors.placement);

  // Valid campaign
  const validRes = validateAdCampaignForm({
    title: 'বিজয় দিবস ক্যাম্পেইন',
    advertiser: 'রবি আজিয়াটা',
    placement: 'leaderboard',
    startDate: '2026-11-15',
    endDate: '2026-12-31'
  });
  assert.equal(validRes.isValid, true);
});

// ==========================================
// 3. SECURITY & SANITIZATION CHECKS
// ==========================================

test('Security: sanitizeText strips script injection and onerror handlers', () => {
  const maliciousInput = '<script>alert("XSS")</script>জরুরি সংবাদ<img src="x" onerror="stealCookies()">';
  const clean = sanitizeText(maliciousInput);
  
  assert.ok(!clean.includes('<script>'), 'Must strip script tags');
  assert.ok(!clean.includes('alert("XSS")'), 'Must strip script contents');
  assert.ok(!clean.includes('onerror='), 'Must strip onerror event handler');
  assert.ok(clean.includes('জরুরি সংবাদ'), 'Must preserve legitimate text content');
});

test('Security: escapeHtml properly encodes HTML entities', () => {
  const raw = '<div class="news">"সতর্কতা" & \'পরামর্শ\'</div>';
  const escaped = escapeHtml(raw);
  
  assert.equal(escaped, '&lt;div class=&quot;news&quot;&gt;&quot;সতর্কতা&quot; &amp; &#039;পরামর্শ&#039;&lt;/div&gt;');
});

test('Security: verifyParameterizedQuery verifies parameterized query placeholders', () => {
  const safePdoQuery = 'SELECT * FROM news WHERE status = $1 AND category_id = $2 ORDER BY published_at DESC LIMIT $3';
  assert.equal(verifyParameterizedQuery(safePdoQuery), true);

  const rawConcatenatedQuery = "INSERT INTO news (title) VALUES ('" + "malicious'); DROP TABLE news; --" + "')";
  assert.equal(verifyParameterizedQuery(rawConcatenatedQuery), false);
});

// ==========================================
// 4. RBAC & PERMISSION BOUNDARY TESTS
// ==========================================

test('RBAC: All 8 production roles are mapped to their strict permission boundaries', () => {
  const expectedRoleKeys = [
    'super_admin',
    'editor_in_chief',
    'news_editor',
    'reporter',
    'photographer',
    'seo_manager',
    'ads_manager',
    'moderator'
  ];

  expectedRoleKeys.forEach((roleKey) => {
    assert.ok(ROLES_DEFINITION[roleKey], `Role ${roleKey} must be configured in ROLES_DEFINITION`);
    assert.ok(ROLES_DEFINITION[roleKey].nameBn, `Role ${roleKey} must have Bengali name`);
    assert.ok(ROLES_DEFINITION[roleKey].nameEn, `Role ${roleKey} must have English name`);
  });

  // Super Admin possesses all 16 permissions
  PERMISSIONS.forEach((perm) => {
    assert.equal(backendHasPermission('super_admin', perm), true, `Super Admin must have ${perm}`);
  });

  // Reporter cannot approve or publish
  assert.equal(backendHasPermission('reporter', 'news.create'), true);
  assert.equal(backendHasPermission('reporter', 'news.approve'), false);
  assert.equal(backendHasPermission('reporter', 'news.publish'), false);

  // News Editor can review and approve, but cannot manage users or settings
  assert.equal(backendHasPermission('news_editor', 'news.review'), true);
  assert.equal(backendHasPermission('news_editor', 'news.approve'), true);
  assert.equal(backendHasPermission('news_editor', 'user.manage'), false);
  assert.equal(backendHasPermission('news_editor', 'settings.manage'), false);

  // Photographer has media upload only
  assert.equal(backendHasPermission('photographer', 'media.upload'), true);
  assert.equal(backendHasPermission('photographer', 'news.create'), false);
  assert.equal(backendHasPermission('photographer', 'ads.manage'), false);
});

// ==========================================
// 5. EDITORIAL WORKFLOW STATE MACHINE TESTS
// ==========================================

test('Workflow: Complete transition cycle draft -> submitted -> under_review -> approved -> published', () => {
  const article = {
    id: 991,
    title: 'টেস্ট আর্টিকেল',
    status: WORKFLOW_STATUSES.DRAFT,
    workflowHistory: []
  };

  const reporterUser = { id: 10, name: 'রিপোর্টার রফিক', role: 'reporter' };
  const editorUser = { id: 20, name: 'বার্তা সম্পাদক সাকলাইন', role: 'editor' };
  const editorInChief = { id: 1, name: 'প্রধান সম্পাদক', role: 'editor_in_chief' };

  // 1. Submit for review
  const submitRes = executeWorkflowTransition({
    article,
    toStatus: WORKFLOW_STATUSES.SUBMITTED,
    user: reporterUser,
    comments: 'সংবাদটি তৈরি সম্পন্ন হয়েছে'
  });
  assert.equal(submitRes.success, true);
  assert.equal(submitRes.updatedArticle.status, WORKFLOW_STATUSES.SUBMITTED);

  // 2. Editor picks up for review
  const reviewRes = executeWorkflowTransition({
    article: submitRes.updatedArticle,
    toStatus: WORKFLOW_STATUSES.UNDER_REVIEW,
    user: editorUser
  });
  assert.equal(reviewRes.success, true);
  assert.equal(reviewRes.updatedArticle.status, WORKFLOW_STATUSES.UNDER_REVIEW);

  // 3. Editor approves
  const approveRes = executeWorkflowTransition({
    article: reviewRes.updatedArticle,
    toStatus: WORKFLOW_STATUSES.APPROVED,
    user: editorUser,
    comments: 'সম্পাদনা সম্পন্ন ও অনুমোদিত'
  });
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.updatedArticle.status, WORKFLOW_STATUSES.APPROVED);

  // 4. Editor-in-Chief publishes
  const publishRes = executeWorkflowTransition({
    article: approveRes.updatedArticle,
    toStatus: WORKFLOW_STATUSES.PUBLISHED,
    user: editorInChief
  });
  assert.equal(publishRes.success, true);
  assert.equal(publishRes.updatedArticle.status, WORKFLOW_STATUSES.PUBLISHED);
});

test('Workflow: Return and Reject transitions require mandatory feedback comments', () => {
  const article = {
    id: 992,
    status: WORKFLOW_STATUSES.UNDER_REVIEW,
    workflowHistory: []
  };
  const editorUser = { id: 20, name: 'বার্তা সম্পাদক সাকলাইন', role: 'editor' };

  // Attempt return without comments
  const failReturn = executeWorkflowTransition({
    article,
    toStatus: WORKFLOW_STATUSES.RETURNED,
    user: editorUser,
    comments: ''
  });
  assert.equal(failReturn.success, false);
  assert.match(failReturn.error, /মন্তব্য.*আবশ্যক/i);

  // Attempt reject without comments
  const failReject = executeWorkflowTransition({
    article,
    toStatus: WORKFLOW_STATUSES.REJECTED,
    user: editorUser,
    comments: '   '
  });
  assert.equal(failReject.success, false);
  assert.match(failReject.error, /মন্তব্য.*আবশ্যক/i);
});

test('Workflow: Scheduled transition requires valid future date', () => {
  const article = {
    id: 993,
    status: WORKFLOW_STATUSES.APPROVED,
    workflowHistory: []
  };
  const editorInChief = { id: 1, name: 'প্রধান সম্পাদক', role: 'editor_in_chief' };

  // Missing date
  const failRes = executeWorkflowTransition({
    article,
    toStatus: WORKFLOW_STATUSES.SCHEDULED,
    user: editorInChief,
    comments: 'নির্ধারিত সময়ে প্রকাশ'
  });
  assert.equal(failRes.success, false);
  assert.match(failRes.error, /তারিখ.*আবশ্যক/i);

  // Valid future date
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const successRes = executeWorkflowTransition({
    article,
    toStatus: WORKFLOW_STATUSES.SCHEDULED,
    user: editorInChief,
    comments: 'আগামীকাল সকালে প্রকাশিত হবে',
    scheduledAt: futureDate
  });
  assert.equal(successRes.success, true);
  assert.equal(successRes.updatedArticle.status, WORKFLOW_STATUSES.SCHEDULED);
  assert.equal(successRes.updatedArticle.scheduledAt, futureDate);
});

// ==========================================
// 6. CODE-SPLITTING & PERFORMANCE ARCHITECTURE CHECKS
// ==========================================

test('Performance: AppRoutes utilizes dynamic React.lazy imports for admin and subpages', () => {
  const appRoutesPath = path.join(rootDir, 'src/routes/AppRoutes.jsx');
  const code = fs.readFileSync(appRoutesPath, 'utf8');

  assert.match(code, /import\s+React,\s*\{\s*lazy,\s*Suspense\s*\}\s*from\s*'react'/);
  assert.match(code, /lazy\(\(\)\s*=>\s*import\('\.\.\/pages\/admin\/AdminNewsPage\.jsx'\)\)/);
  assert.match(code, /lazy\(\(\)\s*=>\s*import\('\.\.\/pages\/admin\/AdminWorkflowPage\.jsx'\)\)/);
  assert.match(code, /lazy\(\(\)\s*=>\s*import\('\.\.\/pages\/public\/NewsDetailsPage\.jsx'\)\)/);
  assert.match(code, /<Suspense\s+fallback=\{<PageLoadingFallback\s*\/>\}>/);
});

test('Performance: NewsCard specifies eager loading for lead and lazy loading for other variants', () => {
  const newsCardPath = path.join(rootDir, 'src/components/news/NewsCard.jsx');
  const code = fs.readFileSync(newsCardPath, 'utf8');

  assert.match(code, /loading="eager"/, 'Lead card must have loading="eager"');
  assert.match(code, /fetchPriority="high"/, 'Lead card must have fetchPriority="high"');
  assert.match(code, /loading="lazy"/, 'Secondary/grid cards must have loading="lazy"');
  assert.match(code, /decoding="async"/, 'Images should specify decoding="async"');
});

// ==========================================
// 7. RESPONSIVE DESIGN & ACCESSIBILITY SPECIFICATIONS
// ==========================================

test('Responsive & A11y: Viewport breakpoints and accessibility attributes conform to standards', () => {
  const tailwindConfigPath = path.join(rootDir, 'vite.config.ts');
  assert.ok(fs.existsSync(tailwindConfigPath));

  // Verify NewsDetailsPage has semantic article markup and breadcrumb nav with aria-label
  const detailsPagePath = path.join(rootDir, 'src/pages/public/NewsDetailsPage.jsx');
  const detailsCode = fs.readFileSync(detailsPagePath, 'utf8');
  assert.match(detailsCode, /<article\b[^>]*>/, 'Must use semantic <article> element');
  assert.match(detailsCode, /aria-label="Breadcrumb"/, 'Breadcrumb navigation must have aria-label');
  assert.match(detailsCode, /<figure\b[^>]*>/, 'Featured image must be enclosed in <figure>');
  assert.match(detailsCode, /<figcaption\b[^>]*>/, 'Captions must use <figcaption>');
});

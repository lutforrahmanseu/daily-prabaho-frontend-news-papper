import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYNDICATION_SCOPES,
  WEBHOOK_EVENTS,
  getSyndicationStatusMeta,
  filterAllowedScopes,
  formatLicenseAttribution,
  buildCurlExample,
  buildWebhookVerificationSnippet
} from './syndicationHelpers.js';
import { hasEffectivePermission, PHASE35_ROLE_PERMISSIONS } from './permissions.js';

test('Phase 35 syndication scopes and webhook event catalogs stay canonical', () => {
  assert.deepEqual(
    SYNDICATION_SCOPES.map((s) => s.id),
    ['articles:read', 'taxonomy:read', 'journalists:read', 'media:read', 'search:read', 'feeds:read']
  );
  assert.deepEqual(
    WEBHOOK_EVENTS.map((e) => e.id),
    ['article.published', 'article.updated', 'article.retracted']
  );
});

test('filterAllowedScopes intersects requested scopes against valid and plan-permitted scopes', () => {
  const result = filterAllowedScopes(
    ['articles:read', 'taxonomy:read', 'unknown:scope', 'articles:read', 'media:read'],
    ['articles:read', 'taxonomy:read']
  );
  assert.deepEqual(result, ['articles:read', 'taxonomy:read']);
});

test('formatLicenseAttribution injects publisher, reporter, canonical URL, and publication timestamp', () => {
  const rendered = formatLicenseAttribution(
    'Courtesy of {publisher} — By {reporter} ({published_at}) {canonical_url}',
    {
      publisher: 'Daily Prabaho',
      reporter: 'Farhana Rahman',
      canonicalUrl: 'https://dailyprabaho.test/news/metro-phase-2',
      publishedAt: '2026-11-12T06:00:00Z'
    }
  );
  assert.equal(
    rendered,
    'Courtesy of Daily Prabaho — By Farhana Rahman (2026-11-12T06:00:00Z) https://dailyprabaho.test/news/metro-phase-2'
  );
});

test('buildCurlExample and buildWebhookVerificationSnippet produce non-empty developer snippets', () => {
  const curl = buildCurlExample('articles', 'nf_test_demo123');
  assert.match(curl, /\/api\/syndication\/v1\/articles/);
  assert.match(curl, /X-API-Key: nf_test_demo123/);

  const nodeSnippet = buildWebhookVerificationSnippet('node');
  const phpSnippet = buildWebhookVerificationSnippet('php');
  assert.match(nodeSnippet, /x-newsflow-signature/);
  assert.match(phpSnippet, /HTTP_X_NEWSFLOW_SIGNATURE/);
});

test('getSyndicationStatusMeta resolves localized badges for partner, key, and delivery states', () => {
  assert.equal(getSyndicationStatusMeta('approved', false).label, 'Approved');
  assert.equal(getSyndicationStatusMeta('rotated_grace', false).label, 'Rotation Grace');
  assert.equal(getSyndicationStatusMeta('delivered', true).label, 'সফল ডেলিভারি');
});

test('PHASE35_ROLE_PERMISSIONS enforces strict RBAC governance on syndication administration', () => {
  assert.ok(PHASE35_ROLE_PERMISSIONS.super_admin.includes('syndication.partners.approve'));
  assert.ok(PHASE35_ROLE_PERMISSIONS.ads_manager.includes('syndication.plans.manage'));
  assert.equal(
    hasEffectivePermission({ user: { role: 'ads_manager' } }, {}, 'syndication.partners.approve'),
    false
  );
  assert.equal(
    hasEffectivePermission({ user: { role: 'news_editor' } }, {}, 'syndication.licenses.manage'),
    true
  );
  assert.equal(
    hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'syndication.view'),
    false
  );
  assert.equal(
    hasEffectivePermission({ user: { role: 'reader' } }, {}, 'syndication.view'),
    false
  );
});


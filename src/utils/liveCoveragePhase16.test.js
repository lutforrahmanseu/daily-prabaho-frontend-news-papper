import test from 'node:test';
import assert from 'node:assert/strict';
import { hasEffectivePermission } from './permissions.js';
import {
  LIVE_BLOG_STATUS_META,
  LIVE_EVENT_TYPE_META,
  LIVE_UPDATE_TYPE_META,
  REVISION_ACTION_LABELS,
  SPECIAL_COVERAGE_TYPE_META,
  buildLiveBlogSchema,
  getNextStreamCursor,
  parseVideoEmbedUrl
} from './liveCoverageHelpers.js';

test('Phase 16 RBAC enforces live blog and special coverage editorial boundaries', () => {
  const reporterAuth = { user: { id: 10, role: 'reporter' } };
  const editorAuth = { user: { id: 2, role: 'news_editor' } };
  const adsAuth = { user: { id: 9, role: 'ads_manager' } };

  // Reporter can view & contribute, and manage coverage items, but cannot directly publish
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'live.view'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'live.contribute'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'live.publish'), false);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'coverage.manage'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'coverage.publish'), false);

  // News Editor has full live & coverage publishing rights
  assert.equal(hasEffectivePermission(editorAuth, {}, 'live.publish'), true);
  assert.equal(hasEffectivePermission(editorAuth, {}, 'coverage.publish'), true);

  // Non-editorial Ads Manager has zero live/coverage access
  assert.equal(hasEffectivePermission(adsAuth, {}, ['live.view', 'live.contribute', 'live.publish']), false);
  assert.equal(hasEffectivePermission(adsAuth, {}, ['coverage.view', 'coverage.manage', 'coverage.publish']), false);
});

test('Special Coverage archetypes and Live Blog metadata cover all Phase 16 requirements', () => {
  const expectedArchetypes = ['election', 'sports', 'national_event', 'disaster', 'budget', 'breaking_event'];
  expectedArchetypes.forEach((key) => {
    assert.ok(SPECIAL_COVERAGE_TYPE_META[key], `Missing coverage archetype: ${key}`);
    assert.ok(SPECIAL_COVERAGE_TYPE_META[key].label);
  });

  ['draft', 'submitted', 'approved', 'live', 'paused', 'ended', 'archived'].forEach((status) => {
    assert.ok(LIVE_BLOG_STATUS_META[status], `Missing live blog status: ${status}`);
  });

  ['breaking', 'election', 'sports', 'budget', 'disaster', 'national', 'court', 'general'].forEach((ev) => {
    assert.ok(LIVE_EVENT_TYPE_META[ev], `Missing live event type: ${ev}`);
  });

  ['update', 'breaking', 'quote', 'score', 'media', 'summary'].forEach((type) => {
    assert.ok(LIVE_UPDATE_TYPE_META[type], `Missing live update type: ${type}`);
  });

  ['created', 'approved', 'edited', 'corrected', 'pinned', 'unpinned', 'retracted', 'deleted'].forEach((act) => {
    assert.ok(REVISION_ACTION_LABELS[act], `Missing revision action label: ${act}`);
  });
});

test('parseVideoEmbedUrl normalizes YouTube, Vimeo, and native video sources safely', () => {
  assert.deepEqual(parseVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
    kind: 'iframe',
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  });

  assert.deepEqual(parseVideoEmbedUrl('https://youtu.be/abc123XYZ'), {
    kind: 'iframe',
    src: 'https://www.youtube.com/embed/abc123XYZ'
  });

  assert.deepEqual(parseVideoEmbedUrl('https://vimeo.com/76979871'), {
    kind: 'iframe',
    src: 'https://player.vimeo.com/video/76979871'
  });

  assert.deepEqual(parseVideoEmbedUrl('/storage/videos/highlight.mp4'), {
    kind: 'video',
    src: '/storage/videos/highlight.mp4'
  });
});

test('getNextStreamCursor preserves monotonic SSE version ordering', () => {
  assert.equal(getNextStreamCursor(0, 4), 4);
  assert.equal(getNextStreamCursor(5, 3), 5);
  assert.equal(getNextStreamCursor(5, 8), 8);
});

test('buildLiveBlogSchema produces valid Schema.org LiveBlogPosting JSON-LD', () => {
  const schema = buildLiveBlogSchema({
    slug: 'budget-2026-live',
    title: 'বাজেট অধিবেশন সরাসরি',
    summary: 'সংসদ থেকে তাৎক্ষণিক খবর',
    started_at: '2026-11-11T09:00:00Z',
    updates: [
      { id: 1, status: 'published', title: 'অধিবেশন শুরু', content: 'অর্থমন্ত্রী বাজেট পেশ করছেন।', published_at: '2026-11-11T09:05:00Z' },
      { id: 2, status: 'pending_approval', title: 'অপ্রকাশিত', content: 'লুকানো খসড়া' }
    ]
  });

  assert.equal(schema['@type'], 'LiveBlogPosting');
  assert.equal(schema.liveBlogUpdate.length, 1);
  assert.equal(schema.liveBlogUpdate[0].headline, 'অধিবেশন শুরু');
});


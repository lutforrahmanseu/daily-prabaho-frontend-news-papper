import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatDurationLabel,
  getMultimediaItemTypeMeta,
  getMultimediaStatusMeta,
  getVisibilityMeta,
  parseSafeSocialEmbedUrl,
  STORY_BLOCK_TYPE_META
} from './multimediaHelpers.js';
import { hasEffectivePermission } from './permissions.js';

test('Phase 17 Multimedia RBAC enforces editorial publish and private media storage permissions', () => {
  const reporterAuth = { user: { id: 10, role: 'reporter', roles: ['reporter'] } };
  const photoAuth = { user: { id: 11, role: 'photographer', roles: ['photographer'] } };
  const editorAuth = { user: { id: 12, role: 'news_editor', roles: ['news_editor'] } };
  const adsAuth = { user: { id: 13, role: 'ads_manager', roles: ['ads_manager'] } };

  // Reporter can view/create multimedia drafts, but cannot publish or manage private storage
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'multimedia.view'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'multimedia.create'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'multimedia.publish'), false);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'media.manage_private'), false);

  // Photographer can manage private/restricted assets and create photo stories
  assert.equal(hasEffectivePermission(photoAuth, {}, 'media.manage_private'), true);
  assert.equal(hasEffectivePermission(photoAuth, {}, 'multimedia.create'), true);
  assert.equal(hasEffectivePermission(photoAuth, {}, 'multimedia.publish'), false);

  // News Editor has full publish + private media authority
  assert.equal(hasEffectivePermission(editorAuth, {}, 'multimedia.publish'), true);
  assert.equal(hasEffectivePermission(editorAuth, {}, 'media.manage_private'), true);

  // Commercial Ads Manager has zero multimedia CMS access
  assert.equal(hasEffectivePermission(adsAuth, {}, 'multimedia.view'), false);
  assert.equal(hasEffectivePermission(adsAuth, {}, 'media.manage_private'), false);
});

test('Phase 17 Safe Social Embed parser blocks XSS/script vectors and validates YouTube/X/MP4 URLs', () => {
  assert.equal(parseSafeSocialEmbedUrl('javascript:alert(1)').safe, false);
  assert.equal(parseSafeSocialEmbedUrl('data:text/html,<script>alert(1)</script>').safe, false);
  assert.equal(parseSafeSocialEmbedUrl('<script>evil()</script>').safe, false);

  const yt = parseSafeSocialEmbedUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  assert.equal(yt.safe, true);
  assert.equal(yt.kind, 'iframe');
  assert.equal(yt.platform, 'youtube');
  assert.ok(yt.embedUrl.includes('youtube.com/embed/aqz-KE-bpKQ'));

  const xPost = parseSafeSocialEmbedUrl('https://x.com/BCBtigers');
  assert.equal(xPost.safe, true);
  assert.equal(xPost.kind, 'card');
  assert.equal(xPost.platform, 'x');

  const localAudio = parseSafeSocialEmbedUrl('/api/v1/media/42/stream');
  assert.equal(localAudio.safe, true);
});

test('Phase 17 Multimedia duration formatters, statuses, and storytelling block types stay consistent', () => {
  assert.equal(formatDurationLabel(245, '', false), '04:05');
  assert.equal(formatDurationLabel(3665, '', false), '01:01:05');
  assert.equal(formatDurationLabel(120, '০২:০০', true), '০২:০০');

  assert.equal(getMultimediaStatusMeta('published').id, 'published');
  assert.equal(getMultimediaItemTypeMeta('infographic').id, 'infographic');
  assert.equal(getVisibilityMeta('restricted').id, 'restricted');

  ['heading', 'text', 'quote', 'image', 'video', 'audio', 'timeline', 'embed'].forEach((type) => {
    assert.ok(STORY_BLOCK_TYPE_META[type], `Expected storytelling block metadata for ${type}`);
  });
});


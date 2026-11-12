import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_FEATURES,
  AI_FEATURE_MAP,
  CONFIDENCE_LEVEL_META,
  REVIEW_STATUS_META,
  LOG_STATUS_META,
  PRIVACY_MODE_META,
  getConfidenceMeta,
  normalizeAiGeneration,
  canApplyAiSuggestion
} from './aiHelpers.js';
import { hasEffectivePermission } from './permissions.js';

const EXPECTED_12_FEATURES = [
  'headline_suggestions',
  'subheadline_suggestions',
  'summarization',
  'translate_bn_to_en',
  'translate_en_to_bn',
  'seo_metadata',
  'tag_suggestions',
  'image_alt_text',
  'duplicate_detection',
  'transcript_generation',
  'content_quality',
  'source_verification'
];

test('Phase 20 AI_FEATURES includes all 12 editorial AI capabilities', () => {
  assert.equal(AI_FEATURES.length, 12);
  const keys = AI_FEATURES.map((item) => item.key);
  assert.deepEqual(keys, EXPECTED_12_FEATURES);

  for (const key of EXPECTED_12_FEATURES) {
    assert.ok(AI_FEATURE_MAP[key], `Missing AI_FEATURE_MAP entry for ${key}`);
    assert.ok(AI_FEATURE_MAP[key].nameBn.length > 0);
    assert.ok(AI_FEATURE_MAP[key].nameEn.length > 0);
  }
});

test('Phase 20 RBAC matrix restricts AI use, apply, logs, and settings properly', () => {
  const mkAuth = (role) => ({ user: { id: 10, role } });

  assert.equal(hasEffectivePermission(mkAuth('super_admin'), {}, 'ai.settings.manage'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'ai.use'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'ai.apply'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'ai.logs.view'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'ai.settings.manage'), true);

  assert.equal(hasEffectivePermission(mkAuth('news_editor'), {}, 'ai.use'), true);
  assert.equal(hasEffectivePermission(mkAuth('news_editor'), {}, 'ai.apply'), true);
  assert.equal(hasEffectivePermission(mkAuth('news_editor'), {}, 'ai.logs.view'), true);
  assert.equal(hasEffectivePermission(mkAuth('news_editor'), {}, 'ai.settings.manage'), false);

  for (const role of ['reporter', 'photographer', 'seo_manager']) {
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.use'), true);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.apply'), true);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.logs.view'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.settings.manage'), false);
  }

  assert.equal(hasEffectivePermission(mkAuth('moderator'), {}, 'ai.use'), true);
  assert.equal(hasEffectivePermission(mkAuth('moderator'), {}, 'ai.apply'), false);
  assert.equal(hasEffectivePermission(mkAuth('moderator'), {}, 'ai.logs.view'), false);

  for (const role of ['ads_manager', 'reader']) {
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.use'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.apply'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.logs.view'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'ai.settings.manage'), false);
  }

  // Explicit backend permission array always takes precedence for non-super-admins
  assert.equal(
    hasEffectivePermission({ user: { id: 2, role: 'reporter' }, permissions: ['ai.use'] }, {}, 'ai.apply'),
    false
  );
});

test('canApplyAiSuggestion enforces non-rejected status and appliesToFields', () => {
  assert.equal(canApplyAiSuggestion({}, 'headline_suggestions'), false);
  assert.equal(
    canApplyAiSuggestion({ id: 1, feature_key: 'headline_suggestions', review_status: 'rejected' }),
    false
  );

  for (const nonApplyingFeature of ['duplicate_detection', 'content_quality', 'source_verification']) {
    assert.equal(
      canApplyAiSuggestion({ id: 5, feature_key: nonApplyingFeature, review_status: 'pending_review' }),
      false
    );
  }

  for (const applyingFeature of [
    'headline_suggestions',
    'subheadline_suggestions',
    'summarization',
    'translate_bn_to_en',
    'translate_en_to_bn',
    'seo_metadata',
    'tag_suggestions',
    'image_alt_text',
    'transcript_generation'
  ]) {
    assert.equal(
      canApplyAiSuggestion({ id: 9, feature_key: applyingFeature, review_status: 'pending_review' }),
      true
    );
  }
});

test('getConfidenceMeta and normalizeAiGeneration preserve editorial transparency metadata', () => {
  const high = getConfidenceMeta('high', 0.92);
  assert.equal(high.percent, 92);
  assert.equal(high.labelEn, CONFIDENCE_LEVEL_META.high.labelEn);

  const low = getConfidenceMeta('low', 0.34);
  assert.equal(low.percent, 34);
  assert.equal(low.labelEn, CONFIDENCE_LEVEL_META.low.labelEn);

  const fallback = getConfidenceMeta('unknown', Number.NaN);
  assert.equal(fallback.percent, 70);
  assert.equal(fallback.labelEn, CONFIDENCE_LEVEL_META.medium.labelEn);

  const normalized = normalizeAiGeneration({
    id: 42,
    feature_key: 'source_verification',
    confidence_score: '0.68',
    confidence_level: 'medium',
    uncertainty_notes: ['সোর্স ভেরিফিকেশন পেন্ডিং'],
    safety_warnings: ['প্রকাশের আগে পুনরায় যাচাই করুন'],
    contained_confidential: true,
    external_transmission_blocked: true
  });

  assert.equal(normalized.id, 42);
  assert.equal(normalized.confidence_score, 0.68);
  assert.equal(normalized.review_status, 'pending_review');
  assert.equal(normalized.grounded_facts_only, true);
  assert.equal(normalized.contained_confidential, true);
  assert.equal(normalized.external_transmission_blocked, true);
  assert.deepEqual(normalized.uncertainty_notes, ['সোর্স ভেরিফিকেশন পেন্ডিং']);
  assert.deepEqual(normalized.safety_warnings, ['প্রকাশের আগে পুনরায় যাচাই করুন']);

  assert.ok(REVIEW_STATUS_META.pending_review);
  assert.ok(REVIEW_STATUS_META.applied);
  assert.ok(LOG_STATUS_META.blocked_confidential);
  assert.ok(PRIVACY_MODE_META.local_only);
});


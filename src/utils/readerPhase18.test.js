import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isReaderOnlySession,
  calculatePollOptionPercentage,
  normalizePollData,
  getPersonalizationReasonLabels,
  buildDataExportFilename,
  REACTION_META,
  NEWSLETTER_FREQUENCIES
} from './readerHelpers.js';
import { hasEffectivePermission } from './permissions.js';

test('Phase 18: reader role is strictly isolated from Admin CMS permissions', () => {
  assert.equal(isReaderOnlySession(['reader']), true);
  assert.equal(isReaderOnlySession([{ slug: 'reader' }]), true);
  assert.equal(isReaderOnlySession(['reader', 'reporter']), false);
  assert.equal(isReaderOnlySession([]), false);

  const readerAuthState = {
    user: { id: 99, email: 'reader@dailyprabaho.test', role: 'reader' },
    roles: ['reader'],
    permissions: ['reader.engage']
  };

  assert.equal(hasEffectivePermission(readerAuthState, {}, 'news.read'), false);
  assert.equal(hasEffectivePermission(readerAuthState, {}, 'comments.moderate'), false);
  assert.equal(hasEffectivePermission(readerAuthState, {}, 'polls.manage'), false);

  const moderatorAuthState = {
    user: { id: 5, email: 'mod@dailyprabaho.test', role: 'moderator' },
    roles: ['moderator'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(moderatorAuthState, {}, 'comments.moderate'), true);
  assert.equal(hasEffectivePermission(moderatorAuthState, {}, 'polls.manage'), false);

  const editorAuthState = {
    user: { id: 2, email: 'editor@dailyprabaho.test', role: 'news_editor' },
    roles: ['news_editor'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(editorAuthState, {}, 'polls.manage'), true);
});

test('Phase 18: poll normalization and percentage computation are exact', () => {
  assert.equal(calculatePollOptionPercentage(0, 0), 0);
  assert.equal(calculatePollOptionPercentage(3, 4), 75);
  assert.equal(calculatePollOptionPercentage(1, 3), 33.3);

  const normalized = normalizePollData({
    id: 10,
    slug: 'metro-poll',
    question_bn: 'প্রশ্ন',
    status: 'published',
    is_open: true,
    user_voted: true,
    user_voted_option_ids: [101],
    options: [
      { id: 101, label_bn: 'হ্যাঁ', votes_count: 30, sort_order: 1 },
      { id: 102, label_bn: 'না', votes_count: 10, sort_order: 2 }
    ]
  });

  assert.equal(normalized.totalVotes, 40);
  assert.equal(normalized.options[0].percentage, 75);
  assert.equal(normalized.options[1].percentage, 25);
  assert.deepEqual(normalized.userVotedOptionIds, [101]);
});

test('Phase 18: personalization reason labels, reaction catalog, and data export naming', () => {
  assert.deepEqual(getPersonalizationReasonLabels(['author', 'category', 'topic'], true), [
    'অনুসরণকৃত লেখক',
    'অনুসরণকৃত বিভাগ',
    'পছন্দের বিষয়'
  ]);
  assert.deepEqual(getPersonalizationReasonLabels(['category'], false), ['Followed Section']);

  assert.equal(REACTION_META.length, 5);
  assert.equal(NEWSLETTER_FREQUENCIES.some((f) => f.value === 'daily'), true);

  const fixedDate = new Date('2026-11-11T10:00:00.000Z');
  assert.equal(buildDataExportFilename(fixedDate), 'daily-prabaho-reader-data-2026-11-11.json');
});


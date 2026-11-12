import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCleanSlug } from './apiNormalizer.js';

test('toCleanSlug normalizes ASCII text and trims hyphens', () => {
  assert.equal(toCleanSlug('  Politics & Economy! '), 'politics-economy');
  assert.equal(toCleanSlug('---hello--world---'), 'hello-world');
});

test('toCleanSlug returns fallback when input yields empty ASCII slug', () => {
  assert.equal(toCleanSlug('বাংলাদেশ'), '');
  assert.equal(toCleanSlug('', 'news-fallback'), 'news-fallback');
  assert.equal(toCleanSlug('বাংলা সংবাদ', 'news-fallback'), 'news-fallback');
});


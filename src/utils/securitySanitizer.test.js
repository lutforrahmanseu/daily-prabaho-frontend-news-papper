import { test } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeHtml,
  stripHtmlTags,
  isHtmlContent,
  extractHtmlBlocks
} from './securitySanitizer.js';

test('isHtmlContent distinguishes CMS HTML paragraphs from plain text', () => {
  assert.strictEqual(
    isHtmlContent('<p>দেশের দক্ষিণাঞ্চলের ম্যানগ্রোভ বন রক্ষায় সচেতনতা জরুরি।</p>'),
    true
  );
  assert.strictEqual(
    isHtmlContent('সাধারণ অনুচ্ছেদ।\n\n> উদ্ধৃতি'),
    false
  );
});

test('extractHtmlBlocks splits consecutive HTML blocks while sanitizing unsafe attributes', () => {
  const dirtyHtml = '<p onclick="alert(1)">প্রথম প্যারা</p><script>evil()</script><p>দ্বিতীয় প্যারা</p>';
  const blocks = extractHtmlBlocks(dirtyHtml);

  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0], '<p>প্রথম প্যারা</p>');
  assert.strictEqual(blocks[1], '<p>দ্বিতীয় প্যারা</p>');
});

test('sanitizeHtml strips dangerous protocols and style/form tags while keeping formatting', () => {
  const html = '<h3>শিরোনাম</h3><p><a href="javascript:alert(1)">লিংক</a> ও <a href="data:text/html,<script>1</script>">ডাটা</a></p><style>body{}</style>';
  const clean = sanitizeHtml(html);

  assert.ok(clean.includes('<h3>শিরোনাম</h3>'));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(!clean.includes('data:text/html'));
  assert.ok(!clean.includes('<style'));
});

test('stripHtmlTags produces clean readable plain text without tags', () => {
  const html = '<p>প্রথম লাইন</p><p>দ্বিতীয় &amp; তৃতীয় লাইন</p>';
  assert.strictEqual(stripHtmlTags(html), 'প্রথম লাইন দ্বিতীয় & তৃতীয় লাইন');
});

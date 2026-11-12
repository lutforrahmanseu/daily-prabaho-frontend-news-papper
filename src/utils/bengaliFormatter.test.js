import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBengaliNumber,
  formatBengaliRelativeTime,
  calculateReadingTime,
  formatBengaliFullDateTime
} from './bengaliFormatter.js';

test('toBengaliNumber converts English digits to Bengali digits', () => {
  assert.equal(toBengaliNumber(0), '০');
  assert.equal(toBengaliNumber(123456789), '১২৩৪৫৬৭৮৯');
  assert.equal(toBengaliNumber('2026'), '২০২৬');
});

test('formatBengaliRelativeTime handles recent times', () => {
  const baseDate = new Date('2026-11-10T12:00:00Z');
  
  // Just now
  const justNow = new Date('2026-11-10T11:59:45Z');
  assert.equal(formatBengaliRelativeTime(justNow, baseDate), 'এইমাত্র');

  // 15 mins ago
  const minsAgo = new Date('2026-11-10T11:45:00Z');
  assert.equal(formatBengaliRelativeTime(minsAgo, baseDate), '১৫ মিনিট আগে');

  // 3 hours ago
  const hoursAgo = new Date('2026-11-10T09:00:00Z');
  assert.equal(formatBengaliRelativeTime(hoursAgo, baseDate), '৩ ঘণ্টা আগে');
});

test('calculateReadingTime returns Bengali reading estimation', () => {
  const shortText = 'ঢাকা বাংলাদেশের রাজধানী এবং প্রধান অর্থনৈতিক কেন্দ্র।';
  assert.equal(calculateReadingTime(shortText), '১ মিনিট পড়ার সময়');
});

test('formatBengaliFullDateTime formats full newspaper date and time', () => {
  const formatted = formatBengaliFullDateTime('2026-11-10T09:15:00Z');
  assert.ok(formatted.includes('নভেম্বর'));
  assert.ok(formatted.includes('২০২৬'));
});

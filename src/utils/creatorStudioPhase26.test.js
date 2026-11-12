import test from 'node:test';
import assert from 'node:assert/strict';
import {
  msToTimecode,
  timecodeToMs,
  serializeCuesToSrt,
  serializeCuesToVtt,
  parseSrtOrVtt,
  validateCueList,
  estimateSpokenSeconds,
  resolveCanvasGeometry,
  canExecuteExternalPublish,
} from './creatorStudioHelpers.js';

test('SRT and WebVTT cue roundtrip preserves Bangla & English timestamps and strips tags', () => {
  const cues = [
    { start_ms: 0, end_ms: 3500, text: 'আজকের প্রধান সংবাদ শিরোনাম', speaker: 'Anchor' },
    { start_ms: 3800, end_ms: 7250, text: 'Smart transit launch begins today', speaker: 'Anchor' },
  ];

  const srt = serializeCuesToSrt(cues);
  assert.match(srt, /00:00:00,000 --> 00:00:03,500/);
  assert.match(srt, /00:00:03,800 --> 00:00:07,250/);

  const vtt = serializeCuesToVtt(cues);
  assert.ok(vtt.startsWith('WEBVTT'));

  const parsed = parseSrtOrVtt(`${srt}\n3\n00:00:08,000 --> 00:00:10,500\n<b>Safe Cue</b>`);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[2].start_ms, 8000);
  assert.equal(parsed[2].end_ms, 10500);
  assert.equal(parsed[2].text, 'Safe Cue');
});

test('Timecode conversion and cue validation catch reversed timestamps', () => {
  assert.equal(timecodeToMs(msToTimecode(65432, '.')), 65432);

  const badResult = validateCueList([
    { start_ms: 4000, end_ms: 3000, text: 'Invalid range' },
  ]);
  assert.equal(badResult.valid, false);
  assert.ok(badResult.error);

  const okResult = validateCueList([
    { start_ms: 1000, end_ms: 4000, text: 'Valid cue' },
  ]);
  assert.equal(okResult.valid, true);
});

test('Spoken duration estimator and canvas geometry scale accurately across ratios', () => {
  const bnText = Array.from({ length: 55 }, () => 'শব্দ').join(' ');
  const enText = Array.from({ length: 69 }, () => 'word').join(' ');

  assert.equal(estimateSpokenSeconds(bnText, 'bn'), 30);
  assert.equal(estimateSpokenSeconds(enText, 'en'), 30);

  const vertical = resolveCanvasGeometry('9:16');
  assert.equal(vertical.width, 1080);
  assert.equal(vertical.height, 1920);
  assert.ok(vertical.safeBottom >= 300);

  const thumb = resolveCanvasGeometry('16:9');
  assert.equal(thumb.width, 1280);
  assert.equal(thumb.height, 720);
});

test('External publishing guardrail stays strictly fail-closed until authorized', () => {
  const approvedProject = { status: 'approved', external_publish_authorized: false };
  const authorizedProject = { status: 'approved', external_publish_authorized: true };

  assert.equal(
    canExecuteExternalPublish(approvedProject, { allow_external_publish: true }, true),
    false
  );
  assert.equal(
    canExecuteExternalPublish(authorizedProject, { allow_external_publish: false }, true),
    false
  );
  assert.equal(
    canExecuteExternalPublish(authorizedProject, { allow_external_publish: true }, false),
    false
  );
  assert.equal(
    canExecuteExternalPublish(authorizedProject, { allow_external_publish: true }, true),
    true
  );
});


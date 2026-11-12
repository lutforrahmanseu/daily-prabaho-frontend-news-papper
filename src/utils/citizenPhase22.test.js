import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBMISSION_TYPES,
  LOCATION_PRIVACY_MODES,
  CREDIT_MODES,
  SUBMISSION_STATUS_META,
  VERIFICATION_STATUS_META,
  VERIFICATION_CHECKLIST_ITEMS,
  ABUSE_REASONS,
  EVENT_TYPES,
  ANNOUNCEMENT_TYPES,
  TRUST_LEVEL_META,
  hasRequiredSubmissionConsents,
  sanitizeSubmissionLocationPreview,
  validateSafeSubmissionDraft
} from './citizenHelpers.js';
import { PHASE22_ROLE_PERMISSIONS, hasEffectivePermission } from './permissions.js';

describe('Phase 22 Citizen Journalism & Community RBAC and Safety Helpers', () => {
  it('enforces Phase 22 RBAC role permission hierarchy accurately', () => {
    assert.deepEqual(PHASE22_ROLE_PERMISSIONS.editor_in_chief, [
      'citizen.review',
      'citizen.publish',
      'community.moderate',
      'community.manage'
    ]);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'citizen.review'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'community.moderate'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'citizen.publish'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'citizen.review'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'community.moderate'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reader' } }, {}, 'citizen.review'), false);
  });

  it('requires all mandatory editorial, privacy, copyright, and media ownership consents', () => {
    const incomplete = hasRequiredSubmissionConsents({
      consent_editorial_review: true,
      consent_privacy_policy: true,
      copyright_declared: false,
      media_ownership_declared: true
    });
    assert.equal(incomplete.valid, false);
    assert.deepEqual(incomplete.missing, ['copyright_declared']);

    const complete = hasRequiredSubmissionConsents({
      consent_editorial_review: true,
      consent_privacy_policy: true,
      copyright_declared: true,
      media_ownership_declared: true
    });
    assert.equal(complete.valid, true);
    assert.deepEqual(complete.missing, []);
  });

  it('sanitizes public location previews according to privacy mode', () => {
    assert.equal(
      sanitizeSubmissionLocationPreview({
        location_privacy_mode: 'hidden',
        public_location_label: 'Mirpur 10',
        district: 'ঢাকা',
        division: 'ঢাকা'
      }),
      null
    );

    assert.equal(
      sanitizeSubmissionLocationPreview({
        location_privacy_mode: 'district_only',
        public_location_label: 'Secret House 14',
        district: 'বগুড়া',
        division: 'রাজশাহী'
      }),
      'বগুড়া, রাজশাহী'
    );

    assert.equal(
      sanitizeSubmissionLocationPreview({
        location_privacy_mode: 'masked_approximate',
        public_location_label: 'সারিয়াকান্দি, বগুড়া',
        district: 'বগুড়া',
        division: 'রাজশাহী'
      }),
      'সারিয়াকান্দি, বগুড়া'
    );
  });

  it('validates citizen draft constraints and provides complete metadata registries', () => {
    const invalidDraft = validateSafeSubmissionDraft({ title: 'Short', district: '' });
    assert.equal(invalidDraft.valid, false);
    assert.ok(invalidDraft.errors.title);
    assert.ok(invalidDraft.errors.district);
    assert.ok(invalidDraft.errors.consents);

    const validDraft = validateSafeSubmissionDraft({
      title: 'বগুড়ায় নদী ভাঙন রোধে নাগরিক উদ্যোগ',
      district: 'বগুড়া',
      consent_editorial_review: true,
      consent_privacy_policy: true,
      copyright_declared: true,
      media_ownership_declared: true
    });
    assert.equal(validDraft.valid, true);

    assert.equal(SUBMISSION_TYPES.length, 4);
    assert.equal(LOCATION_PRIVACY_MODES.length, 3);
    assert.equal(CREDIT_MODES.length, 3);
    assert.equal(VERIFICATION_CHECKLIST_ITEMS.length, 5);
    assert.ok(SUBMISSION_STATUS_META.submitted);
    assert.ok(SUBMISSION_STATUS_META.published);
    assert.ok(VERIFICATION_STATUS_META.verified);
    assert.ok(ABUSE_REASONS.some((r) => r.value === 'privacy_violation'));
    assert.ok(EVENT_TYPES.some((e) => e.value === 'workshop'));
    assert.ok(ANNOUNCEMENT_TYPES.some((a) => a.value === 'call_for_stories'));
    assert.ok(TRUST_LEVEL_META.suspended);
  });
});


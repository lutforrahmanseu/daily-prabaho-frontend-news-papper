import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CERTIFICATE_TYPES,
  COMPETITION_ENTRY_STATUSES,
  EVENT_ANNOUNCEMENT_TYPES,
  EVENT_LIFECYCLE_STATUSES,
  PARTICIPANT_STATUS_META,
  SPECIAL_PROJECT_TRACKS,
  SPECIAL_PROJECT_TRACK_MAP,
  isRegistrationOpen,
  maskPrivateParticipantText,
  validateEventRegistrationForm
} from './eventsHelpers.js';
import { PHASE23_ROLE_PERMISSIONS, hasEffectivePermission } from './permissions.js';

describe('Phase 23 Events, Competitions, Special Projects & Privacy Helpers', () => {
  it('enforces Phase 23 RBAC role permission hierarchy accurately', () => {
    assert.deepEqual(PHASE23_ROLE_PERMISSIONS.editor_in_chief, [
      'events.manage',
      'events.participants.manage',
      'events.competitions.judge',
      'events.results.publish'
    ]);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'events.participants.manage'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'events.competitions.judge'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'moderator' } }, {}, 'events.results.publish'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'events.manage'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'events.participants.manage'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reader' } }, {}, 'events.manage'), false);
  });

  it('defines all six special project initiatives and lifecycle taxonomies', () => {
    const keys = SPECIAL_PROJECT_TRACKS.map((t) => t.key);
    assert.deepEqual(keys, ['education', 'science', 'youth', 'cultural', 'agriculture', 'awareness']);
    assert.ok(SPECIAL_PROJECT_TRACK_MAP.science);
    assert.ok(EVENT_LIFECYCLE_STATUSES.published);
    assert.ok(PARTICIPANT_STATUS_META.waitlisted);
    assert.ok(COMPETITION_ENTRY_STATUSES.winner);
    assert.equal(CERTIFICATE_TYPES.length, 5);
    assert.equal(EVENT_ANNOUNCEMENT_TYPES.length, 5);
  });

  it('validates event registration eligibility, deadlines, capacity and waitlist rules', () => {
    const now = new Date('2026-11-12T10:00:00Z');

    assert.equal(isRegistrationOpen({ status: 'draft' }, now), false);
    assert.equal(
      isRegistrationOpen({ status: 'published', registration_deadline_at: '2026-11-11T10:00:00Z' }, now),
      false
    );
    assert.equal(
      isRegistrationOpen({ status: 'published', capacity: 50, registered_count: 50, allow_waitlist: false }, now),
      false
    );
    assert.equal(
      isRegistrationOpen({ status: 'published', capacity: 50, registered_count: 50, allow_waitlist: true }, now),
      true
    );
  });

  it('enforces required phone, organization, and privacy consents on registration form', () => {
    const futureEvent = {
      status: 'published',
      registration_deadline_at: '2099-01-01T00:00:00Z',
      capacity: 100,
      registered_count: 10,
      require_phone: true,
      require_organization: true
    };

    const missingFields = validateEventRegistrationForm(
      {
        participant_name: 'Tanzim Ahmed',
        participant_phone: '',
        organization: '',
        consent_event_updates: true,
        consent_privacy_policy: false
      },
      futureEvent
    );
    assert.equal(missingFields.valid, false);
    assert.ok(missingFields.errors.length >= 3);

    const completeForm = validateEventRegistrationForm(
      {
        participant_name: 'Tanzim Ahmed',
        participant_phone: '01711223344',
        organization: 'BUET Robotics Club',
        consent_event_updates: true,
        consent_privacy_policy: true
      },
      futureEvent
    );
    assert.equal(completeForm.valid, true);
    assert.deepEqual(completeForm.errors, []);
  });

  it('masks public winner names when public display consent is withheld', () => {
    assert.equal(maskPrivateParticipantText('Tanzim Ahmed', 'সিলেট', false), 'Tanzim (সিলেট)');
    assert.equal(maskPrivateParticipantText('Tanzim Ahmed', 'সিলেট', true), 'Tanzim Ahmed');
  });
});


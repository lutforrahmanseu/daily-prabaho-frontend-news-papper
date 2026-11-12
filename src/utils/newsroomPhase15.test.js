import test from 'node:test';
import assert from 'node:assert/strict';
import { hasEffectivePermission } from './permissions.js';
import { normalizeArticle } from './apiNormalizer.js';
import {
  ASSIGNMENT_PRIORITY_META,
  ASSIGNMENT_STATUS_META,
  AVAILABILITY_STATUS_META,
  RELIABILITY_META,
  VERIFICATION_STATUS_META,
  CORRECTION_STATUS_META,
  CORRECTION_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  formatBnCount,
  formatDateTimeBn,
  formatDateBn
} from './newsroomHelpers.js';

test('Phase 15 RBAC boundaries enforce confidential source, correction approval, and embargo permissions', () => {
  const reporterAuth = { user: { role: 'reporter', roles: ['reporter'] }, permissions: [] };
  const photographerAuth = { user: { role: 'photographer', roles: ['photographer'] }, permissions: [] };
  const moderatorAuth = { user: { role: 'moderator', roles: ['moderator'] }, permissions: [] };
  const newsEditorAuth = { user: { role: 'news_editor', roles: ['news_editor'] }, permissions: [] };
  const chiefEditorAuth = { user: { role: 'editor_in_chief', roles: ['editor_in_chief'] }, permissions: [] };
  const superAdminAuth = { user: { role: 'super_admin', roles: ['super_admin'] }, permissions: [] };
  const adsManagerAuth = { user: { role: 'ads_manager', roles: ['ads_manager'] }, permissions: [] };

  // Reporter can view assignments/sources, manage non-confidential sources, and request corrections
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'assignment.view'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'source.view'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'source.manage'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'correction.request'), true);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'assignment.manage'), false);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'source.confidential'), false);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'correction.approve'), false);
  assert.equal(hasEffectivePermission(reporterAuth, {}, 'embargo.manage'), false);

  // Photographer can view assignments & planning calendar, but cannot manage sources or embargoes
  assert.equal(hasEffectivePermission(photographerAuth, {}, 'assignment.view'), true);
  assert.equal(hasEffectivePermission(photographerAuth, {}, 'planning.manage'), true);
  assert.equal(hasEffectivePermission(photographerAuth, {}, 'source.view'), false);
  assert.equal(hasEffectivePermission(photographerAuth, {}, 'source.confidential'), false);
  assert.equal(hasEffectivePermission(photographerAuth, {}, 'embargo.manage'), false);

  // Moderator can submit correction requests only, not approve corrections or manage sources
  assert.equal(hasEffectivePermission(moderatorAuth, {}, 'correction.request'), true);
  assert.equal(hasEffectivePermission(moderatorAuth, {}, 'correction.approve'), false);
  assert.equal(hasEffectivePermission(moderatorAuth, {}, 'source.manage'), false);

  // News Editor & Editor-in-Chief hold full Phase 15 editorial authority
  for (const editorAuth of [newsEditorAuth, chiefEditorAuth, superAdminAuth]) {
    assert.equal(hasEffectivePermission(editorAuth, {}, 'assignment.manage'), true);
    assert.equal(hasEffectivePermission(editorAuth, {}, 'planning.manage'), true);
    assert.equal(hasEffectivePermission(editorAuth, {}, 'source.confidential'), true);
    assert.equal(hasEffectivePermission(editorAuth, {}, 'correction.approve'), true);
    assert.equal(hasEffectivePermission(editorAuth, {}, 'embargo.manage'), true);
  }

  // Non-editorial roles remain completely isolated from newsroom operations
  assert.equal(hasEffectivePermission(adsManagerAuth, {}, 'assignment.view'), false);
  assert.equal(hasEffectivePermission(adsManagerAuth, {}, 'source.view'), false);
  assert.equal(hasEffectivePermission(adsManagerAuth, {}, 'correction.request'), false);
  assert.equal(hasEffectivePermission(adsManagerAuth, {}, 'embargo.manage'), false);
});

test('normalizeArticle preserves Phase 15 embargo and public correction fields', () => {
  const normalized = normalizeArticle({
    id: 404,
    title: 'বাজেট বিশ্লেষণ প্রতিবেদন',
    slug: 'budget-analysis',
    assignment_id: 19,
    is_embargoed: true,
    embargo_until: '2026-11-15T10:00:00Z',
    embargo_reason: 'অর্থ মন্ত্রণালয়ের নিষেধাজ্ঞা',
    embargo_authorized_by: 2,
    embargo_released_at: null,
    auto_release_embargo: true,
    public_corrections: [
      {
        id: 7,
        correction_type: 'factual_error',
        public_note: 'প্রতিবেদনে বরাদ্দের অঙ্ক সংশোধন করা হয়েছে।',
        published_at: '2026-11-11T09:30:00Z'
      }
    ]
  });

  assert.equal(normalized.assignmentId, 19);
  assert.equal(normalized.isEmbargoed, true);
  assert.equal(normalized.embargoUntil, '2026-11-15T10:00:00Z');
  assert.equal(normalized.embargoReason, 'অর্থ মন্ত্রণালয়ের নিষেধাজ্ঞা');
  assert.equal(normalized.embargoAuthorizedBy, 2);
  assert.equal(normalized.embargoReleasedAt, null);
  assert.equal(normalized.autoReleaseEmbargo, true);
  assert.equal(normalized.publicCorrections.length, 1);
  assert.equal(normalized.publicCorrections[0].public_note, 'প্রতিবেদনে বরাদ্দের অঙ্ক সংশোধন করা হয়েছে।');
});

test('Phase 15 newsroom metadata tables and Bengali formatters cover all enum states', () => {
  assert.deepEqual(Object.keys(ASSIGNMENT_PRIORITY_META), ['low', 'normal', 'high', 'urgent']);
  assert.deepEqual(Object.keys(ASSIGNMENT_STATUS_META), [
    'assigned',
    'accepted',
    'in_progress',
    'submitted',
    'revision_requested',
    'completed',
    'cancelled'
  ]);
  assert.deepEqual(Object.keys(AVAILABILITY_STATUS_META), [
    'available',
    'on_assignment',
    'leave',
    'sick',
    'off_duty',
    'unavailable'
  ]);
  assert.deepEqual(Object.keys(RELIABILITY_META), ['A', 'B', 'C', 'D']);
  assert.deepEqual(Object.keys(VERIFICATION_STATUS_META), ['verified', 'pending', 'flagged', 'blacklisted']);
  assert.deepEqual(Object.keys(CORRECTION_STATUS_META), ['pending', 'approved', 'published', 'rejected']);
  assert.ok(SOURCE_TYPE_LABELS.whistleblower);
  assert.ok(CORRECTION_TYPE_LABELS.factual_error);

  assert.equal(formatBnCount(0), '০');
  assert.equal(formatBnCount(42), '৪২');
  assert.equal(formatDateTimeBn(null), 'নির্ধারিত নয়');
  assert.equal(formatDateBn(''), 'নির্ধারিত নয়');
  assert.notEqual(formatDateTimeBn('2026-11-11T12:00:00Z'), 'নির্ধারিত নয়');
});

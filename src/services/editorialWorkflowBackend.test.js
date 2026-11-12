import { test } from 'node:test';
import assert from 'node:assert';
import {
  WORKFLOW_STATUSES,
  validateWorkflowPermission,
  executeWorkflowTransition
} from './editorialWorkflowBackend.js';

test('Workflow Backend: Reporter permissions enforcement', () => {
  // Reporter can submit draft
  const allowed = validateWorkflowPermission('reporter', 'draft', 'submitted');
  assert.strictEqual(allowed.allowed, true);

  // Reporter can submit returned article
  const allowedFromReturn = validateWorkflowPermission('reporter', 'returned', 'submitted');
  assert.strictEqual(allowedFromReturn.allowed, true);

  // Reporter CANNOT approve
  const forbiddenApprove = validateWorkflowPermission('reporter', 'draft', 'approved');
  assert.strictEqual(forbiddenApprove.allowed, false);

  // Reporter CANNOT publish
  const forbiddenPublish = validateWorkflowPermission('reporter', 'draft', 'published');
  assert.strictEqual(forbiddenPublish.allowed, false);

  // Reporter CANNOT return or reject
  const forbiddenReturn = validateWorkflowPermission('reporter', 'under_review', 'returned');
  assert.strictEqual(forbiddenReturn.allowed, false);
});

test('Workflow Backend: Editor permissions enforcement', () => {
  // Editor can take submitted to under_review
  const reviewCheck = validateWorkflowPermission('editor', 'submitted', 'under_review');
  assert.strictEqual(reviewCheck.allowed, true);

  // Editor can return for revision
  const returnCheck = validateWorkflowPermission('editor', 'under_review', 'returned');
  assert.strictEqual(returnCheck.allowed, true);

  // Editor can reject
  const rejectCheck = validateWorkflowPermission('editor', 'under_review', 'rejected');
  assert.strictEqual(rejectCheck.allowed, true);

  // Editor can approve
  const approveCheck = validateWorkflowPermission('editor', 'under_review', 'approved');
  assert.strictEqual(approveCheck.allowed, true);

  // Editor CANNOT directly publish
  const publishCheck = validateWorkflowPermission('editor', 'approved', 'published');
  assert.strictEqual(publishCheck.allowed, false);
});

test('Workflow Backend: Editor-in-Chief permissions enforcement', () => {
  // Editor-in-Chief can approve
  const approveCheck = validateWorkflowPermission('editor_in_chief', 'under_review', 'approved');
  assert.strictEqual(approveCheck.allowed, true);

  // Editor-in-Chief can schedule
  const scheduleCheck = validateWorkflowPermission('editor_in_chief', 'approved', 'scheduled');
  assert.strictEqual(scheduleCheck.allowed, true);

  // Editor-in-Chief can publish
  const publishCheck = validateWorkflowPermission('editor_in_chief', 'approved', 'published');
  assert.strictEqual(publishCheck.allowed, true);
});

test('Workflow Backend: executeWorkflowTransition rejects unauthorized action', () => {
  const dummyArticle = {
    id: 'art-1',
    title: 'টেস্ট সংবাদ',
    status: 'draft'
  };

  const user = { name: 'আহমেদ জাবের', role: 'reporter' };
  const result = executeWorkflowTransition({
    article: dummyArticle,
    toStatus: 'published',
    user
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('অনুমতি নেই'));
});

test('Workflow Backend: executeWorkflowTransition requires comments for return and reject', () => {
  const dummyArticle = {
    id: 'art-1',
    title: 'টেস্ট সংবাদ',
    status: 'under_review'
  };

  const editorUser = { name: 'ফারহানা তন্বী', role: 'editor' };

  // Fails with empty comment
  const failResult = executeWorkflowTransition({
    article: dummyArticle,
    toStatus: 'returned',
    user: editorUser,
    comments: ''
  });
  assert.strictEqual(failResult.success, false);
  assert.ok(failResult.error.includes('মন্তব্য উল্লেখ করা আবশ্যক'));

  // Succeeds with comments
  const successResult = executeWorkflowTransition({
    article: dummyArticle,
    toStatus: 'returned',
    user: editorUser,
    comments: 'অনুগ্রহ করে ৩ নম্বর অনুচ্ছেদের পরিসংখ্যান যাচাই করুন।'
  });
  assert.strictEqual(successResult.success, true);
  assert.strictEqual(successResult.updatedArticle.status, 'returned');
  assert.strictEqual(successResult.updatedArticle.statusHistory.length, 1);
  assert.strictEqual(successResult.updatedArticle.editorialFeedback.length, 1);
  assert.strictEqual(successResult.updatedArticle.reviewerInfo.reviewedBy, 'ফারহানা তন্বী');
});

test('Workflow Backend: executeWorkflowTransition requires scheduledAt for scheduled status', () => {
  const dummyArticle = {
    id: 'art-1',
    title: 'টেস্ট সংবাদ',
    status: 'approved'
  };

  const chiefUser = { name: 'মোঃ লুৎফর রহমান', role: 'editor_in_chief' };

  // Fails without scheduledAt
  const failResult = executeWorkflowTransition({
    article: dummyArticle,
    toStatus: 'scheduled',
    user: chiefUser
  });
  assert.strictEqual(failResult.success, false);
  assert.ok(failResult.error.includes('তারিখ ও সময় উল্লেখ করা আবশ্যক'));

  // Succeeds with scheduledAt
  const scheduleTime = '2026-11-15T08:00:00Z';
  const successResult = executeWorkflowTransition({
    article: dummyArticle,
    toStatus: 'scheduled',
    user: chiefUser,
    scheduledAt: scheduleTime
  });
  assert.strictEqual(successResult.success, true);
  assert.strictEqual(successResult.updatedArticle.status, 'scheduled');
  assert.strictEqual(successResult.updatedArticle.scheduledAt, scheduleTime);
});


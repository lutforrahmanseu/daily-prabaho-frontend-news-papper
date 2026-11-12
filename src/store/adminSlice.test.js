import { test } from 'node:test';
import assert from 'node:assert';
import adminReducer, {
  setCurrentRole,
  approvePendingArticle,
  rejectPendingArticle,
  addReporter,
  deleteReporter,
  addTag,
  deleteTag,
  addAuthor,
  deleteAuthor,
  addUser,
  toggleUserStatus,
  toggleRolePermission,
  addAdCampaign,
  toggleAdStatus,
  updateSettings,
  updateMedia,
  recordAdImpression,
  recordAdClick
} from './adminSlice.js';

test('adminSlice initializes with realistic data', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  assert.strictEqual(state.currentRole, 'super_admin');
  assert.ok(state.reporters.length > 0);
  assert.ok(state.pendingApprovals.length > 0);
  assert.ok(state.tags.length > 0);
  assert.ok(state.roles.length > 0);
  assert.ok(state.ads.length > 0);
  assert.ok(state.settings.portalNameBn);
});

test('adminSlice approves pending article and creates audit log', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const pendingId = state.pendingApprovals[0].id;
  const initialAuditCount = state.auditLogs.length;

  const nextState = adminReducer(state, approvePendingArticle(pendingId));
  assert.strictEqual(nextState.pendingApprovals.find(i => i.id === pendingId), undefined);
  assert.strictEqual(nextState.auditLogs.length, initialAuditCount + 1);
  assert.ok(nextState.auditLogs[0].action.includes('অনুমোদন'));
});

test('adminSlice rejects pending article', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const pendingId = state.pendingApprovals[0].id;

  const nextState = adminReducer(state, rejectPendingArticle(pendingId));
  assert.strictEqual(nextState.pendingApprovals.find(i => i.id === pendingId), undefined);
  assert.ok(nextState.auditLogs[0].action.includes('প্রত্যাখ্যান'));
});

test('adminSlice adds and deletes reporters', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const newReporter = {
    id: 'test-rep-01',
    name: 'তানভীর আহমেদ',
    roleBn: 'বিশেষ প্রতিনিধি'
  };

  const withRep = adminReducer(state, addReporter(newReporter));
  assert.strictEqual(withRep.reporters[0].id, 'test-rep-01');

  const afterDelete = adminReducer(withRep, deleteReporter('test-rep-01'));
  assert.strictEqual(afterDelete.reporters.find(r => r.id === 'test-rep-01'), undefined);
});

test('adminSlice toggles role permissions in RBAC matrix', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const roleId = 'editor';
  const initialPermission = state.roles.find(r => r.id === roleId).permissions.delete_news;

  const toggled = adminReducer(state, toggleRolePermission({ roleId, permissionKey: 'delete_news' }));
  const updatedRole = toggled.roles.find(r => r.id === roleId);
  assert.strictEqual(updatedRole.permissions.delete_news, !initialPermission);
});

test('adminSlice toggles ad status between active and paused', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const adId = state.ads[0].id;
  const initialStatus = state.ads[0].status;

  const toggled = adminReducer(state, toggleAdStatus(adId));
  const updatedAd = toggled.ads.find(a => a.id === adId);
  assert.strictEqual(updatedAd.status, initialStatus === 'active' ? 'paused' : 'active');
});

test('adminSlice updates system settings', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const updated = adminReducer(state, updateSettings({ portalNameBn: 'দৈনিক নতুন বার্তা' }));
  assert.strictEqual(updated.settings.portalNameBn, 'দৈনিক নতুন বার্তা');
});

test('adminSlice tracks ad impressions and clicks with live CTR', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const targetAd = state.ads[0];
  const initialImpressions = targetAd.impressions;
  const initialClicks = targetAd.clicks;

  const afterImp = adminReducer(state, recordAdImpression(targetAd.id));
  assert.strictEqual(afterImp.ads[0].impressions, initialImpressions + 1);

  const afterClick = adminReducer(afterImp, recordAdClick(targetAd.id));
  assert.strictEqual(afterClick.ads[0].clicks, initialClicks + 1);
  assert.ok(afterClick.ads[0].ctr.includes('%'));
});

test('adminSlice updates media item metadata', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const targetMedia = state.media[0];

  const updatedState = adminReducer(state, updateMedia({
    id: targetMedia.id,
    altText: 'নতুন বিকল্প বিবরণ',
    credit: 'নতুন আলোকচিত্রী'
  }));

  const updatedItem = updatedState.media.find(m => m.id === targetMedia.id);
  assert.strictEqual(updatedItem.altText, 'নতুন বিকল্প বিবরণ');
  assert.strictEqual(updatedItem.credit, 'নতুন আলোকচিত্রী');
});


import { test } from 'node:test';
import assert from 'node:assert';
import {
  PERMISSIONS,
  ROLES_DEFINITION,
  backendLogin,
  backendLogout,
  backendRequestPasswordReset,
  backendResetPassword,
  backendChangePassword,
  backendUpdateProfile,
  backendHasPermission,
  backendValidateProtectedAction,
  backendGetUsers,
  backendCreateUser,
  backendToggleUserStatus,
  backendUpdateUserRole,
  backendGetRoles,
  backendToggleRolePermission
} from './authRbacBackend.js';

test('Auth RBAC Backend: 8 Roles and 16 Permissions are defined', () => {
  assert.strictEqual(PERMISSIONS.length, 16);
  assert.ok(ROLES_DEFINITION.super_admin);
  assert.ok(ROLES_DEFINITION.editor_in_chief);
  assert.ok(ROLES_DEFINITION.news_editor);
  assert.ok(ROLES_DEFINITION.reporter);
  assert.ok(ROLES_DEFINITION.photographer);
  assert.ok(ROLES_DEFINITION.seo_manager);
  assert.ok(ROLES_DEFINITION.ads_manager);
  assert.ok(ROLES_DEFINITION.moderator);
});

test('Auth RBAC Backend: Super Admin possesses all permissions', () => {
  PERMISSIONS.forEach(perm => {
    assert.strictEqual(backendHasPermission('super_admin', perm), true);
  });
});

test('Auth RBAC Backend: Role permission boundaries are enforced', () => {
  // Reporter can create and update news, but CANNOT publish or manage users
  assert.strictEqual(backendHasPermission('reporter', 'news.create'), true);
  assert.strictEqual(backendHasPermission('reporter', 'news.read'), true);
  assert.strictEqual(backendHasPermission('reporter', 'news.publish'), false);
  assert.strictEqual(backendHasPermission('reporter', 'user.manage'), false);
  assert.strictEqual(backendHasPermission('reporter', 'settings.manage'), false);

  // Photographer can only upload media and read news
  assert.strictEqual(backendHasPermission('photographer', 'media.upload'), true);
  assert.strictEqual(backendHasPermission('photographer', 'news.read'), true);
  assert.strictEqual(backendHasPermission('photographer', 'news.create'), false);
  assert.strictEqual(backendHasPermission('photographer', 'ads.manage'), false);

  // Ads manager can manage ads and view analytics
  assert.strictEqual(backendHasPermission('ads_manager', 'ads.manage'), true);
  assert.strictEqual(backendHasPermission('ads_manager', 'analytics.view'), true);
  assert.strictEqual(backendHasPermission('ads_manager', 'news.delete'), false);

  // SEO manager can manage SEO and categories
  assert.strictEqual(backendHasPermission('seo_manager', 'seo.manage'), true);
  assert.strictEqual(backendHasPermission('seo_manager', 'category.manage'), true);
  assert.strictEqual(backendHasPermission('seo_manager', 'user.manage'), false);
});

test('Auth RBAC Backend: Login and credential verification', () => {
  // Valid login
  const loginRes = backendLogin('superadmin@dailyprabaho.com', 'prabaho@2026');
  assert.strictEqual(loginRes.success, true);
  assert.ok(loginRes.token);
  assert.strictEqual(loginRes.user.email, 'superadmin@dailyprabaho.com');
  assert.strictEqual(loginRes.user.permissions.length, 16);

  // Invalid password
  const badPassRes = backendLogin('superadmin@dailyprabaho.com', 'wrongpassword');
  assert.strictEqual(badPassRes.success, false);
  assert.ok(badPassRes.error.includes('ভুল পাসওয়ার্ড'));

  // Invalid email
  const badEmailRes = backendLogin('nonexistent@dailyprabaho.com', 'prabaho@2026');
  assert.strictEqual(badEmailRes.success, false);
});

test('Auth RBAC Backend: Forgot Password & Reset Password flow', () => {
  const reqRes = backendRequestPasswordReset('reporter@dailyprabaho.com');
  assert.strictEqual(reqRes.success, true);
  assert.ok(reqRes.resetToken);

  // Reset password
  const resetRes = backendResetPassword(reqRes.resetToken, 'newsecret123', 'newsecret123');
  assert.strictEqual(resetRes.success, true);

  // Login with new password
  const newLogin = backendLogin('reporter@dailyprabaho.com', 'newsecret123');
  assert.strictEqual(newLogin.success, true);
});

test('Auth RBAC Backend: Change Password for authenticated user', () => {
  // Invalid current password
  const failRes = backendChangePassword('usr-04', 'wrongCurrent', 'freshpass123', 'freshpass123');
  assert.strictEqual(failRes.success, false);

  // Successful change
  const successRes = backendChangePassword('usr-04', 'newsecret123', 'finalpass123', 'finalpass123');
  assert.strictEqual(successRes.success, true);
});

test('Auth RBAC Backend: Protected action validation independently enforces 403 Forbidden', () => {
  const reporterUser = { id: 'usr-04', role: 'reporter', name: 'আহমেদ জাবের' };
  const adminUser = { id: 'usr-01', role: 'super_admin', name: 'মোঃ লুৎফর রহমান' };

  // Reporter trying to publish -> Blocked with 403
  const blockedAction = backendValidateProtectedAction(reporterUser, 'news.publish', 'Publish Live');
  assert.strictEqual(blockedAction.authorized, false);
  assert.strictEqual(blockedAction.status, 403);
  assert.ok(blockedAction.error.includes('403 Forbidden'));

  // Admin trying to publish -> Authorized with 200
  const allowedAction = backendValidateProtectedAction(adminUser, 'news.publish', 'Publish Live');
  assert.strictEqual(allowedAction.authorized, true);
  assert.strictEqual(allowedAction.status, 200);
});

test('Auth RBAC Backend: User management actions are independently guarded by user.manage', () => {
  const reporterUser = { id: 'usr-04', role: 'reporter', name: 'আহমেদ জাবের' };
  const superAdmin = { id: 'usr-01', role: 'super_admin', name: 'মোঃ লুৎফর রহমান' };

  // Reporter cannot create user
  const failCreate = backendCreateUser(reporterUser, {
    name: 'নতুন কর্মী',
    email: 'newuser@dailyprabaho.com',
    role: 'reporter'
  });
  assert.strictEqual(failCreate.success, false);
  assert.strictEqual(failCreate.status, 403);

  // Super admin can create user
  const successCreate = backendCreateUser(superAdmin, {
    name: 'পরীক্ষামূলক কর্মী',
    email: 'teststaff@dailyprabaho.com',
    role: 'photographer'
  });
  assert.strictEqual(successCreate.success, true);
  assert.strictEqual(successCreate.user.role, 'photographer');

  // Reporter cannot toggle status
  const failToggle = backendToggleUserStatus(reporterUser, successCreate.user.id);
  assert.strictEqual(failToggle.success, false);
  assert.strictEqual(failToggle.status, 403);

  // Super Admin can toggle status
  const successToggle = backendToggleUserStatus(superAdmin, successCreate.user.id);
  assert.strictEqual(successToggle.success, true);
  assert.strictEqual(successToggle.user.status, 'suspended');
});

test('Auth RBAC Backend: Role permission matrix toggling is guarded by role.manage', () => {
  const reporterUser = { id: 'usr-04', role: 'reporter', name: 'আহমেদ জাবের' };
  const superAdmin = { id: 'usr-01', role: 'super_admin', name: 'মোঃ লুৎফর রহমান' };

  // Reporter cannot toggle role permissions
  const failToggle = backendToggleRolePermission(reporterUser, 'photographer', 'news.create');
  assert.strictEqual(failToggle.success, false);
  assert.strictEqual(failToggle.status, 403);

  // Super admin cannot alter super_admin role permissions (strictly immutable root)
  const failSuperToggle = backendToggleRolePermission(superAdmin, 'super_admin', 'news.create');
  assert.strictEqual(failSuperToggle.success, false);
  assert.ok(failSuperToggle.error.includes('সুপার অ্যাডমিনের'));

  // Super admin can grant news.create to photographer
  const successToggle = backendToggleRolePermission(superAdmin, 'photographer', 'news.create');
  assert.strictEqual(successToggle.success, true);
  assert.ok(successToggle.role.permissions.includes('news.create'));
});

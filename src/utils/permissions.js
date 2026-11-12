import { backendHasPermission, ROLES_DEFINITION } from '../services/authRbacBackend.js';

/**
 * Extract normalized role slug from auth or admin Redux slices.
 */
export const getEffectiveRole = (authState = {}, adminState = {}) => {
  const authUser = authState?.user;
  const authRoles = Array.isArray(authState?.roles) ? authState.roles : [];
  const firstRole = authRoles[0];
  const fromAuthRoles = typeof firstRole === 'string' ? firstRole : firstRole?.slug;

  return (
    authUser?.role ||
    fromAuthRoles ||
    adminState?.currentRole ||
    adminState?.currentUser?.role ||
    'reporter'
  );
};

/**
 * Evaluate permission against live Laravel Sanctum permissions array first,
 * falling back to role-definition matrix only if explicit permissions array isn't loaded.
 */
const PHASE30_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'hyperlocal.view',
    'hyperlocal.locations.manage',
    'hyperlocal.correspondents.manage',
    'hyperlocal.assignments.manage',
    'hyperlocal.regional.approve',
    'hyperlocal.analytics.view'
  ],
  news_editor: [
    'hyperlocal.view',
    'hyperlocal.locations.manage',
    'hyperlocal.correspondents.manage',
    'hyperlocal.assignments.manage',
    'hyperlocal.regional.approve',
    'hyperlocal.analytics.view'
  ],
  regional_editor: [
    'hyperlocal.view',
    'hyperlocal.assignments.manage',
    'hyperlocal.regional.approve',
    'hyperlocal.analytics.view'
  ],
  reporter: ['hyperlocal.view'],
  seo_manager: ['hyperlocal.view', 'hyperlocal.analytics.view']
};

const PHASE15_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'assignment.view',
    'assignment.manage',
    'planning.manage',
    'source.view',
    'source.manage',
    'source.confidential',
    'correction.request',
    'correction.approve',
    'embargo.manage'
  ],
  news_editor: [
    'assignment.view',
    'assignment.manage',
    'planning.manage',
    'source.view',
    'source.manage',
    'source.confidential',
    'correction.request',
    'correction.approve',
    'embargo.manage'
  ],
  reporter: ['assignment.view', 'planning.manage', 'source.view', 'source.manage', 'correction.request'],
  photographer: ['assignment.view', 'planning.manage'],
  seo_manager: ['correction.request'],
  moderator: ['correction.request'],
  ads_manager: []
};

const PHASE16_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'live.view',
    'live.contribute',
    'live.publish',
    'coverage.view',
    'coverage.manage',
    'coverage.publish'
  ],
  news_editor: [
    'live.view',
    'live.contribute',
    'live.publish',
    'coverage.view',
    'coverage.manage',
    'coverage.publish'
  ],
  reporter: ['live.view', 'live.contribute', 'coverage.view', 'coverage.manage'],
  photographer: ['live.view', 'live.contribute', 'coverage.view'],
  seo_manager: ['live.view', 'coverage.view', 'coverage.manage'],
  moderator: ['live.view', 'coverage.view'],
  ads_manager: []
};

const PHASE17_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'multimedia.view',
    'multimedia.create',
    'multimedia.publish',
    'multimedia.delete',
    'media.manage_private'
  ],
  news_editor: [
    'multimedia.view',
    'multimedia.create',
    'multimedia.publish',
    'multimedia.delete',
    'media.manage_private'
  ],
  reporter: ['multimedia.view', 'multimedia.create'],
  photographer: ['multimedia.view', 'multimedia.create', 'media.manage_private'],
  seo_manager: ['multimedia.view'],
  moderator: ['multimedia.view'],
  ads_manager: []
};

const PHASE18_ROLE_PERMISSIONS = {
  editor_in_chief: ['comments.moderate', 'polls.manage'],
  news_editor: ['comments.moderate', 'polls.manage'],
  moderator: ['comments.moderate'],
  reporter: [],
  photographer: [],
  seo_manager: [],
  ads_manager: [],
  reader: []
};

const PHASE19_ROLE_PERMISSIONS = {
  editor_in_chief: ['epaper.view', 'epaper.manage', 'epaper.publish'],
  news_editor: ['epaper.view', 'epaper.manage', 'epaper.publish'],
  photographer: ['epaper.view', 'epaper.manage'],
  reporter: ['epaper.view'],
  seo_manager: ['epaper.view'],
  moderator: ['epaper.view'],
  ads_manager: [],
  reader: []
};

const PHASE20_ROLE_PERMISSIONS = {
  editor_in_chief: ['ai.use', 'ai.apply', 'ai.logs.view', 'ai.settings.manage'],
  news_editor: ['ai.use', 'ai.apply', 'ai.logs.view'],
  reporter: ['ai.use', 'ai.apply'],
  photographer: ['ai.use', 'ai.apply'],
  seo_manager: ['ai.use', 'ai.apply'],
  moderator: ['ai.use'],
  ads_manager: [],
  reader: []
};

export const PHASE21_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'subscriptions.manage',
    'payments.view',
    'payments.refund',
    'advertisers.manage',
    'campaigns.manage',
    'sponsored.manage',
    'sponsored.approve'
  ],
  news_editor: [
    'subscriptions.manage',
    'payments.view',
    'advertisers.manage',
    'campaigns.manage',
    'sponsored.manage',
    'sponsored.approve'
  ],
  ads_manager: [
    'payments.view',
    'advertisers.manage',
    'campaigns.manage',
    'sponsored.manage',
    'sponsored.approve'
  ],
  reporter: [],
  photographer: [],
  seo_manager: [],
  moderator: [],
  reader: []
};

export const PHASE22_ROLE_PERMISSIONS = {
  super_admin: ['citizen.review', 'citizen.publish', 'community.moderate', 'community.manage'],
  editor_in_chief: ['citizen.review', 'citizen.publish', 'community.moderate', 'community.manage'],
  news_editor: ['citizen.review', 'citizen.publish', 'community.moderate', 'community.manage'],
  moderator: ['citizen.review', 'community.moderate', 'community.manage'],
  reporter: ['citizen.review'],
  photographer: [],
  seo_manager: [],
  ads_manager: [],
  reader: []
};

export const PHASE23_ROLE_PERMISSIONS = {
  super_admin: ['events.manage', 'events.participants.manage', 'events.competitions.judge', 'events.results.publish'],
  editor_in_chief: ['events.manage', 'events.participants.manage', 'events.competitions.judge', 'events.results.publish'],
  news_editor: ['events.manage', 'events.participants.manage', 'events.competitions.judge', 'events.results.publish'],
  moderator: ['events.manage', 'events.participants.manage', 'events.competitions.judge'],
  reporter: ['events.manage'],
  photographer: [],
  seo_manager: [],
  ads_manager: [],
  reader: []
};

export const PHASE24_ROLE_PERMISSIONS = {
  super_admin: [
    'analytics.view',
    'analytics.editorial.view',
    'analytics.revenue.view',
    'analytics.experiments.manage',
    'analytics.export'
  ],
  editor_in_chief: [
    'analytics.view',
    'analytics.editorial.view',
    'analytics.revenue.view',
    'analytics.experiments.manage',
    'analytics.export'
  ],
  news_editor: [
    'analytics.view',
    'analytics.editorial.view',
    'analytics.experiments.manage',
    'analytics.export'
  ],
  seo_manager: [
    'analytics.view',
    'analytics.editorial.view',
    'analytics.experiments.manage',
    'analytics.export'
  ],
  ads_manager: [
    'analytics.view',
    'analytics.revenue.view',
    'analytics.export'
  ],
  reporter: [],
  photographer: [],
  moderator: [],
  reader: []
};

const PHASE26_ROLE_PERMISSIONS = {
  editor_in_chief: [
    'creator_studio.view',
    'creator_studio.create',
    'creator_studio.scripts.approve',
    'creator_studio.publish',
    'creator_studio.publish.external',
    'creator_studio.analytics.view',
    'creator_studio.settings.manage',
    'creator_studio.delete'
  ],
  news_editor: [
    'creator_studio.view',
    'creator_studio.create',
    'creator_studio.scripts.approve',
    'creator_studio.publish',
    'creator_studio.analytics.view'
  ],
  reporter: ['creator_studio.view', 'creator_studio.create'],
  photographer: ['creator_studio.view', 'creator_studio.create'],
  seo_manager: ['creator_studio.view', 'creator_studio.analytics.view'],
  ads_manager: [],
  moderator: [],
  reader: []
};

export const PHASE35_ROLE_PERMISSIONS = {
  super_admin: [
    'syndication.view',
    'syndication.partners.approve',
    'syndication.licenses.manage',
    'syndication.plans.manage',
    'syndication.abuse.manage'
  ],
  editor_in_chief: [
    'syndication.view',
    'syndication.partners.approve',
    'syndication.licenses.manage',
    'syndication.plans.manage',
    'syndication.abuse.manage'
  ],
  news_editor: [
    'syndication.view',
    'syndication.partners.approve',
    'syndication.licenses.manage'
  ],
  ads_manager: [
    'syndication.view',
    'syndication.plans.manage'
  ],
  seo_manager: ['syndication.view'],
  reporter: [],
  photographer: [],
  moderator: [],
  reader: []
};

export const hasEffectivePermission = (authState = {}, adminState = {}, requiredPermission = null) => {
  if (!requiredPermission) return true;

  const user = authState?.user || adminState?.currentUser;
  if (!user) return false;

  const role = getEffectiveRole(authState, adminState);
  const roles = Array.isArray(authState?.roles)
    ? authState.roles.map((r) => (typeof r === 'string' ? r : r?.slug)).filter(Boolean)
    : [];

  if (role === 'super_admin' || roles.includes('super_admin')) {
    return true;
  }

  const perms = Array.isArray(authState?.permissions) && authState.permissions.length > 0
    ? authState.permissions
    : (Array.isArray(user?.permissions) ? user.permissions : []);

  const requiredList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

  if (perms.length > 0) {
    return requiredList.some((perm) => perms.includes(perm));
  }

  const effectiveUser = { ...user, role };
  const phase15RolePerms = PHASE15_ROLE_PERMISSIONS[role] || [];
  const phase16RolePerms = PHASE16_ROLE_PERMISSIONS[role] || [];
  const phase17RolePerms = PHASE17_ROLE_PERMISSIONS[role] || [];
  const phase18RolePerms = PHASE18_ROLE_PERMISSIONS[role] || [];
  const phase19RolePerms = PHASE19_ROLE_PERMISSIONS[role] || [];
  const phase20RolePerms = PHASE20_ROLE_PERMISSIONS[role] || [];
  const phase21RolePerms = PHASE21_ROLE_PERMISSIONS[role] || [];
  const phase22RolePerms = PHASE22_ROLE_PERMISSIONS[role] || [];
  const phase23RolePerms = PHASE23_ROLE_PERMISSIONS[role] || [];
  const phase24RolePerms = PHASE24_ROLE_PERMISSIONS[role] || [];
  const phase26RolePerms = PHASE26_ROLE_PERMISSIONS[role] || [];
  const phase30RolePerms = PHASE30_ROLE_PERMISSIONS[role] || [];
  const phase35RolePerms = PHASE35_ROLE_PERMISSIONS[role] || [];
  return requiredList.some(
    (perm) =>
      backendHasPermission(effectiveUser, perm) ||
      phase15RolePerms.includes(perm) ||
      phase16RolePerms.includes(perm) ||
      phase17RolePerms.includes(perm) ||
      phase18RolePerms.includes(perm) ||
      phase19RolePerms.includes(perm) ||
      phase20RolePerms.includes(perm) ||
      phase21RolePerms.includes(perm) ||
      phase22RolePerms.includes(perm) ||
      phase23RolePerms.includes(perm) ||
      phase24RolePerms.includes(perm) ||
      phase26RolePerms.includes(perm) ||
      phase30RolePerms.includes(perm) ||
      phase35RolePerms.includes(perm)
  );
};

export const getRoleDisplayMeta = (roleSlug, fallbackName = '') => {
  return (
    ROLES_DEFINITION[roleSlug] || {
      id: roleSlug,
      nameBn: fallbackName || roleSlug,
      nameEn: fallbackName || roleSlug,
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-200'
    }
  );
};


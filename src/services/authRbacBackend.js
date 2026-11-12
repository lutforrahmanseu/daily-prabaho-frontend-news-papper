/**
 * Authentication & Role-Based Access Control (RBAC) Backend Engine
 * Daily Prabaho (দৈনিক বার্তা প্রবাহ)
 *
 * Implements backend authentication, session tokens, password hashing/reset simulation,
 * and independent backend permission validation for all 8 roles & 16 permissions.
 */

// 1. The 16 Granular Permissions defined by specification
export const PERMISSIONS = [
  'news.create',
  'news.read',
  'news.update',
  'news.delete',
  'news.review',
  'news.approve',
  'news.publish',
  'news.schedule',
  'media.upload',
  'category.manage',
  'user.manage',
  'role.manage',
  'seo.manage',
  'ads.manage',
  'analytics.view',
  'settings.manage'
];

export const PERMISSION_METADATA = {
  'news.create': { labelBn: 'সংবাদ তৈরি', labelEn: 'Create News', module: 'News' },
  'news.read': { labelBn: 'সংবাদ দর্শন', labelEn: 'Read News', module: 'News' },
  'news.update': { labelBn: 'সংবাদ সম্পাদনা', labelEn: 'Update News', module: 'News' },
  'news.delete': { labelBn: 'সংবাদ অপসারণ', labelEn: 'Delete News', module: 'News' },
  'news.review': { labelBn: 'সংবাদ পর্যালোচনা', labelEn: 'Review News', module: 'Editorial' },
  'news.approve': { labelBn: 'সংবাদ অনুমোদন', labelEn: 'Approve News', module: 'Editorial' },
  'news.publish': { labelBn: 'লাইভ প্রকাশনা', labelEn: 'Publish News', module: 'Editorial' },
  'news.schedule': { labelBn: 'সময় নির্ধারণ', labelEn: 'Schedule News', module: 'Editorial' },
  'media.upload': { labelBn: 'মিডিয়া আপলোড', labelEn: 'Upload Media', module: 'Media' },
  'category.manage': { labelBn: 'বিভাগ পরিচালনা', labelEn: 'Manage Categories', module: 'Taxonomy' },
  'user.manage': { labelBn: 'ইউজার পরিচালনা', labelEn: 'Manage Users', module: 'Administration' },
  'role.manage': { labelBn: 'ভূমিকা ও অনুমতি', labelEn: 'Manage Roles', module: 'Administration' },
  'seo.manage': { labelBn: 'এসইও ও ট্যাগ', labelEn: 'Manage SEO & Tags', module: 'SEO' },
  'ads.manage': { labelBn: 'বিজ্ঞাপন ক্যাম্পেইন', labelEn: 'Manage Ads', module: 'Commercial' },
  'analytics.view': { labelBn: 'অ্যানালিটিক্স দেখা', labelEn: 'View Analytics', module: 'Reporting' },
  'settings.manage': { labelBn: 'সিস্টেম কনফিগারেশন', labelEn: 'Manage Settings', module: 'System' }
};

// 2. The 8 Standard Roles with Default Permissions
export const ROLES_DEFINITION = {
  super_admin: {
    id: 'super_admin',
    nameBn: 'সুপার অ্যাডমিন',
    nameEn: 'Super Admin',
    description: 'সম্পূর্ণ সিস্টেম ও প্রশাসনিক ব্যবস্থাপনার সর্বোচ্চ ক্ষমতা',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    permissions: [...PERMISSIONS]
  },
  editor_in_chief: {
    id: 'editor_in_chief',
    nameBn: 'প্রধান সম্পাদক',
    nameEn: 'Editor-in-Chief',
    description: 'সম্পাদকীয় ও চূড়ান্ত প্রকাশনা সিদ্ধান্তের সর্বোচ্চ নিয়ন্ত্রণ',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    permissions: [
      'news.create',
      'news.read',
      'news.update',
      'news.delete',
      'news.review',
      'news.approve',
      'news.publish',
      'news.schedule',
      'media.upload',
      'category.manage',
      'seo.manage',
      'ads.manage',
      'analytics.view',
      'settings.manage'
    ]
  },
  news_editor: {
    id: 'news_editor',
    nameBn: 'বার্তা সম্পাদক',
    nameEn: 'News Editor',
    description: 'সংবাদ পরীক্ষা, কপি-এডিটিং এবং প্রকাশনা অনুমোদন পর্যালোচনা',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    permissions: [
      'news.create',
      'news.read',
      'news.update',
      'news.review',
      'news.approve',
      'media.upload',
      'category.manage',
      'seo.manage',
      'analytics.view'
    ]
  },
  reporter: {
    id: 'reporter',
    nameBn: 'প্রতিবেদক',
    nameEn: 'Reporter',
    description: 'মাঠপর্যায় থেকে সংবাদ সংগ্রহ, ড্রাফট তৈরি ও পর্যালোচনায় জমা',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    permissions: [
      'news.create',
      'news.read',
      'news.update',
      'media.upload'
    ]
  },
  photographer: {
    id: 'photographer',
    nameBn: 'আলোকচিত্রী',
    nameEn: 'Photographer',
    description: 'ছবি ও ভিডিও কন্টেন্ট তৈরি ও মিডিয়া লাইব্রেরিতে আপলোড',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    permissions: [
      'news.read',
      'media.upload'
    ]
  },
  seo_manager: {
    id: 'seo_manager',
    nameBn: 'এসইও ম্যানেজার',
    nameEn: 'SEO Manager',
    description: 'সার্চ ইঞ্জিন কি-ওয়ার্ড, ট্যাগিং, সাইটম্যাপ ও ট্রাফিক বিশ্লেষণ',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    permissions: [
      'news.read',
      'category.manage',
      'seo.manage',
      'analytics.view'
    ]
  },
  ads_manager: {
    id: 'ads_manager',
    nameBn: 'বিজ্ঞাপন ব্যবস্থাপক',
    nameEn: 'Advertisement Manager',
    description: 'কমার্শিয়াল স্পনসরশিপ, ব্যানার ক্যাম্পেইন ও পারফরম্যান্স পর্যবেক্ষণ',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    permissions: [
      'news.read',
      'ads.manage',
      'analytics.view'
    ]
  },
  moderator: {
    id: 'moderator',
    nameBn: 'কমিউনিটি মডারেটর',
    nameEn: 'Moderator',
    description: 'পাঠক মন্তব্য নিরীক্ষণ ও আপত্তিকর কন্টেন্ট ফিল্টারিং',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300',
    permissions: [
      'news.read'
    ]
  }
};

// 3. In-Memory User Directory (with simulated password & token repository)
export const INITIAL_AUTH_USERS = [
  {
    id: 'usr-01',
    email: 'superadmin@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'মোঃ লুৎফর রহমান',
    role: 'super_admin',
    department: 'সিস্টেম ও সম্পাদকীয় প্রশাসন',
    phone: '+৮৮০১৭০০০০০০০১',
    bio: 'দৈনিক বার্তা প্রবাহের প্রধান সম্পাদক ও সিস্টেম অ্যাডমিনিস্ট্রেটর।',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-02',
    email: 'chiefeditor@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'রেহনুমা আহমেদ',
    role: 'editor_in_chief',
    department: 'প্রধান সম্পাদকীয় দপ্তর',
    phone: '+৮৮০১৭০০০০০০০২',
    bio: 'জাতীয় নীতি ও পররাষ্ট্র বিষয়ক বিশেষজ্ঞ এবং প্রধান সম্পাদক।',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-03',
    email: 'newseditor@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'ফারহানা ইসলাম তন্বী',
    role: 'news_editor',
    department: 'বার্তা ডেস্ক (অর্থনীতি ও বাণিজ্য)',
    phone: '+৮৮০১৭০০০০০০০৩',
    bio: 'অর্থনৈতিক সাংবাদিকতা ও অনুসন্ধানী সংবাদ সমন্বয়ক।',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-04',
    email: 'reporter@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'আহমেদ জাবের',
    role: 'reporter',
    department: 'ক্রীড়া ও জাতীয় সংবাদ ডেস্ক',
    phone: '+৮৮০১৭০০০০০০০৪',
    bio: 'ক্রিকেট ও ফুটবল বিষয়ক বিশেষ প্রতিনিধি।',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-05',
    email: 'photo@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'রফিকুল ইসলাম রাফী',
    role: 'photographer',
    department: 'ফটো ও মাল্টিমিডিয়া বিভাগ',
    phone: '+৮৮০১৭০০০০০০০৫',
    bio: 'প্রধান আলোকচিত্রী ও ড্রোন সিনেমাটোগ্রাফার।',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-06',
    email: 'seo@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'সাজেদুল করিম',
    role: 'seo_manager',
    department: 'ডিজিটাল গ্রোথ ও এসইও',
    phone: '+৮৮০১৭০০০০০০০৬',
    bio: 'সার্চ ইঞ্জিন ভিজিবিলিটি ও ট্রাফিক অপটিমাইজার।',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-07',
    email: 'ads@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'ইশরাত জাহান',
    role: 'ads_manager',
    department: 'বিজ্ঞাপন ও বাণিজ্যিক প্রচার',
    phone: '+৮৮০১৭০০০০০০০৭',
    bio: 'করপোরেট পার্টনারশিপ ও ডিজিটাল অ্যাড ক্যাম্পেইন হেড।',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'usr-08',
    email: 'moderator@dailyprabaho.com',
    passwordHash: 'prabaho@2026',
    name: 'তানভীর হাসান',
    role: 'moderator',
    department: 'কমিউনিটি ও অডিয়েন্স এনগেজমেন্ট',
    phone: '+৮৮০১৭০০০০০০০৮',
    bio: 'অনলাইন পাঠক মন্তব্য ও নীতিমালা মডারেটর।',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

// In-memory runtime state
let usersDb = [...INITIAL_AUTH_USERS];
let activeSessions = new Map(); // token -> user
let passwordResetTokens = new Map(); // token -> { email, expiresAt }

/**
 * Backend Authentication: Login with email and password
 */
export function backendLogin(email, password) {
  if (!email || !password) {
    return { success: false, error: 'ইমেইল এবং পাসওয়ার্ড উভয়টি পূরণ করুন।' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = usersDb.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { success: false, error: 'এই ইমেইল দিয়ে কোনো ব্যবহারকারী পাওয়া যায়নি।' };
  }

  if (user.status !== 'active') {
    return { success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত রয়েছে। প্রশাসনের সাথে যোগাযোগ করুন।' };
  }

  if (user.passwordHash !== password) {
    return { success: false, error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' };
  }

  // Generate session token
  const token = `prabaho-sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const roleObj = ROLES_DEFINITION[user.role] || ROLES_DEFINITION.reporter;
  const permissions = roleObj.permissions;

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleBn: roleObj.nameBn,
    roleEn: roleObj.nameEn,
    department: user.department,
    phone: user.phone,
    bio: user.bio,
    avatar: user.avatar,
    permissions
  };

  activeSessions.set(token, sessionUser);

  return {
    success: true,
    token,
    user: sessionUser
  };
}

/**
 * Backend Authentication: Logout
 */
export function backendLogout(token) {
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  return { success: true };
}

/**
 * Backend Authentication: Request Password Reset Token
 */
export function backendRequestPasswordReset(email) {
  if (!email) {
    return { success: false, error: 'ইমেইল ঠিকানা প্রদান করুন।' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = usersDb.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { success: false, error: 'এই ইমেইল ঠিকানায় কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি।' };
  }

  const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  passwordResetTokens.set(resetToken, {
    email: normalizedEmail,
    expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour validity
  });

  return {
    success: true,
    resetToken,
    message: 'পাসওয়ার্ড রিসেট লিংক সফলভাবে তৈরি হয়েছে।'
  };
}

/**
 * Backend Authentication: Reset Password using Token
 */
export function backendResetPassword(resetToken, newPassword, confirmPassword) {
  if (!resetToken || !passwordResetTokens.has(resetToken)) {
    return { success: false, error: 'পাসওয়ার্ড রিসেট টোকেনটি অবৈধ বা মেয়াদোত্তীর্ণ।' };
  }

  const tokenData = passwordResetTokens.get(resetToken);
  if (tokenData.expiresAt < Date.now()) {
    passwordResetTokens.delete(resetToken);
    return { success: false, error: 'রিসেট টোকেনের মেয়াদ শেষ হয়ে গেছে। পুনরায় অনুরোধ করুন।' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।' };
  }

  const user = usersDb.find(u => u.email === tokenData.email);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' };
  }

  user.passwordHash = newPassword;
  passwordResetTokens.delete(resetToken);

  return {
    success: true,
    message: 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
  };
}

/**
 * Backend Authentication: Change Password for Authenticated User
 */
export function backendChangePassword(userId, currentPassword, newPassword, confirmPassword) {
  const user = usersDb.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' };
  }

  if (user.passwordHash !== currentPassword) {
    return { success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'পাসওয়ার্ড দুটি মিলছে না।' };
  }

  user.passwordHash = newPassword;
  return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' };
}

/**
 * Backend Users Query
 */
export function backendGetUsers() {
  return [...usersDb];
}

/**
 * Backend User Management: Create User (Guarded by user.manage)
 */
export function backendCreateUser(actorUser, userData) {
  const authCheck = backendValidateProtectedAction(actorUser, 'user.manage', 'Create User');
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, status: authCheck.status };
  }

  if (!userData.name || !userData.email) {
    return { success: false, error: 'নাম এবং ইমেইল আবশ্যক।' };
  }

  const existing = usersDb.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
  if (existing) {
    return { success: false, error: 'এই ইমেইল দিয়ে ইতোমধ্যে একজন ব্যবহারকারী নিবন্ধিত রয়েছে।' };
  }

  const roleObj = ROLES_DEFINITION[userData.role] || ROLES_DEFINITION.reporter;
  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    email: userData.email.trim().toLowerCase(),
    passwordHash: userData.password || 'prabaho@2026',
    name: userData.name.trim(),
    role: userData.role || 'reporter',
    roleBn: roleObj.nameBn,
    roleEn: roleObj.nameEn,
    department: userData.department || 'সাধারণ বার্তা বিভাগ',
    phone: userData.phone || '+৮৮০১৭০০০০০০০০',
    bio: userData.bio || 'দৈনিক বার্তা প্রবাহের সংবাদকর্মী।',
    avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    lastLogin: 'এইমাত্র যোগ করা হয়েছে'
  };

  usersDb.unshift(newUser);
  return { success: true, user: newUser };
}

/**
 * Backend User Management: Toggle User Status (Guarded by user.manage)
 */
export function backendToggleUserStatus(actorUser, userId) {
  const authCheck = backendValidateProtectedAction(actorUser, 'user.manage', 'Toggle User Status');
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, status: authCheck.status };
  }

  const user = usersDb.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' };
  }

  user.status = user.status === 'active' ? 'suspended' : 'active';
  return { success: true, user };
}

/**
 * Backend User Management: Update User Role (Guarded by user.manage)
 */
export function backendUpdateUserRole(actorUser, userId, newRole) {
  const authCheck = backendValidateProtectedAction(actorUser, 'user.manage', 'Update User Role');
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, status: authCheck.status };
  }

  const user = usersDb.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' };
  }

  if (!ROLES_DEFINITION[newRole]) {
    return { success: false, error: 'অবৈধ ভূমিকা (Role)।' };
  }

  user.role = newRole;
  user.roleBn = ROLES_DEFINITION[newRole].nameBn;
  user.roleEn = ROLES_DEFINITION[newRole].nameEn;
  return { success: true, user };
}

/**
 * Backend Role Management: Get all roles with mutable permissions copy
 */
let rolesMatrixDb = JSON.parse(JSON.stringify(ROLES_DEFINITION));

export function backendGetRoles() {
  return Object.values(rolesMatrixDb).map(role => {
    const memberCount = usersDb.filter(u => u.role === role.id).length;
    return {
      ...role,
      memberCount
    };
  });
}

/**
 * Backend Role Management: Toggle Role Permission (Guarded by role.manage)
 */
export function backendToggleRolePermission(actorUser, roleId, permission) {
  const authCheck = backendValidateProtectedAction(actorUser, 'role.manage', 'Toggle Role Permission');
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, status: authCheck.status };
  }

  if (roleId === 'super_admin') {
    return { success: false, error: 'সুপার অ্যাডমিনের পূর্ণাঙ্গ ক্ষমতা সুরক্ষিত এবং অপরিবর্তনযোগ্য।' };
  }

  const targetRole = rolesMatrixDb[roleId];
  if (!targetRole) {
    return { success: false, error: 'ভূমিকা পাওয়া যায়নি।' };
  }

  if (!PERMISSIONS.includes(permission)) {
    return { success: false, error: 'অবৈধ অনুমতি (Invalid permission)।' };
  }

  const hasPerm = targetRole.permissions.includes(permission);
  if (hasPerm) {
    targetRole.permissions = targetRole.permissions.filter(p => p !== permission);
  } else {
    targetRole.permissions.push(permission);
  }

  return { success: true, role: targetRole };
}

/**
 * Reset test database state
 */
export function backendResetDatabase() {
  usersDb = [...INITIAL_AUTH_USERS];
  rolesMatrixDb = JSON.parse(JSON.stringify(ROLES_DEFINITION));
  activeSessions.clear();
  passwordResetTokens.clear();
}

/**
 * Backend User Profile: Update profile details
 */
export function backendUpdateProfile(userId, profileData) {
  const user = usersDb.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' };
  }

  if (profileData.name) user.name = profileData.name.trim();
  if (profileData.bio) user.bio = profileData.bio.trim();
  if (profileData.phone) user.phone = profileData.phone.trim();
  if (profileData.department) user.department = profileData.department.trim();
  if (profileData.avatar) user.avatar = profileData.avatar.trim();

  return { success: true, updatedUser: user };
}

/**
 * Backend RBAC: Check if role or user possesses a permission
 */
export function backendHasPermission(userOrRole, permission) {
  if (!userOrRole) return false;

  let roleId = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;

  // Normalize aliases if any
  if (roleId === 'editor') roleId = 'news_editor';

  // Super Admin possesses everything
  if (roleId === 'super_admin') return true;

  const roleObj = ROLES_DEFINITION[roleId];
  if (!roleObj) return false;

  return roleObj.permissions.includes(permission);
}

/**
 * Backend Security Barrier: Validates protected action execution.
 * Throws 403 error result if the user lacks the permission.
 */
export function backendValidateProtectedAction(user, requiredPermission, actionName = 'Action') {
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: 'প্রবেশাধিকার অস্বীকার: আপনি লগইন করেননি (Unauthenticated: 401)'
    };
  }

  const hasPerm = backendHasPermission(user, requiredPermission);
  if (!hasPerm) {
    const permMeta = PERMISSION_METADATA[requiredPermission];
    return {
      authorized: false,
      status: 403,
      error: `অনুমতি নেই: '${permMeta?.labelBn || requiredPermission}' কার্যক্রমটির জন্য আপনার প্রয়োজনীয় অনুমতি নেই (403 Forbidden)`
    };
  }

  return {
    authorized: true,
    status: 200,
    action: actionName
  };
}

import { createSlice } from '@reduxjs/toolkit';
import { REPORTERS } from '../data/reporters.js';
import { CATEGORIES } from '../data/categories.js';
import {
  PENDING_APPROVALS_DATA,
  TAGS_DATA,
  AUTHORS_DATA,
  USERS_DATA,
  ROLES_PERMISSIONS_MATRIX,
  MEDIA_LIBRARY,
  ADS_CAMPAIGNS,
  NOTIFICATIONS_DATA,
  SETTINGS_DEFAULT
} from '../data/adminMockData.js';

const initialState = {
  currentRole: 'super_admin', // 'super_admin' | 'editor_in_chief' | 'editor' | 'reporter' | 'moderator'
  currentUser: {
    id: 'user-01',
    name: 'মোঃ লুৎফর রহমান',
    email: 'editor@dailyprabaho.com',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  reporters: REPORTERS,
  categories: CATEGORIES,
  tags: TAGS_DATA,
  authors: AUTHORS_DATA,
  users: USERS_DATA,
  roles: ROLES_PERMISSIONS_MATRIX,
  media: MEDIA_LIBRARY,
  ads: ADS_CAMPAIGNS,
  pendingApprovals: PENDING_APPROVALS_DATA,
  notifications: NOTIFICATIONS_DATA,
  settings: SETTINGS_DEFAULT,
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-11-10T09:20:00Z',
      user: 'মোঃ লুৎফর রহমান',
      role: 'প্রধান সম্পাদক',
      ip: '103.114.172.45',
      action: 'প্রকাশনা অনুমোদন (Publish Approval)',
      target: 'ঢাকা মেট্রোরেল সম্প্রসারণে নতুন গতি'
    },
    {
      id: 'log-2',
      timestamp: '2026-11-10T08:35:00Z',
      user: 'আহমেদ জাবের',
      role: 'ক্রীড়া প্রতিবেদক',
      ip: '103.114.172.58',
      action: 'সংবাদ জমা (Submit Draft)',
      target: 'মিরপুরে রুদ্ধশ্বাস লড়াইয়ে জয় বাংলাদেশের'
    },
    {
      id: 'log-3',
      timestamp: '2026-11-10T07:50:00Z',
      user: 'ফারহানা ইসলাম তন্বী',
      role: 'জ্যেষ্ঠ প্রতিবেদক',
      ip: '103.114.172.12',
      action: 'সম্পাদকীয় সংশোধন (Editorial Edit)',
      target: 'পদ্মা সেতু করিডরে নতুন অর্থনৈতিক হাব'
    },
    {
      id: 'log-4',
      timestamp: '2026-11-10T06:15:00Z',
      user: 'সিস্টেম অ্যাডমিন',
      role: 'সুপার অ্যাডমিন',
      ip: '192.168.1.1',
      action: 'বিজ্ঞাপন ক্যাম্পেইন পরিবর্তন (Ad Modified)',
      target: 'গ্রামীণফোন ৫জি ব্যানার'
    }
  ],
  adminActiveTab: 'articles'
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCurrentRole: (state, action) => {
      state.currentRole = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    setAdminActiveTab: (state, action) => {
      state.adminActiveTab = action.payload;
    },
    addReporter: (state, action) => {
      state.reporters.unshift(action.payload);
    },
    deleteReporter: (state, action) => {
      state.reporters = state.reporters.filter(rep => rep.id !== action.payload);
    },
    addAuditLog: (state, action) => {
      state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        role: state.currentRole,
        ip: '103.114.172.45',
        ...action.payload
      });
    },
    addCategory: (state, action) => {
      state.categories.push(action.payload);
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload && cat.slug !== action.payload);
    },
    approvePendingArticle: (state, action) => {
      const id = action.payload;
      const target = state.pendingApprovals.find(item => item.id === id);
      if (target) {
        state.pendingApprovals = state.pendingApprovals.filter(item => item.id !== id);
        state.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: state.currentUser.name,
          role: state.currentRole,
          ip: '103.114.172.45',
          action: 'সংবাদ অনুমোদন (Approved Live)',
          target: target.title
        });
      }
    },
    rejectPendingArticle: (state, action) => {
      const id = action.payload;
      const target = state.pendingApprovals.find(item => item.id === id);
      if (target) {
        state.pendingApprovals = state.pendingApprovals.filter(item => item.id !== id);
        state.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: state.currentUser.name,
          role: state.currentRole,
          ip: '103.114.172.45',
          action: 'সংবাদ প্রত্যাখ্যান (Rejected Draft)',
          target: target.title
        });
      }
    },
    addTag: (state, action) => {
      state.tags.unshift(action.payload);
    },
    deleteTag: (state, action) => {
      state.tags = state.tags.filter(t => t.id !== action.payload);
    },
    addAuthor: (state, action) => {
      state.authors.unshift(action.payload);
    },
    deleteAuthor: (state, action) => {
      state.authors = state.authors.filter(a => a.id !== action.payload);
    },
    addUser: (state, action) => {
      state.users.unshift(action.payload);
    },
    toggleUserStatus: (state, action) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
      }
    },
    toggleRolePermission: (state, action) => {
      const { roleId, permissionKey } = action.payload;
      const role = state.roles.find(r => r.id === roleId);
      if (role && role.permissions[permissionKey] !== undefined) {
        role.permissions[permissionKey] = !role.permissions[permissionKey];
      }
    },
    addMedia: (state, action) => {
      state.media.unshift(action.payload);
    },
    updateMedia: (state, action) => {
      const idx = state.media.findIndex(m => m.id === action.payload.id);
      if (idx !== -1) {
        state.media[idx] = { ...state.media[idx], ...action.payload };
      }
    },
    deleteMedia: (state, action) => {
      state.media = state.media.filter(m => m.id !== action.payload);
    },
    addAdCampaign: (state, action) => {
      state.ads.unshift(action.payload);
    },
    updateAdCampaign: (state, action) => {
      const idx = state.ads.findIndex(a => a.id === action.payload.id);
      if (idx !== -1) {
        state.ads[idx] = { ...state.ads[idx], ...action.payload };
      }
    },
    deleteAdCampaign: (state, action) => {
      state.ads = state.ads.filter(a => a.id !== action.payload);
    },
    toggleAdStatus: (state, action) => {
      const ad = state.ads.find(a => a.id === action.payload);
      if (ad) {
        ad.status = ad.status === 'active' ? 'paused' : 'active';
      }
    },
    recordAdImpression: (state, action) => {
      const ad = state.ads.find(a => a.id === action.payload || a.placement === action.payload);
      if (ad) {
        ad.impressions = (ad.impressions || 0) + 1;
        if (ad.impressions > 0) {
          ad.ctr = `${(((ad.clicks || 0) / ad.impressions) * 100).toFixed(2)}%`;
        }
      }
    },
    recordAdClick: (state, action) => {
      const ad = state.ads.find(a => a.id === action.payload || a.placement === action.payload);
      if (ad) {
        ad.clicks = (ad.clicks || 0) + 1;
        ad.impressions = Math.max(ad.impressions || 1, ad.clicks);
        ad.ctr = `${((ad.clicks / ad.impressions) * 100).toFixed(2)}%`;
      }
    },
    toggleNavMenuItemVisibility: (state, action) => {
      if (state.settings.navigationMenu) {
        const item = state.settings.navigationMenu.find(n => n.id === action.payload);
        if (item) item.isVisible = !item.isVisible;
      }
    },
    updateNavMenuItem: (state, action) => {
      if (state.settings.navigationMenu) {
        const idx = state.settings.navigationMenu.findIndex(n => n.id === action.payload.id);
        if (idx !== -1) {
          state.settings.navigationMenu[idx] = { ...state.settings.navigationMenu[idx], ...action.payload };
        }
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    }
  }
});

export const {
  setCurrentRole,
  setCurrentUser,
  setAdminActiveTab,
  addReporter,
  deleteReporter,
  addAuditLog,
  addCategory,
  deleteCategory,
  approvePendingArticle,
  rejectPendingArticle,
  addTag,
  deleteTag,
  addAuthor,
  deleteAuthor,
  addUser,
  toggleUserStatus,
  toggleRolePermission,
  addMedia,
  updateMedia,
  deleteMedia,
  addAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
  toggleAdStatus,
  recordAdImpression,
  recordAdClick,
  toggleNavMenuItemVisibility,
  updateNavMenuItem,
  markAllNotificationsRead,
  updateSettings
} = adminSlice.actions;

export default adminSlice.reducer;

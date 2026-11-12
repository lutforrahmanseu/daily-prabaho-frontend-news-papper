import { createSlice } from '@reduxjs/toolkit';

const getInitialToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || null;
  }
  return null;
};

const getInitialUser = () => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const initialUser = getInitialUser();
const extractRoleSlugs = (user) => {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles.map((r) => (typeof r === 'string' ? r : r?.slug)).filter(Boolean);
  }
  return user?.role ? [user.role] : [];
};

const initialState = {
  token: getInitialToken(),
  user: initialUser,
  isAuthenticated: !!(getInitialToken() && initialUser),
  permissions: Array.isArray(initialUser?.permissions) ? initialUser.permissions : [],
  roles: extractRoleSlugs(initialUser),
  loading: false,
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token || state.token;
      state.isAuthenticated = !!(state.token && user);
      state.permissions = Array.isArray(user?.permissions) ? user.permissions : [];
      state.roles = extractRoleSlugs(user);
      state.error = null;

      if (typeof window !== 'undefined') {
        if (state.token) localStorage.setItem('auth_token', state.token);
        if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.roles = [];
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    },
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(state.user));
      }
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setCredentials, logout, setUser, setAuthError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserPermissions = (state) => state.auth.permissions;
export const selectUserRoles = (state) => state.auth.roles;

export default authSlice.reducer;


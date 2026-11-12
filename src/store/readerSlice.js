import { createSlice } from '@reduxjs/toolkit';

const safeGetItem = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeParseJson = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialToken = safeGetItem('reader_token');
const initialReader = safeParseJson(safeGetItem('reader_user'));

const initialState = {
  token: initialToken,
  reader: initialReader,
  isAuthenticated: Boolean(initialToken && initialReader),
  roles: Array.isArray(initialReader?.roles) ? initialReader.roles : initialToken ? ['reader'] : [],
  error: null
};

export const readerSlice = createSlice({
  name: 'reader',
  initialState,
  reducers: {
    setReaderCredentials: (state, action) => {
      const payload = action.payload || {};
      const reader = payload.reader || payload.user || null;
      const token = payload.token || state.token;
      state.reader = reader;
      state.token = token;
      state.isAuthenticated = Boolean(token && reader);
      state.roles = Array.isArray(payload.roles)
        ? payload.roles
        : Array.isArray(reader?.roles)
        ? reader.roles
        : ['reader'];
      state.error = null;

      if (typeof window !== 'undefined') {
        if (token) localStorage.setItem('reader_token', token);
        if (reader) localStorage.setItem('reader_user', JSON.stringify(reader));
      }
    },
    setReaderProfile: (state, action) => {
      const incoming = action.payload?.reader || action.payload;
      if (!incoming) return;
      state.reader = { ...state.reader, ...incoming };
      state.isAuthenticated = Boolean(state.token && state.reader);
      if (typeof window !== 'undefined') {
        localStorage.setItem('reader_user', JSON.stringify(state.reader));
      }
    },
    readerLogout: (state) => {
      state.reader = null;
      state.token = null;
      state.isAuthenticated = false;
      state.roles = [];
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('reader_token');
        localStorage.removeItem('reader_user');
      }
    },
    setReaderAuthError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setReaderCredentials,
  setReaderProfile,
  readerLogout,
  setReaderAuthError
} = readerSlice.actions;

export const selectReaderUser = (state) => state.reader?.reader || null;
export const selectReaderToken = (state) => state.reader?.token || null;
export const selectIsReaderAuthenticated = (state) => Boolean(state.reader?.isAuthenticated);
export const selectReaderPreferences = (state) => state.reader?.reader?.preferences || {};

export default readerSlice.reducer;


import { createSlice } from '@reduxjs/toolkit';

const getInitialLanguage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('newsflow_language');
      if (saved === 'en' || saved === 'bn') return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'bn';
};

const getInitialTheme = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('newsflow_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'light';
};

const initialState = {
  language: getInitialLanguage(), // 'bn' | 'en'
  theme: getInitialTheme(), // 'light' | 'dark'
  fontSize: 'normal', // 'normal' | 'large'
  activeView: 'public', // 'public' | 'admin'
  searchModalOpen: false,
  epaperModalOpen: false,
  mobileDrawerOpen: false,
  edition: 'national', // 'national' | 'international'
  location: 'ঢাকা', // Dhaka
  weatherTemp: 26,
  weatherCondition: 'কুয়াশাচ্ছন্ন রোদ'
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('newsflow_language', action.payload);
        }
      } catch {
        // Ignore localStorage errors
      }
    },
    toggleLanguage: (state) => {
      const next = state.language === 'bn' ? 'en' : 'bn';
      state.language = next;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('newsflow_language', next);
        }
      } catch {
        // Ignore localStorage errors
      }
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    toggleFontSize: (state) => {
      state.fontSize = state.fontSize === 'normal' ? 'large' : 'normal';
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    setSearchModalOpen: (state, action) => {
      state.searchModalOpen = action.payload;
    },
    setEpaperModalOpen: (state, action) => {
      state.epaperModalOpen = action.payload;
    },
    setMobileDrawerOpen: (state, action) => {
      state.mobileDrawerOpen = action.payload;
    },
    setEdition: (state, action) => {
      state.edition = action.payload;
    },
    setTheme: (state, action) => {
      const next = action.payload === 'dark' ? 'dark' : 'light';
      state.theme = next;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('newsflow_theme', next);
        }
      } catch {
        // Ignore localStorage errors
      }
    },
    toggleTheme: (state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = next;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('newsflow_theme', next);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }
});

export const {
  setLanguage,
  toggleLanguage,
  setFontSize,
  toggleFontSize,
  setActiveView,
  setSearchModalOpen,
  setEpaperModalOpen,
  setMobileDrawerOpen,
  setEdition,
  setTheme,
  toggleTheme
} = uiSlice.actions;

export default uiSlice.reducer;

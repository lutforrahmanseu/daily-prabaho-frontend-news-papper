import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: 'bn', // 'bn' | 'en'
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
    },
    toggleLanguage: (state) => {
      state.language = state.language === 'bn' ? 'en' : 'bn';
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
  setEdition
} = uiSlice.actions;

export default uiSlice.reducer;

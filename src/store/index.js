import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi.js';
import authReducer from './authSlice.js';
import readerReducer from './readerSlice.js';
import newsReducer from './newsSlice.js';
import uiReducer from './uiSlice.js';
import adminReducer from './adminSlice.js';

// Export all API slices and hooks for centralized imports
export * from './api/baseApi.js';
export * from './api/authApi.js';
export * from './api/readerApi.js';
export * from './api/newsApi.js';
export * from './api/categoryApi.js';
export * from './api/tagApi.js';
export * from './api/userApi.js';
export * from './api/roleApi.js';
export * from './api/mediaApi.js';
export * from './api/workflowApi.js';
export * from './api/advertisementApi.js';
export * from './api/analyticsApi.js';
export * from './api/settingsApi.js';
export * from './api/reporterApi.js';
export * from './api/authorApi.js';
export * from './api/auditLogApi.js';
export * from './authSlice.js';
export * from './readerSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reader: readerReducer,
    news: newsReducer,
    ui: uiReducer,
    admin: adminReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(baseApi.middleware)
});

export default store;

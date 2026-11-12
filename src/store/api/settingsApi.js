import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePublicSettings } from '../../utils/apiNormalizer.js';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Public Settings (Site name, logo, favicon, contacts, social links)
    getPublicSettings: builder.query({
      query: () => 'settings/public',
      transformResponse: (response) => normalizePublicSettings(unwrapPayload(response)),
      providesTags: [{ type: 'Settings', id: 'PUBLIC' }]
    }),

    // 2. Get All Grouped Settings (Admin CMS)
    getAllSettings: builder.query({
      query: () => 'settings',
      transformResponse: (response) => {
        const grouped = unwrapPayload(response);
        return {
          grouped,
          normalized: normalizePublicSettings(grouped)
        };
      },
      providesTags: [{ type: 'Settings', id: 'ALL' }]
    }),

    // 3. Update Settings by Group
    updateSettings: builder.mutation({
      query: ({ settings, group }) => ({
        url: 'settings',
        method: 'POST',
        body: { settings, group }
      }),
      invalidatesTags: [
        { type: 'Settings', id: 'PUBLIC' },
        { type: 'Settings', id: 'ALL' }
      ]
    })
  })
});

export const {
  useGetPublicSettingsQuery,
  useGetAllSettingsQuery,
  useUpdateSettingsMutation
} = settingsApi;

export default settingsApi;

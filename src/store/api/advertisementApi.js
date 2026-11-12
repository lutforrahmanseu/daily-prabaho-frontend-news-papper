import { baseApi } from './baseApi.js';
import {
  unwrapPayload,
  normalizePaginated,
  normalizeAdvertisement
} from '../../utils/apiNormalizer.js';

export const advertisementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get All Advertisements (Admin CMS)
    getAdvertisements: builder.query({
      query: (params = {}) => ({
        url: 'advertisements',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeAdvertisement),
      providesTags: (result) => {
        const items = result?.items || result?.data || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Advertisement', id })), { type: 'Advertisement', id: 'LIST' }]
          : [{ type: 'Advertisement', id: 'LIST' }];
      }
    }),

    // 2. Get Public Ad by Placement Slot ('homepage_top', 'homepage_sidebar', etc.)
    getAdPlacement: builder.query({
      query: (placement) => `ads/placement/${placement}`,
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        if (!payload || (Array.isArray(payload) && payload.length === 0)) return null;
        return Array.isArray(payload)
          ? normalizeAdvertisement(payload[0])
          : normalizeAdvertisement(payload);
      },
      providesTags: (result, error, placement) => [{ type: 'Advertisement', id: placement }]
    }),

    // 3. Create Advertisement Campaign
    createAdvertisement: builder.mutation({
      query: (adData) => ({
        url: 'advertisements',
        method: 'POST',
        body: adData
      }),
      transformResponse: (response) => normalizeAdvertisement(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Advertisement', id: 'LIST' }]
    }),

    // 4. Update Advertisement
    updateAdvertisement: builder.mutation({
      query: ({ id, ...adData }) => ({
        url: `advertisements/${id}`,
        method: 'PUT',
        body: adData
      }),
      transformResponse: (response) => normalizeAdvertisement(unwrapPayload(response)),
      invalidatesTags: (result, error, { id, placement }) => [
        { type: 'Advertisement', id },
        { type: 'Advertisement', id: placement },
        { type: 'Advertisement', id: 'LIST' }
      ]
    }),

    // 5. Delete Advertisement
    deleteAdvertisement: builder.mutation({
      query: (id) => ({
        url: `advertisements/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Advertisement', id: 'LIST' }]
    }),

    // 6. Track Impression
    trackImpression: builder.mutation({
      query: (id) => ({
        url: `ads/${id}/impression`,
        method: 'POST'
      })
    }),

    // 7. Track Click
    trackClick: builder.mutation({
      query: (id) => ({
        url: `ads/${id}/click`,
        method: 'GET'
      })
    })
  })
});

export const {
  useGetAdvertisementsQuery,
  useGetAdPlacementQuery,
  useCreateAdvertisementMutation,
  useUpdateAdvertisementMutation,
  useDeleteAdvertisementMutation,
  useTrackImpressionMutation,
  useTrackClickMutation
} = advertisementApi;

export default advertisementApi;

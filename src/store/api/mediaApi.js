import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePaginated, normalizeMedia } from '../../utils/apiNormalizer.js';

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Paginated Media Assets
    getMediaList: builder.query({
      query: (params = {}) => ({
        url: 'media',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeMedia),
      providesTags: (result) => {
        const items = result?.items || result?.data || (Array.isArray(result) ? result : []);
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Media', id })), { type: 'Media', id: 'LIST' }]
          : [{ type: 'Media', id: 'LIST' }];
      }
    }),

    // 2. Upload Media File (Multipart/Form-Data) or External URL
    uploadMedia: builder.mutation({
      query: (payload) => ({
        url: 'media',
        method: 'POST',
        body: payload
      }),
      transformResponse: (response) => normalizeMedia(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }]
    }),

    // 3. Update Media Metadata (Alt text, caption, credit)
    updateMedia: builder.mutation({
      query: ({ id, ...metadata }) => ({
        url: `media/${id}`,
        method: 'PUT',
        body: metadata
      }),
      transformResponse: (response) => normalizeMedia(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Media', id },
        { type: 'Media', id: 'LIST' }
      ]
    }),

    // 4. Delete Media
    deleteMedia: builder.mutation({
      query: (id) => ({
        url: `media/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }]
    })
  })
});

export const {
  useGetMediaListQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation
} = mediaApi;

export default mediaApi;


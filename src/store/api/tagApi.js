import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePaginated, normalizeTag } from '../../utils/apiNormalizer.js';

export const tagApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get All Tags
    getTags: builder.query({
      query: (params = {}) => ({
        url: 'tags',
        params: { per_page: 100, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeTag),
      providesTags: (result) => {
        const items = result?.items || result?.data || (Array.isArray(result) ? result : []);
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Tag', id })), { type: 'Tag', id: 'LIST' }]
          : [{ type: 'Tag', id: 'LIST' }];
      }
    }),

    // 2. Get Trending Tags
    getTrendingTags: builder.query({
      query: () => 'tags/trending',
      transformResponse: (response) => {
        const data = unwrapPayload(response);
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        return list.map(normalizeTag);
      },
      providesTags: [{ type: 'Tag', id: 'TRENDING' }]
    }),

    // 3. Create Tag
    createTag: builder.mutation({
      query: (data) => ({
        url: 'tags',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => normalizeTag(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Tag', id: 'LIST' }, { type: 'Tag', id: 'TRENDING' }]
    }),

    // 4. Update Tag
    updateTag: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `tags/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response) => normalizeTag(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tag', id },
        { type: 'Tag', id: 'LIST' },
        { type: 'Tag', id: 'TRENDING' }
      ]
    }),

    // 5. Delete Tag
    deleteTag: builder.mutation({
      query: (id) => ({
        url: `tags/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Tag', id: 'LIST' }]
    })
  })
});

export const {
  useGetTagsQuery,
  useGetTrendingTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation
} = tagApi;

export default tagApi;


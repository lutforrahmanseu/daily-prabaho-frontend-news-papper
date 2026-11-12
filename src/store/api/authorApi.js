import { baseApi } from './baseApi.js';
import {
  unwrapPayload,
  normalizePaginated,
  normalizeAuthor
} from '../../utils/apiNormalizer.js';

export const authorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuthors: builder.query({
      query: (params = {}) => ({
        url: 'authors',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeAuthor),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Author', id })), { type: 'Author', id: 'LIST' }]
          : [{ type: 'Author', id: 'LIST' }];
      }
    }),

    getAuthorBySlug: builder.query({
      query: (slugOrId) => `authors/${slugOrId}`,
      transformResponse: (response) => normalizeAuthor(unwrapPayload(response)),
      providesTags: (result, error, slugOrId) => [{ type: 'Author', id: slugOrId }]
    }),

    createAuthor: builder.mutation({
      query: (data) => ({
        url: 'authors',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => normalizeAuthor(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Author', id: 'LIST' }]
    }),

    updateAuthor: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `authors/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response) => normalizeAuthor(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Author', id },
        { type: 'Author', id: 'LIST' }
      ]
    }),

    deleteAuthor: builder.mutation({
      query: (id) => ({
        url: `authors/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Author', id: 'LIST' }]
    })
  })
});

export const {
  useGetAuthorsQuery,
  useGetAuthorBySlugQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation
} = authorApi;

export default authorApi;


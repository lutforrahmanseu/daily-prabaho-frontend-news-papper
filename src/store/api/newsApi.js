import { baseApi } from './baseApi.js';
import {
  unwrapPayload,
  normalizePaginated,
  normalizeArticle
} from '../../utils/apiNormalizer.js';

export const newsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Public News Feed (with search, category, subcategory, tag, author, date, pagination)
    getNewsList: builder.query({
      query: (params = {}) => ({
        url: 'news',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeArticle),
      providesTags: (result) => {
        const items = result?.items || result?.data || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'News', id })), { type: 'News', id: 'LIST' }]
          : [{ type: 'News', id: 'LIST' }];
      }
    }),

    // 2. Admin News Feed (all statuses: draft, submitted, under_review, approved, returned, rejected, scheduled, published)
    getAdminNewsList: builder.query({
      query: (params = {}) => ({
        url: 'admin/news',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeArticle),
      providesTags: (result) => {
        const items = result?.items || result?.data || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'News', id })), { type: 'News', id: 'ADMIN_LIST' }]
          : [{ type: 'News', id: 'ADMIN_LIST' }];
      }
    }),

    // 2b. Single Admin Article by ID or Slug
    getAdminNewsById: builder.query({
      query: (idOrSlug) => `admin/news/${idOrSlug}`,
      transformResponse: (response) => normalizeArticle(unwrapPayload(response)),
      providesTags: (result, error, idOrSlug) => [{ type: 'News', id: idOrSlug }]
    }),

    // 3. Single Public Article by Slug or ID
    getNewsBySlug: builder.query({
      query: (slug) => `news/${slug}`,
      transformResponse: (response) => normalizeArticle(unwrapPayload(response)),
      providesTags: (result, error, slug) => [{ type: 'News', id: slug }]
    }),

    // 4. Breaking News Ticker
    getBreakingNews: builder.query({
      query: (params = {}) => ({
        url: 'news/breaking',
        params
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeArticle);
      },
      providesTags: [{ type: 'News', id: 'BREAKING' }]
    }),

    // 5. Featured Lead Stories
    getFeaturedNews: builder.query({
      query: (params = {}) => ({
        url: 'news/featured',
        params
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeArticle);
      },
      providesTags: [{ type: 'News', id: 'FEATURED' }]
    }),

    // 6. Most Popular News
    getPopularNews: builder.query({
      query: (params = {}) => ({
        url: 'news/popular',
        params
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeArticle);
      },
      providesTags: [{ type: 'News', id: 'POPULAR' }]
    }),

    // 7. Related News for an Article
    getRelatedNews: builder.query({
      query: (id) => `news/${id}/related`,
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeArticle);
      }
    }),

    // 8. Create Article (News CRUD)
    createNews: builder.mutation({
      query: (articleData) => ({
        url: 'news',
        method: 'POST',
        body: articleData
      }),
      transformResponse: (response) => normalizeArticle(unwrapPayload(response)),
      invalidatesTags: [
        { type: 'News', id: 'LIST' },
        { type: 'News', id: 'ADMIN_LIST' },
        { type: 'News', id: 'BREAKING' },
        { type: 'News', id: 'FEATURED' },
        'Analytics'
      ]
    }),

    // 9. Update Article (News CRUD)
    updateNews: builder.mutation({
      query: ({ id, ...articleData }) => ({
        url: `news/${id}`,
        method: 'PUT',
        body: articleData
      }),
      transformResponse: (response) => normalizeArticle(unwrapPayload(response)),
      invalidatesTags: (result, error, { id, slug }) => [
        { type: 'News', id },
        { type: 'News', id: slug },
        { type: 'News', id: 'LIST' },
        { type: 'News', id: 'ADMIN_LIST' },
        { type: 'News', id: 'BREAKING' },
        { type: 'News', id: 'FEATURED' },
        'Revision',
        'Workflow'
      ]
    }),

    // 10. Delete Article (News CRUD)
    deleteNews: builder.mutation({
      query: (id) => ({
        url: `news/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'News', id: 'LIST' },
        { type: 'News', id: 'ADMIN_LIST' },
        { type: 'News', id: 'BREAKING' },
        { type: 'News', id: 'FEATURED' },
        'Analytics'
      ]
    })
  })
});

export const {
  useGetNewsListQuery,
  useGetAdminNewsListQuery,
  useGetAdminNewsByIdQuery,
  useGetNewsBySlugQuery,
  useGetBreakingNewsQuery,
  useGetFeaturedNewsQuery,
  useGetPopularNewsQuery,
  useGetRelatedNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation
} = newsApi;

export default newsApi;

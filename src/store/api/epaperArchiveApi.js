import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePaginated, normalizeArticle } from '../../utils/apiNormalizer.js';
import { normalizeEpaperEdition, normalizeEpaperPage } from '../../utils/epaperHelpers.js';

export const epaperArchiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================================
    // Public E-Paper Reader & Historical Search
    // ==============================================
    getPublicEpaperList: builder.query({
      query: (params = {}) => ({
        url: 'epaper/editions',
        params: { per_page: 12, ...params }
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response) || {};
        return {
          items: Array.isArray(payload.items) ? payload.items.map(normalizeEpaperEdition) : [],
          facets: payload.facets || { available_dates: [], years: [], editions: [] },
          pagination: payload.pagination || { current_page: 1, last_page: 1, per_page: 12, total: 0 }
        };
      },
      providesTags: [{ type: 'EpaperEdition', id: 'PUBLIC_LIST' }]
    }),

    getPublicEpaperByDate: builder.query({
      query: ({ date = '', edition_code = '' } = {}) => ({
        url: date ? `epaper/by-date/${date}` : 'epaper/by-date',
        params: edition_code ? { edition_code } : undefined
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response) || {};
        return {
          date: payload.date || '',
          selected: payload.selected ? normalizeEpaperEdition(payload.selected) : null,
          available_editions: Array.isArray(payload.available_editions)
            ? payload.available_editions.map(normalizeEpaperEdition)
            : [],
          facets: payload.facets || { available_dates: [], years: [], editions: [] }
        };
      },
      providesTags: (result, error, arg) => [{ type: 'EpaperEdition', id: `DATE_${arg?.date || 'LATEST'}` }]
    }),

    getPublicEpaperEdition: builder.query({
      query: (idOrSlug) => `epaper/editions/${idOrSlug}`,
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      providesTags: (result, error, idOrSlug) => [{ type: 'EpaperEdition', id: idOrSlug }]
    }),

    issueEpaperAccessGrant: builder.mutation({
      query: ({ editionId, purpose = 'preview', page_id = null }) => ({
        url: `epaper/editions/${editionId}/access-grant`,
        method: 'POST',
        body: { purpose, page_id }
      }),
      transformResponse: (response) => unwrapPayload(response)
    }),

    // ==============================================
    // Public Multi-Dimensional News Archive
    // ==============================================
    getNewsArchive: builder.query({
      query: (params = {}) => ({
        url: 'archive/news',
        params: { per_page: 12, ...params }
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response) || {};
        const normalized = normalizePaginated(response, normalizeArticle);
        return {
          items: normalized.items,
          pagination: normalized.pagination,
          facets: payload.facets || { years: [], months: [], categories: [], authors: [], topics: [] },
          matching_epapers: Array.isArray(payload.matching_epapers)
            ? payload.matching_epapers.map(normalizeEpaperEdition)
            : [],
          applied_filters: payload.applied_filters || {}
        };
      },
      providesTags: [{ type: 'ArchiveNews', id: 'LIST' }]
    }),

    // ==============================================
    // Admin E-Paper Management CMS
    // ==============================================
    getAdminEpaperList: builder.query({
      query: (params = {}) => ({
        url: 'admin/epaper/editions',
        params: { per_page: 15, ...params }
      }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response) || {};
        return {
          summary: payload.summary || {},
          items: Array.isArray(payload.items) ? payload.items.map(normalizeEpaperEdition) : [],
          pagination: payload.pagination || { current_page: 1, last_page: 1, per_page: 15, total: 0 }
        };
      },
      providesTags: [{ type: 'EpaperEdition', id: 'ADMIN_LIST' }]
    }),

    getAdminEpaperEdition: builder.query({
      query: (id) => `admin/epaper/editions/${id}`,
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      providesTags: (result, error, id) => [{ type: 'EpaperEdition', id }]
    }),

    createAdminEpaperEdition: builder.mutation({
      query: (formDataOrJson) => ({
        url: 'admin/epaper/editions',
        method: 'POST',
        body: formDataOrJson
      }),
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      invalidatesTags: [
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' },
        { type: 'EpaperEdition', id: 'DATE_LATEST' }
      ]
    }),

    updateAdminEpaperEdition: builder.mutation({
      query: ({ id, body }) => ({
        url: `admin/epaper/editions/${id}`,
        method: body instanceof FormData ? 'POST' : 'PUT',
        body
      }),
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'EpaperEdition', id },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' },
        { type: 'EpaperEdition', id: 'DATE_LATEST' }
      ]
    }),

    uploadAdminEpaperMasterPdf: builder.mutation({
      query: ({ editionId, formData }) => ({
        url: `admin/epaper/editions/${editionId}/upload-pdf`,
        method: 'POST',
        body: formData
      }),
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      invalidatesTags: (result, error, { editionId }) => [
        { type: 'EpaperEdition', id: editionId },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' },
        { type: 'EpaperEdition', id: 'DATE_LATEST' }
      ]
    }),

    transitionAdminEpaperEdition: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/epaper/editions/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => normalizeEpaperEdition(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'EpaperEdition', id },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' },
        { type: 'EpaperEdition', id: 'DATE_LATEST' }
      ]
    }),

    deleteAdminEpaperEdition: builder.mutation({
      query: (id) => ({
        url: `admin/epaper/editions/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' },
        { type: 'EpaperEdition', id: 'DATE_LATEST' }
      ]
    }),

    createAdminEpaperPage: builder.mutation({
      query: ({ editionId, body }) => ({
        url: `admin/epaper/editions/${editionId}/pages`,
        method: 'POST',
        body
      }),
      transformResponse: (response) => normalizeEpaperPage(unwrapPayload(response)),
      invalidatesTags: (result, error, { editionId }) => [
        { type: 'EpaperEdition', id: editionId },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' }
      ]
    }),

    updateAdminEpaperPage: builder.mutation({
      query: ({ editionId, pageId, body }) => ({
        url: `admin/epaper/editions/${editionId}/pages/${pageId}`,
        method: body instanceof FormData ? 'POST' : 'PUT',
        body
      }),
      transformResponse: (response) => normalizeEpaperPage(unwrapPayload(response)),
      invalidatesTags: (result, error, { editionId }) => [
        { type: 'EpaperEdition', id: editionId },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' }
      ]
    }),

    reorderAdminEpaperPages: builder.mutation({
      query: ({ editionId, page_ids }) => ({
        url: `admin/epaper/editions/${editionId}/pages/reorder`,
        method: 'POST',
        body: { page_ids }
      }),
      invalidatesTags: (result, error, { editionId }) => [
        { type: 'EpaperEdition', id: editionId },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' }
      ]
    }),

    deleteAdminEpaperPage: builder.mutation({
      query: ({ editionId, pageId }) => ({
        url: `admin/epaper/editions/${editionId}/pages/${pageId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { editionId }) => [
        { type: 'EpaperEdition', id: editionId },
        { type: 'EpaperEdition', id: 'ADMIN_LIST' },
        { type: 'EpaperEdition', id: 'PUBLIC_LIST' }
      ]
    }),

    getAdminEpaperSubscribers: builder.query({
      query: () => 'admin/epaper/subscribers',
      transformResponse: (response) => unwrapPayload(response)?.items || [],
      providesTags: [{ type: 'User', id: 'EPAPER_SUBSCRIBERS' }]
    }),

    updateAdminEpaperSubscriberTier: builder.mutation({
      query: ({ userId, subscription_tier, subscription_expires_at = null }) => ({
        url: `admin/epaper/subscribers/${userId}/tier`,
        method: 'POST',
        body: { subscription_tier, subscription_expires_at }
      }),
      invalidatesTags: [{ type: 'User', id: 'EPAPER_SUBSCRIBERS' }]
    })
  })
});

export const {
  useGetPublicEpaperListQuery,
  useGetPublicEpaperByDateQuery,
  useGetPublicEpaperEditionQuery,
  useIssueEpaperAccessGrantMutation,
  useGetNewsArchiveQuery,
  useGetAdminEpaperListQuery,
  useGetAdminEpaperEditionQuery,
  useCreateAdminEpaperEditionMutation,
  useUpdateAdminEpaperEditionMutation,
  useUploadAdminEpaperMasterPdfMutation,
  useTransitionAdminEpaperEditionMutation,
  useDeleteAdminEpaperEditionMutation,
  useCreateAdminEpaperPageMutation,
  useUpdateAdminEpaperPageMutation,
  useReorderAdminEpaperPagesMutation,
  useDeleteAdminEpaperPageMutation,
  useGetAdminEpaperSubscribersQuery,
  useUpdateAdminEpaperSubscriberTierMutation
} = epaperArchiveApi;

export default epaperArchiveApi;


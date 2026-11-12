import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizeArticle, normalizePaginated } from '../../utils/apiNormalizer.js';

export const hyperlocalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public Hyperlocal Discovery
    getGeoTree: builder.query({
      query: () => '/hyperlocal/tree',
      transformResponse: (res) => unwrapPayload(res) || [],
      providesTags: [{ type: 'GeoLocation', id: 'TREE' }]
    }),
    getGeoLocations: builder.query({
      query: (params = {}) => ({ url: '/hyperlocal/locations', params }),
      transformResponse: (res) => unwrapPayload(res) || [],
      providesTags: [{ type: 'GeoLocation', id: 'LIST' }]
    }),
    getHyperlocalFeed: builder.query({
      query: (params = {}) => ({ url: '/hyperlocal/feed', params }),
      transformResponse: (res) => normalizePaginated(res, normalizeArticle),
      providesTags: [{ type: 'HyperlocalArticle', id: 'FEED' }]
    }),
    getLocalTrending: builder.query({
      query: (params = {}) => ({ url: '/hyperlocal/trending', params }),
      transformResponse: (res) => (unwrapPayload(res) || []).map(normalizeArticle),
      providesTags: [{ type: 'HyperlocalArticle', id: 'TRENDING' }]
    }),
    getDivisionPage: builder.query({
      query: ({ identifier, ...params }) => ({ url: `/hyperlocal/divisions/${identifier}`, params }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          ...data,
          items: Array.isArray(data.items) ? data.items.map(normalizeArticle) : [],
          trending: Array.isArray(data.trending) ? data.trending.map(normalizeArticle) : []
        };
      },
      providesTags: [{ type: 'HyperlocalArticle', id: 'LOCATION_PAGE' }]
    }),
    getDistrictPage: builder.query({
      query: ({ identifier, ...params }) => ({ url: `/hyperlocal/districts/${identifier}`, params }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          ...data,
          items: Array.isArray(data.items) ? data.items.map(normalizeArticle) : [],
          trending: Array.isArray(data.trending) ? data.trending.map(normalizeArticle) : []
        };
      },
      providesTags: [{ type: 'HyperlocalArticle', id: 'LOCATION_PAGE' }]
    }),
    getUpazilaPage: builder.query({
      query: ({ identifier, ...params }) => ({ url: `/hyperlocal/upazilas/${identifier}`, params }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          ...data,
          items: Array.isArray(data.items) ? data.items.map(normalizeArticle) : [],
          trending: Array.isArray(data.trending) ? data.trending.map(normalizeArticle) : []
        };
      },
      providesTags: [{ type: 'HyperlocalArticle', id: 'LOCATION_PAGE' }]
    }),
    getPublicCorrespondents: builder.query({
      query: (params = {}) => ({ url: '/hyperlocal/correspondents', params }),
      transformResponse: (res) => normalizePaginated(res),
      providesTags: [{ type: 'LocalCorrespondent', id: 'PUBLIC' }]
    }),

    // Authenticated Reader Privacy-Safe Hyperlocal Experience
    getReaderHyperlocalFeed: builder.query({
      query: (params = {}) => ({ url: '/reader/hyperlocal/feed', params }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          ...data,
          items: Array.isArray(data.items) ? data.items.map(normalizeArticle) : [],
          broader_district_items: Array.isArray(data.broader_district_items)
            ? data.broader_district_items.map(normalizeArticle)
            : []
        };
      },
      providesTags: [{ type: 'HyperlocalArticle', id: 'READER_FEED' }]
    }),
    updateReaderHyperlocalPreferences: builder.mutation({
      query: (body) => ({
        url: '/reader/hyperlocal/preferences',
        method: 'PUT',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [{ type: 'HyperlocalArticle', id: 'READER_FEED' }, 'Reader']
    }),

    // Admin & Editorial Hyperlocal Network
    getAdminGeoLocations: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/locations', params }),
      transformResponse: (res) => unwrapPayload(res) || [],
      providesTags: [{ type: 'GeoLocation', id: 'ADMIN_LIST' }]
    }),
    createGeoLocation: builder.mutation({
      query: (body) => ({
        url: '/admin/hyperlocal/locations',
        method: 'POST',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'GeoLocation', id: 'ADMIN_LIST' },
        { type: 'GeoLocation', id: 'LIST' },
        { type: 'GeoLocation', id: 'TREE' }
      ]
    }),
    updateGeoLocation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hyperlocal/locations/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'GeoLocation', id: 'ADMIN_LIST' },
        { type: 'GeoLocation', id: 'LIST' },
        { type: 'GeoLocation', id: 'TREE' }
      ]
    }),
    getAdminCorrespondents: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/correspondents', params }),
      transformResponse: (res) => normalizePaginated(res),
      providesTags: [{ type: 'LocalCorrespondent', id: 'ADMIN' }]
    }),
    createCorrespondent: builder.mutation({
      query: (body) => ({
        url: '/admin/hyperlocal/correspondents',
        method: 'POST',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'LocalCorrespondent', id: 'ADMIN' },
        { type: 'LocalCorrespondent', id: 'PUBLIC' },
        { type: 'HyperlocalAnalytics', id: 'OVERVIEW' }
      ]
    }),
    updateCorrespondent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hyperlocal/correspondents/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'LocalCorrespondent', id: 'ADMIN' },
        { type: 'LocalCorrespondent', id: 'PUBLIC' }
      ]
    }),
    verifyCorrespondent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hyperlocal/correspondents/${id}/verify`,
        method: 'POST',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'LocalCorrespondent', id: 'ADMIN' },
        { type: 'LocalCorrespondent', id: 'PUBLIC' },
        { type: 'HyperlocalAnalytics', id: 'OVERVIEW' }
      ]
    }),
    assignCorrespondentCoverage: builder.mutation({
      query: ({ id, coverage_areas }) => ({
        url: `/admin/hyperlocal/correspondents/${id}/coverage`,
        method: 'PUT',
        body: { coverage_areas }
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [
        { type: 'LocalCorrespondent', id: 'ADMIN' },
        { type: 'LocalCorrespondent', id: 'PUBLIC' },
        { type: 'HyperlocalAnalytics', id: 'OVERVIEW' }
      ]
    }),
    getHyperlocalAssignments: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/assignments', params }),
      transformResponse: (res) => normalizePaginated(res),
      providesTags: [{ type: 'HyperlocalAssignment', id: 'LIST' }]
    }),
    createHyperlocalAssignment: builder.mutation({
      query: (body) => ({
        url: '/admin/hyperlocal/assignments',
        method: 'POST',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [{ type: 'HyperlocalAssignment', id: 'LIST' }]
    }),
    updateHyperlocalAssignment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hyperlocal/assignments/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrapPayload,
      invalidatesTags: [{ type: 'HyperlocalAssignment', id: 'LIST' }]
    }),
    getRegionalApprovalQueue: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/approvals', params }),
      transformResponse: (res) => normalizePaginated(res, normalizeArticle),
      providesTags: [{ type: 'HyperlocalArticle', id: 'APPROVAL_QUEUE' }]
    }),
    reviewRegionalStory: builder.mutation({
      query: ({ newsId, ...body }) => ({
        url: `/admin/hyperlocal/approvals/${newsId}/review`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => normalizeArticle(unwrapPayload(res)),
      invalidatesTags: [
        { type: 'HyperlocalArticle', id: 'APPROVAL_QUEUE' },
        { type: 'HyperlocalArticle', id: 'FEED' },
        { type: 'HyperlocalAnalytics', id: 'OVERVIEW' },
        'News'
      ]
    }),
    getCorrespondentPerformance: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/performance', params }),
      transformResponse: (res) => unwrapPayload(res) || [],
      providesTags: [{ type: 'LocalCorrespondent', id: 'PERFORMANCE' }]
    }),
    getHyperlocalAnalytics: builder.query({
      query: (params = {}) => ({ url: '/admin/hyperlocal/analytics', params }),
      transformResponse: (res) => unwrapPayload(res) || {},
      providesTags: [{ type: 'HyperlocalAnalytics', id: 'OVERVIEW' }]
    })
  })
});

export const {
  useGetGeoTreeQuery,
  useGetGeoLocationsQuery,
  useGetHyperlocalFeedQuery,
  useGetLocalTrendingQuery,
  useGetDivisionPageQuery,
  useGetDistrictPageQuery,
  useGetUpazilaPageQuery,
  useGetPublicCorrespondentsQuery,
  useGetReaderHyperlocalFeedQuery,
  useUpdateReaderHyperlocalPreferencesMutation,
  useGetAdminGeoLocationsQuery,
  useCreateGeoLocationMutation,
  useUpdateGeoLocationMutation,
  useGetAdminCorrespondentsQuery,
  useCreateCorrespondentMutation,
  useUpdateCorrespondentMutation,
  useVerifyCorrespondentMutation,
  useAssignCorrespondentCoverageMutation,
  useGetHyperlocalAssignmentsQuery,
  useCreateHyperlocalAssignmentMutation,
  useUpdateHyperlocalAssignmentMutation,
  useGetRegionalApprovalQueueQuery,
  useReviewRegionalStoryMutation,
  useGetCorrespondentPerformanceQuery,
  useGetHyperlocalAnalyticsQuery
} = hyperlocalApi;


import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizeArticle } from '../../utils/apiNormalizer.js';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewAnalytics: builder.query({
      query: (params = {}) => ({ url: 'analytics/overview', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Analytics', id: 'OVERVIEW' }]
    }),
    getRealtimeAnalytics: builder.query({
      query: () => 'analytics/realtime',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Analytics', id: 'REALTIME' }]
    }),
    getTopStories: builder.query({
      query: (params = {}) => ({ url: 'analytics/top-stories', params }),
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeArticle);
      },
      providesTags: [{ type: 'Analytics', id: 'TOP_STORIES' }]
    }),

    // Phase 24: Privacy-First Telemetry & Public Experiment Delivery
    collectAnalyticsTelemetry: builder.mutation({
      query: (body) => ({
        url: 'analytics/telemetry',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response)
    }),
    getActiveExperiments: builder.query({
      query: (params = {}) => ({ url: 'analytics/experiments/active', params }),
      transformResponse: (response) => unwrapPayload(response)
    }),
    trackExperimentEvent: builder.mutation({
      query: ({ experimentId, ...body }) => ({
        url: `analytics/experiments/${experimentId}/track`,
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response)
    }),

    // Phase 24: Advanced Publisher, Editorial & Monetization Analytics
    getAdvancedDashboard: builder.query({
      query: (params = {}) => ({ url: 'analytics/advanced/dashboard', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'AdvancedAnalytics', id: 'DASHBOARD' }]
    }),
    getAudienceAnalytics: builder.query({
      query: (params = {}) => ({ url: 'analytics/advanced/audience', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'AdvancedAnalytics', id: 'AUDIENCE' }]
    }),
    getEditorialAnalytics: builder.query({
      query: (params = {}) => ({ url: 'analytics/advanced/editorial', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'AdvancedAnalytics', id: 'EDITORIAL' }]
    }),
    getRevenueAnalytics: builder.query({
      query: (params = {}) => ({ url: 'analytics/advanced/revenue', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'AdvancedAnalytics', id: 'REVENUE' }]
    }),

    // Phase 24: Experimentation Studio
    getExperimentsList: builder.query({
      query: (params = {}) => ({ url: 'analytics/advanced/experiments', params }),
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'AnalyticsExperiment', id: 'LIST' }]
    }),
    createExperiment: builder.mutation({
      query: (body) => ({
        url: 'analytics/advanced/experiments',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'AnalyticsExperiment', id: 'LIST' }]
    }),
    updateExperimentStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `analytics/advanced/experiments/${id}/status`,
        method: 'PATCH',
        body: { status }
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'AnalyticsExperiment', id: 'LIST' }]
    }),
    declareExperimentWinner: builder.mutation({
      query: ({ id, variant_id, apply_to_target = false }) => ({
        url: `analytics/advanced/experiments/${id}/declare-winner`,
        method: 'POST',
        body: { variant_id, apply_to_target }
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [
        { type: 'AnalyticsExperiment', id: 'LIST' },
        { type: 'AdvancedAnalytics', id: 'EDITORIAL' },
        { type: 'News', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetOverviewAnalyticsQuery,
  useGetRealtimeAnalyticsQuery,
  useGetTopStoriesQuery,
  useCollectAnalyticsTelemetryMutation,
  useGetActiveExperimentsQuery,
  useTrackExperimentEventMutation,
  useGetAdvancedDashboardQuery,
  useGetAudienceAnalyticsQuery,
  useGetEditorialAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
  useGetExperimentsListQuery,
  useCreateExperimentMutation,
  useUpdateExperimentStatusMutation,
  useDeclareExperimentWinnerMutation
} = analyticsApi;

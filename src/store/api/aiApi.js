import { baseApi } from './baseApi.js';

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiOverview: builder.query({
      query: () => '/ai/overview',
      transformResponse: (res) => res?.data || res,
      providesTags: ['AiOverview']
    }),

    runAiAssist: builder.mutation({
      query: ({ feature, ...payload }) => ({
        url: `/ai/assist/${feature}`,
        method: 'POST',
        body: payload
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AiGeneration', 'AiUsageLog', 'AiOverview']
    }),

    getAiGenerations: builder.query({
      query: (params = {}) => ({ url: '/ai/generations', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['AiGeneration']
    }),

    getAiGenerationDetail: builder.query({
      query: (id) => `/ai/generations/${id}`,
      transformResponse: (res) => res?.data || res,
      providesTags: (_res, _err, id) => [{ type: 'AiGeneration', id }]
    }),

    applyAiGeneration: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ai/generations/${id}/apply`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AiGeneration', 'AiModification', 'News', 'Revision', 'Media', 'PodcastSeries', 'MultimediaItem']
    }),

    rejectAiGeneration: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/ai/generations/${id}/reject`,
        method: 'POST',
        body: { reason }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AiGeneration']
    }),

    getNewsAiProvenance: builder.query({
      query: (newsId) => `/ai/news/${newsId}/provenance`,
      transformResponse: (res) => res?.data || res,
      providesTags: (_res, _err, newsId) => [{ type: 'AiModification', id: `news-${newsId}` }]
    }),

    revertAiModification: builder.mutation({
      query: (modificationId) => ({
        url: `/ai/modifications/${modificationId}/revert`,
        method: 'POST',
        body: {}
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AiModification', 'News', 'Revision', 'Media', 'PodcastSeries', 'MultimediaItem']
    }),

    getAiUsageLogs: builder.query({
      query: (params = {}) => ({ url: '/ai/logs', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {}, analytics: {} },
      providesTags: ['AiUsageLog']
    }),

    getAiSettings: builder.query({
      query: () => '/ai/settings',
      transformResponse: (res) => res?.data || res,
      providesTags: ['AiSettings']
    }),

    updateAiSettings: builder.mutation({
      query: (body) => ({
        url: '/ai/settings',
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AiSettings', 'AiOverview', 'AuditLog']
    })
  }),
  overrideExisting: false
});

export const {
  useGetAiOverviewQuery,
  useRunAiAssistMutation,
  useGetAiGenerationsQuery,
  useGetAiGenerationDetailQuery,
  useApplyAiGenerationMutation,
  useRejectAiGenerationMutation,
  useGetNewsAiProvenanceQuery,
  useRevertAiModificationMutation,
  useGetAiUsageLogsQuery,
  useGetAiSettingsQuery,
  useUpdateAiSettingsMutation
} = aiApi;


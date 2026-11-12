import { baseApi } from './baseApi.js';
import { unwrapPayload } from '../../utils/apiNormalizer.js';

export const reliabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHealth: builder.query({
      query: () => 'health',
      providesTags: [{ type: 'Reliability', id: 'HEALTH' }]
    }),

    getReliabilityOverview: builder.query({
      query: () => 'admin/reliability/overview',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Reliability', id: 'OVERVIEW' }]
    }),

    getReliabilityQueues: builder.query({
      query: () => 'admin/reliability/queues',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Reliability', id: 'QUEUES' }]
    }),

    retryAllFailedJobs: builder.mutation({
      query: () => ({
        url: 'admin/reliability/jobs/retry-failed',
        method: 'POST'
      }),
      invalidatesTags: ['Reliability']
    }),

    retryFailedJob: builder.mutation({
      query: (id) => ({
        url: `admin/reliability/jobs/${encodeURIComponent(id)}/retry`,
        method: 'POST'
      }),
      invalidatesTags: ['Reliability']
    }),

    flushFailedJobs: builder.mutation({
      query: () => ({
        url: 'admin/reliability/jobs/flush-failed',
        method: 'POST'
      }),
      invalidatesTags: ['Reliability']
    }),

    warmReliabilityCache: builder.mutation({
      query: () => ({
        url: 'admin/reliability/cache/warm',
        method: 'POST'
      }),
      invalidatesTags: ['Reliability']
    }),

    verifyAuditChain: builder.query({
      query: () => 'admin/reliability/audit/verify',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Reliability', id: 'AUDIT_CHAIN' }]
    }),

    getReliabilityBackups: builder.query({
      query: () => 'admin/reliability/backups',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Reliability', id: 'BACKUPS' }]
    }),

    runReliabilityBackup: builder.mutation({
      query: () => ({
        url: 'admin/reliability/backups/verify',
        method: 'POST'
      }),
      invalidatesTags: ['Reliability']
    })
  })
});

export const {
  useGetPublicHealthQuery,
  useGetReliabilityOverviewQuery,
  useGetReliabilityQueuesQuery,
  useRetryAllFailedJobsMutation,
  useRetryFailedJobMutation,
  useFlushFailedJobsMutation,
  useWarmReliabilityCacheMutation,
  useLazyVerifyAuditChainQuery,
  useGetReliabilityBackupsQuery,
  useRunReliabilityBackupMutation
} = reliabilityApi;


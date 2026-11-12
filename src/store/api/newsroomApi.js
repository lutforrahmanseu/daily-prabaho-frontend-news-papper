import { baseApi } from './baseApi.js';

const unwrapPaginated = (res, extraKeys = []) => {
  const payload = res?.data ?? res ?? {};
  const result = {
    items: Array.isArray(payload.items) ? payload.items : (Array.isArray(payload) ? payload : []),
    meta: payload.meta || payload.pagination || { current_page: 1, last_page: 1, per_page: 20, total: 0 }
  };
  extraKeys.forEach((key) => {
    if (key in payload) {
      result[key] = payload[key];
    }
  });
  return result;
};

export const newsroomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard Overview
    getNewsroomDashboard: builder.query({
      query: () => '/newsroom/dashboard',
      transformResponse: (res) => res?.data ?? res ?? {},
      providesTags: ['Assignment', 'Planning', 'Availability', 'Correction', 'Embargo', 'Source', 'Notification']
    }),

    // 1. Assignments
    getAssignments: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/assignments',
        params
      }),
      transformResponse: (res) => unwrapPaginated(res),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Assignment', id })),
              { type: 'Assignment', id: 'LIST' }
            ]
          : [{ type: 'Assignment', id: 'LIST' }]
    }),

    getAssignmentDetail: builder.query({
      query: (id) => `/newsroom/assignments/${id}`,
      transformResponse: (res) => res?.data ?? res ?? null,
      providesTags: (result, error, id) => [{ type: 'Assignment', id }, 'Communication']
    }),

    createAssignment: builder.mutation({
      query: (body) => ({
        url: '/newsroom/assignments',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }, 'Planning', 'Notification']
    }),

    updateAssignment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/assignments/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
        'Planning',
        'Notification'
      ]
    }),

    transitionAssignmentStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/assignments/${id}/status`,
        method: 'PATCH',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
        'Planning',
        'Notification'
      ]
    }),

    startAssignmentDraft: builder.mutation({
      query: (id) => ({
        url: `/newsroom/assignments/${id}/start-draft`,
        method: 'POST'
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, id) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
        'News'
      ]
    }),

    deleteAssignment: builder.mutation({
      query: (id) => ({
        url: `/newsroom/assignments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }, 'Planning']
    }),

    // 2. Newsroom Planning & Availability
    getNewsroomCalendar: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/calendar',
        params
      }),
      transformResponse: (res) => res?.data ?? res ?? {},
      providesTags: ['Planning', 'Assignment', 'Availability', 'News']
    }),

    getEditorialPlans: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/plans',
        params
      }),
      transformResponse: (res) => unwrapPaginated(res),
      providesTags: ['Planning']
    }),

    createEditorialPlan: builder.mutation({
      query: (body) => ({
        url: '/newsroom/plans',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Planning']
    }),

    updateEditorialPlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/plans/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Planning']
    }),

    deleteEditorialPlan: builder.mutation({
      query: (id) => ({
        url: `/newsroom/plans/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Planning']
    }),

    getReporterAvailabilities: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/availabilities',
        params
      }),
      transformResponse: (res) => res?.data ?? res ?? {},
      providesTags: ['Availability']
    }),

    upsertReporterAvailability: builder.mutation({
      query: (body) => ({
        url: '/newsroom/availabilities',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Availability', 'Planning']
    }),

    // 3. Editorial Communication
    getEditorialCommunications: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/communications',
        params
      }),
      transformResponse: (res) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])),
      providesTags: ['Communication']
    }),

    createEditorialCommunication: builder.mutation({
      query: (body) => ({
        url: '/newsroom/communications',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, body) => [
        'Communication',
        'Notification',
        ...(body?.assignment_id ? [{ type: 'Assignment', id: body.assignment_id }] : [])
      ]
    }),

    resolveEditorialCommunication: builder.mutation({
      query: ({ id, is_resolved = true }) => ({
        url: `/newsroom/communications/${id}/resolve`,
        method: 'PATCH',
        body: { is_resolved }
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Communication']
    }),

    // 4. Sources
    getNewsSources: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/sources',
        params
      }),
      transformResponse: (res) => unwrapPaginated(res, ['can_view_confidential']),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Source', id })),
              { type: 'Source', id: 'LIST' }
            ]
          : [{ type: 'Source', id: 'LIST' }]
    }),

    getNewsSourceDetail: builder.query({
      query: (id) => `/newsroom/sources/${id}`,
      transformResponse: (res) => res?.data ?? res ?? null,
      providesTags: (result, error, id) => [{ type: 'Source', id }]
    }),

    createNewsSource: builder.mutation({
      query: (body) => ({
        url: '/newsroom/sources',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'Source', id: 'LIST' }]
    }),

    updateNewsSource: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/sources/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, { id }) => [{ type: 'Source', id }, { type: 'Source', id: 'LIST' }]
    }),

    deleteNewsSource: builder.mutation({
      query: (id) => ({
        url: `/newsroom/sources/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Source', id: 'LIST' }]
    }),

    linkNewsSource: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/sources/${id}/link`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, { id, assignment_id }) => [
        { type: 'Source', id },
        { type: 'Source', id: 'LIST' },
        ...(assignment_id ? [{ type: 'Assignment', id: assignment_id }] : [])
      ]
    }),

    // 5. Corrections
    getNewsCorrections: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/corrections',
        params
      }),
      transformResponse: (res) => unwrapPaginated(res),
      providesTags: ['Correction']
    }),

    createCorrectionRequest: builder.mutation({
      query: (body) => ({
        url: '/newsroom/corrections',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Correction', 'Notification']
    }),

    reviewNewsCorrection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/corrections/${id}/review`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Correction', 'News', 'Revision', 'Notification']
    }),

    publishNewsCorrection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/newsroom/corrections/${id}/publish`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Correction', 'News']
    }),

    // 6. Embargoes
    getEmbargoes: builder.query({
      query: (params = {}) => ({
        url: '/newsroom/embargoes',
        params
      }),
      transformResponse: (res) => unwrapPaginated(res),
      providesTags: ['Embargo', 'News']
    }),

    setArticleEmbargo: builder.mutation({
      query: ({ newsId, ...body }) => ({
        url: `/newsroom/embargoes/news/${newsId}`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Embargo', 'News', 'Planning', 'Notification']
    }),

    authorizeArticleEmbargo: builder.mutation({
      query: (newsId) => ({
        url: `/newsroom/embargoes/news/${newsId}/authorize`,
        method: 'POST'
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Embargo', 'News']
    }),

    releaseArticleEmbargoNow: builder.mutation({
      query: ({ newsId, publish_if_approved = true }) => ({
        url: `/newsroom/embargoes/news/${newsId}/release`,
        method: 'POST',
        body: { publish_if_approved }
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Embargo', 'News', 'Workflow', 'Notification']
    }),

    releaseDueEmbargoes: builder.mutation({
      query: () => ({
        url: '/newsroom/embargoes/release-due',
        method: 'POST'
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Embargo', 'News', 'Planning', 'Notification']
    })
  }),
  overrideExisting: false
});

export const {
  useGetNewsroomDashboardQuery,
  useGetAssignmentsQuery,
  useGetAssignmentDetailQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useTransitionAssignmentStatusMutation,
  useStartAssignmentDraftMutation,
  useDeleteAssignmentMutation,
  useGetNewsroomCalendarQuery,
  useGetEditorialPlansQuery,
  useCreateEditorialPlanMutation,
  useUpdateEditorialPlanMutation,
  useDeleteEditorialPlanMutation,
  useGetReporterAvailabilitiesQuery,
  useUpsertReporterAvailabilityMutation,
  useGetEditorialCommunicationsQuery,
  useCreateEditorialCommunicationMutation,
  useResolveEditorialCommunicationMutation,
  useGetNewsSourcesQuery,
  useGetNewsSourceDetailQuery,
  useCreateNewsSourceMutation,
  useUpdateNewsSourceMutation,
  useDeleteNewsSourceMutation,
  useLinkNewsSourceMutation,
  useGetNewsCorrectionsQuery,
  useCreateCorrectionRequestMutation,
  useReviewNewsCorrectionMutation,
  usePublishNewsCorrectionMutation,
  useGetEmbargoesQuery,
  useSetArticleEmbargoMutation,
  useAuthorizeArticleEmbargoMutation,
  useReleaseArticleEmbargoNowMutation,
  useReleaseDueEmbargoesMutation
} = newsroomApi;


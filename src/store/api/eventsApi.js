import { baseApi } from './baseApi.js';

const unwrap = (response) => response?.data ?? response;

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================
    // Public Events, Calendar, Special Projects & Verification
    // ========================
    getEventsList: builder.query({
      query: (params = {}) => ({ url: '/events', params }),
      transformResponse: unwrap,
      providesTags: ['CommunityEvent']
    }),
    getEventsCalendar: builder.query({
      query: (month) => ({ url: '/events/calendar', params: month ? { month } : {} }),
      transformResponse: unwrap,
      providesTags: ['CommunityEvent']
    }),
    getEventCategories: builder.query({
      query: () => '/events/categories',
      transformResponse: unwrap,
      providesTags: ['EventCategory']
    }),
    getSpecialProjects: builder.query({
      query: (params = {}) => ({ url: '/events/special-projects', params }),
      transformResponse: unwrap,
      providesTags: ['SpecialProject']
    }),
    getSpecialProjectDetail: builder.query({
      query: (slug) => `/events/special-projects/${encodeURIComponent(slug)}`,
      transformResponse: unwrap,
      providesTags: ['SpecialProject', 'CommunityEvent']
    }),
    getEventDetail: builder.query({
      query: (slug) => `/events/${encodeURIComponent(slug)}`,
      transformResponse: unwrap,
      providesTags: ['CommunityEvent', 'EventAnnouncement', 'EventGallery', 'EventReport', 'EventCompetition', 'EventCertificate']
    }),
    getEventResults: builder.query({
      query: (slug) => `/events/${encodeURIComponent(slug)}/results`,
      transformResponse: unwrap,
      providesTags: ['EventCompetition']
    }),
    verifyEventCertificate: builder.query({
      query: (code) => `/events/certificates/verify/${encodeURIComponent(String(code || '').trim())}`,
      transformResponse: unwrap,
      providesTags: ['EventCertificate']
    }),

    // ========================
    // Authenticated Reader Actions
    // ========================
    getMyEventRegistrations: builder.query({
      query: () => '/reader/events/my-registrations',
      transformResponse: unwrap,
      providesTags: ['EventParticipant', 'CommunityEvent']
    }),
    registerForPhase23Event: builder.mutation({
      query: ({ eventId, ...body }) => ({
        url: `/reader/events/${eventId}/register`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent', 'EventParticipant']
    }),
    cancelPhase23EventRegistration: builder.mutation({
      query: (eventId) => ({
        url: `/reader/events/${eventId}/cancel`,
        method: 'POST'
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent', 'EventParticipant']
    }),
    submitCompetitionEntry: builder.mutation({
      query: ({ competitionId, body }) => ({
        url: `/reader/events/competitions/${competitionId}/submit`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCompetition']
    }),
    getMyCompetitionEntries: builder.query({
      query: () => '/reader/events/my-entries',
      transformResponse: unwrap,
      providesTags: ['EventCompetition']
    }),
    getMyCertificates: builder.query({
      query: () => '/reader/events/my-certificates',
      transformResponse: unwrap,
      providesTags: ['EventCertificate']
    }),

    // ========================
    // Admin Events & Special Projects Management Console
    // ========================
    getAdminEventsOverview: builder.query({
      query: () => '/admin/events/overview',
      transformResponse: unwrap,
      providesTags: ['CommunityEvent', 'EventParticipant', 'EventCompetition', 'EventCertificate', 'SpecialProject']
    }),
    getAdminEventCategories: builder.query({
      query: () => '/admin/events/categories',
      transformResponse: unwrap,
      providesTags: ['EventCategory']
    }),
    createAdminEventCategory: builder.mutation({
      query: (body) => ({ url: '/admin/events/categories', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCategory']
    }),
    updateAdminEventCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/events/categories/${id}`, method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCategory']
    }),
    getAdminSpecialProjects: builder.query({
      query: () => '/admin/events/special-projects',
      transformResponse: unwrap,
      providesTags: ['SpecialProject']
    }),
    createAdminSpecialProject: builder.mutation({
      query: (body) => ({ url: '/admin/events/special-projects', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['SpecialProject']
    }),
    updateAdminSpecialProject: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/events/special-projects/${id}`, method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['SpecialProject']
    }),
    getAdminEvents: builder.query({
      query: (params = {}) => ({ url: '/admin/events', params }),
      transformResponse: unwrap,
      providesTags: ['CommunityEvent']
    }),
    getAdminEventDetail: builder.query({
      query: (id) => `/admin/events/${id}`,
      transformResponse: unwrap,
      providesTags: ['CommunityEvent', 'EventAnnouncement', 'EventGallery', 'EventReport', 'EventCompetition', 'EventCertificate']
    }),
    createAdminEvent: builder.mutation({
      query: (body) => ({ url: '/admin/events', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent', 'SpecialProject']
    }),
    updateAdminEvent: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/events/${id}`, method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),
    deleteAdminEvent: builder.mutation({
      query: (id) => ({ url: `/admin/events/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),
    createEventAnnouncement: builder.mutation({
      query: ({ eventId, ...body }) => ({ url: `/admin/events/${eventId}/announcements`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventAnnouncement', 'CommunityEvent']
    }),
    deleteEventAnnouncement: builder.mutation({
      query: (id) => ({ url: `/admin/events/announcements/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['EventAnnouncement', 'CommunityEvent']
    }),
    addEventGalleryItem: builder.mutation({
      query: ({ eventId, body }) => ({ url: `/admin/events/${eventId}/gallery`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventGallery', 'CommunityEvent']
    }),
    deleteEventGalleryItem: builder.mutation({
      query: (id) => ({ url: `/admin/events/gallery/${id}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: ['EventGallery', 'CommunityEvent']
    }),
    createEventReport: builder.mutation({
      query: ({ eventId, ...body }) => ({ url: `/admin/events/${eventId}/reports`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventReport', 'CommunityEvent']
    }),
    updateEventReport: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/events/reports/${id}`, method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventReport', 'CommunityEvent']
    }),
    getAdminEventParticipants: builder.query({
      query: ({ eventId, ...params }) => ({ url: `/admin/events/${eventId}/participants`, params }),
      transformResponse: unwrap,
      providesTags: ['EventParticipant']
    }),
    updateAdminParticipant: builder.mutation({
      query: ({ registrationId, ...body }) => ({ url: `/admin/events/registrations/${registrationId}`, method: 'PUT', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventParticipant', 'CommunityEvent']
    }),
    checkInParticipantByCode: builder.mutation({
      query: ({ eventId, ...body }) => ({ url: `/admin/events/${eventId}/check-in`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventParticipant', 'CommunityEvent']
    }),
    createEventCompetition: builder.mutation({
      query: ({ eventId, ...body }) => ({ url: `/admin/events/${eventId}/competitions`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCompetition', 'CommunityEvent']
    }),
    getAdminCompetitionEntries: builder.query({
      query: (competitionId) => `/admin/events/competitions/${competitionId}/entries`,
      transformResponse: unwrap,
      providesTags: ['EventCompetition']
    }),
    judgeCompetitionEntry: builder.mutation({
      query: ({ entryId, ...body }) => ({ url: `/admin/events/entries/${entryId}/judge`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCompetition']
    }),
    publishCompetitionResults: builder.mutation({
      query: ({ competitionId, ...body }) => ({ url: `/admin/events/competitions/${competitionId}/publish-results`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCompetition', 'EventAnnouncement', 'CommunityEvent']
    }),
    getAdminEventCertificates: builder.query({
      query: (eventId) => `/admin/events/${eventId}/certificates`,
      transformResponse: unwrap,
      providesTags: ['EventCertificate']
    }),
    issueEventCertificate: builder.mutation({
      query: ({ eventId, ...body }) => ({ url: `/admin/events/${eventId}/certificates`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCertificate']
    }),
    bulkIssueEventCertificates: builder.mutation({
      query: (eventId) => ({ url: `/admin/events/${eventId}/certificates/bulk-issue`, method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCertificate']
    }),
    revokeEventCertificate: builder.mutation({
      query: ({ certificateId, ...body }) => ({ url: `/admin/events/certificates/${certificateId}/revoke`, method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['EventCertificate']
    })
  })
});

export const {
  useGetEventsListQuery,
  useGetEventsCalendarQuery,
  useGetEventCategoriesQuery,
  useGetSpecialProjectsQuery,
  useGetSpecialProjectDetailQuery,
  useGetEventDetailQuery,
  useGetEventResultsQuery,
  useLazyVerifyEventCertificateQuery,
  useVerifyEventCertificateQuery,
  useGetMyEventRegistrationsQuery,
  useRegisterForPhase23EventMutation,
  useCancelPhase23EventRegistrationMutation,
  useSubmitCompetitionEntryMutation,
  useGetMyCompetitionEntriesQuery,
  useGetMyCertificatesQuery,
  useGetAdminEventsOverviewQuery,
  useGetAdminEventCategoriesQuery,
  useCreateAdminEventCategoryMutation,
  useUpdateAdminEventCategoryMutation,
  useGetAdminSpecialProjectsQuery,
  useCreateAdminSpecialProjectMutation,
  useUpdateAdminSpecialProjectMutation,
  useGetAdminEventsQuery,
  useGetAdminEventDetailQuery,
  useCreateAdminEventMutation,
  useUpdateAdminEventMutation,
  useDeleteAdminEventMutation,
  useCreateEventAnnouncementMutation,
  useDeleteEventAnnouncementMutation,
  useAddEventGalleryItemMutation,
  useDeleteEventGalleryItemMutation,
  useCreateEventReportMutation,
  useUpdateEventReportMutation,
  useGetAdminEventParticipantsQuery,
  useUpdateAdminParticipantMutation,
  useCheckInParticipantByCodeMutation,
  useCreateEventCompetitionMutation,
  useGetAdminCompetitionEntriesQuery,
  useJudgeCompetitionEntryMutation,
  usePublishCompetitionResultsMutation,
  useGetAdminEventCertificatesQuery,
  useIssueEventCertificateMutation,
  useBulkIssueEventCertificatesMutation,
  useRevokeEventCertificateMutation
} = eventsApi;


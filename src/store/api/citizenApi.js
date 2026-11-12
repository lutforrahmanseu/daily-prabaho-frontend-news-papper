import { baseApi } from './baseApi.js';

const unwrap = (response) => response?.data ?? response;

export const citizenApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================
    // Public Citizen Showcase, Tracking & Community
    // ========================
    getPublicCitizenSubmissions: builder.query({
      query: (params = {}) => ({ url: '/citizen/submissions', params }),
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission']
    }),
    getCitizenSubmissionDetail: builder.query({
      query: (slug) => `/citizen/submissions/${encodeURIComponent(slug)}`,
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission']
    }),
    trackCitizenSubmission: builder.query({
      query: (trackingCode) => `/citizen/track/${encodeURIComponent(String(trackingCode || '').trim())}`,
      transformResponse: unwrap
    }),
    getPublicContributorProfile: builder.query({
      query: (handle) => `/citizen/contributors/${encodeURIComponent(handle)}`,
      transformResponse: unwrap,
      providesTags: ['ContributorProfile', 'CitizenSubmission']
    }),
    getCommunityDiscussions: builder.query({
      query: (params = {}) => ({ url: '/community/discussions', params }),
      transformResponse: unwrap,
      providesTags: ['CommunityDiscussion']
    }),
    getCommunityDiscussionDetail: builder.query({
      query: (slug) => `/community/discussions/${encodeURIComponent(slug)}`,
      transformResponse: unwrap,
      providesTags: ['CommunityDiscussion']
    }),
    getCommunityEvents: builder.query({
      query: () => '/community/events',
      transformResponse: (res) => {
        const d = unwrap(res);
        return d?.items ?? [];
      },
      providesTags: ['CommunityEvent']
    }),
    getCommunityAnnouncements: builder.query({
      query: () => '/community/announcements',
      transformResponse: (res) => {
        const d = unwrap(res);
        return d?.items ?? [];
      },
      providesTags: ['CommunityAnnouncement']
    }),
    reportCommunityAbuse: builder.mutation({
      query: (body) => ({
        url: '/community/abuse-reports',
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AbuseReport']
    }),

    // ========================
    // Reader Contributor & Community Participation
    // ========================
    getMyContributorProfile: builder.query({
      query: () => '/reader/citizen/profile',
      transformResponse: unwrap,
      providesTags: ['ContributorProfile']
    }),
    updateMyContributorProfile: builder.mutation({
      query: (body) => ({
        url: '/reader/citizen/profile',
        method: 'PUT',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ContributorProfile']
    }),
    getMyCitizenSubmissions: builder.query({
      query: (params = {}) => ({ url: '/reader/citizen/submissions', params }),
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission']
    }),
    submitCitizenReport: builder.mutation({
      query: (payload) => ({
        url: '/reader/citizen/submissions',
        method: 'POST',
        body: payload
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission', 'ContributorProfile']
    }),
    updateMyCitizenSubmission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reader/citizen/submissions/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission']
    }),
    getMyContributorHistory: builder.query({
      query: () => '/reader/citizen/history',
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission', 'ContributorProfile', 'CommunityDiscussion', 'CommunityEvent']
    }),
    createCommunityDiscussion: builder.mutation({
      query: (body) => ({
        url: '/community/discussions',
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityDiscussion']
    }),
    createDiscussionReply: builder.mutation({
      query: ({ discussionId, body }) => ({
        url: `/community/discussions/${discussionId}/replies`,
        method: 'POST',
        body: { body }
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityDiscussion']
    }),
    registerCommunityEvent: builder.mutation({
      query: ({ eventId, ...body }) => ({
        url: `/community/events/${eventId}/register`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),
    cancelCommunityEvent: builder.mutation({
      query: (eventId) => ({
        url: `/community/events/${eventId}/register`,
        method: 'DELETE'
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),

    // ========================
    // Admin Moderation & Editorial Verification Dashboard
    // ========================
    getAdminCitizenOverview: builder.query({
      query: () => '/admin/citizen/overview',
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission', 'CommunityDiscussion', 'AbuseReport', 'CommunityEvent', 'CommunityAnnouncement']
    }),
    getAssignableCitizenReporters: builder.query({
      query: () => '/admin/citizen/reporters',
      transformResponse: unwrap
    }),
    getAdminCitizenSubmissions: builder.query({
      query: (params = {}) => ({ url: '/admin/citizen/submissions', params }),
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission']
    }),
    getAdminCitizenSubmissionDetail: builder.query({
      query: (id) => `/admin/citizen/submissions/${id}`,
      transformResponse: unwrap,
      providesTags: ['CitizenSubmission']
    }),
    reviewCitizenSubmission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/submissions/${id}/review`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission']
    }),
    assignCitizenSubmissionReporter: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/submissions/${id}/assign-reporter`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission', 'Assignment']
    }),
    publishCitizenSubmission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/submissions/${id}/publish`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission', 'ContributorProfile', 'News']
    }),
    removeCitizenSubmission: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/citizen/submissions/${id}/remove`,
        method: 'POST',
        body: { reason }
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CitizenSubmission']
    }),
    getAdminCommunityDiscussions: builder.query({
      query: (params = {}) => ({ url: '/admin/citizen/discussions', params }),
      transformResponse: unwrap,
      providesTags: ['CommunityDiscussion']
    }),
    moderateCommunityDiscussion: builder.mutation({
      query: ({ id, decision }) => ({
        url: `/admin/citizen/discussions/${id}/moderate`,
        method: 'POST',
        body: { decision }
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityDiscussion']
    }),
    getAdminDiscussionReplies: builder.query({
      query: (params = {}) => ({ url: '/admin/citizen/replies', params }),
      transformResponse: unwrap,
      providesTags: ['CommunityDiscussion']
    }),
    moderateDiscussionReply: builder.mutation({
      query: ({ id, decision }) => ({
        url: `/admin/citizen/replies/${id}/moderate`,
        method: 'POST',
        body: { decision }
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityDiscussion']
    }),
    getAdminAbuseReports: builder.query({
      query: (params = {}) => ({ url: '/admin/citizen/abuse-reports', params }),
      transformResponse: unwrap,
      providesTags: ['AbuseReport']
    }),
    resolveAbuseReport: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/abuse-reports/${id}/resolve`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AbuseReport', 'CitizenSubmission', 'CommunityDiscussion', 'ContributorProfile']
    }),
    getAdminContributorProfiles: builder.query({
      query: (params = {}) => ({ url: '/admin/citizen/contributors', params }),
      transformResponse: unwrap,
      providesTags: ['ContributorProfile']
    }),
    moderateContributorProfile: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/contributors/${id}/moderate`,
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ContributorProfile']
    }),
    getAdminCommunityEvents: builder.query({
      query: () => '/admin/citizen/events',
      transformResponse: unwrap,
      providesTags: ['CommunityEvent']
    }),
    createCommunityEvent: builder.mutation({
      query: (body) => ({
        url: '/admin/citizen/events',
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),
    updateCommunityEvent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/events/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityEvent']
    }),
    getAdminCommunityAnnouncements: builder.query({
      query: () => '/admin/citizen/announcements',
      transformResponse: unwrap,
      providesTags: ['CommunityAnnouncement']
    }),
    createCommunityAnnouncement: builder.mutation({
      query: (body) => ({
        url: '/admin/citizen/announcements',
        method: 'POST',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityAnnouncement']
    }),
    updateCommunityAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/citizen/announcements/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: unwrap,
      invalidatesTags: ['CommunityAnnouncement']
    })
  })
});

export const {
  useGetPublicCitizenSubmissionsQuery,
  useGetCitizenSubmissionDetailQuery,
  useLazyTrackCitizenSubmissionQuery,
  useGetPublicContributorProfileQuery,
  useGetCommunityDiscussionsQuery,
  useGetCommunityDiscussionDetailQuery,
  useGetCommunityEventsQuery,
  useGetCommunityAnnouncementsQuery,
  useReportCommunityAbuseMutation,
  useGetMyContributorProfileQuery,
  useUpdateMyContributorProfileMutation,
  useGetMyCitizenSubmissionsQuery,
  useSubmitCitizenReportMutation,
  useUpdateMyCitizenSubmissionMutation,
  useGetMyContributorHistoryQuery,
  useCreateCommunityDiscussionMutation,
  useCreateDiscussionReplyMutation,
  useRegisterCommunityEventMutation,
  useCancelCommunityEventMutation,
  useGetAdminCitizenOverviewQuery,
  useGetAssignableCitizenReportersQuery,
  useGetAdminCitizenSubmissionsQuery,
  useGetAdminCitizenSubmissionDetailQuery,
  useReviewCitizenSubmissionMutation,
  useAssignCitizenSubmissionReporterMutation,
  usePublishCitizenSubmissionMutation,
  useRemoveCitizenSubmissionMutation,
  useGetAdminCommunityDiscussionsQuery,
  useModerateCommunityDiscussionMutation,
  useGetAdminDiscussionRepliesQuery,
  useModerateDiscussionReplyMutation,
  useGetAdminAbuseReportsQuery,
  useResolveAbuseReportMutation,
  useGetAdminContributorProfilesQuery,
  useModerateContributorProfileMutation,
  useGetAdminCommunityEventsQuery,
  useCreateCommunityEventMutation,
  useUpdateCommunityEventMutation,
  useGetAdminCommunityAnnouncementsQuery,
  useCreateCommunityAnnouncementMutation,
  useUpdateCommunityAnnouncementMutation
} = citizenApi;


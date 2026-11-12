import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePaginated } from '../../utils/apiNormalizer.js';

export const creatorStudioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public Showcase & Telemetry
    getPublicCreatorShowcase: builder.query({
      query: (uuid) => `/creator-studio/public/${uuid}`,
      transformResponse: (res) => unwrapPayload(res),
      providesTags: (result, err, uuid) => [{ type: 'CreatorStudioProject', id: `pub-${uuid}` }],
    }),

    collectCreatorTelemetry: builder.mutation({
      query: (payload) => ({
        url: '/creator-studio/telemetry',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => unwrapPayload(res),
    }),

    // Admin Overview & Approved Article Picker
    getCreatorStudioOverview: builder.query({
      query: () => '/admin/creator-studio/overview',
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['CreatorStudioProject'],
    }),

    getEligibleStudioArticles: builder.query({
      query: (params = {}) => ({
        url: '/admin/creator-studio/eligible-articles',
        params,
      }),
      transformResponse: (res) => normalizePaginated(res),
    }),

    // Projects & Workflow
    getCreatorProjects: builder.query({
      query: (params = {}) => ({
        url: '/admin/creator-studio/projects',
        params,
      }),
      transformResponse: (res) => normalizePaginated(res),
      providesTags: ['CreatorStudioProject'],
    }),

    getCreatorProjectDetail: builder.query({
      query: (projectId) => `/admin/creator-studio/projects/${projectId}`,
      transformResponse: (res) => unwrapPayload(res),
      providesTags: (result, err, id) => [{ type: 'CreatorStudioProject', id }],
    }),

    createCreatorProject: builder.mutation({
      query: (payload) => ({
        url: '/admin/creator-studio/projects',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['CreatorStudioProject'],
    }),

    updateCreatorProject: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/admin/creator-studio/projects/${id}`,
        method: 'PUT',
        body: payload,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { id }) => ['CreatorStudioProject', { type: 'CreatorStudioProject', id }],
    }),

    deleteCreatorProject: builder.mutation({
      query: (id) => ({
        url: `/admin/creator-studio/projects/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['CreatorStudioProject'],
    }),

    transitionCreatorProjectWorkflow: builder.mutation({
      query: ({ projectId, action, reason }) => ({
        url: `/admin/creator-studio/projects/${projectId}/${action}`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorStudioProject', { type: 'CreatorStudioProject', id: projectId }],
    }),

    authorizeExternalStudioPublish: builder.mutation({
      query: ({ projectId, authorized }) => ({
        url: `/admin/creator-studio/projects/${projectId}/authorize-external`,
        method: 'POST',
        body: { authorized },
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => [{ type: 'CreatorStudioProject', id: projectId }],
    }),

    // Video Script Generator
    generateCreatorScript: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/admin/creator-studio/projects/${projectId}/scripts/generate`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorScript', { type: 'CreatorStudioProject', id: projectId }],
    }),

    updateCreatorScript: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/admin/creator-studio/scripts/${scriptId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorScript', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    reviewCreatorScript: builder.mutation({
      query: ({ scriptId, decision, notes }) => ({
        url: `/admin/creator-studio/scripts/${scriptId}/${decision}`,
        method: 'POST',
        body: notes ? { notes } : {},
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorScript', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    // Subtitle Studio
    createCreatorSubtitleTrack: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/admin/creator-studio/projects/${projectId}/subtitles`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSubtitle', { type: 'CreatorStudioProject', id: projectId }],
    }),

    importCreatorSubtitleTrack: builder.mutation({
      query: ({ projectId, formData }) => ({
        url: `/admin/creator-studio/projects/${projectId}/subtitles/import`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSubtitle', { type: 'CreatorStudioProject', id: projectId }],
    }),

    autoGenerateCreatorSubtitles: builder.mutation({
      query: ({ trackId, ...body }) => ({
        url: `/admin/creator-studio/subtitles/${trackId}/auto-generate`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSubtitle', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    updateCreatorSubtitleTrack: builder.mutation({
      query: ({ trackId, ...body }) => ({
        url: `/admin/creator-studio/subtitles/${trackId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSubtitle', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    // Voiceover Studio
    uploadCreatorVoiceover: builder.mutation({
      query: ({ projectId, formData }) => ({
        url: `/admin/creator-studio/projects/${projectId}/voiceovers`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorVoiceover', { type: 'CreatorStudioProject', id: projectId }],
    }),

    synthesizeCreatorVoiceover: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/admin/creator-studio/projects/${projectId}/voiceovers/synthesize`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorVoiceover', { type: 'CreatorStudioProject', id: projectId }],
    }),

    selectCreatorVoiceover: builder.mutation({
      query: ({ voiceoverId }) => ({
        url: `/admin/creator-studio/voiceovers/${voiceoverId}/select`,
        method: 'POST',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorVoiceover', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    approveCreatorVoiceover: builder.mutation({
      query: ({ voiceoverId }) => ({
        url: `/admin/creator-studio/voiceovers/${voiceoverId}/approve`,
        method: 'POST',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorVoiceover', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    deleteCreatorVoiceover: builder.mutation({
      query: ({ voiceoverId }) => ({
        url: `/admin/creator-studio/voiceovers/${voiceoverId}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorVoiceover', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    // Social Content Studio
    createCreatorSocialAsset: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/admin/creator-studio/projects/${projectId}/assets`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSocialAsset', { type: 'CreatorStudioProject', id: projectId }],
    }),

    renderCreatorSocialAsset: builder.mutation({
      query: ({ assetId, async = false }) => ({
        url: `/admin/creator-studio/assets/${assetId}/render`,
        method: 'POST',
        body: { async },
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSocialAsset', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    uploadCreatorRenderedAsset: builder.mutation({
      query: ({ assetId, formData }) => ({
        url: `/admin/creator-studio/assets/${assetId}/upload-render`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSocialAsset', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    approveCreatorSocialAsset: builder.mutation({
      query: ({ assetId }) => ({
        url: `/admin/creator-studio/assets/${assetId}/approve`,
        method: 'POST',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorSocialAsset', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    // Publishing Workflow
    dispatchCreatorPublishJob: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/admin/creator-studio/projects/${projectId}/publish-jobs`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorPublishJob', 'CreatorStudioProject', { type: 'CreatorStudioProject', id: projectId }],
    }),

    cancelCreatorPublishJob: builder.mutation({
      query: ({ jobId }) => ({
        url: `/admin/creator-studio/publish-jobs/${jobId}/cancel`,
        method: 'POST',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (r, e, { projectId }) => ['CreatorPublishJob', ...(projectId ? [{ type: 'CreatorStudioProject', id: projectId }] : [])],
    }),

    // Analytics
    getCreatorStudioAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/admin/creator-studio/analytics/summary',
        params,
      }),
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['CreatorAnalytics'],
    }),

    // Admin Settings, Templates & Permissions
    getCreatorStudioSettings: builder.query({
      query: () => '/admin/creator-studio/settings',
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['CreatorSettings'],
    }),

    updateCreatorStudioSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/creator-studio/settings',
        method: 'PUT',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['CreatorSettings', 'CreatorStudioProject'],
    }),

    testCreatorConnector: builder.mutation({
      query: (provider) => ({
        url: `/admin/creator-studio/integrations/${provider}/test`,
        method: 'POST',
      }),
      transformResponse: (res) => unwrapPayload(res),
    }),

    getCreatorBrandTemplates: builder.query({
      query: () => '/admin/creator-studio/templates',
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['CreatorTemplate'],
    }),

    saveCreatorBrandTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: id ? `/admin/creator-studio/templates/${id}` : '/admin/creator-studio/templates',
        method: id ? 'PUT' : 'POST',
        body,
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['CreatorTemplate', 'CreatorSettings'],
    }),

    deleteCreatorBrandTemplate: builder.mutation({
      query: (id) => ({
        url: `/admin/creator-studio/templates/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['CreatorTemplate'],
    }),

    getCreatorStudioPermissions: builder.query({
      query: () => '/admin/creator-studio/permissions',
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['Role', 'Permission'],
    }),

    updateCreatorRolePermissions: builder.mutation({
      query: ({ roleId, permission_slugs }) => ({
        url: `/admin/creator-studio/permissions/${roleId}`,
        method: 'PUT',
        body: { permission_slugs },
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['Role', 'Permission'],
    }),
  }),
});

export const {
  useGetPublicCreatorShowcaseQuery,
  useCollectCreatorTelemetryMutation,
  useGetCreatorStudioOverviewQuery,
  useGetEligibleStudioArticlesQuery,
  useGetCreatorProjectsQuery,
  useGetCreatorProjectDetailQuery,
  useCreateCreatorProjectMutation,
  useUpdateCreatorProjectMutation,
  useDeleteCreatorProjectMutation,
  useTransitionCreatorProjectWorkflowMutation,
  useAuthorizeExternalStudioPublishMutation,
  useGenerateCreatorScriptMutation,
  useUpdateCreatorScriptMutation,
  useReviewCreatorScriptMutation,
  useCreateCreatorSubtitleTrackMutation,
  useImportCreatorSubtitleTrackMutation,
  useAutoGenerateCreatorSubtitlesMutation,
  useUpdateCreatorSubtitleTrackMutation,
  useUploadCreatorVoiceoverMutation,
  useSynthesizeCreatorVoiceoverMutation,
  useSelectCreatorVoiceoverMutation,
  useApproveCreatorVoiceoverMutation,
  useDeleteCreatorVoiceoverMutation,
  useCreateCreatorSocialAssetMutation,
  useRenderCreatorSocialAssetMutation,
  useUploadCreatorRenderedAssetMutation,
  useApproveCreatorSocialAssetMutation,
  useDispatchCreatorPublishJobMutation,
  useCancelCreatorPublishJobMutation,
  useGetCreatorStudioAnalyticsQuery,
  useGetCreatorStudioSettingsQuery,
  useUpdateCreatorStudioSettingsMutation,
  useTestCreatorConnectorMutation,
  useGetCreatorBrandTemplatesQuery,
  useSaveCreatorBrandTemplateMutation,
  useDeleteCreatorBrandTemplateMutation,
  useGetCreatorStudioPermissionsQuery,
  useUpdateCreatorRolePermissionsMutation,
} = creatorStudioApi;

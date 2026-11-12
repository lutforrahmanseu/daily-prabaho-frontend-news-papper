import { baseApi } from './baseApi.js';

export const syndicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public catalog & OpenAPI docs
    getSyndicationPlans: builder.query({
      query: () => '/syndication/plans',
      transformResponse: (res) => res?.data || [],
      providesTags: ['SyndicationPlans']
    }),
    getSyndicationDocs: builder.query({
      query: () => '/syndication/docs',
      transformResponse: (res) => res?.data || null,
      providesTags: ['SyndicationDocs']
    }),

    // Authenticated Developer Portal
    getSyndicationWorkspace: builder.query({
      query: () => '/syndication/portal/workspace',
      transformResponse: (res) => res?.data || null,
      providesTags: ['SyndicationWorkspace']
    }),
    registerDeveloperAccount: builder.mutation({
      query: (body) => ({
        url: '/syndication/portal/account',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    createDeveloperApplication: builder.mutation({
      query: (body) => ({
        url: '/syndication/portal/applications',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    updateDeveloperApplication: builder.mutation({
      query: ({ appKey, ...body }) => ({
        url: `/syndication/portal/applications/${encodeURIComponent(appKey)}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    issueSyndicationKey: builder.mutation({
      query: ({ appKey, ...body }) => ({
        url: `/syndication/portal/applications/${encodeURIComponent(appKey)}/keys`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    rotateSyndicationKey: builder.mutation({
      query: ({ keyId, grace_hours = 24 }) => ({
        url: `/syndication/portal/keys/${encodeURIComponent(keyId)}/rotate`,
        method: 'POST',
        body: { grace_hours }
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    revokeSyndicationKey: builder.mutation({
      query: (keyId) => ({
        url: `/syndication/portal/keys/${encodeURIComponent(keyId)}/revoke`,
        method: 'POST'
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    createSyndicationWebhook: builder.mutation({
      query: ({ appKey, ...body }) => ({
        url: `/syndication/portal/applications/${encodeURIComponent(appKey)}/webhooks`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    updateSyndicationWebhook: builder.mutation({
      query: ({ webhookId, ...body }) => ({
        url: `/syndication/portal/webhooks/${encodeURIComponent(webhookId)}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    rotateSyndicationWebhookSecret: builder.mutation({
      query: (webhookId) => ({
        url: `/syndication/portal/webhooks/${encodeURIComponent(webhookId)}/rotate-secret`,
        method: 'POST'
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    deleteSyndicationWebhook: builder.mutation({
      query: (webhookId) => ({
        url: `/syndication/portal/webhooks/${encodeURIComponent(webhookId)}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    getSyndicationWebhookDeliveries: builder.query({
      query: (webhookId) => `/syndication/portal/webhooks/${encodeURIComponent(webhookId)}/deliveries`,
      transformResponse: (res) => res?.data || [],
      providesTags: ['SyndicationWebhookDeliveries']
    }),
    initiateSyndicationPlanCheckout: builder.mutation({
      query: (body) => ({
        url: '/syndication/portal/billing/checkout',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),
    verifySyndicationPlanCheckout: builder.mutation({
      query: (body) => ({
        url: '/syndication/portal/billing/verify',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SyndicationWorkspace']
    }),

    // Admin Syndication Governance Console
    getAdminSyndicationOverview: builder.query({
      query: () => '/admin/syndication/overview',
      transformResponse: (res) => res?.data || null,
      providesTags: ['AdminSyndicationOverview']
    }),
    getAdminSyndicationPartners: builder.query({
      query: (params = {}) => ({
        url: '/admin/syndication/partners',
        params
      }),
      transformResponse: (res) => res?.data || { data: [] },
      providesTags: ['AdminSyndicationPartners']
    }),
    reviewAdminSyndicationPartner: builder.mutation({
      query: ({ accountKey, ...body }) => ({
        url: `/admin/syndication/partners/${encodeURIComponent(accountKey)}/review`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['AdminSyndicationPartners', 'AdminSyndicationOverview', 'AdminSyndicationLicenses']
    }),
    getAdminSyndicationLicenses: builder.query({
      query: () => '/admin/syndication/licenses',
      transformResponse: (res) => res?.data || { licenses: [], grants: [] },
      providesTags: ['AdminSyndicationLicenses']
    }),
    saveAdminSyndicationLicense: builder.mutation({
      query: (body) => ({
        url: '/admin/syndication/licenses',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AdminSyndicationLicenses']
    }),
    saveAdminPartnerGrant: builder.mutation({
      query: (body) => ({
        url: '/admin/syndication/grants',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AdminSyndicationLicenses', 'AdminSyndicationPartners']
    }),
    updateAdminPartnerGrant: builder.mutation({
      query: ({ grantKey, ...body }) => ({
        url: `/admin/syndication/grants/${encodeURIComponent(grantKey)}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['AdminSyndicationLicenses', 'AdminSyndicationPartners']
    }),
    getAdminSyndicationPlans: builder.query({
      query: () => '/admin/syndication/plans',
      transformResponse: (res) => res?.data || [],
      providesTags: ['AdminSyndicationPlans']
    }),
    saveAdminSyndicationPlan: builder.mutation({
      query: (body) => ({
        url: '/admin/syndication/plans',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AdminSyndicationPlans', 'SyndicationPlans']
    })
  })
});

export const {
  useGetSyndicationPlansQuery,
  useGetSyndicationDocsQuery,
  useGetSyndicationWorkspaceQuery,
  useRegisterDeveloperAccountMutation,
  useCreateDeveloperApplicationMutation,
  useUpdateDeveloperApplicationMutation,
  useIssueSyndicationKeyMutation,
  useRotateSyndicationKeyMutation,
  useRevokeSyndicationKeyMutation,
  useCreateSyndicationWebhookMutation,
  useUpdateSyndicationWebhookMutation,
  useRotateSyndicationWebhookSecretMutation,
  useDeleteSyndicationWebhookMutation,
  useGetSyndicationWebhookDeliveriesQuery,
  useInitiateSyndicationPlanCheckoutMutation,
  useVerifySyndicationPlanCheckoutMutation,
  useGetAdminSyndicationOverviewQuery,
  useGetAdminSyndicationPartnersQuery,
  useReviewAdminSyndicationPartnerMutation,
  useGetAdminSyndicationLicensesQuery,
  useSaveAdminSyndicationLicenseMutation,
  useSaveAdminPartnerGrantMutation,
  useUpdateAdminPartnerGrantMutation,
  useGetAdminSyndicationPlansQuery,
  useSaveAdminSyndicationPlanMutation
} = syndicationApi;


import { baseApi } from './baseApi.js';

export const monetizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Public Subscription Catalog, Callback Verification & Sponsored Tracking ---
    getSubscriptionPlans: builder.query({
      query: () => '/subscriptions/plans',
      transformResponse: (res) => res?.data || { plans: [], gateways: [], currency: 'BDT' },
      providesTags: ['SubscriptionPlan']
    }),

    verifyPaymentCallback: builder.mutation({
      query: ({ gateway, payload, signature }) => ({
        url: `/payments/callback/${gateway}`,
        method: 'POST',
        headers: signature ? { 'X-NewsFlow-Signature': signature } : {},
        body: payload
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: [
        'ReaderSubscription',
        'PaymentTransaction',
        'Invoice',
        'ReaderProfile',
        'EpaperEdition',
        'MonetizationOverview'
      ]
    }),

    trackSponsoredImpression: builder.mutation({
      query: (newsId) => ({
        url: `/sponsored/${newsId}/impression`,
        method: 'POST'
      }),
      transformResponse: (res) => res?.data || res
    }),

    trackSponsoredClick: builder.mutation({
      query: (newsId) => ({
        url: `/sponsored/${newsId}/click`,
        method: 'POST'
      }),
      transformResponse: (res) => res?.data || res
    }),

    // --- Authenticated Reader Subscriptions, Transactions, Invoices & Refunds ---
    getMySubscription: builder.query({
      query: () => '/reader/subscription',
      transformResponse: (res) => res?.data || null,
      providesTags: ['ReaderSubscription']
    }),

    checkoutSubscription: builder.mutation({
      query: (body) => ({
        url: '/reader/subscriptions/checkout',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: [
        'ReaderSubscription',
        'PaymentTransaction',
        'Invoice',
        'ReaderProfile',
        'EpaperEdition'
      ]
    }),

    renewMySubscription: builder.mutation({
      query: (body = {}) => ({
        url: '/reader/subscriptions/renew',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['ReaderSubscription', 'PaymentTransaction', 'Invoice']
    }),

    cancelMySubscription: builder.mutation({
      query: (body = {}) => ({
        url: '/reader/subscriptions/cancel',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['ReaderSubscription', 'ReaderProfile', 'EpaperEdition']
    }),

    getMySubscriptionHistory: builder.query({
      query: (params = {}) => ({ url: '/reader/subscriptions/history', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['ReaderSubscription']
    }),

    getMyTransactions: builder.query({
      query: (params = {}) => ({ url: '/reader/transactions', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['PaymentTransaction']
    }),

    getMyInvoices: builder.query({
      query: (params = {}) => ({ url: '/reader/invoices', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['Invoice']
    }),

    getMyInvoiceDetail: builder.query({
      query: (invoiceId) => `/reader/invoices/${invoiceId}`,
      transformResponse: (res) => res?.data || res,
      providesTags: (_res, _err, id) => [{ type: 'Invoice', id }]
    }),

    getMyRefunds: builder.query({
      query: (params = {}) => ({ url: '/reader/refunds', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['Refund']
    }),

    requestRefund: builder.mutation({
      query: (body) => ({
        url: '/reader/refunds',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['Refund', 'PaymentTransaction']
    }),

    // --- Admin Monetization Control Center ---
    getAdminMonetizationOverview: builder.query({
      query: () => '/admin/monetization/overview',
      transformResponse: (res) => res?.data || res,
      providesTags: ['MonetizationOverview']
    }),

    getAdminSubscriptionPlans: builder.query({
      query: () => '/admin/monetization/plans',
      transformResponse: (res) => res?.data || [],
      providesTags: ['SubscriptionPlan']
    }),

    updateAdminSubscriptionPlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/monetization/plans/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['SubscriptionPlan']
    }),

    getAdminSubscriptions: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/subscriptions', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['ReaderSubscription']
    }),

    adminRenewSubscription: builder.mutation({
      query: ({ id, notes }) => ({
        url: `/admin/monetization/subscriptions/${id}/renew`,
        method: 'POST',
        body: { notes }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['ReaderSubscription', 'MonetizationOverview']
    }),

    adminCancelSubscription: builder.mutation({
      query: ({ id, immediate = false, reason }) => ({
        url: `/admin/monetization/subscriptions/${id}/cancel`,
        method: 'POST',
        body: { immediate, reason }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['ReaderSubscription', 'MonetizationOverview']
    }),

    getAdminTransactions: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/transactions', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['PaymentTransaction']
    }),

    getAdminInvoices: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/invoices', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['Invoice']
    }),

    getAdminRefunds: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/refunds', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['Refund']
    }),

    processAdminRefund: builder.mutation({
      query: ({ id, decision, admin_notes }) => ({
        url: `/admin/monetization/refunds/${id}/process`,
        method: 'POST',
        body: { decision, admin_notes }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['Refund', 'PaymentTransaction', 'ReaderSubscription', 'MonetizationOverview']
    }),

    getAdminAdvertisers: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/advertisers', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['Advertiser']
    }),

    createAdminAdvertiser: builder.mutation({
      query: (body) => ({
        url: '/admin/monetization/advertisers',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['Advertiser', 'MonetizationOverview']
    }),

    updateAdminAdvertiser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/monetization/advertisers/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['Advertiser']
    }),

    approveAdminAdvertiser: builder.mutation({
      query: ({ id, decision, notes }) => ({
        url: `/admin/monetization/advertisers/${id}/approve`,
        method: 'POST',
        body: { decision, notes }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['Advertiser', 'MonetizationOverview']
    }),

    getAdminAdPlacements: builder.query({
      query: () => '/admin/monetization/placements',
      transformResponse: (res) => res?.data || [],
      providesTags: ['AdPlacement']
    }),

    updateAdminAdPlacement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/monetization/placements/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AdPlacement']
    }),

    getAdminCampaigns: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/campaigns', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['AdCampaign']
    }),

    createAdminCampaign: builder.mutation({
      query: (body) => ({
        url: '/admin/monetization/campaigns',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AdCampaign', 'MonetizationOverview']
    }),

    updateAdminCampaign: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/monetization/campaigns/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['AdCampaign', 'MonetizationOverview']
    }),

    getAdminCampaignReport: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/campaigns/report', params }),
      transformResponse: (res) => res?.data || { by_placement: [], by_campaign: [], daily_series: [] },
      providesTags: ['AdCampaign', 'Advertisement', 'MonetizationOverview']
    }),

    getAdminSponsoredContents: builder.query({
      query: (params = {}) => ({ url: '/admin/monetization/sponsored', params }),
      transformResponse: (res) => res?.data || { items: [], pagination: {} },
      providesTags: ['SponsoredContent']
    }),

    createAdminSponsoredContent: builder.mutation({
      query: (body) => ({
        url: '/admin/monetization/sponsored',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['SponsoredContent', 'News', 'MonetizationOverview']
    }),

    updateAdminSponsoredContent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/monetization/sponsored/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['SponsoredContent', 'News']
    }),

    reviewSponsoredAdvertiser: builder.mutation({
      query: ({ id, decision, notes }) => ({
        url: `/admin/monetization/sponsored/${id}/advertiser-approval`,
        method: 'POST',
        body: { decision, notes }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['SponsoredContent', 'News', 'MonetizationOverview']
    }),

    reviewSponsoredEditorial: builder.mutation({
      query: ({ id, decision }) => ({
        url: `/admin/monetization/sponsored/${id}/editorial-approval`,
        method: 'POST',
        body: { decision }
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['SponsoredContent', 'News', 'MonetizationOverview']
    })
  })
});

export const {
  useGetSubscriptionPlansQuery,
  useVerifyPaymentCallbackMutation,
  useTrackSponsoredImpressionMutation,
  useTrackSponsoredClickMutation,
  useGetMySubscriptionQuery,
  useCheckoutSubscriptionMutation,
  useRenewMySubscriptionMutation,
  useCancelMySubscriptionMutation,
  useGetMySubscriptionHistoryQuery,
  useGetMyTransactionsQuery,
  useGetMyInvoicesQuery,
  useGetMyInvoiceDetailQuery,
  useGetMyRefundsQuery,
  useRequestRefundMutation,
  useGetAdminMonetizationOverviewQuery,
  useGetAdminSubscriptionPlansQuery,
  useUpdateAdminSubscriptionPlanMutation,
  useGetAdminSubscriptionsQuery,
  useAdminRenewSubscriptionMutation,
  useAdminCancelSubscriptionMutation,
  useGetAdminTransactionsQuery,
  useGetAdminInvoicesQuery,
  useGetAdminRefundsQuery,
  useProcessAdminRefundMutation,
  useGetAdminAdvertisersQuery,
  useCreateAdminAdvertiserMutation,
  useUpdateAdminAdvertiserMutation,
  useApproveAdminAdvertiserMutation,
  useGetAdminAdPlacementsQuery,
  useUpdateAdminAdPlacementMutation,
  useGetAdminCampaignsQuery,
  useCreateAdminCampaignMutation,
  useUpdateAdminCampaignMutation,
  useGetAdminCampaignReportQuery,
  useGetAdminSponsoredContentsQuery,
  useCreateAdminSponsoredContentMutation,
  useUpdateAdminSponsoredContentMutation,
  useReviewSponsoredAdvertiserMutation,
  useReviewSponsoredEditorialMutation
} = monetizationApi;


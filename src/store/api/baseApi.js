import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getOrCreateReaderClientId } from '../../utils/readerHelpers.js';

const READER_ENDPOINTS = new Set([
  'readerRegister',
  'readerLogin',
  'readerLogout',
  'getReaderSessions',
  'revokeReaderSession',
  'revokeOtherReaderSessions',
  'getReaderProfile',
  'updateReaderProfile',
  'updateReaderPreferences',
  'exportReaderData',
  'deleteReaderAccount',
  'getReaderBookmarks',
  'toggleReaderBookmark',
  'removeReaderBookmark',
  'getReaderHistory',
  'getRecentlyViewedNews',
  'recordReadingHistory',
  'removeReadingHistoryItem',
  'clearReadingHistory',
  'getReaderFollows',
  'followTarget',
  'unfollowTarget',
  'getPersonalizedFeed',
  'getArticleComments',
  'postArticleComment',
  'likeComment',
  'deleteOwnComment',
  'getArticleReactions',
  'toggleArticleReaction',
  'getPublicPolls',
  'getPublicPollBySlug',
  'votePoll',
  'getPublicEpaperList',
  'getPublicEpaperByDate',
  'getPublicEpaperEdition',
  'issueEpaperAccessGrant',
  'getSubscriptionPlans',
  'verifyPaymentCallback',
  'trackSponsoredImpression',
  'trackSponsoredClick',
  'getMySubscription',
  'checkoutSubscription',
  'renewMySubscription',
  'cancelMySubscription',
  'getMySubscriptionHistory',
  'getMyTransactions',
  'getMyInvoices',
  'getMyInvoiceDetail',
  'getMyRefunds',
  'requestRefund',
  'getPublicCitizenSubmissions',
  'getCitizenSubmissionDetail',
  'trackCitizenSubmission',
  'getPublicContributorProfile',
  'getCommunityDiscussions',
  'getCommunityDiscussionDetail',
  'getCommunityEvents',
  'getCommunityAnnouncements',
  'reportCommunityAbuse',
  'getMyContributorProfile',
  'updateMyContributorProfile',
  'getMyCitizenSubmissions',
  'submitCitizenReport',
  'updateMyCitizenSubmission',
  'getMyContributorHistory',
  'createCommunityDiscussion',
  'createDiscussionReply',
  'registerCommunityEvent',
  'cancelCommunityEvent',
  'getEventsList',
  'getEventsCalendar',
  'getEventCategories',
  'getSpecialProjects',
  'getSpecialProjectDetail',
  'getEventDetail',
  'getEventResults',
  'verifyEventCertificate',
  'getMyEventRegistrations',
  'registerForPhase23Event',
  'cancelPhase23EventRegistration',
  'submitCompetitionEntry',
  'getMyCompetitionEntries',
  'getMyCertificates',
  'collectAnalyticsTelemetry',
  'getActiveExperiments',
  'trackExperimentEvent',
  'getPublicCreatorShowcase',
  'collectCreatorTelemetry',
  'getReaderHyperlocalFeed',
  'updateReaderHyperlocalPreferences',
  'getSyndicationWorkspace',
  'registerDeveloperAccount',
  'createDeveloperApplication',
  'updateDeveloperApplication',
  'issueSyndicationKey',
  'rotateSyndicationKey',
  'revokeSyndicationKey',
  'createSyndicationWebhook',
  'updateSyndicationWebhook',
  'rotateSyndicationWebhookSecret',
  'deleteSyndicationWebhook',
  'getSyndicationWebhookDeliveries',
  'initiateSyndicationPlanCheckout',
  'verifySyndicationPlanCheckout'
]);

const isReaderEndpoint = (endpoint) => READER_ENDPOINTS.has(endpoint);

/**
 * Base RTK Query API service for NewsFlow / Daily Prabaho.
 * Handles Sanctum Bearer tokens cleanly across CMS Staff and Reader Engagement contexts.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: typeof window !== 'undefined' ? (import.meta.env?.VITE_API_URL || '/api/v1') : 'http://localhost:3000/api/v1',
  timeout: 25000,
  prepareHeaders: (headers, { endpoint }) => {
    if (typeof window !== 'undefined') {
      const readerToken = localStorage.getItem('reader_token');
      const adminToken = localStorage.getItem('auth_token');
      const token = isReaderEndpoint(endpoint) ? (readerToken || adminToken) : adminToken;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      if (isReaderEndpoint(endpoint)) {
        headers.set('x-reader-client-id', getOrCreateReaderClientId());
      }
    }

    if (!headers.has('accept')) {
      headers.set('accept', 'application/json');
    }

    return headers;
  }
});

/**
 * Custom baseQuery wrapper enforcing timeout retries on idempotent GET calls,
 * global 401 session cleanup, and consistent response normalization.
 */
export const customBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const method = typeof args === 'string' ? 'GET' : (args?.method || 'GET').toUpperCase();
  const isTransientFailure =
    result.error &&
    (result.error.status === 'FETCH_ERROR' ||
      result.error.status === 'TIMEOUT_ERROR' ||
      result.error.status === 503);

  if (method === 'GET' && isTransientFailure) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    result = await rawBaseQuery(args, api, extraOptions);
  }

  if (result.error && result.error.status === 401) {
    if (isReaderEndpoint(api?.endpoint)) {
      const hadReaderToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('reader_token'));
      if (hadReaderToken) {
        localStorage.removeItem('reader_token');
        localStorage.removeItem('reader_user');
        api?.dispatch?.({ type: 'reader/readerLogout' });
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      api?.dispatch?.({ type: 'auth/logout' });
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: customBaseQuery,
  tagTypes: [
    'News',
    'Category',
    'Tag',
    'User',
    'Role',
    'Permission',
    'Reporter',
    'Author',
    'Media',
    'Workflow',
    'Revision',
    'Comment',
    'Advertisement',
    'Analytics',
    'Settings',
    'Page',
    'AuditLog',
    'Assignment',
    'Planning',
    'Availability',
    'Communication',
    'Source',
    'Correction',
    'Embargo',
    'Notification',
    'LiveBlog',
    'LiveUpdate',
    'SpecialCoverage',
    'MultimediaItem',
    'PhotoCollection',
    'PodcastSeries',
    'VideoPlaylist',
    'InteractiveTimeline',
    'LongformStory',
    'ReaderProfile',
    'ReaderSession',
    'ReaderBookmark',
    'ReaderHistory',
    'ReaderFollow',
    'PersonalizedFeed',
    'Poll',
    'NewsReaction',
    'EpaperEdition',
    'EpaperPage',
    'ArchiveNews',
    'AiOverview',
    'AiGeneration',
    'AiModification',
    'AiUsageLog',
    'AiSettings',
    'SubscriptionPlan',
    'ReaderSubscription',
    'PaymentTransaction',
    'Invoice',
    'Refund',
    'Advertiser',
    'AdCampaign',
    'AdPlacement',
    'SponsoredContent',
    'MonetizationOverview',
    'CitizenSubmission',
    'ContributorProfile',
    'CommunityDiscussion',
    'CommunityEvent',
    'CommunityAnnouncement',
    'AbuseReport',
    'EventCategory',
    'SpecialProject',
    'EventAnnouncement',
    'EventGallery',
    'EventReport',
    'EventCompetition',
    'EventCertificate',
    'EventParticipant',
    'AdvancedAnalytics',
    'AnalyticsExperiment',
    'Reliability',
    'CreatorStudioProject',
    'CreatorScript',
    'CreatorSubtitle',
    'CreatorVoiceover',
    'CreatorSocialAsset',
    'CreatorTemplate',
    'CreatorPublishJob',
    'CreatorAnalytics',
    'CreatorSettings',
    'GeoLocation',
    'LocalCorrespondent',
    'HyperlocalArticle',
    'HyperlocalAssignment',
    'HyperlocalAnalytics',
    'SyndicationPlans',
    'SyndicationDocs',
    'SyndicationWorkspace',
    'SyndicationWebhookDeliveries',
    'AdminSyndicationOverview',
    'AdminSyndicationPartners',
    'AdminSyndicationLicenses',
    'AdminSyndicationPlans'
  ],
  endpoints: () => ({})
});

export default baseApi;


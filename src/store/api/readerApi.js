import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizeArticle } from '../../utils/apiNormalizer.js';
import { normalizePollData } from '../../utils/readerHelpers.js';

export const readerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Reader Auth & Secure Sessions
    readerRegister: builder.mutation({
      query: (payload) => ({
        url: 'reader/auth/register',
        method: 'POST',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderProfile', 'ReaderSession', 'ReaderBookmark', 'ReaderFollow', 'PersonalizedFeed']
    }),

    readerLogin: builder.mutation({
      query: (credentials) => ({
        url: 'reader/auth/login',
        method: 'POST',
        body: credentials
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderProfile', 'ReaderSession', 'ReaderBookmark', 'ReaderHistory', 'ReaderFollow', 'PersonalizedFeed']
    }),

    readerLogout: builder.mutation({
      query: () => ({
        url: 'reader/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['ReaderProfile', 'ReaderSession']
    }),

    getReaderSessions: builder.query({
      query: () => 'reader/sessions',
      transformResponse: (res) => unwrapPayload(res)?.sessions || [],
      providesTags: ['ReaderSession']
    }),

    revokeReaderSession: builder.mutation({
      query: (tokenId) => ({
        url: `reader/sessions/${tokenId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ReaderSession']
    }),

    revokeOtherReaderSessions: builder.mutation({
      query: () => ({
        url: 'reader/sessions/revoke-others',
        method: 'POST'
      }),
      invalidatesTags: ['ReaderSession']
    }),

    // 2. Profile, Notification Preferences & Privacy
    getReaderProfile: builder.query({
      query: () => 'reader/profile',
      transformResponse: (res) => unwrapPayload(res),
      providesTags: ['ReaderProfile']
    }),

    updateReaderProfile: builder.mutation({
      query: (payload) => ({
        url: 'reader/profile',
        method: 'PUT',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderProfile']
    }),

    updateReaderPreferences: builder.mutation({
      query: (payload) => ({
        url: 'reader/preferences',
        method: 'PUT',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderProfile', 'PersonalizedFeed']
    }),

    exportReaderData: builder.mutation({
      query: () => ({
        url: 'reader/privacy/export',
        method: 'GET'
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderProfile']
    }),

    deleteReaderAccount: builder.mutation({
      query: (payload) => ({
        url: 'reader/privacy/account',
        method: 'DELETE',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res)
    }),

    // 3. Bookmarks
    getReaderBookmarks: builder.query({
      query: () => 'reader/bookmarks',
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          items: Array.isArray(data.items) ? data.items.map(normalizeArticle) : [],
          bookmarkIds: Array.isArray(data.bookmark_ids) ? data.bookmark_ids : []
        };
      },
      providesTags: ['ReaderBookmark']
    }),

    toggleReaderBookmark: builder.mutation({
      query: (payload) => ({
        url: 'reader/bookmarks',
        method: 'POST',
        body: { toggle: true, ...payload }
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderBookmark', 'ReaderProfile']
    }),

    removeReaderBookmark: builder.mutation({
      query: (newsId) => ({
        url: `reader/bookmarks/${newsId}`,
        method: 'DELETE'
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderBookmark', 'ReaderProfile']
    }),

    // 4. Reading History & Recently Viewed
    getReaderHistory: builder.query({
      query: (params = {}) => ({
        url: 'reader/history',
        params
      }),
      transformResponse: (res) => {
        const payload = unwrapPayload(res) || {};
        const items = Array.isArray(payload.items)
          ? payload.items.map((item) => ({
              ...normalizeArticle(item),
              readingMeta: item.reading_meta || null
            }))
          : [];
        return {
          items,
          pagination: payload.pagination || { current_page: 1, last_page: 1, per_page: 20, total: items.length }
        };
      },
      providesTags: ['ReaderHistory']
    }),

    getRecentlyViewedNews: builder.query({
      query: (limit = 8) => ({
        url: 'reader/recently-viewed',
        params: { limit }
      }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return Array.isArray(data.items) ? data.items.map(normalizeArticle) : [];
      },
      providesTags: ['ReaderHistory']
    }),

    recordReadingHistory: builder.mutation({
      query: (payload) => ({
        url: 'reader/history',
        method: 'POST',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderHistory', 'ReaderProfile']
    }),

    removeReadingHistoryItem: builder.mutation({
      query: (newsId) => ({
        url: `reader/history/${newsId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ReaderHistory', 'ReaderProfile']
    }),

    clearReadingHistory: builder.mutation({
      query: () => ({
        url: 'reader/history',
        method: 'DELETE'
      }),
      invalidatesTags: ['ReaderHistory', 'ReaderProfile']
    }),

    // 5. Follows & Personalized Feed
    getReaderFollows: builder.query({
      query: () => 'reader/follows',
      transformResponse: (res) => unwrapPayload(res) || { categories: [], authors: [], topics: [], summary_ids: {} },
      providesTags: ['ReaderFollow']
    }),

    followTarget: builder.mutation({
      query: (payload) => ({
        url: 'reader/follows',
        method: 'POST',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderFollow', 'PersonalizedFeed', 'ReaderProfile']
    }),

    unfollowTarget: builder.mutation({
      query: (payload) => ({
        url: 'reader/follows',
        method: 'DELETE',
        body: payload
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['ReaderFollow', 'PersonalizedFeed', 'ReaderProfile']
    }),

    getPersonalizedFeed: builder.query({
      query: (params = {}) => ({
        url: 'reader/feed',
        params
      }),
      transformResponse: (res) => {
        const payload = unwrapPayload(res) || {};
        return {
          items: Array.isArray(payload.items) ? payload.items.map(normalizeArticle) : [],
          meta: payload.personalization_meta || {}
        };
      },
      providesTags: ['PersonalizedFeed', 'ReaderFollow']
    }),

    // 6. Article Comments & Reactions
    getArticleComments: builder.query({
      query: ({ slug, ...params }) => ({
        url: `news/${encodeURIComponent(slug)}/comments`,
        params
      }),
      transformResponse: (res) => unwrapPayload(res) || { items: [], liked_comment_ids: [], total_approved: 0 },
      providesTags: (result, error, { slug }) => [{ type: 'Comment', id: slug }, 'Comment']
    }),

    postArticleComment: builder.mutation({
      query: ({ slug, ...body }) => ({
        url: `news/${encodeURIComponent(slug)}/comments`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res,
      invalidatesTags: (result, error, { slug }) => [{ type: 'Comment', id: slug }, 'Comment', 'ReaderProfile']
    }),

    likeComment: builder.mutation({
      query: (commentId) => ({
        url: `comments/${commentId}/like`,
        method: 'POST'
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: ['Comment']
    }),

    deleteOwnComment: builder.mutation({
      query: (commentId) => ({
        url: `comments/${commentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Comment', 'ReaderProfile']
    }),

    getArticleReactions: builder.query({
      query: (slug) => `news/${encodeURIComponent(slug)}/reactions`,
      transformResponse: (res) => unwrapPayload(res) || { counts: {}, total: 0, user_reactions: [] },
      providesTags: (result, error, slug) => [{ type: 'NewsReaction', id: slug }]
    }),

    toggleArticleReaction: builder.mutation({
      query: ({ slug, reaction_type, exclusive = false }) => ({
        url: `news/${encodeURIComponent(slug)}/reactions`,
        method: 'POST',
        body: { reaction_type, exclusive }
      }),
      transformResponse: (res) => unwrapPayload(res),
      invalidatesTags: (result, error, { slug }) => [{ type: 'NewsReaction', id: slug }]
    }),

    // 7. Public Polls
    getPublicPolls: builder.query({
      query: (params = {}) => ({
        url: 'polls',
        params
      }),
      transformResponse: (res) => {
        const items = unwrapPayload(res)?.items || [];
        return Array.isArray(items) ? items.map(normalizePollData) : [];
      },
      providesTags: ['Poll']
    }),

    getPublicPollBySlug: builder.query({
      query: (slug) => `polls/${encodeURIComponent(slug)}`,
      transformResponse: (res) => normalizePollData(unwrapPayload(res)),
      providesTags: ['Poll']
    }),

    votePoll: builder.mutation({
      query: ({ pollId, optionId, optionIds }) => ({
        url: `polls/${pollId}/vote`,
        method: 'POST',
        body: optionIds ? { option_ids: optionIds } : { option_id: optionId }
      }),
      transformResponse: (res) => normalizePollData(unwrapPayload(res)),
      invalidatesTags: ['Poll']
    }),

    // 8. Admin Moderation & Polls CMS
    getAdminComments: builder.query({
      query: (params = {}) => ({
        url: 'admin/comments',
        params
      }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          items: Array.isArray(data.items) ? data.items : [],
          counts: data.counts || {},
          pagination: data.pagination || {}
        };
      },
      providesTags: ['Comment']
    }),

    moderateComment: builder.mutation({
      query: ({ id, status }) => ({
        url: `admin/comments/${id}/moderate`,
        method: 'PATCH',
        body: { status }
      }),
      invalidatesTags: ['Comment']
    }),

    deleteAdminComment: builder.mutation({
      query: (id) => ({
        url: `admin/comments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Comment']
    }),

    getAdminPolls: builder.query({
      query: (params = {}) => ({
        url: 'admin/polls',
        params
      }),
      transformResponse: (res) => {
        const data = unwrapPayload(res) || {};
        return {
          items: Array.isArray(data.items) ? data.items.map(normalizePollData) : [],
          pagination: data.pagination || {}
        };
      },
      providesTags: ['Poll']
    }),

    createAdminPoll: builder.mutation({
      query: (body) => ({
        url: 'admin/polls',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Poll']
    }),

    publishAdminPoll: builder.mutation({
      query: (id) => ({
        url: `admin/polls/${id}/publish`,
        method: 'POST'
      }),
      invalidatesTags: ['Poll']
    }),

    closeAdminPoll: builder.mutation({
      query: (id) => ({
        url: `admin/polls/${id}/close`,
        method: 'POST'
      }),
      invalidatesTags: ['Poll']
    }),

    deleteAdminPoll: builder.mutation({
      query: (id) => ({
        url: `admin/polls/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Poll']
    })
  })
});

export const {
  useReaderRegisterMutation,
  useReaderLoginMutation,
  useReaderLogoutMutation,
  useGetReaderSessionsQuery,
  useRevokeReaderSessionMutation,
  useRevokeOtherReaderSessionsMutation,
  useGetReaderProfileQuery,
  useUpdateReaderProfileMutation,
  useUpdateReaderPreferencesMutation,
  useExportReaderDataMutation,
  useDeleteReaderAccountMutation,
  useGetReaderBookmarksQuery,
  useToggleReaderBookmarkMutation,
  useRemoveReaderBookmarkMutation,
  useGetReaderHistoryQuery,
  useGetRecentlyViewedNewsQuery,
  useRecordReadingHistoryMutation,
  useRemoveReadingHistoryItemMutation,
  useClearReadingHistoryMutation,
  useGetReaderFollowsQuery,
  useFollowTargetMutation,
  useUnfollowTargetMutation,
  useGetPersonalizedFeedQuery,
  useGetArticleCommentsQuery,
  usePostArticleCommentMutation,
  useLikeCommentMutation,
  useDeleteOwnCommentMutation,
  useGetArticleReactionsQuery,
  useToggleArticleReactionMutation,
  useGetPublicPollsQuery,
  useGetPublicPollBySlugQuery,
  useVotePollMutation,
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
  useDeleteAdminCommentMutation,
  useGetAdminPollsQuery,
  useCreateAdminPollMutation,
  usePublishAdminPollMutation,
  useCloseAdminPollMutation,
  useDeleteAdminPollMutation
} = readerApi;

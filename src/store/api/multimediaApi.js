import { baseApi } from './baseApi.js';
import { normalizePaginated, unwrapPayload } from '../../utils/apiNormalizer.js';

export const multimediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // Public Multimedia Portal Endpoints
    // ==========================================
    getPublicMultimediaOverview: builder.query({
      query: () => 'multimedia/overview',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [
        { type: 'MultimediaItem', id: 'OVERVIEW' },
        { type: 'PhotoCollection', id: 'OVERVIEW' },
        { type: 'PodcastSeries', id: 'OVERVIEW' },
        { type: 'VideoPlaylist', id: 'OVERVIEW' },
        { type: 'InteractiveTimeline', id: 'OVERVIEW' },
        { type: 'LongformStory', id: 'OVERVIEW' }
      ]
    }),

    getPublicMultimediaItems: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/items',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: (result) => [
        { type: 'MultimediaItem', id: 'PUBLIC_LIST' },
        ...((result?.items || []).map(({ id }) => ({ type: 'MultimediaItem', id })))
      ]
    }),

    getPublicMultimediaItemBySlug: builder.query({
      query: (slug) => `multimedia/items/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'MultimediaItem', id: slug }]
    }),

    getPublicPhotoCollections: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/photo-collections',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'PhotoCollection', id: 'PUBLIC_LIST' }]
    }),

    getPublicPhotoCollectionBySlug: builder.query({
      query: (slug) => `multimedia/photo-collections/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'PhotoCollection', id: slug }]
    }),

    getPublicPodcasts: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/podcasts',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'PodcastSeries', id: 'PUBLIC_LIST' }]
    }),

    getPublicPodcastBySlug: builder.query({
      query: (slug) => `multimedia/podcasts/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'PodcastSeries', id: slug }]
    }),

    getPublicVideoPlaylists: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/playlists',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'VideoPlaylist', id: 'PUBLIC_LIST' }]
    }),

    getPublicVideoPlaylistBySlug: builder.query({
      query: (slug) => `multimedia/playlists/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'VideoPlaylist', id: slug }]
    }),

    getPublicTimelines: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/timelines',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'InteractiveTimeline', id: 'PUBLIC_LIST' }]
    }),

    getPublicTimelineBySlug: builder.query({
      query: (slug) => `multimedia/timelines/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'InteractiveTimeline', id: slug }]
    }),

    getPublicLongformStories: builder.query({
      query: (params = {}) => ({
        url: 'multimedia/stories',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'LongformStory', id: 'PUBLIC_LIST' }]
    }),

    getPublicLongformStoryBySlug: builder.query({
      query: (slug) => `multimedia/stories/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'LongformStory', id: slug }]
    }),

    // ==========================================
    // Admin CMS: Unified Multimedia Items
    // ==========================================
    getAdminMultimediaItems: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/items',
        params: { per_page: 30, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'MultimediaItem', id: 'ADMIN_LIST' }]
    }),

    createMultimediaItem: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/items',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'MultimediaItem', id: 'ADMIN_LIST' }, { type: 'MultimediaItem', id: 'PUBLIC_LIST' }, { type: 'MultimediaItem', id: 'OVERVIEW' }]
    }),

    updateMultimediaItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/items/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (r, e, { id }) => [
        { type: 'MultimediaItem', id },
        { type: 'MultimediaItem', id: 'ADMIN_LIST' },
        { type: 'MultimediaItem', id: 'PUBLIC_LIST' },
        { type: 'MultimediaItem', id: 'OVERVIEW' }
      ]
    }),

    deleteMultimediaItem: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/items/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'MultimediaItem', id: 'ADMIN_LIST' }, { type: 'MultimediaItem', id: 'PUBLIC_LIST' }, { type: 'MultimediaItem', id: 'OVERVIEW' }]
    }),

    transitionMultimediaItem: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/items/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (r, e, { id }) => [
        { type: 'MultimediaItem', id },
        { type: 'MultimediaItem', id: 'ADMIN_LIST' },
        { type: 'MultimediaItem', id: 'PUBLIC_LIST' },
        { type: 'MultimediaItem', id: 'OVERVIEW' }
      ]
    }),

    // ==========================================
    // Admin CMS: Photo Collections (Gallery & Photo Story)
    // ==========================================
    getAdminPhotoCollections: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/photo-collections',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'PhotoCollection', id: 'ADMIN_LIST' }]
    }),

    createPhotoCollection: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/photo-collections',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PhotoCollection', id: 'ADMIN_LIST' }, { type: 'PhotoCollection', id: 'PUBLIC_LIST' }, { type: 'PhotoCollection', id: 'OVERVIEW' }]
    }),

    updatePhotoCollection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/photo-collections/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PhotoCollection', id: 'ADMIN_LIST' }, { type: 'PhotoCollection', id: 'PUBLIC_LIST' }, { type: 'PhotoCollection', id: 'OVERVIEW' }]
    }),

    deletePhotoCollection: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/photo-collections/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'PhotoCollection', id: 'ADMIN_LIST' }, { type: 'PhotoCollection', id: 'PUBLIC_LIST' }, { type: 'PhotoCollection', id: 'OVERVIEW' }]
    }),

    transitionPhotoCollection: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/photo-collections/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PhotoCollection', id: 'ADMIN_LIST' }, { type: 'PhotoCollection', id: 'PUBLIC_LIST' }, { type: 'PhotoCollection', id: 'OVERVIEW' }]
    }),

    // ==========================================
    // Admin CMS: Podcasts & Episodes
    // ==========================================
    getAdminPodcasts: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/podcasts',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }]
    }),

    createPodcastSeries: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/podcasts',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    updatePodcastSeries: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/podcasts/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    deletePodcastSeries: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/podcasts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    transitionPodcastSeries: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/podcasts/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    createPodcastEpisode: builder.mutation({
      query: ({ seriesId, ...body }) => ({
        url: `admin/multimedia/podcasts/${seriesId}/episodes`,
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    updatePodcastEpisode: builder.mutation({
      query: ({ seriesId, episodeId, ...body }) => ({
        url: `admin/multimedia/podcasts/${seriesId}/episodes/${episodeId}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    deletePodcastEpisode: builder.mutation({
      query: ({ seriesId, episodeId }) => ({
        url: `admin/multimedia/podcasts/${seriesId}/episodes/${episodeId}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    transitionPodcastEpisode: builder.mutation({
      query: ({ seriesId, episodeId, action }) => ({
        url: `admin/multimedia/podcasts/${seriesId}/episodes/${episodeId}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'PodcastSeries', id: 'ADMIN_LIST' }, { type: 'PodcastSeries', id: 'PUBLIC_LIST' }, { type: 'PodcastSeries', id: 'OVERVIEW' }]
    }),

    // ==========================================
    // Admin CMS: Video Playlists & Timelines
    // ==========================================
    getAdminVideoPlaylists: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/playlists',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'VideoPlaylist', id: 'ADMIN_LIST' }]
    }),

    createVideoPlaylist: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/playlists',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'VideoPlaylist', id: 'ADMIN_LIST' }, { type: 'VideoPlaylist', id: 'PUBLIC_LIST' }, { type: 'VideoPlaylist', id: 'OVERVIEW' }]
    }),

    updateVideoPlaylist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/playlists/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'VideoPlaylist', id: 'ADMIN_LIST' }, { type: 'VideoPlaylist', id: 'PUBLIC_LIST' }, { type: 'VideoPlaylist', id: 'OVERVIEW' }]
    }),

    deleteVideoPlaylist: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/playlists/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'VideoPlaylist', id: 'ADMIN_LIST' }, { type: 'VideoPlaylist', id: 'PUBLIC_LIST' }, { type: 'VideoPlaylist', id: 'OVERVIEW' }]
    }),

    transitionVideoPlaylist: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/playlists/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'VideoPlaylist', id: 'ADMIN_LIST' }, { type: 'VideoPlaylist', id: 'PUBLIC_LIST' }, { type: 'VideoPlaylist', id: 'OVERVIEW' }]
    }),

    getAdminTimelines: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/timelines',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'InteractiveTimeline', id: 'ADMIN_LIST' }]
    }),

    createTimeline: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/timelines',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'InteractiveTimeline', id: 'ADMIN_LIST' }, { type: 'InteractiveTimeline', id: 'PUBLIC_LIST' }, { type: 'InteractiveTimeline', id: 'OVERVIEW' }]
    }),

    updateTimeline: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/timelines/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'InteractiveTimeline', id: 'ADMIN_LIST' }, { type: 'InteractiveTimeline', id: 'PUBLIC_LIST' }, { type: 'InteractiveTimeline', id: 'OVERVIEW' }]
    }),

    deleteTimeline: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/timelines/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'InteractiveTimeline', id: 'ADMIN_LIST' }, { type: 'InteractiveTimeline', id: 'PUBLIC_LIST' }, { type: 'InteractiveTimeline', id: 'OVERVIEW' }]
    }),

    transitionTimeline: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/timelines/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'InteractiveTimeline', id: 'ADMIN_LIST' }, { type: 'InteractiveTimeline', id: 'PUBLIC_LIST' }, { type: 'InteractiveTimeline', id: 'OVERVIEW' }]
    }),

    // ==========================================
    // Admin CMS: Long-form Storytelling Builder
    // ==========================================
    getAdminLongformStories: builder.query({
      query: (params = {}) => ({
        url: 'admin/multimedia/stories',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: [{ type: 'LongformStory', id: 'ADMIN_LIST' }]
    }),

    getAdminLongformStoryById: builder.query({
      query: (id) => `admin/multimedia/stories/${id}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (r, e, id) => [{ type: 'LongformStory', id }]
    }),

    createLongformStory: builder.mutation({
      query: (body) => ({
        url: 'admin/multimedia/stories',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'LongformStory', id: 'ADMIN_LIST' }, { type: 'LongformStory', id: 'PUBLIC_LIST' }, { type: 'LongformStory', id: 'OVERVIEW' }]
    }),

    updateLongformStory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/multimedia/stories/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (r, e, { id }) => [
        { type: 'LongformStory', id },
        { type: 'LongformStory', id: 'ADMIN_LIST' },
        { type: 'LongformStory', id: 'PUBLIC_LIST' },
        { type: 'LongformStory', id: 'OVERVIEW' }
      ]
    }),

    deleteLongformStory: builder.mutation({
      query: (id) => ({
        url: `admin/multimedia/stories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'LongformStory', id: 'ADMIN_LIST' }, { type: 'LongformStory', id: 'PUBLIC_LIST' }, { type: 'LongformStory', id: 'OVERVIEW' }]
    }),

    transitionLongformStory: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/multimedia/stories/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (r, e, { id }) => [
        { type: 'LongformStory', id },
        { type: 'LongformStory', id: 'ADMIN_LIST' },
        { type: 'LongformStory', id: 'PUBLIC_LIST' },
        { type: 'LongformStory', id: 'OVERVIEW' }
      ]
    })
  })
});

export const {
  useGetPublicMultimediaOverviewQuery,
  useGetPublicMultimediaItemsQuery,
  useGetPublicMultimediaItemBySlugQuery,
  useGetPublicPhotoCollectionsQuery,
  useGetPublicPhotoCollectionBySlugQuery,
  useGetPublicPodcastsQuery,
  useGetPublicPodcastBySlugQuery,
  useGetPublicVideoPlaylistsQuery,
  useGetPublicVideoPlaylistBySlugQuery,
  useGetPublicTimelinesQuery,
  useGetPublicTimelineBySlugQuery,
  useGetPublicLongformStoriesQuery,
  useGetPublicLongformStoryBySlugQuery,
  useGetAdminMultimediaItemsQuery,
  useCreateMultimediaItemMutation,
  useUpdateMultimediaItemMutation,
  useDeleteMultimediaItemMutation,
  useTransitionMultimediaItemMutation,
  useGetAdminPhotoCollectionsQuery,
  useCreatePhotoCollectionMutation,
  useUpdatePhotoCollectionMutation,
  useDeletePhotoCollectionMutation,
  useTransitionPhotoCollectionMutation,
  useGetAdminPodcastsQuery,
  useCreatePodcastSeriesMutation,
  useUpdatePodcastSeriesMutation,
  useDeletePodcastSeriesMutation,
  useTransitionPodcastSeriesMutation,
  useCreatePodcastEpisodeMutation,
  useUpdatePodcastEpisodeMutation,
  useDeletePodcastEpisodeMutation,
  useTransitionPodcastEpisodeMutation,
  useGetAdminVideoPlaylistsQuery,
  useCreateVideoPlaylistMutation,
  useUpdateVideoPlaylistMutation,
  useDeleteVideoPlaylistMutation,
  useTransitionVideoPlaylistMutation,
  useGetAdminTimelinesQuery,
  useCreateTimelineMutation,
  useUpdateTimelineMutation,
  useDeleteTimelineMutation,
  useTransitionTimelineMutation,
  useGetAdminLongformStoriesQuery,
  useGetAdminLongformStoryByIdQuery,
  useCreateLongformStoryMutation,
  useUpdateLongformStoryMutation,
  useDeleteLongformStoryMutation,
  useTransitionLongformStoryMutation
} = multimediaApi;
export default multimediaApi;


import { baseApi } from './baseApi.js';
import { normalizePaginated, unwrapPayload } from '../../utils/apiNormalizer.js';

export const liveCoverageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // Public Live Blogs
    // ==========================================
    getPublicLiveBlogs: builder.query({
      query: (params = {}) => ({
        url: 'live-blogs',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'LiveBlog', id })), { type: 'LiveBlog', id: 'PUBLIC_LIST' }]
          : [{ type: 'LiveBlog', id: 'PUBLIC_LIST' }];
      }
    }),

    getPublicLiveBlogBySlug: builder.query({
      query: (slug) => `live-blogs/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'LiveBlog', id: slug }, { type: 'LiveBlog', id: result?.id || slug }]
    }),

    subscribeLiveBlog: builder.mutation({
      query: ({ slug, ...payload }) => ({
        url: `live-blogs/${slug}/subscribe`,
        method: 'POST',
        body: payload
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { slug }) => [{ type: 'LiveBlog', id: slug }]
    }),

    // ==========================================
    // Public Special Coverages
    // ==========================================
    getPublicSpecialCoverages: builder.query({
      query: (params = {}) => ({
        url: 'special-coverages',
        params: { per_page: 20, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'SpecialCoverage', id })), { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }]
          : [{ type: 'SpecialCoverage', id: 'PUBLIC_LIST' }];
      }
    }),

    getPublicSpecialCoverageBySlug: builder.query({
      query: (slug) => `special-coverages/${slug}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, slug) => [{ type: 'SpecialCoverage', id: slug }]
    }),

    subscribeSpecialCoverage: builder.mutation({
      query: ({ slug, ...payload }) => ({
        url: `special-coverages/${slug}/subscribe`,
        method: 'POST',
        body: payload
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { slug }) => [{ type: 'SpecialCoverage', id: slug }]
    }),

    // ==========================================
    // Admin Live Desk (CMS)
    // ==========================================
    getAdminLiveBlogs: builder.query({
      query: (params = {}) => ({
        url: 'admin/live-blogs',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'LiveBlog', id })), { type: 'LiveBlog', id: 'ADMIN_LIST' }]
          : [{ type: 'LiveBlog', id: 'ADMIN_LIST' }];
      }
    }),

    getAdminLiveBlog: builder.query({
      query: (id) => `admin/live-blogs/${id}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, id) => [
        { type: 'LiveBlog', id },
        { type: 'LiveUpdate', id: `BLOG_${id}` }
      ]
    }),

    createLiveBlog: builder.mutation({
      query: (body) => ({
        url: 'admin/live-blogs',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'LiveBlog', id: 'ADMIN_LIST' }, { type: 'LiveBlog', id: 'PUBLIC_LIST' }]
    }),

    updateLiveBlog: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/live-blogs/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LiveBlog', id },
        { type: 'LiveBlog', id: 'ADMIN_LIST' },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' }
      ]
    }),

    deleteLiveBlog: builder.mutation({
      query: (id) => ({
        url: `admin/live-blogs/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'LiveBlog', id: 'ADMIN_LIST' }, { type: 'LiveBlog', id: 'PUBLIC_LIST' }]
    }),

    transitionLiveBlog: builder.mutation({
      query: ({ id, action, wrap_up_note }) => ({
        url: `admin/live-blogs/${id}/${action}`,
        method: 'POST',
        body: wrap_up_note ? { wrap_up_note } : {}
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LiveBlog', id },
        { type: 'LiveBlog', id: result?.slug },
        { type: 'LiveBlog', id: 'ADMIN_LIST' },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' },
        'Notification'
      ]
    }),

    // Live Blog Updates & Moderation
    createLiveUpdate: builder.mutation({
      query: ({ blogId, ...body }) => ({
        url: `admin/live-blogs/${blogId}/updates`,
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'ADMIN_LIST' },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' },
        'Notification'
      ]
    }),

    approveLiveUpdate: builder.mutation({
      query: ({ blogId, updateId }) => ({
        url: `admin/live-blogs/${blogId}/updates/${updateId}/approve`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' },
        'Notification'
      ]
    }),

    updateLiveUpdate: builder.mutation({
      query: ({ blogId, updateId, ...body }) => ({
        url: `admin/live-blogs/${blogId}/updates/${updateId}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' }
      ]
    }),

    togglePinLiveUpdate: builder.mutation({
      query: ({ blogId, updateId, is_pinned }) => ({
        url: `admin/live-blogs/${blogId}/updates/${updateId}/pin`,
        method: 'POST',
        body: typeof is_pinned === 'boolean' ? { is_pinned } : {}
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' }
      ]
    }),

    retractLiveUpdate: builder.mutation({
      query: ({ blogId, updateId, reason }) => ({
        url: `admin/live-blogs/${blogId}/updates/${updateId}/retract`,
        method: 'POST',
        body: { reason }
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' }
      ]
    }),

    deleteLiveUpdate: builder.mutation({
      query: ({ blogId, updateId, reason }) => ({
        url: `admin/live-blogs/${blogId}/updates/${updateId}`,
        method: 'DELETE',
        body: reason ? { reason } : {}
      }),
      invalidatesTags: (result, error, { blogId }) => [
        { type: 'LiveBlog', id: blogId },
        { type: 'LiveUpdate', id: `BLOG_${blogId}` },
        { type: 'LiveBlog', id: 'PUBLIC_LIST' }
      ]
    }),

    getLiveUpdateRevisions: builder.query({
      query: ({ blogId, updateId }) => `admin/live-blogs/${blogId}/updates/${updateId}/revisions`,
      transformResponse: (response) => unwrapPayload(response) || []
    }),

    // ==========================================
    // Admin Special Coverages (CMS)
    // ==========================================
    getAdminSpecialCoverages: builder.query({
      query: (params = {}) => ({
        url: 'admin/special-coverages',
        params: { per_page: 25, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'SpecialCoverage', id })), { type: 'SpecialCoverage', id: 'ADMIN_LIST' }]
          : [{ type: 'SpecialCoverage', id: 'ADMIN_LIST' }];
      }
    }),

    getAdminSpecialCoverage: builder.query({
      query: (id) => `admin/special-coverages/${id}`,
      transformResponse: (response) => unwrapPayload(response),
      providesTags: (result, error, id) => [{ type: 'SpecialCoverage', id }]
    }),

    createSpecialCoverage: builder.mutation({
      query: (body) => ({
        url: 'admin/special-coverages',
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'SpecialCoverage', id: 'ADMIN_LIST' }, { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }]
    }),

    updateSpecialCoverage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/special-coverages/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SpecialCoverage', id },
        { type: 'SpecialCoverage', id: 'ADMIN_LIST' },
        { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }
      ]
    }),

    deleteSpecialCoverage: builder.mutation({
      query: (id) => ({
        url: `admin/special-coverages/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'SpecialCoverage', id: 'ADMIN_LIST' }, { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }]
    }),

    transitionSpecialCoverage: builder.mutation({
      query: ({ id, action }) => ({
        url: `admin/special-coverages/${id}/${action}`,
        method: 'POST'
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SpecialCoverage', id },
        { type: 'SpecialCoverage', id: result?.slug },
        { type: 'SpecialCoverage', id: 'ADMIN_LIST' },
        { type: 'SpecialCoverage', id: 'PUBLIC_LIST' },
        'Notification'
      ]
    }),

    createSpecialCoverageItem: builder.mutation({
      query: ({ coverageId, ...body }) => ({
        url: `admin/special-coverages/${coverageId}/items`,
        method: 'POST',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { coverageId }) => [
        { type: 'SpecialCoverage', id: coverageId },
        { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }
      ]
    }),

    updateSpecialCoverageItem: builder.mutation({
      query: ({ coverageId, itemId, ...body }) => ({
        url: `admin/special-coverages/${coverageId}/items/${itemId}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: (result, error, { coverageId }) => [
        { type: 'SpecialCoverage', id: coverageId },
        { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }
      ]
    }),

    deleteSpecialCoverageItem: builder.mutation({
      query: ({ coverageId, itemId }) => ({
        url: `admin/special-coverages/${coverageId}/items/${itemId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { coverageId }) => [
        { type: 'SpecialCoverage', id: coverageId },
        { type: 'SpecialCoverage', id: 'PUBLIC_LIST' }
      ]
    })
  })
});

export const {
  useGetPublicLiveBlogsQuery,
  useGetPublicLiveBlogBySlugQuery,
  useSubscribeLiveBlogMutation,
  useGetPublicSpecialCoveragesQuery,
  useGetPublicSpecialCoverageBySlugQuery,
  useSubscribeSpecialCoverageMutation,
  useGetAdminLiveBlogsQuery,
  useGetAdminLiveBlogQuery,
  useCreateLiveBlogMutation,
  useUpdateLiveBlogMutation,
  useDeleteLiveBlogMutation,
  useTransitionLiveBlogMutation,
  useCreateLiveUpdateMutation,
  useApproveLiveUpdateMutation,
  useUpdateLiveUpdateMutation,
  useTogglePinLiveUpdateMutation,
  useRetractLiveUpdateMutation,
  useDeleteLiveUpdateMutation,
  useGetLiveUpdateRevisionsQuery,
  useGetAdminSpecialCoveragesQuery,
  useGetAdminSpecialCoverageQuery,
  useCreateSpecialCoverageMutation,
  useUpdateSpecialCoverageMutation,
  useDeleteSpecialCoverageMutation,
  useTransitionSpecialCoverageMutation,
  useCreateSpecialCoverageItemMutation,
  useUpdateSpecialCoverageItemMutation,
  useDeleteSpecialCoverageItemMutation
} = liveCoverageApi;

export default liveCoverageApi;


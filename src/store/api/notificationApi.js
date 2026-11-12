import { baseApi } from './baseApi.js';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        params
      }),
      transformResponse: (res) => {
        const payload = res?.data ?? res ?? {};
        return {
          items: Array.isArray(payload.items) ? payload.items : [],
          unread_count: Number(payload.unread_count ?? 0)
        };
      },
      providesTags: ['Notification']
    }),

    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notification', 'Planning']
    }),

    markAllNotificationsReadApi: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST'
      }),
      invalidatesTags: ['Notification']
    })
  }),
  overrideExisting: false
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadApiMutation
} = notificationApi;


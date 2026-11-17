import { baseApi } from './baseApi.js';

export const globalNewsWireApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalWireOverview: builder.query({
      query: () => '/admin/global-wire/overview',
      transformResponse: (res) => res?.data || res,
      providesTags: ['GlobalWireOverview']
    }),

    getGlobalWireSources: builder.query({
      query: () => '/admin/global-wire/sources',
      transformResponse: (res) => res?.data || res || [],
      providesTags: ['GlobalWireSources']
    }),

    updateGlobalWireSource: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/global-wire/sources/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireSources', 'GlobalWireOverview']
    }),

    addGlobalWireSource: builder.mutation({
      query: (body) => ({
        url: '/admin/global-wire/sources',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireSources', 'GlobalWireOverview']
    }),

    deleteGlobalWireSource: builder.mutation({
      query: (id) => ({
        url: `/admin/global-wire/sources/${id}`,
        method: 'DELETE'
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireSources', 'GlobalWireOverview']
    }),

    getGlobalWireItems: builder.query({
      query: () => '/admin/global-wire/items',
      transformResponse: (res) => res?.data || res || [],
      providesTags: ['GlobalWireItems']
    }),

    triggerWireFetchNow: builder.mutation({
      query: (body = {}) => ({
        url: '/admin/global-wire/fetch-now',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireItems', 'GlobalWireOverview', 'News']
    }),

    triggerSourceFetchNow: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/global-wire/sources/${id}/fetch`,
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireItems', 'GlobalWireOverview', 'News']
    }),

    convertWireItem: builder.mutation({
      query: (body) => ({
        url: '/admin/global-wire/convert-item',
        method: 'POST',
        body
      }),
      transformResponse: (res) => res?.data || res,
      invalidatesTags: ['GlobalWireItems', 'GlobalWireOverview', 'News']
    })
  }),
  overrideExisting: false
});

export const {
  useGetGlobalWireOverviewQuery,
  useGetGlobalWireSourcesQuery,
  useUpdateGlobalWireSourceMutation,
  useAddGlobalWireSourceMutation,
  useDeleteGlobalWireSourceMutation,
  useGetGlobalWireItemsQuery,
  useTriggerWireFetchNowMutation,
  useTriggerSourceFetchNowMutation,
  useConvertWireItemMutation
} = globalNewsWireApi;


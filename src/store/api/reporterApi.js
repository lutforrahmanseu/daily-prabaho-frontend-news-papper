import { baseApi } from './baseApi.js';
import {
  unwrapPayload,
  normalizePaginated,
  normalizeReporter
} from '../../utils/apiNormalizer.js';

export const reporterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReporters: builder.query({
      query: (params = {}) => ({
        url: 'reporters',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeReporter),
      providesTags: (result) => {
        const items = result?.items || [];
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Reporter', id })), { type: 'Reporter', id: 'LIST' }]
          : [{ type: 'Reporter', id: 'LIST' }];
      }
    }),

    createReporter: builder.mutation({
      query: (data) => ({
        url: 'reporters',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => normalizeReporter(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Reporter', id: 'LIST' }]
    }),

    updateReporter: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `reporters/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response) => normalizeReporter(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reporter', id },
        { type: 'Reporter', id: 'LIST' }
      ]
    }),

    deleteReporter: builder.mutation({
      query: (id) => ({
        url: `reporters/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Reporter', id: 'LIST' }]
    })
  })
});

export const {
  useGetReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation
} = reporterApi;

export default reporterApi;


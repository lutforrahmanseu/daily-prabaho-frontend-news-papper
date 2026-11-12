import { baseApi } from './baseApi.js';
import {
  unwrapPayload,
  normalizeArticle,
  normalizeWorkflowLog,
  normalizeRevision
} from '../../utils/apiNormalizer.js';

export const workflowApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Transition Editorial Status (submit, review, return, reject, approve, schedule, publish)
    transitionWorkflow: builder.mutation({
      query: ({ id, status, comments, scheduled_at }) => ({
        url: `news/${id}/transition`,
        method: 'POST',
        body: { status, comments, scheduled_at }
      }),
      transformResponse: (response) => normalizeArticle(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'News', id },
        { type: 'News', id: 'LIST' },
        { type: 'News', id: 'ADMIN_LIST' },
        { type: 'News', id: 'BREAKING' },
        { type: 'News', id: 'FEATURED' },
        { type: 'Workflow', id },
        { type: 'Revision', id },
        'Analytics'
      ]
    }),

    // 2. Get Editorial Workflow History for Article
    getWorkflowHistory: builder.query({
      query: (id) => `news/${id}/workflows`,
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeWorkflowLog);
      },
      providesTags: (result, error, id) => [{ type: 'Workflow', id }]
    }),

    // 3. Get Article Revision Versions
    getNewsRevisions: builder.query({
      query: (id) => `news/${id}/revisions`,
      transformResponse: (response) => {
        const payload = unwrapPayload(response);
        const list = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        return list.map(normalizeRevision);
      },
      providesTags: (result, error, id) => [{ type: 'Revision', id }]
    })
  })
});

export const {
  useTransitionWorkflowMutation,
  useGetWorkflowHistoryQuery,
  useGetNewsRevisionsQuery
} = workflowApi;

export default workflowApi;

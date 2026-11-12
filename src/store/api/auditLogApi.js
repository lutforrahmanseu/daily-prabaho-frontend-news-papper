import { baseApi } from './baseApi.js';
import {
  normalizePaginated,
  normalizeAuditLog
} from '../../utils/apiNormalizer.js';

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: 'audit-logs',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeAuditLog),
      providesTags: [{ type: 'AuditLog', id: 'LIST' }]
    })
  })
});

export const {
  useGetAuditLogsQuery
} = auditLogApi;

export default auditLogApi;


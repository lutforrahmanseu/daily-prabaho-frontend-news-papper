import { baseApi } from './baseApi.js';
import { unwrapPayload } from '../../utils/apiNormalizer.js';

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Roles with associated permissions
    getRoles: builder.query({
      query: () => 'roles',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Role', id: 'LIST' }]
    }),

    // 2. Get All System Permissions Grouped
    getPermissions: builder.query({
      query: () => 'permissions',
      transformResponse: (response) => unwrapPayload(response),
      providesTags: [{ type: 'Permission', id: 'LIST' }]
    }),

    // 3. Update permissions assigned to a role
    updateRolePermissions: builder.mutation({
      query: ({ id, permissions }) => ({
        url: `roles/${id}/permissions`,
        method: 'PUT',
        body: { permissions }
      }),
      transformResponse: (response) => unwrapPayload(response),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }, { type: 'User', id: 'LIST' }]
    })
  })
});

export const {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useUpdateRolePermissionsMutation
} = roleApi;

export default roleApi;


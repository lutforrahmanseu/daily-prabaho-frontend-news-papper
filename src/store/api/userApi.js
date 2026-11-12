import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizePaginated, normalizeUser } from '../../utils/apiNormalizer.js';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Paginated Users List
    getUsers: builder.query({
      query: (params = {}) => ({
        url: 'users',
        params: { per_page: 50, ...params }
      }),
      transformResponse: (response) => normalizePaginated(response, normalizeUser),
      providesTags: (result) => {
        const items = result?.items || result?.data || (Array.isArray(result) ? result : []);
        return items.length
          ? [...items.map(({ id }) => ({ type: 'User', id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }];
      }
    }),

    // 2. Get Single User Details
    getUser: builder.query({
      query: (id) => `users/${id}`,
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),

    // 3. Create User with Role
    createUser: builder.mutation({
      query: (userData) => ({
        url: 'users',
        method: 'POST',
        body: userData
      }),
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),

    // 4. Update User
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: userData
      }),
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' }
      ]
    }),

    // 5. Delete User
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),

    // 6. Toggle Active/Suspended Status
    toggleUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `users/${id}/status`,
        method: 'PATCH',
        body: { status }
      }),
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation
} = userApi;

export default userApi;


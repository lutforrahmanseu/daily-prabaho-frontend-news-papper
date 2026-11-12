import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizeUser } from '../../utils/apiNormalizer.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Login with credentials
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials
      }),
      transformResponse: (response) => {
        const data = unwrapPayload(response);
        if (!data) return data;
        return {
          ...data,
          user: data.user ? normalizeUser(data.user) : null
        };
      },
      invalidatesTags: ['User', 'Role', 'Permission']
    }),

    // 2. Logout and invalidate server token
    logout: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['User']
    }),

    // 3. Fetch authenticated user profile and permissions
    getMe: builder.query({
      query: () => 'auth/me',
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      providesTags: ['User']
    }),

    // 4. Update authenticated user profile
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: 'auth/profile',
        method: 'PUT',
        body: profileData
      }),
      transformResponse: (response) => normalizeUser(unwrapPayload(response)),
      invalidatesTags: ['User']
    }),

    // 5. Change Password
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: 'auth/change-password',
        method: 'POST',
        body: passwords
      })
    })
  })
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation
} = authApi;

export default authApi;


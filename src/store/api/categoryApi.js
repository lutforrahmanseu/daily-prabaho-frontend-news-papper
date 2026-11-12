import { baseApi } from './baseApi.js';
import { unwrapPayload, normalizeCategory } from '../../utils/apiNormalizer.js';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Categories Hierarchy
    getCategories: builder.query({
      query: (params = {}) => ({
        url: 'categories',
        params
      }),
      transformResponse: (response) => {
        const data = unwrapPayload(response);
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        return list.map(normalizeCategory);
      },
      providesTags: (result) => {
        const items = Array.isArray(result) ? result : (result?.items || result?.data || []);
        return items.length
          ? [...items.map(({ id }) => ({ type: 'Category', id })), { type: 'Category', id: 'LIST' }]
          : [{ type: 'Category', id: 'LIST' }];
      }
    }),

    // 2. Get Single Category
    getCategory: builder.query({
      query: (id) => `categories/${id}`,
      transformResponse: (response) => normalizeCategory(unwrapPayload(response)),
      providesTags: (result, error, id) => [{ type: 'Category', id }]
    }),

    // 3. Create Category
    createCategory: builder.mutation({
      query: (data) => ({
        url: 'categories',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => normalizeCategory(unwrapPayload(response)),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }]
    }),

    // 4. Update Category
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `categories/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response) => normalizeCategory(unwrapPayload(response)),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
        { type: 'News', id: 'LIST' }
      ]
    }),

    // 5. Delete Category
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Category', id: 'LIST' },
        { type: 'News', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} = categoryApi;

export default categoryApi;


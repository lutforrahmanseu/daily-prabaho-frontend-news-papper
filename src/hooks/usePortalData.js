import { useMemo } from 'react';
import {
  useGetNewsListQuery,
  useGetBreakingNewsQuery,
  useGetFeaturedNewsQuery,
  useGetPopularNewsQuery
} from '../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../store/api/categoryApi.js';
import { useGetPublicSettingsQuery } from '../store/api/settingsApi.js';
import { normalizePublicSettings } from '../utils/apiNormalizer.js';

const DEFAULT_PORTAL_SETTINGS = normalizePublicSettings({});

/**
 * Shared hook for portal-wide branding, contact, and SEO settings from Laravel API.
 */
export function usePortalSettings() {
  const query = useGetPublicSettingsQuery();
  const settings = query.data || DEFAULT_PORTAL_SETTINGS;
  return {
    settings,
    isLoading: query.isLoading,
    isError: query.isError
  };
}

/**
 * Shared hook for category navigation & taxonomy tree from Laravel API.
 */
export function usePortalCategories(params = {}) {
  const query = useGetCategoriesQuery(params);
  const categories = useMemo(
    () => (Array.isArray(query.data) ? query.data : (query.data?.items || query.data?.data || [])),
    [query.data]
  );
  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch
  };
}

/**
 * Shared hook for public published articles with server-side filters & pagination.
 */
export function usePublicArticles(params = {}, options = {}) {
  const query = useGetNewsListQuery({ per_page: 50, ...params }, options);
  const articles = useMemo(
    () => (Array.isArray(query.data) ? query.data : (query.data?.items || query.data?.data || [])),
    [query.data]
  );
  return {
    articles,
    pagination: query.data?.pagination || { current_page: 1, last_page: 1, per_page: 50, total: articles.length },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch
  };
}

export function useFeaturedArticles(params = {}) {
  const query = useGetFeaturedNewsQuery(params);
  const articles = useMemo(
    () => (Array.isArray(query.data) ? query.data : (query.data?.items || query.data?.data || [])),
    [query.data]
  );
  return { articles, isLoading: query.isLoading };
}

export function useBreakingArticles() {
  const query = useGetBreakingNewsQuery();
  const items = useMemo(
    () => (Array.isArray(query.data) ? query.data : (query.data?.items || query.data?.data || [])),
    [query.data]
  );
  return { items, isLoading: query.isLoading };
}

export function usePopularArticles(params = {}) {
  const query = useGetPopularNewsQuery(params);
  const articles = useMemo(
    () => (Array.isArray(query.data) ? query.data : (query.data?.items || query.data?.data || [])),
    [query.data]
  );
  return { articles, isLoading: query.isLoading };
}


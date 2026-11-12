/**
 * Search Service
 * Handles global search queries, debounced autocompletion, category/date filtering,
 * and recent search history.
 * Prepared for Laravel REST API integration (/api/v1/search & /api/v1/search/autocomplete).
 */

import { INITIAL_NEWS } from '../data/sampleNews.js';
import { CATEGORIES } from '../data/categories.js';

const RECENT_SEARCHES_KEY = 'daily_prabaho_recent_searches';

/**
 * Filter articles by publication date range
 */
export function filterByDate(articles, dateFilter) {
  if (!dateFilter || dateFilter === 'all') return articles;

  const now = new Date().getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return articles.filter((article) => {
    const pubTime = new Date(article.publishedAt).getTime();
    const diff = now - pubTime;

    switch (dateFilter) {
      case 'today':
        return diff <= ONE_DAY;
      case 'week':
        return diff <= 7 * ONE_DAY;
      case 'month':
        return diff <= 30 * ONE_DAY;
      case 'year':
        return diff <= 365 * ONE_DAY;
      default:
        return true;
    }
  });
}

/**
 * Sort articles by specified criteria
 */
export function sortArticles(articles, sortBy = 'relevance', query = '') {
  const list = [...articles];

  if (sortBy === 'newest') {
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  if (sortBy === 'popular') {
    return list.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  // 'relevance' - score by title match, tag match, excerpt match
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    return list.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.title.toLowerCase().includes(q)) scoreA += 10;
      if (a.titleEn && a.titleEn.toLowerCase().includes(q)) scoreA += 10;
      if (a.tags && a.tags.some(t => t.toLowerCase().includes(q))) scoreA += 5;
      if (a.excerpt.toLowerCase().includes(q)) scoreA += 3;

      if (b.title.toLowerCase().includes(q)) scoreB += 10;
      if (b.titleEn && b.titleEn.toLowerCase().includes(q)) scoreB += 10;
      if (b.tags && b.tags.some(t => t.toLowerCase().includes(q))) scoreB += 5;
      if (b.excerpt.toLowerCase().includes(q)) scoreB += 3;

      return scoreB - scoreA;
    });
  }

  return list;
}

/**
 * Execute search query with filters and pagination
 * Prepared to swap with fetch('/api/v1/search?...')
 */
export async function searchArticles({
  query = '',
  category = 'all',
  date = 'all',
  sortBy = 'relevance',
  page = 1,
  limit = 6,
  sourceArticles = null,
  simulateNetwork = true
} = {}) {
  // Simulate network latency if desired (helps verify loading skeletons)
  if (simulateNetwork) {
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const pool = sourceArticles || INITIAL_NEWS;
  let results = [...pool];

  // 1. Text filter
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter((art) => {
      const matchBn = art.title.toLowerCase().includes(q) || art.excerpt.toLowerCase().includes(q) || art.content.toLowerCase().includes(q);
      const matchEn = (art.titleEn || '').toLowerCase().includes(q) || (art.excerptEn || '').toLowerCase().includes(q);
      const matchTags = art.tags && art.tags.some(t => t.toLowerCase().includes(q));
      const matchAuthor = (art.author || '').toLowerCase().includes(q) || (art.reporterName || '').toLowerCase().includes(q);
      const matchCategory = (art.categoryName || '').toLowerCase().includes(q);
      return matchBn || matchEn || matchTags || matchAuthor || matchCategory;
    });
  }

  // 2. Category filter
  if (category && category !== 'all') {
    results = results.filter((art) => art.category === category || art.categoryName === category);
  }

  // 3. Date filter
  results = filterByDate(results, date);

  // 4. Sort
  results = sortArticles(results, sortBy, query);

  // 5. Pagination
  const total = results.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * limit;
  const paginatedData = results.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    total,
    page: currentPage,
    totalPages,
    limit
  };
}

/**
 * Autocomplete suggestions for real-time predictive search
 */
export async function getAutocompleteSuggestions(query, pool = INITIAL_NEWS) {
  if (!query || !query.trim()) {
    return { articles: [], categories: [], tags: [] };
  }

  const q = query.toLowerCase().trim();

  // 1. Matching articles (up to 4)
  const matchingArticles = pool
    .filter((a) => a.title.toLowerCase().includes(q) || (a.titleEn && a.titleEn.toLowerCase().includes(q)))
    .slice(0, 4)
    .map(a => ({
      id: a.id,
      slug: a.slug || a.id,
      title: a.title,
      titleEn: a.titleEn,
      category: a.category,
      categoryName: a.categoryName,
      image: a.image,
      publishedAt: a.publishedAt
    }));

  // 2. Matching categories (up to 3)
  const matchingCategories = CATEGORIES
    .filter(c => c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
    .slice(0, 3);

  // 3. Matching tags (up to 4)
  const allTags = Array.from(new Set(pool.flatMap(a => a.tags || [])));
  const matchingTags = allTags
    .filter(t => t.toLowerCase().includes(q))
    .slice(0, 4);

  return {
    articles: matchingArticles,
    categories: matchingCategories,
    tags: matchingTags
  };
}

/**
 * Manage recent searches in localStorage
 */
export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : ['মেট্রোরেল', 'ক্রিকেট', 'পদ্মা সেতু', 'স্টার্টআপ'];
  } catch (e) {
    return ['মেট্রোরেল', 'ক্রিকেট', 'পদ্মা সেতু'];
  }
}

export function saveRecentSearch(query) {
  if (!query || !query.trim()) return;
  try {
    const existing = getRecentSearches();
    const updated = [query.trim(), ...existing.filter(item => item.toLowerCase() !== query.toLowerCase().trim())].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage issues
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (e) {
    // Ignore
  }
}

export default {
  searchArticles,
  getAutocompleteSuggestions,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  filterByDate,
  sortArticles
};


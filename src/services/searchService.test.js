import test from 'node:test';
import assert from 'node:assert/strict';
import {
  searchArticles,
  filterByDate,
  sortArticles,
  getAutocompleteSuggestions
} from './searchService.js';
import { INITIAL_NEWS } from '../data/sampleNews.js';

test('searchArticles finds articles matching Bengali keyword', async () => {
  const result = await searchArticles({
    query: 'মেট্রোরেল',
    simulateNetwork: false
  });
  assert.ok(result.total >= 1);
  assert.ok(result.data.some(a => a.title.includes('মেট্রোরেল')));
});

test('searchArticles finds articles matching English keyword', async () => {
  const result = await searchArticles({
    query: 'metro',
    simulateNetwork: false
  });
  assert.ok(result.total >= 1);
});

test('searchArticles filters by category correctly', async () => {
  const sportsResult = await searchArticles({
    category: 'sports',
    simulateNetwork: false
  });
  assert.ok(sportsResult.total >= 1);
  sportsResult.data.forEach(a => {
    assert.equal(a.category, 'sports');
  });
});

test('filterByDate filters correctly by timeframe', () => {
  const now = new Date();
  const mockArticles = [
    { id: '1', publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() }, // 2h ago
    { id: '2', publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
    { id: '3', publishedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString() } // 40 days ago
  ];

  const todayMatches = filterByDate(mockArticles, 'today');
  assert.equal(todayMatches.length, 1);
  assert.equal(todayMatches[0].id, '1');

  const weekMatches = filterByDate(mockArticles, 'week');
  assert.equal(weekMatches.length, 2);

  const monthMatches = filterByDate(mockArticles, 'month');
  assert.equal(monthMatches.length, 2);
});

test('sortArticles sorts by popular (views descending)', () => {
  const mockArticles = [
    { id: '1', views: 50, publishedAt: '2026-11-09T00:00:00Z' },
    { id: '2', views: 200, publishedAt: '2026-11-10T00:00:00Z' },
    { id: '3', views: 100, publishedAt: '2026-11-08T00:00:00Z' }
  ];

  const sorted = sortArticles(mockArticles, 'popular');
  assert.equal(sorted[0].id, '2');
  assert.equal(sorted[1].id, '3');
  assert.equal(sorted[2].id, '1');
});

test('getAutocompleteSuggestions returns matching headlines, categories and tags', async () => {
  const suggestions = await getAutocompleteSuggestions('ক্রিকেট');
  assert.ok(suggestions.articles.length > 0 || suggestions.tags.length > 0);
});


import { test } from 'node:test';
import assert from 'node:assert';
import newsReducer, {
  addArticle,
  updateArticle,
  deleteArticle,
  updateArticleStatus,
  bulkUpdateArticleStatus,
  bulkDeleteArticles
} from './newsSlice.js';

test('newsSlice adds a new article', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const initialCount = state.articles.length;

  const newArt = {
    id: 'test-news-99',
    slug: 'test-news-99',
    title: 'পরীক্ষামূলক সংবাদ শিরোনাম',
    category: 'bangladesh',
    author: 'মোঃ লুৎফর রহমান',
    views: 0,
    status: 'draft'
  };

  const nextState = newsReducer(state, addArticle(newArt));
  assert.strictEqual(nextState.articles.length, initialCount + 1);
  assert.strictEqual(nextState.articles[0].id, 'test-news-99');
});

test('newsSlice updates an existing article', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const firstId = state.articles[0].id;

  const nextState = newsReducer(state, updateArticle({
    id: firstId,
    title: 'হালনাগাদ করা শিরোনাম'
  }));

  const updated = nextState.articles.find(a => a.id === firstId);
  assert.strictEqual(updated.title, 'হালনাগাদ করা শিরোনাম');
});

test('newsSlice deletes an article', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const targetId = state.articles[0].id;
  const initialCount = state.articles.length;

  const nextState = newsReducer(state, deleteArticle(targetId));
  assert.strictEqual(nextState.articles.length, initialCount - 1);
  assert.strictEqual(nextState.articles.find(a => a.id === targetId), undefined);
});

test('newsSlice updates article status and scheduled timestamp', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const targetId = state.articles[0].id;

  const nextState = newsReducer(state, updateArticleStatus({
    id: targetId,
    status: 'scheduled',
    scheduledAt: '2026-11-12T10:00:00Z'
  }));

  const target = nextState.articles.find(a => a.id === targetId);
  assert.strictEqual(target.status, 'scheduled');
  assert.strictEqual(target.scheduledAt, '2026-11-12T10:00:00Z');
});

test('newsSlice performs bulk status update', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const ids = [state.articles[0].id, state.articles[1].id];

  const nextState = newsReducer(state, bulkUpdateArticleStatus({
    ids,
    status: 'in_review'
  }));

  assert.strictEqual(nextState.articles.find(a => a.id === ids[0]).status, 'in_review');
  assert.strictEqual(nextState.articles.find(a => a.id === ids[1]).status, 'in_review');
});

test('newsSlice performs bulk delete', () => {
  const state = newsReducer(undefined, { type: 'unknown' });
  const ids = [state.articles[0].id, state.articles[1].id];
  const initialCount = state.articles.length;

  const nextState = newsReducer(state, bulkDeleteArticles(ids));
  assert.strictEqual(nextState.articles.length, initialCount - 2);
  assert.strictEqual(nextState.articles.find(a => ids.includes(a.id)), undefined);
});


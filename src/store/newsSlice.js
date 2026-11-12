import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_NEWS, BREAKING_NEWS_LIST, BREAKING_NEWS_LIST_EN } from '../data/sampleNews.js';

const initialState = {
  articles: INITIAL_NEWS,
  breakingNewsBn: BREAKING_NEWS_LIST,
  breakingNewsEn: BREAKING_NEWS_LIST_EN,
  selectedCategory: 'all',
  searchQuery: '',
  searchFilters: {
    query: '',
    category: 'all',
    date: 'all',
    sortBy: 'relevance',
    page: 1
  },
  activeArticleId: null,
  savedArticleIds: ['news-01', 'news-04'],
  poll: {
    question: 'মেট্রোরেলের নতুন রুট টঙ্গী ও সাভার পর্যন্ত সম্প্রসারণের সিদ্ধান্ত আপনি সমর্থন করেন কি?',
    questionEn: 'Do you support the decision to expand Dhaka Metro Rail to Tongi and Savar?',
    yes: 1840,
    no: 125,
    noOpinion: 48,
    userVoted: false
  }
};

export const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.searchFilters.query = action.payload;
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    resetSearchFilters: (state) => {
      state.searchFilters = {
        query: '',
        category: 'all',
        date: 'all',
        sortBy: 'relevance',
        page: 1
      };
      state.searchQuery = '';
    },
    setActiveArticleId: (state, action) => {
      state.activeArticleId = action.payload;
      if (action.payload) {
        const article = state.articles.find(a => a.id === action.payload || a.slug === action.payload);
        if (article) {
          article.views = (article.views || 0) + 1;
        }
      }
    },
    incrementArticleViews: (state, action) => {
      const identifier = action.payload;
      const article = state.articles.find(a => a.id === identifier || a.slug === identifier);
      if (article) {
        article.views = (article.views || 0) + 1;
      }
    },
    incrementShareCount: (state, action) => {
      const identifier = action.payload;
      const article = state.articles.find(a => a.id === identifier || a.slug === identifier);
      if (article) {
        article.shares = (article.shares || 0) + 1;
      }
    },
    toggleBookmark: (state, action) => {
      const id = action.payload;
      if (state.savedArticleIds.includes(id)) {
        state.savedArticleIds = state.savedArticleIds.filter(item => item !== id);
      } else {
        state.savedArticleIds.push(id);
      }
    },
    addComment: (state, action) => {
      const { articleId, comment } = action.payload;
      const article = state.articles.find(a => a.id === articleId || a.slug === articleId);
      if (article) {
        if (!article.commentsList) {
          article.commentsList = [];
        }
        article.commentsList.unshift(comment);
      }
    },
    likeComment: (state, action) => {
      const { articleId, commentId } = action.payload;
      const article = state.articles.find(a => a.id === articleId || a.slug === articleId);
      if (article && article.commentsList) {
        const target = article.commentsList.find(c => c.id === commentId);
        if (target) {
          target.likes = (target.likes || 0) + 1;
        }
      }
    },
    votePoll: (state, action) => {
      if (state.poll.userVoted) return;
      const choice = action.payload; // 'yes' | 'no' | 'noOpinion'
      if (state.poll[choice] !== undefined) {
        state.poll[choice] += 1;
        state.poll.userVoted = true;
      }
    },
    addArticle: (state, action) => {
      state.articles.unshift(action.payload);
    },
    updateArticle: (state, action) => {
      const index = state.articles.findIndex(a => a.id === action.payload.id || a.slug === action.payload.slug);
      if (index !== -1) {
        state.articles[index] = { ...state.articles[index], ...action.payload };
      }
    },
    deleteArticle: (state, action) => {
      state.articles = state.articles.filter(a => a.id !== action.payload && a.slug !== action.payload);
    },
    updateArticleStatus: (state, action) => {
      const { id, status } = action.payload;
      const article = state.articles.find(a => a.id === id || a.slug === id);
      if (article) {
        article.status = status;
        if (action.payload.scheduledAt) {
          article.scheduledAt = action.payload.scheduledAt;
        }
      }
    },
    bulkUpdateArticleStatus: (state, action) => {
      const { ids, status } = action.payload;
      state.articles.forEach(article => {
        if (ids.includes(article.id)) {
          article.status = status;
        }
      });
    },
    bulkDeleteArticles: (state, action) => {
      const ids = action.payload;
      state.articles = state.articles.filter(article => !ids.includes(article.id));
    },
    setWorkflowArticle: (state, action) => {
      const updated = action.payload;
      const index = state.articles.findIndex(a => a.id === updated.id);
      if (index !== -1) {
        state.articles[index] = updated;
      }
    },
    addEditorialComment: (state, action) => {
      const { articleId, comment } = action.payload;
      const article = state.articles.find(a => a.id === articleId);
      if (article) {
        if (!article.editorialFeedback) article.editorialFeedback = [];
        article.editorialFeedback.unshift(comment);
      }
    }
  }
});

export const {
  setSelectedCategory,
  setSearchQuery,
  setSearchFilters,
  resetSearchFilters,
  setActiveArticleId,
  incrementArticleViews,
  incrementShareCount,
  toggleBookmark,
  addComment,
  likeComment,
  votePoll,
  addArticle,
  updateArticle,
  deleteArticle,
  updateArticleStatus,
  bulkUpdateArticleStatus,
  bulkDeleteArticles,
  setWorkflowArticle,
  addEditorialComment
} = newsSlice.actions;

export default newsSlice.reducer;

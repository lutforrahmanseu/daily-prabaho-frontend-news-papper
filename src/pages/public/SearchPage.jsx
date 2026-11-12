import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { searchArticles } from '../../services/searchService.js';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories, usePublicArticles } from '../../hooks/usePortalData.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import SEO from '../../components/common/SEO.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PopularNews from '../../components/news/PopularNews.jsx';
import NewsletterSubscription from '../../components/common/NewsletterSubscription.jsx';
import {
  Search,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  X,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Clock,
  Flame,
  FileQuestion
} from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  // Read URL query parameters
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const dateParam = searchParams.get('date') || 'all';
  const sortParam = searchParams.get('sort') || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const { categories: apiCategories } = usePortalCategories();
  const categoryList = apiCategories.length > 0 ? apiCategories : CATEGORIES;
  const { articles, isFetching } = usePublicArticles({
    search: queryParam.trim() || undefined,
    category: categoryParam !== 'all' ? categoryParam : undefined,
    per_page: 50
  });

  // Local input state for immediate typing
  const [inputValue, setInputValue] = useState(queryParam);
  const [isPending, startTransition] = useTransition();

  // Search results state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 6
  });

  // Keep local input in sync with URL
  useEffect(() => {
    setInputValue(queryParam);
  }, [queryParam]);

  // Execute search whenever query parameters change
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    searchArticles({
      query: queryParam,
      category: categoryParam,
      date: dateParam,
      sortBy: sortParam,
      page: pageParam,
      limit: 6,
      sourceArticles: articles,
      simulateNetwork: false
    })
      .then((res) => {
        if (active) {
          setSearchResult(res);
          setLoading(isFetching);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'অনুসন্ধান প্রক্রিয়াকরণে একটি সমস্যা হয়েছে।');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [queryParam, categoryParam, dateParam, sortParam, pageParam, articles, isFetching]);

  // Helper to update URL params
  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };

    // Remove empty parameters
    Object.keys(merged).forEach((key) => {
      if (!merged[key] || merged[key] === 'all' && (key === 'category' || key === 'date')) {
        if (key !== 'q') delete merged[key];
      }
      if (key === 'page' && merged[key] === 1) {
        delete merged[key];
      }
    });

    setSearchParams(merged);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    updateParams({ q: inputValue.trim(), page: 1 });
  };

  // Date filter options
  const dateOptions = [
    { id: 'all', nameBn: 'সব সময়', nameEn: 'All Time' },
    { id: 'today', nameBn: 'গত ২৪ ঘণ্টা', nameEn: 'Past 24 Hours' },
    { id: 'week', nameBn: 'গত ৭ দিন', nameEn: 'Past 7 Days' },
    { id: 'month', nameBn: 'গত ৩০ দিন', nameEn: 'Past 30 Days' },
    { id: 'year', nameBn: 'গত ১ বছর', nameEn: 'Past Year' }
  ];

  // Sort options
  const sortOptions = [
    { id: 'relevance', nameBn: 'সর্বাধিক প্রাসঙ্গিক', nameEn: 'Most Relevant' },
    { id: 'newest', nameBn: 'সর্বশেষ প্রকাশিত', nameEn: 'Newest First' },
    { id: 'popular', nameBn: 'সর্বাধিক পঠিত', nameEn: 'Most Read' }
  ];

  // Reset all filters
  const handleResetFilters = () => {
    setInputValue('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= searchResult.totalPages) {
      updateParams({ page: newPage });
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const hasActiveFilters =
    categoryParam !== 'all' ||
    dateParam !== 'all' ||
    sortParam !== 'relevance' ||
    queryParam.trim() !== '';

  const activeCategoryObj = categoryList.find(c => c.slug === categoryParam);

  const pageTitle = queryParam
    ? `${isBn ? `"${queryParam}" অনুসন্ধানের ফলাফল` : `Search results for "${queryParam}"`}`
    : `${isBn ? 'সংবাদ অনুসন্ধান ও আর্কাইভ' : 'Search News & Archives'}`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={isBn ? 'দৈনিক বার্তা প্রবাহের সংবাদ সংগ্রহশালা থেকে যেকোনো বিষয়, তারিখ ও বিভাগ অনুসারে খবর খুঁজুন।' : 'Search daily news archives.'}
      />

      {/* Top Leaderboard Ad */}
      <AdPlacement placement="leaderboard" className="mb-4 sm:mb-6" />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 flex-wrap font-sans">
        <Link to="/" className="hover:text-rose-700 transition-colors">
          {isBn ? 'প্রচ্ছদ' : 'Home'}
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="text-rose-700 font-bold">{isBn ? 'সংবাদ অনুসন্ধান' : 'Search'}</span>
        {queryParam && (
          <>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="text-stone-700 font-medium">"{queryParam}"</span>
          </>
        )}
      </nav>

      {/* Search Header Banner & Form */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif-bn tracking-tight mb-2">
            {isBn ? 'দৈনিক বার্তা প্রবাহ অনুসন্ধান পোর্টাল' : 'Daily Prabaho Search Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-serif-bn leading-relaxed">
            {isBn
              ? 'হাজারো নির্ভরযোগ্য সংবাদ, সম্পাদকীয়, ছবি ও ভিডিও প্রতিবেদন থেকে দ্রুততম সময়ে আপনার কাঙ্ক্ষিত খবরটি খুঁজে নিন।'
              : 'Explore comprehensive national & global news archives with smart category, keyword, and date filters.'}
          </p>
        </div>

        {/* Global Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isBn ? 'কী খুঁজতে চান? শিরোনাম, বিষয় বা যেকোনো শব্দ লিখুন...' : 'Search news headlines, topics, or keywords...'}
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-3 focus:ring-rose-500 font-sans shadow-inner"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 absolute right-3 top-3 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isBn ? 'খুঁজুন' : 'Search'}</span>
            </button>
            <Link
              to={queryParam ? `/archive?q=${encodeURIComponent(queryParam)}` : '/archive'}
              className="px-4 py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{isBn ? 'পূর্ণাঙ্গ আর্কাইভ' : 'Full Archive'}</span>
            </Link>
          </div>
        </form>

        {/* Quick Trending Tags */}
        <div className="mt-4 pt-4 border-t border-stone-700/80 flex items-center gap-2 flex-wrap text-xs relative z-10">
          <span className="text-stone-400 font-semibold font-sans">
            {isBn ? 'জনপ্রিয় অনুসন্ধান:' : 'Trending:'}
          </span>
          {['মেট্রোরেল', 'ক্রিকেট', 'পদ্মা সেতু', 'স্টার্টআপ', 'নির্বাচন'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setInputValue(tag);
                updateParams({ q: tag, page: 1 });
              }}
              className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-rose-900/60 text-stone-200 hover:text-rose-200 text-xs transition-colors cursor-pointer font-serif-bn"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Canvas: 8 cols for Results + 4 cols for Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Search Results Area (8 cols) */}
        <main className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Filter Bar Controls */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-4">
            
            {/* Top row: Category Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Layers className="w-3.5 h-3.5 text-rose-700" />
                  <span>{isBn ? 'বিভাগ নির্বাচন:' : 'Categories:'}</span>
                </span>
                {categoryParam !== 'all' && (
                  <button
                    type="button"
                    onClick={() => updateParams({ category: 'all', page: 1 })}
                    className="text-[11px] text-rose-700 hover:underline cursor-pointer font-medium"
                  >
                    {isBn ? 'সকল বিভাগ দেখুন' : 'Reset category'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => updateParams({ category: 'all', page: 1 })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    categoryParam === 'all'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {isBn ? 'সব বিভাগ' : 'All'}
                </button>

                {categoryList.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => updateParams({ category: cat.slug, page: 1 })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      categoryParam === cat.slug
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {isBn ? cat.name : (cat.nameEn || cat.name)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: Publication Date Filter & Sort By Dropdowns */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Publication Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-xs font-semibold text-stone-600 font-sans">
                  {isBn ? 'প্রকাশের সময়:' : 'Date:'}
                </span>
                <select
                  value={dateParam}
                  onChange={(e) => updateParams({ date: e.target.value, page: 1 })}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-300 text-xs font-medium text-stone-800 focus:outline-rose-700 cursor-pointer"
                >
                  {dateOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isBn ? opt.nameBn : opt.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-xs font-semibold text-stone-600 font-sans">
                  {isBn ? 'সাজান:' : 'Sort by:'}
                </span>
                <select
                  value={sortParam}
                  onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-300 text-xs font-medium text-stone-800 focus:outline-rose-700 cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isBn ? opt.nameBn : opt.nameEn}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ml-auto sm:ml-2 p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={isBn ? 'ফিল্টার রিসেট' : 'Reset all filters'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-stone-600 font-serif-bn px-1">
            <div>
              {loading ? (
                <span>{isBn ? 'ফলাফল খোঁজা হচ্ছে...' : 'Searching...'}</span>
              ) : (
                <span>
                  {queryParam ? (
                    isBn ? (
                      <>
                        <strong className="text-stone-900">"{queryParam}"</strong> অনুসন্ধানে মোট{' '}
                        <strong className="text-rose-700">{toBengaliNumber(searchResult.total)}টি</strong> প্রতিবেদন পাওয়া গেছে
                      </>
                    ) : (
                      <>
                        Found <strong className="text-rose-700">{searchResult.total}</strong> articles for "
                        <strong className="text-stone-900">{queryParam}</strong>"
                      </>
                    )
                  ) : (
                    isBn ? (
                      <>
                        মোট <strong className="text-rose-700">{toBengaliNumber(searchResult.total)}টি</strong> সংবাদ প্রতিবেদন সংরক্ষিত আছে
                      </>
                    ) : (
                      <>
                        Showing <strong className="text-rose-700">{searchResult.total}</strong> total stories
                      </>
                    )
                  )}
                </span>
              )}
            </div>

            {searchResult.totalPages > 1 && (
              <span className="font-sans text-[11px] text-stone-400">
                {isBn
                  ? `পৃষ্ঠা ${toBengaliNumber(searchResult.page)} / ${toBengaliNumber(searchResult.totalPages)}`
                  : `Page ${searchResult.page} of ${searchResult.totalPages}`}
              </span>
            )}
          </div>

          {/* 1. Loading State (Skeleton Cards) */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden p-4 space-y-3">
                  <div className="aspect-16/10 bg-stone-200 rounded-lg" />
                  <div className="h-3 bg-stone-200 rounded w-1/4" />
                  <div className="h-5 bg-stone-300 rounded w-4/5" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                  <div className="h-3 bg-stone-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-700 mx-auto" />
              <h3 className="text-base font-bold text-rose-900 font-serif-bn">
                {isBn ? 'অনুসন্ধানে একটি সমস্যা হয়েছে' : 'Search Error Occurred'}
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => updateParams({ page: 1 })}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry Search'}</span>
              </button>
            </div>
          )}

          {/* 3. Empty State */}
          {!loading && !error && searchResult.data.length === 0 && (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <FileQuestion className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900 font-serif-bn mb-1">
                  {isBn ? 'কোনো সংবাদ প্রতিবেদন পাওয়া যায়নি' : 'No Articles Found'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-serif-bn max-w-md mx-auto leading-relaxed">
                  {isBn
                    ? 'আপনার প্রদত্ত শব্দ দিয়ে কোনো সংবাদ পাওয়া যায়নি। অনুগ্রহ করে বানান যাচাই করুন অথবা ভিন্ন কোনো কীওয়ার্ড দিয়ে চেষ্টা করুন।'
                    : 'We could not find any stories matching your search criteria. Please adjust your keywords or filters.'}
                </p>
              </div>

              {/* Suggestions */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-xs text-stone-500 self-center font-serif-bn">
                    {isBn ? 'এগুলো দিয়ে খুঁজতে পারেন:' : 'Try searching for:'}
                  </span>
                  {['মেট্রোরেল', 'ক্রিকেট', 'পদ্মা সেতু', 'বাজেট', 'প্রযুক্তি'].map((suggest) => (
                    <button
                      key={suggest}
                      type="button"
                      onClick={() => {
                        setInputValue(suggest);
                        updateParams({ q: suggest, page: 1, category: 'all', date: 'all' });
                      }}
                      className="px-2.5 py-1 rounded bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-medium text-stone-700 transition-colors cursor-pointer font-serif-bn"
                    >
                      {suggest}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সকল ফিল্টার রিসেট করুন' : 'Clear All Filters'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Results Grid */}
          {!loading && !error && searchResult.data.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {searchResult.data.map((article) => (
                <NewsCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          )}

          {/* 5. Pagination */}
          {!loading && searchResult.totalPages > 1 && (
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-stone-500 font-serif-bn">
                {isBn
                  ? `পৃষ্ঠা ${toBengaliNumber(searchResult.page)} এর ${toBengaliNumber(searchResult.totalPages)} · মোট ${toBengaliNumber(searchResult.total)}টি প্রতিবেদন`
                  : `Page ${searchResult.page} of ${searchResult.totalPages} · ${searchResult.total} stories`}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(searchResult.page - 1)}
                  disabled={searchResult.page === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    searchResult.page === 1
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পূর্ববর্তী' : 'Previous'}</span>
                </button>

                {Array.from({ length: searchResult.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      searchResult.page === pageNum
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isBn ? toBengaliNumber(pageNum) : pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(searchResult.page + 1)}
                  disabled={searchResult.page === searchResult.totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    searchResult.page === searchResult.totalPages
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Full-width Newsletter Banner */}
          <div className="pt-6">
            <NewsletterSubscription variant="banner" />
          </div>

        </main>

        {/* Sidebar (4 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Enhanced Popular News Component (Item 6) */}
          <PopularNews limit={5} />

          {/* Advertisement Slot */}
          <AdPlacement placement="sidebar" />

          {/* Newsletter Subscription Card (Item 10) */}
          <NewsletterSubscription variant="card" />

        </aside>

      </div>
    </>
  );
}

export default SearchPage;


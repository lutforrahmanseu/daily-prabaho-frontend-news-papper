import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetNewsArchiveQuery } from '../../store/api/epaperArchiveApi.js';
import { BENGALI_MONTHS } from '../../utils/epaperHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import SEO from '../../components/common/SEO.jsx';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Hash,
  Layers,
  Newspaper,
  RotateCcw,
  Search,
  UserCheck
} from 'lucide-react';

export function NewsArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const yearParam = searchParams.get('year') || '';
  const monthParam = searchParams.get('month') || '';
  const dateParam = searchParams.get('date') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const authorParam = searchParams.get('author') || 'all';
  const topicParam = searchParams.get('topic') || 'all';
  const keywordParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [keywordInput, setKeywordInput] = useState(keywordParam);

  useEffect(() => {
    setKeywordInput(keywordParam);
  }, [keywordParam]);

  const { data, isFetching, isLoading } = useGetNewsArchiveQuery({
    year: yearParam || undefined,
    month: monthParam || undefined,
    date: dateParam || undefined,
    category: categoryParam !== 'all' ? categoryParam : undefined,
    author: authorParam !== 'all' ? authorParam : undefined,
    topic: topicParam !== 'all' ? topicParam : undefined,
    q: keywordParam.trim() || undefined,
    sort: sortParam,
    page: pageParam,
    per_page: 12
  });

  const items = data?.items || [];
  const pagination = data?.pagination || { current_page: 1, last_page: 1, total: 0 };
  const facets = data?.facets || { years: [], months: [], categories: [], authors: [], topics: [] };
  const matchingEpapers = data?.matching_epapers || [];

  const updateFilter = (patch) => {
    const next = Object.fromEntries(searchParams.entries());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === 'all') {
        delete next[k];
      } else {
        next[k] = String(v);
      }
    });
    if (!('page' in patch)) {
      delete next.page;
    }
    setSearchParams(next);
  };

  const handleReset = () => {
    setKeywordInput('');
    setSearchParams({});
  };

  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    updateFilter({ q: keywordInput.trim(), page: 1 });
  };

  return (
    <main className="min-h-screen bg-stone-50 py-8">
      <SEO
        title={isBn ? 'সংবাদ আর্কাইভ' : 'News Archive'}
        description={
          isBn
            ? 'সাল, মাস, তারিখ, বিভাগ, লেখক, বিষয় এবং কীওয়ার্ড অনুযায়ী দৈনিক বার্তা প্রবাহের পূর্ণাঙ্গ সংবাদ আর্কাইভ।'
            : 'Explore Daily Prabaho historical news archive by year, month, date, category, author, topic, and keyword.'
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Hero Header */}
        <section className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950 text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Archive className="w-4 h-4" />
                <span>{isBn ? 'সম্পূর্ণ ঐতিহাসিক সংগ্রহশালা' : 'Complete Digital News Archive'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-bn mt-1">
                {isBn ? 'দৈনিক বার্তা প্রবাহ — সংবাদ আর্কাইভ' : 'Daily Prabaho — News Archive'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
                {isBn
                  ? 'বছর, মাস, নির্দিষ্ট দিন, বিভাগ, কলামিস্ট বা লেখক, বিষয় (টপিক) এবং কীওয়ার্ড দিয়ে যেকোনো প্রকাশিত সংবাদ খুঁজুন।'
                  : 'Search published journalism across years, months, exact dates, categories, authors, topics, and keywords.'}
              </p>
            </div>
            <Link
              to={dateParam ? `/epaper/${dateParam}` : '/epaper'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shrink-0"
            >
              <Newspaper className="w-4 h-4" />
              <span>{isBn ? 'ডিজিটাল ই-পেপার দেখুন' : 'Open E-Paper Reader'}</span>
            </Link>
          </div>

          {/* Keyword Search Form */}
          <form onSubmit={handleKeywordSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder={isBn ? 'শিরোনাম বা মূল শব্দ লিখে খুঁজুন...' : 'Search by headline or keyword...'}
                aria-label={isBn ? 'কীওয়ার্ড লিখুন' : 'Search archive keyword'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-stone-900 text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              {isBn ? 'আর্কাইভে খুঁজুন' : 'Search Archive'}
            </button>
          </form>
        </section>

        {/* 7-Dimension Filter Controls */}
        <section
          aria-label={isBn ? 'আর্কাইভ ফিল্টার' : 'Archive Filters'}
          className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold font-serif-bn text-stone-900">
              {isBn ? 'বিস্তারিত অনুসন্ধান ফিল্টার' : 'Multi-Dimensional Filters'}
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'সব ফিল্টার মুছুন' : 'Clear All Filters'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* 1. Year */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">
                {isBn ? 'বছর (Year)' : 'Year'}
              </label>
              <select
                value={yearParam}
                onChange={(e) => updateFilter({ year: e.target.value, date: '' })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              >
                <option value="">{isBn ? 'সব বছর' : 'All Years'}</option>
                {(facets.years || []).map((y) => (
                  <option key={y.year} value={y.year}>
                    {isBn ? `${toBengaliNumber(y.year)} (${toBengaliNumber(y.count)})` : `${y.year} (${y.count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Month */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">
                {isBn ? 'মাস (Month)' : 'Month'}
              </label>
              <select
                value={monthParam}
                onChange={(e) => updateFilter({ month: e.target.value, date: '' })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              >
                <option value="">{isBn ? 'সব মাস' : 'All Months'}</option>
                {BENGALI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isBn ? m.nameBn : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Exact Date */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-700" />
                <span>{isBn ? 'নির্দিষ্ট তারিখ (Date)' : 'Exact Date'}</span>
              </label>
              <input
                type="date"
                value={dateParam}
                onChange={(e) => updateFilter({ date: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              />
            </div>

            {/* 4. Category */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-rose-700" />
                <span>{isBn ? 'বিভাগ (Category)' : 'Category'}</span>
              </label>
              <select
                value={categoryParam}
                onChange={(e) => updateFilter({ category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              >
                <option value="all">{isBn ? 'সব বিভাগ' : 'All Categories'}</option>
                {(facets.categories || []).map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {isBn ? cat.name : cat.name_en || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Author */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-rose-700" />
                <span>{isBn ? 'লেখক / কলামিস্ট' : 'Author'}</span>
              </label>
              <select
                value={authorParam}
                onChange={(e) => updateFilter({ author: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              >
                <option value="all">{isBn ? 'সব লেখক' : 'All Authors'}</option>
                {(facets.authors || []).map((au) => (
                  <option key={au.id} value={au.slug || au.id}>
                    {au.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Topic / Tag */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-rose-700" />
                <span>{isBn ? 'বিষয় / টপিক' : 'Topic / Tag'}</span>
              </label>
              <select
                value={topicParam}
                onChange={(e) => updateFilter({ topic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
              >
                <option value="all">{isBn ? 'সব বিষয়' : 'All Topics'}</option>
                {(facets.topics || []).map((tp) => (
                  <option key={tp.id} value={tp.slug}>
                    {tp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Quick Facet Chips */}
          {facets.years?.length > 0 && (
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-stone-500 text-[11px]">
                  {isBn ? 'বছরভিত্তিক দ্রুত বাছাই:' : 'Quick Years:'}
                </span>
                {facets.years.map((y) => (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => updateFilter({ year: String(y.year), date: '' })}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                      String(yearParam) === String(y.year)
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                    }`}
                  >
                    {isBn ? toBengaliNumber(y.year) : y.year} ({isBn ? toBengaliNumber(y.count) : y.count})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-stone-500">{isBn ? 'সাজান:' : 'Sort:'}</span>
                <select
                  value={sortParam}
                  onChange={(e) => updateFilter({ sort: e.target.value })}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                >
                  <option value="newest">{isBn ? 'সর্বশেষ আগে' : 'Newest First'}</option>
                  <option value="oldest">{isBn ? 'পুরোনো আগে' : 'Oldest First'}</option>
                  <option value="popular">{isBn ? 'সর্বাধিক পঠিত' : 'Most Read'}</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Matching E-Paper Editions for Selected Date/Month/Year */}
        {matchingEpapers.length > 0 && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Newspaper className="w-5 h-5 text-rose-700 shrink-0" />
              <div>
                <h3 className="text-xs font-extrabold text-stone-900 font-serif-bn">
                  {isBn ? 'এই সময়ের প্রকাশিত ডিজিটাল ই-পেপার সংখ্যা:' : 'Matching Digital E-Paper Editions:'}
                </h3>
                <p className="text-[11px] text-stone-600">
                  {isBn ? 'সরাসরি প্রিন্ট-লেআউট PDF সংস্করণ পড়ুন' : 'Open the print replica E-paper directly'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchingEpapers.map((ep) => (
                <Link
                  key={ep.id}
                  to={`/epaper/edition/${ep.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:border-rose-500 text-xs font-bold text-rose-800"
                >
                  {ep.publication_date} · {isBn ? ep.edition_name_bn : ep.edition_name_en}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs text-stone-600 px-1">
          <span>
            {isBn
              ? `মোট ${toBengaliNumber(pagination.total || 0)}টি প্রকাশিত সংবাদ পাওয়া গেছে`
              : `${pagination.total || 0} published articles found`}
            {isFetching && (isBn ? ' · হালনাগাদ হচ্ছে...' : ' · Updating...')}
          </span>
          {pagination.last_page > 1 && (
            <span>
              {isBn
                ? `পৃষ্ঠা ${toBengaliNumber(pagination.current_page)} / ${toBengaliNumber(pagination.last_page)}`
                : `Page ${pagination.current_page} / ${pagination.last_page}`}
            </span>
          )}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
            {isBn ? 'আর্কাইভ অনুসন্ধান করা হচ্ছে...' : 'Searching news archive...'}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center space-y-3">
            <Archive className="w-10 h-10 text-stone-400 mx-auto" />
            <h2 className="text-lg font-bold text-stone-800 font-serif-bn">
              {isBn ? 'কোনো সংবাদ পাওয়া যায়নি' : 'No Matching Archived News Found'}
            </h2>
            <p className="text-xs text-stone-500">
              {isBn
                ? 'অনুগ্রহ করে তারিখ বা অন্য ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                : 'Try broadening the date, year, or keyword filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((article) => (
              <NewsCard key={article.id} article={article} variant="grid" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={pagination.current_page <= 1}
              onClick={() => updateFilter({ page: pagination.current_page - 1 })}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isBn ? 'পূর্ববর্তী' : 'Previous'}</span>
            </button>
            <span className="text-xs font-bold text-stone-700">
              {isBn
                ? `${toBengaliNumber(pagination.current_page)} / ${toBengaliNumber(pagination.last_page)}`
                : `${pagination.current_page} / ${pagination.last_page}`}
            </span>
            <button
              type="button"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => updateFilter({ page: pagination.current_page + 1 })}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default NewsArchivePage;


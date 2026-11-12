import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories, usePublicArticles } from '../../hooks/usePortalData.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import SEO from '../../components/common/SEO.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PopularNews from '../../components/news/PopularNews.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import MarketExchangeWidget from '../../components/news/MarketExchangeWidget.jsx';
import FollowTargetButton from '../../components/reader/FollowTargetButton.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  ChevronRight,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Hash,
  Filter
} from 'lucide-react';

export function CategoryPage() {
  const { slug, subcategory } = useParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { categories: apiCategories, isLoading: loadingCats } = usePortalCategories();
  const { articles: apiArticles, isLoading: loadingNews } = usePublicArticles(
    { category: slug, subcategory: subcategory || undefined, per_page: 50 },
    { skip: !slug }
  );

  // Flatten parent + child categories from Laravel taxonomy tree, fallback while initial load runs
  const allCategoryPool = apiCategories.length > 0
    ? apiCategories.flatMap((c) => [c, ...(c.subcategories || [])])
    : CATEGORIES;

  // 1. Find category config
  const categoryConfig = allCategoryPool.find(
    (c) => c.slug === slug || String(c.id) === String(slug)
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Reset page to 1 whenever category or subcategory changes
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug, subcategory]);

  if ((loadingCats || loadingNews) && !categoryConfig) {
    return (
      <div className="w-full py-6 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-stone-200 rounded-xl" />
          <div className="h-64 bg-stone-200 rounded-xl" />
          <div className="h-64 bg-stone-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // If category not found
  if (!categoryConfig) {
    return (
      <div className="py-16 text-center max-w-xl mx-auto px-4">
        <SEO title={isBn ? 'বিভাগ পাওয়া যায়নি' : 'Category Not Found'} />
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn mb-3">
          {isBn ? 'বিভাগটি খুঁজে পাওয়া যায়নি' : 'Category Not Found'}
        </h1>
        <p className="text-stone-600 text-sm mb-6 font-serif-bn">
          {isBn
            ? 'আপনি যে বিভাগের সংবাদ খুঁজছেন তা তালিকায় নেই।'
            : 'The category you are looking for does not exist.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Return to Frontpage'}</span>
        </Link>
      </div>
    );
  }

  const categoryTitle = isBn ? categoryConfig.name : categoryConfig.nameEn;
  const categoryDescription = categoryConfig.description;
  const subcategoriesList = categoryConfig.subcategories || [];

  // Find subcategory object if URL has subcategory param
  const currentSubcatObj = subcategoriesList.find(
    (s) => s.slug === subcategory
  );
  const subcategoryTitle = currentSubcatObj
    ? (isBn ? currentSubcatObj.name : currentSubcatObj.nameEn)
    : null;

  // Articles returned by Laravel API for this category/subcategory
  const categoryArticles = apiArticles;

  // Featured story (First lead or first article)
  const featuredStory = categoryArticles.find((a) => a.isLead || a.isFeatured) || categoryArticles[0];

  // Remaining articles for latest section & news cards
  const remainingArticles = categoryArticles.filter((a) => a.id !== featuredStory?.id);

  // Latest 2 stories
  const latestStories = remainingArticles.slice(0, 2);

  // Articles for pagination grid
  const gridArticles = remainingArticles.slice(2);

  // Pagination calculation
  const totalItems = gridArticles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = gridArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const pageTitle = subcategoryTitle
    ? `${subcategoryTitle} - ${categoryTitle}`
    : `${categoryTitle} বিভাগ`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={`${categoryTitle}: ${categoryDescription}`}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        category={categoryTitle}
      />

      {/* Top Leaderboard Advertisement Slot */}
      <AdPlacement placement="leaderboard" className="mb-4 sm:mb-6" />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 flex-wrap font-sans">
        <Link to="/" className="hover:text-rose-700 transition-colors">
          {isBn ? 'প্রচ্ছদ' : 'Home'}
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <Link
          to={`/category/${categoryConfig.slug}`}
          className={`hover:text-rose-700 transition-colors ${!subcategory ? 'text-rose-700 font-bold' : ''}`}
        >
          {categoryTitle}
        </Link>
        {subcategoryTitle && (
          <>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="text-rose-700 font-bold">{subcategoryTitle}</span>
          </>
        )}
      </nav>

      {/* Category Header Banner */}
      <header className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-md">
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryConfig.color || '#dc2626' }}
            />
            <span className="text-xs uppercase font-bold tracking-wider text-stone-300 font-sans">
              {categoryConfig.nameEn} Section
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-bn tracking-tight mb-3">
            {subcategoryTitle ? `${categoryTitle} · ${subcategoryTitle}` : categoryTitle}
          </h1>

          <p className="text-sm sm:text-base text-stone-300 font-serif-bn leading-relaxed">
            {categoryDescription}
          </p>

          <div className="mt-4">
            <FollowTargetButton
              type="category"
              targetId={categoryConfig.id}
              targetSlug={categoryConfig.slug}
              label={isBn ? `${categoryTitle} বিভাগ অনুসরণ করুন` : `Follow ${categoryTitle}`}
            />
          </div>
        </div>

        {/* Subcategories Pills Navigation */}
        {subcategoriesList.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-700/80 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10">
            <span className="text-xs font-bold text-stone-400 shrink-0 font-sans">
              {isBn ? 'উপ-বিভাগ:' : 'Subcategories:'}
            </span>

            {/* All Subcategories Button */}
            <Link
              to={`/category/${categoryConfig.slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                !subcategory
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-200'
              }`}
            >
              {isBn ? 'সব খবর' : 'All Stories'}
            </Link>

            {subcategoriesList.map((sub) => {
              const isActive = subcategory === sub.slug;
              return (
                <Link
                  key={sub.slug}
                  to={`/category/${categoryConfig.slug}/${sub.slug}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-stone-800/80 hover:bg-stone-700 text-stone-200'
                  }`}
                >
                  {isBn ? sub.name : sub.nameEn}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Layout with 8+4 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Content (8 cols on desktop) */}
        <main className="lg:col-span-8 flex flex-col space-y-10">
          
          {categoryArticles.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
              <p className="text-stone-500 text-sm font-serif-bn">
                {isBn ? 'এই মুহূর্তে এই বিভাগে কোনো সংবাদ পাওয়া যায়নি।' : 'No articles found in this category section.'}
              </p>
              <Link
                to={`/category/${categoryConfig.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800 transition-colors"
              >
                <span>{isBn ? 'বিভাগের প্রধান পাতায় ফিরে যান' : 'Back to Category Front'}</span>
              </Link>
            </div>
          ) : (
            <>
              {/* 1. Featured Story (Hero layout) */}
              {featuredStory && (
                <section aria-label="Featured Story" className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                    <h2 className="text-sm font-bold text-stone-900 font-serif-bn uppercase tracking-wider">
                      {isBn ? 'প্রধান সংবাদ' : 'Featured Story'}
                    </h2>
                  </div>

                  <NewsCard article={featuredStory} variant="lead" />
                </section>
              )}

              {/* 2. Latest Stories (2 secondary highlighted stories) */}
              {latestStories.length > 0 && (
                <section aria-label="Latest Stories" className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
                      {isBn ? 'তাজা খবর' : 'Latest Stories'}
                    </h3>
                    <span className="text-xs text-stone-400 font-sans">
                      {isBn ? 'সর্বশেষ আপডেট' : 'Latest updates'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {latestStories.map((story) => (
                      <NewsCard key={story.id} article={story} variant="grid" />
                    ))}
                  </div>
                </section>
              )}

              {/* Mid-feed Advertisement */}
              <AdPlacement placement="in_feed" />

              {/* 3. News Cards Archive with Pagination */}
              <section aria-label="Category News Archive" className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h3 className="text-base font-bold text-stone-900 font-serif-bn">
                    {isBn ? 'আরও সংবাদ' : 'More Stories'}
                  </h3>
                  <span className="text-xs text-stone-500 font-serif-bn">
                    {isBn
                      ? `মোট ${toBengaliNumber(categoryArticles.length)}টি প্রতিবেদনের মধ্যে`
                      : `Total ${categoryArticles.length} articles`}
                  </span>
                </div>

                {paginatedArticles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {paginatedArticles.map((story) => (
                      <NewsCard key={story.id} article={story} variant="grid" />
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs py-4 text-center font-serif-bn">
                    {isBn ? 'এই পাতায় কোনো অতিরিক্ত সংবাদ নেই।' : 'No additional stories on this page.'}
                  </p>
                )}

                {/* 4. Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-stone-500 font-serif-bn">
                      {isBn
                        ? `পৃষ্ঠা ${toBengaliNumber(currentPage)} এর ${toBengaliNumber(totalPages)}`
                        : `Page ${currentPage} of ${totalPages}`}
                    </p>

                    <div className="flex items-center gap-1.5">
                      {/* Prev Button */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === 1
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                        }`}
                        aria-label="Previous page"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{isBn ? 'পূর্ববর্তী' : 'Previous'}</span>
                      </button>

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-rose-700 text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {isBn ? toBengaliNumber(pageNum) : pageNum}
                        </button>
                      ))}

                      {/* Next Button */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === totalPages
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                        }`}
                        aria-label="Next page"
                      >
                        <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

        </main>

        {/* 5. Category Sidebar (4 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Popular in Category or Overall */}
          <PopularNews limit={5} />

          {/* Category Advertisement Slot */}
          <AdPlacement placement="sidebar" />

          {/* Trending Category Tags */}
          {subcategoriesList.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100">
                <Hash className="w-4 h-4 text-rose-700" />
                <h4 className="text-sm font-bold text-stone-900 font-serif-bn">
                  {isBn ? `${categoryTitle} বিশেষ বিষয়সমূহ` : `${categoryTitle} Topics`}
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {subcategoriesList.map((sub) => (
                  <Link
                    key={sub.slug}
                    to={`/category/${categoryConfig.slug}/${sub.slug}`}
                    className="text-xs font-medium px-2.5 py-1 rounded bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 transition-colors"
                  >
                    #{isBn ? sub.name : sub.nameEn}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reader Poll Widget */}
          <TodayPollWidget />

          {/* Currency and Market Widget */}
          <MarketExchangeWidget />

        </aside>

      </div>
    </>
  );
}

export default CategoryPage;


import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetTagsQuery } from '../../store/api/tagApi.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import SEO from '../../components/common/SEO.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PopularNews from '../../components/news/PopularNews.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import FollowTargetButton from '../../components/reader/FollowTargetButton.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  Hash,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

export function TagPage() {
  const { slug } = useParams();
  const decodedTag = decodeURIComponent(slug || '');
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { articles: taggedArticles } = usePublicArticles(
    { tag: decodedTag, per_page: 50 },
    { skip: !decodedTag }
  );
  const { data: tagsResponse } = useGetTagsQuery({ per_page: 50 });

  // Extract related tags from DB tag taxonomy or article tags
  const dbTagNames = (tagsResponse?.items || []).map((t) => t.name || t.slug).filter(Boolean);
  const allTags = Array.from(
    new Set([...dbTagNames, ...taggedArticles.flatMap((a) => a.tags || [])])
  ).filter((t) => t.toLowerCase() !== decodedTag.toLowerCase());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const totalItems = taggedArticles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = taggedArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO
        title={`#${decodedTag} - সম্পর্কিত সকল সংবাদ`}
        description={`#${decodedTag} বিষয়ক দেশ ও বিদেশের সর্বশেষ গুরুত্বপূর্ণ খবর, অনুসন্ধান ও বিশ্লেষণ।`}
        tags={[decodedTag]}
      />

      {/* Top Leaderboard Advertisement Slot */}
      <AdPlacement placement="leaderboard" className="mb-4 sm:mb-6" />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 flex-wrap font-sans">
        <Link to="/" className="hover:text-rose-700 transition-colors">
          {isBn ? 'প্রচ্ছদ' : 'Home'}
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span>{isBn ? 'বিষয়ভিত্তিক সংবাদ' : 'Topic Tag'}</span>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="text-rose-700 font-bold">#{decodedTag}</span>
      </nav>

      {/* Tag Header Banner */}
      <header className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Hash className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider font-sans">
              {isBn ? 'আলোচিত বিষয়' : 'Topic Tag'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif-bn tracking-tight mt-0.5">
              #{decodedTag}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-serif-bn mt-1">
              {isBn
                ? `এই বিষয়ে মোট ${toBengaliNumber(taggedArticles.length)}টি প্রতিবেদন প্রকাশিত হয়েছে`
                : `${taggedArticles.length} published stories on this topic`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <FollowTargetButton
            type="tag"
            targetId={
              (tagsResponse?.items || []).find(
                (t) => t.slug === slug || t.name === decodedTag
              )?.id || null
            }
            targetSlug={slug || decodedTag}
            label={isBn ? 'বিষয় অনুসরণ করুন' : 'Follow Topic'}
          />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isBn ? 'প্রচ্ছদে ফিরুন' : 'Back to Home'}</span>
          </Link>
        </div>
      </header>

      {/* Main Grid: Articles + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Content (8 cols) */}
        <main className="lg:col-span-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
              {isBn ? 'সর্বশেষ প্রকাশিত সংবাদ' : 'Latest Tagged Stories'}
            </h2>
            <span className="text-xs text-stone-500 font-serif-bn">
              {isBn
                ? `পৃষ্ঠা ${toBengaliNumber(currentPage)} এর ${toBengaliNumber(totalPages)}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
          </div>

          {paginatedArticles.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
              <p className="text-stone-500 text-sm font-serif-bn">
                {isBn ? 'এই ট্যাগের অধীনে কোনো সংবাদ পাওয়া যায়নি।' : 'No articles found with this tag.'}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800 transition-colors"
              >
                <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Back to Frontpage'}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {paginatedArticles.map((story) => (
                <NewsCard key={story.id} article={story} variant="grid" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-stone-500 font-serif-bn">
                {isBn
                  ? `পৃষ্ঠা ${toBengaliNumber(currentPage)} এর ${toBengaliNumber(totalPages)}`
                  : `Page ${currentPage} of ${totalPages}`}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 1
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পূর্ববর্তী' : 'Previous'}</span>
                </button>

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

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === totalPages
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
        </main>

        {/* Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <PopularNews limit={5} />
          <AdPlacement placement="sidebar" />

          {/* Related Tags Cloud */}
          {allTags.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100">
                <Hash className="w-4 h-4 text-rose-700" />
                <h4 className="text-sm font-bold text-stone-900 font-serif-bn">
                  {isBn ? 'অন্যান্য সম্পর্কিত বিষয়' : 'Related Topics'}
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => (
                  <Link
                    key={t}
                    to={`/tag/${encodeURIComponent(t)}`}
                    className="text-xs font-medium px-2.5 py-1 rounded bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 transition-colors"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <TodayPollWidget />
        </aside>

      </div>
    </>
  );
}

export default TagPage;


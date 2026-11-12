import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetRelatedNewsQuery } from '../../store/api/newsApi.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import NewsCard from './NewsCard.jsx';
import { Sparkles } from 'lucide-react';

export function RelatedNews({
  currentArticleId,
  category,
  subcategory = null,
  tags = [],
  limit = 4,
  className = ''
}) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data: relatedApi = [], isLoading: loadingRelated } = useGetRelatedNewsQuery(currentArticleId, {
    skip: !currentArticleId
  });
  const { articles: categoryPool, isLoading: loadingPool } = usePublicArticles(
    { category: category || undefined, per_page: limit + 4 },
    { skip: relatedApi.length > 0 }
  );

  const loading = loadingRelated && loadingPool;
  const fallbackRelated = categoryPool
    .filter((a) => a.id !== currentArticleId && a.slug !== currentArticleId)
    .slice(0, limit);
  const related = relatedApi.length > 0 ? relatedApi.slice(0, limit) : fallbackRelated;

  if (!loading && related.length === 0) return null;

  return (
    <section aria-label="Related Stories" className={`pt-8 border-t-2 border-stone-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-bn">
            {isBn ? 'সম্পর্কিত অন্যান্য সংবাদ' : 'Related Stories'}
          </h3>
        </div>

        {category && (
          <Link
            to={`/category/${category}`}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 transition-colors"
          >
            {isBn ? 'এই বিভাগের আরও খবর →' : 'More in this section →'}
          </Link>
        )}
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
              <div className="aspect-16/10 bg-stone-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-stone-200 rounded w-1/3" />
                <div className="h-4 bg-stone-300 rounded w-4/5" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {related.map((story) => (
            <NewsCard key={story.id} article={story} variant="grid" />
          ))}
        </div>
      )}
    </section>
  );
}

export default RelatedNews;

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toggleBookmark } from '../../store/newsSlice.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import { formatBengaliRelativeTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { Clock, Bookmark, ChevronRight, Newspaper } from 'lucide-react';
import { EDITORIAL_EASE, SPRING_SNAPPY, EditorialReveal } from '../common/MotionPrimitives.jsx';

export function LatestNewsGrid() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { savedArticleIds } = useSelector((state) => state.news);

  const [filterCategory, setFilterCategory] = useState('all');
  const { articles } = usePublicArticles(
    filterCategory === 'all' ? { per_page: 12 } : { category: filterCategory, per_page: 12 }
  );
  const isBn = language === 'bn';

  // Sort articles by latest timestamp
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const filteredArticles = sortedArticles;

  const displayArticles = filteredArticles.slice(0, 6);

  const filterTabs = [
    { id: 'all', nameBn: 'সকল সর্বশেষ', nameEn: 'All Latest' },
    { id: 'bangladesh', nameBn: 'বাংলাদেশ', nameEn: 'Bangladesh' },
    { id: 'politics', nameBn: 'রাজনীতি', nameEn: 'Politics' },
    { id: 'economy', nameBn: 'বাণিজ্য', nameEn: 'Business' },
    { id: 'sports', nameBn: 'খেলা', nameEn: 'Sports' }
  ];

  return (
    <EditorialReveal as="section" className="mb-10 pt-4 border-t border-stone-200">
      {/* Header with Department Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-5 border-b-2 border-stone-900 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-rose-700 inline-block rounded-xs"></span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-serif-bn tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-700" />
            <span>{isBn ? 'সর্বশেষ সংবাদ গ্রিড' : 'Latest News Grid'}</span>
          </h2>
        </div>

        {/* Clean Segmented Filter Controls */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {filterTabs.map((tab) => {
            const isActive = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                className={`relative px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="latest-grid-filter-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 bg-rose-700 rounded-full shadow-xs"
                  />
                )}
                <span className="relative z-10">{isBn ? tab.nameBn : tab.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Latest Stories */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filterCategory}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {displayArticles.map((story, idx) => {
            const isBookmarked = savedArticleIds.includes(story.id);
            const title = isBn ? story.title : (story.titleEn || story.title);
            const excerpt = isBn ? story.excerpt : (story.excerptEn || story.excerpt);
            const categoryName = isBn ? story.categoryName : (story.categoryNameEn || story.categoryName);
            const timeAgo = isBn ? formatBengaliRelativeTime(story.publishedAt) : 'Recently';

            return (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.035, ease: EDITORIAL_EASE }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/news/${story.slug || story.id}`)}
                className="group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-shadow duration-200 flex flex-col justify-between"
              >
              <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                <img
                  src={story.image}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {categoryName}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5 font-medium">
                    <Clock className="w-3 h-3 text-rose-600" />
                    <span>{timeAgo}</span>
                    <span>·</span>
                    <span>{story.author}</span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug line-clamp-2 mb-2">
                    {title}
                  </h3>

                  <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                    {excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 mt-3">
                  <span className="text-[11px] font-semibold text-rose-700 group-hover:underline flex items-center gap-0.5">
                    {isBn ? 'বিস্তারিত পড়ুন' : 'Read Full Story'}
                    <ChevronRight className="w-3 h-3" />
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(toggleBookmark(story.id));
                    }}
                    className="p-1 rounded hover:text-rose-700 transition-colors cursor-pointer"
                    aria-label="Bookmark news"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
                  </motion.button>
                </div>

              </div>
            </motion.article>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </EditorialReveal>
  );
}

export default LatestNewsGrid;

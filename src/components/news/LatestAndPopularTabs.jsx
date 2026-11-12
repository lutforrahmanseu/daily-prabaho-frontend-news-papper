import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { usePublicArticles, usePopularArticles } from '../../hooks/usePortalData.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import { Flame, Clock } from 'lucide-react';
import { EDITORIAL_EASE, SPRING_SNAPPY } from '../common/MotionPrimitives.jsx';

export function LatestAndPopularTabs() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { articles: latestPool } = usePublicArticles({ per_page: 8 });
  const { articles: popularPool } = usePopularArticles({ limit: 5 });

  const [activeTab, setActiveTab] = useState('latest'); // 'latest' | 'popular'
  const isBn = language === 'bn';

  // Latest sorted by publishedAt
  const latestArticles = [...latestPool]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 5);

  // Popular sorted by views
  const popularArticles = (popularPool.length > 0 ? popularPool : [...latestPool].sort((a, b) => (b.views || 0) - (a.views || 0))).slice(0, 5);

  const displayList = activeTab === 'latest' ? latestArticles : popularArticles;

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
      {/* Tabs Header */}
      <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50">
        {[
          { id: 'latest', Icon: Clock, iconClass: 'text-rose-700', label: isBn ? 'সর্বশেষ' : 'Latest News' },
          { id: 'popular', Icon: Flame, iconClass: 'text-amber-600', label: isBn ? 'সর্বাধিক পঠিত' : 'Most Read' }
        ].map((tab) => {
          const TabIcon = tab.Icon;
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                isTabActive
                  ? 'bg-white text-rose-700'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${tab.iconClass}`} />
              <span>{tab.label}</span>
              {isTabActive && (
                <motion.span
                  layoutId="sidebar-tabs-underline"
                  transition={SPRING_SNAPPY}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Ranked List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
          className="divide-y divide-stone-100 p-2 sm:p-3"
        >
          {displayList.map((art, idx) => {
            const rank = isBn ? toBengaliNumber(idx + 1) : idx + 1;
            const title = isBn ? art.title : (art.titleEn || art.title);
            const timeAgo = isBn ? formatBengaliRelativeTime(art.publishedAt) : 'Recently';

            return (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03, ease: EDITORIAL_EASE }}
                onClick={() => navigate(`/news/${art.slug || art.id}`)}
                className="group flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
              >
                {/* Number Badge */}
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-stone-100 text-stone-700 group-hover:bg-rose-700 group-hover:text-white font-bold text-sm shrink-0 transition-colors">
                  {rank}
                </span>

                {/* Title & Metadata */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
                    <span className="text-rose-700 font-semibold">{art.categoryName}</span>
                    <span>·</span>
                    <span>{timeAgo}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-rose-800 font-serif-bn leading-snug line-clamp-2">
                    {title}
                  </h4>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default LatestAndPopularTabs;

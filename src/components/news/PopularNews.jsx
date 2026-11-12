import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { usePopularArticles, usePublicArticles } from '../../hooks/usePortalData.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import { Flame, Eye, Clock, TrendingUp } from 'lucide-react';
import { EDITORIAL_EASE, SPRING_SNAPPY } from '../common/MotionPrimitives.jsx';

export function PopularNews({
  category = null,
  limit = 5,
  variant = 'card', // 'card' | 'minimal' | 'horizontal'
  className = ''
}) {
  const { language } = useSelector((state) => state.ui);
  const [timeframe, setTimeframe] = useState('24h'); // '24h' | '7d' | '30d'
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
  const { articles: popularRaw } = usePopularArticles({ limit: limit * 2, days });
  const { articles: fallbackRaw } = usePublicArticles({ per_page: 20 });
  const articles = popularRaw.length > 0 ? popularRaw : fallbackRaw;
  const isBn = language === 'bn';

  // Filter by category if requested
  const pool = category
    ? articles.filter(a => a.category === category || a.categoryName === category)
    : articles;

  // Sort by views descending
  const popularArticles = [...pool]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);

  return (
    <div className={`bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs ${className}`}>
      {/* Header with Title and Timeframe Toggle */}
      <div className="p-4 bg-gradient-to-r from-rose-50/80 to-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-700 text-white shadow-2xs">
            <Flame className="w-4 h-4 fill-current" />
          </span>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif-bn leading-tight">
              {isBn ? 'সর্বাধিক পঠিত সংবাদ' : 'Most Popular Stories'}
            </h3>
            <span className="text-[10px] text-stone-500 font-sans">
              {isBn ? 'পাঠকদের পছন্দের শীর্ষ তালিকা' : 'Top trending reader favorites'}
            </span>
          </div>
        </div>

        {/* 24h / 7d / 30d Toggle */}
        <div className="flex items-center bg-stone-200/80 rounded-lg p-0.5 text-[11px] font-sans">
          {[
            { id: '24h', label: isBn ? '২৪ঘণ্টা' : '24h', hideMobile: false },
            { id: '7d', label: isBn ? '৭দিন' : '7d', hideMobile: false },
            { id: '30d', label: isBn ? '৩০দিন' : '30d', hideMobile: true }
          ].map((item) => {
            const isActive = timeframe === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeframe(item.id)}
                className={`relative px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  item.hideMobile ? 'hidden sm:block' : ''
                } ${isActive ? 'font-bold text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="popular-timeframe-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 bg-white rounded-md shadow-xs"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranked News List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={timeframe}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: EDITORIAL_EASE }}
          className="divide-y divide-stone-100 p-2"
        >
          {popularArticles.map((story, index) => {
            const rank = isBn ? toBengaliNumber(index + 1) : index + 1;
            const title = isBn ? story.title : (story.titleEn || story.title);
            const timeAgo = isBn ? formatBengaliRelativeTime(story.publishedAt) : 'Recently';
            const views = isBn ? toBengaliNumber((story.views || 0).toLocaleString('bn-BD')) : (story.views || 0).toLocaleString();

            return (
              <Link
                key={story.id}
                to={`/news/${story.slug || story.id}`}
                className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
              >
                {/* Rank Counter */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 transition-colors ${
                    index === 0
                      ? 'bg-rose-700 text-white shadow-xs'
                      : index === 1
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-100 text-stone-600 group-hover:bg-rose-50 group-hover:text-rose-700'
                  }`}
                >
                  {rank}
                </span>

                {/* Story Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1 flex-wrap">
                    <span className="text-rose-700 font-bold">{story.categoryName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3 text-stone-400" />
                      <span className="font-serif-bn">{views} {isBn ? 'পঠিত' : 'reads'}</span>
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline text-stone-400 font-serif-bn">{timeAgo}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-rose-800 font-serif-bn leading-snug line-clamp-2">
                    {title}
                  </h4>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default PopularNews;


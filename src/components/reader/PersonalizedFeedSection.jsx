import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsReaderAuthenticated, selectReaderUser } from '../../store/readerSlice.js';
import {
  useGetPersonalizedFeedQuery,
  useGetRecentlyViewedNewsQuery
} from '../../store/api/readerApi.js';
import { getPersonalizationReasonLabels } from '../../utils/readerHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import NewsCard from '../news/NewsCard.jsx';
import { Sparkles, History, SlidersHorizontal, ArrowRight, UserPlus } from 'lucide-react';

export function PersonalizedFeedSection() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);

  const { data: feedData, isLoading: loadingFeed } = useGetPersonalizedFeedQuery(
    { limit: 6 },
    { skip: !isReaderAuth }
  );
  const { data: recentItems = [] } = useGetRecentlyViewedNewsQuery(5, { skip: !isReaderAuth });

  if (!isReaderAuth) {
    return (
      <section className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-5 sm:p-6 shadow-md border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-700/40 border border-rose-500/40 text-rose-200 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'ব্যক্তিগতকৃত সংবাদ অভিজ্ঞতা' : 'Personalized Newsroom Experience'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-serif-bn">
            {isBn
              ? 'আপনার পছন্দের বিভাগ, লেখক ও বিষয় অনুযায়ী সংবাদ পাতা সাজিয়ে নিন'
              : 'Personalize your front page by following topics, sections & journalists'}
          </h2>
          <p className="text-xs text-stone-300 font-serif-bn">
            {isBn
              ? 'বুকমার্ক, পড়ার ইতিহাস, নিউজলেটার ও পুশ নোটিফিকেশন নিয়ন্ত্রণ করুন পূর্ণ প্রাইভেসি সুরক্ষাসহ।'
              : 'Sync bookmarks, reading history, and digest controls across devices with strict privacy protection.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/reader/register"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isBn ? 'বিনামূল্যে নিবন্ধন করুন' : 'Create Reader Account'}</span>
          </Link>
          <Link
            to="/reader/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <span>{isBn ? 'পাঠক লগইন' : 'Reader Sign In'}</span>
          </Link>
        </div>
      </section>
    );
  }

  const items = feedData?.items || [];
  const meta = feedData?.meta || {};
  const reasonsById = meta?.reasons_by_id || {};

  return (
    <section className="space-y-5 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-bn">
              {isBn
                ? `${readerUser?.display_name || readerUser?.name}-এর জন্য নির্বাচিত সংবাদ`
                : `For You, ${readerUser?.display_name || readerUser?.name}`}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {isBn
              ? `অনুসরণকৃত: ${toBengaliNumber(meta.followed_categories_count || 0)}টি বিভাগ · ${toBengaliNumber(meta.followed_authors_count || 0)}জন লেখক · ${toBengaliNumber(meta.followed_topics_count || 0)}টি বিষয়`
              : `Following ${meta.followed_categories_count || 0} sections · ${meta.followed_authors_count || 0} authors · ${meta.followed_topics_count || 0} topics`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/reader/profile?tab=follows"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-700" />
            <span>{isBn ? 'পছন্দ পরিবর্তন করুন' : 'Customize Feed'}</span>
          </Link>
          <Link
            to="/for-you"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors"
          >
            <span>{isBn ? 'সব দেখুন' : 'Full Feed'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Personalized News Grid */}
      {loadingFeed ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          <div className="h-56 bg-stone-100 rounded-xl" />
          <div className="h-56 bg-stone-100 rounded-xl" />
          <div className="h-56 bg-stone-100 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.slice(0, 3).map((article) => {
            const reasons = getPersonalizationReasonLabels(reasonsById[String(article.id)], isBn);
            return (
              <div key={article.id} className="space-y-1.5">
                {reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {reasons.map((label) => (
                      <span
                        key={label}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                <NewsCard article={article} variant="grid" />
              </div>
            );
          })}
        </div>
      )}

      {/* Recently Viewed News Strip */}
      {recentItems.length > 0 && (
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <History className="w-4 h-4 text-rose-700" />
              <span>{isBn ? 'সম্প্রতি পঠিত সংবাদ' : 'Recently Viewed News'}</span>
            </div>
            <Link
              to="/reader/profile?tab=history"
              className="text-[11px] font-semibold text-rose-700 hover:underline"
            >
              {isBn ? 'পূর্ণ ইতিহাস →' : 'View History →'}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentItems.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug || item.id}`}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50/60 border border-stone-200/80 transition-colors flex flex-col justify-between gap-1.5"
              >
                <span className="text-[10px] font-bold text-rose-700 uppercase">
                  {isBn ? item.categoryName : item.categoryNameEn || item.categoryName}
                </span>
                <p className="text-xs font-bold text-stone-900 font-serif-bn line-clamp-2 leading-snug">
                  {isBn ? item.title : item.titleEn || item.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default PersonalizedFeedSection;


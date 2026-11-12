import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsReaderAuthenticated, selectReaderUser } from '../../store/readerSlice.js';
import {
  useGetPersonalizedFeedQuery,
  useGetRecentlyViewedNewsQuery,
  useGetReaderBookmarksQuery
} from '../../store/api/readerApi.js';
import { getPersonalizationReasonLabels } from '../../utils/readerHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import SEO from '../../components/common/SEO.jsx';
import {
  Sparkles,
  History,
  Bookmark,
  SlidersHorizontal,
  UserPlus,
  LogIn
} from 'lucide-react';

export function PersonalizedFeedPage() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);

  const { data: feedData, isLoading } = useGetPersonalizedFeedQuery({ limit: 15 }, { skip: !isReaderAuth });
  const { data: recentItems = [] } = useGetRecentlyViewedNewsQuery(8, { skip: !isReaderAuth });
  const { data: bookmarksData } = useGetReaderBookmarksQuery(undefined, { skip: !isReaderAuth });

  if (!isReaderAuth) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 bg-white border border-stone-200 rounded-2xl shadow-xs my-6">
        <SEO title={isBn ? 'আমার ব্যক্তিগত পাতা' : 'My Personalized Feed'} />
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
          {isBn ? 'আপনার ব্যক্তিগত সংবাদ পাতা' : 'Your Personalized Front Page'}
        </h1>
        <p className="text-sm text-stone-600 font-serif-bn">
          {isBn
            ? 'আপনার পছন্দের বিভাগ, সাংবাদিক ও টপিক অনুসরণ করে সাজানো সংবাদ পাতা পেতে লগইন বা নিবন্ধন করুন।'
            : 'Sign in or create a free reader account to get a tailored news stream from the sections, journalists, and topics you follow.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/reader/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
          >
            <LogIn className="w-4 h-4" />
            <span>{isBn ? 'পাঠক লগইন' : 'Reader Sign In'}</span>
          </Link>
          <Link
            to="/reader/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'নতুন নিবন্ধন' : 'Create Account'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const items = feedData?.items || [];
  const meta = feedData?.meta || {};
  const reasonsById = meta?.reasons_by_id || {};
  const savedItems = bookmarksData?.items || [];

  return (
    <div className="space-y-8">
      <SEO title={isBn ? 'আমার পছন্দের সংবাদ' : 'For You — Personalized News'} />

      {/* Personalized Header */}
      <header className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
            <Sparkles className="w-4 h-4" />
            <span>{isBn ? 'ব্যক্তিগতকৃত সংস্করণ' : 'Personalized Edition'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-bn">
            {isBn
              ? `${readerUser?.display_name || readerUser?.name}-এর সংবাদ পাতা`
              : `${readerUser?.display_name || readerUser?.name}'s News Edition`}
          </h1>
          <p className="text-xs text-stone-300">
            {isBn
              ? `অনুসরণকৃত: ${toBengaliNumber(meta.followed_categories_count || 0)}টি বিভাগ · ${toBengaliNumber(meta.followed_authors_count || 0)}জন লেখক · ${toBengaliNumber(meta.followed_topics_count || 0)}টি বিষয়`
              : `Following ${meta.followed_categories_count || 0} sections · ${meta.followed_authors_count || 0} authors · ${meta.followed_topics_count || 0} topics`}
          </p>
        </div>

        <Link
          to="/reader/profile?tab=follows"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 text-rose-700" />
          <span>{isBn ? 'পছন্দ ও প্রোফাইল নিয়ন্ত্রণ' : 'Customize Topics & Profile'}</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Personalized News Feed */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
              <div className="h-64 bg-stone-200 rounded-xl" />
              <div className="h-64 bg-stone-200 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map((article) => {
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
        </div>

        {/* Personalized Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <TodayPollWidget />

          {/* Recently Viewed */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                <History className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'সম্প্রতি দেখা সংবাদ' : 'Recently Viewed'}</span>
              </h3>
              <Link to="/reader/profile?tab=history" className="text-[11px] font-semibold text-rose-700 hover:underline">
                {isBn ? 'সব দেখুন' : 'View All'}
              </Link>
            </div>
            {recentItems.length === 0 ? (
              <p className="text-xs text-stone-500">{isBn ? 'এখনো কোনো সংবাদ পড়া হয়নি।' : 'No recent reading history yet.'}</p>
            ) : (
              <ul className="space-y-2.5">
                {recentItems.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/news/${item.slug || item.id}`}
                      className="text-xs font-bold text-stone-800 hover:text-rose-700 font-serif-bn line-clamp-2"
                    >
                      {isBn ? item.title : item.titleEn || item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Saved Bookmarks Preview */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'সংরক্ষিত বুকমার্ক' : 'Saved Bookmarks'}</span>
              </h3>
              <Link to="/reader/profile?tab=bookmarks" className="text-[11px] font-semibold text-rose-700 hover:underline">
                {isBn ? 'তালিকা' : 'Manage'}
              </Link>
            </div>
            {savedItems.length === 0 ? (
              <p className="text-xs text-stone-500">{isBn ? 'কোনো বুকমার্ক সংরক্ষিত নেই।' : 'No saved articles yet.'}</p>
            ) : (
              <ul className="space-y-2.5">
                {savedItems.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/news/${item.slug || item.id}`}
                      className="text-xs font-bold text-stone-800 hover:text-rose-700 font-serif-bn line-clamp-2"
                    >
                      {isBn ? item.title : item.titleEn || item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PersonalizedFeedPage;


import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Radio, Sparkles } from 'lucide-react';
import {
  useGetPublicLiveBlogsQuery,
  useGetPublicSpecialCoveragesQuery
} from '../../store/api/liveCoverageApi.js';
import {
  LIVE_EVENT_TYPE_META,
  SPECIAL_COVERAGE_TYPE_META,
  formatLiveTimestampBadge
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { LiveBadgePill } from '../live/LiveCoverageShared.jsx';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';

export function LiveAndCoverageBanner() {
  const { data: liveRes } = useGetPublicLiveBlogsQuery({ per_page: 4 });
  const { data: coverageRes } = useGetPublicSpecialCoveragesQuery({ featured_only: 1, per_page: 4 });

  const liveBlogs = (liveRes?.items || []).slice(0, 3);
  const coverages = (coverageRes?.items || []).slice(0, 3);

  if (liveBlogs.length === 0 && coverages.length === 0) {
    return null;
  }

  return (
    <section className="my-5 space-y-4">
      {/* Active Live Blogs Strip */}
      {liveBlogs.length > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-gradient-to-r from-rose-50 via-white to-stone-50 dark:from-rose-950/30 dark:via-stone-900 dark:to-stone-900 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-700 text-white">
                <Radio className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-serif-bn text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  সরাসরি সংবাদ আপডেট
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  মুহূর্তের খবর তাৎক্ষণিক রিয়েল-টাইম ফিডে
                </p>
              </div>
            </div>

            <Link
              to="/live"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline"
            >
              <span>সব লাইভ ডেস্ক</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {liveBlogs.map((blog) => {
              const eventMeta = LIVE_EVENT_TYPE_META[blog.event_type] || LIVE_EVENT_TYPE_META.general;
              return (
                <Link
                  key={blog.id}
                  to={`/live/${blog.slug}`}
                  className="group rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 p-3.5 hover:border-rose-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <LiveBadgePill status={blog.status} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${eventMeta.badgeClass}`}>
                        {eventMeta.label}
                      </span>
                    </div>
                    <h3 className="font-serif-bn font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-rose-700 dark:group-hover:text-rose-400 line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>{formatLiveTimestampBadge(blog.last_update_at || blog.started_at)}</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {toBengaliNumber(blog.updates_count || 0)} আপডেট
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Special Coverages Microsite Bar */}
      {coverages.length > 0 && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 dark:bg-stone-700 text-white">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-serif-bn text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  বিশেষ আয়োজন ও পূর্ণাঙ্গ কাভারেজ
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  নির্বাচন, বাজেট, ক্রীড়া আসর, জাতীয় দিবস ও জরুরি বিষয়ের ডেডিকেটেড পাতা
                </p>
              </div>
            </div>

            <Link
              to="/coverage"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline"
            >
              <span>সব বিশেষ আয়োজন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coverages.map((cov) => {
              const typeMeta = SPECIAL_COVERAGE_TYPE_META[cov.coverage_type] || SPECIAL_COVERAGE_TYPE_META.breaking_event;
              return (
                <Link
                  key={cov.id}
                  to={`/coverage/${cov.slug}`}
                  className="group relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 text-white min-h-[126px] flex flex-col justify-end p-4"
                >
                  {cov.hero_image && (
                    <img
                      src={normalizeMediaUrl(cov.hero_image)}
                      alt={cov.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${typeMeta.accentBg} opacity-85`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 backdrop-blur-xs text-white border border-white/20">
                        <Sparkles className="w-3 h-3" />
                        <span>{cov.badge_text || typeMeta.shortLabel}</span>
                      </span>
                    </div>
                    <h3 className="font-serif-bn font-bold text-base leading-snug group-hover:underline">
                      {cov.title}
                    </h3>
                    {cov.subtitle && (
                      <p className="text-xs text-stone-200/90 line-clamp-1 mt-0.5">{cov.subtitle}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default LiveAndCoverageBanner;


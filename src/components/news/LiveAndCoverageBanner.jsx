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
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-700 text-white shrink-0">
                <Radio className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-serif-bn text-base sm:text-lg font-extrabold text-stone-900">
                  সরাসরি সংবাদ আপডেট
                </h2>
                <p className="text-xs text-stone-500 font-normal">
                  মুহূর্তের খবর তাৎক্ষণিক রিয়েল-টাইম ফিডে
                </p>
              </div>
            </div>

            <Link
              to="/live"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline"
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
                  className="group rounded-xl border border-stone-200 bg-white p-4 hover:border-rose-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <LiveBadgePill status={blog.status} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${eventMeta.badgeClass}`}>
                        {eventMeta.label}
                      </span>
                    </div>
                    <h3 className="font-serif-bn font-bold text-sm sm:text-base text-stone-900 group-hover:text-rose-700 line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span>{formatLiveTimestampBadge(blog.last_update_at || blog.started_at)}</span>
                    <span className="font-bold text-stone-800">
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
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-700 text-white shrink-0">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-serif-bn text-base sm:text-lg font-extrabold text-stone-900">
                  বিশেষ আয়োজন ও পূর্ণাঙ্গ কাভারেজ
                </h2>
                <p className="text-xs text-stone-500 font-normal">
                  নির্বাচন, বাজেট, ক্রীড়া আসর, জাতীয় দিবস ও জরুরি বিষয়ের ডেডিকেটেড পাতা
                </p>
              </div>
            </div>

            <Link
              to="/coverage"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline"
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
                  className="group rounded-xl border border-stone-200 bg-white p-4 hover:border-rose-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <Sparkles className="w-3 h-3 text-rose-600" />
                        <span>{cov.badge_text || typeMeta.shortLabel}</span>
                      </span>
                    </div>
                    <h3 className="font-serif-bn font-bold text-sm sm:text-base text-stone-900 group-hover:text-rose-700 line-clamp-2 leading-snug">
                      {cov.title}
                    </h3>
                    {cov.subtitle && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {cov.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-rose-700 group-hover:translate-x-0.5 transition-transform">
                    <span>পূর্ণাঙ্গ কাভারেজ পড়ুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

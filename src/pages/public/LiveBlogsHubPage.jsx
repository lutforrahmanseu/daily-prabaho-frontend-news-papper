import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Radio, ArrowRight } from 'lucide-react';
import { useGetPublicLiveBlogsQuery } from '../../store/api/liveCoverageApi.js';
import {
  LIVE_EVENT_TYPE_META,
  formatBengaliFullDateTime,
  formatLiveTimestampBadge
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import { LiveBadgePill } from '../../components/live/LiveCoverageShared.jsx';
import { SEO } from '../../components/common/SEO.jsx';
import { EditorialReveal, MotionStaggerGrid, MotionStaggerItem } from '../../components/common/MotionPrimitives.jsx';

export function LiveBlogsHubPage() {
  const [eventType, setEventType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryParams = {
    per_page: 24,
    ...(eventType !== 'all' ? { event_type: eventType } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {})
  };

  const { data, isLoading } = useGetPublicLiveBlogsQuery(queryParams);
  const blogs = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title="সরাসরি সংবাদ (Live Updates)"
        description="জাতীয়, নির্বাচন, ক্রীড়া, বাজেট ও জরুরি ঘটনার তাৎক্ষণিক লাইভ ব্লগ ও রিয়েল-টাইম সংবাদ প্রবাহ।"
      />

      {/* Header */}
      <EditorialReveal immediate className="mb-6">
        <div className="rounded-2xl bg-gradient-to-r from-rose-950 via-stone-900 to-stone-950 text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold mb-3">
                <Radio className="w-3.5 h-3.5" />
                <span>দৈনিক বার্তা প্রবাহ লাইভ ডেস্ক</span>
              </span>
              <h1 className="font-serif-bn text-2xl sm:text-3xl font-extrabold leading-tight">
                সরাসরি সংবাদ ও চলমান ঘটনাপ্রবাহ
              </h1>
              <p className="text-sm text-stone-300 mt-2 max-w-2xl">
                যাচাইকৃত সম্পাদকীয় অনুমোদনের মধ্য দিয়ে প্রকাশিত মুহূর্তের আপডেট, গুরুত্বপূর্ণ মুহূর্ত পিন ও স্বচ্ছ সংশোধন ইতিহাস।
              </p>
            </div>

            <Link
              to="/coverage"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <span>বিশেষ আয়োজন পাতা</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </EditorialReveal>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEventType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
              eventType === 'all'
                ? 'bg-stone-900 text-white border-stone-900 dark:bg-rose-700 dark:border-rose-700'
                : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
            }`}
          >
            সব বিষয়
          </button>
          {Object.values(LIVE_EVENT_TYPE_META).map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setEventType(ev.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                eventType === ev.id
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              {ev.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200"
        >
          <option value="all">সকল অবস্থা</option>
          <option value="live">চলমান (সরাসরি)</option>
          <option value="paused">বিরতি</option>
          <option value="ended">সমাপ্ত কভারেজ</option>
        </select>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center">
          <Radio className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif-bn text-lg font-bold text-stone-800 dark:text-stone-200">
            এই মুহূর্তে নির্বাচিত বিভাগে কোনো লাইভ ব্লগ নেই
          </h3>
          <p className="text-xs text-stone-500 mt-1">অন্য বিষয় নির্বাচন করুন অথবা মূল পাতায় ফিরে যান।</p>
        </div>
      ) : (
        <MotionStaggerGrid immediate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map((blog) => {
            const eventMeta = LIVE_EVENT_TYPE_META[blog.event_type] || LIVE_EVENT_TYPE_META.general;
            return (
              <MotionStaggerItem key={blog.id}>
                <Link
                  to={`/live/${blog.slug}`}
                  className="group h-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:border-rose-400 transition-colors flex flex-col"
                >
                  {blog.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-stone-800 relative">
                      <img
                        src={normalizeMediaUrl(blog.cover_image)}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <LiveBadgePill status={blog.status} size="sm" />
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {!blog.cover_image && (
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <LiveBadgePill status={blog.status} size="sm" />
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${eventMeta.badgeClass}`}>
                            {eventMeta.label}
                          </span>
                        </div>
                      )}

                      {blog.cover_image && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${eventMeta.badgeClass}`}>
                            {eventMeta.label}
                          </span>
                          {blog.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                              <MapPin className="w-3 h-3" />
                              {blog.location}
                            </span>
                          )}
                        </div>
                      )}

                      <h2 className="font-serif-bn text-lg font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-rose-700 dark:group-hover:text-rose-400 leading-snug mb-2">
                        {blog.title}
                      </h2>

                      {blog.summary && (
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                          {blog.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="inline-flex items-center gap-1">
                        {blog.status === 'ended' ? <Calendar className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 text-rose-600" />}
                        <span>
                          {blog.status === 'ended' && blog.ended_at
                            ? `সমাপ্ত: ${formatBengaliFullDateTime(blog.ended_at)}`
                            : formatLiveTimestampBadge(blog.last_update_at || blog.started_at)}
                        </span>
                      </span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {toBengaliNumber(blog.updates_count || 0)} আপডেট
                      </span>
                    </div>
                  </div>
                </Link>
              </MotionStaggerItem>
            );
          })}
        </MotionStaggerGrid>
      )}
    </div>
  );
}

export default LiveBlogsHubPage;


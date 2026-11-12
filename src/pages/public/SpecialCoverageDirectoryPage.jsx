import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Layers, Radio, Sparkles } from 'lucide-react';
import { useGetPublicSpecialCoveragesQuery } from '../../store/api/liveCoverageApi.js';
import {
  SPECIAL_COVERAGE_TYPE_META,
  formatBengaliFullDateTime
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import { SEO } from '../../components/common/SEO.jsx';
import { EditorialReveal, MotionStaggerGrid, MotionStaggerItem } from '../../components/common/MotionPrimitives.jsx';

export function SpecialCoverageDirectoryPage() {
  const [coverageType, setCoverageType] = useState('all');

  const queryParams = {
    per_page: 24,
    ...(coverageType !== 'all' ? { coverage_type: coverageType } : {})
  };

  const { data, isLoading } = useGetPublicSpecialCoveragesQuery(queryParams);
  const coverages = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title="বিশেষ আয়োজন ও কাভারেজ (Special Coverage)"
        description="জাতীয় নির্বাচন, ক্রীড়া টুর্নামেন্ট, জাতীয় বাজেট, প্রাকৃতিক দুর্যোগ ও মেজর ব্রেকিং ঘটনার পূর্ণাঙ্গ বিশেষ পাতা।"
      />

      <EditorialReveal immediate className="mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950 text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-bold mb-3 border border-white/15">
                <Layers className="w-3.5 h-3.5" />
                <span>বিশেষ সম্পাদকীয় মাইক্রোসাইট</span>
              </span>
              <h1 className="font-serif-bn text-2xl sm:text-3xl font-extrabold leading-tight">
                বিশেষ আয়োজন ও ইন-ডেপথ কাভারেজ
              </h1>
              <p className="text-sm text-stone-300 mt-2 max-w-2xl">
                নির্বাচন, বাজেট, আন্তর্জাতিক ক্রীড়া আসর, জাতীয় দিবস, দুর্যোগ ও মেজর ব্রেকিং ইভেন্টের টাইমলাইন, ইনফোগ্রাফিক, ফটো ও ভিডিও সংকলন।
              </p>
            </div>

            <Link
              to="/live"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>সরাসরি লাইভ ডেস্ক</span>
            </Link>
          </div>
        </div>
      </EditorialReveal>

      {/* Type Archetype Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setCoverageType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
            coverageType === 'all'
              ? 'bg-stone-900 text-white border-stone-900 dark:bg-rose-700 dark:border-rose-700'
              : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
          }`}
        >
          সব বিশেষ আয়োজন
        </button>
        {Object.values(SPECIAL_COVERAGE_TYPE_META).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCoverageType(item.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
              coverageType === item.id
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : coverages.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center">
          <Layers className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif-bn text-lg font-bold text-stone-800 dark:text-stone-200">
            এই শ্রেণিতে কোনো বিশেষ আয়োজন পাওয়া যায়নি
          </h3>
        </div>
      ) : (
        <MotionStaggerGrid immediate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coverages.map((cov) => {
            const typeMeta = SPECIAL_COVERAGE_TYPE_META[cov.coverage_type] || SPECIAL_COVERAGE_TYPE_META.breaking_event;
            const topics = Array.isArray(cov.topics) ? cov.topics.slice(0, 3) : [];
            return (
              <MotionStaggerItem key={cov.id}>
                <Link
                  to={`/coverage/${cov.slug}`}
                  className="group h-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:border-rose-400 transition-colors flex flex-col"
                >
                  <div className="relative h-44 overflow-hidden bg-stone-900">
                    {cov.hero_image && (
                      <img
                        src={normalizeMediaUrl(cov.hero_image)}
                        alt={cov.title}
                        className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${typeMeta.accentBg} opacity-75`} />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-xs text-white border border-white/25">
                        <Sparkles className="w-3 h-3" />
                        <span>{cov.badge_text || typeMeta.label}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif-bn text-xl font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-rose-700 dark:group-hover:text-rose-400 leading-snug">
                        {cov.title}
                      </h2>
                      {cov.subtitle && (
                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">{cov.subtitle}</p>
                      )}
                      {cov.description && (
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mt-2">
                          {cov.description}
                        </p>
                      )}

                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {topics.map((topic) => (
                            <span
                              key={topic.slug || topic.label}
                              className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[11px] font-medium text-stone-700 dark:text-stone-300"
                            >
                              # {topic.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{cov.published_at ? formatBengaliFullDateTime(cov.published_at) : 'চলমান'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                        <span>{toBengaliNumber(cov.items_count || 0)} উপাদান</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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

export default SpecialCoverageDirectoryPage;


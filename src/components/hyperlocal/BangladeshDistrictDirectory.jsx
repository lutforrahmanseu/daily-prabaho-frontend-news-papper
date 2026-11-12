import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Newspaper } from 'lucide-react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

/**
 * Interactive 8-Division / 64-District Bangladesh Regional Directory.
 */
export function BangladeshDistrictDirectory({ tree = [], isBn = true, activeDistrictSlug = null }) {
  const [selectedDivisionSlug, setSelectedDivisionSlug] = useState('all');

  const visibleDivisions =
    selectedDivisionSlug === 'all'
      ? tree
      : tree.filter((div) => div.slug === selectedDivisionSlug);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDivisionSlug('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
            selectedDivisionSlug === 'all'
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-700 border-stone-200 hover:border-rose-400'
          }`}
        >
          {isBn ? 'সব বিভাগ (৮ বিভাগ, ৬৪ জেলা)' : 'All Divisions (8 Divisions, 64 Districts)'}
        </button>
        {tree.map((div) => (
          <button
            key={div.id}
            type="button"
            onClick={() => setSelectedDivisionSlug(div.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              selectedDivisionSlug === div.slug
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-stone-700 border-stone-200 hover:border-rose-400'
            }`}
          >
            {isBn ? div.name_bn : div.name_en} ({isBn ? toBengaliNumber(div.districts_count || 0) : div.districts_count || 0})
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {visibleDivisions.map((div) => (
          <div key={div.id} className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <Link
                  to={`/local/${div.slug}`}
                  className="text-base font-bold text-stone-900 hover:text-rose-700 font-serif-bn inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-rose-700" />
                  <span>{isBn ? div.name_bn : div.name_en}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </Link>
                <p className="text-[11px] text-stone-500">
                  {div.geo_code} • {isBn ? `${toBengaliNumber(div.districts_count || 0)}টি জেলা` : `${div.districts_count || 0} Districts`}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800">
                <Newspaper className="w-3.5 h-3.5" />
                <span>
                  {isBn
                    ? `${toBengaliNumber(div.published_news_count || 0)}টি সংবাদ`
                    : `${div.published_news_count || 0} Articles`}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {(div.districts || []).map((dist) => {
                const isActive = activeDistrictSlug === dist.slug;
                return (
                  <Link
                    key={dist.id}
                    to={`/local/district/${dist.slug}`}
                    className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                      isActive
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-stone-50 hover:bg-rose-50/70 text-stone-800 border-stone-200 hover:border-rose-300'
                    }`}
                  >
                    <span className="font-bold truncate">{isBn ? dist.name_bn : dist.name_en}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : dist.published_news_count > 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isBn ? toBengaliNumber(dist.published_news_count || 0) : dist.published_news_count || 0}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BangladeshDistrictDirectory;


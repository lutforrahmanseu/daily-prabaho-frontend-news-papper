import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetAdPlacementQuery,
  useTrackImpressionMutation,
  useTrackClickMutation
} from '../../store/api/advertisementApi.js';
import { useGetMySubscriptionQuery } from '../../store/api/monetizationApi.js';
import { ExternalLink, CheckCircle, Sparkles, Megaphone } from 'lucide-react';

/**
 * Dynamic Advertisement Placement Component (Phase 9: Ad Management)
 * Supports all 5 canonical ad placements with impression and click tracking:
 * 1. homepage_top
 * 2. homepage_sidebar
 * 3. news_details_top
 * 4. news_details_middle
 * 5. category_page
 */
export function AdPlacement({
  placement = 'homepage_top',
  className = ''
}) {
  const { language } = useSelector((state) => state.ui);
  const isReaderAuth = useSelector((state) =>
    Boolean(state?.reader?.isAuthenticated || state?.reader?.token)
  );
  const isBn = language === 'bn';

  const [clicked, setClicked] = useState(false);
  const trackedAdRef = useRef(null);

  // Normalize placement aliases for backward compatibility
  const normalizedPlacement = (() => {
    if (placement === 'leaderboard') return 'homepage_top';
    if (placement === 'sidebar') return 'homepage_sidebar';
    if (placement === 'in_feed') return 'news_details_middle';
    return placement;
  })();

  const { data: mySubscription } = useGetMySubscriptionQuery(undefined, { skip: !isReaderAuth });
  const isAdFreeReader = Boolean(isReaderAuth && mySubscription?.ad_free_reading);

  const { data: activeAd } = useGetAdPlacementQuery(normalizedPlacement, { skip: isAdFreeReader });
  const [trackImpressionMutation] = useTrackImpressionMutation();
  const [trackClickMutation] = useTrackClickMutation();

  // Record impression once per mounted campaign ID (skip when reader has active Ad-Free Premium)
  useEffect(() => {
    if (!isAdFreeReader && activeAd?.id && trackedAdRef.current !== activeAd.id) {
      trackedAdRef.current = activeAd.id;
      trackImpressionMutation(activeAd.id);
    }
  }, [activeAd?.id, isAdFreeReader, trackImpressionMutation]);

  const handleAdClick = () => {
    if (activeAd) {
      if (activeAd.id) {
        trackClickMutation(activeAd.id);
      }
      setClicked(true);
      setTimeout(() => setClicked(false), 2000);

      const dest = activeAd.destination_url || activeAd.destinationUrl;
      if (dest && dest.startsWith('http')) {
        window.open(dest, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isAdFreeReader) {
    return null;
  }

  // 1. TOP LEADERBOARD PLACEMENTS (homepage_top, news_details_top, category_page)
  if (
    normalizedPlacement === 'homepage_top' ||
    normalizedPlacement === 'news_details_top' ||
    normalizedPlacement === 'category_page'
  ) {
    return (
      <div className={`w-full ${className}`}>
        {activeAd ? (
          <div
            onClick={handleAdClick}
            className="group relative overflow-hidden bg-stone-900 border border-stone-200 rounded-2xl shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col items-center justify-center"
          >
            <div className="w-full flex items-center justify-between px-3 py-1 bg-stone-100 text-[10px] text-stone-500 font-mono border-b border-stone-200">
              <span className="font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <Megaphone className="w-3 h-3 text-rose-600" />
                {isBn ? 'বিজ্ঞাপন' : 'ADVERTISEMENT'} • {activeAd.advertiser}
              </span>
              <span className="flex items-center gap-1 text-stone-400 group-hover:text-rose-700">
                <span>{isBn ? 'ওয়েবসাইট ভিজিট করুন' : 'Visit Website'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* Creative Banner Image */}
            <div className="w-full max-h-[140px] flex items-center justify-center overflow-hidden bg-stone-950">
              <img
                src={activeAd.image}
                alt={activeAd.title}
                className="w-full h-auto max-h-[140px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          </div>
        ) : (
          /* Institutional Fallback Leaderboard */
          <div className="relative overflow-hidden bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[90px]">
            <span className="text-[10px] uppercase font-bold text-stone-600 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs font-mono">
              {isBn ? 'বিজ্ঞাপন স্লট' : 'Commercial Slot'}
            </span>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 font-serif-bn">
                {isBn
                  ? 'দৈনিক বার্তা প্রবাহ ডিজিটাল পার্টনারশিপ ও কমার্শিয়াল নেটওয়ার্ক'
                  : 'Daily Prabaho Enterprise Advertising & Commercial Network'}
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {isBn
                  ? 'প্রতিদিন লাখো সচেতন পাঠকের কাছে আপনার পণ্য ও ব্র্যান্ড পৌঁছে দিন।'
                  : 'Reach millions of informed readers across Bangladesh and international diaspora.'}
              </p>
            </div>

            <a
              href="mailto:ads@dailyprabaho.com"
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              <span>{isBn ? 'বিজ্ঞাপন দিন' : 'Advertise With Us'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // 2. SIDEBAR RECTANGLE PLACEMENTS (homepage_sidebar)
  if (normalizedPlacement === 'homepage_sidebar') {
    if (activeAd) {
      return (
        <div
          onClick={handleAdClick}
          className={`group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer ${className}`}
        >
          <div className="p-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-[10px] text-stone-500 font-mono">
            <span className="font-bold text-stone-600 uppercase">
              {isBn ? 'বিজ্ঞাপন' : 'SPONSORED'}
            </span>
            <span className="truncate max-w-[140px] text-stone-600 font-semibold">{activeAd.advertiser}</span>
          </div>

          <div className="relative aspect-4/3 bg-stone-950 overflow-hidden">
            <img
              src={activeAd.image}
              alt={activeAd.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-transparent transition-colors" />
          </div>

          <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 font-serif-bn line-clamp-1">
              {activeAd.title}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-700 shrink-0" />
          </div>
        </div>
      );
    }

    // Fallback Sidebar
    return (
      <div className={`bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-5 text-center ${className}`}>
        <span className="text-[10px] uppercase font-bold text-stone-500 block mb-2 font-mono">
          {isBn ? 'বিজ্ঞাপন স্লট (৩০০×২৫০)' : 'Ad Slot (300x250)'}
        </span>
        <div className="aspect-4/3 bg-stone-200/70 rounded-xl flex flex-col items-center justify-center p-4 border border-stone-200">
          <Megaphone className="w-6 h-6 text-stone-400 mb-2" />
          <h5 className="text-xs font-bold text-stone-800 font-serif-bn">
            {isBn ? 'বার্তা প্রবাহ কমার্শিয়াল নেটওয়ার্ক' : 'Prabaho Ad Network'}
          </h5>
          <p className="text-[11px] text-stone-500 mt-1">
            {isBn ? 'যোগাযোগ: ads@dailyprabaho.com' : 'Contact: ads@dailyprabaho.com'}
          </p>
        </div>
      </div>
    );
  }

  // 3. IN-ARTICLE NATIVE PLACEMENTS (news_details_middle / in_feed)
  if (activeAd) {
    return (
      <div
        onClick={handleAdClick}
        className={`my-6 p-4 bg-gradient-to-r from-stone-50 via-white to-stone-50 border border-stone-200 rounded-2xl shadow-xs transition-all hover:border-rose-300 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={activeAd.image}
            alt={activeAd.title}
            className="w-20 h-14 rounded-xl object-cover shrink-0 ring-1 ring-stone-200"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] uppercase font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200 font-mono">
                {isBn ? 'স্পন্সরড বার্তা' : 'Sponsored'}
              </span>
              <span className="text-[11px] font-semibold text-rose-700 truncate">{activeAd.advertiser}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 font-serif-bn line-clamp-1">
              {activeAd.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
        >
          <span>{isBn ? 'বিস্তারিত দেখুন' : 'Learn More'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Default In-feed Fallback
  return (
    <div className={`p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-xs my-6 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] uppercase font-bold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200 font-mono">
          {isBn ? 'স্পন্সরড' : 'Sponsored'}
        </span>
        <span className="text-stone-800 font-serif-bn font-medium">
          {isBn ? 'স্মার্ট বাংলাদেশ বিনির্মাণে তথ্যপ্রযুক্তি ও ক্লাউড রূপান্তর' : 'Digital Cloud Solutions for Enterprises'}
        </span>
      </div>
      <a
        href="mailto:ads@dailyprabaho.com"
        className="text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
      >
        <span>{isBn ? 'বিজ্ঞাপন দিন →' : 'Advertise →'}</span>
      </a>
    </div>
  );
}

export default AdPlacement;

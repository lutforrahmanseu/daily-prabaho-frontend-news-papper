import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  useGetAdPlacementQuery,
  useGetAdPlacementListQuery,
  useTrackImpressionMutation,
  useTrackClickMutation
} from '../../store/api/advertisementApi.js';
import { useGetMySubscriptionQuery } from '../../store/api/monetizationApi.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  ExternalLink,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Sparkles
} from 'lucide-react';

/**
 * Curated high-fidelity showcase campaigns.
 * Ensures the advertisement carousel always provides an eye-catching,
 * animated sliding experience even before or alongside single-ad campaigns.
 */
const DEFAULT_SHOWCASE_ADS = [
  {
    id: 'promo-tech-fair-2026',
    title: 'জাতীয় প্রযুক্তি মেলা ২০২৬ - ডিজিটাল উদ্ভাবন ও রোবোটিক্স এক্সপো',
    subtitle: 'বঙ্গবন্ধু আন্তর্জাতিক সম্মেলন কেন্দ্র • নিবন্ধন চলছে • প্রবেশ সম্পূর্ণ বিনামূল্যে',
    advertiser: 'বাংলাদেশ কম্পিউটার কাউন্সিল',
    tag: 'প্রযুক্তি এক্সপো',
    ctaText: 'ওয়েবসাইট ভিজিট করুন',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&h=300&q=80',
    destination_url: 'https://bcc.gov.bd'
  },
  {
    id: 'promo-smart-bank-2026',
    title: 'ইউনিয়ন স্মার্ট ডিজিটাল ব্যাংকিং - লেনদেনে আকর্ষণীয় ক্যাশব্যাক',
    subtitle: 'তাৎক্ষণিক অ্যাকাউন্ট ওপেনিং • শূন্য ফি ফান্ড ট্রান্সফার • গুগল প্লে ও অ্যাপ স্টোরে',
    advertiser: 'ইউনিয়ন স্মার্ট ব্যাংক',
    tag: 'ডিজিটাল ব্যাংকিং',
    ctaText: 'অ্যাপ ডাউনলোড করুন',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&h=300&q=80',
    destination_url: 'https://unionsmartbank.com'
  },
  {
    id: 'promo-hybrid-car-2026',
    title: 'নতুন প্রজন্মের পরিবেশবান্ধব হাইব্রিড ইলেকট্রিক কার প্রদর্শনী ২০২৬',
    subtitle: '১০০% ব্যাটারি ব্যাকআপ • আধুনিক স্মার্ট ড্রাইভ • বিশেষ অফারে টেস্ট ড্রাইভ বুকিং',
    advertiser: 'অটোমোবাইলস বাংলাদেশ',
    tag: 'পরিবেশবান্ধব কার',
    ctaText: 'টেস্ট ড্রাইভ বুকিং',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&h=300&q=80',
    destination_url: 'https://automobilesbangladesh.com'
  },
  {
    id: 'promo-solar-energy-2026',
    title: 'সবুজ জ্বালানি সোলার প্যানেল ক্যাম্পেইন - শিল্প ও বাসাবাড়িতে সাশ্রয়ী বিদ্যুৎ',
    subtitle: '২৫ বছরের পারফরম্যান্স ওয়ারেন্টি • সরকারি অনুদান ও সহজ কিস্তি সুবিধা',
    advertiser: 'সোলার টেকনো লিমিটেড',
    tag: 'সবুজ শক্তি',
    ctaText: 'কোটেশন নিন',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&h=300&q=80',
    destination_url: 'https://solartechno.com'
  }
];

/**
 * Dynamic Advertisement Placement Component (Phase 9 & Public BroadSheet UX)
 * Supports all canonical ad placements with impression and click tracking:
 * 1. homepage_top / leaderboard
 * 2. homepage_sidebar / sidebar
 * 3. news_details_top
 * 4. news_details_middle / in_feed
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const trackedSetRef = useRef(new Set());

  // Normalize placement aliases for backward compatibility
  const normalizedPlacement = (() => {
    if (placement === 'leaderboard') return 'homepage_top';
    if (placement === 'sidebar') return 'homepage_sidebar';
    if (placement === 'in_feed') return 'news_details_middle';
    return placement;
  })();

  const { data: mySubscription } = useGetMySubscriptionQuery(undefined, { skip: !isReaderAuth });
  const isAdFreeReader = Boolean(isReaderAuth && mySubscription?.ad_free_reading);

  const { data: adsListData } = useGetAdPlacementListQuery(
    { placement: normalizedPlacement, limit: 6 },
    { skip: isAdFreeReader }
  );
  const { data: singleAd } = useGetAdPlacementQuery(normalizedPlacement, { skip: isAdFreeReader });

  const [trackImpressionMutation] = useTrackImpressionMutation();
  const [trackClickMutation] = useTrackClickMutation();

  // Aggregate active ads and fallback campaigns
  const effectiveAds = useMemo(() => {
    const list = Array.isArray(adsListData) && adsListData.length > 0
      ? [...adsListData]
      : (singleAd ? [singleAd] : []);

    const seen = new Set();
    const result = [];
    for (const ad of list) {
      if (!ad) continue;
      const key = ad.id || ad.title;
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(ad);
      }
    }

    // Ensure at least 4 slides for smooth, lively carousel rotation
    for (const def of DEFAULT_SHOWCASE_ADS) {
      if (result.length >= 4) break;
      if (!seen.has(def.title)) {
        seen.add(def.title);
        result.push(def);
      }
    }

    return result;
  }, [adsListData, singleAd]);

  const totalSlides = effectiveAds.length;
  const currentAd = effectiveAds[currentIndex] || effectiveAds[0];

  // Auto-slide every 4.5 seconds (paused on hover)
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, totalSlides]);

  // Record impression once per ad ID
  useEffect(() => {
    if (!isAdFreeReader && currentAd?.id && typeof currentAd.id === 'number') {
      if (!trackedSetRef.current.has(currentAd.id)) {
        trackedSetRef.current.add(currentAd.id);
        trackImpressionMutation(currentAd.id);
      }
    }
  }, [currentAd?.id, isAdFreeReader, trackImpressionMutation]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleDotClick = (idx, e) => {
    e?.stopPropagation();
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  const handleAdClick = (e) => {
    e?.stopPropagation();
    if (!currentAd) return;

    if (typeof currentAd.id === 'number') {
      trackClickMutation(currentAd.id);
    }

    const dest = currentAd.destination_url || currentAd.destinationUrl;
    if (dest && dest.startsWith('http')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
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
    if (!currentAd) {
      /* Institutional Fallback Leaderboard */
      return (
        <div className={`w-full ${className}`}>
          <div className="relative overflow-hidden bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[90px] text-white">
            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              {isBn ? 'বিজ্ঞাপন স্লট' : 'COMMERCIAL NETWORK'}
            </span>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-bold text-white font-serif-bn">
                {isBn
                  ? 'দৈনিক বার্তা প্রবাহ ডিজিটাল পার্টনারশিপ ও কমার্শিয়াল নেটওয়ার্ক'
                  : 'Daily Prabaho Enterprise Advertising & Commercial Network'}
              </h4>
              <p className="text-[11px] text-stone-300 mt-0.5">
                {isBn
                  ? 'প্রতিদিন লাখো সচেতন পাঠকের কাছে আপনার পণ্য ও ব্র্যান্ড পৌঁছে দিন।'
                  : 'Reach millions of informed readers across Bangladesh and international diaspora.'}
              </p>
            </div>

            <a
              href="mailto:ads@dailyprabaho.com"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              <span>{isBn ? 'বিজ্ঞাপন দিন' : 'Advertise With Us'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden bg-stone-950 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          {/* Top Sponsor Ribbon */}
          <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-200 border-b border-stone-800">
            {/* Left: Glowing Ad Badge + Advertiser */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-xs shrink-0">
                <Megaphone className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{isBn ? 'বিজ্ঞাপন' : 'SPONSORED'}</span>
              </span>

              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-white truncate">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{currentAd.advertiser}</span>
              </div>

              {currentAd.tag && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                  {currentAd.tag}
                </span>
              )}
            </div>

            {/* Right: Slide Counter, Prev/Next buttons, and CTA */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {totalSlides > 1 && (
                <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-700/70 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="পূর্ববর্তী বিজ্ঞাপন"
                    className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 select-none">
                    {isBn ? toBengaliNumber(currentIndex + 1) : currentIndex + 1} / {isBn ? toBengaliNumber(totalSlides) : totalSlides}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="পরবর্তী বিজ্ঞাপন"
                    className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleAdClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>{isBn ? 'ওয়েবসাইট ভিজিট করুন' : 'Visit Website'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sliding Canvas */}
          <div
            onClick={handleAdClick}
            className="group relative w-full h-[140px] sm:h-[165px] md:h-[185px] bg-stone-950 overflow-hidden cursor-pointer select-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentAd.id || currentIndex}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {/* Background Image */}
                <img
                  src={currentAd.image}
                  alt={currentAd.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />

                {/* Multi-Stop Gradient Overlays for High Legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-black/30" />

                {/* Corner Watermark */}
                <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono tracking-widest uppercase font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>AD • বিজ্ঞাপন</span>
                </div>

                {/* Ad Content Overlay */}
                <div className="absolute inset-0 p-4 sm:p-5 md:p-6 flex flex-col justify-end z-10">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Megaphone className="w-3 h-3 text-amber-400" />
                        {currentAd.advertiser}
                      </span>
                      <span className="text-stone-400 text-xs">•</span>
                      <span className="text-[10px] sm:text-xs text-stone-300">
                        {isBn ? 'স্পন্সরড ক্যাম্পেইন' : 'Sponsored Campaign'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg md:text-2xl font-bold font-serif-bn text-white drop-shadow-md leading-tight line-clamp-1 sm:line-clamp-2">
                      {currentAd.title}
                    </h3>

                    {currentAd.subtitle && (
                      <p className="hidden sm:block text-xs sm:text-sm text-stone-200 mt-1 line-clamp-1 font-sans drop-shadow-sm">
                        {currentAd.subtitle}
                      </p>
                    )}

                    <div className="mt-2.5 sm:mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-rose-600 group-hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all group-hover:scale-105">
                        <span>{currentAd.ctaText || (isBn ? 'ওয়েবসাইট ভিজিট করুন' : 'Visit Website')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>

                      <span className="text-[10px] sm:text-xs text-stone-300 font-medium">
                        {isBn ? 'অফার ও বিস্তারিত তথ্য জানতে ক্লিক করুন' : 'Click to explore offer & details'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating Left/Right Chevron Controls on Hover */}
            {totalSlides > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="পূর্ববর্তী বিজ্ঞাপন"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stone-950/70 hover:bg-stone-900 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg hover:scale-110"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="পরবর্তী বিজ্ঞাপন"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stone-950/70 hover:bg-stone-900 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg hover:scale-110"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Bottom Slide Indicators (Dots) */}
            {totalSlides > 1 && (
              <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {effectiveAds.map((ad, idx) => (
                  <button
                    key={ad.id || idx}
                    type="button"
                    onClick={(e) => handleDotClick(idx, e)}
                    aria-label={`স্লাইড ${idx + 1}`}
                    className={`transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-5 h-1.5 bg-rose-500 rounded-full'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80 rounded-full'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar Line */}
          {totalSlides > 1 && (
            <div className="w-full bg-stone-900 h-1 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 transition-all duration-300 ease-out"
                style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. SIDEBAR RECTANGLE PLACEMENTS (homepage_sidebar)
  if (normalizedPlacement === 'homepage_sidebar') {
    if (!currentAd) {
      /* Fallback Sidebar */
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

    return (
      <div
        className={`w-full ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="group relative overflow-hidden bg-white border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
          {/* Sponsor Header */}
          <div className="p-2.5 bg-stone-900 text-stone-100 flex items-center justify-between text-[11px] font-mono border-b border-stone-800">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
              <Megaphone className="w-3 h-3 text-amber-400" />
              {isBn ? 'বিজ্ঞাপন' : 'SPONSORED'}
            </span>
            <span className="truncate max-w-[140px] text-stone-200 font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3 text-emerald-400" />
              {currentAd.advertiser}
            </span>
          </div>

          {/* Image & Overlay */}
          <div
            onClick={handleAdClick}
            className="relative aspect-4/3 bg-stone-950 overflow-hidden cursor-pointer select-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentAd.id || currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={currentAd.image}
                  alt={currentAd.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />

                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono uppercase text-amber-300 border border-amber-400/30">
                  AD
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-xs sm:text-sm font-bold font-serif-bn line-clamp-2 leading-snug drop-shadow-md">
                    {currentAd.title}
                  </h4>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Sidebar Slide Indicators */}
            {totalSlides > 1 && (
              <div className="absolute bottom-1.5 right-2 z-10 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
                {effectiveAds.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleDotClick(idx, e)}
                    className={`transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-3 h-1 bg-rose-500 rounded-full'
                        : 'w-1 h-1 bg-white/50 rounded-full'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div
            onClick={handleAdClick}
            className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
          >
            <span className="text-xs font-bold text-stone-900 line-clamp-1">
              {currentAd.ctaText || (isBn ? 'অফার ও বিস্তারিত দেখুন' : 'Explore Offer')}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // 3. IN-ARTICLE NATIVE PLACEMENTS (news_details_middle / in_feed)
  if (currentAd) {
    return (
      <div
        onClick={handleAdClick}
        className={`my-6 p-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white border-2 border-amber-500/30 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-amber-500/60 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          <div className="relative shrink-0 w-24 h-16 rounded-xl overflow-hidden ring-1 ring-white/20">
            <img
              src={currentAd.image}
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1 rounded bg-black/70 text-[8px] font-mono text-amber-300">
              AD
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider">
                <Megaphone className="w-2.5 h-2.5" />
                {isBn ? 'স্পন্সরড বার্তা' : 'SPONSORED'}
              </span>
              <span className="text-xs font-semibold text-stone-300 truncate flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                {currentAd.advertiser}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold font-serif-bn text-white line-clamp-1">
              {currentAd.title}
            </h4>
            {currentAd.subtitle && (
              <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
                {currentAd.subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>{currentAd.ctaText || (isBn ? 'ওয়েবসাইট ভিজিট করুন' : 'Visit Website')}</span>
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

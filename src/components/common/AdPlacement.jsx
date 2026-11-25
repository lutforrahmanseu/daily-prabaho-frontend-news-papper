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

// Guaranteed local high-resolution bundled assets (offline-safe & zero CDN failure)
import techHubImg from '../../assets/images/bangladesh_tech_hub_1794291831587.jpg';
import metroImg from '../../assets/images/hero_dhaka_metro_bridge_1794291829969.jpg';
import padmaImg from '../../assets/images/padma_bridge_river_shipping_1794291831460.jpg';
import confImg from '../../assets/images/bangladesh_politics_conference_1794293624945.jpg';

/**
 * Curated high-fidelity showcase campaigns with local bundled graphics.
 * Guarantees that every advertisement slot is rich, vibrant, and never breaks.
 */
const DEFAULT_SHOWCASE_ADS = [
  {
    id: 'promo-tech-fair-2026',
    title: 'জাতীয় প্রযুক্তি মেলা ২০২৬ - ডিজিটাল উদ্ভাবন ও রোবোটিক্স এক্সপো',
    subtitle: 'বঙ্গবন্ধু আন্তর্জাতিক সম্মেলন কেন্দ্র • নিবন্ধন চলছে • প্রবেশ সম্পূর্ণ বিনামূল্যে',
    advertiser: 'বাংলাদেশ কম্পিউটার কাউন্সিল',
    tag: 'প্রযুক্তি এক্সপো',
    ctaText: 'নিবন্ধন করুন',
    image: confImg,
    destination_url: 'https://bcc.gov.bd'
  },
  {
    id: 'promo-smart-bank-2026',
    title: 'ইউনিয়ন স্মার্ট ডিজিটাল ব্যাংকিং - লেনদেনে আকর্ষণীয় ক্যাশব্যাক',
    subtitle: 'তাৎক্ষণিক অ্যাকাউন্ট ওপেনিং • শূন্য ফি ফান্ড ট্রান্সফার • গুগল প্লে ও অ্যাপ স্টোরে',
    advertiser: 'ইউনিয়ন স্মার্ট ব্যাংক',
    tag: 'ডিজিটাল ব্যাংকিং',
    ctaText: 'অ্যাপ ডাউনলোড করুন',
    image: metroImg,
    destination_url: 'https://unionsmartbank.com'
  },
  {
    id: 'promo-solar-energy-2026',
    title: 'সবুজ জ্বালানি সোলার প্যানেল ক্যাম্পেইন - শিল্প ও বাসাবাড়িতে সাশ্রয়ী বিদ্যুৎ',
    subtitle: '২৫ বছরের পারফরম্যান্স ওয়ারেন্টি • সরকারি অনুদান ও সহজ কিস্তি সুবিধা',
    advertiser: 'সোলার টেকনো লিমিটেড',
    tag: 'সবুজ শক্তি',
    ctaText: 'কোটেশন নিন',
    image: padmaImg,
    destination_url: 'https://solartechno.com'
  },
  {
    id: 'promo-hybrid-car-2026',
    title: 'নতুন প্রজন্মের পরিবেশবান্ধব হাইব্রিড ইলেকট্রিক কার প্রদর্শনী ২০২৬',
    subtitle: '১০০% ব্যাটারি ব্যাকআপ • আধুনিক স্মার্ট ড্রাইভ • বিশেষ অফারে টেস্ট ড্রাইভ বুকিং',
    advertiser: 'অটোমোবাইলস বাংলাদেশ',
    tag: 'পরিবেশবান্ধব কার',
    ctaText: 'টেস্ট ড্রাইভ বুকিং',
    image: techHubImg,
    destination_url: 'https://automobilesbangladesh.com'
  }
];

/**
 * Resolves a reliable local fallback image for any ad whose remote URL fails.
 */
function getLocalFallbackImage(ad) {
  const t = (ad?.title || '').toLowerCase();
  const adv = (ad?.advertiser || '').toLowerCase();
  if (adv.includes('সোলার') || t.includes('সোলার') || t.includes('জ্বালানি') || t.includes('সবুজ')) {
    return padmaImg;
  }
  if (adv.includes('ব্যাংক') || t.includes('ব্যাংক') || t.includes('পেমেন্ট')) {
    return metroImg;
  }
  if (adv.includes('কম্পিউটার') || t.includes('প্রযুক্তি') || t.includes('রোবোটিক্স') || t.includes('কার')) {
    return techHubImg;
  }
  return confImg;
}

/**
 * Dynamic Advertisement Placement Component (Phase 9 & Public BroadSheet UX)
 * Supports all canonical ad placements with impression and click tracking:
 * 1. homepage_top / leaderboard
 * 2. news_details_middle / in_feed
 * 3. homepage_sidebar / sidebar
 * 4. news_details_top
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
        // If remote image is invalid, assign safe local image
        const safeImage = ad.image || ad.image_url || getLocalFallbackImage(ad);
        result.push({ ...ad, image: safeImage });
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

  const handleImageError = (e) => {
    const fallback = getLocalFallbackImage(currentAd);
    if (e?.currentTarget && e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };

  // Dynamic context-aware subtitle synthesizer
  const adSubtitle = useMemo(() => {
    if (!currentAd) return '';
    if (currentAd.subtitle) return currentAd.subtitle;
    const t = currentAd.title || '';
    const adv = currentAd.advertiser || '';
    if (adv.includes('ব্যাংক') || t.includes('ব্যাংকিং') || t.includes('অ্যাপ')) {
      return isBn
        ? 'তাৎক্ষণিক অনলাইন অ্যাকাউন্ট, জিরো ফি ফান্ড ট্রান্সফার ও আকর্ষণীয় ক্যাশব্যাক অফার।'
        : 'Instant online account opening with zero transfer fees and exclusive cashbacks.';
    }
    if (adv.includes('কম্পিউটার') || t.includes('প্রযুক্তি') || t.includes('উদ্ভাবন')) {
      return isBn
        ? 'বঙ্গবন্ধু আন্তর্জাতিক সম্মেলন কেন্দ্র • সবার জন্য উন্মুক্ত • ফ্রি অনলাইন রেজিস্ট্রেশন।'
        : 'BICC Dhaka • Free registration and open to all tech enthusiasts.';
    }
    if (adv.includes('অটোমোবাইলস') || t.includes('কার') || t.includes('গাড়ি')) {
      return isBn
        ? '১০০% ব্যাটারি ব্যাকআপ • আধুনিক স্মার্ট ড্রাইভ • বিশেষ অফারে টেস্ট ড্রাইভ বুকিং চলছে।'
        : 'Smart hybrid driving with exclusive test drive booking offers.';
    }
    if (adv.includes('সোলার') || t.includes('শক্তি') || t.includes('জ্বালানি')) {
      return isBn
        ? 'শিল্প ও বাসাবাড়িতে সাশ্রয়ী বিদ্যুৎ • ২৫ বছরের ওয়ারেন্টি ও সহজ কিস্তি সুবিধা।'
        : 'Clean solar energy solutions with 25 years warranty and easy EMI.';
    }
    if (adv.includes('এডুকেশন') || t.includes('স্কলারশিপ')) {
      return isBn
        ? 'বিশ্বের শীর্ষ ১০০ বিশ্ববিদ্যালয়ে সরাসরি ভর্তি ও শতভাগ পর্যন্ত স্কলারশিপের সুবর্ণ সুযোগ।'
        : 'Direct admission into top universities with scholarship guidance.';
    }
    return isBn
      ? 'অফার ও ক্যাম্পেইনের বিস্তারিত জানতে এখনই অফিশিয়াল পোর্টালে ভিজিট করুন।'
      : 'Visit the official portal to learn more about this campaign.';
  }, [currentAd, isBn]);

  // Dynamic action button label
  const adCtaText = useMemo(() => {
    if (!currentAd) return isBn ? 'ওয়েবসাইট দেখুন' : 'Visit Website';
    if (currentAd.ctaText) return currentAd.ctaText;
    const t = currentAd.title || '';
    if (t.includes('অ্যাপ') || t.includes('ডাউনলোড')) {
      return isBn ? 'অ্যাপ ডাউনলোড করুন' : 'Download App';
    }
    if (t.includes('মেলা') || t.includes('রেজিস্ট্রেশন')) {
      return isBn ? 'নিবন্ধন করুন' : 'Register Now';
    }
    if (t.includes('কার') || t.includes('ড্রাইভ')) {
      return isBn ? 'টেস্ট ড্রাইভ বুক' : 'Book Test Drive';
    }
    if (t.includes('সোলার') || t.includes('প্যানেল')) {
      return isBn ? 'কোটেশন নিন' : 'Get Quote';
    }
    return isBn ? 'ওয়েবসাইট ভিজিট করুন' : 'Visit Website';
  }, [currentAd, isBn]);

  if (isAdFreeReader || effectiveAds.length === 0) {
    return null;
  }

  // 1. HORIZONTAL BANNER PLACEMENTS (homepage_top, leaderboard, in_feed, news_details_middle, news_details_top, category_page)
  if (
    normalizedPlacement === 'homepage_top' ||
    normalizedPlacement === 'news_details_top' ||
    normalizedPlacement === 'category_page' ||
    normalizedPlacement === 'news_details_middle'
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

    const defaultMargin = normalizedPlacement === 'news_details_middle' ? 'my-6 sm:my-8' : '';

    return (
      <div
        className={`w-full ${defaultMargin} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden bg-stone-950 border-2 border-amber-500/35 hover:border-amber-500/60 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
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
                <span>{adCtaText}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sliding Canvas */}
          <div
            onClick={handleAdClick}
            className="group relative w-full h-[145px] sm:h-[165px] md:h-[185px] bg-stone-950 overflow-hidden cursor-pointer select-none"
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
                {/* Background Creative Image with Error Fallback */}
                <img
                  src={currentAd.image}
                  alt={currentAd.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />

                {/* Multi-Stop Gradient Overlays for High Legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-black/30" />

                {/* Corner Watermark */}
                <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono tracking-widest uppercase font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{isBn ? 'AD • বিজ্ঞাপন' : 'AD • SPONSORED'}</span>
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

                    {adSubtitle && (
                      <p className="hidden sm:block text-xs sm:text-sm text-stone-200 mt-1 line-clamp-1 font-sans drop-shadow-sm">
                        {adSubtitle}
                      </p>
                    )}

                    <div className="mt-2.5 sm:mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-rose-600 group-hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all group-hover:scale-105">
                        <span>{adCtaText}</span>
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

  // 2. SIDEBAR RECTANGLE PLACEMENTS (homepage_sidebar, sidebar)
  // Upgraded into a dynamic sliding commercial showcase with guaranteed image fallbacks!
  if (normalizedPlacement === 'homepage_sidebar') {
    if (!currentAd) {
      /* Fallback Sidebar */
      return (
        <div className={`bg-stone-900 border-2 border-amber-500/30 rounded-2xl p-5 text-center text-white ${className}`}>
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-2 font-mono flex items-center justify-center gap-1">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            {isBn ? 'বিজ্ঞাপন স্লট (৩০০×২৫০)' : 'Ad Slot (300x250)'}
          </span>
          <div className="aspect-4/3 bg-stone-950 rounded-xl flex flex-col items-center justify-center p-4 border border-stone-800">
            <Megaphone className="w-6 h-6 text-amber-400 mb-2 animate-pulse" />
            <h5 className="text-xs font-bold text-white font-serif-bn">
              {isBn ? 'বার্তা প্রবাহ কমার্শিয়াল নেটওয়ার্ক' : 'Prabaho Ad Network'}
            </h5>
            <p className="text-[11px] text-stone-400 mt-1">
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
        <div className="group relative overflow-hidden bg-stone-950 border-2 border-amber-500/35 hover:border-amber-500/60 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          {/* Top Sponsor Ribbon */}
          <div className="px-3 py-2 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-200 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider shrink-0">
                <Megaphone className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{isBn ? 'বিজ্ঞাপন' : 'SPONSORED'}</span>
              </span>
              <span className="truncate text-xs font-semibold text-white flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{currentAd.advertiser}</span>
              </span>
            </div>

            {totalSlides > 1 && (
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="পূর্ববর্তী বিজ্ঞাপন"
                  className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="px-1 text-[10px] font-mono font-bold text-amber-300 select-none">
                  {isBn ? toBengaliNumber(currentIndex + 1) : currentIndex + 1}/{isBn ? toBengaliNumber(totalSlides) : totalSlides}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="পরবর্তী বিজ্ঞাপন"
                  className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sliding Image & Overlay (300x250 style) */}
          <div
            onClick={handleAdClick}
            className="relative h-[210px] sm:h-[230px] bg-stone-950 overflow-hidden cursor-pointer select-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentAd.id || currentIndex}
                initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {/* Background Creative Image with Error Fallback */}
                <img
                  src={currentAd.image}
                  alt={currentAd.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Multi-Stop Gradient Overlays for High Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/25" />

                {/* Corner Watermark */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono uppercase font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1 z-10">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>AD</span>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                  {currentAd.tag && (
                    <span className="inline-block self-start px-2 py-0.5 mb-1.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentAd.tag}
                    </span>
                  )}

                  <h4 className="text-sm sm:text-base font-bold font-serif-bn text-white line-clamp-2 leading-snug drop-shadow-md">
                    {currentAd.title}
                  </h4>

                  {adSubtitle && (
                    <p className="text-[11px] text-stone-300 line-clamp-1 mt-1 font-sans">
                      {adSubtitle}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 group-hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all group-hover:scale-105">
                      <span>{adCtaText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>

                    <span className="text-[10px] text-stone-400">
                      {isBn ? 'ভিজিট করুন ↗' : 'Visit ↗'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Slide Indicators (Dots) */}
            {totalSlides > 1 && (
              <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                {effectiveAds.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleDotClick(idx, e)}
                    aria-label={`স্লাইড ${idx + 1}`}
                    className={`transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-4 h-1.5 bg-rose-500 rounded-full'
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

  // Fallback Catch-all
  return null;
}

export default AdPlacement;

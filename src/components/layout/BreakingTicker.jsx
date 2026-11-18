import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useBreakingArticles } from '../../hooks/usePortalData.js';
import { ChevronLeft, ChevronRight, Zap, Pause, Play } from 'lucide-react';
import { EDITORIAL_EASE } from '../common/MotionPrimitives.jsx';

export function BreakingTicker() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { items: breakingArticles } = useBreakingArticles();

  const isBn = language === 'bn';
  const newsList = breakingArticles.map((a) => (isBn ? a.title : (a.titleEn || a.title)));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || newsList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, newsList.length]);

  useEffect(() => {
    if (currentIndex >= newsList.length && newsList.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, newsList.length]);

  if (newsList.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + newsList.length) % newsList.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % newsList.length);
  };

  const handleItemClick = () => {
    const targetArticle = breakingArticles[currentIndex] || breakingArticles[0];
    if (targetArticle) {
      navigate(`/news/${targetArticle.slug || targetArticle.id}`);
    }
  };

  return (
    <div className="bg-stone-900 text-stone-100 border-b border-stone-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Breaking Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 sm:gap-1.5 bg-rose-700 text-white text-[11px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md uppercase tracking-wider shadow-xs font-sans">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-amber-300 animate-pulse shrink-0" />
            <span className="hidden xs:inline">{isBn ? 'জরুরি সংবাদ' : 'BREAKING'}</span>
            <span className="xs:hidden">{isBn ? 'ব্রেকিং' : 'LIVE'}</span>
          </span>
          <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        </div>

        {/* Center: Cycling News Item */}
        <div
          className="flex-1 overflow-hidden cursor-pointer relative min-h-[20px] sm:min-h-[22px] flex items-center min-w-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={handleItemClick}
          title={isBn ? 'বিস্তারিত পড়তে ক্লিক করুন' : 'Click to read full story'}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={`${currentIndex}-${newsList[currentIndex]}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
              className="w-full text-xs sm:text-sm md:text-base font-bold text-white truncate hover:text-amber-300 transition-colors font-serif-bn"
            >
              {newsList[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Right: Pause/Play & Prev/Next Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 text-stone-300">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Play breaking news ticker' : 'Pause breaking news ticker'}
            className="hidden xs:flex p-1 rounded-md hover:bg-stone-800 text-stone-200 hover:text-white transition-colors cursor-pointer"
            title={isPaused ? (isBn ? 'চালু করুন' : 'Resume') : (isBn ? 'বিরতি' : 'Pause')}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous breaking news"
            className="p-1 rounded-md hover:bg-stone-800 text-stone-200 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[11px] sm:text-xs text-stone-400 font-mono select-none px-0.5 sm:px-1 hidden sm:inline">
            {currentIndex + 1}/{newsList.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next breaking news"
            className="p-1 rounded-md hover:bg-stone-800 text-stone-200 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default BreakingTicker;

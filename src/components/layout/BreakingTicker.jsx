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
    <div className="bg-rose-50 border-y border-rose-200/90 text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3">
        
        {/* Left: Breaking Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 bg-rose-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
            <Zap className="w-3 h-3 fill-current animate-pulse" />
            <span>{isBn ? 'জরুরি সংবাদ' : 'BREAKING'}</span>
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
        </div>

        {/* Center: Cycling News Item */}
        <div
          className="flex-1 overflow-hidden cursor-pointer relative min-h-[20px] flex items-center"
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
              className="w-full text-xs sm:text-sm font-semibold text-stone-900 truncate hover:text-rose-700 transition-colors font-serif-bn"
            >
              {newsList[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Right: Pause/Play & Prev/Next Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Play breaking news ticker' : 'Pause breaking news ticker'}
            className="p-1 rounded hover:bg-rose-100 text-stone-600 hover:text-rose-800 transition-colors cursor-pointer"
            title={isPaused ? (isBn ? 'চালু করুন' : 'Resume') : (isBn ? 'বিরতি' : 'Pause')}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous breaking news"
            className="p-1 rounded hover:bg-rose-100 text-stone-700 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-stone-500 font-mono">
            {currentIndex + 1}/{newsList.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next breaking news"
            className="p-1 rounded hover:bg-rose-100 text-stone-700 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default BreakingTicker;

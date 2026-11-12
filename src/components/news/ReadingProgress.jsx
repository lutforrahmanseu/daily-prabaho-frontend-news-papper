import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { stripHtmlTags } from '../../utils/securitySanitizer.js';
import { Clock } from 'lucide-react';
import { EDITORIAL_EASE } from '../common/MotionPrimitives.jsx';

/**
 * Article Reading Progress Indicator
 * Fixed top bar with dynamic completion percentage and remaining reading time
 */
export function ReadingProgress({ content = '', showRemainingTime = true }) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [progress, setProgress] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(1);

  // Total words & estimated reading minutes
  const plainText = stripHtmlTags(content);
  const totalWords = plainText ? plainText.split(/\s+/).length : 500;
  const totalReadingMinutes = Math.max(1, Math.ceil(totalWords / 160));

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (totalHeight > 0) {
        const currentPercentage = Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
        setProgress(currentPercentage);

        // Calculate remaining minutes based on unread percentage
        const remainingFraction = Math.max(0, 1 - currentPercentage / 100);
        const remMins = Math.max(1, Math.ceil(totalReadingMinutes * remainingFraction));
        setRemainingMinutes(remMins);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalReadingMinutes]);

  return (
    <>
      {/* 1. Slim Fixed Progress Bar at Top */}
      <div
        className="fixed top-0 left-0 right-0 h-1.5 bg-stone-200/50 z-50 overflow-hidden backdrop-blur-xs"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800"
          initial={false}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        />
      </div>

      {/* 2. Floating Badge Indicator (visible once reading starts) */}
      <AnimatePresence>
        {showRemainingTime && progress > 5 && progress < 96 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
            className="hidden md:flex fixed top-16 right-6 z-40 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-stone-700 shadow-md border border-stone-200 text-xs font-semibold backdrop-blur-md"
          >
            <Clock className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
            <span className="font-serif-bn">
              {isBn
                ? `পড়তে বাকি: ~${toBengaliNumber(remainingMinutes)} মিনিট`
                : `~${remainingMinutes} min read left`}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-[11px] font-sans text-rose-700 font-bold">
              {isBn ? `${toBengaliNumber(Math.round(progress))}%` : `${Math.round(progress)}%`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ReadingProgress;


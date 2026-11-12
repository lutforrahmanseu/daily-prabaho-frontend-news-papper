import React from 'react';
import { motion } from 'motion/react';
import { EDITORIAL_TRANSITION } from './MotionPrimitives.jsx';

/**
 * Editorial Loading Fallback Skeleton for Lazy-Loaded Routes
 */
export function PageLoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={EDITORIAL_TRANSITION}
      className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-2xl space-y-4">
        {/* Animated Brand Pulse Bar */}
        <div className="h-1.5 w-full bg-stone-100 overflow-hidden rounded-full">
          <div className="h-full bg-rose-700 animate-pulse w-3/5 rounded-full" />
        </div>
        
        {/* Skeleton content */}
        <div className="space-y-3 pt-6">
          <div className="h-8 bg-stone-200/70 rounded-md w-3/4 animate-pulse" />
          <div className="h-4 bg-stone-200/50 rounded-md w-1/2 animate-pulse" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="h-32 bg-stone-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-stone-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-stone-100 rounded-lg animate-pulse" />
          </div>
        </div>

        <p className="text-center text-xs font-serif-bn text-stone-500 pt-2">
          দৈনিক বার্তা প্রবাহ লোড হচ্ছে...
        </p>
      </div>
    </motion.div>
  );
}

export default PageLoadingFallback;


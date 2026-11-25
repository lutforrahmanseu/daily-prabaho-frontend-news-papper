import React from 'react';

/**
 * Aesthetic Editorial Loading Fallback for Lazy-Loaded Routes
 */
export function PageLoadingFallback() {
  const isEn = typeof window !== 'undefined' && window.localStorage?.getItem('newsflow_language') === 'en';

  return (
    <div
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6"
      aria-busy="true"
      aria-label={isEn ? 'Loading page' : 'পৃষ্ঠা লোড হচ্ছে'}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5">
        {/* Minimal Broadsheet Crest */}
        <div className="w-11 h-11 rounded-2xl bg-rose-700/10 dark:bg-rose-500/15 border border-rose-200/80 dark:border-rose-800/50 flex items-center justify-center shadow-xs">
          <span className="text-lg font-black font-serif-bn text-rose-700 dark:text-rose-400">
            প্র
          </span>
        </div>

        {/* Sleek Razor Progress Sweep */}
        <div className="w-44 h-[2px] bg-stone-200/80 dark:bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-rose-600 dark:via-rose-400 to-transparent editorial-progress-sweep" />
        </div>

        <p className="text-xs font-serif-bn tracking-wide text-stone-500 dark:text-stone-400">
          {isEn ? 'Preparing Daily Prabaho...' : 'দৈনিক বার্তা প্রবাহ প্রস্তুত হচ্ছে...'}
        </p>
      </div>
    </div>
  );
}

export default PageLoadingFallback;

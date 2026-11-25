import React from 'react';

/**
 * Editorial Skeleton Loading Placeholders (Light & Dark mode compatible)
 */
export function FeaturedLeadSkeleton() {
  return (
    <section className="mb-10" aria-busy="true" aria-label="Loading top stories">
      <div className="flex items-center justify-between pb-2.5 mb-5 border-b-2 border-stone-200">
        <div className="h-7 w-56 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
        <div className="h-4 w-32 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Lead Card Skeleton */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-16/10 bg-stone-200 dark:bg-stone-800 animate-pulse" />
          <div className="p-6 space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-20 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            </div>
            <div className="h-7 w-11/12 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-7 w-3/4 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse" />
                <div className="h-3.5 w-28 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
              </div>
              <div className="h-7 w-16 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 3 Secondary Cards Skeleton */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-stone-200 rounded-xl p-4 flex gap-4 items-stretch flex-1"
            >
              <div className="flex-1 space-y-2.5">
                <div className="h-3.5 w-24 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
                <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
              </div>
              <div className="w-24 sm:w-28 aspect-4/3 rounded-lg bg-stone-200 dark:bg-stone-800 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
        >
          <div className="aspect-16/10 bg-stone-200 dark:bg-stone-800 animate-pulse" />
          <div className="p-4 space-y-2.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
              <div className="h-3 w-20 rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
            </div>
            <div className="h-5 w-full rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-5 w-4/5 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-3.5 w-full rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
            <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
              <div className="h-5 w-12 rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarPopularSkeleton({ count = 5 }) {
  return (
    <div className="divide-y divide-stone-100" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-3.5 flex items-start gap-3">
          <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-3 w-24 rounded bg-stone-100 dark:bg-stone-800/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}


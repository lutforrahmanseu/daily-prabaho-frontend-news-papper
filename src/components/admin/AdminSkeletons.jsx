import React from 'react';

/**
 * Aesthetic Editorial CMS Skeletons
 * Uses a silky horizontal shimmer sweep + razor-thin rose progress bar
 * instead of harsh blinking gray boxes.
 */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading CMS workspace">
      {/* Razor-thin Aesthetic Progress Sweep */}
      <div className="h-[2px] w-full bg-stone-200/70 dark:bg-stone-800/80 rounded-full overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-rose-600/80 to-transparent editorial-progress-sweep" />
      </div>

      {/* Single Unified Card Skeleton */}
      <div className="bg-white/95 dark:bg-[#11161f] rounded-2xl border border-stone-200/80 dark:border-stone-800/70 shadow-xs overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/70">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="space-y-2">
            <div className="h-6 w-52 rounded-md editorial-shimmer" />
            <div className="h-3.5 w-72 rounded-md editorial-shimmer opacity-80" />
          </div>
          <div className="h-9 w-32 rounded-xl editorial-shimmer" />
        </div>

        {/* Filter / Tabs Section */}
        <div className="p-4 bg-stone-50/40 dark:bg-stone-900/40 space-y-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {[74, 88, 102, 78, 86].map((w, idx) => (
              <div
                key={idx}
                style={{ width: `${w}px` }}
                className="h-7 rounded-xl editorial-shimmer shrink-0"
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="h-8 w-64 rounded-xl editorial-shimmer" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 rounded-xl editorial-shimmer" />
              <div className="h-8 w-24 rounded-xl editorial-shimmer" />
            </div>
          </div>
        </div>

        {/* Content Rows Section */}
        <div className="divide-y divide-stone-100/80 dark:divide-stone-800/60">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="px-4 py-3.5 flex items-center gap-4">
              <div className="h-4 w-4 rounded editorial-shimmer shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div
                  className="h-3.5 rounded-md editorial-shimmer"
                  style={{ width: `${72 - (row % 3) * 10}%` }}
                />
                <div
                  className="h-2.5 rounded-md editorial-shimmer opacity-75"
                  style={{ width: `${46 - (row % 2) * 8}%` }}
                />
              </div>
              <div className="h-6 w-18 rounded-lg editorial-shimmer hidden sm:block shrink-0" />
              <div className="h-6 w-20 rounded-lg editorial-shimmer hidden md:block shrink-0" />
              <div className="h-7 w-16 rounded-lg editorial-shimmer shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Table Rows Shimmer Skeleton
 */
export function AdminTableRowsSkeleton({ rows = 6, colSpan = 8 }) {
  return Array.from({ length: rows }).map((_, idx) => (
    <tr key={idx} aria-busy="true">
      <td colSpan={colSpan} className="px-4 py-3.5">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 rounded editorial-shimmer shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div
              className="h-3.5 rounded-md editorial-shimmer"
              style={{ width: `${74 - (idx % 3) * 10}%` }}
            />
            <div
              className="h-2.5 rounded-md editorial-shimmer opacity-75"
              style={{ width: `${48 - (idx % 2) * 8}%` }}
            />
          </div>
          <div className="h-6 w-18 rounded-lg editorial-shimmer hidden sm:block shrink-0" />
          <div className="h-6 w-20 rounded-lg editorial-shimmer hidden md:block shrink-0" />
          <div className="h-7 w-16 rounded-lg editorial-shimmer shrink-0" />
        </div>
      </td>
    </tr>
  ));
}

/**
 * Reusable List Rows Shimmer Skeleton
 */
export function AdminListRowsSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-stone-100/80 dark:divide-stone-800/60" aria-busy="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="px-4 py-3.5 flex items-center gap-4">
          <div className="h-4 w-4 rounded editorial-shimmer shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div
              className="h-3.5 rounded-md editorial-shimmer"
              style={{ width: `${70 - (idx % 3) * 10}%` }}
            />
            <div
              className="h-2.5 rounded-md editorial-shimmer opacity-75"
              style={{ width: `${44 - (idx % 2) * 8}%` }}
            />
          </div>
          <div className="h-6 w-20 rounded-lg editorial-shimmer hidden sm:block shrink-0" />
          <div className="h-7 w-16 rounded-lg editorial-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}

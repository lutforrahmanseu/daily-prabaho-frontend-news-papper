import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Data Table component with pagination and responsive wrapper
 */
export function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'কোনো তথ্য পাওয়া যায়নি (No records found)',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ''
}) {
  return (
    <div className={`w-full bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-stone-500">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">লোড হচ্ছে...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-stone-400 text-xs italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-stone-50/70 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3.5 text-stone-800 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <span>
            পৃষ্ঠা {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              className="p-1 rounded bg-white border border-stone-300 disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              className="p-1 rounded bg-white border border-stone-300 disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;

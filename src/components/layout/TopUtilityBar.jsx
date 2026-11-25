import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setEdition } from '../../store/uiSlice.js';
import {
  getBengaliNewspaperDate,
  getBanglaCalendarDate,
  toBengaliNumber
} from '../../utils/bengaliFormatter.js';
import { Calendar, CloudSun } from 'lucide-react';

/**
 * Clean Broadsheet Date & Weather Micro-Bar
 * Replaces cluttered colorful badges with quiet, elegant newspaper typography.
 */
export function TopUtilityBar() {
  const dispatch = useDispatch();
  const { language, edition, location: userLocation, weatherTemp, weatherCondition } = useSelector((state) => state.ui);

  const isBn = language === 'bn';
  const currentDate = new Date();
  const dateFormatted = isBn ? getBengaliNewspaperDate(currentDate) : currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const banglaDate = getBanglaCalendarDate(currentDate);

  return (
    <div className="bg-stone-50 border-b border-stone-200/80 text-stone-600 text-[11px] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1 flex items-center justify-between gap-3 flex-nowrap">
        {/* Left: Date, Bengali Calendar & Weather */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-stone-800 shrink-0 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>{dateFormatted}</span>
            {isBn && (
              <span className="hidden md:inline text-stone-500 font-normal">
                · {banglaDate}
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-stone-700 border-l border-stone-200 pl-2 sm:pl-3 whitespace-nowrap shrink-0">
            <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {isBn ? userLocation : (userLocation === 'ঢাকা' ? 'Dhaka' : userLocation)}: {isBn ? toBengaliNumber(weatherTemp) : weatherTemp}°C
            </span>
            <span className="hidden lg:inline text-stone-500">
              ({isBn ? weatherCondition : (weatherCondition === 'কুয়াশাচ্ছন্ন রোদ' ? 'Partly Cloudy' : weatherCondition)})
            </span>
          </div>
        </div>

        {/* Right: Soft Edition Switcher */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="hidden sm:inline">{isBn ? 'সংস্করণ:' : 'Edition:'}</span>
            <button
              type="button"
              onClick={() => dispatch(setEdition('national'))}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer text-[11px] ${
                edition === 'national' ? 'font-bold text-rose-700 underline underline-offset-2' : 'hover:text-stone-900'
              }`}
            >
              {isBn ? 'জাতীয়' : 'National'}
            </button>
            <span className="text-stone-300">•</span>
            <button
              type="button"
              onClick={() => dispatch(setEdition('international'))}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer text-[11px] ${
                edition === 'international' ? 'font-bold text-rose-700 underline underline-offset-2' : 'hover:text-stone-900'
              }`}
            >
              {isBn ? 'আন্তর্জাতিক' : 'Global'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopUtilityBar;

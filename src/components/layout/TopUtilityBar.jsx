import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleLanguage,
  toggleFontSize,
  setEpaperModalOpen,
  setEdition
} from '../../store/uiSlice.js';
import {
  getBengaliNewspaperDate,
  getBanglaCalendarDate,
  toBengaliNumber
} from '../../utils/bengaliFormatter.js';
import {
  Archive,
  Calendar,
  CloudSun,
  Crown,
  Newspaper,
  ShieldAlert,
  Type,
  Globe2,
  Users
} from 'lucide-react';

export function TopUtilityBar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { language, fontSize, edition, location: userLocation, weatherTemp, weatherCondition } = useSelector((state) => state.ui);

  const isBn = language === 'bn';
  const currentDate = new Date();
  const dateFormatted = isBn ? getBengaliNewspaperDate(currentDate) : currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const banglaDate = getBanglaCalendarDate(currentDate);

  const isAdmin = location.pathname.startsWith('/admin');

  // Social Links with SVG icons
  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: 'X (Twitter)',
      url: 'https://twitter.com',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-stone-100/90 text-stone-700 text-xs border-b border-stone-200 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
        {/* Left: Date, Bengali Calendar & Weather */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-stone-900 shrink-0 whitespace-nowrap text-[11px] sm:text-xs">
            <Calendar className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>{dateFormatted}</span>
            {isBn && (
              <span className="hidden md:inline text-stone-500 font-normal">
                · {banglaDate}
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-stone-700 border-l border-stone-300 pl-2 sm:pl-3 whitespace-nowrap shrink-0 text-[11px] sm:text-xs">
            <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{userLocation}: {isBn ? toBengaliNumber(weatherTemp) : weatherTemp}°C</span>
            <span className="hidden xl:inline text-stone-500">({weatherCondition})</span>
          </div>

          {/* Social Links on wide screens */}
          <div className="hidden 2xl:flex items-center gap-1 border-l border-stone-300 pl-3 shrink-0">
            <span className="text-stone-500 text-[11px] mr-1 whitespace-nowrap">
              {isBn ? 'অনুসরণ করুন:' : 'Follow Us:'}
            </span>
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.name}
                aria-label={item.name}
                className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Edition Switcher, Font Resize, Language, E-paper & Admin Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0 flex-nowrap">
          {/* Edition Selection */}
          <div className="flex items-center bg-stone-200/90 rounded-md p-0.5 border border-stone-300 text-[11px] font-medium shrink-0">
            <button
              type="button"
              onClick={() => dispatch(setEdition('national'))}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                edition === 'national' ? 'bg-rose-700 text-white font-bold shadow-2xs' : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {isBn ? 'জাতীয়' : 'National'}
            </button>
            <button
              type="button"
              onClick={() => dispatch(setEdition('international'))}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                edition === 'international' ? 'bg-rose-700 text-white font-bold shadow-2xs' : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {isBn ? 'আন্তর্জাতিক' : 'Global'}
            </button>
          </div>

          {/* E-Paper Link (visible on xs and up, inside mobile drawer on small) */}
          <Link
            to="/epaper"
            className="hidden xs:flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 text-[11px] sm:text-xs font-semibold shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title="Read Today's E-Paper"
            aria-label="Open Digital E-Paper Reader"
          >
            <Newspaper className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>{isBn ? 'ই-পেপার' : 'E-Paper'}</span>
          </Link>

          {/* Archive Link */}
          <Link
            to="/archive"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-medium shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title="Browse News Archive"
            aria-label="Browse News Archive"
          >
            <Archive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{isBn ? 'আর্কাইভ' : 'Archive'}</span>
          </Link>

          {/* Community Link */}
          <Link
            to="/community"
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-medium shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title={isBn ? 'নাগরিক সাংবাদিকতা ও পাঠক কমিউনিটি' : 'Citizen Journalism & Community'}
            aria-label="Community Hub"
          >
            <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>{isBn ? 'কমিউনিটি' : 'Community'}</span>
          </Link>

          {/* Events Link */}
          <Link
            to="/events"
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-medium shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title={isBn ? 'ইভেন্ট, প্রতিযোগিতা ও বিশেষ প্রকল্প' : 'Events & Special Projects'}
            aria-label="Events Hub"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>{isBn ? 'ইভেন্ট ও প্রকল্প' : 'Events'}</span>
          </Link>

          {/* Premium Membership Link */}
          <Link
            to="/subscribe"
            className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all shrink-0 whitespace-nowrap"
            title={isBn ? 'প্রিমিয়াম সাবস্ক্রিপশন ও অ্যাড-ফ্রি পাঠ' : 'Premium Membership & Ad-Free Reading'}
            aria-label="Premium Membership"
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>{isBn ? 'প্রিমিয়াম' : 'Premium'}</span>
          </Link>

          {/* Font Resizer */}
          <button
            type="button"
            onClick={() => dispatch(toggleFontSize())}
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-200 text-stone-700 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            title={fontSize === 'normal' ? 'বড় হরফ (Large Text)' : 'স্বাভাবিক হরফ (Normal Text)'}
            aria-label="Toggle text size"
          >
            <Type className="w-3.5 h-3.5 shrink-0" />
            <span>{fontSize === 'normal' ? 'A+' : 'A-'}</span>
          </button>

          {/* English/Bangla Language Switcher */}
          <button
            type="button"
            onClick={() => dispatch(toggleLanguage())}
            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 hover:border-stone-400 text-[11px] sm:text-xs font-bold shadow-2xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            title="Switch Language"
            aria-label="Switch Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{isBn ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Admin Editorial Portal Link */}
          <Link
            to={isAdmin ? '/' : '/admin'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              isAdmin
                ? 'bg-amber-500 text-stone-950 font-bold hover:bg-amber-400'
                : 'bg-stone-900 hover:bg-black text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAdmin
                ? (isBn ? 'মূল পাতায় ফিরুন' : 'Back to News')
                : (isBn ? 'সম্পাদকীয় প্যানেল' : 'Admin CMS')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopUtilityBar;

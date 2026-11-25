import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSearchModalOpen,
  setMobileDrawerOpen,
  toggleTheme
} from '../../store/uiSlice.js';
import { setSelectedCategory } from '../../store/newsSlice.js';
import { useFeaturedArticles, useBreakingArticles, usePublicArticles, usePortalSettings } from '../../hooks/usePortalData.js';
import { Menu, Search, Bookmark, Sun, Moon } from 'lucide-react';

/**
 * Broadsheet Masthead Header (Styled like Prothom Alo & international broadsheets)
 * Left: Bold, authentic newspaper logo & crest
 * Right: 3 curated trending/highlight news items with thumbnails & red category tags
 */
export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language, theme } = useSelector((state) => state.ui);
  const isDark = theme === 'dark';
  const { settings } = usePortalSettings();
  const { articles: featuredArticles } = useFeaturedArticles({ per_page: 3 });
  const { items: breakingItems } = useBreakingArticles();
  const { articles: recentArticles } = usePublicArticles({ per_page: 3 });

  const isBn = language === 'bn';

  const websiteName = isBn
    ? (settings?.websiteNameBn || settings?.portalNameBn || 'দৈনিক বার্তা প্রবাহ')
    : (settings?.websiteNameEn || settings?.portalNameEn || 'Daily Prabaho');

  const rawTagline = settings?.tagline || '';
  const hasBengaliTagline = /[\u0980-\u09FF]/.test(rawTagline);
  const tagline = isBn
    ? (rawTagline || 'সত্যের সন্ধানে অবিচল প্রতিদিনের কণ্ঠস্বর')
    : (settings?.taglineEn || (!hasBengaliTagline && rawTagline ? rawTagline : 'Unwavering Voice in Search of Truth'));

  // Curate up to 3 prominent real stories for the masthead
  const mastheadHighlights = useMemo(() => {
    const list = [...(featuredArticles || []), ...(breakingItems || []), ...(recentArticles || [])];
    const seen = new Set();
    const result = [];
    for (const item of list) {
      if (!item || !item.title) continue;
      const key = item.id || item.slug || item.title;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
      if (result.length >= 3) break;
    }
    return result;
  }, [featuredArticles, breakingItems, recentArticles]);

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Mobile Navigation Drawer Trigger */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => dispatch(setMobileDrawerOpen(true))}
              aria-label="Open mobile navigation menu"
              className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Left: Brand Logo (Prothom Alo style: left-aligned, bold, authentic masthead) */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 cursor-pointer select-none"
            onClick={() => dispatch(setSelectedCategory('all'))}
          >
            {/* Custom Deep-Crimson Crest Icon */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-stone-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight font-serif-bn group-hover:text-rose-800 transition-colors leading-none">
                {websiteName}
              </h1>
              <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 mt-1 font-serif-bn tracking-wide">
                {tagline}
              </span>
            </div>
          </Link>

          {/* Right: 3 Mini News Highlights (Desktop/Tablet - Exactly like Prothom Alo masthead) */}
          <div className="hidden md:flex items-center justify-end flex-1 divide-x divide-stone-200">
            {mastheadHighlights.slice(0, 3).map((item, idx) => {
              const image = item.image || item.imageUrl || item.thumbnail;
              const link = `/news/${item.slug || item.id}`;
              return (
                <Link
                  key={item.id || idx}
                  to={link}
                  className="flex items-center gap-2.5 px-3 lg:px-4 group max-w-[210px] lg:max-w-[235px] xl:max-w-[255px] shrink-0"
                >
                  {image && (
                    <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-xs overflow-hidden bg-stone-100 shrink-0 ring-1 ring-stone-200">
                      <img
                        src={image}
                        alt={isBn ? item.title : (item.titleEn || item.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-xs bg-rose-600 shrink-0 inline-block"></span>
                      {(item.categoryName || item.categoryNameEn) && (
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-tight truncate">
                          {isBn ? item.categoryName : (item.categoryNameEn || item.categoryName)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] lg:text-[12px] font-semibold text-stone-900 group-hover:text-rose-700 leading-snug font-serif-bn line-clamp-2 transition-colors">
                      {isBn ? item.title : (item.titleEn || item.title)}
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile / Tablet Quick Actions (Theme Toggle, Search, Bookmarks) */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle Dark Mode"
              title={isDark ? (isBn ? 'লাইট মোড' : 'Light Mode') : (isBn ? 'ডার্ক মোড' : 'Dark Mode')}
              className="p-2 text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => dispatch(setSearchModalOpen(true))}
              aria-label="Search"
              className="p-2 text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer md:hidden"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/reader/profile?tab=bookmarks')}
              aria-label="Saved Articles"
              className="p-2 text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer md:hidden"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { setSelectedCategory } from '../../store/newsSlice.js';
import {
  setSearchModalOpen,
  setMobileDrawerOpen,
  toggleLanguage,
  toggleTheme
} from '../../store/uiSlice.js';
import {
  selectIsReaderAuthenticated,
  selectReaderUser,
  readerLogout
} from '../../store/readerSlice.js';
import { useReaderLogoutMutation } from '../../store/api/readerApi.js';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories } from '../../hooks/usePortalData.js';
import { SPRING_SNAPPY, MotionDropdown } from '../common/MotionPrimitives.jsx';
import {
  Search,
  Newspaper,
  Globe2,
  User,
  Menu,
  LogOut,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

/**
 * Broadsheet Navigation Bar (Styled like Prothom Alo Image 2)
 * Left: Primary Category Links (সর্বশেষ, বাংলাদেশ, রাজনীতি, বিশ্ব, বাণিজ্য, ইত্যাদি)
 * Right: Integrated utilities (🔍 খুঁজুন, 📰 ই-পেপার, 🌐 Eng, 👤 Login, ☰)
 */
export function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, theme } = useSelector((state) => state.ui);
  const isDark = theme === 'dark';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);
  const [apiReaderLogout] = useReaderLogoutMutation();
  const { categories, isLoading } = usePortalCategories();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isBn = language === 'bn';
  const isHome = location.pathname === '/' || location.pathname === '';

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // Update scroll indicators on resize and category data changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateScrollState());
      observer.observe(el);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [categories, updateScrollState]);

  // Smooth mouse-wheel scrolling for category list
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheelScroll = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        const canScroll =
          (e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) ||
          (e.deltaY < 0 && el.scrollLeft > 1);

        if (canScroll) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
          updateScrollState();
        }
      }
    };

    el.addEventListener('wheel', handleWheelScroll, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelScroll);
  }, [updateScrollState]);

  // Auto-scroll active category into view upon navigation
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [location.pathname]);

  const scrollCategories = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleReaderLogout = async () => {
    setUserDropdownOpen(false);
    try {
      await apiReaderLogout().unwrap();
    } catch {
      // Clear local session regardless
    }
    dispatch(readerLogout());
    navigate('/');
  };

  // Live categories from API with static fallback
  const sourceCategories = categories.length > 0 ? categories : (isLoading ? CATEGORIES : []);
  const navMenuItems = sourceCategories.map((c) => ({
    id: c.id || c.slug,
    labelBn: c.name,
    labelEn: c.nameEn || c.name,
    path: `/category/${c.slug}`,
    slug: c.slug
  }));

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 min-w-0">
          
          {/* Left Side: Scrollable Categories with Smooth Navigation Controls */}
          <div className="relative flex-1 min-w-0 flex items-center">
            
            {/* Left Scroll Navigation Button with Subtle Gradient Mask */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-4 bg-gradient-to-r from-white via-white/95 dark:from-[#111827] dark:via-[#111827]/95 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="pointer-events-auto p-1 rounded-full bg-white shadow-xs border border-stone-200 text-stone-600 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer focus:outline-hidden"
                  aria-label={isBn ? 'পূর্ববর্তী বিভাগসমূহ' : 'Scroll categories left'}
                  title={isBn ? 'পূর্ববর্তী বিভাগ' : 'Previous categories'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Inner Horizontal Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={updateScrollState}
              className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar py-2.5 min-w-0 scroll-smooth w-full"
            >
              {/* 1. সর্বশেষ / Home */}
              <Link
                to="/"
                data-active={isHome ? 'true' : 'false'}
                onClick={() => dispatch(setSelectedCategory('all'))}
                className={`relative px-2 xl:px-2.5 py-1 text-[13px] xl:text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isHome
                    ? 'text-rose-700 font-extrabold'
                    : 'text-stone-800 hover:text-rose-700'
                }`}
              >
                <span>{isBn ? 'সর্বশেষ' : 'Latest'}</span>
                {isHome && (
                  <motion.span
                    layoutId="public-navbar-indicator"
                    transition={SPRING_SNAPPY}
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-rose-700 rounded-full"
                  />
                )}
              </Link>

              {/* 2. Canonical News Categories */}
              {navMenuItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => dispatch(setSelectedCategory(item.slug || 'all'))}
                    className={`relative px-2 xl:px-2.5 py-1 text-[13px] xl:text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-rose-700 font-extrabold'
                        : 'text-stone-800 hover:text-rose-700'
                    }`}
                  >
                    {isBn ? item.labelBn : item.labelEn}
                    {isActive && (
                      <motion.span
                        layoutId="public-navbar-indicator"
                        transition={SPRING_SNAPPY}
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-rose-700 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}

              {/* 3. ভিডিও / মাল্টিমিডিয়া */}
              <Link
                to="/multimedia"
                data-active={location.pathname.startsWith('/multimedia') ? 'true' : 'false'}
                className={`relative px-2 xl:px-2.5 py-1 text-[13px] xl:text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  location.pathname.startsWith('/multimedia')
                    ? 'text-rose-700 font-extrabold'
                    : 'text-stone-800 hover:text-rose-700'
                }`}
              >
                <span>{isBn ? 'ভিডিও' : 'Video'}</span>
              </Link>

              {/* 4. সরাসরি (Live Updates) */}
              <Link
                to="/live"
                data-active={location.pathname.startsWith('/live') ? 'true' : 'false'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-all cursor-pointer ml-1 ${
                  location.pathname.startsWith('/live')
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
                <span>{isBn ? 'সরাসরি' : 'Live'}</span>
              </Link>
            </div>

            {/* Right Scroll Navigation Button with Subtle Gradient Mask */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-4 bg-gradient-to-l from-white via-white/95 dark:from-[#111827] dark:via-[#111827]/95 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="pointer-events-auto p-1 rounded-full bg-white shadow-xs border border-stone-200 text-stone-600 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer focus:outline-hidden"
                  aria-label={isBn ? 'পরবর্তী বিভাগসমূহ' : 'Scroll categories right'}
                  title={isBn ? 'পরবর্তী বিভাগ' : 'Next categories'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Prothom Alo-Style Integrated Utilities Toolbar */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0 border-l border-stone-200 pl-3 py-1.5 bg-white z-20">
            {/* 1. খুঁজুন (Search Trigger) */}
            <button
              type="button"
              onClick={() => dispatch(setSearchModalOpen(true))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-stone-700 hover:text-rose-700 hover:bg-stone-100 rounded-md text-xs xl:text-sm font-semibold transition-colors cursor-pointer"
              title={isBn ? 'সংবাদ অনুসন্ধান' : 'Search Articles'}
            >
              <Search className="w-4 h-4 text-stone-600" />
              <span>{isBn ? 'খুঁজুন' : 'Search'}</span>
            </button>

            {/* 2. ই-পেপার (E-Paper) */}
            <Link
              to="/epaper"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-stone-700 hover:text-rose-700 hover:bg-stone-100 rounded-md text-xs xl:text-sm font-semibold transition-colors cursor-pointer"
              title={isBn ? 'আজকের ই-পেপার পড়ুন' : 'Read Digital E-Paper'}
            >
              <Newspaper className="w-4 h-4 text-stone-600" />
              <span>{isBn ? 'ই-পেপার' : 'E-Paper'}</span>
            </Link>

            {/* 3. Eng / বাংলা (Language Switcher) */}
            <button
              type="button"
              onClick={() => dispatch(toggleLanguage())}
              className="flex items-center gap-1 px-2.5 py-1.5 text-stone-700 hover:text-rose-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-xs xl:text-sm font-semibold transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe2 className="w-4 h-4 text-stone-600" />
              <span>{isBn ? 'Eng' : 'বাংলা'}</span>
            </button>

            {/* 3.5. Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="p-1.5 text-stone-700 hover:text-rose-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
              title={isDark ? (isBn ? 'লাইট মোড' : 'Light Mode') : (isBn ? 'ডার্ক মোড' : 'Dark Mode')}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
            </button>

            {/* 4. Login / User Profile (Clean Reader Portal) */}
            <div className="relative">
              {isReaderAuth ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md text-xs xl:text-sm font-bold transition-colors cursor-pointer border border-stone-200"
                  >
                    <User className="w-3.5 h-3.5 text-rose-700" />
                    <span className="truncate max-w-[90px]">
                      {readerUser?.name?.split(' ')[0] || (isBn ? 'প্রোফাইল' : 'Profile')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                  </button>

                  <MotionDropdown
                    isOpen={userDropdownOpen}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-2 text-xs"
                  >
                    <div className="p-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 text-sm truncate">{readerUser?.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{readerUser?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/reader/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-800 font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-stone-500" />
                        <span>{isBn ? 'আমার পাঠক প্রোফাইল' : 'My Reader Profile'}</span>
                      </Link>

                      <Link
                        to="/reader/profile?tab=bookmarks"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-800 font-medium transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-stone-500" />
                        <span>{isBn ? 'সংরক্ষিত সংবাদ তালিকা' : 'Saved Bookmarks'}</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={handleReaderLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </MotionDropdown>
                </div>
              ) : (
                <Link
                  to="/reader/login"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-stone-800 hover:text-rose-700 hover:bg-stone-100 rounded-md text-xs xl:text-sm font-bold transition-colors cursor-pointer"
                  title={isBn ? 'পাঠক অ্যাকাউন্টে লগইন করুন' : 'Sign In'}
                >
                  <User className="w-4 h-4 text-stone-600" />
                  <span>{isBn ? 'লগইন' : 'Login'}</span>
                </Link>
              )}
            </div>

            {/* 5. সকল বিভাগ / Drawer Menu Trigger */}
            <button
              type="button"
              onClick={() => dispatch(setMobileDrawerOpen(true))}
              className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer ml-0.5"
              title={isBn ? 'সকল বিভাগ' : 'All Sections'}
              aria-label="All Sections"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

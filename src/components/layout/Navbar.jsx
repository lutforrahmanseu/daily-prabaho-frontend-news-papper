import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { setSelectedCategory } from '../../store/newsSlice.js';
import {
  setSearchModalOpen,
  setMobileDrawerOpen,
  toggleLanguage
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
  ChevronDown
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
  const { language } = useSelector((state) => state.ui);
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);
  const [apiReaderLogout] = useReaderLogoutMutation();
  const { categories, isLoading } = usePortalCategories();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isBn = language === 'bn';
  const isHome = location.pathname === '/' || location.pathname === '';

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
        <div className="flex items-center justify-between gap-2">
          
          {/* Left Side: Scrollable Categories (Prothom Alo broadsheet taxonomy) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-2.5 min-w-0">
            {/* 1. সর্বশেষ / Home */}
            <Link
              to="/"
              onClick={() => dispatch(setSelectedCategory('all'))}
              className={`relative px-2.5 py-1 text-sm font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
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
                  onClick={() => dispatch(setSelectedCategory(item.slug || 'all'))}
                  className={`relative px-2.5 py-1 text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
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
              className={`relative px-2.5 py-1 text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
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

          {/* Right Side: Prothom Alo-Style Integrated Utilities Toolbar */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0 border-l border-stone-200 pl-3 py-1.5">
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-stone-700 hover:text-rose-700 hover:bg-stone-100 rounded-md text-xs xl:text-sm font-semibold transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe2 className="w-4 h-4 text-stone-600" />
              <span>{isBn ? 'Eng' : 'বাংলা'}</span>
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
                  to="/reader/auth?mode=login"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-stone-800 hover:text-rose-700 hover:bg-stone-100 rounded-md text-xs xl:text-sm font-bold transition-colors cursor-pointer"
                  title={isBn ? 'পাঠক অ্যাকাউন্টে লগইন করুন' : 'Sign In'}
                >
                  <User className="w-4 h-4 text-stone-600" />
                  <span>{isBn ? 'Login' : 'Login'}</span>
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

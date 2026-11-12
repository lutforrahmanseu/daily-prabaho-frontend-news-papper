import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { setSelectedCategory } from '../../store/newsSlice.js';
import { setMobileDrawerOpen } from '../../store/uiSlice.js';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories } from '../../hooks/usePortalData.js';
import { Home, MoreHorizontal, Radio, Layers, Film, Sparkles, Newspaper, Archive, Users, Calendar, MapPin } from 'lucide-react';
import { SPRING_SNAPPY } from '../common/MotionPrimitives.jsx';

export function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { language } = useSelector((state) => state.ui);
  const { categories, isLoading } = usePortalCategories();

  const isBn = language === 'bn';
  const isHome = location.pathname === '/';

  // Live categories from Laravel API (fallback to static taxonomy only while initial fetch resolves)
  const sourceCategories = categories.length > 0 ? categories : (isLoading ? CATEGORIES : []);
  const navMenuItems = sourceCategories.map((c) => ({
    id: c.id || c.slug,
    labelBn: c.name,
    labelEn: c.nameEn || c.name,
    path: `/category/${c.slug}`,
    slug: c.slug
  }));

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 sm:py-2.5">
          
          {/* Home Link */}
          <Link
            to="/"
            onClick={() => dispatch(setSelectedCategory('all'))}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
              isHome
                ? 'text-rose-700 bg-rose-50 font-bold'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{isBn ? 'প্রচ্ছদ' : 'Home'}</span>
            {isHome && (
              <motion.span
                layoutId="public-navbar-indicator"
                transition={SPRING_SNAPPY}
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-rose-700 rounded-full"
              />
            )}
          </Link>

          {/* Configured Categories / Nav Items */}
          {navMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const categorySlug = item.path.replace(/^\/category\//, '');
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => dispatch(setSelectedCategory(categorySlug || 'all'))}
                className={`relative px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-rose-700 bg-rose-50 font-bold'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
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

          <Link
            to="/live"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/live')
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isBn ? 'সরাসরি' : 'Live'}</span>
          </Link>

          <Link
            to="/coverage"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/coverage')
                ? 'bg-stone-900 text-white dark:bg-rose-700'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isBn ? 'বিশেষ আয়োজন' : 'Special Coverage'}</span>
          </Link>

          <Link
            to="/multimedia"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/multimedia') || location.pathname.startsWith('/stories')
                ? 'bg-stone-900 text-white dark:bg-rose-700'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{isBn ? 'মাল্টিমিডিয়া' : 'Multimedia'}</span>
          </Link>

          <Link
            to="/for-you"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/for-you')
                ? 'bg-stone-900 text-white dark:bg-rose-700'
                : 'text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'আমার পাতা' : 'For You'}</span>
          </Link>

          <Link
            to="/epaper"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/epaper')
                ? 'bg-rose-700 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>{isBn ? 'ই-পেপার' : 'E-Paper'}</span>
          </Link>

          <Link
            to="/archive"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/archive')
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isBn ? 'আর্কাইভ' : 'Archive'}</span>
          </Link>

          <Link
            to="/community"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/community') || location.pathname.startsWith('/citizen')
                ? 'bg-teal-700 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isBn ? 'কমিউনিটি' : 'Community'}</span>
          </Link>

          <Link
            to="/local"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/local')
                ? 'bg-rose-700 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isBn ? 'দেশ ও জনপদ' : 'Local News'}</span>
          </Link>

          <Link
            to="/events"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap transition-colors ${
              location.pathname.startsWith('/events') || location.pathname.startsWith('/certificates')
                ? 'bg-rose-700 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isBn ? 'ইভেন্ট ও প্রকল্প' : 'Events'}</span>
          </Link>

          {/* All Sections Drawer Button */}
          <button
            type="button"
            onClick={() => dispatch(setMobileDrawerOpen(true))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-stone-600 hover:text-rose-700 hover:bg-stone-100 whitespace-nowrap shrink-0 border border-stone-200 cursor-pointer"
            title={isBn ? 'সব বিভাগ দেখুন' : 'View all sections'}
            aria-label="View all sections"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>{isBn ? 'সব বিভাগ' : 'All Sections'}</span>
          </button>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

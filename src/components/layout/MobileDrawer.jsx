import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  setMobileDrawerOpen,
  setSearchModalOpen,
  setEpaperModalOpen,
  setActiveView,
  toggleLanguage
} from '../../store/uiSlice.js';
import { setSelectedCategory } from '../../store/newsSlice.js';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories, usePortalSettings } from '../../hooks/usePortalData.js';
import { X, Search, Globe2, Newspaper, ShieldAlert, Home, Bookmark, Radio, Layers, Film, Sparkles, User, Archive, Users, Calendar, MapPin } from 'lucide-react';
import { MotionDrawerOverlay } from '../common/MotionPrimitives.jsx';

export function MobileDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mobileDrawerOpen, language, activeView } = useSelector((state) => state.ui);
  const { selectedCategory, savedArticleIds } = useSelector((state) => state.news);
  const { categories } = usePortalCategories();
  const { settings } = usePortalSettings();
  const drawerCategories = categories.length > 0 ? categories : CATEGORIES;

  const isBn = language === 'bn';

  const handleCategoryClick = (slug) => {
    dispatch(setSelectedCategory(slug));
    dispatch(setMobileDrawerOpen(false));
    if (slug === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${slug}`);
    }
  };

  return (
    <MotionDrawerOverlay
      isOpen={mobileDrawerOpen}
      onBackdropClick={() => dispatch(setMobileDrawerOpen(false))}
      side="left"
      backdropClassName="bg-black/60 backdrop-blur-xs"
      panelClassName="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
    >
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="text-xl font-bold font-serif-bn text-stone-900">
              {isBn ? (settings?.websiteNameBn || 'দৈনিক বার্তা প্রবাহ') : (settings?.websiteNameEn || 'Daily Prabaho')}
            </h3>
            <p className="text-[11px] text-rose-800 font-medium">
              {settings?.tagline || (isBn ? 'ডিজিটাল নিউজ ও সম্পাদকীয় প্ল্যাটফর্ম' : 'Digital News & Editorial Platform')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-stone-100 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              dispatch(setMobileDrawerOpen(false));
              dispatch(setSearchModalOpen(true));
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium cursor-pointer"
          >
            <Search className="w-4 h-4 text-stone-600" />
            <span>{isBn ? 'অনুসন্ধান' : 'Search'}</span>
          </button>

          <Link
            to="/epaper"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium cursor-pointer"
          >
            <Newspaper className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'ই-পেপার' : 'E-Paper'}</span>
          </Link>

          <Link
            to="/archive"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium cursor-pointer"
          >
            <Archive className="w-4 h-4 text-amber-600" />
            <span>{isBn ? 'আর্কাইভ' : 'Archive'}</span>
          </Link>

          <button
            type="button"
            onClick={() => dispatch(toggleLanguage())}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium cursor-pointer"
          >
            <Globe2 className="w-4 h-4 text-cyan-600" />
            <span>{isBn ? 'English' : 'বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              dispatch(setSelectedCategory('saved'));
              dispatch(setMobileDrawerOpen(false));
              navigate('/');
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
            <span>{isBn ? `সংরক্ষিত (${savedArticleIds.length})` : `Saved (${savedArticleIds.length})`}</span>
          </button>
        </div>

        {/* Categories Navigation */}
        <div className="flex-1 p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-1">
            {isBn ? 'বিভাগসমূহ' : 'Sections'}
          </p>

          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-50 text-rose-700'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{isBn ? 'প্রচ্ছদ (মূল পাতা)' : 'Front Page'}</span>
          </button>

          <Link
            to="/live"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-700 bg-rose-50/70 hover:bg-rose-100 transition-colors"
          >
            <Radio className="w-4 h-4" />
            <span>{isBn ? 'সরাসরি সংবাদ (Live)' : 'Live Updates'}</span>
          </Link>

          <Link
            to="/coverage"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Layers className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'বিশেষ আয়োজন' : 'Special Coverage'}</span>
          </Link>

          <Link
            to="/multimedia"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Film className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'মাল্টিমিডিয়া ও পডকাস্ট' : 'Multimedia Hub'}</span>
          </Link>

          <Link
            to="/for-you"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBn ? 'আমার ব্যক্তিগত পাতা (For You)' : 'Personalized Feed'}</span>
          </Link>

          <Link
            to="/community"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Users className="w-4 h-4 text-teal-700" />
            <span>{isBn ? 'নাগরিক সাংবাদিকতা ও কমিউনিটি' : 'Citizen & Community'}</span>
          </Link>

          <Link
            to="/local"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <MapPin className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'দেশ ও জনপদ (জেলা-উপজেলা সংবাদ)' : 'Bangladesh Local News Network'}</span>
          </Link>

          <Link
            to="/events"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Calendar className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'ইভেন্ট, প্রতিযোগিতা ও বিশেষ প্রকল্প' : 'Events & Special Projects'}</span>
          </Link>

          <Link
            to="/reader/profile"
            onClick={() => dispatch(setMobileDrawerOpen(false))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <User className="w-4 h-4 text-stone-600" />
            <span>{isBn ? 'পাঠক প্রোফাইল ও প্রাইভেসি' : 'Reader Profile & Privacy'}</span>
          </Link>

          {drawerCategories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>{isBn ? cat.name : (cat.nameEn || cat.name)}</span>
              {cat.subcategories?.length > 0 && (
                <span className="text-[10px] text-stone-400">({cat.subcategories.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer Admin Entry */}
        <div className="p-4 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => {
              dispatch(setActiveView(activeView === 'admin' ? 'public' : 'admin'));
              dispatch(setMobileDrawerOpen(false));
              if (activeView === 'public') {
                navigate('/admin');
              } else {
                navigate('/');
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {activeView === 'admin'
                ? (isBn ? 'মূল সংবাদ পাতায় যান' : 'Go to Public Portal')
                : (isBn ? 'সম্পাদকীয় প্যানেল (Admin)' : 'Admin Dashboard')}
            </span>
          </button>
        </div>
    </MotionDrawerOverlay>
  );
}

export default MobileDrawer;

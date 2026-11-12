import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSearchModalOpen,
  setMobileDrawerOpen
} from '../../store/uiSlice.js';
import { setSelectedCategory } from '../../store/newsSlice.js';
import {
  selectIsReaderAuthenticated,
  selectReaderUser,
  readerLogout
} from '../../store/readerSlice.js';
import { useReaderLogoutMutation } from '../../store/api/readerApi.js';
import { useReaderBookmark } from '../../hooks/useReaderBookmark.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { useBreakingArticles, usePortalSettings } from '../../hooks/usePortalData.js';
import { MotionDropdown } from '../common/MotionPrimitives.jsx';
import {
  Search,
  Bookmark,
  Menu,
  Bell,
  User,
  X,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);
  const { savedCount } = useReaderBookmark(null);
  const [apiReaderLogout] = useReaderLogoutMutation();
  const { settings } = usePortalSettings();
  const { items: breakingItems } = useBreakingArticles();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isBn = language === 'bn';

  const handleReaderLogout = async () => {
    setUserMenuOpen(false);
    try {
      await apiReaderLogout().unwrap();
    } catch {
      // Clear local reader session regardless
    }
    dispatch(readerLogout());
    navigate('/');
  };

  const breakingAlerts = breakingItems.slice(0, 3);

  const websiteName = isBn
    ? (settings?.websiteNameBn || settings?.portalNameBn || 'দৈনিক বার্তা প্রবাহ')
    : (settings?.websiteNameEn || settings?.portalNameEn || 'Daily Prabaho');

  const tagline = settings?.tagline || (isBn ? 'সত্যের সন্ধানে অবিচল প্রতিদিনের কণ্ঠস্বর' : 'Unwavering Voice in Search of Truth');

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => dispatch(setMobileDrawerOpen(true))}
              aria-label="Open mobile navigation menu"
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Left: Newspaper Credo / Motto */}
          <div className="hidden lg:flex lg:flex-1 flex-col text-xs text-stone-600">
            <div className="max-w-[220px] flex flex-col">
              <span className="font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-700 shrink-0"></span>
                {isBn ? 'স্বাধীন ও বস্তুনিষ্ঠ সাংবাদিকতা' : 'Independent & Objective Journalism'}
              </span>
              <span className="text-stone-500 text-[11px] mt-0.5">
                {isBn ? 'ঢাকা · চট্টগ্রাম · সিলেট · আন্তর্জাতিক' : 'Dhaka · Chittagong · Sylhet · Global'}
              </span>
            </div>
          </div>

          {/* Center: Original NewsFlow Logo Masthead */}
          <Link
            to="/"
            className="text-center flex-1 lg:flex-none cursor-pointer select-none"
            onClick={() => dispatch(setSelectedCategory('all'))}
          >
            <div className="inline-flex flex-col items-center group">
              <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
                {/* NewsFlow Custom SVG Crest Logo Mark */}
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-stone-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-serif-bn group-hover:text-rose-800 transition-colors">
                  {websiteName}
                </h1>
              </div>

              {/* Tagline Ribbon with hairline dividers */}
              <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
                <span className="h-px w-6 sm:w-12 bg-rose-700"></span>
                <p className="text-[10px] sm:text-xs font-semibold text-rose-800 tracking-wider uppercase font-sans">
                  {tagline}
                </p>
                <span className="h-px w-6 sm:w-12 bg-rose-700"></span>
              </div>
            </div>
          </Link>

          {/* Right: Search & User Navigation */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 relative lg:flex-1">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => dispatch(setSearchModalOpen(true))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-white text-stone-700 text-xs transition-all cursor-pointer shadow-2xs"
              title={isBn ? 'সংবাদ খুঁজুন' : 'Search news'}
              aria-label="Search articles"
            >
              <Search className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline font-medium">
                {isBn ? 'অনুসন্ধান' : 'Search'}
              </span>
            </button>

            {/* Saved Articles / Bookmarks Counter */}
            <button
              type="button"
              onClick={() => {
                if (isReaderAuth) {
                  navigate('/reader/profile?tab=bookmarks');
                } else {
                  dispatch(setSelectedCategory('saved'));
                  navigate('/');
                }
              }}
              className="relative p-2 rounded-full border border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:text-rose-700 transition-colors cursor-pointer"
              title={isBn ? 'সংরক্ষিত সংবাদ' : 'Saved Articles'}
              aria-label="Saved Articles"
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {isBn ? toBengaliNumber(savedCount) : savedCount}
                </span>
              )}
            </button>

            {/* Live Alerts Notification Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-full border border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:text-rose-700 transition-colors cursor-pointer"
                title={isBn ? 'জরুরি বিজ্ঞপ্তি' : 'Breaking alerts'}
                aria-label="Notification alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
              </button>

              <MotionDropdown
                isOpen={notificationOpen}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-3 text-xs"
              >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-900 font-serif-bn">
                      {isBn ? 'জরুরি সংবাদ সতর্কতা' : 'Breaking News Alerts'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {breakingAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className="p-2 rounded-lg bg-rose-50/60 hover:bg-rose-100/60 text-stone-800 cursor-pointer transition-colors"
                        onClick={() => {
                          setNotificationOpen(false);
                          dispatch(setSelectedCategory(alert.category));
                        }}
                      >
                        <p className="font-semibold text-rose-900 leading-snug line-clamp-2">
                          {isBn ? alert.title : alert.titleEn}
                        </p>
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          {isBn ? 'সবেমাত্র আপডেট হয়েছে' : 'Just updated'}
                        </span>
                      </div>
                    ))}
                  </div>
              </MotionDropdown>
            </div>

            {/* User Navigation Dropdown / Reader Account & CMS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-full border border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-semibold cursor-pointer transition-colors"
                title={isBn ? 'পাঠক অ্যাকাউন্ট ও মেনু' : 'Reader account'}
                aria-label="User navigation"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isReaderAuth ? 'bg-rose-700 text-white font-bold text-[10px]' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isReaderAuth
                    ? (readerUser?.display_name || readerUser?.name || 'R').charAt(0)
                    : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden md:inline max-w-[110px] truncate">
                  {isReaderAuth
                    ? readerUser?.display_name || readerUser?.name
                    : isBn
                    ? 'পাঠক লগইন'
                    : 'Reader Sign In'}
                </span>
              </button>

              <MotionDropdown
                isOpen={userMenuOpen}
                className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-2 text-xs divide-y divide-stone-100"
              >
                {isReaderAuth ? (
                  <>
                    <div className="p-2">
                      <p className="font-bold text-stone-900 truncate">
                        {readerUser?.display_name || readerUser?.name}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{readerUser?.email}</p>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <Link
                        to="/for-you"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isBn ? 'আমার ব্যক্তিগত ফিড' : 'Personalized Feed'}</span>
                      </Link>
                      <Link
                        to="/reader/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center justify-between"
                      >
                        <span>{isBn ? 'পাঠক প্রোফাইল ও পছন্দ' : 'Profile & Preferences'}</span>
                      </Link>
                      <Link
                        to="/reader/profile?tab=bookmarks"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center justify-between"
                      >
                        <span>{isBn ? 'সংরক্ষিত সংবাদ তালিকা' : 'Saved Reading List'}</span>
                        <span className="font-bold text-rose-700">{savedCount}</span>
                      </Link>
                      <Link
                        to="/reader/profile?tab=privacy"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-700 block"
                      >
                        {isBn ? 'প্রাইভেসি ও ডেটা এক্সপোর্ট' : 'Privacy & Data Controls'}
                      </Link>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={handleReaderLogout}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isBn ? 'লগআউট করুন' : 'Sign Out'}</span>
                      </button>
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 flex items-center gap-2"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সম্পাদকীয় সিএমএস প্যানেল' : 'Admin CMS Portal'}</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2">
                      <p className="font-bold text-stone-900">
                        {isBn ? 'নিউজফ্লো পাঠক অ্যাকাউন্ট' : 'NewsFlow Reader Account'}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {isBn ? 'ব্যক্তিগত নিউজফিড ও বুকমার্ক সিঙ্ক' : 'Sync bookmarks & personalize feed'}
                      </p>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <Link
                        to="/reader/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-bold flex items-center gap-2"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isBn ? 'পাঠক লগইন / নিবন্ধন' : 'Reader Sign In / Register'}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          dispatch(setSelectedCategory('saved'));
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>{isBn ? 'সংরক্ষিত সংবাদ তালিকা' : 'Saved Reading List'}</span>
                        <span className="font-bold text-rose-700">{savedCount}</span>
                      </button>
                    </div>
                    <div className="pt-1">
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 flex items-center gap-2"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সম্পাদকীয় সিএমএস প্যানেল' : 'Admin CMS Portal'}</span>
                      </Link>
                    </div>
                  </>
                )}
              </MotionDropdown>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;

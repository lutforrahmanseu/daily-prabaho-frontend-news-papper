import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopUtilityBar from '../components/layout/TopUtilityBar.jsx';
import Header from '../components/layout/Header.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import BreakingTicker from '../components/layout/BreakingTicker.jsx';
import Footer from '../components/layout/Footer.jsx';
import SearchModal from '../components/layout/SearchModal.jsx';
import EpaperModal from '../components/layout/EpaperModal.jsx';
import MobileDrawer from '../components/layout/MobileDrawer.jsx';
import ArticleDetailModal from '../components/news/ArticleDetailModal.jsx';

/**
 * Public Website Shell Layout
 */
export function PublicLayout({ children }) {
  const language = useSelector((state) => state.ui?.language || 'bn');
  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0b0f19] text-[#111827] dark:text-stone-100 flex flex-col antialiased transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#B91C1C] focus:text-white focus:rounded-md focus:shadow-lg focus:font-semibold focus:text-sm"
      >
        {isBn ? 'মূল সংবাদে যান' : 'Skip to main content'}
      </a>

      {/* 1. Top Utility Ribbon */}
      <TopUtilityBar />

      {/* 2. Editorial Masthead */}
      <Header />

      {/* 3. Sticky Navigation */}
      <Navbar />

      {/* 4. Breaking News Ticker */}
      <BreakingTicker />

      {/* 5. Main Content Canvas */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 focus:outline-none">
        {children || <Outlet />}
      </main>

      {/* 6. Footer */}
      <Footer />

      {/* Global Interactive Modals */}
      <SearchModal />
      <EpaperModal />
      <MobileDrawer />
      <ArticleDetailModal />
    </div>
  );
}

export default PublicLayout;

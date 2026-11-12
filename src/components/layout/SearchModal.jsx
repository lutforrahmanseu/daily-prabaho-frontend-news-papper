import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchModalOpen } from '../../store/uiSlice.js';
import { Modal } from '../common/Modal.jsx';
import { CATEGORIES } from '../../data/categories.js';
import { SearchAutocomplete } from '../search/SearchAutocomplete.jsx';
import { Search, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

export function SearchModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchModalOpen, language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const trendingTags = ['মেট্রোরেল', 'ক্রিকেট', 'পদ্মা সেতু', 'স্টার্টআপ', 'নির্বাচন', 'কক্সবাজার'];

  const handleClose = () => {
    dispatch(setSearchModalOpen(false));
  };

  const handleTagClick = (tag) => {
    handleClose();
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const handleCategoryClick = (catSlug) => {
    handleClose();
    navigate(`/search?category=${encodeURIComponent(catSlug)}`);
  };

  return (
    <Modal
      isOpen={searchModalOpen}
      onClose={handleClose}
      title={isBn ? 'সংবাদ অনুসন্ধান ও আর্কাইভ' : 'Search News & Archives'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 py-1">
        {/* Search Autocomplete with Live Debounced Dropdown */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 font-sans">
            {isBn ? 'অনুসন্ধান করুন' : 'Global Search'}
          </label>
          <SearchAutocomplete
            autoFocus={true}
            onSelect={handleClose}
            placeholder={isBn ? 'যেকোনো শব্দ, শিরোনাম বা বিষয় লিখে খুঁজুন...' : 'Type any keyword, headline, or topic...'}
          />
        </div>

        {/* Popular Topic Tags */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-sans">
            <TrendingUp className="w-3.5 h-3.5 text-rose-700" />
            <span>{isBn ? 'আলোচিত বিষয়সমূহ' : 'Trending Searches'}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-medium transition-colors cursor-pointer font-serif-bn"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Explore by Category */}
        <div className="space-y-2 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-sans block">
            {isBn ? 'বিভাগ অনুযায়ী খুঁজুন' : 'Filter by Section'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50/50 text-xs font-semibold text-stone-800 transition-colors cursor-pointer text-left"
              >
                <span>{isBn ? cat.name : cat.nameEn}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color || '#e11d48' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Link to Full Search Page */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-sans">
            {isBn ? 'তারিখ ও বিভাগ ভিত্তিক সম্পূর্ণ ফলাফল দেখতে:' : 'For advanced filtering and date range:'}
          </span>
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate('/search');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
          >
            <span>{isBn ? 'উন্নত অনুসন্ধান পাতা →' : 'Advanced Search Page →'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SearchModal;

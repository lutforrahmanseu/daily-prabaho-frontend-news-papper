import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MotionDropdown } from '../common/MotionPrimitives.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import {
  getAutocompleteSuggestions,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches
} from '../../services/searchService.js';
import {
  Search,
  X,
  Clock,
  Tag,
  Layers,
  ArrowRight,
  Loader2,
  TrendingUp,
  History,
  Trash2
} from 'lucide-react';

export function SearchAutocomplete({
  placeholder,
  initialQuery = '',
  onSelect,
  autoFocus = false,
  className = ''
}) {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 250);
  const { articles } = usePublicArticles(
    { search: debouncedQuery.trim() || undefined, per_page: 8 },
    { skip: !debouncedQuery.trim() }
  );

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ articles: [], categories: [], tags: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch autocomplete suggestions on debounced query change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions({ articles: [], categories: [], tags: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;

    getAutocompleteSuggestions(debouncedQuery, articles)
      .then((res) => {
        if (active) {
          setSuggestions(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, articles]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle submitting query to dedicated /search page
  const handleSearchSubmit = (searchTerm = query) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);

    if (onSelect) onSelect();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions({ articles: [], categories: [], tags: [] });
    inputRef.current?.focus();
  };

  const handleClearHistory = (e) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hasSuggestions =
    suggestions.articles.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.tags.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={
            placeholder ||
            (isBn ? 'শিরোনাম, বিষয় বা ট্যাগ দিয়ে অনুসন্ধান করুন...' : 'Search by headline, topic, or keyword...')
          }
          className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 focus:border-rose-600 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-sans"
        />

        {loading ? (
          <Loader2 className="w-4 h-4 text-rose-600 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 absolute right-2.5 transition-colors cursor-pointer"
            title={isBn ? 'মুছে ফেলুন' : 'Clear'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Popover */}
      <MotionDropdown
        isOpen={isOpen}
        origin="top center"
        className="absolute left-0 right-0 top-full mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 max-h-[75vh] flex flex-col"
      >
          
          <div className="overflow-y-auto p-3 space-y-4">
            
            {/* 1. If Query is Present and Loading */}
            {loading && !hasSuggestions && (
              <div className="flex items-center justify-center gap-2 py-8 text-stone-400 text-xs font-serif-bn">
                <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
                <span>{isBn ? 'অনুসন্ধান করা হচ্ছে...' : 'Searching archives...'}</span>
              </div>
            )}

            {/* 2. Matched Categories Suggestions */}
            {suggestions.categories.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 block font-sans">
                  {isBn ? 'বিভাগসমূহ' : 'Categories'}
                </span>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {suggestions.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        if (onSelect) onSelect();
                        navigate(`/category/${cat.slug}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-rose-700" />
                      <span>{isBn ? cat.name : cat.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Matched Tags Suggestions */}
            {suggestions.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 block font-sans">
                  {isBn ? 'ট্যাগ ও বিষয়' : 'Topic Tags'}
                </span>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {suggestions.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        if (onSelect) onSelect();
                        navigate(`/tag/${encodeURIComponent(tag)}`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-medium transition-colors cursor-pointer font-serif-bn"
                    >
                      <Tag className="w-3 h-3 text-stone-400" />
                      <span>#{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Matched Articles List */}
            {suggestions.articles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 block font-sans">
                  {isBn ? 'সংশ্লিষ্ট সংবাদ' : 'Matching Stories'}
                </span>
                <div className="space-y-1">
                  {suggestions.articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                        if (onSelect) onSelect();
                        navigate(`/news/${art.slug || art.id}`);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors group"
                    >
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-12 h-10 object-cover rounded-lg bg-stone-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-rose-700 uppercase">
                          {art.categoryName}
                        </span>
                        <h5 className="text-xs font-bold text-stone-900 group-hover:text-rose-700 font-serif-bn truncate">
                          {isBn ? art.title : (art.titleEn || art.title)}
                        </h5>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-rose-700 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Recent Searches (when input is empty or query hasn't matched yet) */}
            {(!query || query.trim() === '') && recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 font-sans">
                    <History className="w-3 h-3" />
                    <span>{isBn ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[10px] text-stone-400 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    {isBn ? 'ইতিহাস মুছুন' : 'Clear all'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 px-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        handleSearchSubmit(term);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition-colors cursor-pointer font-serif-bn"
                    >
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. No Suggestions Found */}
            {query.trim() !== '' && !loading && !hasSuggestions && (
              <div className="py-6 text-center text-stone-500 text-xs font-serif-bn space-y-1">
                <p>{isBn ? 'সরাসরি কোনো সংবাদ বা ট্যাগ মেলেনি।' : 'No direct matches found.'}</p>
                <p className="text-[11px] text-stone-400">
                  {isBn ? 'পুরো আর্কাইভে খুঁজতে এন্টার চাপুন।' : 'Press Enter to search full news archives.'}
                </p>
              </div>
            )}

          </div>

          {/* 7. Footer: View All Results */}
          {query.trim() !== '' && (
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-sans">
                {isBn ? 'বিস্তারিত অনুসন্ধানের ফলাফল দেখতে:' : 'To see full filtered results:'}
              </span>
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <span>{isBn ? 'সকল ফলাফল দেখুন' : 'View all results'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

      </MotionDropdown>
    </div>
  );
}

export default SearchAutocomplete;


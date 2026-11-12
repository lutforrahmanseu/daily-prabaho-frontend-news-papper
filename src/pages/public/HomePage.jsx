import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import FeaturedLeadSection from '../../components/news/FeaturedLeadSection.jsx';
import LiveAndCoverageBanner from '../../components/news/LiveAndCoverageBanner.jsx';
import LatestNewsGrid from '../../components/news/LatestNewsGrid.jsx';
import CategorySection from '../../components/news/CategorySection.jsx';
import VideoNewsSection from '../../components/news/VideoNewsSection.jsx';
import OpinionSection from '../../components/news/OpinionSection.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PersonalizedFeedSection from '../../components/reader/PersonalizedFeedSection.jsx';
import { useReaderBookmark } from '../../hooks/useReaderBookmark.js';
import { setSelectedCategory } from '../../store/newsSlice.js';
import { Sparkles, Layers, ArrowLeft } from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';

export function HomePage() {
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.ui);
  const { selectedCategory, searchQuery, savedArticleIds } = useSelector((state) => state.news);
  const { savedItems: serverSavedItems, isReaderAuth } = useReaderBookmark(null);

  const { articles, isLoading } = usePublicArticles({ per_page: 50 });

  const isBn = language === 'bn';

  // Specific category filters
  const bangladeshNews = articles.filter((a) => a.category === 'bangladesh');
  const politicsNews = articles.filter((a) => a.category === 'politics');
  const worldNews = articles.filter((a) => a.category === 'international');
  const businessNews = articles.filter((a) => a.category === 'economy');
  const sportsNews = articles.filter((a) => a.category === 'sports');
  const entertainmentNews = articles.filter((a) => a.category === 'entertainment');
  const techNews = articles.filter((a) => a.category === 'technology');
  const lifestyleNews = articles.filter((a) => a.category === 'lifestyle');

  // If a category filter is active (not 'all') or search query is present
  const isFiltered = (selectedCategory && selectedCategory !== 'all') || (searchQuery && searchQuery.trim() !== '');

  const filteredArticles =
    selectedCategory === 'saved' && isReaderAuth
      ? serverSavedItems
      : articles.filter((article) => {
          if (selectedCategory === 'saved') {
            return savedArticleIds.includes(article.id);
          }
          if (selectedCategory && selectedCategory !== 'all' && article.category !== selectedCategory) {
            return false;
          }
          if (searchQuery && searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchBn = article.title.toLowerCase().includes(q) || article.excerpt.toLowerCase().includes(q);
            const matchEn = (article.titleEn || '').toLowerCase().includes(q) || (article.excerptEn || '').toLowerCase().includes(q);
            const matchTag = article.tags && article.tags.some(t => t.toLowerCase().includes(q));
            return matchBn || matchEn || matchTag;
          }
          return true;
        });

  return (
    <div className="space-y-8">
      <SEO
        title={isBn ? 'সর্বশেষ সত্য ও বস্তুনিষ্ঠ সংবাদ' : 'Latest Breaking & Objective News'}
        description={isBn ? 'বাংলাদেশ ও আন্তর্জাতিক বিশ্বের সর্বশেষ নির্ভরযোগ্য সংবাদ, রাজনীতি, অর্থনীতি, খেলাধুলা ও মতামত।' : 'Latest reliable news, politics, business, sports, and opinions from Bangladesh and worldwide.'}
      />
      
      {/* 11. Top Leaderboard Advertisement Slot */}
      <AdPlacement placement="leaderboard" />

      {/* If Filter / Search Mode is Active */}
      {isFiltered ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-700" />
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
                  {selectedCategory === 'saved'
                    ? (isBn ? 'আপনার সংরক্ষিত সংবাদসমূহ' : 'Your Saved Reading List')
                    : searchQuery
                    ? (isBn ? `অনুসন্ধানের ফলাফল: "${searchQuery}"` : `Search Results for: "${searchQuery}"`)
                    : (isBn ? `বিভাগ: ${selectedCategory}` : `Section: ${selectedCategory}`)}
                </h2>
                <p className="text-xs text-stone-500">
                  {isBn ? `মোট ${filteredArticles.length}টি প্রতিবেদন পাওয়া গেছে` : `Found ${filteredArticles.length} articles`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dispatch(setSelectedCategory('all'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isBn ? 'সব খবর দেখুন' : 'View All News'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {filteredArticles.length === 0 ? (
                <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
                  <p className="text-stone-500 text-sm">
                    {isBn ? 'এই বিভাগে কোনো সংবাদ পাওয়া যায়নি।' : 'No articles found in this selection.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => dispatch(setSelectedCategory('all'))}
                    className="px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    {isBn ? 'মূল পাতায় ফিরে যান' : 'Return to Front Page'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredArticles.map((art) => (
                    <CategorySection
                      key={art.id}
                      categorySlug={art.category}
                      titleBn={art.categoryName}
                      titleEn={art.categoryNameEn}
                      articles={[art]}
                      columns={1}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <Sidebar />
            </div>
          </div>
        </div>
      ) : (
        /* Full Broad-Sheet News Layout (All 12 Sections) */
        <>
          {/* Personalized Homepage Reader Experience (For You + Recently Viewed) */}
          <PersonalizedFeedSection />

          {/* Live Blogs & Special Coverage Highlights */}
          <LiveAndCoverageBanner />

          {/* 5. Featured News (Lead story + Secondary headlines) */}
          <FeaturedLeadSection />

          {/* In-Feed Mid Page Sponsored Ribbon */}
          <AdPlacement placement="in_feed" />

          {/* 6. Latest News Grid */}
          <LatestNewsGrid />

          {/* Main 2-Column Grid (8 cols Content Streams vs 4 cols Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Main Stream (Col 1 to 8) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* 7. Category-Based Sections */}
              
              {/* Bangladesh Department */}
              <CategorySection
                categorySlug="bangladesh"
                titleBn="বাংলাদেশ"
                titleEn="Bangladesh"
                articles={bangladeshNews}
                columns={2}
              />

              {/* Politics Department */}
              <CategorySection
                categorySlug="politics"
                titleBn="রাজনীতি ও সংস্কার"
                titleEn="Politics & Governance"
                articles={politicsNews}
                columns={2}
              />

              {/* 9. Video News Section */}
              <VideoNewsSection />

              {/* Business & Economy */}
              <CategorySection
                categorySlug="economy"
                titleBn="বাণিজ্য ও অর্থনীতি"
                titleEn="Business & Economy"
                articles={businessNews}
                columns={2}
              />

              {/* 10. Opinion Section */}
              <OpinionSection />

              {/* Sports Department */}
              <CategorySection
                categorySlug="sports"
                titleBn="খেলাধুলা"
                titleEn="Sports"
                articles={sportsNews}
                columns={2}
              />

              {/* International & World */}
              <CategorySection
                categorySlug="international"
                titleBn="বিশ্ব সংবাদ"
                titleEn="World News"
                articles={worldNews}
                columns={2}
              />

              {/* Technology & Innovation */}
              <CategorySection
                categorySlug="technology"
                titleBn="তথ্যপ্রযুক্তি ও বিজ্ঞান"
                titleEn="Tech & Science"
                articles={techNews}
                columns={2}
              />

              {/* Entertainment */}
              <CategorySection
                categorySlug="entertainment"
                titleBn="বিনোদন ও সংস্কৃতি"
                titleEn="Entertainment"
                articles={entertainmentNews}
                columns={2}
              />

              {/* Lifestyle & Tourism */}
              <CategorySection
                categorySlug="lifestyle"
                titleBn="জীবনযাপন ও ভ্রমণ"
                titleEn="Lifestyle & Travel"
                articles={lifestyleNews}
                columns={2}
              />

            </div>

            {/* Right Sidebar (Col 9 to 12) featuring 8. Popular News Sidebar */}
            <div className="lg:col-span-4 sticky top-16">
              <Sidebar />
            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default HomePage;

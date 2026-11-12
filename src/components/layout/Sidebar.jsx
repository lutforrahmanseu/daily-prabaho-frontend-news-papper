import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PopularNews from '../news/PopularNews.jsx';
import TodayPollWidget from '../news/TodayPollWidget.jsx';
import MarketExchangeWidget from '../news/MarketExchangeWidget.jsx';
import NewsletterSubscription from '../common/NewsletterSubscription.jsx';
import AdPlacement from '../common/AdPlacement.jsx';
import { Hash } from 'lucide-react';

export function Sidebar() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const trendingTopics = [
    { nameBn: 'মেট্রোরেল লাইন-৬', nameEn: 'Metro Rail Line-6', slug: 'মেট্রোরেল' },
    { nameBn: 'নির্বাচন সংলাপ', nameEn: 'Election Dialogue', slug: 'নির্বাচন' },
    { nameBn: 'মিরপুরে জয়', nameEn: 'Victory in Mirpur', slug: 'ক্রিকেট' },
    { nameBn: 'পদ্মা করিডর', nameEn: 'Padma Corridor', slug: 'পদ্মা সেতু' },
    { nameBn: 'এআই স্টার্টআপ', nameEn: 'AI Startups', slug: 'স্টার্টআপ' },
    { nameBn: 'কক্সবাজার পর্যটন', nameEn: 'Cox’s Bazar Travel', slug: 'কক্সবাজার' }
  ];

  return (
    <aside className="space-y-6">
      
      {/* 6. Popular News Sidebar with 24h/7d/30d filter */}
      <PopularNews limit={5} />

      {/* Commercial Advertisement Slot */}
      <AdPlacement placement="sidebar" />

      {/* Today's Reader Poll */}
      <TodayPollWidget />

      {/* Trending Topics Tags */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100">
          <Hash className="w-4 h-4 text-rose-700" />
          <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
            {isBn ? 'আলোচিত বিষয়সমূহ' : 'Trending Topics'}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.slug}
              to={`/tag/${encodeURIComponent(topic.slug)}`}
              className="text-xs font-medium px-2.5 py-1 rounded bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 transition-colors"
            >
              #{isBn ? topic.nameBn : topic.nameEn}
            </Link>
          ))}
        </div>
      </div>

      {/* Financial Market & Currency Rates */}
      <MarketExchangeWidget />

      {/* 10. Newsletter Subscription UI Card */}
      <NewsletterSubscription variant="card" />

    </aside>
  );
}

export default Sidebar;

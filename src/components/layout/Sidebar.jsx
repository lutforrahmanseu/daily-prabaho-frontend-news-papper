import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import PopularNews from '../news/PopularNews.jsx';
import TodayPollWidget from '../news/TodayPollWidget.jsx';
import MarketExchangeWidget from '../news/MarketExchangeWidget.jsx';
import NewsletterSubscription from '../common/NewsletterSubscription.jsx';
import AdPlacement from '../common/AdPlacement.jsx';
import { setEpaperModalOpen } from '../../store/uiSlice.js';
import { Hash, Newspaper, BookOpen } from 'lucide-react';

export function Sidebar() {
  const dispatch = useDispatch();
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
      
      {/* 1. Popular News Sidebar with 24h/7d/30d filter */}
      <PopularNews limit={5} />

      {/* 2. Today's E-Paper Edition Preview Card */}
      <div className="bg-white text-stone-900 rounded-xl p-5 shadow-xs border border-stone-200 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-700 text-white">
              <Newspaper className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold font-serif-bn leading-tight text-stone-950">
                {isBn ? 'আজকের মুদ্রিত ই-পেপার' : "Today's E-Paper Edition"}
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {isBn ? 'অনলাইন ডিজিটাল প্রিন্ট সংস্করণ' : 'Digital Broad-sheet Replica'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
            {isBn ? 'ই-সংস্করণ' : 'E-PRINT'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 font-serif-bn leading-relaxed">
          {isBn
            ? 'কাগজের পত্রিকার মতোই পৃষ্ঠা উল্টে ঝকঝকে ফন্ট ও ছবিতে পড়ুন আজকের পুরো পত্রিকা।'
            : 'Turn pages like a real printed newspaper in ultra-high resolution.'}
        </p>

        <button
          type="button"
          onClick={() => dispatch(setEpaperModalOpen(true))}
          className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 active:scale-98 text-white text-xs font-bold font-serif-bn flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <BookOpen className="w-4 h-4" />
          <span>{isBn ? 'ই-পেপার পড়ুন (ক্লিক করুন)' : 'Open E-Paper Reader'}</span>
        </button>
      </div>

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

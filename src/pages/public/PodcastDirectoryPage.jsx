import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones, ArrowRight, Mic } from 'lucide-react';
import { useGetPublicPodcastsQuery } from '../../store/api/multimediaApi.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function PodcastDirectoryPage() {
  const { data, isLoading } = useGetPublicPodcastsQuery({ per_page: 24 });
  const podcasts = data?.items || [];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="rounded-3xl bg-stone-950 text-white p-6 sm:p-10 space-y-2 border border-stone-800">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-700 text-xs font-bold">
          <Headphones className="w-3.5 h-3.5" />
          <span>নিউজফ্লো অডিও ও পডকাস্ট</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black font-serif-bn">সংবাদ, বিশ্লেষণ ও সাপ্তাহিক পডকাস্ট সিরিজ</h1>
        <p className="text-sm text-stone-300 max-w-2xl">
          প্রতিটি পর্বের অডিও প্লেয়ার, পূর্ণাঙ্গ ট্রান্সক্রিপ্ট এবং Spotify, Apple Podcasts ও RSS সাবস্ক্রিপশন লিংক।
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-stone-200 animate-pulse" />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-12">কোনো প্রকাশিত পডকাস্ট সিরিজ পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {podcasts.map((series) => (
            <Link
              key={series.id}
              to={`/multimedia/podcasts/${series.slug}`}
              className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex gap-4 hover:border-rose-400 transition-all shadow-xs"
            >
              <img
                src={series.cover_image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600'}
                alt={series.title}
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    <span>সঞ্চালক: {series.host_name || 'নিউজরুম'}</span>
                  </span>
                  <h2 className="text-lg font-bold font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700 mt-0.5">
                    {series.title}
                  </h2>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">{series.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-stone-500">{toBengaliNumber(series.episodes_count ?? series.episodes?.length ?? 0)}টি পর্ব</span>
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                    <span>শুনুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default PodcastDirectoryPage;


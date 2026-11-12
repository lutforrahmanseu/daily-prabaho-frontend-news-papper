import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Camera,
  Film,
  Mic,
  Headphones,
  ListVideo,
  Clock,
  BarChart2,
  Share2,
  BookOpen,
  Play,
  ArrowRight,
  Layers
} from 'lucide-react';
import { useGetPublicMultimediaOverviewQuery } from '../../store/api/multimediaApi.js';
import VideoPlayerModal from '../../components/news/VideoPlayerModal.jsx';
import { DynamicInfographicCard } from '../../components/live/LiveCoverageShared.jsx';
import {
  AccessibleAudioPlayer,
  InteractiveTimelineViewer,
  SafeSocialEmbedCard
} from '../../components/multimedia/MultimediaWidgets.jsx';
import { formatDurationLabel } from '../../utils/multimediaHelpers.js';
import { formatBengaliRelativeTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';

const HUB_TABS = [
  { id: 'all', label: 'সকল বিভাগ', icon: Layers },
  { id: 'video', label: 'ভিডিও সংবাদ', icon: Film },
  { id: 'gallery', label: 'ফটো গ্যালারি ও স্টোরি', icon: Camera },
  { id: 'audio', label: 'অডিও সংবাদ', icon: Mic },
  { id: 'podcast', label: 'পডকাস্ট', icon: Headphones },
  { id: 'playlist', label: 'ভিডিও প্লেলিস্ট', icon: ListVideo },
  { id: 'timeline', label: 'টাইমলাইন', icon: Clock },
  { id: 'infographic', label: 'ইনফোগ্রাফিক', icon: BarChart2 },
  { id: 'social', label: 'সোশ্যাল পোস্ট', icon: Share2 },
  { id: 'story', label: 'দীর্ঘ প্রতিবেদন', icon: BookOpen }
];

export function MultimediaHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeVideoId, setActiveVideoId] = useState(null);

  const { data: overview, isLoading } = useGetPublicMultimediaOverviewQuery();

  const videos = overview?.videos || [];
  const audioItems = overview?.audio || [];
  const infographics = overview?.infographics || [];
  const socialEmbeds = overview?.social_embeds || [];
  const photoCollections = overview?.photo_collections || [];
  const podcasts = overview?.podcasts || [];
  const playlists = overview?.playlists || [];
  const timelines = overview?.timelines || [];
  const stories = overview?.stories || [];

  const modalVideos = useMemo(
    () =>
      videos.map((v) => ({
        id: `cms-${v.id}`,
        title: v.title,
        titleEn: v.title,
        summary: v.summary || '',
        thumbnail:
          v.thumbnail_url ||
          'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
        videoUrl: v.media_url || '',
        duration: formatDurationLabel(v.duration_seconds, v.duration_label),
        presenter: v.reporter?.name || v.creator?.name || 'ভিডিও ডেস্ক',
        timeAgoBn: v.published_at ? formatBengaliRelativeTime(v.published_at) : 'সাম্প্রতিক',
        timeAgoEn: 'Recent',
        viewsBn: `${toBengaliNumber(v.views_count || 0)} বার`,
        viewsEn: `${v.views_count || 0} views`
      })),
    [videos]
  );

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'all' ? {} : { tab: tabId }, { replace: true });
  };

  const showSection = (id) => activeTab === 'all' || activeTab === id;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-linear-to-br from-stone-950 via-stone-900 to-rose-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-700/90 text-xs font-bold">
            <Film className="w-3.5 h-3.5" />
            <span>নিউজফ্লো মাল্টিমিডিয়া হাব ও স্টোরিটেলিং</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-black font-serif-bn leading-tight">
            ভিডিও, অডিও, ফটো স্টোরি, পডকাস্ট ও তথ্যভিত্তিক ডিজিটাল আর্কাইভ
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            মাঠ পর্যায়ের প্রামাণ্য ভিডিও প্রতিবেদন, স্লাইডশো ফটো গ্যালারি, প্রতিদিনের অডিও বুলেটিন, পডকাস্ট সিরিজ,
            ইন্টারঅ্যাক্টিভ টাইমলাইন ও দীর্ঘ বিশেষ প্রতিবেদন এক ঠিকানায়।
          </p>
        </div>

        {/* Navigation Filter Tabs */}
        <nav aria-label="মাল্টিমিডিয়া বিভাগ ফিল্টার" className="mt-6 flex flex-wrap gap-2">
          {HUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-56 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 1. Video News */}
          {showSection('video') && videos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-700" />
                  <span>ভিডিও সংবাদ</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modalVideos.map((vid) => (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setActiveVideoId(vid.id)}
                    className="group text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-stone-900 overflow-hidden w-full">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-rose-700/95 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </span>
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono">
                        {vid.duration}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-base font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700 line-clamp-2">
                        {vid.title}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">{vid.summary}</p>
                      <p className="text-[11px] text-stone-400 pt-1">{vid.presenter}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 2. Long-form Storytelling */}
          {showSection('story') && stories.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                <BookOpen className="w-5 h-5 text-rose-700" />
                <span>বিশেষ দীর্ঘ প্রতিবেদন (Long-form Storytelling)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/stories/${story.slug}`}
                    className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:border-rose-400 transition-all flex flex-col sm:flex-row"
                  >
                    <div className="sm:w-52 aspect-video sm:aspect-auto bg-stone-900 shrink-0 overflow-hidden">
                      <img
                        src={
                          story.cover_image ||
                          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
                        }
                        alt={story.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-rose-700 mb-1">
                          <span>{story.category?.name || 'বিশেষ অনুসন্ধান'}</span>
                          <span>•</span>
                          <span>{toBengaliNumber(story.reading_time_minutes || 5)} মিনিট পাঠ</span>
                        </div>
                        <h3 className="text-lg font-black font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700 leading-snug">
                          {story.title}
                        </h3>
                        {story.subtitle && (
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">{story.subtitle}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                        <span>পূর্ণাঙ্গ প্রতিবেদন পড়ুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 3. Photo Galleries & Photo Stories */}
          {showSection('gallery') && photoCollections.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                <Camera className="w-5 h-5 text-rose-700" />
                <span>ফটো গ্যালারি ও ফটো স্টোরি</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {photoCollections.map((col) => (
                  <Link
                    key={col.id}
                    to={`/multimedia/galleries/${col.slug}`}
                    className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:border-rose-400 transition-all"
                  >
                    <div className="relative aspect-16/10 bg-stone-900 overflow-hidden">
                      <img
                        src={
                          col.cover_image ||
                          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900'
                        }
                        alt={col.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-bold">
                        {col.collection_type === 'photo_story' ? 'ফটো স্টোরি' : 'ফটো গ্যালারি'}
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="text-base font-bold font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700">
                        {col.title}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {col.location || 'বাংলাদেশ'} • {toBengaliNumber(col.items_count || col.items?.length || 0)}টি আলোকচিত্র
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 4. Audio News & Podcasts */}
          {(showSection('audio') || showSection('podcast')) && (audioItems.length > 0 || podcasts.length > 0) && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {showSection('audio') && audioItems.length > 0 && (
                <div className="lg:col-span-6 space-y-4">
                  <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                    <Mic className="w-5 h-5 text-rose-700" />
                    <span>অডিও সংবাদ বুলেটিন</span>
                  </h2>
                  <div className="space-y-4">
                    {audioItems.map((au) => (
                      <div
                        key={au.id}
                        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3"
                      >
                        <div>
                          <h3 className="font-bold text-base font-serif-bn text-stone-900 dark:text-stone-100">
                            {au.title}
                          </h3>
                          {au.summary && <p className="text-xs text-stone-500 mt-0.5">{au.summary}</p>}
                        </div>
                        <AccessibleAudioPlayer
                          src={au.media_url}
                          title={au.title}
                          durationSeconds={au.duration_seconds}
                          durationLabel={au.duration_label}
                          transcript={au.transcript}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showSection('podcast') && podcasts.length > 0 && (
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                    <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-rose-700" />
                      <span>পডকাস্ট সিরিজ</span>
                    </h2>
                    <Link to="/multimedia/podcasts" className="text-xs font-bold text-rose-700 hover:underline">
                      সকল পডকাস্ট →
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {podcasts.map((series) => (
                      <Link
                        key={series.id}
                        to={`/multimedia/podcasts/${series.slug}`}
                        className="group flex gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-rose-400 transition-all"
                      >
                        <img
                          src={
                            series.cover_image ||
                            'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600'
                          }
                          alt={series.title}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 rounded-xl object-cover shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <span className="text-[11px] font-bold text-rose-700">
                            সঞ্চালক: {series.host_name || 'নিউজরুম'}
                          </span>
                          <h3 className="font-bold text-base font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700">
                            {series.title}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-2">{series.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5. Video Playlists & Interactive Timelines */}
          {(showSection('playlist') || showSection('timeline')) && (playlists.length > 0 || timelines.length > 0) && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {showSection('playlist') && playlists.length > 0 && (
                <div className="lg:col-span-6 space-y-4">
                  <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                    <ListVideo className="w-5 h-5 text-rose-700" />
                    <span>ভিডিও প্লেলিস্ট</span>
                  </h2>
                  <div className="space-y-3">
                    {playlists.map((pl) => (
                      <Link
                        key={pl.id}
                        to={`/multimedia/playlists/${pl.slug}`}
                        className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-rose-400 transition-all"
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-base font-serif-bn text-stone-900 dark:text-stone-100 group-hover:text-rose-700">
                            {pl.title}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-1">{pl.description}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold shrink-0">
                          {toBengaliNumber(pl.items_count || 0)}টি ভিডিও →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {showSection('timeline') && timelines.length > 0 && (
                <div className="lg:col-span-6 space-y-4">
                  <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                    <Clock className="w-5 h-5 text-rose-700" />
                    <span>ইন্টারঅ্যাক্টিভ টাইমলাইন</span>
                  </h2>
                  <div className="space-y-4">
                    {timelines.slice(0, 1).map((tl) => (
                      <div
                        key={tl.id}
                        className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-lg font-serif-bn text-stone-900 dark:text-stone-100">
                              {tl.title}
                            </h3>
                            {tl.subtitle && <p className="text-xs text-stone-500">{tl.subtitle}</p>}
                          </div>
                          <Link
                            to={`/multimedia/timelines/${tl.slug}`}
                            className="text-xs font-bold text-rose-700 hover:underline shrink-0"
                          >
                            পূর্ণাঙ্গ টাইমলাইন →
                          </Link>
                        </div>
                        {Array.isArray(tl.events) && tl.events.length > 0 && (
                          <InteractiveTimelineViewer events={tl.events.slice(0, 3)} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 6. Infographics & Embedded Social Posts */}
          {(showSection('infographic') || showSection('social')) &&
            (infographics.length > 0 || socialEmbeds.length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2">
                  <BarChart2 className="w-5 h-5 text-rose-700" />
                  <span>তথ্যচিত্র (Infographics) ও যাচাইকৃত সোশ্যাল পোস্ট</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {showSection('infographic') &&
                    infographics.map((inf) => (
                      <DynamicInfographicCard
                        key={inf.id}
                        item={{
                          ...inf,
                          badge: inf.category?.name || 'ডেটা গ্রাফিক্স',
                          payload: inf.metadata || {}
                        }}
                      />
                    ))}
                  {showSection('social') &&
                    socialEmbeds.map((emb) => <SafeSocialEmbedCard key={emb.id} item={emb} />)}
                </div>
              </section>
            )}
        </>
      )}

      <VideoPlayerModal
        activeVideoId={activeVideoId}
        videosList={modalVideos}
        onClose={() => setActiveVideoId(null)}
        onSelectVideo={(id) => setActiveVideoId(id)}
      />
    </main>
  );
}

export default MultimediaHubPage;


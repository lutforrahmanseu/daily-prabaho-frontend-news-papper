import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { VIDEO_NEWS_ITEMS } from '../../data/sampleNews.js';
import VideoPlayerModal from './VideoPlayerModal.jsx';
import { Video, Play, Clock, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { EditorialReveal } from '../common/MotionPrimitives.jsx';
import { useGetPublicMultimediaItemsQuery } from '../../store/api/multimediaApi.js';
import { formatDurationLabel } from '../../utils/multimediaHelpers.js';
import { formatBengaliRelativeTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function VideoNewsSection() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [activeModalVideoId, setActiveModalVideoId] = useState(null);
  const { data: cmsVideosData } = useGetPublicMultimediaItemsQuery({
    item_type: 'video',
    per_page: 5
  });

  const videos = useMemo(() => {
    const rawCms = cmsVideosData?.items || [];
    const mappedCms = rawCms.map((item) => ({
      id: `cms-${item.id}`,
      slug: item.slug,
      title: item.title,
      titleEn: item.title,
      summary: item.summary || item.body || '',
      thumbnail:
        item.thumbnail_url ||
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
      videoUrl: item.media_url || '',
      duration: formatDurationLabel(item.duration_seconds, item.duration_label, isBn),
      presenter: item.reporter?.name || item.creator?.name || (isBn ? 'নিউজরুম ভিডিও ডেস্ক' : 'Newsroom Video Desk'),
      timeAgoBn: item.published_at ? formatBengaliRelativeTime(item.published_at) : 'সাম্প্রতিক',
      timeAgoEn: 'Recent',
      viewsBn: `${toBengaliNumber(item.views_count || 0)} বার দেখা হয়েছে`,
      viewsEn: `${item.views_count || 0} views`
    }));

    if (mappedCms.length >= 2) {
      return mappedCms.slice(0, 4);
    }
    return [...mappedCms, ...VIDEO_NEWS_ITEMS].slice(0, 4);
  }, [cmsVideosData, isBn]);

  const mainVideo = videos[0] || VIDEO_NEWS_ITEMS[0];
  const secondaryVideos = videos.slice(1);

  return (
    <EditorialReveal as="section" className="mb-10 pt-6 border-t border-stone-200">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-stone-900">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-rose-700 inline-block rounded-xs"></span>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-bn flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-700" />
            <span>{isBn ? 'ভিডিও সংবাদ ও বিশেষ বুলেটিন' : 'Video News & Bulletins'}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-rose-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'সরাসরি সম্প্রচার' : 'Digital Broadcast'}</span>
          </span>
          <Link
            to="/multimedia"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-900 hover:bg-rose-700 text-white transition-colors"
          >
            <span>{isBn ? 'মাল্টিমিডিয়া হাব' : 'Multimedia Hub'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Big Feature Video (Col 1 to 7) */}
        <div
          onClick={() => setActiveModalVideoId(mainVideo.id)}
          className="lg:col-span-7 group cursor-pointer bg-stone-950 text-white rounded-2xl overflow-hidden shadow-lg border border-stone-800 flex flex-col justify-between"
        >
          <div className="relative aspect-16/9 overflow-hidden bg-stone-900">
            <img
              src={mainVideo.thumbnail}
              alt={mainVideo.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/15 transition-colors">
              <span className="w-16 h-16 rounded-full bg-rose-700/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-rose-600 transition-all">
                <Play className="w-7 h-7 fill-current ml-1" />
              </span>
            </div>

            {/* Live Indicator & Duration */}
            <div className="absolute top-3 left-3 bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-md uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>{isBn ? 'বিশেষ বুলেটিন' : 'SPECIAL REPORT'}</span>
            </div>

            <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-400" />
              <span>{mainVideo.duration}</span>
            </span>
          </div>

          <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-2">
                <span>{isBn ? mainVideo.timeAgoBn : mainVideo.timeAgoEn}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-stone-400 font-normal">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isBn ? mainVideo.viewsBn : mainVideo.viewsEn}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-2xl font-bold font-serif-bn text-white group-hover:text-rose-300 transition-colors leading-snug">
                {isBn ? mainVideo.title : (mainVideo.titleEn || mainVideo.title)}
              </h3>

              <p className="text-stone-300 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed">
                {mainVideo.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between text-xs text-stone-400">
              <span>{isBn ? `উপস্থাপক: ${mainVideo.presenter}` : `Presenter: ${mainVideo.presenter}`}</span>
              <span className="text-rose-400 font-semibold group-hover:underline flex items-center gap-1">
                {isBn ? 'ভিডিও চালান' : 'Watch Video'}
                <Play className="w-3 h-3 fill-current" />
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Video List (Col 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {secondaryVideos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveModalVideoId(vid.id)}
              className="group cursor-pointer bg-stone-900 text-white border border-stone-800 rounded-xl p-3.5 hover:bg-stone-850 hover:border-stone-700 transition-all flex gap-4 flex-1 items-stretch"
            >
              {/* Thumbnail with mini play overlay */}
              <div className="relative w-36 sm:w-44 aspect-16/10 rounded-lg overflow-hidden bg-stone-950 shrink-0">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <span className="w-9 h-9 rounded-full bg-rose-700/90 text-white flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </span>
                </div>
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
                  {vid.duration}
                </span>
              </div>

              {/* Story summary */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-rose-400 font-semibold mb-1">
                    <span>{isBn ? vid.timeAgoBn : vid.timeAgoEn}</span>
                    <span>·</span>
                    <span className="text-stone-400">{isBn ? vid.viewsBn : vid.viewsEn}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-stone-100 group-hover:text-rose-300 font-serif-bn leading-snug line-clamp-2 mb-1.5">
                    {isBn ? vid.title : (vid.titleEn || vid.title)}
                  </h4>

                  <p className="text-stone-400 text-xs line-clamp-2">
                    {vid.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>{vid.presenter}</span>
                  <span className="text-rose-400 font-medium">
                    {isBn ? 'প্লে করুন' : 'Play'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Global Interactive Video Player Modal */}
      <VideoPlayerModal
        activeVideoId={activeModalVideoId}
        videosList={videos}
        onClose={() => setActiveModalVideoId(null)}
        onSelectVideo={(id) => setActiveModalVideoId(id)}
      />
    </EditorialReveal>
  );
}

export default VideoNewsSection;

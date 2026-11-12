import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ListVideo, Play, Clock } from 'lucide-react';
import { useGetPublicVideoPlaylistBySlugQuery } from '../../store/api/multimediaApi.js';
import { formatDurationLabel, parseSafeSocialEmbedUrl } from '../../utils/multimediaHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function VideoPlaylistDetailPage() {
  const { slug } = useParams();
  const { data: playlist, isLoading, isError } = useGetPublicVideoPlaylistBySlugQuery(slug);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slug]);

  if (isLoading) {
    return <main className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-stone-500">প্লেলিস্ট লোড হচ্ছে...</main>;
  }

  if (isError || !playlist) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-base font-bold text-stone-800">ভিডিও প্লেলিস্ট পাওয়া যায়নি।</p>
        <Link to="/multimedia?tab=playlist" className="text-xs font-bold text-rose-700 hover:underline">
          ← মাল্টিমিডিয়া হাবে ফিরে যান
        </Link>
      </main>
    );
  }

  const entries = (playlist.items || []).filter((entry) => entry.video);
  const currentEntry = entries[activeIndex] || entries[0];
  const currentVideo = currentEntry?.video;
  const parsed = parseSafeSocialEmbedUrl(currentVideo?.media_url || '');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/multimedia?tab=playlist"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল ভিডিও প্লেলিস্ট</span>
      </Link>

      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <ListVideo className="w-3.5 h-3.5" />
          <span>ভিডিও প্লেলিস্ট • {toBengaliNumber(entries.length)}টি ভিডিও</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black font-serif-bn text-stone-900 dark:text-stone-100">
          {playlist.title}
        </h1>
        {playlist.description && <p className="text-sm text-stone-600 dark:text-stone-300">{playlist.description}</p>}
      </header>

      {currentVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Stage */}
          <div className="lg:col-span-8 bg-stone-950 text-white rounded-2xl overflow-hidden border border-stone-800 shadow-lg">
            <div className="aspect-video bg-black">
              {parsed.kind === 'iframe' && parsed.embedUrl ? (
                <iframe
                  key={currentVideo.id}
                  src={parsed.embedUrl}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  key={currentVideo.id}
                  src={currentVideo.media_url}
                  poster={currentVideo.thumbnail_url || undefined}
                  controls
                  playsInline
                  onEnded={() => {
                    if (activeIndex < entries.length - 1) setActiveIndex(activeIndex + 1);
                  }}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="p-5 space-y-2">
              {currentEntry.custom_note && (
                <span className="inline-block px-2 py-0.5 rounded bg-rose-700 text-[11px] font-bold">
                  {currentEntry.custom_note}
                </span>
              )}
              <h2 className="text-xl font-bold font-serif-bn">{currentVideo.title}</h2>
              {currentVideo.summary && <p className="text-xs sm:text-sm text-stone-300">{currentVideo.summary}</p>}
            </div>
          </div>

          {/* Playlist Queue */}
          <aside className="lg:col-span-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
            <h3 className="text-sm font-black font-serif-bn text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2">
              প্লেলিস্ট তালিকা ({toBengaliNumber(entries.length)})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {entries.map((entry, idx) => {
                const vid = entry.video;
                const active = idx === activeIndex;
                return (
                  <button
                    key={entry.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full text-left flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
                        : 'bg-stone-50 dark:bg-stone-800/40 border-transparent hover:border-stone-200'
                    }`}
                  >
                    <div className="relative w-24 aspect-16/10 bg-stone-900 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={
                          vid.thumbnail_url ||
                          'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400'
                        }
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold font-serif-bn text-stone-900 dark:text-stone-100 line-clamp-2">
                        {vid.title}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-mono mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDurationLabel(vid.duration_seconds, vid.duration_label)}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      ) : (
        <p className="text-sm text-stone-500">এই প্লেলিস্টে এখনো কোনো ভিডিও যুক্ত করা হয়নি।</p>
      )}
    </main>
  );
}

export default VideoPlaylistDetailPage;


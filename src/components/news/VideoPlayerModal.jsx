import React from 'react';
import { useSelector } from 'react-redux';
import { VIDEO_NEWS_ITEMS } from '../../data/sampleNews.js';
import { X, Clock, Eye, Share2, Film } from 'lucide-react';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';
import { parseSafeSocialEmbedUrl } from '../../utils/multimediaHelpers.js';

export function VideoPlayerModal({ activeVideoId, videosList = null, onClose, onSelectVideo }) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const pool = Array.isArray(videosList) && videosList.length > 0 ? videosList : VIDEO_NEWS_ITEMS;
  const currentVideo = pool.find((v) => v.id === activeVideoId) || pool[0];
  const relatedVideos = pool.filter((v) => v.id !== currentVideo.id);
  const parsedVideo = parseSafeSocialEmbedUrl(currentVideo?.videoUrl || '');

  return (
    <MotionOverlay
      isOpen={Boolean(activeVideoId)}
      onBackdropClick={onClose}
      ariaLabel="Video Player"
      wrapperClassName="z-50 p-3 sm:p-6"
      backdropClassName="bg-black/85 backdrop-blur-md"
      panelClassName="w-full max-w-4xl bg-stone-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[90vh]"
    >
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-stone-900 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {isBn ? 'নিউজফ্লো ভিডিও বুলেটিন' : 'NewsFlow Video Bulletin'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close video player"
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-16/9 bg-black overflow-hidden flex items-center justify-center shrink-0">
          {parsedVideo.kind === 'iframe' && parsedVideo.embedUrl ? (
            <iframe
              key={currentVideo.id}
              src={parsedVideo.embedUrl}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <video
              key={currentVideo.id}
              src={currentVideo.videoUrl}
              poster={currentVideo.thumbnail}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video.
            </video>
          )}
        </div>

        {/* Video Metadata & Controls */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-3 text-xs text-rose-400 font-semibold mb-1.5">
              <span>{isBn ? currentVideo.timeAgoBn : currentVideo.timeAgoEn}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-stone-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{isBn ? currentVideo.viewsBn : currentVideo.viewsEn}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-stone-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentVideo.duration}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif-bn text-white leading-snug">
              {isBn ? currentVideo.title : (currentVideo.titleEn || currentVideo.title)}
            </h2>

            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              {currentVideo.summary}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-stone-800 mt-3 text-xs text-stone-400">
              <span className="font-medium text-stone-300">
                {isBn ? `উপস্থাপক: ${currentVideo.presenter}` : `Anchor: ${currentVideo.presenter}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert(isBn ? 'ভিডিও লিংক কপি করা হয়েছে!' : 'Video link copied!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'শেয়ার' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Related Video Playlist */}
          <div className="pt-3 border-t border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <span>{isBn ? 'অন্যান্য ভিডিও প্রতিবেদন' : 'More Video Stories'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => onSelectVideo(vid.id)}
                  className="group flex gap-3 p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 cursor-pointer transition-colors"
                >
                  <div className="relative w-24 aspect-16/10 rounded-lg overflow-hidden bg-stone-950 shrink-0">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded font-mono">
                      {vid.duration}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-white group-hover:text-rose-400 line-clamp-2 leading-snug">
                      {isBn ? vid.title : (vid.titleEn || vid.title)}
                    </h4>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      {isBn ? vid.viewsBn : vid.viewsEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
    </MotionOverlay>
  );
}

export default VideoPlayerModal;

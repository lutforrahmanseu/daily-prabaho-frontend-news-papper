import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Clapperboard, Eye, Share2, CheckCircle2, ArrowRight, Copy, Captions } from 'lucide-react';
import {
  useGetPublicCreatorShowcaseQuery,
  useCollectCreatorTelemetryMutation,
} from '../../store/api/creatorStudioApi.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import sweetAlert from '../../utils/sweetAlert.js';

export default function CreatorShowcasePage() {
  const { uuid } = useParams();
  const [searchParams] = useSearchParams();
  const { data: showcase, isLoading, isError } = useGetPublicCreatorShowcaseQuery(uuid, { skip: !uuid });
  const [collectTelemetry] = useCollectCreatorTelemetryMutation();

  const [vttBlobUrl, setVttBlobUrl] = useState(null);
  const viewSentRef = useRef(false);
  const playSentRef = useRef(false);
  const completeSentRef = useRef(false);

  const primaryVtt = showcase?.subtitles?.[0]?.vtt_content || '';

  useEffect(() => {
    if (!primaryVtt) {
      setVttBlobUrl(null);
      return undefined;
    }
    const blob = new Blob([primaryVtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    setVttBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [primaryVtt]);

  useEffect(() => {
    if (showcase?.uuid && !viewSentRef.current) {
      viewSentRef.current = true;
      collectTelemetry({
        project_uuid: showcase.uuid,
        event_type: 'view',
        platform: searchParams.get('platform') || 'newsflow_internal',
        utm_source: searchParams.get('utm_source') || undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      }).catch(() => {});
    }
  }, [showcase?.uuid]);

  const handleVideoPlay = () => {
    if (!showcase?.uuid || playSentRef.current) return;
    playSentRef.current = true;
    collectTelemetry({
      project_uuid: showcase.uuid,
      event_type: 'play',
      platform: 'newsflow_internal',
    }).catch(() => {});
  };

  const handleVideoComplete = (e) => {
    if (!showcase?.uuid || completeSentRef.current) return;
    completeSentRef.current = true;
    const duration = Math.round(e?.currentTarget?.duration || 0);
    collectTelemetry({
      project_uuid: showcase.uuid,
      event_type: 'video_complete',
      platform: 'newsflow_internal',
      watch_seconds: duration,
      video_completed: true,
    }).catch(() => {});
  };

  const handleShare = async (channel) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = showcase?.title || 'Daily Prabaho Creator Studio';

    collectTelemetry({
      project_uuid: showcase?.uuid,
      event_type: 'share',
      platform: 'newsflow_internal',
      share_channel: channel,
    }).catch(() => {});

    if (channel === 'copy_link') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        sweetAlert.toast('লিংক কপি হয়েছে', 'success');
      } catch {
        sweetAlert.info('লিংক', shareUrl);
      }
      return;
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
    if (urls[channel]) {
      window.open(urls[channel], '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyCaption = async (caption, hashtags) => {
    const full = [caption, Array.isArray(hashtags) ? hashtags.join(' ') : ''].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(full);
      sweetAlert.toast('ক্যাপশন কপি হয়েছে', 'success');
    } catch {
      sweetAlert.info('ক্যাপশন', full);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        ক্রিয়েটর স্টুডিও কনটেন্ট লোড হচ্ছে...
      </div>
    );
  }

  if (isError || !showcase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <Clapperboard className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="text-xl font-bold text-slate-800">প্রকাশিত প্যাকেজ পাওয়া যায়নি</h1>
        <p className="text-sm text-slate-500">এই ক্রিয়েটর স্টুডিও কনটেন্টটি এখনো প্রকাশিত হয়নি অথবা আর্কাইভ করা হয়েছে।</p>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline">
          প্রচ্ছদে ফিরে যান <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const finalMediaUrl = showcase.final_media_url ? normalizeMediaUrl(showcase.final_media_url) : null;
  const isVideo = finalMediaUrl && /\.(mp4|webm|mov)(\?|$)/i.test(finalMediaUrl);
  const isAudio = finalMediaUrl && /\.(wav|mp3|ogg|webm)(\?|$)/i.test(finalMediaUrl) && !isVideo;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-rose-300 font-bold uppercase tracking-wider">
          <Clapperboard className="w-4 h-4" />
          <span>Daily Prabaho Creator Studio</span>
          {showcase.category?.name && <span>• {showcase.category.name}</span>}
          <span className="px-2 py-0.5 rounded bg-white/10 text-white">{showcase.language}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">{showcase.title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {showcase.views_count} ভিউ
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> {showcase.shares_count} শেয়ার
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> সম্পাদক কর্তৃক অনুমোদিত
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['facebook', 'x', 'whatsapp', 'copy_link'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => handleShare(ch)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold capitalize"
              >
                {ch === 'copy_link' ? 'কপি লিংক' : ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Video / Audio Showcase + Subtitles */}
      {(finalMediaUrl || primaryVtt) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-4 flex items-center justify-center">
            {isVideo ? (
              <video
                controls
                onPlay={handleVideoPlay}
                onEnded={handleVideoComplete}
                className="w-full max-h-[520px] rounded-xl"
                crossOrigin="anonymous"
              >
                <source src={finalMediaUrl} />
                {vttBlobUrl && (
                  <track
                    kind="subtitles"
                    src={vttBlobUrl}
                    srcLang={showcase.language === 'en' ? 'en' : 'bn'}
                    label="Subtitles"
                    default
                  />
                )}
              </video>
            ) : isAudio ? (
              <div className="w-full p-6 text-center space-y-3 text-white">
                <p className="text-sm font-semibold">অডিও বুলেটিন</p>
                <audio controls onPlay={handleVideoPlay} onEnded={handleVideoComplete} className="w-full">
                  <source src={finalMediaUrl} />
                </audio>
              </div>
            ) : finalMediaUrl ? (
              <img src={finalMediaUrl} alt={showcase.title} className="max-h-[520px] rounded-xl object-contain" />
            ) : (
              <div className="text-xs text-slate-400 py-12">ভিজ্যুয়াল অ্যাসেট নিচে দেখুন</div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Captions className="w-4 h-4 text-indigo-600" /> সাবটাইটেল ও মূল সংবাদ
            </h2>
            {showcase.news?.summary && <p className="text-sm text-slate-700 leading-relaxed">{showcase.news.summary}</p>}
            {showcase.news?.slug && (
              <Link
                to={`/news/${showcase.news.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
              >
                সম্পূর্ণ মূল সংবাদ পড়ুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {primaryVtt && (
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {primaryVtt}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Published Social Content Assets */}
      {!!showcase.social_assets?.length && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">সোশ্যাল মিডিয়া ভিজ্যুয়াল ও কার্ডসমূহ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcase.social_assets.map((asset) => {
              const assetImg = asset.media_url ? normalizeMediaUrl(asset.media_url) : null;
              return (
                <div key={asset.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                  {assetImg && (
                    <div className="bg-slate-100 p-3 flex items-center justify-center min-h-[220px]">
                      <img src={assetImg} alt={asset.headline || showcase.title} className="max-h-72 rounded-lg object-contain" />
                    </div>
                  )}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase mb-1">
                        {asset.asset_type} • {asset.aspect_ratio}
                      </span>
                      {asset.headline && <h3 className="text-sm font-bold text-slate-900">{asset.headline}</h3>}
                      {asset.caption_text && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{asset.caption_text}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(asset.caption_text, asset.hashtags)}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 mt-2"
                    >
                      <Copy className="w-3.5 h-3.5" /> ক্যাপশন কপি করুন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Headphones, Mic, Rss } from 'lucide-react';
import { useGetPublicPodcastBySlugQuery } from '../../store/api/multimediaApi.js';
import { AccessibleAudioPlayer } from '../../components/multimedia/MultimediaWidgets.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

const SUBSCRIBE_PLATFORMS = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'apple', label: 'Apple Podcasts' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'rss', label: 'RSS Feed' }
];

export function PodcastDetailPage() {
  const { slug } = useParams();
  const { data: series, isLoading, isError } = useGetPublicPodcastBySlugQuery(slug);

  if (isLoading) {
    return <main className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-stone-500">পডকাস্ট লোড হচ্ছে...</main>;
  }

  if (isError || !series) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-base font-bold text-stone-800">পডকাস্ট সিরিজটি পাওয়া যায়নি।</p>
        <Link to="/multimedia/podcasts" className="text-xs font-bold text-rose-700 hover:underline">
          ← সকল পডকাস্ট সিরিজে ফিরে যান
        </Link>
      </main>
    );
  }

  const episodes = series.episodes || [];
  const subscribeLinks = series.subscribe_links || {};

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        to="/multimedia/podcasts"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল পডকাস্ট</span>
      </Link>

      <header className="rounded-3xl bg-stone-950 text-white p-6 sm:p-8 border border-stone-800 flex flex-col sm:flex-row gap-6 items-start">
        <img
          src={series.cover_image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600'}
          alt={series.title}
          referrerPolicy="no-referrer"
          className="w-36 h-36 rounded-2xl object-cover shrink-0 shadow-lg"
        />
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-rose-400 font-bold">
            <Headphones className="w-4 h-4" />
            <span>পডকাস্ট সিরিজ</span>
            {series.host_name && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-stone-300">
                  <Mic className="w-3.5 h-3.5" />
                  <span>সঞ্চালক: {series.host_name}</span>
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif-bn">{series.title}</h1>
          {series.subtitle && <p className="text-sm font-medium text-stone-300">{series.subtitle}</p>}
          {series.description && <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">{series.description}</p>}

          {/* Subscribe links */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {SUBSCRIBE_PLATFORMS.map(({ key, label }) => {
              const href = subscribeLinks[key];
              if (!href) return null;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-700 text-xs font-bold transition-colors"
                >
                  {key === 'rss' ? <Rss className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-black font-serif-bn text-stone-900 dark:text-stone-100">
          প্রকাশিত পর্বসমূহ ({toBengaliNumber(episodes.length)})
        </h2>

        {episodes.length === 0 ? (
          <p className="text-sm text-stone-500 py-8 text-center border border-dashed border-stone-200 rounded-2xl">
            এই সিরিজে এখনো কোনো পর্ব প্রকাশিত হয়নি।
          </p>
        ) : (
          <div className="space-y-4">
            {episodes.map((ep) => (
              <article
                key={ep.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-xs"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-rose-700">
                  <span>
                    সিজন {toBengaliNumber(ep.season_number || 1)} • পর্ব {toBengaliNumber(ep.episode_number || 1)}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-serif-bn text-stone-900 dark:text-stone-100">{ep.title}</h3>
                {ep.summary && <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">{ep.summary}</p>}

                <AccessibleAudioPlayer
                  src={ep.audio_url}
                  title={ep.title}
                  durationSeconds={ep.duration_seconds}
                  durationLabel={ep.duration_label}
                  transcript={ep.transcript}
                />

                {ep.show_notes && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl">
                    <span className="font-bold text-stone-800 dark:text-stone-200">শো নোটস: </span>
                    {ep.show_notes}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default PodcastDetailPage;


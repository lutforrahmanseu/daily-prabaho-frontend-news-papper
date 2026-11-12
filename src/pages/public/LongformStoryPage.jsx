import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Quote, UserCheck, Eye } from 'lucide-react';
import { useGetPublicLongformStoryBySlugQuery } from '../../store/api/multimediaApi.js';
import {
  AccessibleAudioPlayer,
  InteractiveTimelineViewer,
  SafeSocialEmbedCard
} from '../../components/multimedia/MultimediaWidgets.jsx';
import { parseSafeSocialEmbedUrl } from '../../utils/multimediaHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function LongformStoryPage() {
  const { slug } = useParams();
  const { data: story, isLoading, isError } = useGetPublicLongformStoryBySlugQuery(slug);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      if (total > 0) {
        setScrollPct(Math.min(100, Math.round((window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return <main className="max-w-4xl mx-auto px-4 py-14 text-center text-sm text-stone-500">দীর্ঘ প্রতিবেদন লোড হচ্ছে...</main>;
  }

  if (isError || !story) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-14 text-center space-y-3">
        <p className="text-base font-bold text-stone-800">প্রতিবেদনটি পাওয়া যায়নি।</p>
        <Link to="/multimedia?tab=story" className="text-xs font-bold text-rose-700 hover:underline">
          ← মাল্টিমিডিয়া হাবে ফিরে যান
        </Link>
      </main>
    );
  }

  const blocks = story.blocks || [];
  const headings = blocks.filter((b) => b.block_type === 'heading' && b.title);
  const themeWrapper =
    story.theme_style === 'dark'
      ? 'bg-stone-950 text-stone-100'
      : story.theme_style === 'magazine'
        ? 'bg-amber-50/40 dark:bg-stone-950 text-stone-900 dark:text-stone-100'
        : 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100';

  return (
    <div className={themeWrapper}>
      {/* Accessible sticky reading progress indicator */}
      <div
        className="sticky top-0 z-30 h-1 bg-stone-200 dark:bg-stone-800 w-full"
        role="progressbar"
        aria-valuenow={scrollPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="পাঠের অগ্রগতি"
      >
        <div className="h-full bg-rose-700 transition-all duration-150" style={{ width: `${scrollPct}%` }} />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Link
          to="/multimedia?tab=story"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-rose-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল বিশেষ দীর্ঘ প্রতিবেদন</span>
        </Link>

        {/* Story Hero */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-rose-700">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50">
              <BookOpen className="w-3.5 h-3.5" />
              <span>বিশেষ দীর্ঘ প্রতিবেদন</span>
            </span>
            {story.category?.name && <span>• {story.category.name}</span>}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-serif-bn leading-tight">{story.title}</h1>
          {story.subtitle && <p className="text-base sm:text-xl opacity-80 leading-relaxed font-serif-bn">{story.subtitle}</p>}

          <div className="flex flex-wrap items-center gap-4 text-xs opacity-70 pt-2 border-t border-stone-200 dark:border-stone-800">
            {(story.reporter?.name || story.author?.name) && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-rose-700" />
                <span>{story.reporter?.name || story.author?.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{toBengaliNumber(story.reading_time_minutes || 5)} মিনিটের পাঠ</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{toBengaliNumber(story.views_count || 0)} পাঠক</span>
            </span>
          </div>

          {story.cover_image && (
            <figure className="pt-2">
              <img
                src={story.cover_image}
                alt={story.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[480px] object-cover rounded-3xl shadow-xl"
              />
            </figure>
          )}
        </header>

        {/* Chapter Table of Contents */}
        {headings.length > 1 && (
          <nav
            aria-label="প্রতিবেদন অধ্যায় সূচি"
            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">অধ্যায় সূচিপত্র</p>
            <div className="flex flex-wrap gap-2">
              {headings.map((h, i) => (
                <a
                  key={h.id || i}
                  href={`#chapter-${h.id || i}`}
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:border-rose-400"
                >
                  {h.title}
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Rich Block Content Builder Output */}
        <article className="space-y-8">
          {blocks.map((block, idx) => {
            if (block.block_type === 'heading') {
              return (
                <h2
                  key={block.id || idx}
                  id={`chapter-${block.id || idx}`}
                  className="text-2xl sm:text-3xl font-black font-serif-bn pt-4 border-t border-stone-200/70 dark:border-stone-800"
                >
                  {block.title}
                </h2>
              );
            }

            if (block.block_type === 'text') {
              return (
                <div
                  key={block.id || idx}
                  className="text-base sm:text-lg leading-loose font-serif-bn whitespace-pre-line opacity-95"
                >
                  {block.content}
                </div>
              );
            }

            if (block.block_type === 'quote') {
              return (
                <blockquote
                  key={block.id || idx}
                  className="my-6 p-6 rounded-2xl border-l-4 border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 space-y-2"
                >
                  <Quote className="w-6 h-6 text-rose-700 opacity-70" />
                  <p className="text-lg sm:text-2xl font-bold font-serif-bn italic leading-relaxed">
                    “{block.content}”
                  </p>
                  {block.credit && <footer className="text-xs font-bold text-rose-700">— {block.credit}</footer>}
                </blockquote>
              );
            }

            if (block.block_type === 'image') {
              return (
                <figure key={block.id || idx} className="space-y-2">
                  <img
                    src={block.media_url}
                    alt={block.caption || block.title || story.title}
                    referrerPolicy="no-referrer"
                    className="w-full rounded-2xl shadow-md object-cover max-h-[520px]"
                  />
                  {(block.caption || block.credit) && (
                    <figcaption className="text-xs opacity-70 flex flex-wrap justify-between gap-2">
                      <span>{block.caption}</span>
                      {block.credit && <span>ছবি: {block.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.block_type === 'video') {
              const parsed = parseSafeSocialEmbedUrl(block.media_url || '');
              return (
                <figure key={block.id || idx} className="space-y-2">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
                    {parsed.kind === 'iframe' && parsed.embedUrl ? (
                      <iframe
                        src={parsed.embedUrl}
                        title={block.title || story.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video src={block.media_url} controls playsInline className="w-full h-full object-contain" />
                    )}
                  </div>
                  {block.caption && <figcaption className="text-xs opacity-70">{block.caption}</figcaption>}
                </figure>
              );
            }

            if (block.block_type === 'audio') {
              return (
                <div key={block.id || idx} className="space-y-2">
                  <AccessibleAudioPlayer
                    src={block.media_url}
                    title={block.title || 'অডিও বিবরণ'}
                    transcript={block.content || ''}
                  />
                  {block.caption && <p className="text-xs opacity-70">{block.caption}</p>}
                </div>
              );
            }

            if (block.block_type === 'timeline') {
              const events = block.timeline?.events || [];
              return (
                <section
                  key={block.id || idx}
                  className="p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-black font-serif-bn">
                      {block.title || block.timeline?.title || 'ঘটনাপ্রবাহ টাইমলাইন'}
                    </h3>
                    {block.timeline?.subtitle && <p className="text-xs opacity-70">{block.timeline.subtitle}</p>}
                  </div>
                  <InteractiveTimelineViewer events={events} />
                </section>
              );
            }

            if (block.block_type === 'embed') {
              return (
                <SafeSocialEmbedCard
                  key={block.id || idx}
                  item={{
                    title: block.title,
                    summary: block.caption || block.content,
                    media_url: block.media_url,
                    embed_author_name: block.credit
                  }}
                />
              );
            }

            return null;
          })}
        </article>
      </main>
    </div>
  );
}

export default LongformStoryPage;


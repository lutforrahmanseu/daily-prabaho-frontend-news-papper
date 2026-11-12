import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Camera,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Layers,
  PlayCircle,
  Radio,
  Sparkles,
  Video
} from 'lucide-react';
import {
  useGetPublicSpecialCoverageBySlugQuery,
  useSubscribeSpecialCoverageMutation
} from '../../store/api/liveCoverageApi.js';
import {
  SPECIAL_COVERAGE_TYPE_META,
  formatBengaliFullDateTime,
  formatLiveTimestampBadge,
  parseVideoEmbedUrl
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import {
  DynamicInfographicCard,
  LiveBadgePill,
  LiveUpdateCard,
  MediaLightboxModal,
  ReaderNotificationPanel
} from '../../components/live/LiveCoverageShared.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function SpecialCoverageDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetPublicSpecialCoverageBySlugQuery(slug, {
    skip: !slug
  });
  const [subscribeCoverage, { isLoading: isSubscribing }] = useSubscribeSpecialCoverageMutation();

  const [selectedTopicSlug, setSelectedTopicSlug] = useState('all');
  const [activeMedia, setActiveMedia] = useState(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const coverage = data?.coverage;
  const liveBlogs = useMemo(() => (Array.isArray(data?.live_blogs) ? data.live_blogs : []), [data]);
  const latestUpdates = useMemo(() => (Array.isArray(data?.latest_updates) ? data.latest_updates : []), [data]);
  const topicUpdates = useMemo(() => (Array.isArray(data?.topic_updates) ? data.topic_updates : []), [data]);
  const timeline = useMemo(() => (Array.isArray(data?.timeline) ? data.timeline : []), [data]);
  const relatedNews = useMemo(() => (Array.isArray(data?.related_news) ? data.related_news : []), [data]);
  const gallery = useMemo(() => (Array.isArray(data?.gallery) ? data.gallery : []), [data]);
  const videos = useMemo(() => (Array.isArray(data?.videos) ? data.videos : []), [data]);
  const infographics = useMemo(() => (Array.isArray(data?.infographics) ? data.infographics : []), [data]);

  const topics = useMemo(() => (Array.isArray(coverage?.topics) ? coverage.topics : []), [coverage]);
  const summaryStats = useMemo(
    () => (Array.isArray(coverage?.infographic_summary) ? coverage.infographic_summary : []),
    [coverage]
  );

  const filterByTopic = (list) => {
    if (selectedTopicSlug === 'all') return list;
    return list.filter((item) => item.topic_slug === selectedTopicSlug || !item.topic_slug);
  };

  const visibleTopicNotes = useMemo(() => filterByTopic(topicUpdates), [topicUpdates, selectedTopicSlug]);
  const visibleTimeline = useMemo(() => filterByTopic(timeline), [timeline, selectedTopicSlug]);
  const visibleRelatedNews = useMemo(() => filterByTopic(relatedNews), [relatedNews, selectedTopicSlug]);
  const visibleInfographics = useMemo(() => filterByTopic(infographics), [infographics, selectedTopicSlug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-5">
        <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
        <div className="h-96 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
      </div>
    );
  }

  if (isError || !coverage) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Layers className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h1 className="font-serif-bn text-2xl font-bold text-stone-900 dark:text-stone-100">
          বিশেষ আয়োজন পাতাটি পাওয়া যায়নি
        </h1>
        <Link
          to="/coverage"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-bold"
        >
          সব বিশেষ আয়োজন দেখুন
        </Link>
      </div>
    );
  }

  const typeMeta = SPECIAL_COVERAGE_TYPE_META[coverage.coverage_type] || SPECIAL_COVERAGE_TYPE_META.breaking_event;
  const activeVideo = videos[selectedVideoIndex] || videos[0] || null;
  const activeVideoEmbed = activeVideo ? parseVideoEmbedUrl(activeVideo.video_url || activeVideo.media_url) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEO
        title={coverage.meta_title || coverage.title}
        description={coverage.meta_description || coverage.description || coverage.subtitle}
        image={coverage.hero_image}
      />

      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
        <Link to="/" className="hover:text-rose-700">প্রচ্ছদ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/coverage" className="hover:text-rose-700">বিশেষ আয়োজন</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-stone-800 dark:text-stone-200">{coverage.title}</span>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative rounded-2xl overflow-hidden bg-stone-950 text-white shadow-lg border border-stone-800">
        {coverage.hero_image && (
          <img
            src={normalizeMediaUrl(coverage.hero_image)}
            alt={coverage.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div
          className={`relative z-10 p-6 sm:p-10 bg-gradient-to-r ${typeMeta.accentBg} bg-opacity-90`}
          style={coverage.hero_image ? { backgroundColor: 'rgba(12, 10, 9, 0.72)' } : undefined}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/25 text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{coverage.badge_text || typeMeta.label}</span>
            </span>
            {coverage.starts_at && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatBengaliFullDateTime(coverage.starts_at)}</span>
              </span>
            )}
          </div>

          <h1 className="font-serif-bn text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl">
            {coverage.title}
          </h1>

          {coverage.subtitle && (
            <p className="text-base sm:text-lg text-rose-200 font-semibold mt-2 max-w-3xl">
              {coverage.subtitle}
            </p>
          )}

          {coverage.description && (
            <p className="text-sm text-stone-200/90 mt-3 max-w-3xl leading-relaxed">
              {coverage.description}
            </p>
          )}

          {/* Hero Summary KPIs from infographic_summary */}
          {summaryStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-4xl">
              {summaryStats.map((stat, idx) => (
                <div
                  key={`${stat.label}-${idx}`}
                  className="rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-3"
                >
                  <div className="text-[11px] text-stone-300">{stat.label}</div>
                  <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Attached Live Blogs Strip inside Hero */}
          {liveBlogs.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {liveBlogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/live/${blog.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{blog.title}</span>
                  <LiveBadgePill status={blog.status} size="sm" />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 max-w-2xl text-stone-900">
            <ReaderNotificationPanel
              targetType="special_coverage"
              slug={coverage.slug}
              subscribersCount={coverage.subscribers_count || 0}
              onSubscribe={subscribeCoverage}
              isSubscribing={isSubscribing}
            />
          </div>
        </div>
      </section>

      {/* 2. TOPIC NAVIGATION & SECTION JUMP BAR */}
      <div className="sticky top-16 z-20 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400 mr-1">
              <Compass className="w-4 h-4 text-rose-700" />
              <span>বিভাগ নেভিগেশন:</span>
            </span>
            {[
              { href: '#section-updates', label: 'সর্বশেষ আপডেট' },
              { href: '#section-timeline', label: 'টাইমলাইন' },
              { href: '#section-news', label: 'সংশ্লিষ্ট সংবাদ' },
              { href: '#section-gallery', label: 'ফটো গ্যালারি' },
              { href: '#section-videos', label: 'ভিডিও' },
              { href: '#section-infographics', label: 'ইনফোগ্রাফিক্স' }
            ].map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-stone-700 dark:text-stone-200 transition-colors"
              >
                {anchor.label}
              </a>
            ))}
          </div>
        </div>

        {topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">টপিক ফিল্টার:</span>
            <button
              type="button"
              onClick={() => setSelectedTopicSlug('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                selectedTopicSlug === 'all'
                  ? 'bg-rose-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              সব বিষয়
            </button>
            {topics.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setSelectedTopicSlug(t.slug)}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  selectedTopicSlug === t.slug
                    ? 'bg-rose-700 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. LATEST UPDATES & TOPIC HIGHLIGHTS */}
      <section id="section-updates" className="scroll-mt-36 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-700" />
            <span>সর্বশেষ লাইভ ও সম্পাদকীয় আপডেট</span>
          </h2>
          {liveBlogs[0] && (
            <Link
              to={`/live/${liveBlogs[0].slug}`}
              className="text-xs font-bold text-rose-700 dark:text-rose-400 inline-flex items-center gap-1 hover:underline"
            >
              <span>পূর্ণাঙ্গ লাইভ ফিড দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {latestUpdates.length === 0 ? (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
                এই বিশেষ আয়োজনে এখনো কোনো লাইভ আপডেট যুক্ত হয়নি।
              </div>
            ) : (
              latestUpdates.slice(0, 6).map((u) => (
                <LiveUpdateCard key={u.id} update={u} onOpenMedia={(media) => setActiveMedia(media)} />
              ))
            )}
          </div>

          {/* Topic Highlights Column */}
          <aside className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              বিষয়ভিত্তিক সংক্ষিপ্ত নোট ({toBengaliNumber(visibleTopicNotes.length)})
            </h3>
            {visibleTopicNotes.length === 0 ? (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-xs text-stone-500">
                নির্বাচিত টপিকে অতিরিক্ত নোট নেই।
              </div>
            ) : (
              visibleTopicNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-1.5"
                >
                  {note.badge && (
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                      {note.badge}
                    </span>
                  )}
                  <h4 className="font-serif-bn font-bold text-sm text-stone-900 dark:text-stone-100">{note.title}</h4>
                  {note.summary && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{note.summary}</p>
                  )}
                </div>
              ))
            )}
          </aside>
        </div>
      </section>

      {/* 4. TIMELINE SECTION */}
      <section id="section-timeline" className="scroll-mt-36 space-y-4">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-700" />
            <span>ঘটনাপ্রবাহ ও টাইমলাইন</span>
          </h2>
        </div>

        {visibleTimeline.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
            টাইমলাইনে এখনো কোনো মাইলফলক যুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-rose-200 dark:border-rose-900 space-y-5">
            {visibleTimeline.map((item) => (
              <div key={item.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-rose-700 border-4 border-white dark:border-stone-950" />
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {item.event_time_label && (
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-[11px] font-bold">
                        {item.event_time_label}
                      </span>
                    )}
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif-bn font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. RELATED NEWS SECTION (Approved & Non-Embargoed via Backend) */}
      <section id="section-news" className="scroll-mt-36 space-y-4">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-700" />
            <span>সংশ্লিষ্ট সংবাদ ও বিশ্লেষণ</span>
          </h2>
        </div>

        {visibleRelatedNews.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
            এই অংশে এখনো প্রকাশিত প্রতিবেদন সংযুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRelatedNews.map((item) => {
              const article = item.news;
              const targetUrl = article?.slug ? `/news/${article.slug}` : '#';
              const title = article?.title || item.title;
              const excerpt = article?.excerpt || item.summary;
              const imageUrl = article?.featured_image || article?.image || item.media_url;

              return (
                <Link
                  key={item.id}
                  to={targetUrl}
                  className="group rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:border-rose-400 transition-colors flex flex-col"
                >
                  {imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <img
                        src={normalizeMediaUrl(imageUrl)}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {(article?.category?.name || item.badge) && (
                        <span className="inline-block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                          {article?.category?.name || item.badge}
                        </span>
                      )}
                      <h3 className="font-serif-bn font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-rose-700 dark:group-hover:text-rose-400 leading-snug">
                        {title}
                      </h3>
                      {excerpt && <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1.5">{excerpt}</p>}
                    </div>
                    <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                      {formatLiveTimestampBadge(article?.published_at || item.published_at || item.created_at)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. PHOTO GALLERY SECTION */}
      <section id="section-gallery" className="scroll-mt-36 space-y-4">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-700" />
            <span>ফটো গ্যালারি</span>
          </h2>
        </div>

        {gallery.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
            ফটো গ্যালারিতে এখনো ছবি যুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() =>
                  setActiveMedia({
                    type: 'image',
                    media_url: photo.media_url,
                    caption: photo.caption || photo.title,
                    credit: photo.credit
                  })
                }
                className="group text-left rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-800 relative">
                  <img
                    src={normalizeMediaUrl(photo.media_url)}
                    alt={photo.caption || photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-serif-bn font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                    {photo.title || photo.caption}
                  </h3>
                  {(photo.caption || photo.credit) && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {photo.caption} {photo.credit ? `• ${photo.credit}` : ''}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 7. VIDEOS SECTION */}
      <section id="section-videos" className="scroll-mt-36 space-y-4">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-700" />
            <span>ভিডিও প্রতিবেদন ও বিশ্লেষণ</span>
          </h2>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
            এই আয়োজনে এখনো ভিডিও প্রতিবেদন সংযুক্ত হয়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-950">
              {activeVideoEmbed?.kind === 'iframe' ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={activeVideoEmbed.src}
                    title={activeVideo?.title || 'ভিডিও'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  src={normalizeMediaUrl(activeVideoEmbed?.src)}
                  poster={activeVideo?.media_url ? normalizeMediaUrl(activeVideo.media_url) : undefined}
                  controls
                  className="w-full aspect-video bg-black"
                />
              )}
              <div className="p-4 text-white">
                <h3 className="font-serif-bn font-bold text-lg">{activeVideo?.title}</h3>
                {activeVideo?.summary && <p className="text-xs text-stone-300 mt-1">{activeVideo.summary}</p>}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-2.5">
              {videos.map((vid, idx) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setSelectedVideoIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                    idx === selectedVideoIndex
                      ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'
                  }`}
                >
                  <PlayCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif-bn font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2">
                      {vid.title}
                    </p>
                    {vid.credit && <p className="text-[11px] text-stone-500 mt-0.5">{vid.credit}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 8. INFOGRAPHICS SECTION */}
      <section id="section-infographics" className="scroll-mt-36 space-y-4">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <h2 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-700" />
            <span>তথ্যচিত্র ও ইনফোগ্রাফিক্স</span>
          </h2>
        </div>

        {visibleInfographics.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-sm text-stone-500">
            ইনফোগ্রাফিক চার্ট এখনো যুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleInfographics.map((item) => (
              <DynamicInfographicCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <MediaLightboxModal media={activeMedia} onClose={() => setActiveMedia(null)} />
    </div>
  );
}

export default SpecialCoverageDetailPage;


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDownUp,
  ArrowUp,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  MapPin,
  Pin,
  Radio,
  RefreshCw,
  Share2,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  useGetPublicLiveBlogBySlugQuery,
  useSubscribeLiveBlogMutation
} from '../../store/api/liveCoverageApi.js';
import { useLiveBlogStream } from '../../hooks/useLiveBlogStream.js';
import {
  LIVE_EVENT_TYPE_META,
  buildLiveBlogSchema,
  formatBengaliFullDateTime,
  formatLiveTimestampBadge
} from '../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { normalizeMediaUrl } from '../../utils/apiNormalizer.js';
import {
  LiveBadgePill,
  LiveUpdateCard,
  MediaLightboxModal,
  ReaderNotificationPanel
} from '../../components/live/LiveCoverageShared.jsx';
import { SEO } from '../../components/common/SEO.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

export function LiveBlogDetailPage() {
  const { slug } = useParams();
  const { data: fetchedBlog, isLoading, isError, refetch } = useGetPublicLiveBlogBySlugQuery(slug, {
    skip: !slug
  });
  const [subscribeLiveBlog, { isLoading: isSubscribing }] = useSubscribeLiveBlogMutation();

  const [liveSnapshot, setLiveSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all | key | media
  const [sortOrder, setSortOrder] = useState('newest'); // newest | oldest
  const [unseenCount, setUnseenCount] = useState(0);
  const [activeMedia, setActiveMedia] = useState(null);
  const [browserPushEnabled, setBrowserPushEnabled] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return window.Notification.permission === 'granted' && window.localStorage.getItem('dp_push_pref') === '1';
  });

  useEffect(() => {
    setLiveSnapshot(null);
    setUnseenCount(0);
  }, [slug]);

  const blog = liveSnapshot || fetchedBlog;
  const shouldStream = Boolean(blog && ['live', 'paused', 'approved'].includes(blog.status));

  const toggleBrowserPush = useCallback(async (wantEnable, options = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      if (!options.silentIfDenied) {
        sweetAlert.info('ব্রাউজার সাপোর্ট নেই', 'এই ব্রাউজারে ডেস্কটপ নোটিফিকেশন সমর্থিত নয়।');
      }
      return;
    }

    if (!wantEnable) {
      window.localStorage.setItem('dp_push_pref', '0');
      setBrowserPushEnabled(false);
      return;
    }

    let permission = window.Notification.permission;
    if (permission === 'default') {
      permission = await window.Notification.requestPermission();
    }

    if (permission === 'granted') {
      window.localStorage.setItem('dp_push_pref', '1');
      setBrowserPushEnabled(true);
    } else if (!options.silentIfDenied) {
      sweetAlert.warning('অনুমতি প্রয়োজন', 'ডেস্কটপ নোটিফিকেশন পেতে ব্রাউজার সেটিংস থেকে অনুমতি দিন।');
    }
  }, []);

  const { connectionState, streamVersion } = useLiveBlogStream({
    slug,
    enabled: shouldStream,
    initialVersion: blog?.stream_version || 0,
    onSnapshot: (payload) => {
      if (payload?.live_blog) {
        setLiveSnapshot(payload.live_blog);
      }
    },
    onNewUpdates: (newEntries, latestBlog) => {
      if (typeof window !== 'undefined' && window.scrollY > 280) {
        setUnseenCount((prev) => prev + newEntries.length);
      }
      if (
        browserPushEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted' &&
        newEntries[0]
      ) {
        const first = newEntries[0];
        try {
          new window.Notification(first.title || latestBlog.title, {
            body: (first.content || '').slice(0, 140)
          });
        } catch {
          // Ignore environments disallowing direct Notification constructor
        }
      }
    }
  });

  const allUpdates = useMemo(() => (Array.isArray(blog?.updates) ? blog.updates : []), [blog]);
  const pinnedUpdates = useMemo(() => allUpdates.filter((u) => u.is_pinned && u.status !== 'retracted'), [allUpdates]);

  const filteredUpdates = useMemo(() => {
    const base = allUpdates.filter((u) => {
      if (activeTab === 'key') return u.is_key_event || u.update_type === 'breaking';
      if (activeTab === 'media') return Array.isArray(u.attachments) && u.attachments.length > 0;
      return true;
    });

    if (sortOrder === 'oldest') {
      return [...base].reverse();
    }
    return base;
  }, [allUpdates, activeTab, sortOrder]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog?.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        sweetAlert.success('লিংক কপি হয়েছে', 'লাইভ কভারেজের লিংক ক্লিপবোর্ডে কপি করা হয়েছে।');
      }
    } catch {
      // User dismissed native share dialog
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-44 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Radio className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h1 className="font-serif-bn text-2xl font-bold text-stone-900 dark:text-stone-100">
          লাইভ কভারেজ খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-sm text-stone-500 mt-1 mb-6">
          লিঙ্কটি ভুল হতে পারে অথবা কভারেজটি আর্কাইভ করা হয়েছে।
        </p>
        <Link
          to="/live"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-bold"
        >
          সব লাইভ আপডেট দেখুন
        </Link>
      </div>
    );
  }

  const eventMeta = LIVE_EVENT_TYPE_META[blog.event_type] || LIVE_EVENT_TYPE_META.general;
  const schema = buildLiveBlogSchema(blog);

  const connectionLabelMap = {
    live: { label: 'রিয়েল-টাইম SSE সংযুক্ত', icon: Wifi, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    connecting: { label: 'সংযুক্ত হচ্ছে...', icon: RefreshCw, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    reconnecting: { label: 'পুনঃসংযোগ হচ্ছে...', icon: RefreshCw, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    paused: { label: 'ট্যাব পজ (অদৃশ্য)', icon: Clock, color: 'text-stone-600 bg-stone-100 border-stone-200' },
    offline: { label: 'সংযোগ বিচ্ছিন্ন', icon: WifiOff, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    closed: { label: 'সম্প্রচার সমাপ্ত', icon: Clock, color: 'text-stone-700 bg-stone-100 border-stone-200' },
    idle: { label: 'আর্কাইভ পাঠ মোড', icon: Clock, color: 'text-stone-700 bg-stone-100 border-stone-200' }
  };
  const connUi = connectionLabelMap[connectionState] || connectionLabelMap.idle;
  const ConnIcon = connUi.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <SEO
        title={blog.title}
        description={blog.summary || blog.title}
        image={blog.cover_image}
        schema={schema}
      />

      {/* Sticky New Update Jump Notification */}
      {unseenCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            type="button"
            onClick={() => {
              setUnseenCount(0);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shadow-xl cursor-pointer animate-bounce"
          >
            <ArrowUp className="w-4 h-4" />
            <span>{toBengaliNumber(unseenCount)}টি নতুন আপডেট এসেছে — উপরে যান</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-4">
        <Link to="/" className="hover:text-rose-700">প্রচ্ছদ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/live" className="hover:text-rose-700">সরাসরি</Link>
        {blog.special_coverage && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/coverage/${blog.special_coverage.slug}`} className="hover:text-rose-700 font-semibold">
              {blog.special_coverage.title}
            </Link>
          </>
        )}
      </nav>

      {/* Hero Card */}
      <header className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs mb-6">
        {blog.cover_image && (
          <div className="aspect-[21/8] overflow-hidden bg-stone-900">
            <img
              src={normalizeMediaUrl(blog.cover_image)}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <LiveBadgePill status={blog.status} />
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${eventMeta.badgeClass}`}>
                {eventMeta.label}
              </span>
              {blog.location && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>{blog.location}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${connUi.color}`}>
                <ConnIcon className="w-3 h-3" />
                <span>{connUi.label}</span>
              </span>
              <button
                type="button"
                onClick={refetch}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                title="হালনাগাদ রিফ্রেশ করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                title="শেয়ার করুন"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="font-serif-bn text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
            {blog.title}
          </h1>

          {blog.summary && (
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
              {blog.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
            {blog.started_at && (
              <span>শুরু: <strong className="text-stone-700 dark:text-stone-200">{formatBengaliFullDateTime(blog.started_at)}</strong></span>
            )}
            {blog.last_update_at && (
              <span>সর্বশেষ আপডেট: <strong className="text-stone-700 dark:text-stone-200">{formatLiveTimestampBadge(blog.last_update_at)}</strong></span>
            )}
            {blog.ended_at && (
              <span>সমাপ্তি: <strong className="text-emerald-700 dark:text-emerald-400">{formatBengaliFullDateTime(blog.ended_at)}</strong></span>
            )}
            <span>মোট আপডেট: <strong className="text-stone-800 dark:text-stone-200">{toBengaliNumber(allUpdates.length)}</strong></span>
            {streamVersion > 0 && (
              <span className="text-[11px] text-stone-400">ফিড সংস্করণ #{toBengaliNumber(streamVersion)}</span>
            )}
          </div>

          {/* Linked Special Coverage / Related News CTA */}
          {(blog.special_coverage || blog.news) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {blog.special_coverage && (
                <Link
                  to={`/coverage/${blog.special_coverage.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200"
                >
                  <Layers className="w-3.5 h-3.5 text-rose-700" />
                  <span>বিশেষ আয়োজন: {blog.special_coverage.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              {blog.news && (
                <Link
                  to={`/news/${blog.news.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200"
                >
                  <span>মূল প্রতিবেদন: {blog.news.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}

          {/* Reader Notification Subscribe Bar */}
          <ReaderNotificationPanel
            targetType="live_blog"
            slug={blog.slug}
            subscribersCount={blog.subscribers_count || 0}
            onSubscribe={subscribeLiveBlog}
            isSubscribing={isSubscribing}
            enableBrowserPush={browserPushEnabled}
            onToggleBrowserPush={toggleBrowserPush}
          />
        </div>
      </header>

      {/* Pinned Important Highlights */}
      {pinnedUpdates.length > 0 && (
        <section className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-4 sm:p-5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-3">
            <Pin className="w-4 h-4" />
            <span>গুরুত্বপূর্ণ পিনকৃত মুহূর্ত</span>
          </h2>
          <div className="space-y-3">
            {pinnedUpdates.map((item) => (
              <a
                key={`pin-${item.id}`}
                href={`#live-update-${item.id}`}
                className="block rounded-xl bg-white dark:bg-stone-900 border border-rose-100 dark:border-rose-900/60 p-3.5 hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-rose-700 dark:text-rose-400 font-bold mb-1">
                  <span>{formatLiveTimestampBadge(item.published_at || item.created_at)}</span>
                  <span>{item.author?.name}</span>
                </div>
                {item.title && <h3 className="font-serif-bn font-bold text-sm text-stone-900 dark:text-stone-100">{item.title}</h3>}
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-0.5">{item.content}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Feed Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `সকল আপডেট (${toBengaliNumber(allUpdates.length)})` },
            { id: 'key', label: 'মূল ঘটনা ও ব্রেকিং' },
            { id: 'media', label: 'ছবি ও ভিডিও' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 cursor-pointer"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          <span>{sortOrder === 'newest' ? 'সর্বশেষ আগে' : 'প্রথম থেকে'}</span>
        </button>
      </div>

      {/* Live Timeline Updates */}
      {filteredUpdates.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-sm text-stone-500">
          এই ফিল্টারে এখনো কোনো প্রকাশিত আপডেট নেই।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUpdates.map((entry) => (
            <LiveUpdateCard
              key={entry.id}
              update={entry}
              showAuthorAvatars={blog.show_author_avatars !== false}
              onOpenMedia={(media) => setActiveMedia(media)}
            />
          ))}
        </div>
      )}

      <MediaLightboxModal media={activeMedia} onClose={() => setActiveMedia(null)} />
    </div>
  );
}

export default LiveBlogDetailPage;


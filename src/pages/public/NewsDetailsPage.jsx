import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetNewsBySlugQuery } from '../../store/api/newsApi.js';
import { incrementArticleViews } from '../../store/newsSlice.js';
import { selectIsReaderAuthenticated } from '../../store/readerSlice.js';
import {
  useGetArticleCommentsQuery,
  useRecordReadingHistoryMutation
} from '../../store/api/readerApi.js';
import {
  useGetMySubscriptionQuery,
  useTrackSponsoredImpressionMutation,
  useTrackSponsoredClickMutation
} from '../../store/api/monetizationApi.js';
import {
  useCollectAnalyticsTelemetryMutation,
  useGetActiveExperimentsQuery,
  useTrackExperimentEventMutation
} from '../../store/api/analyticsApi.js';
import { canSendClientAnalyticsTelemetry } from '../../utils/analyticsHelpers.js';
import { useReaderBookmark } from '../../hooks/useReaderBookmark.js';
import FollowTargetButton from '../../components/reader/FollowTargetButton.jsx';
import ArticleReactionsBar from '../../components/reader/ArticleReactionsBar.jsx';
import ArticleCommentsSection from '../../components/reader/ArticleCommentsSection.jsx';
import {
  formatBengaliRelativeTime,
  formatBengaliFullDateTime,
  toBengaliNumber,
  calculateReadingTime
} from '../../utils/bengaliFormatter.js';
import { stripHtmlTags } from '../../utils/securitySanitizer.js';
import { getArticlePrimaryGeo } from '../../utils/hyperlocalHelpers.js';
import SEO from '../../components/common/SEO.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PopularNews from '../../components/news/PopularNews.jsx';
import RelatedNews from '../../components/news/RelatedNews.jsx';
import SocialShareBar from '../../components/news/SocialShareBar.jsx';
import RichArticleBody from '../../components/news/RichArticleBody.jsx';
import ReadingProgress from '../../components/news/ReadingProgress.jsx';
import NewsletterSubscription from '../../components/common/NewsletterSubscription.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import {
  Clock,
  Calendar,
  RefreshCw,
  User,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Type,
  ThumbsUp,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  Eye,
  Send,
  Sparkles,
  Printer,
  Crown,
  Megaphone,
  ExternalLink,
  MapPin,
  ShieldCheck
} from 'lucide-react';

export function NewsDetailsPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);

  const { data: article, isLoading } = useGetNewsBySlugQuery(slug, { skip: !slug });
  const { isBookmarked, toggle: toggleArticleBookmark } = useReaderBookmark(article);
  const [recordHistory] = useRecordReadingHistoryMutation();
  const { data: mySubscription } = useGetMySubscriptionQuery(undefined, { skip: !isReaderAuth });
  const [trackSponsoredImpression] = useTrackSponsoredImpressionMutation();
  const [trackSponsoredClick] = useTrackSponsoredClickMutation();
  const trackedSponsoredIdRef = useRef(null);

  // Phase 24: Privacy-first analytics telemetry & A/B headline/image variants
  const numericArticleId = article?.id && !Number.isNaN(Number(article.id)) ? Number(article.id) : null;
  const { data: experimentsPayload } = useGetActiveExperimentsQuery(
    { news_id: numericArticleId },
    { skip: !numericArticleId }
  );
  const [collectTelemetry] = useCollectAnalyticsTelemetryMutation();
  const [trackExperimentEvent] = useTrackExperimentEventMutation();
  const trackedAnalyticsSlugRef = useRef(null);
  const maxScrollRef = useRef(25);
  const readStartTimeRef = useRef(Date.now());
  const conversionSentRef = useRef(false);

  const activeHeadlineExp = (experimentsPayload?.assignments || []).find(
    (item) => item.experiment_type === 'headline' && Number(item.target_news_id) === numericArticleId
  );
  const activeImageExp = (experimentsPayload?.assignments || []).find(
    (item) => item.experiment_type === 'featured_image' && Number(item.target_news_id) === numericArticleId
  );
  const { data: commentsMeta } = useGetArticleCommentsQuery(
    { slug: article?.slug || slug },
    { skip: !(article?.slug || slug) }
  );

  // Scroll to top & record view + server reading history + sponsored impression on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    readStartTimeRef.current = Date.now();
    maxScrollRef.current = 25;
    conversionSentRef.current = false;

    if (article) {
      dispatch(incrementArticleViews(article.id));
      if (isReaderAuth && numericArticleId) {
        recordHistory({ news_id: numericArticleId, progress_percent: 25, read_seconds: 10 }).catch(() => {});
      }
      if (article.isSponsored && numericArticleId && trackedSponsoredIdRef.current !== article.id) {
        trackedSponsoredIdRef.current = article.id;
        trackSponsoredImpression(numericArticleId).catch(() => {});
      }
      if (numericArticleId && trackedAnalyticsSlugRef.current !== slug && canSendClientAnalyticsTelemetry()) {
        trackedAnalyticsSlugRef.current = slug;
        collectTelemetry({
          event_type: 'article_read',
          entity_type: 'news',
          entity_id: numericArticleId,
          engagement_seconds: 15,
          scroll_depth_percent: 25,
          referrer: typeof document !== 'undefined' ? document.referrer : ''
        }).catch(() => {});
      }
    }
  }, [slug, article?.id, article?.isSponsored, numericArticleId, isReaderAuth, dispatch, recordHistory, trackSponsoredImpression, collectTelemetry]);

  useEffect(() => {
    if (!numericArticleId || !canSendClientAnalyticsTelemetry()) return undefined;
    [activeHeadlineExp, activeImageExp].filter(Boolean).forEach((exp) => {
      trackExperimentEvent({
        experimentId: exp.experiment_id,
        variant_id: exp.variant_id,
        action: 'impression'
      }).catch(() => {});
    });

    const onScroll = () => {
      const doc = document.documentElement;
      const totalHeight = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const depth = Math.min(100, Math.round((window.scrollY / totalHeight) * 100));
      if (depth > maxScrollRef.current) {
        maxScrollRef.current = depth;
      }
      if (depth >= 75 && !conversionSentRef.current) {
        conversionSentRef.current = true;
        const elapsedSec = Math.max(15, Math.min(1800, Math.round((Date.now() - readStartTimeRef.current) / 1000)));
        collectTelemetry({
          event_type: 'article_read',
          entity_type: 'news',
          entity_id: numericArticleId,
          engagement_seconds: elapsedSec,
          scroll_depth_percent: depth
        }).catch(() => {});
        [activeHeadlineExp, activeImageExp].filter(Boolean).forEach((exp) => {
          trackExperimentEvent({
            experimentId: exp.experiment_id,
            variant_id: exp.variant_id,
            action: 'conversion',
            engagement_seconds: elapsedSec
          }).catch(() => {});
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [numericArticleId, activeHeadlineExp?.variant_id, activeImageExp?.variant_id, collectTelemetry, trackExperimentEvent]);

  // Font size state: 'sm' | 'base' | 'lg' | 'xl'
  const [fontSize, setFontSize] = useState('base');
  const fontSizes = {
    sm: 'text-base sm:text-lg leading-relaxed',
    base: 'text-lg sm:text-xl leading-relaxed',
    lg: 'text-xl sm:text-2xl leading-loose',
    xl: 'text-2xl sm:text-3xl leading-loose'
  };

  // TTS (Text to Speech) State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const speechUtteranceRef = useRef(null);
  const commentsSectionRef = useRef(null);

  // Loading skeleton while fetching from Laravel API
  if (isLoading && !article) {
    return (
      <div className="w-full py-6 space-y-6 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-1/4" />
        <div className="h-10 bg-stone-300 rounded w-3/4" />
        <div className="aspect-16/9 bg-stone-200 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 bg-stone-200 rounded w-full" />
          <div className="h-4 bg-stone-200 rounded w-5/6" />
          <div className="h-4 bg-stone-200 rounded w-4/5" />
        </div>
      </div>
    );
  }

  // Article not found handler
  if (!article) {
    return (
      <div className="py-16 text-center max-w-xl mx-auto px-4">
        <SEO title={isBn ? 'সংবাদটি পাওয়া যায়নি' : 'Article Not Found'} />
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center mb-4">
          <Eye className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn mb-3">
          {isBn ? 'সংবাদ প্রতিবেদনটি পাওয়া যায়নি' : 'Article Not Found'}
        </h1>
        <p className="text-stone-600 text-sm mb-6 font-serif-bn">
          {isBn
            ? 'আপনি যে সংবাদের ঠিকানায় প্রবেশ করতে চাচ্ছেন তা হয়তো স্থানান্তরিত হয়েছে অথবা লিংকটি সঠিক নয়।'
            : 'The article you are looking for might have been moved or the URL is incorrect.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Return to Frontpage'}</span>
        </Link>
      </div>
    );
  }

  const baseTitle = isBn ? article.title : (article.titleEn || article.title);
  const title = isBn ? (activeHeadlineExp?.payload?.title || baseTitle) : baseTitle;
  const subheadline = activeHeadlineExp?.payload?.subheadline || article.subheadline;
  const displayFeaturedImage = activeImageExp?.payload?.featured_image || article.image;
  const content = isBn ? article.content : (article.contentEn || article.content);
  const timeAgo = isBn ? formatBengaliRelativeTime(article.publishedAt) : 'Recently';
  const fullPublishDate = isBn
    ? formatBengaliFullDateTime(article.publishedAt)
    : new Date(article.publishedAt).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  const fullUpdateDate = article.updatedAt
    ? isBn
      ? formatBengaliFullDateTime(article.updatedAt)
      : new Date(article.updatedAt).toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
    : null;

  const readingTime = isBn ? calculateReadingTime(content) : '3 min read';
  const reporterData = article.reporterObj || article.authorObj || {
    name: article.author || article.reporter || 'নিজস্ব প্রতিবেদক',
    roleBn: article.authorDesignation || 'স্টাফ রিপোর্টার',
    avatar: article.authorAvatar
  };

  const totalCommentsCount = Number(commentsMeta?.total_approved ?? 0);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Text-to-Speech handler
  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert(isBn ? 'আপনার ব্রাউজারে টেক্সট-টু-স্পিচ সমর্থিত নয়।' : 'Speech synthesis not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanContent = stripHtmlTags(content).replace(/[#*>]/g, ' ');
      const speechText = `${title}. ${subheadline ? subheadline + '. ' : ''} ${cleanContent}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SEO
        title={title}
        description={stripHtmlTags(subheadline || article.excerpt || '')}
        image={article.image}
        url={currentUrl}
        article={true}
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt || article.publishedAt}
        author={article.author}
        category={article.categoryName}
        subcategory={article.subcategory}
        tags={article.tags}
      />

      {/* 9. Article Reading Progress Bar with Remaining Time Badge */}
      <ReadingProgress content={content} showRemainingTime={true} />

      {/* Top Leaderboard Advertisement Slot */}
      <AdPlacement placement="leaderboard" className="mb-4 sm:mb-6" />

      {/* Main Container with Sticky Floating Social Share Track */}
      <div className="relative">
        {/* 8. Sticky Floating Social Share Bar (Visible on Wide Desktop Screens without Header Overlap) */}
        <div className="hidden min-[1420px]:block absolute -left-[68px] top-0 bottom-0 z-20 pointer-events-none">
          <div className="sticky top-24 pointer-events-auto">
            <SocialShareBar article={article} variant="floating" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Article Canvas (8 cols on desktop) */}
        <article className="lg:col-span-8 flex flex-col">
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-3 flex-wrap font-sans">
            <Link to="/" className="hover:text-rose-700 transition-colors">
              {isBn ? 'প্রচ্ছদ' : 'Home'}
            </Link>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <Link to={`/category/${article.category}`} className="hover:text-rose-700 transition-colors font-medium">
              {article.categoryName}
            </Link>
            {article.subcategory && (
              <>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <Link
                  to={`/category/${article.category}/${article.subcategorySlug}`}
                  className="hover:text-rose-700 transition-colors text-rose-700 font-semibold"
                >
                  {article.subcategory}
                </Link>
              </>
            )}
          </nav>

          {/* Category & Hyperlocal Geo Pill Tags */}
          {(() => {
            const primaryGeo = getArticlePrimaryGeo(article, isBn);
            return (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link
                  to={`/category/${article.category}`}
                  className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  {article.categoryName}
                </Link>
                {primaryGeo && (
                  <Link
                    to={primaryGeo.path}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{primaryGeo.label}</span>
                  </Link>
                )}
                {article.correspondent?.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>
                      {isBn ? 'যাচাইকৃত প্রতিনিধি:' : 'Verified Correspondent:'}{' '}
                      {isBn
                        ? (article.correspondent.display_name_bn || article.correspondent.display_name_en)
                        : (article.correspondent.display_name_en || article.correspondent.display_name_bn)}
                    </span>
                  </span>
                )}
                {article.isBreaking && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-700 text-white animate-pulse">
                    {isBn ? 'জরুরি সংবাদ' : 'Breaking'}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Phase 21 Sponsored Disclosure & Premium Badges */}
          {(article.isSponsored || article.isPremium) && (
            <div className="mb-4 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {article.isSponsored && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
                    <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>{article.sponsoredLabel || (isBn ? 'স্পনসরড কনটেন্ট' : 'Sponsored Content')}</span>
                  </span>
                )}
                {article.isPremium && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-900 text-xs font-extrabold">
                    <Crown className="w-3.5 h-3.5 text-purple-700" />
                    <span>{isBn ? 'প্রিমিয়াম এক্সক্লুসিভ' : 'Premium Exclusive'}</span>
                  </span>
                )}
              </div>

              {article.isSponsored && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                  <div className="space-y-0.5">
                    <p className="font-bold">
                      {article.sponsoredContent?.advertiser?.company_name
                        ? isBn
                          ? `বিজ্ঞাপনদাতা: ${article.sponsoredContent.advertiser.company_name}`
                          : `Sponsored by: ${article.sponsoredContent.advertiser.company_name}`
                        : isBn
                        ? 'স্পনসরড ও বিজ্ঞাপনী ঘোষণা'
                        : 'Sponsored Disclosure'}
                    </p>
                    <p className="text-amber-900 leading-relaxed">
                      {article.sponsorDisclosure ||
                        (isBn
                          ? 'এই প্রতিবেদনটি বিজ্ঞাপনদাতার সহযোগিতায় প্রকাশিত এবং সম্পাদকীয় স্বচ্ছতার নীতিমালা অনুসরণ করে চিহ্নিত।'
                          : 'This article is produced in partnership with a commercial sponsor under Daily Prabaho disclosure guidelines.')}
                    </p>
                  </div>
                  {article.sponsoredContent?.cta_url && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await trackSponsoredClick(Number(article.id)).unwrap();
                        } catch {
                          // ignore tracking network errors
                        }
                        window.open(article.sponsoredContent.cta_url, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold shrink-0 cursor-pointer"
                    >
                      <span>{article.sponsoredContent.cta_label || (isBn ? 'বিস্তারিত দেখুন' : 'Learn More')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 1. Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-bold text-stone-900 font-serif-bn leading-tight sm:leading-tight mb-4 tracking-tight">
            {title}
          </h1>

          {/* 2. Subheadline */}
          {subheadline && (
            <p className="text-base sm:text-xl text-stone-600 font-serif-bn leading-snug sm:leading-relaxed mb-6 font-medium border-l-3 border-rose-700 pl-3 sm:pl-4">
              {subheadline}
            </p>
          )}

          {/* 3. Byline, Reporter, and Published/Updated Dates */}
          <div className="py-4 border-y border-stone-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-600">
            
            {/* Author info */}
            <div className="flex items-center gap-3">
              <Link to={`/author/${article.authorSlug || 'rep-01'}`} className="group shrink-0">
                <img
                  src={reporterData?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'}
                  alt={article.author}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-200 group-hover:ring-rose-700 transition-all"
                />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/author/${article.authorSlug || 'rep-01'}`}
                    className="font-bold text-stone-900 hover:text-rose-700 text-sm font-serif-bn transition-colors"
                  >
                    {article.author}
                  </Link>
                  {reporterData?.roleBn && (
                    <span className="text-[11px] text-rose-700 font-medium">({reporterData.roleBn})</span>
                  )}
                </div>
                {article.reporterName && (
                  <span className="text-stone-500 text-[11px]">
                    {article.reporterName}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-col sm:items-end gap-1 text-[11px] sm:text-xs text-stone-500 font-sans">
              <div className="flex items-center gap-1.5" title="প্রকাশের সময়">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {isBn ? 'প্রকাশ: ' : 'Published: '}
                  <time dateTime={article.publishedAt} className="text-stone-700 font-medium font-serif-bn">
                    {fullPublishDate}
                  </time>
                </span>
              </div>
              {fullUpdateDate && (
                <div className="flex items-center gap-1.5 text-rose-700" title="সর্বশেষ আপডেট">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {isBn ? 'আপডেট: ' : 'Updated: '}
                    <time dateTime={article.updatedAt} className="font-medium font-serif-bn">
                      {fullUpdateDate}
                    </time>
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Reader Interactive Toolbar (Font size, Audio TTS, Bookmark, Print) */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
            
            {/* Audio Listen (TTS) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-700 text-white animate-pulse shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200'
                }`}
                title={isBn ? 'খবরটি শুনুন' : 'Listen to article'}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>{isBn ? 'বন্ধ করুন' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-rose-700" />
                    <span>{isBn ? 'সংবাদ শুনুন' : 'Listen'}</span>
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-1 text-xs text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-serif-bn">{readingTime}</span>
              </div>
            </div>

            {/* Font Resizing Controls */}
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 text-xs">
              <span className="px-2 text-stone-500 font-medium flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBn ? 'হরফ' : 'Font'}</span>
              </span>
              {(['sm', 'base', 'lg', 'xl']).map((sizeKey) => (
                <button
                  key={sizeKey}
                  type="button"
                  onClick={() => setFontSize(sizeKey)}
                  className={`w-7 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    fontSize === sizeKey ? 'bg-rose-700 text-white shadow-2xs' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  title={`${sizeKey.toUpperCase()} font`}
                >
                  {sizeKey === 'sm' ? 'অ-' : sizeKey === 'base' ? 'অ' : sizeKey === 'lg' ? 'অ+' : 'অ++'}
                </button>
              ))}
            </div>

            {/* Share (compact fallback when outer gutter unavailable), Bookmark & Print Actions */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:block mr-1">
                <div className="min-[1420px]:hidden">
                  <SocialShareBar article={article} variant="compact" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleArticleBookmark(article)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
                title={isBookmarked ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'বুকমার্ক করুন' : 'Save')}
                aria-label="Bookmark article"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex p-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title={isBn ? 'প্রিন্ট করুন' : 'Print article'}
                aria-label="Print article"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* 4. Featured Image with Caption & Credit */}
          <figure className="mb-8 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
            <div className="aspect-16/10 sm:aspect-16/9 overflow-hidden bg-stone-200">
              <img
                src={displayFeaturedImage}
                alt={title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
            {(article.imageCaption || article.imageCredit) && (
              <figcaption className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-stone-600 font-serif-bn">
                <span>{article.imageCaption}</span>
                {article.imageCredit && (
                  <span className="text-stone-400 shrink-0 font-sans text-[11px]">
                    {article.imageCredit}
                  </span>
                )}
              </figcaption>
            )}
          </figure>

          {/* 5. Rich Text Article Content */}
          <div className="article-body">
            {article.isPremium && !mySubscription?.premium_articles_access && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-stone-900 to-rose-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-extrabold">
                    <Crown className="w-4 h-4" />
                    <span>{isBn ? 'প্রিমিয়াম মেম্বারদের জন্য বিশেষ প্রতিবেদন' : 'Premium Subscriber Spotlight'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-200">
                    {isBn
                      ? 'বিজ্ঞাপন-মুক্ত পূর্ণাঙ্গ পাঠ ও দৈনিক ই-পেপার আনলক করতে নিউজফ্লো প্রিমিয়াম মেম্বারশিপ নিন।'
                      : 'Unlock ad-free reading and full daily E-Paper with NewsFlow Premium.'}
                  </p>
                </div>
                <Link
                  to="/subscribe"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shrink-0 text-center"
                >
                  {isBn ? 'প্রিমিয়াম নিন →' : 'Go Premium →'}
                </Link>
              </div>
            )}
            <RichArticleBody
              content={content}
              paragraphClassName={fontSizes[fontSize]}
              renderAfterBlock={(index) =>
                index === 2 ? (
                  <div className="my-6">
                    <AdPlacement placement="in_feed" />
                  </div>
                ) : null
              }
            />
          </div>

          {/* Key Takeaways Box */}
          <div className="mt-8 p-5 bg-stone-50 border border-stone-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3 text-rose-700 font-bold text-sm font-serif-bn">
              <Sparkles className="w-4 h-4" />
              <span>{isBn ? 'এক নজরে গুরুত্বপূর্ণ তথ্যসমূহ' : 'Key Highlights'}</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-700 font-serif-bn">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-700 mt-2 shrink-0"></span>
                <span>{stripHtmlTags(subheadline || article.excerpt || '')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-700 mt-2 shrink-0"></span>
                <span>
                  {isBn
                    ? `প্রতিবেদন প্রস্তুত করেছেন: ${article.author} (${article.authorRole || 'নিজস্ব প্রতিবেদক'})`
                    : `Reported by: ${article.author}`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-700 mt-2 shrink-0"></span>
                <span>
                  {isBn
                    ? `বিষয়বস্তু বিভাগ: ${article.categoryName} ${article.subcategory ? '· ' + article.subcategory : ''}`
                    : `Section: ${article.categoryName}`}
                </span>
              </li>
            </ul>
          </div>

          {/* Public Official Correction Notes (Phase 15 Transparency) */}
          {Array.isArray(article.publicCorrections) && article.publicCorrections.length > 0 && (
            <section
              aria-label={isBn ? 'সংবাদ সংশোধনী ও ব্যাখ্যা' : 'Corrections and Clarifications'}
              className="mt-6 rounded-xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 space-y-2.5"
            >
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-serif-bn">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold">
                  !
                </span>
                <span>{isBn ? 'সংবাদ সংশোধনী ও সম্পাদকীয় ব্যাখ্যা' : 'Corrections & Editorial Clarifications'}</span>
              </div>
              <div className="space-y-2">
                {article.publicCorrections.map((corr) => (
                  <div key={corr.id} className="text-xs sm:text-sm text-stone-800 bg-white/80 rounded-lg p-3 border border-amber-200/80 font-serif-bn leading-relaxed">
                    <p>{corr.public_note}</p>
                    {corr.published_at && (
                      <p className="text-[11px] text-stone-500 mt-1 font-sans">
                        {isBn ? 'সংশোধিত প্রকাশ:' : 'Updated:'} {new Date(corr.published_at).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Tags Cloud */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-sans">
                {isBn ? 'ট্যাগ:' : 'Tags:'}
              </span>
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-medium font-serif-bn transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* 8. Enhanced Social Share Buttons Bar */}
          <SocialShareBar article={article} variant="inline" className="mt-8" />

          {/* Author Bio Box */}
          <div className="mt-8 p-5 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Link to={`/author/${article.authorSlug || 'rep-01'}`} className="shrink-0">
              <img
                src={reporterData?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'}
                alt={article.author}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-stone-200"
              />
            </Link>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <Link
                  to={`/author/${article.authorSlug || 'rep-01'}`}
                  className="text-base font-bold text-stone-900 hover:text-rose-700 font-serif-bn transition-colors"
                >
                  {article.author}
                </Link>
                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  {reporterData?.roleBn || article.authorRole}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-serif-bn mb-3 leading-relaxed">
                {reporterData?.bio || 'বস্তুনিষ্ঠ সাংবাদিকতা ও অনুসন্ধানমূলক প্রতিবেদনের মাধ্যমে জনস্বার্থ তুলে ধরতে অঙ্গীকারবদ্ধ।'}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  to={`/author/${article.authorSlug || 'rep-01'}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 transition-colors"
                >
                  <span>{isBn ? 'লেখকের সকল প্রতিবেদন দেখুন →' : 'View all articles by this author →'}</span>
                </Link>
                {(article.authorId || article.authorSlug) && (
                  <FollowTargetButton
                    type="author"
                    targetId={article.authorId || null}
                    targetSlug={article.authorSlug || null}
                    size="sm"
                    label={isBn ? 'লেখককে অনুসরণ করুন' : 'Follow Author'}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Interactive Reader Reactions Bar */}
          <ArticleReactionsBar slug={article.slug || slug} className="mt-8" />

          {/* 10. Newsletter Banner before Comments */}
          <div className="mt-8">
            <NewsletterSubscription variant="banner" />
          </div>

          {/* Privacy-Protected Reader Comments Section */}
          <ArticleCommentsSection slug={article.slug || slug} sectionRef={commentsSectionRef} />

          {/* 7. Contextual Related News Section */}
          <RelatedNews
            currentArticleId={article.id}
            category={article.category}
            subcategory={article.subcategory}
            tags={article.tags}
            limit={4}
            className="mt-12"
          />

        </article>

        {/* Sidebar Canvas (4 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* 6. Enhanced Most Popular News (Top 5 with 24h/7d/30d filter) */}
          <PopularNews limit={5} />

          {/* Sidebar Advertisement Slot */}
          <AdPlacement placement="sidebar" />

          {/* 10. Newsletter Subscription Card */}
          <NewsletterSubscription variant="card" />

          {/* Today's Reader Poll */}
          <TodayPollWidget />

          {/* Editorial Bureau Widget */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-stone-900 font-serif-bn mb-3 pb-2 border-b border-stone-100">
              {isBn ? 'সম্পাদকীয় ডেস্ক' : 'Editorial Desk'}
            </h4>
            <p className="text-xs text-stone-600 font-serif-bn leading-relaxed mb-4">
              {isBn
                ? 'দৈনিক বার্তা প্রবাহের সংবাদকর্মীরা বস্তুনিষ্ঠ তথ্য যাচাই ও ফ্যাক্ট-চেক মেনে প্রতিটি প্রতিবেদন তৈরি করেন।'
                : 'All reports are vetted through rigorous multi-tier fact-checking standards.'}
            </p>
            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <span>{isBn ? 'নিকুঞ্জ-২ সেন্ট্রাল ব্যুরো, ঢাকা' : 'Nikunja-2 Central Bureau, Dhaka'}</span>
              <span className="font-bold text-rose-700">২৪/৭ অনলাইন</span>
            </div>
          </div>

        </aside>

        </div>
      </div>

      {/* Mobile Sticky Bottom Reading Toolbar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2.5 z-40 flex items-center justify-between shadow-lg">
        <button
          type="button"
          onClick={handleToggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isPlayingAudio ? 'bg-rose-700 text-white' : 'bg-stone-100 text-stone-800'
          }`}
        >
          {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-700" />}
          <span>{isPlayingAudio ? (isBn ? 'থামান' : 'Stop') : (isBn ? 'শুনুন' : 'Listen')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const nextSize = fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : fontSize === 'lg' ? 'xl' : 'sm';
            setFontSize(nextSize);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-xs font-bold"
        >
          <Type className="w-3.5 h-3.5 text-stone-600" />
          <span>{fontSize.toUpperCase()}</span>
        </button>

        <button
          type="button"
          onClick={scrollToComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-xs font-bold relative"
        >
          <MessageSquare className="w-4 h-4 text-stone-600" />
          <span className="bg-rose-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-sans">
            {isBn ? toBengaliNumber(totalCommentsCount) : totalCommentsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleArticleBookmark(article)}
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked ? 'text-rose-700 bg-rose-50' : 'text-stone-700 bg-stone-100'
          }`}
          aria-label="Bookmark article"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        <SocialShareBar article={article} variant="compact" />
      </div>
    </>
  );
}

export default NewsDetailsPage;

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toggleBookmark } from '../../store/newsSlice.js';
import { useFeaturedArticles, usePublicArticles } from '../../hooks/usePortalData.js';
import { useGetActiveExperimentsQuery, useTrackExperimentEventMutation } from '../../store/api/analyticsApi.js';
import { canSendClientAnalyticsTelemetry } from '../../utils/analyticsHelpers.js';
import { formatBengaliRelativeTime, calculateReadingTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { Clock, Bookmark, Share2, Sparkles } from 'lucide-react';
import { EDITORIAL_EASE } from '../common/MotionPrimitives.jsx';

export function FeaturedLeadSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { savedArticleIds } = useSelector((state) => state.news);
  const { articles: featuredList } = useFeaturedArticles({ limit: 6 });
  const { articles: recentList } = usePublicArticles({ per_page: 12 });
  const { data: activeExpPayload } = useGetActiveExperimentsQuery();
  const [trackExperimentEvent] = useTrackExperimentEventMutation();
  const trackedLayoutRef = useRef(null);

  const layoutExp = (activeExpPayload?.assignments || []).find((a) => a.experiment_type === 'homepage_layout');
  const layoutMode = layoutExp?.payload?.layout_mode || 'standard';
  const headlineExpByNewsId = {};
  (activeExpPayload?.assignments || []).forEach((a) => {
    if (a.experiment_type === 'headline' && a.target_news_id) {
      headlineExpByNewsId[Number(a.target_news_id)] = a;
    }
  });

  useEffect(() => {
    if (layoutExp?.experiment_id && trackedLayoutRef.current !== layoutExp.variant_id && canSendClientAnalyticsTelemetry()) {
      trackedLayoutRef.current = layoutExp.variant_id;
      trackExperimentEvent({
        experimentId: layoutExp.experiment_id,
        variant_id: layoutExp.variant_id,
        action: 'impression'
      }).catch(() => {});
    }
  }, [layoutExp?.experiment_id, layoutExp?.variant_id, trackExperimentEvent]);

  const trackLayoutOrHeadlineClick = (story) => {
    if (!canSendClientAnalyticsTelemetry()) return;
    if (layoutExp?.experiment_id) {
      trackExperimentEvent({
        experimentId: layoutExp.experiment_id,
        variant_id: layoutExp.variant_id,
        action: 'click'
      }).catch(() => {});
    }
    const hExp = headlineExpByNewsId[Number(story?.id)];
    if (hExp?.experiment_id) {
      trackExperimentEvent({
        experimentId: hExp.experiment_id,
        variant_id: hExp.variant_id,
        action: 'click'
      }).catch(() => {});
    }
  };

  const articles = featuredList.length > 0 ? featuredList : recentList;

  const isBn = language === 'bn';

  // Lead story
  const leadStory = articles.find((a) => a.isLead) || articles[0];
  
  // Secondary stories (next 3 featured or prominent articles)
  const secondaryCandidates = articles.filter((a) => a.id !== leadStory?.id && a.isFeatured);
  const secondaryStories = (secondaryCandidates.length >= 3
    ? secondaryCandidates
    : articles.filter((a) => a.id !== leadStory?.id)
  ).slice(0, 3);

  // Tertiary rapid highlights (next 4 curated stories)
  const tertiaryStories = articles
    .filter((a) => a.id !== leadStory?.id && !secondaryStories.some((s) => s.id === a.id))
    .slice(0, 4);

  const isLeadBookmarked = leadStory ? savedArticleIds.includes(leadStory.id) : false;

  const handleShare = (story, e) => {
    e.stopPropagation();
    const title = isBn ? story.title : (story.titleEn || story.title);
    if (navigator.share) {
      navigator.share({
        title,
        text: isBn ? story.excerpt : story.excerptEn,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert(isBn ? 'সংবাদের লিংক কপি করা হয়েছে!' : 'Article link copied!');
    }
  };

  return (
    <section className="mb-10">
      {/* Editorial Section Header */}
      <div className="flex items-center justify-between pb-2.5 mb-5 border-b-2 border-stone-900">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-rose-700 inline-block rounded-xs"></span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-serif-bn tracking-tight flex items-center gap-2">
            <span>{isBn ? 'প্রধান ও নির্বাচিত সংবাদ' : 'Featured & Top Headlines'}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBn ? 'শীর্ষ সম্পাদকীয় নির্বাচন' : 'Editorial Selection'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Lead Story (adapts to A/B layout_mode: standard | compact_grid | visual_lead) */}
        {leadStory && (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
            whileHover={{ y: -2 }}
            onClick={() => {
              trackLayoutOrHeadlineClick(leadStory);
              navigate(`/news/${leadStory.slug || leadStory.id}`);
            }}
            className={`${layoutMode === 'compact_grid' ? 'lg:col-span-12 lg:grid lg:grid-cols-12' : layoutMode === 'visual_lead' ? 'lg:col-span-8 flex flex-col justify-between' : 'lg:col-span-7 flex flex-col justify-between'} group cursor-pointer bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300`}
          >
            {/* Featured Image with zero-broken container */}
            <div className={`${layoutMode === 'compact_grid' ? 'lg:col-span-7 h-full' : ''} relative aspect-16/10 overflow-hidden bg-stone-100`}>
              <img
                src={leadStory.image}
                alt={isBn ? (headlineExpByNewsId[Number(leadStory.id)]?.payload?.title || leadStory.title) : leadStory.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              {leadStory.isBreaking && (
                <div className="absolute top-3.5 left-3.5 bg-rose-700 text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span>{isBn ? 'জরুরি সংবাদ' : 'BREAKING'}</span>
                </div>
              )}
            </div>

            {/* Content & Lead Typography */}
            <div className={`${layoutMode === 'compact_grid' ? 'lg:col-span-5' : ''} p-6 flex flex-col flex-1 justify-between`}>
              <div>
                {/* Zero-Pill Editorial Metadata */}
                <div className="flex items-center flex-wrap gap-2 text-xs text-rose-700 font-bold mb-2.5">
                  <span>{isBn ? leadStory.categoryName : (leadStory.categoryNameEn || leadStory.categoryName)}</span>
                  <span className="text-stone-400 font-bold" aria-hidden="true">·</span>
                  <span className="text-stone-700 font-semibold text-xs">
                    {isBn ? formatBengaliRelativeTime(leadStory.publishedAt) : 'Recently'}
                  </span>
                  <span className="text-stone-400 font-bold" aria-hidden="true">·</span>
                  <span className="text-stone-700 font-semibold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    {isBn ? calculateReadingTime(leadStory.content) : '4 min read'}
                  </span>
                </div>

                {/* Main Headline */}
                <h3 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold text-stone-950 group-hover:text-rose-800 transition-colors font-serif-bn leading-tight mb-3">
                  {isBn
                    ? (headlineExpByNewsId[Number(leadStory.id)]?.payload?.title || leadStory.title)
                    : (leadStory.titleEn || leadStory.title)}
                </h3>

                {/* Short Description */}
                <p className="text-stone-800 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4 font-normal">
                  {isBn ? leadStory.excerpt : (leadStory.excerptEn || leadStory.excerpt)}
                </p>
              </div>

              {/* Byline and actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs">
                    {leadStory.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {leadStory.author}
                    </h4>
                    <p className="text-xs text-stone-600 font-medium">
                      {leadStory.authorRole}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.86 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(toggleBookmark(leadStory.id));
                    }}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title={isLeadBookmarked ? (isBn ? 'সংরক্ষিত' : 'Bookmarked') : (isBn ? 'সংরক্ষণ করুন' : 'Bookmark')}
                    aria-label="Bookmark lead story"
                  >
                    <Bookmark className={`w-4 h-4 ${isLeadBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.86 }}
                    type="button"
                    onClick={(e) => handleShare(leadStory, e)}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title={isBn ? 'শেয়ার করুন' : 'Share'}
                    aria-label="Share lead story"
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

            </div>
          </motion.article>
        )}

        {/* Column 2: Secondary Headlines */}
        <div className={`${layoutMode === 'compact_grid' ? 'lg:col-span-12 grid grid-cols-1 md:grid-cols-3' : layoutMode === 'visual_lead' ? 'lg:col-span-4 flex flex-col' : 'lg:col-span-5 flex flex-col'} gap-4`}>
          {secondaryStories.map((story, idx) => {
            const isBookmarked = savedArticleIds.includes(story.id);
            const variantTitle = isBn ? headlineExpByNewsId[Number(story.id)]?.payload?.title : null;
            const title = variantTitle || (isBn ? story.title : (story.titleEn || story.title));
            const excerpt = isBn ? story.excerpt : (story.excerptEn || story.excerpt);
            const categoryName = isBn ? story.categoryName : (story.categoryNameEn || story.categoryName);
            const timeAgo = isBn ? formatBengaliRelativeTime(story.publishedAt) : 'Recently';

            return (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.04 + idx * 0.05, ease: EDITORIAL_EASE }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  trackLayoutOrHeadlineClick(story);
                  navigate(`/news/${story.slug || story.id}`);
                }}
                className="group cursor-pointer bg-white border border-stone-200 rounded-xl p-4 hover:shadow-md hover:border-stone-300 transition-shadow flex gap-4 flex-1 items-stretch"
              >
                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-rose-700 font-bold mb-1">
                      <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono font-black flex items-center justify-center">
                        {isBn ? toBengaliNumber(`0${idx + 1}`) : `0${idx + 1}`}
                      </span>
                      <span>{categoryName}</span>
                      <span className="text-stone-300">·</span>
                      <span className="text-stone-500 font-normal">{timeAgo}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug line-clamp-2 mb-1.5">
                      {title}
                    </h4>

                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                      {excerpt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 mt-2">
                    <span className="text-[11px] font-medium text-stone-700">{story.author}</span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleBookmark(story.id));
                      }}
                      className="p-1 rounded hover:text-rose-700 transition-colors cursor-pointer"
                      aria-label="Bookmark story"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
                    </motion.button>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="w-28 sm:w-36 aspect-4/3 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <img
                    src={story.image}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>

      {/* Tertiary Rapid Highlights Bar (4 Highlights) */}
      {tertiaryStories.length > 0 && (
        <div className="mt-6 pt-5 border-t border-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-700"></span>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-serif-bn tracking-wide">
              {isBn ? 'আজকের নির্বাচিত আরও ৪টি খবর' : "Today's Curated 4 Highlights"}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tertiaryStories.map((story, idx) => {
              const title = isBn ? story.title : (story.titleEn || story.title);
              const categoryName = isBn ? story.categoryName : (story.categoryNameEn || story.categoryName);
              const timeAgo = isBn ? formatBengaliRelativeTime(story.publishedAt) : 'Recently';

              return (
                <div
                  key={story.id}
                  onClick={() => {
                    trackLayoutOrHeadlineClick(story);
                    navigate(`/news/${story.slug || story.id}`);
                  }}
                  className="group cursor-pointer p-3.5 rounded-xl bg-white hover:shadow-md border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium mb-1.5 flex-wrap">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {isBn ? toBengaliNumber(idx + 1) : idx + 1}
                      </span>
                      <span className="font-bold text-rose-700">{categoryName}</span>
                      <span className="text-stone-400 font-bold">·</span>
                      <span>{timeAgo}</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-950 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug line-clamp-2">
                      {title}
                    </h4>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-700 font-medium">
                    <span className="truncate">{story.author}</span>
                    <span className="text-rose-700 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default FeaturedLeadSection;

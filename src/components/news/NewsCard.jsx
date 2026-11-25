import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { useReaderBookmark } from '../../hooks/useReaderBookmark.js';
import {
  formatBengaliRelativeTime,
  formatEnglishRelativeTime,
  toBengaliNumber,
  calculateReadingTime,
  calculateEnglishReadingTime
} from '../../utils/bengaliFormatter.js';
import { Bookmark, Clock, Share2, Crown, Megaphone } from 'lucide-react';

export function NewsCard({
  article,
  variant = 'grid', // 'lead' | 'secondary' | 'compact' | 'horizontal' | 'grid'
  className = ''
}) {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { isBookmarked, toggle: toggleReaderBookmark } = useReaderBookmark(article);

  if (!article) return null;

  const isBn = language === 'bn';

  const title = isBn ? article.title : (article.titleEn || article.title);
  const excerpt = isBn ? article.excerpt : (article.excerptEn || article.excerpt);
  const categoryName = isBn ? article.categoryName : (article.categoryNameEn || article.categoryName);
  const timeAgo = isBn
    ? formatBengaliRelativeTime(article.publishedAt)
    : formatEnglishRelativeTime(article.publishedAt);
  const readingTime = isBn
    ? calculateReadingTime(article.content)
    : calculateEnglishReadingTime(article.content);
  const authorName = isBn ? article.author : (article.authorEn || article.author);
  const articleUrl = `/news/${article.slug || article.id}`;

  const handleCardClick = () => {
    navigate(articleUrl);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    toggleReaderBookmark(article);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${articleUrl}`;
    if (navigator.share) {
      navigator.share({
        title,
        text: excerpt,
        url: fullUrl
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(fullUrl);
      alert(isBn ? 'সংবাদের লিংক কপি করা হয়েছে!' : 'Article link copied to clipboard!');
    }
  };

  // Lead Variant (Big Story)
  if (variant === 'lead') {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className={`group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col ${className}`}
      >
        <div className="relative aspect-16/9 overflow-hidden bg-stone-100">
          <img
            src={article.image}
            alt={title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          {article.isBreaking && (
            <span className="absolute top-3 left-3 bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-md uppercase tracking-wider">
              {isBn ? 'জরুরি সংবাদ' : 'Breaking'}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold mb-2 flex-wrap">
            <Link
              to={`/category/${article.category}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-bold"
            >
              {categoryName}
            </Link>
            <span className="text-stone-400 font-bold" aria-hidden="true">·</span>
            <span className="text-stone-700 font-medium">{timeAgo}</span>
            <span className="text-stone-400 font-bold" aria-hidden="true">·</span>
            <span className="text-stone-700 font-medium flex items-center gap-1 font-serif-bn">
              <Clock className="w-3 h-3 text-rose-600" />
              {readingTime}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-stone-950 group-hover:text-rose-800 transition-colors font-serif-bn leading-tight mb-3">
            {article.isSponsored && (
              <span className="inline-flex items-center gap-1 mr-2 align-middle px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs font-sans font-extrabold">
                <Megaphone className="w-3 h-3" />
                <span>{article.sponsoredLabel || (isBn ? 'স্পনসরড' : 'Sponsored')}</span>
              </span>
            )}
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 mr-2 align-middle px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-xs font-sans font-extrabold">
                <Crown className="w-3 h-3" />
                <span>{isBn ? 'প্রিমিয়াম' : 'Premium'}</span>
              </span>
            )}
            {title}
          </h2>

          <p className="text-stone-800 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4 font-serif-bn">
            {excerpt}
          </p>

          <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to={`/author/${article.authorSlug || 'rep-01'}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-stone-900 hover:text-rose-700 transition-colors"
              >
                {authorName}
              </Link>
              {article.authorRole && (
                <span className="text-stone-500 text-xs hidden sm:inline">| {article.authorRole}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-stone-500">
              <motion.button
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={handleBookmarkClick}
                className="p-1.5 rounded-full hover:bg-stone-100 hover:text-rose-700 transition-colors cursor-pointer"
                title={isBookmarked ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'সংরক্ষণ করুন' : 'Save')}
                aria-label="Bookmark article"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={handleShareClick}
                className="p-1.5 rounded-full hover:bg-stone-100 hover:text-rose-700 transition-colors cursor-pointer"
                title={isBn ? 'শেয়ার করুন' : 'Share'}
                aria-label="Share article"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  // Secondary Variant (Middle Column)
  if (variant === 'secondary') {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className={`group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col ${className}`}
      >
        <div className="relative aspect-16/9 overflow-hidden bg-stone-100">
          <img
            src={article.image}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold mb-1.5 flex-wrap">
            <Link
              to={`/category/${article.category}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-bold"
            >
              {categoryName}
            </Link>
            {article.isSponsored && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                <Megaphone className="w-2.5 h-2.5" />
                <span>{article.sponsoredLabel || (isBn ? 'স্পনসরড' : 'Sponsored')}</span>
              </span>
            )}
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold">
                <Crown className="w-2.5 h-2.5" />
                <span>{isBn ? 'প্রিমিয়াম' : 'Premium'}</span>
              </span>
            )}
            <span className="text-stone-400 font-bold" aria-hidden="true">·</span>
            <span className="text-stone-700 font-medium">{timeAgo}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-stone-950 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug mb-2 line-clamp-2">
            {title}
          </h3>

          <p className="text-stone-800 text-xs sm:text-sm line-clamp-2 mb-3 font-serif-bn leading-relaxed">
            {excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between text-xs text-stone-700">
            <Link
              to={`/author/${article.authorSlug || 'rep-01'}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:text-rose-700"
            >
              {article.author}
            </Link>
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={handleBookmarkClick}
              className="p-1 rounded hover:text-rose-700 cursor-pointer"
              title="Bookmark"
              aria-label="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.article>
    );
  }

  // Horizontal Card Variant (for lists)
  if (variant === 'horizontal') {
    return (
      <article
        onClick={handleCardClick}
        className={`group cursor-pointer bg-white border border-stone-200 rounded-lg p-3 hover:border-stone-300 hover:shadow-xs transition-all flex gap-3.5 ${className}`}
      >
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold mb-1 flex-wrap">
              <Link
                to={`/category/${article.category}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline font-bold"
              >
                {categoryName}
              </Link>
              {article.isSponsored && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {article.sponsoredLabel || (isBn ? 'স্পনসরড' : 'Sponsored')}
                </span>
              )}
              {article.isPremium && (
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold">
                  {isBn ? 'প্রিমিয়াম' : 'Premium'}
                </span>
              )}
              <span className="text-stone-400 font-bold">·</span>
              <span className="text-stone-700 font-medium">{timeAgo}</span>
            </div>

            <h4 className="text-sm font-bold text-stone-950 group-hover:text-rose-800 font-serif-bn leading-snug line-clamp-2 mb-1.5">
              {title}
            </h4>
          </div>

          <div className="mt-2 text-xs text-stone-700 font-medium">
            <Link
              to={`/author/${article.authorSlug || 'rep-01'}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-rose-700"
            >
              {article.author}
            </Link>
          </div>
        </div>

        <div className="w-24 sm:w-28 aspect-4/3 rounded-md overflow-hidden bg-stone-100 shrink-0">
          <img
            src={article.image}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      </article>
    );
  }

  // Compact Minimal / Ranked Item
  if (variant === 'compact') {
    return (
      <div
        onClick={handleCardClick}
        className={`group cursor-pointer py-3 border-b border-stone-200 last:border-b-0 hover:bg-stone-50/80 px-2 rounded-lg transition-colors ${className}`}
      >
        <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium mb-1">
          <span className="text-rose-700 font-bold">{categoryName}</span>
          <span className="text-stone-400 font-bold">·</span>
          <span>{timeAgo}</span>
        </div>
        <h4 className="text-sm font-bold text-stone-950 group-hover:text-rose-800 font-serif-bn leading-snug line-clamp-2">
          {title}
        </h4>
      </div>
    );
  }

  // Default Grid Variant
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={`group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col ${className}`}
    >
      <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
        <img
          src={article.image}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
        {article.isBreaking && (
          <span className="absolute top-2 left-2 bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            {isBn ? 'জরুরি' : 'Breaking'}
          </span>
        )}
        {(article.isSponsored || article.isPremium) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {article.isSponsored && (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                <Megaphone className="w-2.5 h-2.5" />
                <span>{article.sponsoredLabel || (isBn ? 'স্পনসরড' : 'Sponsored')}</span>
              </span>
            )}
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 bg-purple-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                <Crown className="w-2.5 h-2.5" />
                <span>{isBn ? 'প্রিমিয়াম' : 'Premium'}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold mb-1.5">
          <Link
            to={`/category/${article.category}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline font-bold"
          >
            {categoryName}
          </Link>
          <span className="text-stone-400 font-bold">·</span>
          <span className="text-stone-700 font-medium">{timeAgo}</span>
        </div>

        <h3 className="text-base font-bold text-stone-950 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-stone-800 text-xs sm:text-[13px] line-clamp-2 mb-3 font-serif-bn leading-relaxed">
          {excerpt}
        </p>

        <div className="mt-auto pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <Link
            to={`/author/${article.authorSlug || 'rep-01'}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-rose-700 font-medium"
          >
            {article.author}
          </Link>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={handleBookmarkClick}
              className="p-1 rounded hover:text-rose-700 cursor-pointer"
              title="Bookmark"
              aria-label="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-700 text-rose-700' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default NewsCard;

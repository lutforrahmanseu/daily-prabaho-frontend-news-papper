import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { setActiveArticleId, toggleBookmark } from '../../store/newsSlice.js';
import { useGetNewsBySlugQuery } from '../../store/api/newsApi.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import {
  formatBengaliRelativeTime,
  calculateReadingTime,
  toBengaliNumber
} from '../../utils/bengaliFormatter.js';
import { stripHtmlTags } from '../../utils/securitySanitizer.js';
import RichArticleBody from './RichArticleBody.jsx';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';
import {
  X,
  Bookmark,
  Share2,
  Clock,
  Volume2,
  VolumeX,
  Type,
  ThumbsUp,
  MessageSquare,
  Facebook,
  Twitter,
  Send,
  Eye,
  Check
} from 'lucide-react';

export function ArticleDetailModal() {
  const dispatch = useDispatch();
  const { activeArticleId, savedArticleIds } = useSelector((state) => state.news);
  const { language } = useSelector((state) => state.ui);
  const { data: fetchedArticle } = useGetNewsBySlugQuery(activeArticleId, { skip: !activeArticleId });
  const { articles } = usePublicArticles({ per_page: 20 }, { skip: !activeArticleId });

  const [readingFontSize, setReadingFontSize] = useState('text-base'); // 'text-sm' | 'text-base' | 'text-lg' | 'text-xl'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 'c1',
      author: 'তানভীর হোসাইন',
      time: '১৫ মিনিট আগে',
      text: 'মেট্রোরেলের এই রুট সম্প্রসারণ ঢাকার সামগ্রিক যানজট নিরসনে সত্যিই মাইলফলক হয়ে থাকবে।'
    },
    {
      id: 'c2',
      author: 'ড. রফিকুল ইসলাম',
      time: '১ ঘণ্টা আগে',
      text: 'পরিবেশবান্ধব পরিবহন ব্যবস্থা গড়ে তোলার জন্য কর্তৃপক্ষকে সাধুবাদ জানাই।'
    }
  ]);
  const [likesCount, setLikesCount] = useState(142);
  const [hasLiked, setHasLiked] = useState(false);

  const isBn = language === 'bn';

  const article = activeArticleId
    ? (fetchedArticle || articles.find((a) => a.id === activeArticleId || a.slug === activeArticleId))
    : null;
  const isModalOpen = Boolean(activeArticleId && article);

  const isBookmarked = article ? savedArticleIds.includes(article.id) : false;
  const title = article ? (isBn ? article.title : (article.titleEn || article.title)) : '';
  const content = article ? (isBn ? article.content : (article.contentEn || article.content)) : '';
  const timeAgo = article ? (isBn ? formatBengaliRelativeTime(article.publishedAt) : 'Recently') : '';
  const readingTime = isBn ? calculateReadingTime(content) : '3 min read';

  const relatedArticles = article
    ? articles
        .filter((a) => a.id !== article.id && (a.category === article.category || a.isFeatured))
        .slice(0, 3)
    : [];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert(isBn ? 'আপনার ব্রাউজারে টেক্সট-টু-স্পিচ সমর্থিত নয়।' : 'Speech synthesis not supported in this browser.');
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(title + '. ' + stripHtmlTags(content));
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([
      {
        id: `c-${Date.now()}`,
        author: isBn ? 'পাঠক (নামহীন)' : 'Anonymous Reader',
        time: isBn ? 'এইমাত্র' : 'Just now',
        text: commentText.trim()
      },
      ...comments
    ]);
    setCommentText('');
  };

  const handleClose = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    }
    dispatch(setActiveArticleId(null));
  };

  return (
    <MotionOverlay
      isOpen={isModalOpen}
      onBackdropClick={handleClose}
      wrapperClassName="z-50 p-2 sm:p-4 md:p-6 overflow-y-auto"
      backdropClassName="bg-black/70 backdrop-blur-xs"
      panelClassName="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-4 max-h-[92vh] flex flex-col"
    >
      {article && (
        <>
          {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
            <span>{article.categoryName}</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500 font-normal">{timeAgo}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Reader */}
            <button
              type="button"
              onClick={handleAudioToggle}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isPlayingAudio
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
              title={isPlayingAudio ? 'অডিও বন্ধ করুন' : 'সংবাদ শুনুন (Text-to-Speech)'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isPlayingAudio ? (isBn ? 'বন্ধ করুন' : 'Stop Audio') : (isBn ? 'শুনুন' : 'Listen')}
              </span>
            </button>

            {/* Font Size Step */}
            <button
              type="button"
              onClick={() => {
                const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];
                const nextIdx = (sizes.indexOf(readingFontSize) + 1) % sizes.length;
                setReadingFontSize(sizes[nextIdx]);
              }}
              className="p-2 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
              title="Change reading font size"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Bookmark */}
            <button
              type="button"
              onClick={() => dispatch(toggleBookmark(article.id))}
              className={`p-2 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
              title="Bookmark article"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-700' : ''}`} />
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Full page link */}
            <Link
              to={`/news/${article.slug || article.id}`}
              onClick={handleClose}
              className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1"
              title={isBn ? 'সম্পূর্ণ সংবাদ পৃষ্ঠায় যান' : 'Go to full article page'}
            >
              <span>{isBn ? 'সম্পূর্ণ পৃষ্ঠা' : 'Full Page'}</span>
            </Link>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close reader"
              className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif-bn leading-tight">
            {title}
          </h1>

          {/* Byline & Read Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 py-3 border-y border-stone-200 text-xs text-stone-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-700 text-white font-bold flex items-center justify-center font-serif-bn shrink-0">
                {article.author?.[0] || 'ব'}
              </div>
              <div>
                <p className="font-bold text-stone-900">{article.author}</p>
                <p className="text-[11px] text-stone-500">{article.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-stone-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {isBn ? toBengaliNumber(article.views || 1845) : (article.views || 1845)} বার পঠিত
              </span>
            </div>
          </div>

          {/* Lead Photograph with caption */}
          {article.image && (
            <div className="space-y-2">
              <img
                src={article.image}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full aspect-16/9 object-cover rounded-xl border border-stone-200 shadow-sm"
              />
              {article.imageCaption && (
                <p className="text-xs text-stone-500 italic font-serif-bn text-center">
                  {article.imageCaption}
                </p>
              )}
            </div>
          )}

          {/* Excerpt Lead Deck */}
          <div className="p-4 bg-stone-50 border-l-4 border-rose-700 rounded-r-lg">
            <p className="text-base sm:text-lg font-medium text-stone-800 italic leading-relaxed font-serif-bn">
              {stripHtmlTags(isBn ? article.excerpt : (article.excerptEn || article.excerpt))}
            </p>
          </div>

          {/* Body Prose Paragraphs */}
          <RichArticleBody
            content={content}
            paragraphClassName={`leading-relaxed ${readingFontSize}`}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-stone-200">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                {isBn ? 'সম্পর্কিত বিষয়' : 'Related Topics'}
              </p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reader Engagement (Like & Share) */}
          <div className="py-4 border-y border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setHasLiked(!hasLiked);
                setLikesCount(l => hasLiked ? l - 1 : l + 1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                hasLiked
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-rose-700' : ''}`} />
              <span>{isBn ? toBengaliNumber(likesCount) : likesCount} {isBn ? 'পছন্দ' : 'Likes'}</span>
            </button>

            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-xs font-medium mr-1">{isBn ? 'শেয়ার করুন:' : 'Share:'}</span>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                title="Share on Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600"
                title="Share on X"
              >
                <Twitter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reader Comments Section */}
          <div className="pt-2">
            <h3 className="text-lg font-bold text-stone-900 font-serif-bn flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-rose-700" />
              <span>{isBn ? `মন্তব্য (${toBengaliNumber(comments.length)})` : `Comments (${comments.length})`}</span>
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isBn ? 'এই সংবাদ সম্পর্কে আপনার সুচিন্তিত মতামত লিখুন...' : 'Write your comment on this article...'}
                rows={3}
                required
                className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isBn ? 'মন্তব্য প্রকাশ করুন' : 'Submit Comment'}</span>
                </button>
              </div>
            </form>

            {/* Comment List */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                    <span className="font-bold text-stone-900">{c.author}</span>
                    <span className="text-stone-400 text-[11px]">{c.time}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 font-serif-bn leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="pt-6 border-t border-stone-200">
              <h3 className="text-base font-bold text-stone-900 font-serif-bn mb-4">
                {isBn ? 'আরও পড়তে পারেন' : 'Related Articles'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => dispatch(setActiveArticleId(rel.id))}
                    className="group cursor-pointer rounded-lg border border-stone-200 overflow-hidden hover:shadow-sm"
                  >
                    <img
                      src={rel.image}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-16/10 object-cover"
                    />
                    <div className="p-3">
                      <span className="text-[10px] text-rose-700 font-bold uppercase">
                        {rel.categoryName}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 group-hover:text-rose-800 line-clamp-2 mt-1 font-serif-bn">
                        {isBn ? rel.title : rel.titleEn}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        </>
      )}
    </MotionOverlay>
  );
}

export default ArticleDetailModal;

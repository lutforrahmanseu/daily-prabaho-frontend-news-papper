import React, { useState } from 'react';
import { X, Smartphone, Monitor, Calendar, Clock, Eye, Share2, Tag, ShieldCheck, User } from 'lucide-react';
import { toBengaliNumber, formatBengaliFullDateTime, calculateReadingTime } from '../../utils/bengaliFormatter.js';
import { stripHtmlTags } from '../../utils/securitySanitizer.js';
import RichArticleBody from '../news/RichArticleBody.jsx';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';

export function ArticlePreviewModal({ isOpen, onClose, article }) {
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'

  const readingTime = calculateReadingTime(article?.content || '');

  return (
    <MotionOverlay
      isOpen={Boolean(isOpen && article)}
      onBackdropClick={onClose}
      wrapperClassName="z-50 p-2 sm:p-4"
      backdropClassName="bg-stone-950/80 backdrop-blur-sm"
      panelClassName="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200"
    >
      {article && (
        <>
        
        {/* Modal Top Header Controls */}
        <div className="h-14 bg-stone-900 text-white px-4 sm:px-6 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider bg-rose-700 text-white px-2 py-0.5 rounded">
              লাইভ প্রিভিউ (Preview Mode)
            </span>
            <span className="text-xs text-stone-300 font-serif-bn hidden sm:inline truncate max-w-md">
              {article.title || 'শিরোনামহীন সংবাদ'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="ডেস্কটপ ভিউ"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline">ডেস্কটপ</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="মোবাইল ভিউ"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden md:inline">মোবাইল</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="প্রিভিউ বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 flex justify-center">
          
          <div
            className={`bg-white rounded-2xl shadow-sm border border-stone-200 transition-all duration-300 ${
              deviceMode === 'mobile'
                ? 'w-full max-w-sm p-4 ring-8 ring-stone-900 rounded-3xl my-auto'
                : 'w-full max-w-4xl p-6 sm:p-10'
            }`}
          >
            {/* Category & Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded bg-rose-700 text-white font-bold text-xs font-serif-bn">
                {article.categoryName || article.category}
              </span>
              {article.subcategory && (
                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold text-xs">
                  {article.subcategory}
                </span>
              )}
              {article.isBreaking && (
                <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px] animate-pulse">
                  ⚡ ব্রেকিং নিউজ
                </span>
              )}
            </div>

            {/* Subheadline if exists */}
            {article.subheadline && (
              <p className="text-sm sm:text-base font-bold text-rose-800 font-serif-bn mb-1.5">
                {article.subheadline}
              </p>
            )}

            {/* Headline */}
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black font-serif-bn text-stone-950 leading-tight mb-4">
              {article.title || 'শিরোনাম এখানে প্রদর্শিত হবে'}
            </h1>

            {/* Author Lockup & Date */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-stone-100 text-xs text-stone-600 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">{article.author || 'প্রতিবেদক'}</p>
                  <p className="text-[11px] text-stone-500">{article.authorRole || 'দৈনিক বার্তা প্রবাহ'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>পাঠের সময়: {readingTime}</span>
                </span>
                <span>•</span>
                <span>প্রকাশকাল: {formatBengaliFullDateTime(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Featured Image */}
            {article.image && (
              <figure className="mb-6">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full rounded-2xl object-cover max-h-[460px] border border-stone-200"
                />
                {(article.imageCaption || article.imageCredit) && (
                  <figcaption className="mt-2 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="font-serif-bn">{article.imageCaption}</span>
                    {article.imageCredit && (
                      <span className="font-semibold text-stone-600">
                        ছবি: {article.imageCredit}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-sm sm:text-base font-semibold font-serif-bn text-stone-700 bg-stone-50 p-4 rounded-xl border-l-4 border-rose-700 mb-6 leading-relaxed">
                {stripHtmlTags(article.excerpt)}
              </p>
            )}

            {/* Rich Article Body */}
            <RichArticleBody
              content={article.content || ''}
              emptyFallback="<p>সংবাদের মূল অংশ এখানে প্রদর্শিত হবে...</p>"
              paragraphClassName="leading-relaxed text-sm sm:text-base"
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-500 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-rose-700" />
                  <span>ট্যাগ:</span>
                </span>
                {(Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium font-serif-bn"
                  >
                    #{typeof tag === 'string' ? tag.trim() : tag.name}
                  </span>
                ))}
              </div>
            )}

          </div>

        </div>
        </>
      )}
    </MotionOverlay>
  );
}

export default ArticlePreviewModal;


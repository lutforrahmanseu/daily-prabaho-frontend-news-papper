import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import { useGetAuthorsQuery } from '../../store/api/authorApi.js';
import { Quote, Feather, Clock } from 'lucide-react';
import { EditorialReveal } from '../common/MotionPrimitives.jsx';

export function OpinionSection() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { articles: opinionArticles } = usePublicArticles({ category: 'opinion', per_page: 6 });
  const { articles: fallbackArticles } = usePublicArticles({ per_page: 6 });
  const { data: authorsData } = useGetAuthorsQuery({ active_only: true, per_page: 6 });

  const isBn = language === 'bn';
  const pool = opinionArticles.length > 0 ? opinionArticles : fallbackArticles;
  const dbAuthors = authorsData?.items || [];

  const cards = pool.slice(0, 3).map((art, idx) => {
    const matchedAuthor = dbAuthors[idx] || art.authorObj || {};
    return {
      id: art.id,
      slug: art.slug || art.id,
      topic: art.title,
      topicEn: art.titleEn || art.title,
      quote: art.excerpt || art.subheadline || art.title,
      readTime: `${art.readingTime || 3} মিনিট`,
      name: art.author || matchedAuthor.name || 'নিজস্ব বিশ্লেষক',
      nameEn: matchedAuthor.nameEn || art.author || 'Staff Columnist',
      designation: art.authorDesignation || matchedAuthor.designation || 'সম্পাদকীয় ও মতামত বিভাগ',
      avatar: art.authorAvatar || matchedAuthor.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };
  });

  if (cards.length === 0) return null;

  return (
    <EditorialReveal as="section" className="mb-10 pt-6 border-t border-stone-200">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-stone-900">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-stone-900 inline-block rounded-xs"></span>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-bn flex items-center gap-2">
            <Feather className="w-5 h-5 text-rose-700" />
            <span>{isBn ? 'মতামত, কলাম ও সম্পাদকীয়' : 'Opinion, Columns & Perspectives'}</span>
          </h2>
        </div>
        <span className="text-xs text-stone-500 font-medium hidden sm:inline">
          {isBn ? 'চিন্তাশীল সমাজের প্রতিচ্ছবি' : 'Thought Leadership & Analysis'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((col) => (
          <article
            key={col.id}
            onClick={() => navigate(`/news/${col.slug}`)}
            className="group cursor-pointer bg-[#faf8f5] border border-stone-200/90 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:border-stone-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Quote icon & reading time */}
              <div className="flex items-center justify-between mb-3 text-stone-400">
                <Quote className="w-6 h-6 text-rose-300 group-hover:text-rose-700 transition-colors" />
                <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-600" />
                  <span>{col.readTime}</span>
                </span>
              </div>

              {/* Column Title */}
              <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-rose-800 transition-colors font-serif-bn leading-snug mb-3">
                {isBn ? col.topic : (col.topicEn || col.topic)}
              </h3>

              {/* Excerpt quote */}
              <p className="text-stone-600 text-xs sm:text-sm italic leading-relaxed line-clamp-3 mb-4 pl-3 border-l-2 border-rose-300">
                "{col.quote}"
              </p>
            </div>

            {/* Columnist Profile Footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-stone-200 mt-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-stone-300 shrink-0 bg-stone-200">
                <img
                  src={col.avatar}
                  alt={col.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-900 font-serif-bn group-hover:text-rose-800 transition-colors">
                  {isBn ? col.name : col.nameEn}
                </h4>
                <p className="text-[11px] text-stone-600 leading-tight mt-0.5 line-clamp-2">
                  {col.designation}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </EditorialReveal>
  );
}

export default OpinionSection;

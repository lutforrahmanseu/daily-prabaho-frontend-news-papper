import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import NewsCard from './NewsCard.jsx';
import { ArrowRight } from 'lucide-react';
import { EditorialReveal, MotionStaggerGrid, MotionStaggerItem } from '../common/MotionPrimitives.jsx';

export function CategorySection({
  categorySlug,
  titleBn,
  titleEn,
  articles,
  columns = 3,
  layout = 'magazine'
}) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  if (!articles || articles.length === 0) return null;

  const isMagazineStyle = layout === 'magazine' && articles.length >= 3 && columns === 2;
  const leadArticle = articles[0];
  const sideArticles = articles.slice(1, 4);

  return (
    <EditorialReveal as="section" className="mb-10 pt-6 border-t border-stone-200 scroll-mt-20">
      <div id={`category-${categorySlug}`}>
        {/* Category Section Header */}
        <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-stone-900">
          <Link to={`/category/${categorySlug}`} className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-6 bg-rose-700 inline-block rounded-xs"></span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-rose-700 font-serif-bn transition-colors">
              {isBn ? titleBn : titleEn}
            </h2>
          </Link>

          <Link
            to={`/category/${categorySlug}`}
            className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 group transition-colors cursor-pointer"
          >
            <span>{isBn ? 'আরও সংবাদ' : 'More Stories'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Magazine Style (Lead + Side Horizontal List) or Standard Grid */}
        {isMagazineStyle ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Left Lead Story (Col 1 to 7) */}
            <div className="md:col-span-7 flex flex-col">
              <NewsCard
                article={leadArticle}
                variant="secondary"
                className="h-full"
              />
            </div>

            {/* Right Sub-Stories Stack (Col 8 to 12) */}
            <div className="md:col-span-5 flex flex-col gap-3 justify-between">
              {sideArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  variant="horizontal"
                  className="flex-1"
                />
              ))}
            </div>
          </div>
        ) : (
          /* Standard Grid of Articles */
          <MotionStaggerGrid
            className={columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'}
          >
            {articles.slice(0, columns === 2 ? 2 : 3).map((article) => (
              <MotionStaggerItem key={article.id}>
                <NewsCard
                  article={article}
                  variant="grid"
                />
              </MotionStaggerItem>
            ))}
          </MotionStaggerGrid>
        )}
      </div>
    </EditorialReveal>
  );
}

export default CategorySection;

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
  columns = 3
}) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  if (!articles || articles.length === 0) return null;

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

        {/* Grid of Articles */}
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
      </div>
    </EditorialReveal>
  );
}

export default CategorySection;

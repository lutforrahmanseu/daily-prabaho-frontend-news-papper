import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useGetPublicPhotoCollectionsQuery } from '../../store/api/multimediaApi.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { EditorialReveal } from '../common/MotionPrimitives.jsx';

export function VisualShowcaseSection({ fallbackArticles = [] }) {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data: photoData } = useGetPublicPhotoCollectionsQuery({ per_page: 4 });
  const collections = photoData?.items || [];

  // If photo collections exist, use them; otherwise use articles that have images
  const items = collections.length >= 2
    ? collections.slice(0, 4).map((c) => ({
        id: c.id,
        title: isBn ? c.title : (c.title_en || c.title),
        url: `/multimedia/photos/${c.slug || c.id}`,
        imageUrl: c.cover_image_url || c.thumbnail_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        caption: c.summary || c.caption || '',
        count: c.photos_count || (c.photos ? c.photos.length : 5),
        photographer: c.photographer_name || (isBn ? 'স্টাফ ফটোসাংবাদিক' : 'Staff Photojournalist')
      }))
    : fallbackArticles.filter((a) => a.image).slice(0, 4).map((a) => ({
        id: a.id,
        title: isBn ? a.title : (a.titleEn || a.title),
        url: `/news/${a.slug || a.id}`,
        imageUrl: a.image,
        caption: isBn ? a.excerpt : (a.excerptEn || a.excerpt),
        count: 4,
        photographer: a.author || (isBn ? 'দৈনিক বার্তা প্রবাহ' : 'Daily Prabaho')
      }));

  if (items.length === 0) return null;

  return (
    <EditorialReveal as="section" className="my-10">
      <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl overflow-hidden relative">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-stone-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-700 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-serif-bn tracking-tight">
                  {isBn ? 'ছবিতে আজকের বাংলাদেশ ও বিশ্ব' : 'Visual Stories & Photojournalism'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>ফটোগ্যালারি</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 font-serif-bn">
                {isBn ? 'ক্যামেরার লেন্সে ধরা পড়া আজকের সেরা চিত্রসংবাদ' : 'Striking visual storytelling from around the nation and globe'}
              </p>
            </div>
          </div>

          <Link
            to="/multimedia"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-800 hover:bg-rose-700 text-stone-200 hover:text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>{isBn ? 'সব ছবির অ্যালবাম' : 'View All Galleries'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Photo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => navigate(item.url)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 hover:border-rose-500/60 transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-stone-950">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                
                {/* Photo Count Badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-stone-950/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold border border-white/10">
                  <ImageIcon className="w-3 h-3 text-rose-400" />
                  <span>{isBn ? toBengaliNumber(item.count) : item.count}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="text-sm sm:text-base font-bold font-serif-bn text-stone-100 group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug mb-2">
                  {item.title}
                </h3>
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="truncate">{item.photographer}</span>
                  <span className="text-rose-400 font-bold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EditorialReveal>
  );
}

export default VisualShowcaseSection;

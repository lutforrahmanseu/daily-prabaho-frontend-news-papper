import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Maximize2, MapPin, UserCheck } from 'lucide-react';
import { useGetPublicPhotoCollectionBySlugQuery } from '../../store/api/multimediaApi.js';
import { AccessibleSlideshowModal } from '../../components/multimedia/MultimediaWidgets.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function PhotoCollectionDetailPage() {
  const { slug } = useParams();
  const { data: collection, isLoading, isError } = useGetPublicPhotoCollectionBySlugQuery(slug);
  const [slideshowIndex, setSlideshowIndex] = useState(null);

  if (isLoading) {
    return <main className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-stone-500">গ্যালারি লোড হচ্ছে...</main>;
  }

  if (isError || !collection) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-base font-bold text-stone-800">ফটো গ্যালারি বা ফটো স্টোরি পাওয়া যায়নি।</p>
        <Link to="/multimedia" className="text-xs font-bold text-rose-700 hover:underline">
          ← মাল্টিমিডিয়া হাবে ফিরে যান
        </Link>
      </main>
    );
  }

  const items = collection.items || [];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/multimedia?tab=gallery"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল ফটো গ্যালারি</span>
        </Link>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setSlideshowIndex(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>স্লাইডশো মোড চালু করুন ({toBengaliNumber(items.length)} ছবি)</span>
          </button>
        )}
      </div>

      <header className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <Camera className="w-3.5 h-3.5" />
          <span>{collection.collection_type === 'photo_story' ? 'ভিজ্যুয়াল ফটো স্টোরি' : 'ফটো গ্যালারি'}</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black font-serif-bn text-stone-900 dark:text-stone-100 leading-tight">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-3xl leading-relaxed">
            {collection.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
          {collection.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-700" />
              <span>{collection.location}</span>
            </span>
          )}
          {collection.reporter?.name && (
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-rose-700" />
              <span>আলোকচিত্র ও প্রতিবেদন: {collection.reporter.name}</span>
            </span>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((slide, idx) => (
          <figure
            key={slide.id || idx}
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs"
          >
            <button
              type="button"
              onClick={() => setSlideshowIndex(idx)}
              aria-label={`ছবি ${idx + 1} স্লাইডশোতে দেখুন: ${slide.title || slide.caption || collection.title}`}
              className="relative w-full aspect-16/10 bg-stone-900 overflow-hidden block cursor-pointer group"
            >
              <img
                src={slide.image_url}
                alt={slide.title || slide.caption || collection.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-mono font-bold">
                {toBengaliNumber(idx + 1)} / {toBengaliNumber(items.length)}
              </span>
            </button>
            <figcaption className="p-4 space-y-1.5">
              {slide.title && (
                <h2 className="text-base font-bold font-serif-bn text-stone-900 dark:text-stone-100">{slide.title}</h2>
              )}
              {slide.caption && <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">{slide.caption}</p>}
              {(slide.credit || slide.location) && (
                <p className="text-[11px] text-stone-400">
                  {[slide.location, slide.credit ? `ছবি: ${slide.credit}` : ''].filter(Boolean).join(' • ')}
                </p>
              )}
            </figcaption>
          </figure>
        ))}
      </section>

      <AccessibleSlideshowModal
        items={items}
        startIndex={slideshowIndex ?? 0}
        isOpen={slideshowIndex !== null}
        title={collection.title}
        onClose={() => setSlideshowIndex(null)}
      />
    </main>
  );
}

export default PhotoCollectionDetailPage;


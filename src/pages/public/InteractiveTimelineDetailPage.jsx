import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useGetPublicTimelineBySlugQuery } from '../../store/api/multimediaApi.js';
import { InteractiveTimelineViewer } from '../../components/multimedia/MultimediaWidgets.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function InteractiveTimelineDetailPage() {
  const { slug } = useParams();
  const { data: timeline, isLoading, isError } = useGetPublicTimelineBySlugQuery(slug);

  if (isLoading) {
    return <main className="max-w-4xl mx-auto px-4 py-12 text-center text-sm text-stone-500">টাইমলাইন লোড হচ্ছে...</main>;
  }

  if (isError || !timeline) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-base font-bold text-stone-800">টাইমলাইনটি পাওয়া যায়নি।</p>
        <Link to="/multimedia?tab=timeline" className="text-xs font-bold text-rose-700 hover:underline">
          ← মাল্টিমিডিয়া হাবে ফিরে যান
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        to="/multimedia?tab=timeline"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল টাইমলাইন</span>
      </Link>

      <header className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>ইন্টারঅ্যাক্টিভ টাইমলাইন • {toBengaliNumber(timeline.events?.length || 0)}টি অধ্যায়</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black font-serif-bn text-stone-900 dark:text-stone-100 leading-tight">
          {timeline.title}
        </h1>
        {timeline.subtitle && <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300">{timeline.subtitle}</p>}
        {timeline.description && <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">{timeline.description}</p>}
      </header>

      <InteractiveTimelineViewer events={timeline.events || []} />
    </main>
  );
}

export default InteractiveTimelineDetailPage;


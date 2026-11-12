import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Calendar, CheckCircle2, Globe2, MapPin, Sparkles, Trophy, Users } from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';
import { useGetSpecialProjectDetailQuery } from '../../store/api/eventsApi.js';
import { SPECIAL_PROJECT_TRACK_MAP, resolveEventMediaUrl } from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';

export function SpecialProjectDetailPage() {
  const { slug } = useParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data, isLoading, isError } = useGetSpecialProjectDetailQuery(slug, { skip: !slug });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-stone-500">
        {isBn ? 'বিশেষ প্রকল্পের তথ্য লোড হচ্ছে...' : 'Loading special project...'}
      </div>
    );
  }

  if (isError || !data?.project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-base font-bold text-stone-800">
          {isBn ? 'বিশেষ প্রকল্পটি খুঁজে পাওয়া যায়নি।' : 'Special project not found.'}
        </p>
        <Link to="/events" className="text-sm font-bold text-rose-700 hover:underline">
          {isBn ? 'ইভেন্ট কেন্দ্রে ফিরুন' : 'Back to Events'}
        </Link>
      </div>
    );
  }

  const { project, events = [] } = data;
  const trackMeta = SPECIAL_PROJECT_TRACK_MAP[project.project_type] || SPECIAL_PROJECT_TRACK_MAP.education;
  const objectives = Array.isArray(project.objectives) ? project.objectives : [];
  const impactEntries = project.impact_summary && typeof project.impact_summary === 'object'
    ? Object.entries(project.impact_summary)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <SEO title={project.title} description={project.tagline || project.description?.slice(0, 140)} />

      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700">
        <ArrowLeft className="w-4 h-4" />
        <span>{isBn ? 'সকল ইভেন্ট ও বিশেষ প্রকল্প' : 'All Events & Special Projects'}</span>
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        {project.banner_image_url && (
          <div className="h-56 sm:h-72 bg-stone-100 overflow-hidden">
            <img
              src={resolveEventMediaUrl(project.banner_image_url)}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${trackMeta.badgeClass}`}>
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              {isBn ? trackMeta.labelBn : trackMeta.labelEn}
            </span>
            {project.district_scope && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700 inline-flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5" />
                {project.district_scope}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-serif-bn">{project.title}</h1>
            {project.tagline && <p className="text-base text-rose-700 font-semibold mt-1">{project.tagline}</p>}
          </div>

          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{project.description}</p>

          {impactEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {impactEntries.map(([key, val]) => (
                <div key={key} className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xl font-black text-stone-900 mt-1">
                    {typeof val === 'number' && isBn ? toBengaliNumber(val) : String(val)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {objectives.length > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-stone-900 font-serif-bn">
                {isBn ? 'মূল লক্ষ্য ও কর্মপরিকল্পনা' : 'Key Objectives'}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Events */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-stone-900 font-serif-bn">
          {isBn ? 'এই প্রকল্পের আওতাধীন ইভেন্টসমূহ' : 'Events Under This Initiative'}
        </h2>
        {events.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-xs text-stone-500">
            {isBn ? 'এই প্রকল্পের জন্য শীঘ্রই নতুন ইভেন্ট যুক্ত করা হবে।' : 'Upcoming events for this initiative will be announced soon.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <Link
                key={ev.id}
                to={`/events/${ev.slug}`}
                className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-rose-300 hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="text-rose-700">{ev.category?.name || ev.event_type}</span>
                    {ev.is_competition && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <Trophy className="w-3 h-3" />
                        {isBn ? 'প্রতিযোগিতা' : 'Competition'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-stone-900 font-serif-bn leading-snug">{ev.title}</h3>
                  {ev.summary && <p className="text-xs text-stone-600 line-clamp-2">{ev.summary}</p>}
                </div>
                <div className="space-y-1.5 text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {formatBengaliFullDateTime(ev.starts_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {ev.location_label}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    {isBn ? `নিবন্ধিত: ${toBengaliNumber(ev.registered_count || 0)}` : `Registered: ${ev.registered_count || 0}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SpecialProjectDetailPage;


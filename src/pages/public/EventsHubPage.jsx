import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';
import {
  useGetEventCategoriesQuery,
  useGetEventsCalendarQuery,
  useGetEventsListQuery,
  useGetSpecialProjectsQuery
} from '../../store/api/eventsApi.js';
import {
  EVENT_LIFECYCLE_STATUSES,
  SPECIAL_PROJECT_TRACKS,
  SPECIAL_PROJECT_TRACK_MAP,
  resolveEventMediaUrl
} from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';

const getInitialMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonthKey = (monthKey, delta) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function EventsHubPage({ initialView = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const defaultView = initialView || (location.pathname.includes('/calendar') ? 'calendar' : 'list');
  const [viewMode, setViewMode] = useState(defaultView);
  const [monthKey, setMonthKey] = useState(getInitialMonthKey);

  const [statusFilter, setStatusFilter] = useState('all');
  const [categorySlug, setCategorySlug] = useState('all');
  const [projectTrack, setProjectTrack] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [certCode, setCertCode] = useState('');

  const { data: categories = [] } = useGetEventCategoriesQuery();
  const { data: specialProjects = [] } = useGetSpecialProjectsQuery();
  const { data: eventsRes, isLoading: loadingList } = useGetEventsListQuery({
    status: statusFilter,
    category_slug: categorySlug,
    project_track: projectTrack,
    district: districtFilter || undefined,
    search: searchTerm || undefined,
    per_page: 18
  });

  const { data: calendarData, isFetching: loadingCalendar } = useGetEventsCalendarQuery(monthKey, {
    skip: viewMode !== 'calendar'
  });

  const events = eventsRes?.items || [];

  const calendarCells = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const totalDays = new Date(y, m, 0).getDate();
    const startWeekday = firstDay.getDay();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        empty: false,
        key: dateStr,
        day,
        dateStr,
        items: calendarData?.days?.[dateStr] || []
      });
    }
    return cells;
  }, [monthKey, calendarData]);

  const handleCertLookup = (e) => {
    e.preventDefault();
    const cleaned = certCode.trim().toUpperCase();
    if (cleaned) {
      navigate(`/certificates/verify/${encodeURIComponent(cleaned)}`);
    } else {
      navigate('/certificates/verify');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SEO
        title={isBn ? 'ইভেন্ট, প্রতিযোগিতা ও বিশেষ প্রকল্প' : 'Events, Competitions & Special Projects'}
        description="Upcoming events, calendar, competitions, workshops, and signature national initiatives."
      />

      {/* Editorial Hero + Quick Certificate Verification */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-700/80 text-rose-100">
              <Sparkles className="w-3.5 h-3.5" />
              {isBn ? 'দৈনিক বার্তা প্রবাহ — ইভেন্ট ও বিশেষ উদ্যোগ' : 'Daily Prabaho Events & Special Projects'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-bn">
              {isBn
                ? 'জাতীয় উৎসব, প্রতিযোগিতা ও সামাজিক উদ্যোগ'
                : 'National Festivals, Competitions & Community Initiatives'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {isBn
                ? 'শিক্ষা, বিজ্ঞান, যুব উন্নয়ন, সংস্কৃতি, কৃষি ও জনসচেতনতায় দেশব্যাপী আয়োজন — অনলাইনে নিবন্ধন করুন, প্রতিযোগিতায় অংশ নিন এবং সনদ যাচাই করুন।'
                : 'Explore education, science, youth, cultural, agriculture & public awareness programs — register online, submit competition projects, and verify certificates.'}
            </p>
          </div>

          <form
            onSubmit={handleCertLookup}
            className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 w-full lg:w-80 space-y-2.5"
          >
            <p className="text-xs font-bold flex items-center gap-1.5 text-rose-100">
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'তাৎক্ষণিক সনদ যাচাই (Verify Certificate)' : 'Quick Certificate Verify'}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={certCode}
                onChange={(e) => setCertCode(e.target.value)}
                placeholder="CERT-202611-..."
                className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg bg-white text-stone-900 font-mono uppercase focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shrink-0"
              >
                {isBn ? 'যাচাই' : 'Check'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Special Projects 6-Track Showcase */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-stone-900 font-serif-bn">
            {isBn ? '৬টি বিশেষ প্রকল্প ও সামাজিক উদ্যোগ' : 'Signature Special Projects'}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setProjectTrack('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                projectTrack === 'all'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {isBn ? 'সব ট্র্যাক' : 'All Tracks'}
            </button>
            {SPECIAL_PROJECT_TRACKS.map((track) => (
              <button
                key={track.key}
                type="button"
                onClick={() => setProjectTrack(track.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  projectTrack === track.key
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {isBn ? track.labelBn : track.labelEn}
              </button>
            ))}
          </div>
        </div>

        {specialProjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialProjects.map((proj) => {
              const tMeta = SPECIAL_PROJECT_TRACK_MAP[proj.project_type] || SPECIAL_PROJECT_TRACK_MAP.education;
              return (
                <Link
                  key={proj.id}
                  to={`/events/projects/${proj.slug}`}
                  className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-rose-300 hover:shadow-sm transition flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tMeta.badgeClass}`}>
                        {isBn ? tMeta.labelBn : tMeta.labelEn}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500">
                        {isBn
                          ? `${toBengaliNumber(proj.events_count || 0)}টি ইভেন্ট`
                          : `${proj.events_count || 0} Events`}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-stone-900 font-serif-bn">{proj.title}</h3>
                    {proj.tagline && <p className="text-xs text-stone-600 line-clamp-2">{proj.tagline}</p>}
                  </div>
                  <p className="text-[11px] font-bold text-rose-700">
                    {isBn ? 'প্রকল্পের বিস্তারিত ও প্রভাব দেখুন →' : 'View initiative & impact →'}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Filter Bar + List/Calendar Toggle */}
      <section className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                viewMode === 'list'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{isBn ? 'ইভেন্ট তালিকা' : 'List View'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                viewMode === 'calendar'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{isBn ? 'মাসিক ক্যালেন্ডার' : 'Monthly Calendar'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['all', 'upcoming', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  statusFilter === st ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'all'
                  ? isBn ? 'সকল ইভেন্ট' : 'All'
                  : st === 'upcoming'
                  ? isBn ? 'আসন্ন ইভেন্ট' : 'Upcoming'
                  : isBn ? 'সম্পন্ন ইভেন্ট' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'ইভেন্ট বা প্রতিযোগিতা খুঁজুন...' : 'Search events...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
              />
            </div>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
            >
              <option value="all">{isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              placeholder={isBn ? 'জেলা (যেমন: ঢাকা, খুলনা)' : 'District filter'}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
            />
          </div>
        )}
      </section>

      {/* Main Content: Calendar OR Event Cards */}
      {viewMode === 'calendar' ? (
        <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 font-mono">{monthKey}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonthKey((prev) => shiftMonthKey(prev, -1))}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMonthKey(getInitialMonthKey())}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold hover:bg-stone-100"
              >
                {isBn ? 'চলতি মাস' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setMonthKey((prev) => shiftMonthKey(prev, 1))}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-stone-500 border-b border-stone-200 pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {loadingCalendar ? (
            <div className="py-12 text-center text-xs text-stone-500">
              {isBn ? 'ক্যালেন্ডার লোড হচ্ছে...' : 'Loading calendar...'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {calendarCells.map((cell) =>
                cell.empty ? (
                  <div key={cell.key} className="min-h-24 rounded-xl bg-stone-50/50 border border-stone-100" />
                ) : (
                  <div key={cell.key} className="min-h-24 rounded-xl border border-stone-200 p-2 space-y-1 bg-white">
                    <p className="text-xs font-bold text-stone-700">
                      {isBn ? toBengaliNumber(cell.day) : cell.day}
                    </p>
                    <div className="space-y-1">
                      {cell.items.map((ev) => (
                        <Link
                          key={ev.id}
                          to={`/events/${ev.slug}`}
                          className="block text-[10px] font-semibold px-1.5 py-1 rounded bg-rose-50 text-rose-800 hover:bg-rose-100 truncate"
                          title={ev.title}
                        >
                          {ev.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      ) : loadingList ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-xs text-stone-500">
          {isBn ? 'ইভেন্ট তালিকা লোড হচ্ছে...' : 'Loading events...'}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500">
          {isBn ? 'নির্বাচিত ফিল্টারে কোনো ইভেন্ট পাওয়া যায়নি।' : 'No events matched your filters.'}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const stMeta = EVENT_LIFECYCLE_STATUSES[ev.status] || EVENT_LIFECYCLE_STATUSES.published;
            const tMeta = ev.project_track ? SPECIAL_PROJECT_TRACK_MAP[ev.project_track] : null;
            return (
              <div
                key={ev.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-rose-300 transition flex flex-col justify-between"
              >
                <div>
                  {ev.cover_image_url && (
                    <img
                      src={resolveEventMediaUrl(ev.cover_image_url)}
                      alt={ev.title}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ev.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                          {ev.category.name}
                        </span>
                      )}
                      {tMeta && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tMeta.badgeClass}`}>
                          {isBn ? tMeta.labelBn : tMeta.labelEn}
                        </span>
                      )}
                      {ev.is_competition && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          <Trophy className="w-3 h-3" />
                          {isBn ? 'প্রতিযোগিতা' : 'Competition'}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-auto ${stMeta.badgeClass}`}>
                        {isBn ? stMeta.labelBn : stMeta.labelEn}
                      </span>
                    </div>

                    <Link to={`/events/${ev.slug}`} className="block">
                      <h3 className="text-base font-black text-stone-900 font-serif-bn hover:text-rose-700 leading-snug">
                        {ev.title}
                      </h3>
                    </Link>
                    {ev.summary && <p className="text-xs text-stone-600 line-clamp-2">{ev.summary}</p>}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                    {formatBengaliFullDateTime(ev.starts_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {ev.location_label}
                    {ev.district ? ` (${ev.district})` : ''}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      {ev.capacity
                        ? isBn
                          ? `${toBengaliNumber(ev.registered_count)} / ${toBengaliNumber(ev.capacity)}`
                          : `${ev.registered_count} / ${ev.capacity}`
                        : isBn
                        ? `নিবন্ধিত ${toBengaliNumber(ev.registered_count)}`
                        : `${ev.registered_count} registered`}
                    </span>
                    <Link
                      to={`/events/${ev.slug}`}
                      className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{ev.is_registered ? (isBn ? 'আপনি নিবন্ধিত' : 'Registered') : isBn ? 'বিস্তারিত ও নিবন্ধন' : 'View & Register'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default EventsHubPage;


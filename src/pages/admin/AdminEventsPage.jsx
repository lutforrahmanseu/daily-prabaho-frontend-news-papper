import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  Users,
  X
} from 'lucide-react';
import {
  useCreateAdminEventCategoryMutation,
  useCreateAdminEventMutation,
  useCreateAdminSpecialProjectMutation,
  useDeleteAdminEventMutation,
  useGetAdminEventCategoriesQuery,
  useGetAdminEventsOverviewQuery,
  useGetAdminEventsQuery,
  useGetAdminSpecialProjectsQuery,
  useGetEventsCalendarQuery,
  useUpdateAdminEventCategoryMutation,
  useUpdateAdminEventMutation
} from '../../store/api/eventsApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import {
  EVENT_LIFECYCLE_STATUSES,
  EVENT_TYPES,
  SPECIAL_PROJECT_TRACKS,
  SPECIAL_PROJECT_TRACK_MAP
} from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import AdminEventWorkspace from '../../components/admin/AdminEventWorkspace.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (monthKey, delta) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function AdminEventsPage() {
  const { language } = useSelector((state) => state.ui);
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const isBn = language === 'bn';

  const hasManagePerm = hasEffectivePermission(authState, adminState, 'events.manage');
  const hasParticipantsPerm = hasEffectivePermission(authState, adminState, 'events.participants.manage');
  const hasJudgePerm = hasEffectivePermission(authState, adminState, 'events.competitions.judge');
  const hasResultsPerm = hasEffectivePermission(authState, adminState, 'events.results.publish');

  const [activeTab, setActiveTab] = useState('events');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackFilter, setTrackFilter] = useState('all');
  const [monthKey, setMonthKey] = useState(getMonthKey);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const { data: overview = {} } = useGetAdminEventsOverviewQuery();
  const { data: eventsRes, isLoading: loadingEvents, refetch: refetchEvents } = useGetAdminEventsQuery({
    status: statusFilter,
    project_track: trackFilter,
    search: search || undefined
  });
  const { data: categories = [], refetch: refetchCategories } = useGetAdminEventCategoriesQuery(undefined, {
    skip: !hasManagePerm
  });
  const { data: specialProjects = [], refetch: refetchProjects } = useGetAdminSpecialProjectsQuery(undefined, {
    skip: !hasManagePerm
  });
  const { data: calendarData } = useGetEventsCalendarQuery(monthKey, { skip: activeTab !== 'calendar' });

  const [createEvent, { isLoading: creatingEvent }] = useCreateAdminEventMutation();
  const [updateEvent] = useUpdateAdminEventMutation();
  const [deleteEvent] = useDeleteAdminEventMutation();
  const [createCategory] = useCreateAdminEventCategoryMutation();
  const [updateCategory] = useUpdateAdminEventCategoryMutation();
  const [createProject] = useCreateAdminSpecialProjectMutation();

  const [eventForm, setEventForm] = useState({
    title: '',
    summary: '',
    description: '',
    event_type: 'festival',
    event_category_id: '',
    special_project_id: '',
    project_track: '',
    location_label: '',
    venue_address: '',
    district: '',
    is_online: false,
    meeting_url: '',
    starts_at: '',
    registration_deadline_at: '',
    capacity: '',
    allow_waitlist: true,
    require_phone: false,
    require_organization: false,
    is_competition: false,
    organizer_name: 'দৈনিক বার্তা প্রবাহ',
    status: 'published',
    is_featured: false
  });

  const [catForm, setCatForm] = useState({ name: '', name_en: '', color: '#be123c' });
  const [projForm, setProjForm] = useState({
    project_type: 'education',
    title: '',
    tagline: '',
    description: '',
    district_scope: 'দেশব্যাপী',
    status: 'active',
    is_featured: false
  });

  const events = eventsRes?.data || [];

  const calendarCells = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number);
    const startWeekday = new Date(y, m - 1, 1).getDay();
    const totalDays = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ empty: true, key: `e-${i}` });
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ empty: false, key: dateStr, day, items: calendarData?.days?.[dateStr] || [] });
    }
    return cells;
  }, [monthKey, calendarData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        event_category_id: eventForm.event_category_id ? Number(eventForm.event_category_id) : null,
        special_project_id: eventForm.special_project_id ? Number(eventForm.special_project_id) : null,
        project_track: eventForm.project_track || null,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
        registration_deadline_at: eventForm.registration_deadline_at || null,
        meeting_url: eventForm.meeting_url || null
      };
      const created = await createEvent(payload).unwrap();
      setShowEventModal(false);
      setSelectedEventId(created.id);
      sweetAlert.success(isBn ? 'ইভেন্ট সফলভাবে তৈরি হয়েছে।' : 'Event created.');
      refetchEvents();
    } catch (err) {
      const firstErr = err?.data?.errors ? Object.values(err.data.errors).flat()[0] : null;
      sweetAlert.error(firstErr || err?.data?.message || 'Failed to create event');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(catForm).unwrap();
      setCatForm({ name: '', name_en: '', color: '#be123c' });
      sweetAlert.success(isBn ? 'ক্যাটাগরি যুক্ত হয়েছে।' : 'Category added.');
      refetchCategories();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(projForm).unwrap();
      setProjForm({
        project_type: 'education',
        title: '',
        tagline: '',
        description: '',
        district_scope: 'দেশব্যাপী',
        status: 'active',
        is_featured: false
      });
      sweetAlert.success(isBn ? 'বিশেষ প্রকল্প তৈরি হয়েছে।' : 'Special project created.');
      refetchProjects();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif-bn">
            {isBn ? 'ইভেন্ট ও বিশেষ প্রকল্প ব্যবস্থাপনা' : 'Events, Competitions & Special Projects'}
          </h1>
          <p className="text-xs text-stone-500">
            {isBn
              ? 'ইভেন্ট ক্যালেন্ডার, অংশগ্রহণকারী প্রাইভেসি, প্রতিযোগিতা বিচার, ফলাফল প্রকাশ ও সনদ নিয়ন্ত্রণ'
              : 'Manage events, special national projects, competition judging, results gate & certificates'}
          </p>
        </div>

        {hasManagePerm && (
          <button
            type="button"
            onClick={() => setShowEventModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন ইভেন্ট তৈরি করুন' : 'Create Event'}</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { labelBn: 'মোট ইভেন্ট', value: overview.total_events || 0, icon: CalendarIcon, color: 'text-rose-700' },
          { labelBn: 'সক্রিয় নিবন্ধন', value: overview.total_registrations || 0, icon: Users, color: 'text-sky-700' },
          { labelBn: 'চলমান প্রতিযোগিতা', value: overview.active_competitions || 0, icon: Trophy, color: 'text-amber-600' },
          { labelBn: 'ইস্যুকৃত সনদ', value: overview.issued_certificates || 0, icon: Award, color: 'text-emerald-700' }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.labelBn} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-stone-500">{kpi.labelBn}</p>
                <p className="text-xl font-black text-stone-900 mt-0.5">
                  {isBn ? toBengaliNumber(kpi.value) : kpi.value}
                </p>
              </div>
              <Icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
          );
        })}
      </div>

      {/* Console Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'events', labelBn: 'ইভেন্ট তালিকা', icon: CalendarIcon },
          { id: 'calendar', labelBn: 'ইভেন্ট ক্যালেন্ডার', icon: CalendarIcon },
          ...(hasManagePerm ? [{ id: 'projects', labelBn: '৬টি বিশেষ প্রকল্প', icon: Sparkles }] : []),
          ...(hasManagePerm ? [{ id: 'categories', labelBn: 'ইভেন্ট ক্যাটাগরি', icon: Tag }] : [])
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border ${
                activeTab === t.id
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Event Deep Workspace */}
      {selectedEventId && (
        <AdminEventWorkspace
          eventId={selectedEventId}
          hasManagePerm={hasManagePerm}
          hasParticipantsPerm={hasParticipantsPerm}
          hasJudgePerm={hasJudgePerm}
          hasResultsPerm={hasResultsPerm}
          isBn={isBn}
          effectiveToken={authState?.token || null}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* EVENTS TABLE */}
      {activeTab === 'events' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'ইভেন্ট বা জেলা খুঁজুন...' : 'Search events...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">{isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
              {Object.entries(EVENT_LIFECYCLE_STATUSES).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.labelBn}
                </option>
              ))}
            </select>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">{isBn ? 'সকল বিশেষ প্রকল্প ট্র্যাক' : 'All Tracks'}</option>
              {SPECIAL_PROJECT_TRACKS.map((tr) => (
                <option key={tr.key} value={tr.key}>
                  {tr.labelBn}
                </option>
              ))}
            </select>
          </div>

          {loadingEvents ? (
            <p className="text-xs text-stone-500 py-8 text-center">Loading events...</p>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="p-3">{isBn ? 'ইভেন্ট' : 'Event'}</th>
                    <th className="p-3">{isBn ? 'ট্র্যাক ও ক্যাটাগরি' : 'Track & Category'}</th>
                    <th className="p-3">{isBn ? 'সময় ও স্থান' : 'Schedule'}</th>
                    <th className="p-3">{isBn ? 'নিবন্ধন' : 'RSVP'}</th>
                    <th className="p-3">{isBn ? 'অবস্থা ও পদক্ষেপ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {events.map((ev) => {
                    const st = EVENT_LIFECYCLE_STATUSES[ev.status] || EVENT_LIFECYCLE_STATUSES.published;
                    const tMeta = ev.project_track ? SPECIAL_PROJECT_TRACK_MAP[ev.project_track] : null;
                    return (
                      <tr key={ev.id} className="hover:bg-stone-50/60">
                        <td className="p-3">
                          <p className="font-bold text-stone-900">{ev.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">{ev.event_type}</span>
                            {ev.is_competition && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Competition
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {tMeta && (
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mb-1 ${tMeta.badgeClass}`}>
                              {tMeta.labelBn}
                            </span>
                          )}
                          <p className="text-stone-600">{ev.category?.name || '—'}</p>
                        </td>
                        <td className="p-3">
                          <p>{formatBengaliFullDateTime(ev.starts_at)}</p>
                          <p className="text-stone-500">{ev.location_label}</p>
                        </td>
                        <td className="p-3 font-bold">
                          {ev.registered_count || 0}
                          {ev.capacity ? ` / ${ev.capacity}` : ''}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {hasManagePerm ? (
                              <select
                                value={ev.status}
                                onChange={(e) =>
                                  updateEvent({ id: ev.id, status: e.target.value })
                                    .unwrap()
                                    .then(refetchEvents)
                                }
                                className={`px-2 py-1 rounded border text-[10px] font-bold ${st.badgeClass}`}
                              >
                                {Object.entries(EVENT_LIFECYCLE_STATUSES).map(([k, m]) => (
                                  <option key={k} value={k}>
                                    {m.labelBn}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${st.badgeClass}`}>
                                {st.labelBn}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedEventId(ev.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-rose-700 text-white text-[11px] font-bold"
                            >
                              <FolderKanban className="w-3 h-3" />
                              <span>{isBn ? 'ওয়ার্কস্পেস' : 'Manage'}</span>
                            </button>
                            {hasManagePerm && (
                              <button
                                type="button"
                                onClick={() => deleteEvent(ev.id).unwrap().then(refetchEvents)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMIN MONTHLY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black font-mono text-stone-900">{monthKey}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMonthKey((p) => shiftMonth(p, -1))}
                className="p-2 rounded-lg border border-stone-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMonthKey((p) => shiftMonth(p, 1))}
                className="p-2 rounded-lg border border-stone-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) =>
              cell.empty ? (
                <div key={cell.key} className="min-h-20 rounded-xl bg-stone-50" />
              ) : (
                <div key={cell.key} className="min-h-20 rounded-xl border border-stone-200 p-2 space-y-1">
                  <p className="text-xs font-bold text-stone-700">{cell.day}</p>
                  {cell.items.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className="block w-full text-left text-[10px] font-semibold px-1.5 py-1 rounded bg-rose-50 text-rose-800 truncate"
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* SPECIAL PROJECTS MANAGER */}
      {activeTab === 'projects' && hasManagePerm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          <form onSubmit={handleCreateProject} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-stone-900 text-sm">{isBn ? 'নতুন বিশেষ প্রকল্প' : 'New Special Project'}</h3>
            <select
              value={projForm.project_type}
              onChange={(e) => setProjForm({ ...projForm, project_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            >
              {SPECIAL_PROJECT_TRACKS.map((tr) => (
                <option key={tr.key} value={tr.key}>
                  {tr.labelBn} ({tr.labelEn})
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder={isBn ? 'প্রকল্পের শিরোনাম' : 'Project title'}
              value={projForm.title}
              onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <input
              type="text"
              placeholder={isBn ? 'ট্যাগলাইন' : 'Tagline'}
              value={projForm.tagline}
              onChange={(e) => setProjForm({ ...projForm, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <input
              type="text"
              placeholder={isBn ? 'ভৌগোলিক পরিধি (যেমন: ৬৪ জেলা)' : 'District scope'}
              value={projForm.district_scope}
              onChange={(e) => setProjForm({ ...projForm, district_scope: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <textarea
              required
              rows={3}
              placeholder={isBn ? 'প্রকল্পের বিবরণ...' : 'Description...'}
              value={projForm.description}
              onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-rose-700 text-white font-bold">
              {isBn ? 'প্রকল্প তৈরি করুন' : 'Save Project'}
            </button>
          </form>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {specialProjects.map((p) => {
              const tMeta = SPECIAL_PROJECT_TRACK_MAP[p.project_type] || SPECIAL_PROJECT_TRACK_MAP.education;
              return (
                <div key={p.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tMeta.badgeClass}`}>
                      {tMeta.labelBn}
                    </span>
                    <span className="font-bold text-stone-500">{p.events_count || 0} ইভেন্ট</span>
                  </div>
                  <p className="text-sm font-black text-stone-900">{p.title}</p>
                  {p.tagline && <p className="text-stone-600">{p.tagline}</p>}
                  <p className="text-[11px] text-stone-500">{p.district_scope}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGER */}
      {activeTab === 'categories' && hasManagePerm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          <form onSubmit={handleCreateCategory} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-stone-900 text-sm">{isBn ? 'নতুন ইভেন্ট ক্যাটাগরি' : 'Add Category'}</h3>
            <input
              type="text"
              required
              placeholder={isBn ? 'নাম (বাংলা)' : 'Bengali name'}
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <input
              type="text"
              placeholder={isBn ? 'নাম (ইংরেজি)' : 'English name'}
              value={catForm.name_en}
              onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300"
            />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-rose-700 text-white font-bold">
              {isBn ? 'সংরক্ষণ করুন' : 'Create Category'}
            </button>
          </form>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">{c.name}</p>
                  <p className="text-stone-500">{c.name_en} • {c.events_count || 0} events</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateCategory({ id: c.id, is_active: !c.is_active }).unwrap().then(refetchCategories)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 font-serif-bn">
                {isBn ? 'নতুন ইভেন্ট ও নিবন্ধন কনফিগারেশন' : 'Create New Event'}
              </h3>
              <button type="button" onClick={() => setShowEventModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder={isBn ? 'ইভেন্টের শিরোনাম *' : 'Event Title *'}
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300"
              />
              <textarea
                rows={2}
                placeholder={isBn ? 'সংক্ষিপ্ত সারসংক্ষেপ' : 'Summary'}
                value={eventForm.summary}
                onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300"
              />
              <textarea
                required
                rows={3}
                placeholder={isBn ? 'বিস্তারিত বিবরণ *' : 'Full Description *'}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                  className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
                >
                  {EVENT_TYPES.map((et) => (
                    <option key={et.key} value={et.key}>
                      {et.labelBn}
                    </option>
                  ))}
                </select>
                <select
                  value={eventForm.event_category_id}
                  onChange={(e) => setEventForm({ ...eventForm, event_category_id: e.target.value })}
                  className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
                >
                  <option value="">{isBn ? 'ক্যাটাগরি নির্বাচন' : 'Category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={eventForm.special_project_id}
                  onChange={(e) => setEventForm({ ...eventForm, special_project_id: e.target.value })}
                  className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
                >
                  <option value="">{isBn ? 'বিশেষ প্রকল্প (ঐচ্ছিক)' : 'Special Project'}</option>
                  {specialProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'ভেন্যু / স্থান *' : 'Location label *'}
                  value={eventForm.location_label}
                  onChange={(e) => setEventForm({ ...eventForm, location_label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300"
                />
                <input
                  type="text"
                  placeholder={isBn ? 'জেলা' : 'District'}
                  value={eventForm.district}
                  onChange={(e) => setEventForm({ ...eventForm, district: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300"
                />
                <input
                  type="number"
                  placeholder={isBn ? 'সর্বোচ্চ আসন (খালি = সীমাহীন)' : 'Capacity'}
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-600 mb-1">{isBn ? 'শুরুর তারিখ ও সময় *' : 'Starts At *'}</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.starts_at}
                    onChange={(e) => setEventForm({ ...eventForm, starts_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-600 mb-1">{isBn ? 'নিবন্ধনের শেষ সময়' : 'Registration Deadline'}</label>
                  <input
                    type="datetime-local"
                    value={eventForm.registration_deadline_at}
                    onChange={(e) => setEventForm({ ...eventForm, registration_deadline_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={eventForm.allow_waitlist}
                    onChange={(e) => setEventForm({ ...eventForm, allow_waitlist: e.target.checked })}
                  />
                  <span>Waitlist</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={eventForm.require_phone}
                    onChange={(e) => setEventForm({ ...eventForm, require_phone: e.target.checked })}
                  />
                  <span>Require Phone</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={eventForm.require_organization}
                    onChange={(e) => setEventForm({ ...eventForm, require_organization: e.target.checked })}
                  />
                  <span>Require Org</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={eventForm.is_competition}
                    onChange={(e) => setEventForm({ ...eventForm, is_competition: e.target.checked })}
                  />
                  <span>Competition</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={creatingEvent}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm"
              >
                {creatingEvent ? 'Creating...' : isBn ? 'ইভেন্ট সংরক্ষণ করুন' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEventsPage;


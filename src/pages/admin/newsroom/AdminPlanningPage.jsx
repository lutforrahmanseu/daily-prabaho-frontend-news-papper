import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetNewsroomCalendarQuery,
  useGetEditorialPlansQuery,
  useCreateEditorialPlanMutation,
  useGetReporterAvailabilitiesQuery,
  useUpsertReporterAvailabilityMutation
} from '../../../store/api/newsroomApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { MotionOverlay } from '../../../components/common/MotionPrimitives.jsx';
import {
  AVAILABILITY_STATUS_META,
  PLAN_SLOT_LABELS,
  SHIFT_LABELS,
  formatBnCount,
  formatDateBn
} from '../../../utils/newsroomHelpers.js';
import { CalendarDays, Plus, Trash2, Users, ClipboardList, X, Loader2 } from 'lucide-react';

function getWeekBounds(anchorDateStr) {
  const anchor = new Date(anchorDateStr || Date.now());
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + diffToMonday);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return { from: days[0], to: days[6], days };
}

export function AdminPlanningPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const currentUserId = authState?.user?.id || adminState?.currentUser?.id;
  const canManagePlans = hasEffectivePermission(authState, adminState, 'assignment.manage');

  const [tab, setTab] = useState('calendar'); // 'calendar' | 'plans' | 'availability'
  const [anchorDate, setAnchorDate] = useState(() => new Date().toISOString().slice(0, 10));
  const week = useMemo(() => getWeekBounds(anchorDate), [anchorDate]);

  const { data: calendarData, isLoading: isCalLoading } = useGetNewsroomCalendarQuery({
    from: week.from,
    to: week.to
  });
  const { data: plansData } = useGetEditorialPlansQuery();
  const { data: availabilityData } = useGetReporterAvailabilitiesQuery({
    from: week.from,
    to: week.to
  });

  const [createPlan, { isLoading: isSavingPlan }] = useCreateEditorialPlanMutation();
  const [upsertAvailability, { isLoading: isSavingAvail }] = useUpsertReporterAvailabilityMutation();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    plan_type: 'daily',
    plan_date: new Date().toISOString().slice(0, 10),
    title: '',
    focus_theme: '',
    summary: '',
    items: [{ slot: 'lead', title: '', notes: '' }]
  });

  const [availForm, setAvailForm] = useState({
    user_id: currentUserId ? String(currentUserId) : '',
    date: new Date().toISOString().slice(0, 10),
    shift: 'day',
    status: 'available',
    location: '',
    notes: ''
  });

  const staff = availabilityData?.staff || [];
  const slots = availabilityData?.slots || [];
  const plans = plansData?.items || [];

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      await createPlan({
        ...planForm,
        items: planForm.items.filter((i) => i.title.trim())
      }).unwrap();
      setPlanModalOpen(false);
      await sweetAlert.success('পরিকল্পনা সংরক্ষিত', 'সম্পাদকীয় পরিকল্পনা ও রানডাউন সংরক্ষণ করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'পরিকল্পনা সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    const targetUser = canManagePlans
      ? (availForm.user_id ? Number(availForm.user_id) : Number(currentUserId))
      : Number(currentUserId);
    try {
      await upsertAvailability({
        user_id: targetUser,
        date: availForm.date,
        shift: availForm.shift,
        status: availForm.status,
        location: availForm.location.trim() || null,
        notes: availForm.notes.trim() || null
      }).unwrap();
      await sweetAlert.success('প্রাপ্যতা হালনাগাদ', 'কর্মী প্রাপ্যতা সময়সূচী সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('অনুমতি/ত্রুটি', extractApiError(err, 'প্রাপ্যতা হালনাগাদ করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif-bn text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-rose-700" />
            <span>নিউজরুম পরিকল্পনা ও ক্যালেন্ডার</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            দৈনিক ও সাপ্তাহিক পরিকল্পনা, অ্যাসাইনমেন্ট ক্যালেন্ডার এবং রিপোর্টার প্রাপ্যতা ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
          />

          <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
            <button
              type="button"
              onClick={() => setTab('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'calendar' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
              }`}
            >
              সাপ্তাহিক ক্যালেন্ডার
            </button>
            <button
              type="button"
              onClick={() => setTab('plans')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'plans' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
              }`}
            >
              দৈনিক ও সাপ্তাহিক প্ল্যান
            </button>
            <button
              type="button"
              onClick={() => setTab('availability')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'availability' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
              }`}
            >
              রিপোর্টার প্রাপ্যতা
            </button>
          </div>

          {canManagePlans && (
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন পরিকল্পনা</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Editorial & Assignment Calendar */}
      {tab === 'calendar' && (
        isCalLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-rose-700" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
            {week.days.map((dayStr) => {
              const dayAssignments = (calendarData?.assignments || []).filter(
                (a) => a.planned_date === dayStr || (a.deadline_at && a.deadline_at.slice(0, 10) === dayStr)
              );
              const dayPlans = (calendarData?.plans || []).filter((p) => p.plan_date === dayStr);
              const dayAvail = (calendarData?.availabilities || []).filter((av) => av.date === dayStr);
              const dayNews = (calendarData?.news_events || []).filter(
                (n) => (n.scheduled_at && n.scheduled_at.slice(0, 10) === dayStr) || (n.embargo_until && n.embargo_until.slice(0, 10) === dayStr)
              );

              return (
                <div key={dayStr} className="bg-white rounded-xl border border-stone-200 p-3 space-y-2.5 min-h-[260px]">
                  <div className="pb-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900">{formatDateBn(dayStr)}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{dayStr}</p>
                  </div>

                  {dayPlans.map((p) => (
                    <div key={`plan-${p.id}`} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px]">
                      <span className="font-bold text-rose-800 block">{p.plan_type === 'weekly' ? 'সাপ্তাহিক' : 'দৈনিক'} পরিকল্পনা</span>
                      <p className="text-stone-800 font-semibold truncate">{p.title}</p>
                    </div>
                  ))}

                  {dayAssignments.map((a) => (
                    <Link
                      key={`asn-${a.id}`}
                      to={`/admin/newsroom/assignments/${a.id}`}
                      className="block p-2 rounded-lg bg-sky-50 border border-sky-200 text-[11px] hover:border-sky-400"
                    >
                      <span className="font-bold text-sky-900 line-clamp-2">{a.title}</span>
                      <span className="text-[10px] text-sky-700 block mt-0.5">{a.reporter_user?.name || 'অ্যাসাইনমেন্ট'}</span>
                    </Link>
                  ))}

                  {dayNews.map((n) => (
                    <div key={`news-${n.id}`} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px]">
                      <span className="font-bold text-amber-900 block">
                        {n.is_embargoed ? 'এমবার্গো' : 'নির্ধারিত প্রকাশ'}
                      </span>
                      <p className="text-stone-800 truncate">{n.title}</p>
                    </div>
                  ))}

                  {dayAvail.length > 0 && (
                    <div className="pt-1 border-t border-stone-100">
                      <span className="text-[10px] font-bold text-stone-500 block mb-1">
                        উপস্থিতি ({formatBnCount(dayAvail.length)}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dayAvail.map((av) => (
                          <span key={av.id} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                            {av.user?.name?.split(' ')[0]} ({AVAILABILITY_STATUS_META[av.status]?.labelBn})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab 2: Daily & Weekly Editorial Plans */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.length === 0 ? (
            <div className="lg:col-span-2 bg-white p-10 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
              কোনো সম্পাদকীয় পরিকল্পনা পাওয়া যায়নি।
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      plan.plan_type === 'weekly'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {plan.plan_type === 'weekly' ? 'সাপ্তাহিক পরিকল্পনা' : 'দৈনিক পরিকল্পনা'}
                    </span>
                    <h3 className="text-base font-bold font-serif-bn text-stone-900 mt-1">{plan.title}</h3>
                    <p className="text-xs text-stone-500">{formatDateBn(plan.plan_date)} • {plan.focus_theme || 'সাধারণ ডেস্ক'}</p>
                  </div>
                  <span className="text-[11px] font-bold text-stone-600">{formatBnCount(plan.items?.length || 0)}টি স্লট</span>
                </div>
                {plan.summary && <p className="text-xs text-stone-600">{plan.summary}</p>}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  {(plan.items || []).map((item) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-stone-50 text-xs flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-rose-700 mr-2">[{PLAN_SLOT_LABELS[item.slot] || item.slot}]</span>
                        <span className="font-semibold text-stone-800">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0">{item.assigned_user?.name || item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Reporter Availability */}
      {tab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Update Availability Form */}
          <form onSubmit={handleSaveAvailability} className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-700" />
              <span>প্রাপ্যতা নির্ধারণ ও হালনাগাদ</span>
            </h2>

            {canManagePlans && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">কর্মী নির্বাচন</label>
                <select
                  value={availForm.user_id}
                  onChange={(e) => setAvailForm({ ...availForm, user_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role_name || s.role})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ</label>
                <input
                  type="date"
                  value={availForm.date}
                  onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">শিফট</label>
                <select
                  value={availForm.shift}
                  onChange={(e) => setAvailForm({ ...availForm, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  {Object.entries(SHIFT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">অবস্থা</label>
              <select
                value={availForm.status}
                onChange={(e) => setAvailForm({ ...availForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                {Object.entries(AVAILABILITY_STATUS_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.labelBn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">অবস্থান / নোট</label>
              <input
                type="text"
                value={availForm.location}
                onChange={(e) => setAvailForm({ ...availForm, location: e.target.value })}
                placeholder="ঢাকা / মাঠ কভারেজ"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs mb-2"
              />
              <textarea
                rows={2}
                value={availForm.notes}
                onChange={(e) => setAvailForm({ ...availForm, notes: e.target.value })}
                placeholder="বিস্তারিত মন্তব্য..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingAvail}
              className="w-full py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              {isSavingAvail ? 'সংরক্ষণ হচ্ছে...' : 'প্রাপ্যতা সংরক্ষণ করুন'}
            </button>
          </form>

          {/* Roster Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-rose-700" />
                <span>সাপ্তাহিক রিপোর্টার প্রাপ্যতা তালিকা ({week.from} — {week.to})</span>
              </h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600">
                  <th className="py-2.5 px-4">কর্মীর নাম</th>
                  <th className="py-2.5 px-4">তারিখ ও শিফট</th>
                  <th className="py-2.5 px-4">অবস্থা</th>
                  <th className="py-2.5 px-4">অবস্থান ও নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-stone-400">এই সপ্তাহের প্রাপ্যতা রেকর্ড পাওয়া যায়নি।</td>
                  </tr>
                ) : (
                  slots.map((slot) => {
                    const meta = AVAILABILITY_STATUS_META[slot.status] || AVAILABILITY_STATUS_META.available;
                    return (
                      <tr key={slot.id} className="hover:bg-stone-50">
                        <td className="py-3 px-4 font-bold text-stone-900">{slot.user?.name || slot.reporter?.name}</td>
                        <td className="py-3 px-4 text-stone-600">
                          {slot.date} • {SHIFT_LABELS[slot.shift] || slot.shift}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                            {meta.labelBn}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500">
                          {slot.location || '-'} {slot.notes ? `(${slot.notes})` : ''}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {planModalOpen && (
        <MotionOverlay isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">নতুন সম্পাদকীয় পরিকল্পনা তৈরি করুন</h3>
              <button type="button" onClick={() => setPlanModalOpen(false)} className="p-1 text-stone-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSavePlan} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পরিকল্পনার ধরন</label>
                  <select
                    value={planForm.plan_type}
                    onChange={(e) => setPlanForm({ ...planForm, plan_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="daily">দৈনিক পরিকল্পনা (Daily)</option>
                    <option value="weekly">সাপ্তাহিক পরিকল্পনা (Weekly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={planForm.plan_date}
                    onChange={(e) => setPlanForm({ ...planForm, plan_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">শিরোনাম *</label>
                <input
                  type="text"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  required
                  placeholder="যেমন: দৈনিক মর্নিং মিটিং পরিকল্পনা"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">মূল ফোকাস থিম</label>
                <input
                  type="text"
                  value={planForm.focus_theme}
                  onChange={(e) => setPlanForm({ ...planForm, focus_theme: e.target.value })}
                  placeholder="অর্থনীতি, শিক্ষা ও নাগরিক সেবা"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">স্টোরি স্লট / রানডাউন আইটেম</label>
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, items: [...planForm.items, { slot: 'standard', title: '', notes: '' }] })}
                    className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    + স্লট যোগ করুন
                  </button>
                </div>
                {planForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={it.slot}
                      onChange={(e) => {
                        const next = [...planForm.items];
                        next[idx].slot = e.target.value;
                        setPlanForm({ ...planForm, items: next });
                      }}
                      className="col-span-4 px-2 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      {Object.entries(PLAN_SLOT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => {
                        const next = [...planForm.items];
                        next[idx].title = e.target.value;
                        setPlanForm({ ...planForm, items: next });
                      }}
                      placeholder="প্রতিবেদনের শিরোনাম..."
                      className="col-span-7 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, items: planForm.items.filter((_, i) => i !== idx) })}
                      className="col-span-1 text-stone-400 hover:text-rose-700 cursor-pointer flex justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button type="button" onClick={() => setPlanModalOpen(false)} className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold cursor-pointer">
                  বাতিল
                </button>
                <button type="submit" disabled={isSavingPlan} className="px-5 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer">
                  {isSavingPlan ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}
    </div>
  );
}

export default AdminPlanningPage;


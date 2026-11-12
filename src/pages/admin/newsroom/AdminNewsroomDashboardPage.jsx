import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetNewsroomDashboardQuery,
  useReleaseDueEmbargoesMutation
} from '../../../store/api/newsroomApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { EditorialReveal, MotionStaggerGrid, MotionStaggerItem } from '../../../components/common/MotionPrimitives.jsx';
import {
  ASSIGNMENT_PRIORITY_META,
  ASSIGNMENT_STATUS_META,
  AVAILABILITY_STATUS_META,
  CORRECTION_STATUS_META,
  PLAN_SLOT_LABELS,
  formatBnCount,
  formatDateTimeBn
} from '../../../utils/newsroomHelpers.js';
import {
  Briefcase,
  CalendarDays,
  Clock,
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  Users,
  Lock,
  ArrowRight,
  CheckCircle2,
  Database,
  RefreshCw,
  Loader2
} from 'lucide-react';

export function AdminNewsroomDashboardPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});

  const canManageAssignments = hasEffectivePermission(authState, adminState, 'assignment.manage');
  const canViewConfidential = hasEffectivePermission(authState, adminState, 'source.confidential');
  const canManageEmbargo = hasEffectivePermission(authState, adminState, 'embargo.manage');

  const { data, isLoading, refetch, isFetching } = useGetNewsroomDashboardQuery();
  const [releaseDueEmbargoes, { isLoading: isReleasing }] = useReleaseDueEmbargoesMutation();

  const metrics = data?.metrics || {};
  const upcomingAssignments = Array.isArray(data?.upcoming_assignments) ? data.upcoming_assignments : [];
  const todayPlan = data?.today_plan || null;
  const todayAvailability = Array.isArray(data?.today_availability) ? data.today_availability : [];
  const recentCorrections = Array.isArray(data?.recent_corrections) ? data.recent_corrections : [];
  const activeEmbargoes = Array.isArray(data?.active_embargoes) ? data.active_embargoes : [];

  const handleReleaseDue = async () => {
    try {
      const res = await releaseDueEmbargoes().unwrap();
      await sweetAlert.success(
        'এমবার্গো প্রক্রিয়াকরণ সম্পন্ন',
        `${formatBnCount(res?.released_count ?? 0)}টি মেয়াদোত্তীর্ণ অনুমোদিত এমবার্গো সংবাদ অবমুক্ত করা হয়েছে।`
      );
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'এমবার্গো প্রক্রিয়াকরণ ব্যর্থ হয়েছে।'));
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-stone-500 gap-2">
        <Loader2 className="w-7 h-7 animate-spin text-rose-700" />
        <p className="text-xs font-medium">নিউজরুম কমান্ড সেন্টার লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <EditorialReveal immediate className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 mb-2">
            নিউজরুম অপারেশন হাব (Phase 15)
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-bn text-stone-900">
            নিউজরুম ব্যবস্থাপনা ড্যাশবোর্ড
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            অ্যাসাইনমেন্ট ট্র্যাকিং, দৈনিক পরিকল্পনা, কর্মী প্রাপ্যতা, গোপনীয় উৎস নিরাপত্তা, সংশোধনী এবং এমবার্গো নিয়ন্ত্রণ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          {canManageEmbargo && (
            <button
              type="button"
              onClick={handleReleaseDue}
              disabled={isReleasing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>মেয়াদোত্তীর্ণ এমবার্গো মুক্তি</span>
            </button>
          )}

          <Link
            to="/admin/newsroom/assignments"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{canManageAssignments ? 'অ্যাসাইনমেন্ট বোর্ড' : 'আমার অ্যাসাইনমেন্ট'}</span>
          </Link>
        </div>
      </EditorialReveal>

      {/* KPI Metrics Grid */}
      <MotionStaggerGrid immediate className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MotionStaggerItem>
          <Link to="/admin/newsroom/assignments" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-rose-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">সক্রিয় অ্যাসাইনমেন্ট</span>
              <Briefcase className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{formatBnCount(metrics.active_assignments)}</p>
            <p className="text-[11px] text-stone-500 mt-1">জমা হয়েছে: {formatBnCount(metrics.submitted_assignments)}টি</p>
          </Link>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <Link to="/admin/newsroom/assignments" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-amber-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">সময়োত্তীর্ণ ডেডলাইন</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className={`text-2xl font-bold ${metrics.overdue_assignments > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
              {formatBnCount(metrics.overdue_assignments)}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">তাৎক্ষণিক ফলো-আপ প্রয়োজন</p>
          </Link>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <Link to="/admin/newsroom/planning" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">আজ উপলব্ধ কর্মী</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{formatBnCount(metrics.available_staff_today)}</p>
            <p className="text-[11px] text-stone-500 mt-1">অ্যাসাইনমেন্টে: {formatBnCount(metrics.on_assignment_today)} জন</p>
          </Link>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <Link to="/admin/newsroom/sources" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-blue-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">সংবাদ উৎস</span>
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{formatBnCount(metrics.sources_total)}</p>
            <p className="text-[11px] text-stone-500 mt-1">
              {canViewConfidential
                ? `গোপনীয় উৎস: ${formatBnCount(metrics.confidential_sources)}টি`
                : 'গোপনীয় উৎস সুরক্ষিত'}
            </p>
          </Link>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <Link to="/admin/newsroom/corrections" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-orange-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">অপেক্ষমাণ সংশোধনী</span>
              <FileWarning className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{formatBnCount(metrics.pending_corrections)}</p>
            <p className="text-[11px] text-stone-500 mt-1">সম্পাদকীয় অনুমোদনের অপেক্ষায়</p>
          </Link>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <Link to="/admin/newsroom/embargoes" className="block p-4 rounded-xl bg-white border border-stone-200 hover:border-rose-300 transition-colors shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold">সক্রিয় এমবার্গো</span>
              <Lock className="w-4 h-4 text-rose-700" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{formatBnCount(metrics.active_embargoes)}</p>
            <p className="text-[11px] text-stone-500 mt-1">
              {canManageEmbargo ? 'সময় নির্ধারিত ও লককৃত' : 'প্রবেশাধিকার সীমিত'}
            </p>
          </Link>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* Main Two Column Operations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 cols: Upcoming Assignments + Today's Plan */}
        <div className="xl:col-span-2 space-y-6">
          {/* Active & Upcoming Assignments */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-rose-700" />
                <h2 className="text-sm font-bold text-stone-900">চলমান অ্যাসাইনমেন্ট ও ডেডলাইন</h2>
              </div>
              <Link to="/admin/newsroom/assignments" className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1">
                <span>সব দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-stone-100">
              {upcomingAssignments.length === 0 ? (
                <p className="p-6 text-center text-xs text-stone-500">বর্তমানে কোনো সক্রিয় অ্যাসাইনমেন্ট নেই।</p>
              ) : (
                upcomingAssignments.map((item) => {
                  const priorityMeta = ASSIGNMENT_PRIORITY_META[item.priority] || ASSIGNMENT_PRIORITY_META.normal;
                  const statusMeta = ASSIGNMENT_STATUS_META[item.status] || ASSIGNMENT_STATUS_META.assigned;
                  return (
                    <Link
                      key={item.id}
                      to={`/admin/newsroom/assignments/${item.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityMeta.badgeClass}`}>
                            {priorityMeta.labelBn}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                            {statusMeta.labelBn}
                          </span>
                          {item.is_overdue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-700 text-white">
                              সময়োত্তীর্ণ
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-stone-900 font-serif-bn truncate">{item.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          প্রতিবেদক: {item.reporter_user?.name || 'অনির্ধারিত'} • ফটোগ্রাফার: {item.photographer?.name || 'নেই'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {formatDateTimeBn(item.deadline_at)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Editorial Plan Rundown */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-rose-700" />
                <h2 className="text-sm font-bold text-stone-900">আজকের দৈনিক নিউজরুম পরিকল্পনা</h2>
              </div>
              <Link to="/admin/newsroom/planning" className="text-xs font-bold text-rose-700 hover:underline">
                ক্যালেন্ডার ও পরিকল্পনা →
              </Link>
            </div>

            {!todayPlan ? (
              <div className="p-6 text-center text-xs text-stone-500">
                আজকের দিনের জন্য এখনো কোনো পরিকল্পনা তৈরি করা হয়নি।
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn">{todayPlan.title}</h3>
                    {todayPlan.focus_theme && (
                      <p className="text-xs text-rose-700 font-semibold mt-0.5">মূল ফোকাস: {todayPlan.focus_theme}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {formatBnCount(todayPlan.items?.length || 0)}টি স্লট
                  </span>
                </div>

                <div className="space-y-2">
                  {(todayPlan.items || []).map((slotItem) => (
                    <div key={slotItem.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                          {PLAN_SLOT_LABELS[slotItem.slot] || slotItem.slot}
                        </span>
                        <p className="text-xs font-bold text-stone-900 truncate">{slotItem.title}</p>
                        {slotItem.notes && <p className="text-[11px] text-stone-500 truncate">{slotItem.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-stone-600 block">
                          {slotItem.assigned_user?.name || 'ডেস্ক'}
                        </span>
                        <span className="text-[10px] text-stone-400">{slotItem.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Availability, Corrections & Embargoes / Security */}
        <div className="space-y-6">
          {/* Today Availability Snapshot */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>আজকের রিপোর্টার রোস্টার</span>
              </h2>
              <Link to="/admin/newsroom/planning" className="text-xs font-bold text-rose-700 hover:underline">
                হালনাগাদ
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {todayAvailability.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-3">আজকের প্রাপ্যতা তথ্য নেই</p>
              ) : (
                todayAvailability.map((slot) => {
                  const meta = AVAILABILITY_STATUS_META[slot.status] || AVAILABILITY_STATUS_META.available;
                  return (
                    <div key={slot.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-stone-50">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{slot.user?.name || slot.reporter?.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{slot.location || slot.shift}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeClass}`}>
                        {meta.labelBn}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Corrections */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-orange-600" />
                <span>সাম্প্রতিক সংশোধনী অনুরোধ</span>
              </h2>
              <Link to="/admin/newsroom/corrections" className="text-xs font-bold text-rose-700 hover:underline">
                ব্যবস্থাপনা
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {recentCorrections.length === 0 ? (
                <p className="p-4 text-xs text-stone-500 text-center">কোনো সংশোধনী অনুরোধ নেই</p>
              ) : (
                recentCorrections.slice(0, 4).map((corr) => {
                  const st = CORRECTION_STATUS_META[corr.status] || CORRECTION_STATUS_META.pending;
                  return (
                    <div key={corr.id} className="p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badgeClass}`}>
                          {st.labelBn}
                        </span>
                        <span className="text-[10px] text-stone-400">{corr.severity}</span>
                      </div>
                      <p className="font-bold text-stone-900 truncate">{corr.news?.title || `Article #${corr.news_id}`}</p>
                      <p className="text-[11px] text-stone-600 line-clamp-2">{corr.public_note || corr.corrected_text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Confidential Source Security Audit & Active Embargoes */}
          {canViewConfidential && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <span>গোপনীয় উৎস অ্যাক্সেস নিরাপত্তা</span>
              </div>
              <p className="text-[11px] text-stone-700">
                গত ৭ দিনে গোপনীয় উৎস সংক্রান্ত অডিট ইভেন্ট: <strong>{formatBnCount(metrics.confidential_audits_7d)}</strong>টি। শুধুমাত্র অনুমোদিত সম্পাদকবৃন্দ এগুলো দেখতে পাবেন।
              </p>
            </div>
          )}

          {canManageEmbargo && activeEmbargoes.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-700" />
                  <span>সক্রিয় এমবার্গো তালিকা</span>
                </h2>
                <Link to="/admin/newsroom/embargoes" className="text-xs font-bold text-rose-700 hover:underline">
                  কনসোল →
                </Link>
              </div>
              <div className="divide-y divide-stone-100">
                {activeEmbargoes.map((art) => (
                  <div key={art.id} className="p-3.5 text-xs">
                    <p className="font-bold text-stone-900 truncate">{art.title}</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      মুক্তির সময়: {formatDateTimeBn(art.embargo_until)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminNewsroomDashboardPage;

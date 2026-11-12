import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetReporterAvailabilitiesQuery,
  useTransitionAssignmentStatusMutation
} from '../../../store/api/newsroomApi.js';
import { useGetCategoriesQuery } from '../../../store/api/categoryApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { MotionOverlay } from '../../../components/common/MotionPrimitives.jsx';
import {
  ASSIGNMENT_PRIORITY_META,
  ASSIGNMENT_STATUS_META,
  AVAILABILITY_STATUS_META,
  formatBnCount,
  formatDateTimeBn
} from '../../../utils/newsroomHelpers.js';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  Eye,
  X,
  Briefcase,
  Loader2,
  Camera,
  UserCheck
} from 'lucide-react';

const BOARD_COLUMNS = [
  { key: 'assigned', title: 'নির্ধারিত' },
  { key: 'accepted', title: 'গৃহীত' },
  { key: 'in_progress', title: 'কাজ চলমান' },
  { key: 'submitted', title: 'জমা হয়েছে' },
  { key: 'revision_requested', title: 'সংশোধন প্রয়োজন' },
  { key: 'completed', title: 'সম্পন্ন' }
];

const INITIAL_FORM = {
  title: '',
  instructions: '',
  beat: '',
  location: '',
  priority: 'normal',
  reporter_user_id: '',
  photographer_id: '',
  category_id: '',
  planned_date: new Date().toISOString().slice(0, 10),
  deadline_at: ''
};

export function AdminAssignmentsPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const canManageAssignments = hasEffectivePermission(authState, adminState, 'assignment.manage');

  const [viewMode, setViewMode] = useState('board'); // 'board' | 'table'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: assignmentsData, isLoading } = useGetAssignmentsQuery({
    per_page: 50,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(priorityFilter ? { priority: priorityFilter } : {})
  });
  const { data: availabilityData } = useGetReporterAvailabilitiesQuery({ date: today });
  const { data: categories = [] } = useGetCategoriesQuery();

  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateAssignmentMutation();
  const [transitionAssignment] = useTransitionAssignmentStatusMutation();
  const [deleteAssignment] = useDeleteAssignmentMutation();

  const assignments = assignmentsData?.items || [];
  const staff = availabilityData?.staff || [];
  const slotsToday = availabilityData?.slots || [];

  const availabilityByUserId = useMemo(() => {
    const map = {};
    slotsToday.forEach((slot) => {
      map[slot.user_id] = slot;
    });
    return map;
  }, [slotsToday]);

  const reporters = useMemo(
    () => staff.filter((s) => ['reporter', 'news_editor', 'editor_in_chief'].includes(s.role)),
    [staff]
  );
  const photographers = useMemo(
    () => staff.filter((s) => s.role === 'photographer' || s.role === 'reporter'),
    [staff]
  );

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      instructions: item.instructions || '',
      beat: item.beat || '',
      location: item.location || '',
      priority: item.priority || 'normal',
      reporter_user_id: item.reporter_user_id ? String(item.reporter_user_id) : '',
      photographer_id: item.photographer_id ? String(item.photographer_id) : '',
      category_id: item.category_id ? String(item.category_id) : '',
      planned_date: item.planned_date || today,
      deadline_at: item.deadline_at ? item.deadline_at.slice(0, 16) : ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      await sweetAlert.warning('শিরোনাম আবশ্যক', 'অনুগ্রহ করে অ্যাসাইনমেন্টের শিরোনাম লিখুন।');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      instructions: formData.instructions.trim() || null,
      beat: formData.beat.trim() || null,
      location: formData.location.trim() || null,
      priority: formData.priority,
      reporter_user_id: formData.reporter_user_id ? Number(formData.reporter_user_id) : null,
      photographer_id: formData.photographer_id ? Number(formData.photographer_id) : null,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      planned_date: formData.planned_date || null,
      deadline_at: formData.deadline_at || null
    };

    try {
      if (editingItem) {
        await updateAssignment({ id: editingItem.id, ...payload }).unwrap();
        await sweetAlert.success('হালনাগাদ সম্পন্ন', 'অ্যাসাইনমেন্ট তথ্য সফলভাবে হালনাগাদ হয়েছে।');
      } else {
        await createAssignment(payload).unwrap();
        await sweetAlert.success('অ্যাসাইনমেন্ট তৈরি হয়েছে', 'নির্ধারিত রিপোর্টার ও ফটোগ্রাফারকে বিজ্ঞপ্তি পাঠানো হয়েছে।');
      }
      setModalOpen(false);
    } catch (err) {
      await sweetAlert.error('সংরক্ষণ ব্যর্থ', extractApiError(err, 'অ্যাসাইনমেন্ট সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleQuickStatus = async (item, nextStatus) => {
    try {
      await transitionAssignment({ id: item.id, status: nextStatus }).unwrap();
      await sweetAlert.success('অবস্থা পরিবর্তিত', `অ্যাসাইনমেন্ট "${ASSIGNMENT_STATUS_META[nextStatus]?.labelBn || nextStatus}" হিসেবে চিহ্নিত হয়েছে।`);
    } catch (err) {
      await sweetAlert.error('অনুমতি/ত্রুটি', extractApiError(err, 'অবস্থা পরিবর্তন করা যায়নি।'));
    }
  };

  const handleDelete = async (item) => {
    const confirm = await sweetAlert.confirmDelete('অ্যাসাইনমেন্ট মুছবেন?', `"${item.title}" তালিকা থেকে অপসারণ করা হবে।`);
    if (!confirm.isConfirmed) return;
    try {
      await deleteAssignment(item.id).unwrap();
      await sweetAlert.success('অপসারিত', 'অ্যাসাইনমেন্ট মুছে ফেলা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'মুছে ফেলা যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-serif-bn text-stone-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-rose-700" />
              <span>সংবাদ অ্যাসাইনমেন্ট বোর্ড</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              রিপোর্টার ও ফটোগ্রাফার নিয়োগ, ডেডলাইন ও জমা প্রবাহ ({formatBnCount(assignments.length)}টি অ্যাসাইনমেন্ট)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'board' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>বোর্ড</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>তালিকা</span>
              </button>
            </div>

            {canManageAssignments && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন অ্যাসাইনমেন্ট</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="শিরোনাম, বিট বা স্থান দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
          >
            <option value="">সকল অবস্থা</option>
            {Object.entries(ASSIGNMENT_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.labelBn}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
          >
            <option value="">সকল অগ্রাধিকার</option>
            {Object.entries(ASSIGNMENT_PRIORITY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.labelBn}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Assignment Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {BOARD_COLUMNS.map((col) => {
            const colItems = assignments.filter((a) => a.status === col.key);
            return (
              <div key={col.key} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col gap-3 min-h-[220px]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-800">{col.title}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700">
                    {formatBnCount(colItems.length)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colItems.length === 0 ? (
                    <p className="text-[11px] text-stone-400 text-center py-6">কোনো অ্যাসাইনমেন্ট নেই</p>
                  ) : (
                    colItems.map((item) => {
                      const pMeta = ASSIGNMENT_PRIORITY_META[item.priority] || ASSIGNMENT_PRIORITY_META.normal;
                      return (
                        <div key={item.id} className="bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pMeta.badgeClass}`}>
                              {pMeta.labelBn}
                            </span>
                            {item.is_overdue && (
                              <span className="text-[10px] font-bold text-rose-700">সময়োত্তীর্ণ</span>
                            )}
                          </div>

                          <Link
                            to={`/admin/newsroom/assignments/${item.id}`}
                            className="block text-sm font-bold font-serif-bn text-stone-900 hover:text-rose-700 line-clamp-2"
                          >
                            {item.title}
                          </Link>

                          <div className="text-[11px] text-stone-500 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{item.reporter_user?.name || 'অনির্ধারিত'}</span>
                            </div>
                            {item.photographer && (
                              <div className="flex items-center gap-1.5">
                                <Camera className="w-3 h-3 text-stone-400 shrink-0" />
                                <span className="truncate">{item.photographer.name}</span>
                              </div>
                            )}
                            {item.deadline_at && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                                <span>{formatDateTimeBn(item.deadline_at)}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <Link
                              to={`/admin/newsroom/assignments/${item.id}`}
                              className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>বিস্তারিত</span>
                            </Link>

                            <div className="flex items-center gap-1">
                              {item.status === 'assigned' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatus(item, 'accepted')}
                                  className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                                >
                                  গ্রহণ করুন
                                </button>
                              )}
                              {item.status === 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatus(item, 'in_progress')}
                                  className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
                                >
                                  শুরু করুন
                                </button>
                              )}
                              {canManageAssignments && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="p-1 text-stone-400 hover:text-stone-800 cursor-pointer"
                                  title="সম্পাদনা"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase">
                <th className="py-3 px-4">অ্যাসাইনমেন্ট</th>
                <th className="py-3 px-4">প্রতিবেদক ও ফটোগ্রাফার</th>
                <th className="py-3 px-4">অগ্রাধিকার</th>
                <th className="py-3 px-4">অবস্থা</th>
                <th className="py-3 px-4">ডেডলাইন</th>
                <th className="py-3 px-4 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {assignments.map((item) => {
                const pMeta = ASSIGNMENT_PRIORITY_META[item.priority] || ASSIGNMENT_PRIORITY_META.normal;
                const sMeta = ASSIGNMENT_STATUS_META[item.status] || ASSIGNMENT_STATUS_META.assigned;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 max-w-xs">
                      <Link to={`/admin/newsroom/assignments/${item.id}`} className="font-bold text-stone-900 hover:text-rose-700 block truncate">
                        {item.title}
                      </Link>
                      {item.location && (
                        <span className="text-[11px] text-stone-500 inline-flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-800">{item.reporter_user?.name || 'অনির্ধারিত'}</p>
                      <p className="text-[11px] text-stone-500">ছবি: {item.photographer?.name || 'নেই'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pMeta.badgeClass}`}>
                        {pMeta.labelBn}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sMeta.badgeClass}`}>
                        {sMeta.labelBn}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{formatDateTimeBn(item.deadline_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/admin/newsroom/assignments/${item.id}`}
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-rose-700"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManageAssignments && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-blue-700 cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Create / Edit Assignment Modal */}
      {modalOpen && (
        <MotionOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)} className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {editingItem ? 'অ্যাসাইনমেন্ট সম্পাদনা করুন' : 'নতুন সংবাদ অ্যাসাইনমেন্ট তৈরি করুন'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">অ্যাসাইনমেন্টের শিরোনাম *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="যেমন: জাতীয় বাজেট ২০২৬-২৭ অবকাঠামো খাত বিশ্লেষণ"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রতিবেদক (Reporter)</label>
                  <select
                    value={formData.reporter_user_id}
                    onChange={(e) => setFormData({ ...formData, reporter_user_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="">-- প্রতিবেদক নির্বাচন করুন --</option>
                    {reporters.map((r) => {
                      const av = availabilityByUserId[r.id];
                      const avLabel = av ? AVAILABILITY_STATUS_META[av.status]?.labelBn : 'তথ্য নেই';
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({avLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">আলোকচিত্রী (Photographer)</label>
                  <select
                    value={formData.photographer_id}
                    onChange={(e) => setFormData({ ...formData, photographer_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="">-- ফটোগ্রাফার নির্বাচন করুন --</option>
                    {photographers.map((p) => {
                      const av = availabilityByUserId[p.id];
                      const avLabel = av ? AVAILABILITY_STATUS_META[av.status]?.labelBn : 'তথ্য নেই';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({avLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিভাগ</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="">সাধারণ</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name || cat.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">অগ্রাধিকার</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    {Object.entries(ASSIGNMENT_PRIORITY_META).map(([k, m]) => (
                      <option key={k} value={k}>{m.labelBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিট / কভারেজ</label>
                  <input
                    type="text"
                    value={formData.beat}
                    onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                    placeholder="অর্থনীতি / কূটনীতি"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ঘটনাস্থল</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="সচিবালয়, ঢাকা"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পরিকল্পিত তারিখ</label>
                  <input
                    type="date"
                    value={formData.planned_date}
                    onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">জমা দেওয়ার শেষ সময়</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline_at}
                    onChange={(e) => setFormData({ ...formData, deadline_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">সম্পাদকীয় নির্দেশনা (Instructions)</label>
                <textarea
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="কার কার বক্তব্য নিতে হবে, কোন নথি যাচাই করতে হবে ও ছবির নির্দেশনা..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {(isCreating || isUpdating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'হালনাগাদ করুন' : 'অ্যাসাইনমেন্ট তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </MotionOverlay>
      )}
    </div>
  );
}

export default AdminAssignmentsPage;


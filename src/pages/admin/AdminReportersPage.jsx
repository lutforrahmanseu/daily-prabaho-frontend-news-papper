import React, { useState, useMemo } from 'react';
import {
  useGetReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation
} from '../../store/api/reporterApi.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { Plus, Edit3, Trash2, MapPin, Search, X, Loader2 } from 'lucide-react';

export function AdminReportersPage() {
  const { data: reportersResponse, isLoading } = useGetReportersQuery({ per_page: 100 });
  const [createReporterMutation, { isLoading: isCreating }] = useCreateReporterMutation();
  const [updateReporterMutation, { isLoading: isUpdating }] = useUpdateReporterMutation();
  const [deleteReporterMutation] = useDeleteReporterMutation();

  const reporters = useMemo(() => reportersResponse?.items || [], [reportersResponse]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReporter, setEditingReporter] = useState(null);
  const [name, setName] = useState('');
  const [roleBn, setRoleBn] = useState('বিশেষ প্রতিবেদক');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [beat, setBeat] = useState('');
  const [location, setLocation] = useState('ঢাকা ব্যুরো');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('active');

  const isSaving = isCreating || isUpdating;

  const filteredReporters = reporters.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roleBn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingReporter(null);
    setName('');
    setRoleBn('বিশেষ প্রতিবেদক');
    setEmail('');
    setPhone('');
    setBeat('');
    setLocation('ঢাকা ব্যুরো');
    setBio('');
    setStatus('active');
    setShowModal(true);
  };

  const openEditModal = (rep) => {
    setEditingReporter(rep);
    setName(rep.name || '');
    setRoleBn(rep.designation || rep.roleBn || rep.role || 'বিশেষ প্রতিবেদক');
    setEmail(rep.email || '');
    setPhone(rep.phone || '');
    setBeat(rep.beat || '');
    setLocation(rep.location || 'ঢাকা ব্যুরো');
    setBio(rep.bio || '');
    setStatus(rep.status === 'inactive' ? 'inactive' : 'active');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReporter(null);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      designation: roleBn.trim() || 'স্টাফ রিপোর্টার',
      beat: beat.trim() || null,
      location: location.trim() || 'ঢাকা ব্যুরো',
      bio: bio.trim() || 'দৈনিক বার্তা প্রবাহের নিউজরুম প্রতিবেদক।',
      status
    };

    try {
      if (editingReporter) {
        await updateReporterMutation({ id: editingReporter.id, ...payload }).unwrap();
        closeModal();
        await sweetAlert.success(
          'প্রতিবেদক হালনাগাদ হয়েছে!',
          `প্রতিবেদক "${payload.name}"-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে।`
        );
      } else {
        await createReporterMutation(payload).unwrap();
        closeModal();
        await sweetAlert.success(
          'নতুন প্রতিবেদক যুক্ত হয়েছেন!',
          `প্রতিবেদক "${payload.name}" সফলভাবে রোস্টারে যুক্ত হয়েছেন।`
        );
      }
    } catch (error) {
      await sweetAlert.error(
        editingReporter ? 'হালনাগাদ ব্যর্থ হয়েছে' : 'যুক্ত করতে ব্যর্থ হয়েছে',
        extractApiError(error, 'প্রতিবেদকের তথ্য সংরক্ষণ করা যায়নি।')
      );
    }
  };

  const handleDelete = async (rep) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      rep.name,
      `আপনি কি প্রতিবেদক "${rep.name}"-কে অপসারণ করতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteReporterMutation(rep.id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', `"${rep.name}" রোস্টার থেকে অপসারিত হয়েছেন।`);
    } catch (error) {
      await sweetAlert.error('অপসারণ ব্যর্থ হয়েছে', extractApiError(error, 'প্রতিবেদক অপসারণ করতে ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            প্রতিবেদক ও সাংবাদিক রোস্টার
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            বার্তা কক্ষের সাংবাদিক, বিশেষ প্রতিনিধি এবং আঞ্চলিক ব্যুরো প্রধানদের তালিকা
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন প্রতিবেদক যুক্ত করুন</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সাংবাদিকের নাম, পদবি বা ব্যুরো দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Reporters Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
          <span>সাংবাদিক তালিকা লোড হচ্ছে...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReporters.map((rep) => {
            const isActive = rep.status !== 'inactive';
            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <img
                      src={rep.avatar}
                      alt={rep.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-serif-bn text-base text-stone-900 truncate">
                        {rep.name}
                      </h3>
                      <p className="text-xs font-semibold text-rose-700 truncate">
                        {rep.designation || rep.roleBn || rep.role}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                        <span className="truncate">{rep.location || 'ঢাকা ব্যুরো'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-4">
                    {rep.bio}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                    <span className="text-stone-500 font-medium">মোট সংবাদ:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {toBengaliNumber(rep.articlesCount || 0)}টি
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-stone-500 font-medium">ইমেইল:</span>
                    <span className="font-mono text-[11px] text-stone-700 truncate max-w-[170px]">
                      {rep.email}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    />
                    {isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(rep)}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rep)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="অপসারণ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {editingReporter ? 'প্রতিবেদকের তথ্য সম্পাদনা' : 'নতুন সাংবাদিক যুক্ত করুন'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সাংবাদিকের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পদবী (Designation) *
                </label>
                <input
                  type="text"
                  required
                  value={roleBn}
                  onChange={(e) => setRoleBn(e.target.value)}
                  placeholder="যেমন: বিশেষ প্রতিবেদক (অপরাধ ও অনুসন্ধান)"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বিট (Beat)
                  </label>
                  <input
                    type="text"
                    value={beat}
                    onChange={(e) => setBeat(e.target.value)}
                    placeholder="যেমন: রাজনীতি / অর্থনীতি"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ব্যুরো ও অবস্থান
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="যেমন: চট্টগ্রাম ব্যুরো"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    অফিসিয়াল ইমেইল *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reporter@dailyprabaho.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সংক্ষিপ্ত পরিচিতি (Bio)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="সাংবাদিকের কাজের অভিজ্ঞতা ও ক্ষেত্র..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {editingReporter && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    অবস্থা (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingReporter ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportersPage;

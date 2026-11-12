import React, { useState, useMemo } from 'react';
import {
  useGetAuthorsQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation
} from '../../store/api/authorApi.js';
import { extractApiError, toCleanSlug } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { Plus, Edit3, Trash2, Search, ExternalLink, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminAuthorsPage() {
  const { data: authorsResponse, isLoading } = useGetAuthorsQuery({ per_page: 100 });
  const [createAuthorMutation, { isLoading: isCreating }] = useCreateAuthorMutation();
  const [updateAuthorMutation, { isLoading: isUpdating }] = useUpdateAuthorMutation();
  const [deleteAuthorMutation] = useDeleteAuthorMutation();

  const authors = useMemo(() => authorsResponse?.items || [], [authorsResponse]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('কলামিস্ট ও প্রাবন্ধিক');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);

  const isSaving = isCreating || isUpdating;

  const filteredAuthors = authors.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingAuthor(null);
    setName('');
    setNameEn('');
    setSlug('');
    setEmail('');
    setPhone('');
    setRole('কলামিস্ট ও প্রাবন্ধিক');
    setBio('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setNameEn(author.nameEn && author.nameEn !== author.name ? author.nameEn : '');
    setSlug(author.slug || '');
    setEmail(author.email || '');
    setPhone(author.phone || '');
    setRole(author.designation || author.role || 'কলামিস্ট ও প্রাবন্ধিক');
    setBio(author.bio || '');
    setIsActive(Boolean(author.isActive ?? author.is_active ?? true));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAuthor(null);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanSlug = toCleanSlug(slug || nameEn);

    const payload = {
      name: name.trim(),
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      designation: role.trim() || 'কলামিস্ট ও বিশ্লেষক',
      email: email.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || 'দৈনিক বার্তা প্রবাহের নিয়মিত কলাম লেখক ও চিন্তাবিদ।',
      is_active: isActive
    };

    try {
      if (editingAuthor) {
        await updateAuthorMutation({ id: editingAuthor.id, ...payload }).unwrap();
        closeModal();
        await sweetAlert.success(
          'কলামিস্ট হালনাগাদ হয়েছে!',
          `কলামিস্ট "${payload.name}"-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে।`
        );
      } else {
        await createAuthorMutation(payload).unwrap();
        closeModal();
        await sweetAlert.success(
          'নতুন কলামিস্ট যুক্ত হয়েছেন!',
          `কলামিস্ট "${payload.name}" সফলভাবে যুক্ত হয়েছেন।`
        );
      }
    } catch (error) {
      await sweetAlert.error(
        editingAuthor ? 'হালনাগাদ ব্যর্থ হয়েছে' : 'যুক্ত করতে ব্যর্থ হয়েছে',
        extractApiError(error, 'কলামিস্টের তথ্য সংরক্ষণ করা যায়নি।')
      );
    }
  };

  const handleDelete = async (author) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      author.name,
      `আপনি কি কলামিস্ট "${author.name}"-কে অপসারণ করতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteAuthorMutation(author.id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', `কলামিস্ট "${author.name}" অপসারিত হয়েছেন।`);
    } catch (error) {
      await sweetAlert.error('অপসারণ ব্যর্থ হয়েছে', extractApiError(error, 'কলামিস্ট অপসারণ করতে ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            কলামিস্ট, মতামত ও নিবন্ধকার
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            সম্পাদকীয় কলাম লেখক, শিক্ষাবিদ, অর্থনীতিবিদ ও অতিথি লেখকদের প্রোফাইল
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন লেখক যুক্ত করুন</span>
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
            placeholder="লেখকের নাম বা পদবি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
          <span>কলামিস্ট তালিকা লোড হচ্ছে...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAuthors.map((author) => {
            const active = author.isActive ?? author.is_active ?? true;
            return (
              <div
                key={author.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-stone-100 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold font-serif-bn text-lg text-stone-900 truncate">
                          {author.name}
                        </h3>
                        <p className="text-xs font-semibold text-rose-700 truncate">
                          {author.designation || author.role}
                        </p>
                        <p className="text-[11px] font-mono text-stone-400 mt-0.5 truncate">
                          /{author.slug}
                        </p>
                      </div>
                    </div>

                    {!active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                        নিষ্ক্রিয়
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                    {author.bio}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                    <span className="text-stone-500">মোট কলাম ও মতামত:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {toBengaliNumber(author.articlesCount || 0)}টি
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <Link
                    to={`/author/${author.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                  >
                    <span>পাবলিক লেখক পেজ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(author)}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(author)}
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
                {editingAuthor ? 'কলামিস্ট প্রোফাইল সম্পাদনা' : 'নতুন কলামিস্ট যুক্ত করুন'}
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
                  লেখকের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingAuthor && !slug && nameEn) {
                      setSlug(nameEn.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="যেমন: ড. মুহাম্মদ জাফর ইকবাল"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {!editingAuthor && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ইংরেজি নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => {
                      setNameEn(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }
                    }}
                    placeholder="e.g. Dr. Muhammed Zafar Iqbal"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ইউআরএল স্লাগ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="zafar-iqbal"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পরিচিতি / ডেজিগনেশন
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="যেমন: অর্থনীতিবিদ ও গবেষক"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ইমেইল (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="author@dailyprabaho.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ফোন (ঐচ্ছিক)
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
                  সংক্ষিপ্ত বায়ো
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="লেখকের একাডেমিক ও গবেষণা পরিচিতি..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="authorActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-rose-700 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="authorActiveCheck" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  সক্রিয় লেখক প্রোফাইল হিসেবে প্রদর্শন করুন
                </label>
              </div>

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
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingAuthor ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAuthorsPage;

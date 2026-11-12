import React, { useState, useMemo } from 'react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../../store/api/categoryApi.js';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { extractApiError, toCleanSlug } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  ExternalLink,
  X,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminCategoriesPage() {
  const { data: rawCategories = [], isLoading } = useGetCategoriesQuery({ tree: true });
  const { data: adminNewsData } = useGetAdminNewsListQuery({ per_page: 100 });
  const [createCategoryMutation, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategoryMutation, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategoryMutation] = useDeleteCategoryMutation();

  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories.filter((c) => !c.parentId && !c.parent_id) : []),
    [rawCategories]
  );
  const articles = useMemo(() => adminNewsData?.items || [], [adminNewsData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catColor, setCatColor] = useState('#b91c1c');
  const [catOrder, setCatOrder] = useState(0);
  const [catIsActive, setCatIsActive] = useState(true);
  const [newSubcats, setNewSubcats] = useState('');

  const isSaving = isCreating || isUpdating;

  // Compute live article counts per category
  const getCategoryCount = (cat) => {
    const matched = articles.filter((a) => a.category === cat.slug).length;
    return matched || cat.newsCount || cat.news_count || 0;
  };

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatSlug('');
    setCatDescription('');
    setCatColor('#b91c1c');
    setCatOrder(categories.length);
    setCatIsActive(true);
    setNewSubcats('');
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatNameEn(cat.nameEn && cat.nameEn !== cat.name ? cat.nameEn : '');
    setCatSlug(cat.slug || '');
    setCatDescription(cat.description || '');
    setCatColor(cat.color || '#b91c1c');
    setCatOrder(Number(cat.order ?? 0));
    setCatIsActive(Boolean(cat.isActive ?? cat.is_active ?? true));
    setNewSubcats('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const createSubcategories = async (parentId, subcatNames) => {
    if (!parentId || subcatNames.length === 0) return;
    await Promise.allSettled(
      subcatNames.map((subName) =>
        createCategoryMutation({
          name: subName,
          parent_id: parentId,
          is_active: true
        }).unwrap()
      )
    );
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const cleanSlug = toCleanSlug(catSlug || catNameEn);
    const subcatNames = newSubcats
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: catName.trim(),
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      description: catDescription.trim() || `${catName.trim()} সম্পর্কিত সর্বশেষ সংবাদ ও বিশ্লেষণ`,
      order: Number(catOrder) || 0,
      is_active: catIsActive
    };

    try {
      if (editingCategory) {
        await updateCategoryMutation({ id: editingCategory.id, ...payload }).unwrap();
        await createSubcategories(editingCategory.id, subcatNames);

        closeModal();
        await sweetAlert.success(
          'বিভাগ হালনাগাদ হয়েছে!',
          `"${payload.name}" বিভাগের তথ্য সফলভাবে সংরক্ষিত হয়েছে।`
        );
      } else {
        const createdParent = await createCategoryMutation(payload).unwrap();
        await createSubcategories(createdParent?.id, subcatNames);

        closeModal();
        await sweetAlert.success(
          'নতুন বিভাগ তৈরি হয়েছে!',
          `"${payload.name}" বিভাগটি সফলভাবে যুক্ত হয়েছে।`
        );
      }
    } catch (error) {
      await sweetAlert.error(
        editingCategory ? 'হালনাগাদ ব্যর্থ হয়েছে' : 'তৈরি করতে ব্যর্থ হয়েছে',
        extractApiError(error, 'বিভাগ সংরক্ষণ করতে সমস্যা হয়েছে।')
      );
    }
  };

  const handleDelete = async (cat) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      cat.name,
      `আপনি কি "${cat.name}" বিভাগটি স্থায়ীভাবে মুছে ফেলতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteCategoryMutation(cat.id || cat.slug).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', `"${cat.name}" বিভাগটি সফলভাবে মুছে ফেলা হয়েছে।`);
    } catch (error) {
      await sweetAlert.error('মুছে ফেলা যায়নি', extractApiError(error, 'বিভাগটি অপসারণ করতে ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            সংবাদ বিভাগ ও উপ-বিভাগ (Categories)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            প্রধান নেভিগেশন মেনু, আর্কাইভ ফিল্টার এবং বিভাগ-ভিত্তিক সংবাদ বিন্যাস নিয়ন্ত্রণ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিভাগ যোগ করুন</span>
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
            placeholder="বিভাগের নাম বা স্লাগ দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
          <span>বিভাগ তালিকা লোড হচ্ছে...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = getCategoryCount(cat);
            const active = cat.isActive ?? cat.is_active ?? true;

            return (
              <div
                key={cat.id || cat.slug}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full ring-2 ring-stone-200 shrink-0"
                        style={{ backgroundColor: cat.color || '#b91c1c' }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-base font-serif-bn text-stone-900 truncate">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-stone-400 font-mono font-medium truncate">
                          {cat.nameEn} • /{cat.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          নিষ্ক্রিয়
                        </span>
                      )}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                        {toBengaliNumber(count)} সংবাদ
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-4">
                    {cat.description || `${cat.name} বিষয়ক সম্পাদকীয় ও বিশেষ সংবাদ কভারেজ।`}
                  </p>

                  {/* Subcategories */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-stone-100">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        উপ-বিভাগ সমূহ ({toBengaliNumber(cat.subcategories.length)})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map((sub, i) => (
                          <span
                            key={sub.id || i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-600 font-medium"
                          >
                            {sub.name || sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <Link
                    to={`/category/${cat.slug}`}
                    target="_blank"
                    className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>পাবলিক পেজ</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="অপসারণ করুন"
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

      {/* Create / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {editingCategory ? 'বিভাগ সম্পাদনা করুন' : 'নতুন বিভাগ যুক্ত করুন'}
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
                  বিভাগের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="যেমন: পরিবেশ ও জলবায়ু"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ইংরেজি নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={catNameEn}
                    onChange={(e) => {
                      setCatNameEn(e.target.value);
                      if (!catSlug) {
                        setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }
                    }}
                    placeholder="e.g. Environment & Climate"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ইউআরএল স্লাগ (Slug - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="environment"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="বিভাগের সংক্ষিপ্ত সম্পাদকীয় বিবরণ..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ক্রম (Order)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ব্র্যান্ড কালার
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-10 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-stone-600">{catColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {editingCategory ? 'নতুন উপ-বিভাগ যোগ করুন (কমা দিয়ে আলাদা করুন)' : 'উপ-বিভাগ সমূহ (কমা দিয়ে আলাদা করুন)'}
                </label>
                <input
                  type="text"
                  value={newSubcats}
                  onChange={(e) => setNewSubcats(e.target.value)}
                  placeholder="বনভূমি, আবহাওয়া, নদীদূষণ"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActiveCheck"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-rose-700 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="catActiveCheck" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  সক্রিয় বিভাগ হিসেবে প্রদর্শন করুন
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
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingCategory ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesPage;

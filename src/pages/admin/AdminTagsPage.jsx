import React, { useState, useMemo } from 'react';
import {
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation
} from '../../store/api/tagApi.js';
import { extractApiError, toCleanSlug } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Tag as TagIcon,
  Plus,
  Edit3,
  Trash2,
  Search,
  ExternalLink,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table.jsx';

export function AdminTagsPage() {
  const { data: tagsResponse, isLoading } = useGetTagsQuery({ per_page: 100 });
  const [createTagMutation, { isLoading: isCreating }] = useCreateTagMutation();
  const [updateTagMutation, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTagMutation] = useDeleteTagMutation();

  const tags = useMemo(() => tagsResponse?.items || [], [tagsResponse]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagNameEn, setTagNameEn] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [isTrending, setIsTrending] = useState(false);

  const isSaving = isCreating || isUpdating;

  const filteredTags = tags.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingTag(null);
    setTagName('');
    setTagNameEn('');
    setTagSlug('');
    setTagDescription('');
    setIsTrending(false);
    setShowModal(true);
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name || '');
    setTagNameEn(tag.nameEn && tag.nameEn !== tag.name ? tag.nameEn : '');
    setTagSlug(tag.slug || '');
    setTagDescription(tag.description || '');
    setIsTrending(Boolean(tag.trending));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const cleanSlug = toCleanSlug(tagSlug || tagNameEn);
    const descriptionValue =
      tagDescription.trim() || (tagNameEn.trim() ? `${tagNameEn.trim()} সংক্রান্ত ট্যাগ` : undefined);

    const payload = {
      name: tagName.trim(),
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      ...(descriptionValue !== undefined ? { description: descriptionValue } : {})
    };

    try {
      if (editingTag) {
        await updateTagMutation({ id: editingTag.id, ...payload }).unwrap();
        closeModal();
        await sweetAlert.success('ট্যাগ হালনাগাদ হয়েছে!', `"#${payload.name}" ট্যাগটি সফলভাবে সংরক্ষিত হয়েছে।`);
      } else {
        await createTagMutation(payload).unwrap();
        closeModal();
        await sweetAlert.success('নতুন ট্যাগ যুক্ত হয়েছে!', `"#${payload.name}" ট্যাগটি সফলভাবে যুক্ত হয়েছে।`);
      }
    } catch (error) {
      await sweetAlert.error(
        editingTag ? 'হালনাগাদ ব্যর্থ হয়েছে' : 'তৈরি করতে ব্যর্থ হয়েছে',
        extractApiError(error, 'ট্যাগ সংরক্ষণ করতে সমস্যা হয়েছে।')
      );
    }
  };

  const handleDelete = async (tag) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      `#${tag.name}`,
      `আপনি কি "#${tag.name}" ট্যাগটি অপসারণ করতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteTagMutation(tag.id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', `"#${tag.name}" ট্যাগটি সফলভাবে মুছে ফেলা হয়েছে।`);
    } catch (error) {
      await sweetAlert.error('মুছে ফেলা যায়নি', extractApiError(error, 'ট্যাগটি অপসারণ করতে ব্যর্থ হয়েছে।'));
    }
  };

  const columns = [
    {
      header: 'ট্যাগ নাম (বাংলা)',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <TagIcon className="w-3.5 h-3.5 text-rose-700" />
          <span className="font-bold text-stone-900 font-serif-bn text-sm">
            #{row.name}
          </span>
          {row.trending && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold font-mono">
              <Sparkles className="w-2.5 h-2.5" />
              <span>ট্রেন্ডিং</span>
            </span>
          )}
        </div>
      )
    },
    {
      header: 'ইংরেজি নাম ও স্লাগ',
      accessor: 'slug',
      render: (row) => (
        <span className="font-mono text-xs text-stone-500">
          {row.nameEn} (/{row.slug})
        </span>
      )
    },
    {
      header: 'ব্যবহৃত সংবাদ সংখ্যা',
      accessor: 'count',
      render: (row) => (
        <span className="font-mono font-bold text-stone-800 text-xs">
          {toBengaliNumber(row.count || 0)}টি সংবাদ
        </span>
      )
    },
    {
      header: 'অ্যাকশন',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/tag/${row.slug}`}
            target="_blank"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="পাবলিক পেজ"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="সম্পাদনা করুন"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="অপসারণ করুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            কীওয়ার্ড ও ট্যাগ ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            ট্রেন্ডিং সংবাদ ট্যাগ, এসইও ইনডেক্সিং এবং সম্পর্কিত সংবাদের কি-ওয়ার্ডসমূহ
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ট্যাগ যোগ করুন</span>
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
            placeholder="ট্যাগের নাম বা স্লাগ দিয়ে অনুসন্ধান করুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
          <span>ট্যাগ তালিকা লোড হচ্ছে...</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredTags}
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {editingTag ? 'ট্যাগ সম্পাদনা করুন' : 'নতুন ট্যাগ যোগ করুন'}
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
                  ট্যাগের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="যেমন: পদ্মা সেতু"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {!editingTag && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ইংরেজি নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={tagNameEn}
                    onChange={(e) => {
                      setTagNameEn(e.target.value);
                      if (!tagSlug) {
                        setTagSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }
                    }}
                    placeholder="e.g. Padma Bridge"
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
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="padma-bridge"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  placeholder="ট্যাগ বিষয়ক সংক্ষিপ্ত বর্ণনা..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trendingCheck"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="rounded border-stone-300 text-rose-700 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="trendingCheck" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  হোমপেজে ট্রেন্ডিং ট্যাগ হিসেবে প্রদর্শন করুন
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
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingTag ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTagsPage;

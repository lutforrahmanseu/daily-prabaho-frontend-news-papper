import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowDown, ArrowUp, Camera, Edit3, Eye, Plus, Save, Trash2, X } from 'lucide-react';
import {
  useCreatePhotoCollectionMutation,
  useDeletePhotoCollectionMutation,
  useGetAdminPhotoCollectionsQuery,
  useTransitionPhotoCollectionMutation,
  useUpdatePhotoCollectionMutation
} from '../../../store/api/multimediaApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import { AccessibleSlideshowModal } from '../../../components/multimedia/MultimediaWidgets.jsx';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import sweetAlert from '../../../utils/sweetAlert.js';

const EMPTY_SLIDE = { media_id: '', image_url: '', title: '', caption: '', credit: '', location: '' };

export function AdminPhotoCollectionsPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');
  const canDelete = hasEffectivePermission(authState, adminState, 'multimedia.delete');

  const { data: res, isLoading } = useGetAdminPhotoCollectionsQuery({ per_page: 40 });
  const { data: mediaRes } = useGetMediaListQuery({ media_type: 'image', per_page: 60 });
  const [createCol, { isLoading: isCreating }] = useCreatePhotoCollectionMutation();
  const [updateCol, { isLoading: isUpdating }] = useUpdatePhotoCollectionMutation();
  const [deleteCol] = useDeletePhotoCollectionMutation();
  const [transitionCol] = useTransitionPhotoCollectionMutation();

  const collections = res?.items || [];
  const imageAssets = useMemo(() => (mediaRes?.items || []).filter((m) => m.type === 'image'), [mediaRes]);

  const [modalOpen, setModalOpen] = useState(false);
  const [previewCol, setPreviewCol] = useState(null);
  const [form, setForm] = useState({
    id: null,
    collection_type: 'gallery',
    title: '',
    description: '',
    location: '',
    story_date: '',
    cover_image: '',
    status: 'draft',
    items: [{ ...EMPTY_SLIDE }]
  });

  const openNew = () => {
    setForm({
      id: null,
      collection_type: 'gallery',
      title: '',
      description: '',
      location: '',
      story_date: '',
      cover_image: '',
      status: 'draft',
      items: [{ ...EMPTY_SLIDE }]
    });
    setModalOpen(true);
  };

  const openEdit = (col) => {
    setForm({
      id: col.id,
      collection_type: col.collection_type || 'gallery',
      title: col.title || '',
      description: col.description || '',
      location: col.location || '',
      story_date: col.story_date || '',
      cover_image: col.cover_image || '',
      status: col.status || 'draft',
      items:
        Array.isArray(col.items) && col.items.length > 0
          ? col.items.map((it) => ({
              media_id: it.media_id ? String(it.media_id) : '',
              image_url: it.image_url || '',
              title: it.title || '',
              caption: it.caption || '',
              credit: it.credit || '',
              location: it.location || ''
            }))
          : [{ ...EMPTY_SLIDE }]
    });
    setModalOpen(true);
  };

  const moveSlide = (index, direction) => {
    const next = [...form.items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, items: next });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanItems = form.items
      .filter((s) => s.image_url.trim())
      .map((s, idx) => ({
        media_id: s.media_id ? Number(s.media_id) : null,
        image_url: s.image_url.trim(),
        title: s.title.trim() || null,
        caption: s.caption.trim() || null,
        credit: s.credit.trim() || null,
        location: s.location.trim() || null,
        sort_order: idx + 1
      }));

    const payload = {
      collection_type: form.collection_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      story_date: form.story_date || null,
      cover_image: form.cover_image.trim() || (cleanItems[0]?.image_url ?? null),
      status: canPublish ? form.status : form.status === 'submitted' ? 'submitted' : 'draft',
      items: cleanItems
    };

    try {
      if (form.id) {
        await updateCol({ id: form.id, ...payload }).unwrap();
        await sweetAlert.success('হালনাগাদ হয়েছে!', 'ফটো গ্যালারি ও স্লাইড বিন্যাস সংরক্ষিত হয়েছে।');
      } else {
        await createCol(payload).unwrap();
        await sweetAlert.success('তৈরি হয়েছে!', 'নতুন ফটো গ্যালারি/স্টোরি যুক্ত হয়েছে।');
      }
      setModalOpen(false);
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'সংরক্ষণ ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            ফটো গ্যালারি ও ফটো স্টোরি সিএমএস
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            একাধিক ছবি, ক্যাপশন, ফটো ক্রেডিট, স্লাইড ক্রমবিন্যাস ও স্লাইডশো মোড প্রিভিউ
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openNew}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন গ্যালারি / ফটো স্টোরি</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => (
            <div key={col.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="relative aspect-video bg-stone-900 overflow-hidden">
                  <img
                    src={col.cover_image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'}
                    alt={col.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-bold">
                    {col.collection_type === 'photo_story' ? 'ফটো স্টোরি' : 'ফটো গ্যালারি'}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <MultimediaStatusBadge status={col.status} />
                    <span className="text-[11px] font-bold text-stone-500">
                      {toBengaliNumber(col.items?.length || col.items_count || 0)}টি ছবি
                    </span>
                  </div>
                  <h2 className="text-base font-bold font-serif-bn text-stone-900">{col.title}</h2>
                  {col.location && <p className="text-[11px] text-stone-500">স্থান: {col.location}</p>}
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewCol(col)}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                    title="স্লাইডশো প্রিভিউ"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => openEdit(col)}
                      className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <WorkflowActionButtons
                  status={col.status}
                  canCreate={canCreate}
                  canPublish={canPublish}
                  canDelete={canDelete}
                  publicUrl={`/multimedia/galleries/${col.slug}`}
                  onTransition={(act) => transitionCol({ id: col.id, action: act })}
                  onDelete={async () => {
                    const { isConfirmed } = await sweetAlert.confirmDelete(col.title);
                    if (isConfirmed) await deleteCol(col.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black font-serif-bn text-stone-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-rose-700" />
                <span>{form.id ? 'গ্যালারি সম্পাদনা' : 'নতুন ফটো গ্যালারি / স্টোরি'}</span>
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={form.collection_type}
                  onChange={(e) => setForm({ ...form, collection_type: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl bg-white font-bold"
                >
                  <option value="gallery">ফটো গ্যালারি (Photo Gallery)</option>
                  <option value="photo_story">ফটো স্টোরি (Photo Story)</option>
                </select>
                <input
                  type="text"
                  placeholder="অবস্থান (যেমন: সুন্দরবন)"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="date"
                  value={form.story_date}
                  onChange={(e) => setForm({ ...form, story_date: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <input
                type="text"
                required
                placeholder="গ্যালারি বা ফটো স্টোরির শিরোনাম *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
              />

              <textarea
                rows={2}
                placeholder="সম্পাদকীয় ভূমিকা / বিবরণ"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />

              <div className="space-y-3 border-t border-stone-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">ছবিসমূহ ও ক্রমবিন্যাস (Ordering)</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, items: [...form.items, { ...EMPTY_SLIDE }] })}
                    className="px-3 py-1 rounded-lg bg-stone-900 text-white font-bold cursor-pointer"
                  >
                    + ছবি যোগ করুন
                  </button>
                </div>

                {form.items.map((slide, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">স্লাইড #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveSlide(idx, -1)} className="p-1 rounded bg-white border border-stone-200 cursor-pointer">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => moveSlide(idx, 1)} className="p-1 rounded bg-white border border-stone-200 cursor-pointer">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                          className="p-1 rounded bg-rose-50 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={slide.media_id}
                        onChange={(e) => {
                          const found = imageAssets.find((m) => String(m.id) === e.target.value);
                          const next = [...form.items];
                          next[idx] = {
                            ...next[idx],
                            media_id: e.target.value,
                            image_url: found ? found.url : next[idx].image_url,
                            credit: found?.credit || next[idx].credit
                          };
                          setForm({ ...form, items: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      >
                        <option value="">মিডিয়া লাইব্রেরি থেকে বাছাই করুন</option>
                        {imageAssets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="ছবির URL *"
                        value={slide.image_url}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], image_url: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="স্লাইড শিরোনাম"
                        value={slide.title}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="ক্যাপশন"
                        value={slide.caption}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], caption: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="ফটো ক্রেডিট"
                        value={slide.credit}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], credit: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="draft">খসড়া (Draft)</option>
                  <option value="submitted">জমা (Submitted)</option>
                  {canPublish && <option value="published">প্রকাশিত (Published)</option>}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-stone-200 font-bold cursor-pointer">
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <AccessibleSlideshowModal
        items={previewCol?.items || []}
        startIndex={0}
        isOpen={Boolean(previewCol)}
        title={previewCol?.title || ''}
        onClose={() => setPreviewCol(null)}
      />
    </div>
  );
}

export default AdminPhotoCollectionsPage;


import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Film,
  Mic,
  BarChart2,
  Share2,
  Camera,
  Headphones,
  ListVideo,
  Clock,
  BookOpen,
  Plus,
  Edit3,
  X,
  Save,
  Trash2
} from 'lucide-react';
import {
  useCreateMultimediaItemMutation,
  useDeleteMultimediaItemMutation,
  useGetAdminMultimediaItemsQuery,
  useTransitionMultimediaItemMutation,
  useUpdateMultimediaItemMutation
} from '../../../store/api/multimediaApi.js';
import { useGetCategoriesQuery } from '../../../store/api/categoryApi.js';
import { useGetReportersQuery } from '../../../store/api/reporterApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import {
  formatDurationLabel,
  getMultimediaItemTypeMeta,
  parseSafeSocialEmbedUrl
} from '../../../utils/multimediaHelpers.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import sweetAlert from '../../../utils/sweetAlert.js';

const ITEM_TABS = [
  { id: 'all', label: 'সকল আইটেম', icon: Film },
  { id: 'video', label: 'ভিডিও সংবাদ', icon: Film },
  { id: 'audio', label: 'অডিও সংবাদ', icon: Mic },
  { id: 'infographic', label: 'ইনফোগ্রাফিক', icon: BarChart2 },
  { id: 'social_embed', label: 'সোশ্যাল পোস্ট', icon: Share2 }
];

const QUICK_MODULES = [
  { to: '/admin/multimedia/galleries', label: 'ফটো গ্যালারি ও স্টোরি', icon: Camera },
  { to: '/admin/multimedia/podcasts', label: 'পডকাস্ট ও পর্ব', icon: Headphones },
  { to: '/admin/multimedia/playlists', label: 'ভিডিও প্লেলিস্ট', icon: ListVideo },
  { to: '/admin/multimedia/timelines', label: 'ইন্টারঅ্যাক্টিভ টাইমলাইন', icon: Clock },
  { to: '/admin/multimedia/stories', label: 'স্টোরিটেলিং বিল্ডার', icon: BookOpen }
];

const INITIAL_FORM = {
  id: null,
  item_type: 'video',
  title: '',
  summary: '',
  body: '',
  status: 'draft',
  is_featured: false,
  category_id: '',
  reporter_id: '',
  media_id: '',
  media_url: '',
  thumbnail_media_id: '',
  thumbnail_url: '',
  duration_seconds: '',
  duration_label: '',
  transcript: '',
  platform: 'x',
  embed_author_name: '',
  embed_author_handle: '',
  highlight_value: '',
  highlight_label: '',
  source: '',
  bars: [{ label: '', value: '', max: 100, unit: '%', color: '#be123c' }]
};

export function AdminMultimediaStudioPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');
  const canDelete = hasEffectivePermission(authState, adminState, 'multimedia.delete');

  const [typeTab, setTypeTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const { data: itemsRes, isLoading } = useGetAdminMultimediaItemsQuery({
    item_type: typeTab !== 'all' ? typeTab : undefined,
    per_page: 50
  });
  const { data: categoriesRes } = useGetCategoriesQuery();
  const { data: reportersRes } = useGetReportersQuery({ per_page: 80 });
  const { data: mediaRes } = useGetMediaListQuery({ per_page: 60 });

  const [createItem, { isLoading: isCreating }] = useCreateMultimediaItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateMultimediaItemMutation();
  const [deleteItem] = useDeleteMultimediaItemMutation();
  const [transitionItem] = useTransitionMultimediaItemMutation();

  const items = itemsRes?.items || [];
  const categories = categoriesRes?.items || categoriesRes?.data || (Array.isArray(categoriesRes) ? categoriesRes : []);
  const reporters = reportersRes?.items || [];
  const mediaAssets = mediaRes?.items || [];

  const videoOrAudioMedia = useMemo(
    () =>
      mediaAssets.filter((m) =>
        form.item_type === 'audio' ? m.type === 'audio' : m.type === 'video'
      ),
    [mediaAssets, form.item_type]
  );
  const imageMedia = useMemo(() => mediaAssets.filter((m) => m.type === 'image'), [mediaAssets]);

  const openCreateModal = (defaultType = 'video') => {
    setForm({ ...INITIAL_FORM, item_type: defaultType === 'all' ? 'video' : defaultType });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    const meta = item.metadata || {};
    setForm({
      id: item.id,
      item_type: item.item_type,
      title: item.title || '',
      summary: item.summary || '',
      body: item.body || '',
      status: item.status || 'draft',
      is_featured: Boolean(item.is_featured),
      category_id: item.category_id ? String(item.category_id) : '',
      reporter_id: item.reporter_id ? String(item.reporter_id) : '',
      media_id: item.media_id ? String(item.media_id) : '',
      media_url: item.media_url || '',
      thumbnail_media_id: item.thumbnail_media_id ? String(item.thumbnail_media_id) : '',
      thumbnail_url: item.thumbnail_url || '',
      duration_seconds: item.duration_seconds !== null && item.duration_seconds !== undefined ? String(item.duration_seconds) : '',
      duration_label: item.duration_label || '',
      transcript: item.transcript || '',
      platform: item.platform || 'x',
      embed_author_name: item.embed_author_name || '',
      embed_author_handle: item.embed_author_handle || '',
      highlight_value: meta.highlight_value || '',
      highlight_label: meta.highlight_label || '',
      source: meta.source || '',
      bars:
        Array.isArray(meta.bars) && meta.bars.length > 0
          ? meta.bars
          : [{ label: '', value: '', max: 100, unit: '%', color: '#be123c' }]
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.media_url.trim()) {
      const check = parseSafeSocialEmbedUrl(form.media_url);
      if (!check.safe) {
        await sweetAlert.error('অনিরাপদ ইউআরএল', 'শুধুমাত্র বৈধ HTTP/HTTPS অথবা সিস্টেম স্টোরেজ পাথ ব্যবহার করুন।');
        return;
      }
    }

    const payload = {
      item_type: form.item_type,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      body: form.body.trim() || null,
      status: canPublish ? form.status : form.status === 'submitted' ? 'submitted' : 'draft',
      is_featured: form.is_featured,
      category_id: form.category_id ? Number(form.category_id) : null,
      reporter_id: form.reporter_id ? Number(form.reporter_id) : null,
      media_id: form.media_id ? Number(form.media_id) : null,
      thumbnail_media_id: form.thumbnail_media_id ? Number(form.thumbnail_media_id) : null,
      media_url: form.media_url.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      duration_label: form.duration_label.trim() || null,
      transcript: form.transcript.trim() || null,
      platform: form.item_type === 'social_embed' ? form.platform : null,
      embed_author_name: form.item_type === 'social_embed' ? form.embed_author_name.trim() || null : null,
      embed_author_handle: form.item_type === 'social_embed' ? form.embed_author_handle.trim() || null : null,
      metadata:
        form.item_type === 'infographic'
          ? {
              highlight_value: form.highlight_value,
              highlight_label: form.highlight_label,
              source: form.source,
              bars: form.bars
                .filter((b) => b.label && b.value !== '')
                .map((b) => ({
                  ...b,
                  value: Number(b.value) || 0,
                  max: Number(b.max) || 100
                }))
            }
          : undefined
    };

    try {
      if (form.id) {
        await updateItem({ id: form.id, ...payload }).unwrap();
        await sweetAlert.success('হালনাগাদ সম্পন্ন!', 'মাল্টিমিডিয়া কনটেন্ট সংরক্ষিত হয়েছে।');
      } else {
        await createItem(payload).unwrap();
        await sweetAlert.success('তৈরি হয়েছে!', 'নতুন মাল্টিমিডিয়া কনটেন্ট যুক্ত হয়েছে।');
      }
      setModalOpen(false);
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleTransition = async (id, action) => {
    try {
      await transitionItem({ id, action }).unwrap();
      await sweetAlert.success('সফল!', 'কনটেন্টের অবস্থা পরিবর্তিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('অনুমতি/ত্রুটি', extractApiError(err, 'অবস্থা পরিবর্তন করা যায়নি।'));
    }
  };

  const handleDelete = async (item) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(item.title, `"${item.title}" মুছে ফেলতে চান?`);
    if (!isConfirmed) return;
    try {
      await deleteItem(item.id).unwrap();
      await sweetAlert.success('অপসারিত!', 'কনটেন্টটি অপসারিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'অপসারণ ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-serif-bn text-stone-900">
              মাল্টিমিডিয়া সিএমএস স্টুডিও (Multimedia CMS)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              ভিডিও সংবাদ, অডিও বুলেটিন, ইনফোগ্রাফিক ও যাচাইকৃত সোশ্যাল পোস্ট ব্যবস্থাপনা এবং সম্পাদকীয় অনুমোদন
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => openCreateModal(typeTab)}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন মাল্টিমিডিয়া যুক্ত করুন</span>
            </button>
          )}
        </div>

        {/* Sub-module Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-stone-100">
          {QUICK_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold text-stone-800 transition-colors"
              >
                <Icon className="w-4 h-4 text-rose-700 shrink-0" />
                <span className="truncate">{mod.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-stone-200">
        {ITEM_TABS.map((t) => {
          const Icon = t.icon;
          const active = typeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-stone-500">তালিকা লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500">এই বিভাগে এখনো কোনো কনটেন্ট নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="px-4 py-3">শিরোনাম ও বিবরণ</th>
                  <th className="px-4 py-3">ধরন</th>
                  <th className="px-4 py-3">অবস্থা</th>
                  <th className="px-4 py-3">সময় / মাধ্যম</th>
                  <th className="px-4 py-3 text-right">সম্পাদনা ও অনুমোদন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => {
                  const typeMeta = getMultimediaItemTypeMeta(item.item_type);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 max-w-md">
                        <div className="font-bold text-stone-900 font-serif-bn text-sm">{item.title}</div>
                        <div className="text-[11px] text-stone-500 line-clamp-1">{item.summary || item.media_url}</div>
                        {item.reporter?.name && (
                          <div className="text-[10px] text-stone-400 mt-0.5">প্রতিবেদক: {item.reporter.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${typeMeta.badgeClass}`}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MultimediaStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-mono text-[11px]">
                        {item.duration_seconds || item.duration_label
                          ? formatDurationLabel(item.duration_seconds, item.duration_label)
                          : item.platform || item.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <WorkflowActionButtons
                            status={item.status}
                            canCreate={canCreate}
                            canPublish={canPublish}
                            canDelete={canDelete}
                            publicUrl="/multimedia"
                            onTransition={(act) => handleTransition(item.id, act)}
                            onDelete={() => handleDelete(item)}
                          />
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black font-serif-bn text-stone-900">
                {form.id ? 'মাল্টিমিডিয়া সম্পাদনা' : 'নতুন মাল্টিমিডিয়া তৈরি'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">কনটেন্টের ধরন</label>
                  <select
                    value={form.item_type}
                    disabled={Boolean(form.id)}
                    onChange={(e) => setForm({ ...form, item_type: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="video">ভিডিও সংবাদ (Video News)</option>
                    <option value="audio">অডিও সংবাদ (Audio News)</option>
                    <option value="infographic">ইনফোগ্রাফিক (Infographic)</option>
                    <option value="social_embed">সোশ্যাল পোস্ট এমবেড (Social Embed)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">বিভাগ (Category)</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="">সাধারণ / নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">সারসংক্ষেপ / বিবরণ</label>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              {(form.item_type === 'video' || form.item_type === 'audio' || form.item_type === 'social_embed') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {form.item_type === 'audio'
                        ? 'অডিও URL (MP3/WAV/Stream)'
                        : form.item_type === 'social_embed'
                          ? 'পোস্ট / ভিডিও URL (HTTPS)'
                          : 'ভিডিও URL (MP4/YouTube/Vimeo)'}
                    </label>
                    <input
                      type="text"
                      value={form.media_url}
                      onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                    />
                  </div>
                  {form.item_type !== 'social_embed' ? (
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">অথবা আপলোডকৃত মিডিয়া ফাইল</label>
                      <select
                        value={form.media_id}
                        onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                      >
                        <option value="">মিডিয়া লাইব্রেরি থেকে বাছাই করুন</option>
                        {videoOrAudioMedia.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.visibility})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">প্ল্যাটফর্ম</label>
                      <select
                        value={form.platform}
                        onChange={(e) => setForm({ ...form, platform: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                      >
                        <option value="x">X / Twitter</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="vimeo">Vimeo</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {(form.item_type === 'video' || form.item_type === 'audio') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">প্রতিবেদক (Reporter)</label>
                    <select
                      value={form.reporter_id}
                      onChange={(e) => setForm({ ...form, reporter_id: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="">নিউজরুম ডেস্ক</option>
                      {reporters.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ব্যাপ্তি (সেকেন্ড)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.duration_seconds}
                      onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })}
                      placeholder="180"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ব্যাপ্তি লেবেল</label>
                    <input
                      type="text"
                      value={form.duration_label}
                      onChange={(e) => setForm({ ...form, duration_label: e.target.value })}
                      placeholder="০৩:০০"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {form.item_type === 'video' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">থাম্বনেইল URL</label>
                    <input
                      type="text"
                      value={form.thumbnail_url}
                      onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">অথবা থাম্বনেইল ছবি</label>
                    <select
                      value={form.thumbnail_media_id}
                      onChange={(e) => setForm({ ...form, thumbnail_media_id: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="">ছবি নির্বাচন করুন</option>
                      {imageMedia.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {form.item_type === 'audio' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">অডিও ট্রান্সক্রিপ্ট</label>
                  <textarea
                    rows={3}
                    value={form.transcript}
                    onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              )}

              {form.item_type === 'social_embed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">প্রকাশকের নাম</label>
                    <input
                      type="text"
                      value={form.embed_author_name}
                      onChange={(e) => setForm({ ...form, embed_author_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">হ্যান্ডেল (@username)</label>
                    <input
                      type="text"
                      value={form.embed_author_handle}
                      onChange={(e) => setForm({ ...form, embed_author_handle: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {form.item_type === 'infographic' && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="মূল মান (যেমন +২৪%)"
                      value={form.highlight_value}
                      onChange={(e) => setForm({ ...form, highlight_value: e.target.value })}
                      className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="মানের বিবরণ"
                      value={form.highlight_label}
                      onChange={(e) => setForm({ ...form, highlight_label: e.target.value })}
                      className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="তথ্যসূত্র"
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    {form.bars.map((bar, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="লেবেল"
                          value={bar.label}
                          onChange={(e) => {
                            const next = [...form.bars];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setForm({ ...form, bars: next });
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          placeholder="মান"
                          value={bar.value}
                          onChange={(e) => {
                            const next = [...form.bars];
                            next[idx] = { ...next[idx], value: e.target.value };
                            setForm({ ...form, bars: next });
                          }}
                          className="w-20 px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, bars: form.bars.filter((_, i) => i !== idx) })
                          }
                          className="p-1.5 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          bars: [...form.bars, { label: '', value: '', max: 100, unit: '%', color: '#be123c' }]
                        })
                      }
                      className="text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      + নতুন ডেটা বার যোগ করুন
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">প্রকাশ অবস্থা (Status)</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="draft">খসড়া (Draft)</option>
                    <option value="submitted">অনুমোদনের জন্য জমা (Submitted)</option>
                    {canPublish && <option value="approved">অনুমোদিত (Approved)</option>}
                    {canPublish && <option value="published">প্রকাশিত (Published)</option>}
                  </select>
                </div>
                <label className="flex items-center gap-2 font-bold text-stone-700 pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded accent-rose-700"
                  />
                  <span>ফিচার্ড সেকশনে অগ্রাধিকার দিন</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{form.id ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMultimediaStudioPage;


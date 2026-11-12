import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowDown, ArrowUp, Clock, Edit3, ListVideo, Plus, Save, Trash2, X } from 'lucide-react';
import {
  useCreateTimelineMutation,
  useCreateVideoPlaylistMutation,
  useDeleteTimelineMutation,
  useDeleteVideoPlaylistMutation,
  useGetAdminMultimediaItemsQuery,
  useGetAdminTimelinesQuery,
  useGetAdminVideoPlaylistsQuery,
  useTransitionTimelineMutation,
  useTransitionVideoPlaylistMutation,
  useUpdateTimelineMutation,
  useUpdateVideoPlaylistMutation
} from '../../../store/api/multimediaApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export function AdminPlaylistsAndTimelinesPage({ initialMode = 'playlists' }) {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');
  const canDelete = hasEffectivePermission(authState, adminState, 'multimedia.delete');

  const [mode, setMode] = useState(initialMode);

  const { data: playlistsRes } = useGetAdminVideoPlaylistsQuery({ per_page: 30 });
  const { data: timelinesRes } = useGetAdminTimelinesQuery({ per_page: 30 });
  const { data: videosRes } = useGetAdminMultimediaItemsQuery({ item_type: 'video', per_page: 60 });

  const [createPlaylist] = useCreateVideoPlaylistMutation();
  const [updatePlaylist] = useUpdateVideoPlaylistMutation();
  const [deletePlaylist] = useDeleteVideoPlaylistMutation();
  const [transitionPlaylist] = useTransitionVideoPlaylistMutation();

  const [createTimeline] = useCreateTimelineMutation();
  const [updateTimeline] = useUpdateTimelineMutation();
  const [deleteTimeline] = useDeleteTimelineMutation();
  const [transitionTimeline] = useTransitionTimelineMutation();

  const playlists = playlistsRes?.items || [];
  const timelines = timelinesRes?.items || [];
  const videoItems = useMemo(() => videosRes?.items || [], [videosRes]);

  const [playlistModal, setPlaylistModal] = useState(null);
  const [timelineModal, setTimelineModal] = useState(null);

  const savePlaylist = async (e) => {
    e.preventDefault();
    const payload = {
      title: playlistModal.title.trim(),
      description: playlistModal.description.trim() || null,
      status: canPublish ? playlistModal.status : 'draft',
      items: playlistModal.items
        .filter((it) => it.multimedia_item_id)
        .map((it, idx) => ({
          multimedia_item_id: Number(it.multimedia_item_id),
          custom_note: it.custom_note?.trim() || null,
          sort_order: idx + 1
        }))
    };
    try {
      if (playlistModal.id) {
        await updatePlaylist({ id: playlistModal.id, ...payload }).unwrap();
      } else {
        await createPlaylist(payload).unwrap();
      }
      setPlaylistModal(null);
      await sweetAlert.success('সংরক্ষিত!', 'ভিডিও প্লেলিস্ট সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'প্লেলিস্ট সংরক্ষণ ব্যর্থ হয়েছে।'));
    }
  };

  const saveTimeline = async (e) => {
    e.preventDefault();
    const payload = {
      title: timelineModal.title.trim(),
      subtitle: timelineModal.subtitle.trim() || null,
      description: timelineModal.description.trim() || null,
      status: canPublish ? timelineModal.status : 'draft',
      events: timelineModal.events
        .filter((ev) => ev.date_label.trim() && ev.title.trim() && ev.description.trim())
        .map((ev, idx) => ({
          date_label: ev.date_label.trim(),
          title: ev.title.trim(),
          description: ev.description.trim(),
          badge: ev.badge?.trim() || null,
          media_url: ev.media_url?.trim() || null,
          link_url: ev.link_url?.trim() || null,
          sort_order: idx + 1
        }))
    };
    try {
      if (timelineModal.id) {
        await updateTimeline({ id: timelineModal.id, ...payload }).unwrap();
      } else {
        await createTimeline(payload).unwrap();
      }
      setTimelineModal(null);
      await sweetAlert.success('সংরক্ষিত!', 'ইন্টারঅ্যাক্টিভ টাইমলাইন সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'টাইমলাইন সংরক্ষণ ব্যর্থ হয়েছে।'));
    }
  };

  const swapItem = (arr, index, dir) => {
    const next = [...arr];
    const t = index + dir;
    if (t < 0 || t >= next.length) return next;
    [next[index], next[t]] = [next[t], next[index]];
    return next;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            ভিডিও প্লেলিস্ট ও ইন্টারঅ্যাক্টিভ টাইমলাইন সিএমএস
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            ধারাবাহিক ভিডিও সিরিজ কিউরেশন এবং ঘটনাপ্রবাহের কালানুক্রমিক টাইমলাইন ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('playlists')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              mode === 'playlists' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <ListVideo className="w-3.5 h-3.5" />
            <span>ভিডিও প্লেলিস্ট ({toBengaliNumber(playlists.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('timelines')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              mode === 'timelines' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ইন্টারঅ্যাক্টিভ টাইমলাইন ({toBengaliNumber(timelines.length)})</span>
          </button>
        </div>
      </div>

      {mode === 'playlists' ? (
        <div className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setPlaylistModal({
                    id: null,
                    title: '',
                    description: '',
                    status: 'draft',
                    items: [{ multimedia_item_id: videoItems[0]?.id ? String(videoItems[0].id) : '', custom_note: '' }]
                  })
                }
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ভিডিও প্লেলিস্ট</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {playlists.map((pl) => (
              <div key={pl.id} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black font-serif-bn text-stone-900">{pl.title}</h2>
                    <p className="text-xs text-stone-500 mt-0.5">{pl.description || '—'}</p>
                  </div>
                  <MultimediaStatusBadge status={pl.status} />
                </div>
                <div className="text-xs text-stone-600 font-semibold">
                  মোট ভিডিও: {toBengaliNumber(pl.items_count ?? pl.items?.length ?? 0)}টি
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() =>
                        setPlaylistModal({
                          id: pl.id,
                          title: pl.title || '',
                          description: pl.description || '',
                          status: pl.status || 'draft',
                          items:
                            Array.isArray(pl.items) && pl.items.length > 0
                              ? pl.items.map((it) => ({
                                  multimedia_item_id: String(it.multimedia_item_id),
                                  custom_note: it.custom_note || ''
                                }))
                              : [{ multimedia_item_id: '', custom_note: '' }]
                        })
                      }
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <WorkflowActionButtons
                    status={pl.status}
                    canCreate={canCreate}
                    canPublish={canPublish}
                    canDelete={canDelete}
                    publicUrl={`/multimedia/playlists/${pl.slug}`}
                    onTransition={(act) => transitionPlaylist({ id: pl.id, action: act })}
                    onDelete={async () => {
                      const { isConfirmed } = await sweetAlert.confirmDelete(pl.title);
                      if (isConfirmed) await deletePlaylist(pl.id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setTimelineModal({
                    id: null,
                    title: '',
                    subtitle: '',
                    description: '',
                    status: 'draft',
                    events: [{ date_label: '', title: '', description: '', badge: '', media_url: '', link_url: '' }]
                  })
                }
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ইন্টারঅ্যাক্টিভ টাইমলাইন</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {timelines.map((tl) => (
              <div key={tl.id} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black font-serif-bn text-stone-900">{tl.title}</h2>
                    {tl.subtitle && <p className="text-xs text-stone-500 mt-0.5">{tl.subtitle}</p>}
                  </div>
                  <MultimediaStatusBadge status={tl.status} />
                </div>
                <div className="text-xs text-stone-600 font-semibold">
                  ঘটনা ও অধ্যায়: {toBengaliNumber(tl.events_count ?? tl.events?.length ?? 0)}টি
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() =>
                        setTimelineModal({
                          id: tl.id,
                          title: tl.title || '',
                          subtitle: tl.subtitle || '',
                          description: tl.description || '',
                          status: tl.status || 'draft',
                          events:
                            Array.isArray(tl.events) && tl.events.length > 0
                              ? tl.events.map((ev) => ({
                                  date_label: ev.date_label || '',
                                  title: ev.title || '',
                                  description: ev.description || '',
                                  badge: ev.badge || '',
                                  media_url: ev.media_url || '',
                                  link_url: ev.link_url || ''
                                }))
                              : [{ date_label: '', title: '', description: '', badge: '', media_url: '', link_url: '' }]
                        })
                      }
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <WorkflowActionButtons
                    status={tl.status}
                    canCreate={canCreate}
                    canPublish={canPublish}
                    canDelete={canDelete}
                    publicUrl={`/multimedia/timelines/${tl.slug}`}
                    onTransition={(act) => transitionTimeline({ id: tl.id, action: act })}
                    onDelete={async () => {
                      const { isConfirmed } = await sweetAlert.confirmDelete(tl.title);
                      if (isConfirmed) await deleteTimeline(tl.id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {playlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black font-serif-bn">ভিডিও প্লেলিস্ট সম্পাদনা</h3>
              <button type="button" onClick={() => setPlaylistModal(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={savePlaylist} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="প্লেলিস্ট শিরোনাম *"
                value={playlistModal.title}
                onChange={(e) => setPlaylistModal({ ...playlistModal, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
              <textarea
                rows={2}
                placeholder="বিবরণ"
                value={playlistModal.description}
                onChange={(e) => setPlaylistModal({ ...playlistModal, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />

              <div className="space-y-2 border-t border-stone-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">ভিডিও সারি</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPlaylistModal({
                        ...playlistModal,
                        items: [...playlistModal.items, { multimedia_item_id: '', custom_note: '' }]
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-bold cursor-pointer"
                  >
                    + ভিডিও যোগ
                  </button>
                </div>
                {playlistModal.items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={it.multimedia_item_id}
                      onChange={(e) => {
                        const next = [...playlistModal.items];
                        next[idx] = { ...next[idx], multimedia_item_id: e.target.value };
                        setPlaylistModal({ ...playlistModal, items: next });
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    >
                      <option value="">ভিডিও বাছাই করুন</option>
                      {videoItems.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="নোট (পর্ব ১)"
                      value={it.custom_note}
                      onChange={(e) => {
                        const next = [...playlistModal.items];
                        next[idx] = { ...next[idx], custom_note: e.target.value };
                        setPlaylistModal({ ...playlistModal, items: next });
                      }}
                      className="w-32 px-2.5 py-1.5 border border-stone-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPlaylistModal({ ...playlistModal, items: swapItem(playlistModal.items, idx, -1) })
                      }
                      className="p-1.5 border rounded cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlaylistModal({ ...playlistModal, items: swapItem(playlistModal.items, idx, 1) })
                      }
                      className="p-1.5 border rounded cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlaylistModal({
                          ...playlistModal,
                          items: playlistModal.items.filter((_, i) => i !== idx)
                        })
                      }
                      className="p-1.5 text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {canPublish && (
                <select
                  value={playlistModal.status}
                  onChange={(e) => setPlaylistModal({ ...playlistModal, status: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="draft">খসড়া</option>
                  <option value="published">প্রকাশিত</option>
                </select>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPlaylistModal(null)} className="px-4 py-2 rounded-xl border border-stone-200 cursor-pointer">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                  <Save className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {timelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black font-serif-bn">টাইমলাইন সম্পাদনা</h3>
              <button type="button" onClick={() => setTimelineModal(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveTimeline} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="টাইমলাইন শিরোনাম *"
                  value={timelineModal.title}
                  onChange={(e) => setTimelineModal({ ...timelineModal, title: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="উপশিরোনাম"
                  value={timelineModal.subtitle}
                  onChange={(e) => setTimelineModal({ ...timelineModal, subtitle: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              <textarea
                rows={2}
                placeholder="বিবরণ"
                value={timelineModal.description}
                onChange={(e) => setTimelineModal({ ...timelineModal, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />

              <div className="space-y-2 border-t border-stone-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">কালানুক্রমিক ঘটনা (Events)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTimelineModal({
                        ...timelineModal,
                        events: [
                          ...timelineModal.events,
                          { date_label: '', title: '', description: '', badge: '', media_url: '', link_url: '' }
                        ]
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-bold cursor-pointer"
                  >
                    + ঘটনা যোগ
                  </button>
                </div>

                {timelineModal.events.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">অধ্যায় #{idx + 1}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setTimelineModal({ ...timelineModal, events: swapItem(timelineModal.events, idx, -1) })
                          }
                          className="p-1 bg-white border rounded cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTimelineModal({ ...timelineModal, events: swapItem(timelineModal.events, idx, 1) })
                          }
                          className="p-1 bg-white border rounded cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTimelineModal({
                              ...timelineModal,
                              events: timelineModal.events.filter((_, i) => i !== idx)
                            })
                          }
                          className="p-1 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="তারিখ লেবেল (জানুয়ারি ২০১০) *"
                        value={ev.date_label}
                        onChange={(e) => {
                          const next = [...timelineModal.events];
                          next[idx] = { ...next[idx], date_label: e.target.value };
                          setTimelineModal({ ...timelineModal, events: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="শিরোনাম *"
                        value={ev.title}
                        onChange={(e) => {
                          const next = [...timelineModal.events];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setTimelineModal({ ...timelineModal, events: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="ব্যাজ (যেমন: মাইলফলক)"
                        value={ev.badge}
                        onChange={(e) => {
                          const next = [...timelineModal.events];
                          next[idx] = { ...next[idx], badge: e.target.value };
                          setTimelineModal({ ...timelineModal, events: next });
                        }}
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="বিবরণ *"
                      value={ev.description}
                      onChange={(e) => {
                        const next = [...timelineModal.events];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setTimelineModal({ ...timelineModal, events: next });
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                ))}
              </div>

              {canPublish && (
                <select
                  value={timelineModal.status}
                  onChange={(e) => setTimelineModal({ ...timelineModal, status: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="draft">খসড়া</option>
                  <option value="published">প্রকাশিত</option>
                </select>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTimelineModal(null)} className="px-4 py-2 rounded-xl border border-stone-200 cursor-pointer">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                  <Save className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPlaylistsAndTimelinesPage;


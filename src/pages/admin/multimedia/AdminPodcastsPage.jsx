import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Headphones, Plus, Edit3, Save, X, Mic, Sparkles, Loader2 } from 'lucide-react';
import {
  useCreatePodcastEpisodeMutation,
  useCreatePodcastSeriesMutation,
  useDeletePodcastEpisodeMutation,
  useDeletePodcastSeriesMutation,
  useGetAdminPodcastsQuery,
  useTransitionPodcastEpisodeMutation,
  useTransitionPodcastSeriesMutation,
  useUpdatePodcastEpisodeMutation,
  useUpdatePodcastSeriesMutation
} from '../../../store/api/multimediaApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import { useRunAiAssistMutation, useApplyAiGenerationMutation } from '../../../store/api/aiApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import { formatDurationLabel } from '../../../utils/multimediaHelpers.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export function AdminPodcastsPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');
  const canDelete = hasEffectivePermission(authState, adminState, 'multimedia.delete');
  const canUseAi = hasEffectivePermission(authState, adminState, 'ai.use');
  const canApplyAi = hasEffectivePermission(authState, adminState, 'ai.apply');

  const { data: res, isLoading } = useGetAdminPodcastsQuery({ per_page: 30 });
  const { data: audioRes } = useGetMediaListQuery({ media_type: 'audio', per_page: 50 });

  const [createSeries] = useCreatePodcastSeriesMutation();
  const [updateSeries] = useUpdatePodcastSeriesMutation();
  const [deleteSeries] = useDeletePodcastSeriesMutation();
  const [transitionSeries] = useTransitionPodcastSeriesMutation();

  const [createEpisode] = useCreatePodcastEpisodeMutation();
  const [updateEpisode] = useUpdatePodcastEpisodeMutation();
  const [deleteEpisode] = useDeletePodcastEpisodeMutation();
  const [transitionEpisode] = useTransitionPodcastEpisodeMutation();
  const [runAiAssist, { isLoading: isGeneratingTranscript }] = useRunAiAssistMutation();
  const [applyAiGeneration] = useApplyAiGenerationMutation();

  const podcasts = res?.items || [];
  const audioAssets = useMemo(() => (audioRes?.items || []).filter((m) => m.type === 'audio'), [audioRes]);

  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const selectedSeries = podcasts.find((s) => s.id === selectedSeriesId) || podcasts[0] || null;

  const [seriesModal, setSeriesModal] = useState(null);
  const [episodeModal, setEpisodeModal] = useState(null);

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    const payload = {
      title: seriesModal.title.trim(),
      subtitle: seriesModal.subtitle.trim() || null,
      description: seriesModal.description.trim() || null,
      host_name: seriesModal.host_name.trim() || null,
      cover_image: seriesModal.cover_image.trim() || null,
      status: canPublish ? seriesModal.status : 'draft',
      subscribe_links: {
        spotify: seriesModal.spotify?.trim() || undefined,
        apple: seriesModal.apple?.trim() || undefined,
        youtube: seriesModal.youtube?.trim() || undefined,
        rss: seriesModal.rss?.trim() || undefined
      }
    };
    try {
      if (seriesModal.id) {
        await updateSeries({ id: seriesModal.id, ...payload }).unwrap();
      } else {
        const created = await createSeries(payload).unwrap();
        setSelectedSeriesId(created.id);
      }
      setSeriesModal(null);
      await sweetAlert.success('সংরক্ষিত!', 'পডকাস্ট সিরিজ সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleSaveEpisode = async (e) => {
    e.preventDefault();
    if (!selectedSeries) return;
    const payload = {
      seriesId: selectedSeries.id,
      season_number: Number(episodeModal.season_number || 1),
      episode_number: Number(episodeModal.episode_number || 1),
      title: episodeModal.title.trim(),
      summary: episodeModal.summary.trim() || null,
      show_notes: episodeModal.show_notes.trim() || null,
      transcript: episodeModal.transcript.trim() || null,
      audio_media_id: episodeModal.audio_media_id ? Number(episodeModal.audio_media_id) : null,
      audio_url: episodeModal.audio_url.trim() || null,
      duration_seconds: episodeModal.duration_seconds ? Number(episodeModal.duration_seconds) : null,
      duration_label: episodeModal.duration_label.trim() || null,
      status: canPublish ? episodeModal.status : 'draft'
    };
    try {
      let savedEp;
      if (episodeModal.id) {
        savedEp = await updateEpisode({ episodeId: episodeModal.id, ...payload }).unwrap();
      } else {
        savedEp = await createEpisode(payload).unwrap();
      }
      const savedEpisodeId = savedEp?.id || episodeModal.id;
      if (episodeModal.aiTranscriptGenerationId && savedEpisodeId && canApplyAi && payload.transcript) {
        await applyAiGeneration({
          id: episodeModal.aiTranscriptGenerationId,
          target_type: 'podcast_episode',
          target_id: savedEpisodeId,
          fields: { transcript: payload.transcript },
          human_edited: payload.transcript !== (episodeModal.aiSuggestedTranscript || '').trim(),
          review_notes: 'Reviewed inside Podcast episode editor'
        }).unwrap();
      }
      setEpisodeModal(null);
      await sweetAlert.success('সংরক্ষিত!', 'পডকাস্ট পর্ব সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'পর্ব সংরক্ষণ করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">পডকাস্ট সিরিজ ও পর্ব ব্যবস্থাপনা</h1>
          <p className="text-xs text-stone-500 mt-0.5">সাবস্ক্রাইব লিংক, অডিও প্লেয়ার, ট্রান্সক্রিপ্ট ও পর্ব প্রকাশনা</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() =>
              setSeriesModal({
                id: null,
                title: '',
                subtitle: '',
                description: '',
                host_name: '',
                cover_image: '',
                spotify: '',
                apple: '',
                youtube: '',
                rss: '',
                status: 'draft'
              })
            }
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পডকাস্ট সিরিজ</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Series List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">লোড হচ্ছে...</div>
          ) : (
            podcasts.map((series) => (
              <div
                key={series.id}
                onClick={() => setSelectedSeriesId(series.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  selectedSeries?.id === series.id
                    ? 'bg-rose-50/40 border-rose-500 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-black font-serif-bn text-stone-900">{series.title}</h2>
                    <p className="text-[11px] text-stone-500">সঞ্চালক: {series.host_name || 'নিউজরুম'}</p>
                  </div>
                  <MultimediaStatusBadge status={series.status} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() =>
                        setSeriesModal({
                          id: series.id,
                          title: series.title || '',
                          subtitle: series.subtitle || '',
                          description: series.description || '',
                          host_name: series.host_name || '',
                          cover_image: series.cover_image || '',
                          spotify: series.subscribe_links?.spotify || '',
                          apple: series.subscribe_links?.apple || '',
                          youtube: series.subscribe_links?.youtube || '',
                          rss: series.subscribe_links?.rss || '',
                          status: series.status || 'draft'
                        })
                      }
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <WorkflowActionButtons
                    status={series.status}
                    canCreate={canCreate}
                    canPublish={canPublish}
                    canDelete={canDelete}
                    publicUrl={`/multimedia/podcasts/${series.slug}`}
                    onTransition={(act) => transitionSeries({ id: series.id, action: act })}
                    onDelete={async () => {
                      const { isConfirmed } = await sweetAlert.confirmDelete(series.title);
                      if (isConfirmed) await deleteSeries(series.id);
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Episodes of Selected Series */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
          {selectedSeries ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-black font-serif-bn text-stone-900 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-rose-700" />
                    <span>পর্ব তালিকা — {selectedSeries.title}</span>
                  </h2>
                  <p className="text-[11px] text-stone-500">অডিও, ব্যাপ্তি, শো নোটস ও ট্রান্সক্রিপ্ট</p>
                </div>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() =>
                      setEpisodeModal({
                        id: null,
                        season_number: 1,
                        episode_number: (selectedSeries.episodes?.length || 0) + 1,
                        title: '',
                        summary: '',
                        show_notes: '',
                        transcript: '',
                        audio_media_id: '',
                        audio_url: '',
                        duration_seconds: '',
                        duration_label: '',
                        status: 'draft'
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন পর্ব যোগ করুন</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(selectedSeries.episodes || []).length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-8">এখনো কোনো পর্ব যোগ করা হয়নি।</p>
                ) : (
                  (selectedSeries.episodes || []).map((ep) => (
                    <div key={ep.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-bold text-rose-700">
                            সিজন {ep.season_number} • পর্ব {ep.episode_number} •{' '}
                            {formatDurationLabel(ep.duration_seconds, ep.duration_label)}
                          </span>
                          <h3 className="text-sm font-bold font-serif-bn text-stone-900">{ep.title}</h3>
                        </div>
                        <MultimediaStatusBadge status={ep.status} />
                      </div>
                      {ep.audio_url && <audio src={ep.audio_url} controls className="w-full h-9" />}
                      <div className="flex items-center justify-between pt-1">
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() =>
                              setEpisodeModal({
                                id: ep.id,
                                season_number: ep.season_number || 1,
                                episode_number: ep.episode_number || 1,
                                title: ep.title || '',
                                summary: ep.summary || '',
                                show_notes: ep.show_notes || '',
                                transcript: ep.transcript || '',
                                audio_media_id: ep.audio_media_id ? String(ep.audio_media_id) : '',
                                audio_url: ep.audio_url || '',
                                duration_seconds: ep.duration_seconds ? String(ep.duration_seconds) : '',
                                duration_label: ep.duration_label || '',
                                status: ep.status || 'draft'
                              })
                            }
                            className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <WorkflowActionButtons
                          status={ep.status}
                          canCreate={canCreate}
                          canPublish={canPublish}
                          canDelete={canDelete}
                          onTransition={(act) =>
                            transitionEpisode({ seriesId: selectedSeries.id, episodeId: ep.id, action: act })
                          }
                          onDelete={async () => {
                            const { isConfirmed } = await sweetAlert.confirmDelete(ep.title);
                            if (isConfirmed) {
                              await deleteEpisode({ seriesId: selectedSeries.id, episodeId: ep.id });
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-xs text-stone-500">কোনো সিরিজ নির্বাচন করুন অথবা নতুন তৈরি করুন।</div>
          )}
        </div>
      </div>

      {/* Series Modal */}
      {seriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black font-serif-bn">পডকাস্ট সিরিজ তথ্য</h3>
              <button type="button" onClick={() => setSeriesModal(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSeries} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="সিরিজের শিরোনাম *"
                value={seriesModal.title}
                onChange={(e) => setSeriesModal({ ...seriesModal, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="সঞ্চালক"
                  value={seriesModal.host_name}
                  onChange={(e) => setSeriesModal({ ...seriesModal, host_name: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="কভার ছবির URL"
                  value={seriesModal.cover_image}
                  onChange={(e) => setSeriesModal({ ...seriesModal, cover_image: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              <textarea
                rows={2}
                placeholder="বিবরণ"
                value={seriesModal.description}
                onChange={(e) => setSeriesModal({ ...seriesModal, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="url"
                  placeholder="Spotify URL"
                  value={seriesModal.spotify}
                  onChange={(e) => setSeriesModal({ ...seriesModal, spotify: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="url"
                  placeholder="Apple Podcasts URL"
                  value={seriesModal.apple}
                  onChange={(e) => setSeriesModal({ ...seriesModal, apple: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="url"
                  placeholder="YouTube URL"
                  value={seriesModal.youtube}
                  onChange={(e) => setSeriesModal({ ...seriesModal, youtube: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="url"
                  placeholder="RSS Feed URL"
                  value={seriesModal.rss}
                  onChange={(e) => setSeriesModal({ ...seriesModal, rss: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              {canPublish && (
                <select
                  value={seriesModal.status}
                  onChange={(e) => setSeriesModal({ ...seriesModal, status: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="draft">খসড়া</option>
                  <option value="published">প্রকাশিত</option>
                </select>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSeriesModal(null)} className="px-4 py-2 rounded-xl border border-stone-200 cursor-pointer">
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

      {/* Episode Modal */}
      {episodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black font-serif-bn flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-rose-700" />
                <span>পডকাস্ট পর্ব তথ্য</span>
              </h3>
              <button type="button" onClick={() => setEpisodeModal(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEpisode} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="সিজন"
                  value={episodeModal.season_number}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, season_number: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="পর্ব নম্বর"
                  value={episodeModal.episode_number}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, episode_number: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              <input
                type="text"
                required
                placeholder="পর্বের শিরোনাম *"
                value={episodeModal.title}
                onChange={(e) => setEpisodeModal({ ...episodeModal, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={episodeModal.audio_media_id}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, audio_media_id: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="">অডিও ফাইল বাছাই</option>
                  {audioAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="অথবা অডিও URL (.mp3)"
                  value={episodeModal.audio_url}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, audio_url: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="ব্যাপ্তি (সেকেন্ড)"
                  value={episodeModal.duration_seconds}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, duration_seconds: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="ব্যাপ্তি লেবেল (১৫:২০)"
                  value={episodeModal.duration_label}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, duration_label: e.target.value })}
                  className="px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              <textarea
                rows={2}
                placeholder="শো নোটস"
                value={episodeModal.show_notes}
                onChange={(e) => setEpisodeModal({ ...episodeModal, show_notes: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-stone-700">পূর্ণাঙ্গ ট্রান্সক্রিপ্ট</label>
                  {canUseAi && (
                    <button
                      type="button"
                      disabled={isGeneratingTranscript}
                      onClick={async () => {
                        try {
                          const res = await runAiAssist({
                            feature: 'transcript_generation',
                            podcast_episode_id: episodeModal.id || undefined,
                            title: episodeModal.title || '',
                            summary: episodeModal.summary || '',
                            audio_notes: episodeModal.show_notes || '',
                            duration_seconds: episodeModal.duration_seconds ? Number(episodeModal.duration_seconds) : undefined
                          }).unwrap();
                          const generatedTranscript = res?.output_payload?.transcript || '';
                          setEpisodeModal((prev) => ({
                            ...prev,
                            transcript: generatedTranscript,
                            aiTranscriptGenerationId: res?.id || null,
                            aiSuggestedTranscript: generatedTranscript
                          }));
                          await sweetAlert.warning(
                            'AI খসড়া ট্রান্সক্রিপ্ট প্রস্তুত',
                            'অডিও শুনে বা নোট মিলিয়ে প্রকাশের আগে ট্রান্সক্রিপ্ট অবশ্যই যাচাই ও সংশোধন করে নিন।'
                          );
                        } catch (err) {
                          await sweetAlert.error('AI ট্রান্সক্রিপ্ট ব্যর্থ', extractApiError(err, 'ট্রান্সক্রিপ্ট তৈরি করা যায়নি।'));
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>AI খসড়া ট্রান্সক্রিপ্ট তৈরি</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="পূর্ণাঙ্গ ট্রান্সক্রিপ্ট"
                  value={episodeModal.transcript}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, transcript: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
                {(episodeModal.transcript_is_ai_generated || episodeModal.aiTranscriptGenerationId) && (
                  <p className="text-[10px] font-semibold text-amber-700">
                    ✦ AI-সহায়তাপ্রাপ্ত খসড়া ট্রান্সক্রিপ্ট — অডিও মিলিয়ে সম্পাদকীয় যাচাই আবশ্যক।
                  </p>
                )}
              </div>
              {canPublish && (
                <select
                  value={episodeModal.status}
                  onChange={(e) => setEpisodeModal({ ...episodeModal, status: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="draft">খসড়া</option>
                  <option value="published">প্রকাশিত</option>
                </select>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEpisodeModal(null)} className="px-4 py-2 rounded-xl border border-stone-200 cursor-pointer">
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

export default AdminPodcastsPage;


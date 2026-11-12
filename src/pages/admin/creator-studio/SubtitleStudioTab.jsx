import React, { useEffect, useState } from 'react';
import { Captions, Plus, Trash2, Download, Upload, Wand2, Save, CheckCircle2 } from 'lucide-react';
import {
  useCreateCreatorSubtitleTrackMutation,
  useImportCreatorSubtitleTrackMutation,
  useAutoGenerateCreatorSubtitlesMutation,
  useUpdateCreatorSubtitleTrackMutation,
} from '../../../store/api/creatorStudioApi.js';
import {
  msToTimecode,
  validateCueList,
  fetchAuthorizedBlobUrl,
  downloadAuthorizedFile,
} from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export default function SubtitleStudioTab({ project, canCreate, canApprove }) {
  const tracks = project?.subtitle_tracks || [];
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [language, setLanguage] = useState('bn');
  const [cues, setCues] = useState([]);
  const [rawImport, setRawImport] = useState('');
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);

  const [createTrack, { isLoading: isCreating }] = useCreateCreatorSubtitleTrackMutation();
  const [importTrack, { isLoading: isImporting }] = useImportCreatorSubtitleTrackMutation();
  const [autoGenerate, { isLoading: isAutoGenerating }] = useAutoGenerateCreatorSubtitlesMutation();
  const [updateTrack, { isLoading: isSaving }] = useUpdateCreatorSubtitleTrackMutation();

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;

  useEffect(() => {
    if (activeTrack) {
      setSelectedTrackId(activeTrack.id);
      setCues(Array.isArray(activeTrack.cues) ? activeTrack.cues : []);
    } else {
      setCues([]);
    }
  }, [activeTrack?.id, activeTrack?.updated_at]);

  useEffect(() => {
    let mounted = true;
    let createdUrl = null;
    if (project?.source_video_media_id) {
      fetchAuthorizedBlobUrl(`/admin/creator-studio/media/${project.source_video_media_id}/stream`)
        .then((url) => {
          createdUrl = url;
          if (mounted) setVideoBlobUrl(url);
        })
        .catch(() => {
          if (mounted) setVideoBlobUrl(null);
        });
    } else {
      setVideoBlobUrl(null);
    }
    return () => {
      mounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [project?.source_video_media_id]);

  const handleGenerateNewTrack = async () => {
    try {
      const res = await createTrack({
        projectId: project.id,
        language,
        duration_seconds: project?.source_video_media?.duration_seconds || 45,
      }).unwrap();
      setSelectedTrackId(res?.id || res?.data?.id);
      sweetAlert.toast('সাবটাইটেল ট্র্যাক তৈরি হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('ত্রুটি', extractApiError(err));
    }
  };

  const handleAutoRegenerate = async () => {
    if (!activeTrack) return;
    try {
      await autoGenerate({ projectId: project.id, trackId: activeTrack.id, language: activeTrack.language }).unwrap();
      sweetAlert.toast('সাবটাইটেল কিউ স্বয়ংক্রিয়ভাবে বিন্যস্ত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('অটো-জেনারেট ব্যর্থ', extractApiError(err));
    }
  };

  const handleImportRaw = async () => {
    if (!rawImport.trim()) return;
    try {
      const formData = new FormData();
      formData.append('language', language);
      formData.append('raw_subtitles', rawImport);
      const res = await importTrack({ projectId: project.id, formData }).unwrap();
      setSelectedTrackId(res?.id || res?.data?.id);
      setRawImport('');
      sweetAlert.toast('SRT / VTT ইমপোর্ট সম্পন্ন হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('ইমপোর্ট ব্যর্থ', extractApiError(err));
    }
  };

  const handleSaveCues = async (nextStatus = null) => {
    if (!activeTrack) return;
    const validation = validateCueList(cues);
    if (!validation.valid) {
      sweetAlert.error('সময়সীমা যাচাই ত্রুটি', validation.error);
      return;
    }

    try {
      await updateTrack({
        projectId: project.id,
        trackId: activeTrack.id,
        cues,
        ...(nextStatus ? { status: nextStatus } : {}),
      }).unwrap();
      sweetAlert.toast(nextStatus === 'approved' ? 'সাবটাইটেল অনুমোদিত হয়েছে' : 'সাবটাইটেল সংরক্ষিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('সংরক্ষণ ব্যর্থ', extractApiError(err));
    }
  };

  const updateCueField = (idx, field, val) => {
    setCues((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
  };

  const nudgeCue = (idx, deltaMs) => {
    setCues((prev) =>
      prev.map((c, i) =>
        i === idx
          ? {
              ...c,
              start_ms: Math.max(0, Number(c.start_ms || 0) + deltaMs),
              end_ms: Math.max(500, Number(c.end_ms || 500) + deltaMs),
            }
          : c
      )
    );
  };

  const addCue = () => {
    const lastEnd = cues.length ? Number(cues[cues.length - 1].end_ms || 0) : 0;
    setCues([...cues, { index: cues.length + 1, start_ms: lastEnd + 200, end_ms: lastEnd + 3200, text: '', speaker: 'Anchor' }]);
  };

  const removeCue = (idx) => {
    setCues((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="bn">বাংলা সাবটাইটেল (BN)</option>
            <option value="en">English Subtitles (EN)</option>
          </select>
          <button
            type="button"
            onClick={handleGenerateNewTrack}
            disabled={!canCreate || isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
          >
            <Wand2 className="w-4 h-4" /> ভিডিও / স্ক্রিপ্ট থেকে সাবটাইটেল তৈরি করুন
          </button>
        </div>

        {activeTrack && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadAuthorizedFile(`/admin/creator-studio/subtitles/${activeTrack.id}/export/srt`, `subtitles-${activeTrack.id}.srt`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> .SRT
            </button>
            <button
              type="button"
              onClick={() => downloadAuthorizedFile(`/admin/creator-studio/subtitles/${activeTrack.id}/export/vtt`, `subtitles-${activeTrack.id}.vtt`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> .VTT
            </button>
          </div>
        )}
      </div>

      {/* Video Player Preview (when source video attached) */}
      {videoBlobUrl && (
        <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center">
          <video controls src={videoBlobUrl} className="max-h-72 rounded-lg border border-slate-700 bg-black" />
        </div>
      )}

      {/* Import SRT/VTT Drawer */}
      <details className="bg-white border border-slate-200 rounded-xl p-4">
        <summary className="text-xs font-bold text-slate-700 cursor-pointer inline-flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> বিদ্যমান SRT / WebVTT সাবটাইটেল পেস্ট করে ইমপোর্ট করুন
        </summary>
        <div className="mt-3 space-y-2">
          <textarea
            rows={4}
            value={rawImport}
            onChange={(e) => setRawImport(e.target.value)}
            placeholder={"1\n00:00:00,000 --> 00:00:03,500\nপ্রথম সাবটাইটেল লাইন"}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleImportRaw}
            disabled={!canCreate || isImporting}
            className="px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold"
          >
            ইমপোর্ট করুন
          </button>
        </div>
      </details>

      {/* Cue Editor Table */}
      {tracks.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl bg-white">
          <Captions className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">কোনো সাবটাইটেল ট্র্যাক নেই। উপরের বাটনে ক্লিক করে শুরু করুন।</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tracks.map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => setSelectedTrackId(tr.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  activeTrack?.id === tr.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                #{tr.id} · {tr.language.toUpperCase()} ({tr.status})
              </button>
            ))}
          </div>

          {activeTrack && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">
                  Provider: <strong>{activeTrack.provider}</strong> · মোট কিউ: <strong>{cues.length}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAutoRegenerate}
                    disabled={!canCreate || isAutoGenerating}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    রি-অ্যালাইন করুন
                  </button>
                  <button
                    type="button"
                    onClick={addCue}
                    disabled={!canCreate}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> কিউ যোগ করুন
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {cues.map((cue, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500">Start (ms)</label>
                      <input
                        type="number"
                        min={0}
                        value={cue.start_ms}
                        onChange={(e) => updateCueField(idx, 'start_ms', Number(e.target.value))}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{msToTimecode(cue.start_ms, '.')}</span>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500">End (ms)</label>
                      <input
                        type="number"
                        min={100}
                        value={cue.end_ms}
                        onChange={(e) => updateCueField(idx, 'end_ms', Number(e.target.value))}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{msToTimecode(cue.end_ms, '.')}</span>
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] text-slate-500">Subtitle Line #{idx + 1}</label>
                      <input
                        type="text"
                        value={cue.text || ''}
                        onChange={(e) => updateCueField(idx, 'text', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => nudgeCue(idx, -250)}
                        title="-250ms"
                        className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-mono hover:bg-slate-100"
                      >
                        -0.25s
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeCue(idx, 250)}
                        title="+250ms"
                        className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-mono hover:bg-slate-100"
                      >
                        +0.25s
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCue(idx)}
                        disabled={!canCreate}
                        className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSaveCues()}
                  disabled={!canCreate || isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> টাইমস্ট্যাম্প সংরক্ষণ করুন
                </button>
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => handleSaveCues('approved')}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদন করুন
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


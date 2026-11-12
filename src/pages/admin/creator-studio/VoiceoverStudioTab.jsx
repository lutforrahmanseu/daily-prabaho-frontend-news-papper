import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Volume2, CheckCircle2, Trash2, Star, Loader2 } from 'lucide-react';
import {
  useUploadCreatorVoiceoverMutation,
  useSynthesizeCreatorVoiceoverMutation,
  useSelectCreatorVoiceoverMutation,
  useApproveCreatorVoiceoverMutation,
  useDeleteCreatorVoiceoverMutation,
} from '../../../store/api/creatorStudioApi.js';
import { fetchAuthorizedBlobUrl } from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

function StudioAudioPlayer({ mediaId }) {
  const [srcUrl, setSrcUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    let url = null;
    if (mediaId) {
      fetchAuthorizedBlobUrl(`/admin/creator-studio/media/${mediaId}/stream`)
        .then((objUrl) => {
          url = objUrl;
          if (mounted) setSrcUrl(objUrl);
        })
        .catch(() => {
          if (mounted) setSrcUrl(null);
        });
    }
    return () => {
      mounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mediaId]);

  if (!mediaId) return <span className="text-xs text-slate-400">কোনো অডিও সংযুক্ত নেই</span>;
  if (!srcUrl) return <span className="text-xs text-slate-400">অডিও লোড হচ্ছে...</span>;

  return <audio controls src={srcUrl} className="h-9 max-w-xs" />;
}

export default function VoiceoverStudioTab({ project, studioSettings, canCreate, canApprove }) {
  const voiceovers = project?.voiceovers || [];
  const ttsCatalog = studioSettings?.tts_catalog || {};

  const [provider, setProvider] = useState(studioSettings?.settings?.tts_provider || 'local_tts_preview');
  const [language, setLanguage] = useState(project?.language === 'en' ? 'en' : 'bn');
  const [voiceId, setVoiceId] = useState(studioSettings?.settings?.tts_default_voice_bn || 'bn-BD-NewsAnchor-F');
  const [speedRate, setSpeedRate] = useState(1.0);
  const [ttsText, setTtsText] = useState('');
  const [title, setTitle] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [uploadVoiceover, { isLoading: isUploading }] = useUploadCreatorVoiceoverMutation();
  const [synthesizeVoiceover, { isLoading: isSynthesizing }] = useSynthesizeCreatorVoiceoverMutation();
  const [selectVoiceover] = useSelectCreatorVoiceoverMutation();
  const [approveVoiceover] = useApproveCreatorVoiceoverMutation();
  const [deleteVoiceover] = useDeleteCreatorVoiceoverMutation();

  const voices = ttsCatalog[provider]?.voices || [
    { id: 'bn-BD-NewsAnchor-F', label: 'Bangla News Anchor (Female)' },
    { id: 'en-US-Broadcast-M', label: 'English Broadcast (Male)' },
  ];

  useEffect(() => {
    const activeScript = project?.scripts?.find((s) => s.is_active) || project?.scripts?.[0];
    if (!ttsText && activeScript?.full_script_text) {
      setTtsText(activeScript.full_script_text);
    }
  }, [project?.id]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const formData = new FormData();
        formData.append('audio_file', blob, `studio-mic-${Date.now()}.webm`);
        formData.append('source_type', 'recorded');
        formData.append('language', language);
        formData.append('title', title || `মাইক রেকর্ডিং (${new Date().toLocaleTimeString()})`);
        formData.append('select_immediately', '1');
        try {
          await uploadVoiceover({ projectId: project.id, formData }).unwrap();
          sweetAlert.toast('রেকর্ড করা ভয়েসওভার সংরক্ষিত হয়েছে', 'success');
        } catch (err) {
          sweetAlert.error('আপলোড ব্যর্থ', extractApiError(err));
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      sweetAlert.error('মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি', 'ব্রাউজার মাইক্রোফোন অনুমতি বা ফাইল আপলোড ব্যবহার করুন।');
    }
  };

  const handleStopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('audio_file', file);
      formData.append('source_type', 'uploaded');
      formData.append('language', language);
      formData.append('title', title || file.name);
      formData.append('select_immediately', '1');
      await uploadVoiceover({ projectId: project.id, formData }).unwrap();
      sweetAlert.toast('অডিও ফাইল সংরক্ষিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('অডিও আপলোড ব্যর্থ', extractApiError(err));
    } finally {
      e.target.value = '';
    }
  };

  const handleSynthesize = async () => {
    try {
      await synthesizeVoiceover({
        projectId: project.id,
        title: title || `TTS: ${voiceId}`,
        provider,
        voice_id: voiceId,
        language,
        speed_rate: Number(speedRate),
        text: ttsText,
      }).unwrap();
      sweetAlert.toast('TTS ভয়েসওভার তৈরি ও সংরক্ষিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('TTS তৈরি ব্যর্থ', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Record / Upload Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-600" /> সরাসরি মাইক রেকর্ডিং ও অডিও আপলোড
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ভয়েসওভার শিরোনাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="উদা: সংবাদ পাঠক অডিও টেক ১"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={!canCreate || isUploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                <Mic className="w-4 h-4" /> মাইকে রেকর্ড শুরু করুন
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold animate-pulse"
              >
                <Square className="w-4 h-4 fill-rose-500 text-rose-500" /> রেকর্ডিং থামান ও সেভ করুন
              </button>
            )}

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer">
              <Upload className="w-4 h-4" /> অডিও আপলোড (MP3/WAV/M4A)
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={!canCreate || isUploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500">নিরাপদ প্রাইভেট স্টুডিও স্টোরেজে সংরক্ষিত থাকে এবং অনুমোদনের আগে পাবলিক URL উন্মুক্ত হয় না।</p>
        </div>

        {/* Approved TTS Provider Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" /> অনুমোদিত TTS প্রোভাইডার ও ভয়েস সিলেকশন
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">প্রোভাইডার</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  const first = ttsCatalog[e.target.value]?.voices?.[0]?.id;
                  if (first) setVoiceId(first);
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              >
                {Object.entries(ttsCatalog).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label || key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ভয়েস নির্বাচন</label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ভাষা ও গতি ({speedRate}x)</label>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                >
                  <option value="bn">BN</option>
                  <option value="en">EN</option>
                </select>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speedRate}
                  onChange={(e) => setSpeedRate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <textarea
            rows={3}
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="TTS ভয়েসওভারের স্ক্রিপ্ট পাঠ্য..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />

          <button
            type="button"
            onClick={handleSynthesize}
            disabled={!canCreate || isSynthesizing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            TTS অডিও তৈরি করুন
          </button>
        </div>
      </div>

      {/* Stored Voiceovers List */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">সংরক্ষিত ভয়েসওভার অ্যাসেট ({voiceovers.length})</h4>
        {voiceovers.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">এখনো কোনো ভয়েসওভার রেকর্ড বা তৈরি করা হয়নি।</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {voiceovers.map((vo) => (
              <div key={vo.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{vo.title}</span>
                    {vo.is_selected && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                        <Star className="w-3 h-3 fill-indigo-600" /> নির্বাচিত
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {vo.source_type} · {vo.provider} ({vo.status})
                    </span>
                  </div>
                  {vo.error_message && <p className="text-xs text-amber-700">{vo.error_message}</p>}
                </div>

                <StudioAudioPlayer mediaId={vo.audio_media_id} />

                <div className="flex items-center gap-2">
                  {!vo.is_selected && canCreate && (
                    <button
                      type="button"
                      onClick={() => selectVoiceover({ projectId: project.id, voiceoverId: vo.id })}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-100"
                    >
                      নির্বাচন করুন
                    </button>
                  )}
                  {canApprove && vo.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => approveVoiceover({ projectId: project.id, voiceoverId: vo.id })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদন
                    </button>
                  )}
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => deleteVoiceover({ projectId: project.id, voiceoverId: vo.id })}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Clock, Save, AlertTriangle, Loader2 } from 'lucide-react';
import {
  useGenerateCreatorScriptMutation,
  useUpdateCreatorScriptMutation,
  useReviewCreatorScriptMutation,
} from '../../../store/api/creatorStudioApi.js';
import { SCRIPT_APPROVAL_META, estimateSpokenSeconds } from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export default function ScriptGeneratorTab({ project, canCreate, canApproveScript }) {
  const scripts = project?.scripts || [];
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [language, setLanguage] = useState(project?.language === 'en' ? 'en' : 'bn');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [tone, setTone] = useState('explainer');

  const [editHook, setEditHook] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editSegments, setEditSegments] = useState([]);
  const [reviewNote, setReviewNote] = useState('');

  const [generateScript, { isLoading: isGenerating }] = useGenerateCreatorScriptMutation();
  const [updateScript, { isLoading: isSaving }] = useUpdateCreatorScriptMutation();
  const [reviewScript, { isLoading: isReviewing }] = useReviewCreatorScriptMutation();

  const activeScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0] || null;

  useEffect(() => {
    if (activeScript) {
      setSelectedScriptId(activeScript.id);
      setEditHook(activeScript.hook_text || '');
      setEditCta(activeScript.cta_text || '');
      setEditSegments(Array.isArray(activeScript.body_segments) ? activeScript.body_segments : []);
    } else {
      setEditHook('');
      setEditCta('');
      setEditSegments([]);
    }
  }, [activeScript?.id, activeScript?.updated_at]);

  const handleGenerate = async () => {
    try {
      const res = await generateScript({
        projectId: project.id,
        language,
        duration_seconds: durationSeconds,
        tone,
      }).unwrap();
      setSelectedScriptId(res?.id || res?.data?.id);
      sweetAlert.toast('নতুন ভিডিও স্ক্রিপ্ট তৈরি হয়েছে (সাংবাদিকের অনুমোদন প্রয়োজন)', 'success');
    } catch (err) {
      sweetAlert.error('স্ক্রিপ্ট তৈরি ব্যর্থ', extractApiError(err));
    }
  };

  const handleSegmentChange = (idx, field, value) => {
    setEditSegments((prev) => prev.map((seg, i) => (i === idx ? { ...seg, [field]: value } : seg)));
  };

  const handleSaveEdits = async () => {
    if (!activeScript) return;
    try {
      const fullText = editSegments.map((s) => s.spoken_text || '').filter(Boolean).join('\n\n');
      await updateScript({
        projectId: project.id,
        scriptId: activeScript.id,
        hook_text: editHook,
        cta_text: editCta,
        body_segments: editSegments,
        full_script_text: fullText,
      }).unwrap();
      sweetAlert.toast('স্ক্রিপ্ট সংরক্ষিত হয়েছে ও পুনঃপর্যালোচনার জন্য নির্ধারিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('সংরক্ষণ ব্যর্থ', extractApiError(err));
    }
  };

  const handleReview = async (decision) => {
    if (!activeScript) return;
    try {
      await reviewScript({
        projectId: project.id,
        scriptId: activeScript.id,
        decision,
        notes: reviewNote,
      }).unwrap();
      setReviewNote('');
      sweetAlert.toast(
        decision === 'approve' ? 'স্ক্রিপ্ট সাংবাদিক/সম্পাদক কর্তৃক অনুমোদিত হয়েছে' : 'স্ক্রিপ্ট সংশোধনের জন্য ফেরত পাঠানো হয়েছে',
        decision === 'approve' ? 'success' : 'warning'
      );
    } catch (err) {
      sweetAlert.error('অনুমোদন প্রক্রিয়া ব্যর্থ', extractApiError(err));
    }
  };

  const compiledText = editSegments.map((s) => s.spoken_text || '').join(' ');
  const estimatedSeconds = estimateSpokenSeconds(compiledText, activeScript?.language || language);

  return (
    <div className="space-y-6">
      {/* Generator Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-4 justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-w-[260px]">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ভাষা (Language)</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="bn">বাংলা (Bangla)</option>
              <option value="en">ইংরেজি (English)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">দৈর্ঘ্য (Format Duration)</label>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden bg-white">
              {[30, 60, 90].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDurationSeconds(sec)}
                  className={`flex-1 py-2 text-xs font-bold transition ${
                    durationSeconds === sec ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">টোন (Broadcast Tone)</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="explainer">Explainer / বিশ্লেষণ</option>
              <option value="breaking">Breaking News / ব্রেকিং</option>
              <option value="feature">Feature Story / ফিচার</option>
              <option value="digest">Daily Digest / সংক্ষেপ</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canCreate || isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          অনুমোদিত সংবাদ থেকে স্ক্রিপ্ট তৈরি করুন
        </button>
      </div>

      {/* Script Versions & Editor */}
      {scripts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-white">
          <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">এখনো কোনো ভিডিও স্ক্রিপ্ট তৈরি করা হয়নি।</p>
          <p className="text-xs text-slate-500 mt-1">উপরের জেনারেটর থেকে ৩০, ৬০ বা ৯০ সেকেন্ডের স্ক্রিপ্ট তৈরি করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Script Version List */}
          <div className="lg:col-span-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">সংস্করণ তালিকা ({scripts.length})</h4>
            {scripts.map((s) => {
              const meta = SCRIPT_APPROVAL_META[s.approval_status] || SCRIPT_APPROVAL_META.pending_review;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedScriptId(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    activeScript?.id === s.id
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">
                      {s.language === 'bn' ? 'বাংলা' : 'English'} · {s.duration_seconds}s ({s.tone})
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${meta.badgeClass}`}>
                      {s.approval_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{s.hook_text}</p>
                </button>
              );
            })}
          </div>

          {/* Active Script Editor & Journalist Approval */}
          {activeScript && (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      (SCRIPT_APPROVAL_META[activeScript.approval_status] || SCRIPT_APPROVAL_META.pending_review).badgeClass
                    }`}
                  >
                    {(SCRIPT_APPROVAL_META[activeScript.approval_status] || SCRIPT_APPROVAL_META.pending_review).label}
                  </span>
                  <span className="ml-3 text-xs text-slate-500 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> আনুমানিক কথন সময়: ~{estimatedSeconds}s ({activeScript.estimated_word_count} শব্দ)
                  </span>
                </div>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                  Source: {activeScript.generation_source}
                </span>
              </div>

              {activeScript.approval_status !== 'approved' && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>তথ্যগত নির্ভুলতা নিশ্চিত করতে সাংবাদিক বা সম্পাদকের সরাসরি অনুমোদন ব্যতীত এই স্ক্রিপ্ট প্রকাশ করা যাবে না।</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ওপেনিং হুক (Hook)</label>
                <textarea
                  rows={2}
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  disabled={!canCreate}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">টাইমলাইন ভিত্তিক সেগমেন্ট</label>
                {editSegments.map((seg, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>সেগমেন্ট #{seg.order || idx + 1}</span>
                      <span>
                        {seg.start_sec}s → {seg.end_sec}s
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={seg.spoken_text || ''}
                      onChange={(e) => handleSegmentChange(idx, 'spoken_text', e.target.value)}
                      disabled={!canCreate}
                      placeholder="কথোপকথন / ন্যারেশন"
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={seg.on_screen_text || ''}
                        onChange={(e) => handleSegmentChange(idx, 'on_screen_text', e.target.value)}
                        disabled={!canCreate}
                        placeholder="অন-স্ক্রিন টেক্সট"
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={seg.visual_cue || ''}
                        onChange={(e) => handleSegmentChange(idx, 'visual_cue', e.target.value)}
                        disabled={!canCreate}
                        placeholder="ভিজ্যুয়াল কিউ / বি-রোল"
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সমাপনী আহ্বান (Call To Action)</label>
                <input
                  type="text"
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                  disabled={!canCreate}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={!canCreate || isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> সংশোধন সংরক্ষণ করুন
                </button>

                {canApproveScript && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="রিভিউ মন্তব্য (ঐচ্ছিক)"
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleReview('reject')}
                      disabled={isReviewing}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যান
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview('approve')}
                      disabled={isReviewing}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> সাংবাদিক অনুমোদন দিন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


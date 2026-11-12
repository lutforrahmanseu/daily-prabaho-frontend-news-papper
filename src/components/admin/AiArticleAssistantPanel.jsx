import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  ShieldAlert,
  Languages,
  FileSearch,
  CheckCircle2,
  Tag as TagIcon,
  Search,
  Globe,
  History
} from 'lucide-react';
import {
  useRunAiAssistMutation,
  useApplyAiGenerationMutation,
  useRejectAiGenerationMutation,
  useGetNewsAiProvenanceQuery,
  useRevertAiModificationMutation
} from '../../store/api/aiApi.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import AiSafetyNotice from './AiSafetyNotice.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

const EDITOR_AI_TOOLS = [
  { key: 'headline_suggestions', labelBn: 'শিরোনাম প্রস্তাব', icon: Sparkles },
  { key: 'subheadline_suggestions', labelBn: 'উপ-শিরোনাম', icon: Sparkles },
  { key: 'summarization', labelBn: 'সারাংশ তৈরি', icon: FileSearch },
  { key: 'translate_bn_to_en', labelBn: 'বাংলা → ইংরেজি', icon: Languages },
  { key: 'translate_en_to_bn', labelBn: 'ইংরেজি → বাংলা', icon: Languages },
  { key: 'seo_metadata', labelBn: 'SEO মেটাডাটা', icon: Globe },
  { key: 'tag_suggestions', labelBn: 'স্বয়ংক্রিয় ট্যাগ', icon: TagIcon },
  { key: 'duplicate_detection', labelBn: 'ডুপ্লিকেট যাচাই', icon: Search },
  { key: 'content_quality', labelBn: 'মান ও 5W1H যাচাই', icon: CheckCircle2 },
  { key: 'source_verification', labelBn: 'সূত্র ও দাবি যাচাই', icon: ShieldAlert }
];

export function AiArticleAssistantPanel({
  articleId = null,
  formData,
  canApply = true,
  trackedAiFields = [],
  onAcceptIntoDraft,
  onAfterApplySavedArticle
}) {
  const [selectedFeature, setSelectedFeature] = useState('headline_suggestions');
  const [activeGeneration, setActiveGeneration] = useState(null);

  const [runAiAssist, { isLoading: isRunning }] = useRunAiAssistMutation();
  const [applyAiGeneration, { isLoading: isApplying }] = useApplyAiGenerationMutation();
  const [rejectAiGeneration, { isLoading: isRejecting }] = useRejectAiGenerationMutation();
  const [revertModification, { isLoading: isReverting }] = useRevertAiModificationMutation();

  const { data: provenance, refetch: refetchProvenance } = useGetNewsAiProvenanceQuery(articleId, {
    skip: !articleId
  });

  const handleRunFeature = async (featureKey) => {
    setSelectedFeature(featureKey);
    try {
      const result = await runAiAssist({
        feature: featureKey,
        news_id: articleId || undefined,
        title: formData.title || '',
        subheadline: formData.subheadline || '',
        summary: formData.excerpt || '',
        content: formData.content || ''
      }).unwrap();
      setActiveGeneration(result);
    } catch (err) {
      await sweetAlert.error('AI সহায়তা ব্যর্থ', extractApiError(err, 'AI প্রস্তাবনা তৈরি করা যায়নি।'));
    }
  };

  const handleAcceptSuggestion = async (fieldsToApply, fieldLabels) => {
    if (!canApply || !activeGeneration?.id) return;

    // Populate live editor state immediately after explicit human click
    onAcceptIntoDraft?.({
      generationId: activeGeneration.id,
      fields: fieldsToApply,
      modifiedKeys: fieldLabels
    });

    // If editing an already-saved article, persist approved provenance immediately on backend too
    if (articleId) {
      try {
        await applyAiGeneration({
          id: activeGeneration.id,
          target_type: 'news',
          target_id: articleId,
          fields: fieldsToApply,
          human_edited: false,
          review_notes: 'Approved inside Article Editor AI Desk'
        }).unwrap();
        refetchProvenance();
        onAfterApplySavedArticle?.();
        await sweetAlert.success('অনুমোদিত ও ট্র্যাকড!', 'মূল সংস্করণ সংরক্ষণ করে AI প্রস্তাবটি খসড়ায় যুক্ত করা হয়েছে।');
      } catch (err) {
        await sweetAlert.error('প্রয়োগ ব্যর্থ', extractApiError(err, 'AI প্রস্তাব সংরক্ষণ করা যায়নি।'));
      }
    } else {
      await sweetAlert.success('খসড়ায় যুক্ত হয়েছে', 'সংবাদ সংরক্ষণের সময় এই AI সংশোধনী ও মূল সংস্করণ ট্র্যাক করা হবে।');
    }
  };

  const handleReject = async () => {
    if (!activeGeneration?.id) return;
    try {
      const updated = await rejectAiGeneration({
        id: activeGeneration.id,
        reason: 'Dismissed by editor in Article Editor'
      }).unwrap();
      setActiveGeneration(updated);
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'প্রস্তাব প্রত্যাখ্যান করা যায়নি।'));
    }
  };

  const handleRevertModification = async (modId) => {
    try {
      await revertModification(modId).unwrap();
      refetchProvenance();
      onAfterApplySavedArticle?.();
      await sweetAlert.success('পূর্বের মানব সংস্করণে ফেরত', 'AI পরিবর্তনের আগের মূল অংশ পুনরুদ্ধার করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('পুনরুদ্ধার ব্যর্থ', extractApiError(err, 'মূল সংস্করণে ফেরত নেওয়া যায়নি।'));
    }
  };

  const output = activeGeneration?.output_payload || {};

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Safety Guarantee Header */}
      <div className="bg-linear-to-r from-stone-900 to-stone-800 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-sm font-black font-serif-bn flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI বার্তা সহায়তা ডেস্ক (Editorial Safety Mode)</span>
          </h3>
          <p className="text-[11px] text-stone-300 mt-0.5">
            AI কখনোই স্বয়ংক্রিয়ভাবে সংবাদ প্রকাশ করে না — প্রতিটি পরিবর্তন মানব অনুমোদিত ও মূল সংস্করণসহ সংরক্ষিত থাকে।
          </p>
        </div>
        {trackedAiFields.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-bold">
            সক্রিয় AI সহায়তা: {trackedAiFields.join(', ')}
          </span>
        )}
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {EDITOR_AI_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedFeature === tool.key;
          return (
            <button
              key={tool.key}
              type="button"
              disabled={isRunning}
              onClick={() => handleRunFeature(tool.key)}
              className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                isSelected
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50/30'
              }`}
            >
              {isRunning && isSelected ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-rose-700'}`} />
              )}
              <span className="truncate">{tool.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* Active Result Card */}
      {activeGeneration && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4 shadow-xs">
          <AiSafetyNotice generation={activeGeneration} />

          {/* Headline / Subheadline Suggestions */}
          {(activeGeneration.feature_key === 'headline_suggestions' ||
            activeGeneration.feature_key === 'subheadline_suggestions') && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800">প্রস্তাবিত বিকল্পসমূহ (অনুমোদনের জন্য ক্লিক করুন):</h4>
              {(output.suggestions || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-rose-700">
                      {item.label || item.style || `প্রস্তাব ${toBengaliNumber(idx + 1)}`}
                    </span>
                    <p className="text-sm font-bold font-serif-bn text-stone-900">{item.text}</p>
                    {item.rationale && <p className="text-[11px] text-stone-500">{item.rationale}</p>}
                  </div>
                  {canApply && (
                    <button
                      type="button"
                      disabled={isApplying}
                      onClick={() =>
                        handleAcceptSuggestion(
                          activeGeneration.feature_key === 'headline_suggestions'
                            ? { title: item.text }
                            : { subheadline: item.text },
                          [activeGeneration.feature_key === 'headline_suggestions' ? 'title' : 'subheadline']
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>প্রয়োগ করুন</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summarization */}
          {activeGeneration.feature_key === 'summarization' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>সংকলিত সারাংশ (Grounded Summary)</span>
                  <span className="text-[11px] font-mono text-stone-500">
                    {toBengaliNumber(output.summary_word_count || 0)} / {toBengaliNumber(output.original_word_count || 0)} শব্দ
                  </span>
                </div>
                <p className="text-sm font-serif-bn text-stone-900 leading-relaxed">{output.summary}</p>
              </div>
              {canApply && output.summary && (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() => handleAcceptSuggestion({ summary: output.summary }, ['summary'])}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সারাংশ (Excerpt) হিসেবে প্রয়োগ করুন</span>
                </button>
              )}
            </div>
          )}

          {/* Translation */}
          {(activeGeneration.feature_key === 'translate_bn_to_en' ||
            activeGeneration.feature_key === 'translate_en_to_bn') && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <div>
                  <span className="font-bold text-stone-500">অনূদিত শিরোনাম:</span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">{output.translated_title || '—'}</p>
                </div>
                {output.translated_summary && (
                  <div>
                    <span className="font-bold text-stone-500">অনূদিত সারাংশ:</span>
                    <p className="text-stone-800 mt-0.5">{output.translated_summary}</p>
                  </div>
                )}
                {output.translated_content && (
                  <div>
                    <span className="font-bold text-stone-500">অনূদিত মূল পাঠ্য:</span>
                    <p className="text-stone-800 mt-0.5 whitespace-pre-line">{output.translated_content}</p>
                  </div>
                )}
              </div>
              {canApply && (output.translated_title || output.translated_content) && (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() =>
                    handleAcceptSuggestion(
                      {
                        ...(output.translated_title ? { title: output.translated_title } : {}),
                        ...(output.translated_summary ? { summary: output.translated_summary } : {}),
                        ...(output.translated_content ? { content: `<p>${output.translated_content}</p>` } : {})
                      },
                      ['title', 'summary', 'content']
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>অনুবাদ খসড়ায় প্রয়োগ করুন</span>
                </button>
              )}
            </div>
          )}

          {/* SEO Metadata */}
          {activeGeneration.feature_key === 'seo_metadata' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                <p><strong className="text-stone-700">Meta Title ({toBengaliNumber(output.title_length || 0)}):</strong> {output.meta_title}</p>
                <p><strong className="text-stone-700">Meta Description ({toBengaliNumber(output.description_length || 0)}):</strong> {output.meta_description}</p>
                <p className="font-mono"><strong className="text-stone-700 font-sans">Slug:</strong> {output.slug_suggestion}</p>
                {Array.isArray(output.meta_keywords) && output.meta_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {output.meta_keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-stone-200 text-[11px]">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              {canApply && (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() =>
                    handleAcceptSuggestion(
                      {
                        meta_title: output.meta_title,
                        meta_description: output.meta_description,
                        slug: output.slug_suggestion
                      },
                      ['meta_title', 'meta_description', 'slug']
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>SEO মেটাডাটা প্রয়োগ করুন</span>
                </button>
              )}
            </div>
          )}

          {/* Tag Suggestions */}
          {activeGeneration.feature_key === 'tag_suggestions' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(output.recommended_tag_names || []).map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    #{t}
                  </span>
                ))}
              </div>
              {canApply && (output.recommended_tag_names || []).length > 0 && (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() =>
                    handleAcceptSuggestion({ tags: output.recommended_tag_names }, ['tags'])
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>প্রস্তাবিত ট্যাগসমূহ যুক্ত করুন</span>
                </button>
              )}
            </div>
          )}

          {/* Duplicate Detection */}
          {activeGeneration.feature_key === 'duplicate_detection' && (
            <div className="space-y-2 text-xs">
              <p className="font-bold text-stone-800">
                সর্বোচ্চ সাদৃশ্য: {toBengaliNumber(output.highest_similarity_percent || 0)}%{' '}
                {output.is_potential_duplicate ? '— সম্ভাব্য ডুপ্লিকেট সতর্কতা!' : '— উল্লেখযোগ্য ডুপ্লিকেট পাওয়া যায়নি'}
              </p>
              {(output.matches || []).length === 0 ? (
                <p className="text-stone-500">বিদ্যমান সংবাদ তালিকায় উচ্চ সাদৃশ্যপূর্ণ প্রতিবেদন পাওয়া যায়নি।</p>
              ) : (
                <div className="space-y-1.5">
                  {output.matches.map((m) => (
                    <div key={m.news_id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-stone-900">{m.title}</p>
                        <p className="text-[11px] text-stone-500">
                          Status: {m.status} • মিল: {(m.overlapping_terms || []).join(', ')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        m.risk_level === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {toBengaliNumber(m.similarity_percent)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Quality */}
          {activeGeneration.feature_key === 'content_quality' && (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-stone-500 font-semibold">গুণগত মান স্কোর:</span>
                  <p className="text-lg font-black text-stone-900">{toBengaliNumber(output.quality_score || 0)} / ১০০</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white border border-stone-200 font-bold text-stone-800">
                  {output.grade}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(output.five_w_one_h || {}).map(([key, ok]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded-full border font-bold ${
                      ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {key.toUpperCase()}: {ok ? 'উপস্থিত' : 'যাচাই করুন'}
                  </span>
                ))}
              </div>
              {(output.suggestions || []).length > 0 && (
                <ul className="space-y-1">
                  {output.suggestions.map((s, idx) => (
                    <li key={idx} className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950">
                      <strong className="uppercase text-[10px] mr-1">[{s.area}]</strong> {s.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Source Verification */}
          {activeGeneration.feature_key === 'source_verification' && (
            <div className="space-y-2.5 text-xs">
              <p className="font-bold text-stone-800">
                যাচাই অবস্থা: {output.verification_status} • সংযুক্ত সূত্র: {toBengaliNumber(output.linked_sources_count || 0)}টি
              </p>
              {(output.unattributed_claims || []).length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-rose-800">উদ্ধৃতি বা সূত্রবিহীন সংখ্যাসূচক/গুরুত্বপূর্ণ দাবি:</span>
                  {output.unattributed_claims.map((c, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                      <p className="font-medium">“{c.sentence}”</p>
                      <p className="text-[11px] text-rose-700">{c.issue}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dismiss / Reject button */}
          <div className="flex justify-end pt-2 border-t border-stone-100">
            <button
              type="button"
              disabled={isRejecting}
              onClick={handleReject}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
            >
              প্রস্তাব প্রত্যাখ্যান (Dismiss)
            </button>
          </div>
        </div>
      )}

      {/* Saved Article AI Modification & Revert History */}
      {articleId && provenance?.modifications?.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-rose-700" />
              <span>AI সংশোধনী ট্র্যাকিং ও মূল সংস্করণ পুনরুদ্ধার</span>
            </h4>
            <span className="text-[11px] text-stone-500">
              {toBengaliNumber(provenance.modifications.length)}টি রেকর্ড
            </span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {provenance.modifications.map((mod) => (
              <div key={mod.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono text-[10px] font-bold">
                    {mod.field_name}
                  </span>
                  <p className="text-[11px] text-stone-500 line-clamp-1">
                    <strong>মূল (Original):</strong> {mod.original_value || '(খালি)'}
                  </p>
                  <p className="text-[11px] text-stone-800 line-clamp-1">
                    <strong>AI-পরিমার্জিত:</strong> {mod.applied_value || '—'}
                  </p>
                </div>
                {mod.reverted_at ? (
                  <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold shrink-0">
                    পুনরুদ্ধারকৃত
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isReverting}
                    onClick={() => handleRevertModification(mod.id)}
                    className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>মূল সংস্করণে ফেরত</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AiArticleAssistantPanel;


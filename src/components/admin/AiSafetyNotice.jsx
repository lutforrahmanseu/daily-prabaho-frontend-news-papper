import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { getConfidenceMeta, REVIEW_STATUS_META } from '../../utils/aiHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

/**
 * Editorial Safety, Uncertainty & Provenance Banner shown on all Phase 20 AI outputs.
 */
export function AiSafetyNotice({ generation }) {
  if (!generation) return null;

  const confidence = getConfidenceMeta(generation.confidence_level, generation.confidence_score);
  const reviewMeta = REVIEW_STATUS_META[generation.review_status] || REVIEW_STATUS_META.pending_review;
  const uncertaintyNotes = Array.isArray(generation.uncertainty_notes) ? generation.uncertainty_notes : [];
  const safetyWarnings = Array.isArray(generation.safety_warnings) ? generation.safety_warnings : [];

  return (
    <div className="space-y-2.5 bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold ${confidence.badgeClass}`}>
            <Sparkles className="w-3 h-3" />
            <span>{confidence.labelBn}: {toBengaliNumber(confidence.percent)}%</span>
          </span>

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${reviewMeta.badgeClass}`}>
            <UserCheck className="w-3 h-3" />
            <span>{reviewMeta.labelBn}</span>
          </span>

          {generation.grounded_facts_only && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white text-stone-700 border-stone-200 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>প্রদত্ত তথ্য-ভিত্তিক (কোনো অনুমান নয়)</span>
            </span>
          )}

          {generation.contained_confidential && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-200 font-bold">
              <Lock className="w-3 h-3" />
              <span>
                {generation.external_transmission_blocked
                  ? 'গোপনীয়তা সুরক্ষিত (বাহ্যিক LLM ব্লকড)'
                  : 'গোপনীয়তা চিহ্নিত'}
              </span>
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono text-stone-500">
          {generation.provider} / {generation.model}
        </span>
      </div>

      {uncertaintyNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>অনিশ্চয়তা ও মানব যাচাইয়ের নির্দেশনা (Uncertainty & Verification Notice)</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900/90">
            {uncertaintyNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {safetyWarnings.length > 0 && (
        <div className="flex items-start gap-2 text-[11px] text-stone-600 bg-white border border-stone-200 rounded-lg px-2.5 py-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {safetyWarnings.map((warn, idx) => (
              <p key={idx}>{warn}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AiSafetyNotice;


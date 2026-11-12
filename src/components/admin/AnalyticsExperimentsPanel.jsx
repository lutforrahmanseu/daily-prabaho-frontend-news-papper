import React, { useState } from 'react';
import {
  useGetExperimentsListQuery,
  useCreateExperimentMutation,
  useUpdateExperimentStatusMutation,
  useDeclareExperimentWinnerMutation
} from '../../store/api/analyticsApi.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { EXPERIMENT_TYPE_LABELS, FORMAT_DURATION_BN } from '../../utils/analyticsHelpers.js';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';

export function AnalyticsExperimentsPanel({ articles = [], canManageExperiments = false }) {
  const { data: expData, isLoading } = useGetExperimentsListQuery();
  const [createExperiment, { isLoading: isCreating }] = useCreateExperimentMutation();
  const [updateStatus] = useUpdateExperimentStatusMutation();
  const [declareWinner, { isLoading: isDeclaring }] = useDeclareExperimentWinnerMutation();

  const experiments = expData?.items || [];

  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [applyWinnerToArticle, setApplyWinnerToArticle] = useState(true);

  const [form, setForm] = useState({
    name: '',
    experiment_type: 'headline',
    target_news_id: '',
    hypothesis: '',
    controlTitle: '',
    variantBTitle: '',
    controlImage: '',
    variantBImage: '',
    controlLayout: 'standard',
    variantBLayout: 'compact_grid'
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');

    let variants = [];
    if (form.experiment_type === 'headline') {
      variants = [
        {
          variant_key: 'A',
          label: 'মূল শিরোনাম (Control)',
          is_control: true,
          traffic_weight: 50,
          payload: { title: form.controlTitle }
        },
        {
          variant_key: 'B',
          label: 'পরীক্ষামূলক শিরোনাম (Variant B)',
          is_control: false,
          traffic_weight: 50,
          payload: { title: form.variantBTitle }
        }
      ];
    } else if (form.experiment_type === 'featured_image') {
      variants = [
        {
          variant_key: 'A',
          label: 'মূল ছবি (Control)',
          is_control: true,
          traffic_weight: 50,
          payload: { featured_image: form.controlImage }
        },
        {
          variant_key: 'B',
          label: 'বিকল্প ছবি (Variant B)',
          is_control: false,
          traffic_weight: 50,
          payload: { featured_image: form.variantBImage }
        }
      ];
    } else {
      variants = [
        {
          variant_key: 'A',
          label: 'স্ট্যান্ডার্ড লেআউট (Control)',
          is_control: true,
          traffic_weight: 50,
          payload: { layout_mode: form.controlLayout }
        },
        {
          variant_key: 'B',
          label: 'নতুন লেআউট (Variant B)',
          is_control: false,
          traffic_weight: 50,
          payload: { layout_mode: form.variantBLayout }
        }
      ];
    }

    try {
      await createExperiment({
        name: form.name,
        experiment_type: form.experiment_type,
        target_news_id: form.experiment_type === 'homepage_layout' || !form.target_news_id ? null : Number(form.target_news_id),
        hypothesis: form.hypothesis,
        status: 'running',
        variants
      }).unwrap();

      setShowCreate(false);
      setForm({
        name: '',
        experiment_type: 'headline',
        target_news_id: '',
        hypothesis: '',
        controlTitle: '',
        variantBTitle: '',
        controlImage: '',
        variantBImage: '',
        controlLayout: 'standard',
        variantBLayout: 'compact_grid'
      });
      setFeedback('নতুন A/B এক্সপেরিমেন্ট সফলভাবে চালু হয়েছে।');
    } catch (err) {
      setFeedback(err?.data?.message || 'এক্সপেরিমেন্ট তৈরি করতে সমস্যা হয়েছে।');
    }
  };

  const handleToggleStatus = async (exp) => {
    const nextStatus = exp.status === 'running' ? 'paused' : 'running';
    try {
      await updateStatus({ id: exp.id, status: nextStatus }).unwrap();
    } catch (err) {
      setFeedback(err?.data?.message || 'স্ট্যাটাস পরিবর্তন করা যায়নি।');
    }
  };

  const handleDeclareWinner = async (exp, variantId) => {
    try {
      await declareWinner({
        id: exp.id,
        variant_id: variantId,
        apply_to_target: applyWinnerToArticle
      }).unwrap();
      setFeedback('বিজয়ী ভ্যারিয়েন্ট ঘোষণা করা হয়েছে।');
    } catch (err) {
      setFeedback(err?.data?.message || 'বিজয়ী ঘোষণা করা যায়নি।');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-serif-bn flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-rose-700" />
            <span>A/B টেস্টিং ও এক্সপেরিমেন্টেশন স্টুডিও</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            শিরোনাম, ফিচার্ড ছবি ও হোমপেজ লেআউটের পরিসংখ্যানভিত্তিক (Z-Test) তুলনামূলক ফলাফল
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageExperiments && (
            <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyWinnerToArticle}
                onChange={(e) => setApplyWinnerToArticle(e.target.checked)}
                className="rounded border-stone-300 text-rose-700 focus:ring-rose-600"
              />
              <span>বিজয়ী স্বয়ংক্রিয়ভাবে সংবাদে প্রয়োগ করুন</span>
            </label>
          )}
          {canManageExperiments && (
            <button
              type="button"
              onClick={() => setShowCreate((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন A/B পরীক্ষা</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {showCreate && canManageExperiments && (
        <form onSubmit={handleCreateSubmit} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">পরীক্ষার নাম *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: বাজেট সংবাদের শিরোনাম টেস্ট"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">পরীক্ষার ধরন *</label>
              <select
                value={form.experiment_type}
                onChange={(e) => setForm({ ...form, experiment_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="headline">শিরোনাম A/B পরীক্ষা</option>
                <option value="featured_image">ফিচার্ড ছবি A/B পরীক্ষা</option>
                <option value="homepage_layout">হোমপেজ লেআউট A/B পরীক্ষা</option>
              </select>
            </div>

            {form.experiment_type !== 'homepage_layout' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">লক্ষ্য সংবাদ নির্বাচন</label>
                <select
                  value={form.target_news_id}
                  onChange={(e) => {
                    const chosen = articles.find((a) => String(a.id) === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      target_news_id: e.target.value,
                      controlTitle: chosen?.title || prev.controlTitle,
                      controlImage: chosen?.image || prev.controlImage
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">নির্বাচন করুন...</option>
                  {articles.slice(0, 30).map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {form.experiment_type === 'headline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট A (Control শিরোনাম) *</label>
                <input
                  type="text"
                  required
                  value={form.controlTitle}
                  onChange={(e) => setForm({ ...form, controlTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট B (পরীক্ষামূলক শিরোনাম) *</label>
                <input
                  type="text"
                  required
                  value={form.variantBTitle}
                  onChange={(e) => setForm({ ...form, variantBTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
            </div>
          )}

          {form.experiment_type === 'featured_image' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট A (মূল ছবির URL) *</label>
                <input
                  type="text"
                  required
                  value={form.controlImage}
                  onChange={(e) => setForm({ ...form, controlImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট B (বিকল্প ছবির URL) *</label>
                <input
                  type="text"
                  required
                  value={form.variantBImage}
                  onChange={(e) => setForm({ ...form, variantBImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>
            </div>
          )}

          {form.experiment_type === 'homepage_layout' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট A লেআউট</label>
                <select
                  value={form.controlLayout}
                  onChange={(e) => setForm({ ...form, controlLayout: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="standard">স্ট্যান্ডার্ড ক্লাসিক লিড (৭/৫ গ্রিড)</option>
                  <option value="compact_grid">কম্প্যাক্ট হরিজন্টাল কার্ড গ্রিড</option>
                  <option value="visual_lead">বৃহৎ ভিজ্যুয়াল লিড (৮/৪ গ্রিড)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ভ্যারিয়েন্ট B লেআউট</label>
                <select
                  value={form.variantBLayout}
                  onChange={(e) => setForm({ ...form, variantBLayout: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="compact_grid">কম্প্যাক্ট হরিজন্টাল কার্ড গ্রিড</option>
                  <option value="visual_lead">বৃহৎ ভিজ্যুয়াল লিড (৮/৪ গ্রিড)</option>
                  <option value="standard">স্ট্যান্ডার্ড ক্লাসিক লিড</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">হাইপোথিসিস / নোট</label>
            <input
              type="text"
              value={form.hypothesis}
              onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
              placeholder="এই পরিবর্তনের ফলে পাঠকের কী আচরণগত উন্নতি আশা করা হচ্ছে..."
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>এক্সপেরিমেন্ট চালু করুন</span>
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="p-10 text-center text-stone-400 text-xs flex items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>এক্সপেরিমেন্ট লোড হচ্ছে...</span>
        </div>
      ) : experiments.length === 0 ? (
        <div className="p-10 text-center text-stone-400 text-sm bg-white rounded-2xl border border-stone-200">
          এখনো কোনো A/B পরীক্ষা তৈরি করা হয়নি।
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
                      {EXPERIMENT_TYPE_LABELS[exp.experiment_type] || exp.experiment_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        exp.status === 'running'
                          ? 'bg-emerald-100 text-emerald-800'
                          : exp.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {exp.status === 'running'
                        ? 'চলমান'
                        : exp.status === 'completed'
                        ? 'সম্পন্ন'
                        : exp.status === 'paused'
                        ? 'বিরতিতে'
                        : 'খসড়া'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 font-serif-bn mt-1">
                    {exp.name}
                  </h3>
                  {exp.hypothesis && <p className="text-xs text-stone-500 mt-0.5">{exp.hypothesis}</p>}
                  {exp.target_news?.title && (
                    <p className="text-xs text-rose-700 font-semibold mt-1">
                      সংবাদ: {exp.target_news.title}
                    </p>
                  )}
                </div>

                {canManageExperiments && exp.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(exp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 cursor-pointer"
                  >
                    {exp.status === 'running' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>বিরতি দিন</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>চালু করুন</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2 pr-3 font-semibold">ভ্যারিয়েন্ট</th>
                      <th className="py-2 px-3 font-semibold text-right">ইম্প্রেশন</th>
                      <th className="py-2 px-3 font-semibold text-right">ক্লিক</th>
                      <th className="py-2 px-3 font-semibold text-right">CTR</th>
                      <th className="py-2 px-3 font-semibold text-right">কনভার্শন</th>
                      <th className="py-2 px-3 font-semibold text-right">গড় সময়</th>
                      <th className="py-2 px-3 font-semibold text-right">লিফট / কনফিডেন্স</th>
                      {canManageExperiments && <th className="py-2 pl-3 font-semibold text-right">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(exp.variants || []).map((variant) => (
                      <tr key={variant.id} className={variant.is_winner ? 'bg-emerald-50/50' : ''}>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {variant.variant_key}
                            </span>
                            <div>
                              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                                <span>{variant.label}</span>
                                {variant.is_winner && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    <Trophy className="w-3 h-3" /> বিজয়ী
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate max-w-xs">
                                {variant.payload?.title || variant.payload?.layout_mode || variant.payload?.featured_image || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{toBengaliNumber(variant.impressions_count)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{toBengaliNumber(variant.clicks_count)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          {toBengaliNumber(variant.ctr_percent)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {toBengaliNumber(variant.conversions_count)} ({toBengaliNumber(variant.conversion_rate_percent)}%)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {FORMAT_DURATION_BN(variant.avg_engagement_seconds)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {variant.is_control ? (
                            <span className="text-[11px] text-stone-400">Control (বেসলাইন)</span>
                          ) : (
                            <div className="space-y-0.5">
                              <span
                                className={`font-mono font-bold ${
                                  variant.lift_vs_control_percent >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {variant.lift_vs_control_percent >= 0 ? '+' : ''}
                                {toBengaliNumber(variant.lift_vs_control_percent)}% লিফট
                              </span>
                              <div className="text-[11px] text-stone-500 flex items-center justify-end gap-1">
                                {variant.is_statistically_significant && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                )}
                                <span>
                                  {toBengaliNumber(variant.statistical_confidence_percent ?? 0)}% কনফিডেন্স
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        {canManageExperiments && (
                          <td className="py-2.5 pl-3 text-right">
                            {exp.status !== 'completed' ? (
                              <button
                                type="button"
                                disabled={isDeclaring}
                                onClick={() => handleDeclareWinner(exp, variant.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>বিজয়ী ঘোষণা</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


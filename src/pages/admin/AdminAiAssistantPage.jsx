import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Sparkles,
  ShieldCheck,
  History,
  BarChart3,
  Settings,
  Lock,
  Check,
  X,
  RotateCcw,
  Loader2,
  KeyRound,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Mic
} from 'lucide-react';
import {
  useGetAiOverviewQuery,
  useRunAiAssistMutation,
  useGetAiGenerationsQuery,
  useApplyAiGenerationMutation,
  useRejectAiGenerationMutation,
  useGetNewsAiProvenanceQuery,
  useRevertAiModificationMutation,
  useGetAiUsageLogsQuery,
  useGetAiSettingsQuery,
  useUpdateAiSettingsMutation
} from '../../store/api/aiApi.js';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { useGetMediaListQuery } from '../../store/api/mediaApi.js';
import { useGetAdminPodcastsQuery } from '../../store/api/multimediaApi.js';
import {
  AI_FEATURES,
  AI_FEATURE_MAP,
  REVIEW_STATUS_META,
  LOG_STATUS_META,
  PRIVACY_MODE_META,
  getConfidenceMeta
} from '../../utils/aiHelpers.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import AiSafetyNotice from '../../components/admin/AiSafetyNotice.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

export function AdminAiAssistantPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canUse = hasEffectivePermission(authState, adminState, 'ai.use');
  const canApply = hasEffectivePermission(authState, adminState, 'ai.apply');
  const canViewLogs = hasEffectivePermission(authState, adminState, 'ai.logs.view');
  const canManageSettings = hasEffectivePermission(authState, adminState, 'ai.settings.manage');

  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'provenance' | 'logs' | 'settings'
  const [selectedFeature, setSelectedFeature] = useState('headline_suggestions');

  const { data: overview } = useGetAiOverviewQuery();
  const { data: adminNewsRes } = useGetAdminNewsListQuery({ per_page: 40 });
  const { data: mediaRes } = useGetMediaListQuery({ per_page: 30, media_type: 'image' });
  const { data: podcastsRes } = useGetAdminPodcastsQuery({ per_page: 20 });

  const newsItems = useMemo(() => adminNewsRes?.items || [], [adminNewsRes]);
  const mediaItems = useMemo(() => mediaRes?.items || [], [mediaRes]);
  const episodeItems = useMemo(() => {
    const seriesList = podcastsRes?.items || [];
    return seriesList.flatMap((series) =>
      (series.episodes || []).map((ep) => ({
        ...ep,
        seriesTitle: series.title
      }))
    );
  }, [podcastsRes]);

  // Workspace Input State
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputSubheadline, setInputSubheadline] = useState('');
  const [inputSummary, setInputSummary] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [currentGeneration, setCurrentGeneration] = useState(null);

  // Logs Filters
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logFeatureFilter, setLogFeatureFilter] = useState('all');

  // Provenance Selection
  const [provenanceNewsId, setProvenanceNewsId] = useState('');

  // Mutations & Queries
  const [runAiAssist, { isLoading: isRunning }] = useRunAiAssistMutation();
  const [applyAiGeneration, { isLoading: isApplying }] = useApplyAiGenerationMutation();
  const [rejectAiGeneration, { isLoading: isRejecting }] = useRejectAiGenerationMutation();
  const [revertModification, { isLoading: isReverting }] = useRevertAiModificationMutation();
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateAiSettingsMutation();

  const { data: generationsData, refetch: refetchGenerations } = useGetAiGenerationsQuery(
    { per_page: 25 },
    { skip: activeTab !== 'provenance' && activeTab !== 'workspace' }
  );

  const { data: provenanceData, refetch: refetchProvenance } = useGetNewsAiProvenanceQuery(
    provenanceNewsId,
    { skip: !provenanceNewsId }
  );

  const { data: logsData } = useGetAiUsageLogsQuery(
    {
      per_page: 30,
      status: logStatusFilter !== 'all' ? logStatusFilter : undefined,
      feature_key: logFeatureFilter !== 'all' ? logFeatureFilter : undefined
    },
    { skip: !canViewLogs || activeTab !== 'logs' }
  );

  const { data: settingsData } = useGetAiSettingsQuery(undefined, {
    skip: !canManageSettings || activeTab !== 'settings'
  });

  const [settingsForm, setSettingsForm] = useState(null);
  const [newApiKeyInput, setNewApiKeyInput] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);

  useEffect(() => {
    if (settingsData && !settingsForm) {
      setSettingsForm({
        ai_enabled: Boolean(settingsData.ai_enabled),
        provider: settingsData.provider || 'local_safe',
        model: settingsData.model || 'newsflow-editorial-v1',
        api_base_url: settingsData.api_base_url || '',
        temperature: settingsData.temperature ?? 0.2,
        max_tokens: settingsData.max_tokens ?? 1400,
        daily_request_limit: settingsData.daily_request_limit ?? 500,
        daily_token_limit: settingsData.daily_token_limit ?? 250000,
        monthly_budget_usd: settingsData.monthly_budget_usd ?? 50,
        min_confidence_warning_threshold: settingsData.min_confidence_warning_threshold ?? 0.7,
        block_confidential_external_ai: Boolean(settingsData.block_confidential_external_ai),
        redact_pii_before_external_ai: Boolean(settingsData.redact_pii_before_external_ai),
        enabled_features: settingsData.enabled_features || {}
      });
    }
  }, [settingsData, settingsForm]);

  const handleSelectNewsForWorkspace = (newsIdStr) => {
    setSelectedNewsId(newsIdStr);
    const found = newsItems.find((item) => String(item.id) === String(newsIdStr));
    if (found) {
      setInputTitle(found.title || '');
      setInputSubheadline(found.subheadline || '');
      setInputSummary(found.summary || '');
      setInputContent(found.content || '');
    }
  };

  const handleSelectMediaForWorkspace = (mediaIdStr) => {
    setSelectedMediaId(mediaIdStr);
    const found = mediaItems.find((m) => String(m.id) === String(mediaIdStr));
    if (found) {
      setInputTitle(found.title || found.name || '');
      setInputNotes(found.caption || '');
    }
  };

  const handleSelectEpisodeForWorkspace = (episodeIdStr) => {
    setSelectedEpisodeId(episodeIdStr);
    const found = episodeItems.find((e) => String(e.id) === String(episodeIdStr));
    if (found) {
      setInputTitle(found.title || '');
      setInputNotes(found.show_notes || found.summary || '');
    }
  };

  const handleRunFeature = async (e) => {
    e?.preventDefault();
    if (!canUse) return;
    try {
      const payload = {
        feature: selectedFeature,
        news_id: selectedNewsId ? Number(selectedNewsId) : undefined,
        media_id: selectedFeature === 'image_alt_text' && selectedMediaId ? Number(selectedMediaId) : undefined,
        podcast_episode_id:
          selectedFeature === 'transcript_generation' && selectedEpisodeId
            ? Number(selectedEpisodeId)
            : undefined,
        title: inputTitle || undefined,
        subheadline: inputSubheadline || undefined,
        summary: inputSummary || undefined,
        content: inputContent || undefined,
        caption: selectedFeature === 'image_alt_text' ? inputNotes || undefined : undefined,
        audio_notes: selectedFeature === 'transcript_generation' ? inputNotes || undefined : undefined
      };
      const result = await runAiAssist(payload).unwrap();
      setCurrentGeneration(result);
      refetchGenerations();
    } catch (err) {
      await sweetAlert.error('AI সহায়তা ব্যর্থ', extractApiError(err, 'AI অনুরোধ সম্পন্ন করা যায়নি।'));
    }
  };

  const handleApproveAndApply = async (fieldsPayload, targetTypeOverride = null, targetIdOverride = null) => {
    if (!canApply || !currentGeneration?.id) return;
    try {
      await applyAiGeneration({
        id: currentGeneration.id,
        target_type: targetTypeOverride || currentGeneration.target_type || undefined,
        target_id: targetIdOverride || currentGeneration.target_id || undefined,
        fields: fieldsPayload,
        review_notes: 'Approved via Newsroom AI Studio'
      }).unwrap();
      refetchGenerations();
      if (provenanceNewsId) refetchProvenance();
      await sweetAlert.success(
        'অনুমোদিত ও সংরক্ষিত!',
        'মূল সংস্করণ সুরক্ষিত রেখে AI প্রস্তাবটি প্রয়োগ করা হয়েছে (স্বয়ংক্রিয় প্রকাশ বন্ধ)।'
      );
    } catch (err) {
      await sweetAlert.error('প্রয়োগ ব্যর্থ', extractApiError(err, 'AI প্রস্তাব প্রয়োগ করা যায়নি।'));
    }
  };

  const handleRejectGeneration = async (genId) => {
    try {
      await rejectAiGeneration({ id: genId, reason: 'Rejected in AI Governance Queue' }).unwrap();
      if (currentGeneration?.id === genId) {
        setCurrentGeneration((prev) => ({ ...prev, review_status: 'rejected' }));
      }
      refetchGenerations();
      await sweetAlert.success('প্রত্যাখ্যাত', 'AI প্রস্তাবটি প্রত্যাখ্যান করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'প্রস্তাব প্রত্যাখ্যান করা যায়নি।'));
    }
  };

  const handleRevertModification = async (modId) => {
    try {
      await revertModification(modId).unwrap();
      if (provenanceNewsId) refetchProvenance();
      await sweetAlert.success('পুনরুদ্ধার সম্পন্ন!', 'মূল মানব সংস্করণটি পুনরায় সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('পুনরুদ্ধার ব্যর্থ', extractApiError(err, 'মূল সংস্করণে ফেরত নেওয়া যায়নি।'));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!canManageSettings || !settingsForm) return;
    try {
      const payload = {
        ...settingsForm,
        ...(newApiKeyInput.trim() ? { api_key: newApiKeyInput.trim() } : {}),
        ...(clearApiKey ? { clear_api_key: true } : {})
      };
      const updated = await updateSettings(payload).unwrap();
      setNewApiKeyInput('');
      setClearApiKey(false);
      setSettingsForm({
        ai_enabled: Boolean(updated.ai_enabled),
        provider: updated.provider,
        model: updated.model,
        api_base_url: updated.api_base_url || '',
        temperature: updated.temperature,
        max_tokens: updated.max_tokens,
        daily_request_limit: updated.daily_request_limit,
        daily_token_limit: updated.daily_token_limit,
        monthly_budget_usd: updated.monthly_budget_usd,
        min_confidence_warning_threshold: updated.min_confidence_warning_threshold,
        block_confidential_external_ai: Boolean(updated.block_confidential_external_ai),
        redact_pii_before_external_ai: Boolean(updated.redact_pii_before_external_ai),
        enabled_features: updated.enabled_features || {}
      });
      await sweetAlert.success('AI সেটিংস সংরক্ষিত!', 'নিরাপত্তা নীতি ও প্রোভাইডার সেটিংস সফলভাবে হালনাগাদ হয়েছে।');
    } catch (err) {
      await sweetAlert.error('সংরক্ষণ ব্যর্থ', extractApiError(err, 'AI সেটিংস হালনাগাদ করা যায়নি।'));
    }
  };

  const activeFeatureMeta = AI_FEATURE_MAP[selectedFeature] || AI_FEATURES[0];
  const output = currentGeneration?.output_payload || {};

  return (
    <div className="space-y-6">
      {/* Page Hero */}
      <div className="bg-linear-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phase 20 • AI বার্তাকক্ষ সহায়তা ও সম্পাদকীয় সুরক্ষা</span>
          </div>
          <h1 className="text-2xl font-black font-serif-bn">AI নিউজরুম অ্যাসিস্ট্যান্ট ও গভার্নেন্স স্টুডিও</h1>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            ১২টি সাংবাদিকতা সহায়ক AI টুল, কঠোর গোপনীয়তা ফায়ারওয়াল, বাধ্যতামূলক মানব অনুমোদন, মূল সংস্করণ সংরক্ষণ এবং বিস্তারিত ব্যবহার অডিট লগ।
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 text-xs space-y-1 min-w-[230px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">সক্রিয় ইঞ্জিন:</span>
            <strong className="font-mono text-amber-300">{overview?.provider || 'local_safe'}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">আজকের অনুরোধ:</span>
            <strong className="font-mono">
              {toBengaliNumber(overview?.today_requests || 0)} / {toBengaliNumber(overview?.daily_request_limit || 500)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-300 font-bold">
            <span>স্বয়ংক্রিয় প্রকাশনা:</span>
            <span>সম্পূর্ণ নিষিদ্ধ (Locked Off)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'workspace' ? 'bg-rose-700 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI ওয়ার্কস্পেস (১২ টুল)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('provenance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'provenance' ? 'bg-rose-700 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>প্রভেন্যান্স ও মূল সংস্করণ</span>
        </button>

        {canViewLogs && (
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'logs' ? 'bg-rose-700 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>ব্যবহার লগ ও কোটা</span>
          </button>
        )}

        {canManageSettings && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-rose-700 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>AI সেটিংস ও নিরাপত্তা</span>
          </button>
        )}
      </div>

      {/* TAB 1: WORKSPACE */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 12 AI Tools Selector */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
              ১২টি AI নিউজরুম ফিচার
            </h2>
            <div className="space-y-1.5">
              {AI_FEATURES.map((feat) => {
                const isSelected = selectedFeature === feat.key;
                const isEnabled = overview?.enabled_features?.[feat.key] !== false;
                return (
                  <button
                    key={feat.key}
                    type="button"
                    onClick={() => setSelectedFeature(feat.key)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-stone-800 border-stone-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{feat.nameBn}</span>
                      {!isEnabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">বন্ধ</span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 line-clamp-2 ${isSelected ? 'text-rose-100' : 'text-stone-500'}`}>
                      {feat.descriptionBn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive Runner + Result */}
          <div className="lg:col-span-8 space-y-5">
            <form onSubmit={handleRunFeature} className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-black font-serif-bn text-stone-900">{activeFeatureMeta.nameBn}</h2>
                  <p className="text-xs text-stone-500">{activeFeatureMeta.nameEn} — {activeFeatureMeta.descriptionBn}</p>
                </div>
              </div>

              {/* Contextual Entity Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-rose-700" />
                    <span>সংবাদ নির্বাচন করুন (ঐচ্ছিক)</span>
                  </label>
                  <select
                    value={selectedNewsId}
                    onChange={(e) => handleSelectNewsForWorkspace(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="">কাস্টম পাঠ্য / খালি ফর্ম</option>
                    {newsItems.map((n) => (
                      <option key={n.id} value={n.id}>
                        [{n.status}] {n.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFeature === 'image_alt_text' && (
                  <div>
                    <label className="font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-rose-700" />
                      <span>মিডিয়া ছবি নির্বাচন করুন</span>
                    </label>
                    <select
                      value={selectedMediaId}
                      onChange={(e) => handleSelectMediaForWorkspace(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="">ছবি নির্বাচন করুন...</option>
                      {mediaItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title || m.name} ({m.visibility})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedFeature === 'transcript_generation' && (
                  <div>
                    <label className="font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-rose-700" />
                      <span>পডকাস্ট পর্ব নির্বাচন করুন</span>
                    </label>
                    <select
                      value={selectedEpisodeId}
                      onChange={(e) => handleSelectEpisodeForWorkspace(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="">পর্ব নির্বাচন করুন...</option>
                      {episodeItems.map((ep) => (
                        <option key={ep.id} value={ep.id}>
                          {ep.seriesTitle} — পর্ব {ep.episode_number}: {ep.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">শিরোনাম (Headline / Title)</label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="সংবাদের শিরোনাম বা বিষয় লিখুন..."
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                {selectedFeature !== 'image_alt_text' && selectedFeature !== 'transcript_generation' ? (
                  <>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">সারাংশ / উপ-শিরোনাম</label>
                      <input
                        type="text"
                        value={inputSummary}
                        onChange={(e) => setInputSummary(e.target.value)}
                        placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)..."
                        className="w-full px-3.5 py-2 border border-stone-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">মূল প্রতিবেদন বা অনুচ্ছেদ (Article Body / Text)</label>
                      <textarea
                        rows={5}
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder="প্রতিবেদনের মূল লেখা এখানে দিন — AI কেবল প্রদত্ত তথ্যের ওপর ভিত্তি করে বিশ্লেষণ করবে..."
                        className="w-full px-3.5 py-2 border border-stone-300 rounded-xl font-serif-bn"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {selectedFeature === 'image_alt_text'
                        ? 'ছবির ক্যাপশন / দৃশ্যমান প্রসঙ্গ (Image Context)'
                        : 'অডিও বা পডকাস্ট নোটস / সংলাপ (Audio Show Notes)'}
                    </label>
                    <textarea
                      rows={4}
                      value={inputNotes}
                      onChange={(e) => setInputNotes(e.target.value)}
                      placeholder="ছবি বা অডিওর বিবরণ/শো-নোট দিন..."
                      className="w-full px-3.5 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canUse || isRunning}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isRunning ? 'বিশ্লেষণ চলছে...' : 'AI সহায়তা চালান (Generate Suggestion)'}</span>
                </button>
              </div>
            </form>

            {/* Current Generation Display */}
            {currentGeneration && (
              <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-xs">
                <AiSafetyNotice generation={currentGeneration} />

                <pre className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto max-h-80">
                  {JSON.stringify(output, null, 2)}
                </pre>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  {canApply && currentGeneration.review_status !== 'rejected' && (
                    <div className="flex flex-wrap gap-2">
                      {currentGeneration.feature_key === 'headline_suggestions' && output.suggestions?.[0]?.text && (
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={() => handleApproveAndApply({ title: output.suggestions[0].text })}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>১ম শিরোনাম অনুমোদন ও প্রয়োগ</span>
                        </button>
                      )}
                      {currentGeneration.feature_key === 'summarization' && output.summary && (
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={() => handleApproveAndApply({ summary: output.summary })}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>সারাংশ অনুমোদন ও প্রয়োগ</span>
                        </button>
                      )}
                      {currentGeneration.feature_key === 'image_alt_text' && output.alt_text && (
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={() =>
                            handleApproveAndApply(
                              { alt_text: output.alt_text },
                              'media',
                              selectedMediaId ? Number(selectedMediaId) : undefined
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>মিডিয়ায় Alt Text প্রয়োগ করুন</span>
                        </button>
                      )}
                      {currentGeneration.feature_key === 'transcript_generation' && output.transcript && selectedEpisodeId && (
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={() =>
                            handleApproveAndApply(
                              { transcript: output.transcript },
                              'podcast_episode',
                              Number(selectedEpisodeId)
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>পডকাস্টে খসড়া ট্রান্সক্রিপ্ট প্রয়োগ</span>
                        </button>
                      )}
                    </div>
                  )}

                  {canApply && currentGeneration.review_status === 'pending_review' && (
                    <button
                      type="button"
                      disabled={isRejecting}
                      onClick={() => handleRejectGeneration(currentGeneration.id)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>প্রত্যাখ্যান করুন</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROVENANCE & REVISIONS */}
      {activeTab === 'provenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
            <h2 className="text-sm font-black font-serif-bn text-stone-900">সাম্প্রতিক AI প্রস্তাবনা ও অনুমোদনের সারি</h2>
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto">
              {(generationsData?.items || []).map((gen) => {
                const feat = AI_FEATURE_MAP[gen.feature_key];
                const revMeta = REVIEW_STATUS_META[gen.review_status] || REVIEW_STATUS_META.pending_review;
                const conf = getConfidenceMeta(gen.confidence_level, gen.confidence_score);
                return (
                  <div key={gen.id} className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-stone-900">{feat?.nameBn || gen.feature_key}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${conf.badgeClass}`}>
                          {toBengaliNumber(conf.percent)}%
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${revMeta.badgeClass}`}>
                          {revMeta.labelBn}
                        </span>
                        {gen.contained_confidential && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>গোপনীয় সুরক্ষিত</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      ব্যবহারকারী: {gen.user?.name || '—'} • ইঞ্জিন: {gen.provider} ({gen.model}) • {formatBengaliRelativeTime(gen.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-5 space-y-4">
            <h2 className="text-sm font-black font-serif-bn text-stone-900">সংবাদের মূল সংস্করণ ও AI সংশোধনী ট্র্যাকিং</h2>
            <select
              value={provenanceNewsId}
              onChange={(e) => setProvenanceNewsId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            >
              <option value="">সংবাদ নির্বাচন করে পরিবর্তন ইতিহাস দেখুন...</option>
              {newsItems.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} {n.aiAssisted ? '✨(AI-Assisted)' : ''}
                </option>
              ))}
            </select>

            {provenanceData && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <span>AI-সহায়তা প্রাপ্ত:</span>
                  <strong className={provenanceData.ai_assisted ? 'text-amber-700' : 'text-stone-600'}>
                    {provenanceData.ai_assisted ? 'হ্যাঁ (চিহ্নিত ও ট্র্যাকড)' : 'না'}
                  </strong>
                </div>

                {(provenanceData.modifications || []).length === 0 ? (
                  <p className="text-stone-400 italic py-4 text-center">এই সংবাদে এখনো কোনো AI-পরিমার্জনা প্রয়োগ করা হয়নি।</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {provenanceData.modifications.map((mod) => (
                      <div key={mod.id} className="p-3 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-rose-700">{mod.field_name}</span>
                          {mod.reverted_at ? (
                            <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-bold">
                              পূর্বের মূল সংস্করণে ফেরতকৃত
                            </span>
                          ) : canApply ? (
                            <button
                              type="button"
                              disabled={isReverting}
                              onClick={() => handleRevertModification(mod.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>মূল সংস্করণে ফেরত</span>
                            </button>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-stone-500"><strong>মূল (Original):</strong> {mod.original_value || '(খালি)'}</p>
                        <p className="text-[11px] text-stone-800"><strong>প্রয়োগকৃত:</strong> {mod.applied_value || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USAGE LOGS & QUOTA */}
      {activeTab === 'logs' && canViewLogs && (
        <div className="space-y-5">
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-500 font-bold">আজকের অনুরোধ / সীমা</span>
              <p className="text-xl font-black text-stone-900 mt-1">
                {toBengaliNumber(logsData?.analytics?.today_requests || 0)} / {toBengaliNumber(logsData?.analytics?.daily_request_limit || 500)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-500 font-bold">মোট টোকেন ব্যবহার</span>
              <p className="text-xl font-black text-stone-900 mt-1">
                {toBengaliNumber(logsData?.analytics?.total_tokens || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-500 font-bold">গোপনীয় সুরক্ষিত কল</span>
              <p className="text-xl font-black text-rose-700 mt-1">
                {toBengaliNumber(logsData?.analytics?.confidential_protected_count || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-500 font-bold">অনুমোদিত / প্রত্যাখ্যাত</span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {toBengaliNumber(logsData?.analytics?.review_breakdown?.approved_or_applied || 0)} / {toBengaliNumber(logsData?.analytics?.review_breakdown?.rejected || 0)}
              </p>
            </div>
          </div>

          {/* Filter & Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={logFeatureFilter}
                onChange={(e) => setLogFeatureFilter(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
              >
                <option value="all">সকল AI ফিচার</option>
                {AI_FEATURES.map((f) => (
                  <option key={f.key} value={f.key}>{f.nameBn}</option>
                ))}
              </select>
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
              >
                <option value="all">সকল স্ট্যাটাস</option>
                <option value="completed">সম্পন্ন</option>
                <option value="blocked_confidential">গোপনীয়তায় ব্লকড</option>
                <option value="blocked_quota">কোটায় ব্লকড</option>
                <option value="blocked_disabled">ফিচার বন্ধ</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2 pr-3">ফিচার</th>
                    <th className="py-2 pr-3">সাংবাদিক / সম্পাদক</th>
                    <th className="py-2 pr-3">প্রোভাইডার</th>
                    <th className="py-2 pr-3">গোপনীয়তা মোড</th>
                    <th className="py-2 pr-3">টোকেন</th>
                    <th className="py-2 pr-3">স্ট্যাটাস</th>
                    <th className="py-2">সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(logsData?.items || []).map((log) => {
                    const statusMeta = LOG_STATUS_META[log.status] || { labelBn: log.status, badgeClass: 'bg-stone-100' };
                    const privMeta = PRIVACY_MODE_META[log.privacy_mode] || { labelBn: log.privacy_mode, badgeClass: 'bg-stone-100' };
                    return (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="py-2.5 pr-3 font-bold text-stone-800">
                          {AI_FEATURE_MAP[log.feature_key]?.nameBn || log.feature_key}
                        </td>
                        <td className="py-2.5 pr-3">{log.user?.name || '—'}</td>
                        <td className="py-2.5 pr-3 font-mono text-[11px]">{log.provider}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${privMeta.badgeClass}`}>
                            {privMeta.labelBn}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-mono">{toBengaliNumber(log.total_tokens || 0)}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta.badgeClass}`}>
                            {statusMeta.labelBn}
                          </span>
                        </td>
                        <td className="py-2.5 text-stone-500">{formatBengaliRelativeTime(log.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI SETTINGS & SAFETY */}
      {activeTab === 'settings' && canManageSettings && settingsForm && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4" />
              <span>সম্পাদকীয় নিরাপত্তা নিশ্চয়তা (Immutable Editorial Safety Policies)</span>
            </div>
            <p className="text-amber-900/90">
              সকল API Key শুধুমাত্র সার্ভারে এনক্রিপ্টেড অবস্থায় সংরক্ষিত থাকে — ফ্রন্টএন্ডে কখনোই প্রদর্শিত বা পাঠানো হয় না। স্বয়ংক্রিয় সংবাদ প্রকাশনা স্থায়ীভাবে নিষ্ক্রিয় রাখা হয়েছে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
              <div>
                <strong className="text-stone-900">AI অ্যাসিস্ট্যান্ট চালু (Global Enable)</strong>
                <p className="text-[11px] text-stone-500">বন্ধ করলে পুরো বার্তাকক্ষে AI অনুরোধ স্থগিত থাকবে</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.ai_enabled}
                onChange={(e) => setSettingsForm({ ...settingsForm, ai_enabled: e.target.checked })}
                className="w-4 h-4 text-rose-700"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
              <div>
                <strong className="text-stone-900">গোপনীয় ডেটায় বাহ্যিক AI ব্লক করুন</strong>
                <p className="text-[11px] text-stone-500">এমবার্গো, প্রাইভেট মিডিয়া বা গোপনীয় সূত্র ক্লাউড API-তে পাঠানো যাবে না</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.block_confidential_external_ai}
                onChange={(e) => setSettingsForm({ ...settingsForm, block_confidential_external_ai: e.target.checked })}
                className="w-4 h-4 text-rose-700"
              />
            </label>

            <div>
              <label className="block font-bold text-stone-700 mb-1">AI প্রোভাইডার নির্বাচন</label>
              <select
                value={settingsForm.provider}
                onChange={(e) => setSettingsForm({ ...settingsForm, provider: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
              >
                <option value="local_safe">NewsFlow Local Safe NLP Engine (No External API)</option>
                <option value="openai">OpenAI (Server-Side Only)</option>
                <option value="gemini">Google Gemini (Server-Side Only)</option>
                <option value="anthropic">Anthropic Claude (Server-Side Only)</option>
                <option value="custom_openai">Custom OpenAI-Compatible Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">মডেলের নাম (Model)</label>
              <input
                type="text"
                value={settingsForm.model}
                onChange={(e) => setSettingsForm({ ...settingsForm, model: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-rose-700" />
                <span>সার্ভার-সাইড API Key (এনক্রিপ্টেড সংরক্ষণ)</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newApiKeyInput}
                onChange={(e) => setNewApiKeyInput(e.target.value)}
                placeholder={
                  settingsData?.has_api_key
                    ? `সংরক্ষিত কী: ${settingsData.api_key_preview} (পরিবর্তনের জন্য নতুন লিখুন)`
                    : 'নতুন API Key লিখুন (ফাঁকা রাখলে লোকাল ইঞ্জিন চলবে)'
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
              />
              {settingsData?.has_api_key && (
                <label className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-rose-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearApiKey}
                    onChange={(e) => setClearApiKey(e.target.checked)}
                  />
                  <span>সংরক্ষিত API Key মুছে ফেলুন</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">দৈনিক অনুরোধ সীমা</label>
                <input
                  type="number"
                  min={1}
                  value={settingsForm.daily_request_limit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, daily_request_limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">দৈনিক টোকেন সীমা</label>
                <input
                  type="number"
                  min={500}
                  value={settingsForm.daily_token_limit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, daily_token_limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Per-Feature Toggles */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-800">ফিচারভিত্তিক সক্রিয়/নিষ্ক্রিয় নিয়ন্ত্রণ (১২টি ফিচার)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {AI_FEATURES.map((feat) => (
                <label
                  key={feat.key}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs cursor-pointer"
                >
                  <span className="font-semibold text-stone-800">{feat.nameBn}</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.enabled_features?.[feat.key] !== false}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        enabled_features: {
                          ...settingsForm.enabled_features,
                          [feat.key]: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 text-rose-700"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
            >
              {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>AI গভার্নেন্স সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminAiAssistantPage;


import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Clapperboard,
  Plus,
  Search,
  Sparkles,
  Captions,
  Mic,
  Palette,
  Send,
  BarChart3,
  Settings,
  Trash2,
  Upload,
  ExternalLink,
  X,
  Loader2,
  Film,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useGetCreatorStudioOverviewQuery,
  useGetEligibleStudioArticlesQuery,
  useGetCreatorProjectsQuery,
  useGetCreatorProjectDetailQuery,
  useCreateCreatorProjectMutation,
  useUpdateCreatorProjectMutation,
  useDeleteCreatorProjectMutation,
  useGetCreatorStudioSettingsQuery,
} from '../../../store/api/creatorStudioApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { STUDIO_STATUS_META } from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import ScriptGeneratorTab from './ScriptGeneratorTab.jsx';
import SubtitleStudioTab from './SubtitleStudioTab.jsx';
import VoiceoverStudioTab from './VoiceoverStudioTab.jsx';
import SocialContentStudioTab from './SocialContentStudioTab.jsx';
import PublishWorkflowTab from './PublishWorkflowTab.jsx';
import CreatorAnalyticsTab from './CreatorAnalyticsTab.jsx';
import StudioSettingsTab from './StudioSettingsTab.jsx';

export default function AdminCreatorStudioPage() {
  const authState = useSelector((s) => s.auth);
  const adminState = useSelector((s) => s.admin);

  const canCreate = hasEffectivePermission(authState, adminState, 'creator_studio.create');
  const canApproveScript = hasEffectivePermission(authState, adminState, 'creator_studio.scripts.approve');
  const canPublish = hasEffectivePermission(authState, adminState, 'creator_studio.publish');
  const canAuthorizeExternal = hasEffectivePermission(authState, adminState, 'creator_studio.publish.external');
  const canDelete = hasEffectivePermission(authState, adminState, 'creator_studio.delete');
  const canViewAnalytics = hasEffectivePermission(authState, adminState, 'creator_studio.analytics.view');
  const canManageSettings = hasEffectivePermission(authState, adminState, 'creator_studio.settings.manage');

  const [activeTab, setActiveTab] = useState('script');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectLang, setNewProjectLang] = useState('bn');
  const [newProjectVideo, setNewProjectVideo] = useState(null);

  const { data: overview } = useGetCreatorStudioOverviewQuery();
  const { data: studioSettings } = useGetCreatorStudioSettingsQuery();
  const { data: projectsRes, isLoading: isLoadingProjects } = useGetCreatorProjectsQuery({
    status: statusFilter,
    language: languageFilter,
    search: searchQuery || undefined,
    per_page: 25,
  });

  const projects = projectsRes?.items || [];

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: activeProject, isFetching: isFetchingDetail } = useGetCreatorProjectDetailQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });

  const { data: eligibleRes } = useGetEligibleStudioArticlesQuery(
    { search: articleSearch || undefined, per_page: 20 },
    { skip: !isCreateModalOpen }
  );
  const eligibleArticles = eligibleRes?.items || [];

  const [createProject, { isLoading: isCreatingProject }] = useCreateCreatorProjectMutation();
  const [updateProject, { isLoading: isUpdatingVideo }] = useUpdateCreatorProjectMutation();
  const [deleteProject] = useDeleteCreatorProjectMutation();

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!selectedArticleId) {
      sweetAlert.warning('সংবাদ নির্বাচন করুন', 'অনুগ্রহ করে একটি অনুমোদিত সংবাদ নির্বাচন করুন।');
      return;
    }

    try {
      let payload;
      if (newProjectVideo) {
        const fd = new FormData();
        fd.append('news_id', String(selectedArticleId));
        if (newProjectTitle.trim()) fd.append('title', newProjectTitle.trim());
        fd.append('language', newProjectLang);
        fd.append('target_formats[]', 'vertical_video');
        fd.append('target_formats[]', 'quote_card');
        fd.append('target_formats[]', 'thumbnail');
        fd.append('video_file', newProjectVideo);
        payload = fd;
      } else {
        payload = {
          news_id: Number(selectedArticleId),
          ...(newProjectTitle.trim() ? { title: newProjectTitle.trim() } : {}),
          language: newProjectLang,
          target_formats: ['vertical_video', 'quote_card', 'thumbnail'],
        };
      }

      const created = await createProject(payload).unwrap();
      const createdId = created?.id;
      if (createdId) setSelectedProjectId(createdId);
      setIsCreateModalOpen(false);
      setSelectedArticleId('');
      setNewProjectTitle('');
      setNewProjectVideo(null);
      setActiveTab('script');
      sweetAlert.toast('ক্রিয়েটর স্টুডিও প্রজেক্ট তৈরি হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('প্রজেক্ট তৈরি ব্যর্থ', extractApiError(err));
    }
  };

  const handleReplaceSourceVideo = async (file) => {
    if (!file || !activeProject) return;
    try {
      const fd = new FormData();
      fd.append('_method', 'PUT');
      fd.append('video_file', file);
      await updateProject({ id: activeProject.id, payload: fd }).unwrap();
      sweetAlert.toast('সোর্স ভিডিও আপলোড সম্পন্ন হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('ভিডিও আপলোড ব্যর্থ', extractApiError(err));
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject) return;
    const confirmed = await sweetAlert.confirm(
      'প্রজেক্ট আর্কাইভ করবেন?',
      `"${activeProject.title}" প্রজেক্টটি তালিকা থেকে আর্কাইভ করা হবে।`
    );
    if (!confirmed) return;

    try {
      await deleteProject(activeProject.id).unwrap();
      setSelectedProjectId(null);
      sweetAlert.toast('প্রজেক্ট আর্কাইভ হয়েছে', 'info');
    } catch (err) {
      sweetAlert.error('আর্কাইভ ব্যর্থ', extractApiError(err));
    }
  };

  const counts = overview?.counts || {};
  const capabilities = overview?.capabilities || {};

  const tabs = [
    { id: 'script', label: '১. ভিডিও স্ক্রিপ্ট', icon: Sparkles, visible: true },
    { id: 'subtitles', label: '২. সাবটাইটেল স্টুডিও', icon: Captions, visible: true },
    { id: 'voiceover', label: '৩. ভয়েসওভার ও TTS', icon: Mic, visible: true },
    { id: 'social', label: '৪. সোশ্যাল কার্ড ও লেআউট', icon: Palette, visible: true },
    { id: 'publish', label: '৫. পাবলিশিং ও শিডিউল', icon: Send, visible: true },
    { id: 'analytics', label: '৬. অ্যানালিটিক্স', icon: BarChart3, visible: canViewAnalytics },
    { id: 'settings', label: '৭. সেটিংস ও টেমপ্লেট', icon: Settings, visible: true },
  ].filter((t) => t.visible);

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
              <Clapperboard className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">নিউজ ক্রিয়েটর স্টুডিও (News Creator Studio)</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                অনুমোদিত সংবাদ থেকে শর্ট ভিডিও স্ক্রিপ্ট, বাংলা/ইংরেজি সাবটাইটেল, ভয়েসওভার ও সোশ্যাল কার্ড তৈরি ও প্রকাশনা
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200">
              মোট প্রজেক্ট: {counts.total_projects ?? 0}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
              পর্যালোচনায়: {counts.in_review ?? 0}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
              প্রকাশিত: {counts.published ?? 0}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200">
              ভিউ: {counts.total_views ?? 0} • শেয়ার: {counts.total_shares ?? 0}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {capabilities.ffmpeg_available ? 'FFmpeg সক্রিয়' : 'Safe Built-In Engine'}
            </span>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
          >
            <Plus className="w-4 h-4" /> নতুন স্টুডিও প্রজেক্ট
          </button>
        )}
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Project Selector Sidebar */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-3 self-start">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">স্টুডিও প্রজেক্ট তালিকা</h2>
            <span className="text-[11px] font-semibold text-slate-400">{projects.length}টি</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রজেক্ট খুঁজুন..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">সকল অবস্থা</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">সকল ভাষা</option>
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
              <option value="bilingual">দ্বিভাষিক</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {isLoadingProjects ? (
              <div className="py-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
            ) : !projects.length ? (
              <div className="py-8 text-center text-xs text-slate-400">কোনো প্রজেক্ট নেই।</div>
            ) : (
              projects.map((p) => {
                const isSelected = Number(selectedProjectId) === Number(p.id);
                const meta = STUDIO_STATUS_META[p.status] || STUDIO_STATUS_META.draft;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}>
                        {meta.en}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{p.language}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2">{p.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      স্ক্রিপ্ট {p.scripts_count || 0} • কার্ড {p.social_assets_count || 0} • ভিউ {p.views_count || 0}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Studio Tabs Workspace */}
        <div className="xl:col-span-9 space-y-5">
          {/* Selected Project Banner */}
          {activeProject && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">{activeProject.title}</h3>
                  {isFetchingDetail && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  মূল সংবাদ #{activeProject.news_id}: {activeProject.news?.title || '—'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canCreate && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {isUpdatingVideo
                      ? 'আপলোড হচ্ছে...'
                      : activeProject.source_video_media_id
                      ? 'সোর্স ভিডিও পরিবর্তন'
                      : 'সোর্স ভিডিও আপলোড'}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleReplaceSourceVideo(e.target.files[0])}
                    />
                  </label>
                )}

                {activeProject.status === 'published' && (
                  <Link
                    to={`/creator-studio/${activeProject.uuid}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> পাবলিক লিংক
                  </Link>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> আর্কাইভ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Strip */}
          <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          {activeTab === 'analytics' ? (
            <CreatorAnalyticsTab project={activeProject} />
          ) : activeTab === 'settings' ? (
            <StudioSettingsTab canManageSettings={canManageSettings} />
          ) : !activeProject ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
              <Clapperboard className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">কোনো স্টুডিও প্রজেক্ট নির্বাচিত নেই</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                বাম পাশের তালিকা থেকে একটি প্রজেক্ট নির্বাচন করুন অথবা অনুমোদিত সংবাদ থেকে নতুন ভিডিও ও সোশ্যাল কনটেন্ট প্রজেক্ট তৈরি করুন।
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" /> নতুন প্রজেক্ট তৈরি করুন
                </button>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'script' && (
                <ScriptGeneratorTab
                  project={activeProject}
                  canCreate={canCreate}
                  canApproveScript={canApproveScript}
                />
              )}
              {activeTab === 'subtitles' && (
                <SubtitleStudioTab
                  project={activeProject}
                  canCreate={canCreate}
                  canApprove={canApproveScript}
                />
              )}
              {activeTab === 'voiceover' && (
                <VoiceoverStudioTab
                  project={activeProject}
                  studioSettings={studioSettings}
                  canCreate={canCreate}
                  canApprove={canApproveScript}
                />
              )}
              {activeTab === 'social' && (
                <SocialContentStudioTab
                  project={activeProject}
                  canCreate={canCreate}
                  canApprove={canApproveScript}
                />
              )}
              {activeTab === 'publish' && (
                <PublishWorkflowTab
                  project={activeProject}
                  studioSettings={studioSettings}
                  canCreate={canCreate}
                  canApprove={canApproveScript}
                  canPublish={canPublish}
                  canAuthorizeExternal={canAuthorizeExternal}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Create New Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">অনুমোদিত সংবাদ থেকে নতুন স্টুডিও প্রজেক্ট</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">সংবাদ খুঁজুন (Approved / Published)</label>
                <input
                  type="text"
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="শিরোনাম লিখে সার্চ করুন..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 mb-2"
                />
                <select
                  required
                  value={selectedArticleId}
                  onChange={(e) => {
                    setSelectedArticleId(e.target.value);
                    const art = eligibleArticles.find((a) => String(a.id) === String(e.target.value));
                    if (art && !newProjectTitle) setNewProjectTitle(art.title);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="">-- অনুমোদিত সংবাদ নির্বাচন করুন --</option>
                  {eligibleArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      #{art.id} • [{art.status}] {art.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">স্টুডিও প্রজেক্ট শিরোনাম</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="সংবাদের শিরোনাম স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মূল ভাষা</label>
                  <select
                    value={newProjectLang}
                    onChange={(e) => setNewProjectLang(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="bn">বাংলা (Bangla)</option>
                    <option value="en">English</option>
                    <option value="bilingual">দ্বিভাষিক (Bilingual)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সোর্স ভিডিও আপলোড (ঐচ্ছিক)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setNewProjectVideo(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreatingProject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  প্রজেক্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useTransitionWorkflowMutation } from '../../store/api/workflowApi.js';
import {
  WORKFLOW_STATUS_CONFIG,
  validateWorkflowPermission
} from '../../services/editorialWorkflowBackend.js';
import { extractApiError, transitionArticleWorkflow } from '../../utils/apiNormalizer.js';
import { getEffectiveRole, getRoleDisplayMeta } from '../../utils/permissions.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import ArticleWorkflowDrawer from '../../components/admin/ArticleWorkflowDrawer.jsx';
import WorkflowActionModal from '../../components/admin/WorkflowActionModal.jsx';
import ArticleEditorModal from '../../components/admin/ArticleEditorModal.jsx';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  GitPullRequest,
  Edit,
  Plus,
  Search,
  Filter,
  User,
  Shield,
  MessageSquare,
  FileCode,
  LayoutGrid,
  List,
  History,
  Loader2
} from 'lucide-react';

export function AdminWorkflowPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const authUser = authState?.user;
  const currentUser = adminState?.currentUser;

  const effectiveRole = getEffectiveRole(authState, adminState);
  const roleMeta = getRoleDisplayMeta(effectiveRole);
  const isSuperAdmin = effectiveRole === 'super_admin';
  const activeUserName = authUser?.name || currentUser?.name || 'সম্পাদক';

  const { data: apiNewsData, isLoading: isNewsLoading } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const [transitionWorkflowMutation] = useTransitionWorkflowMutation();

  const articles = useMemo(() => apiNewsData?.items || [], [apiNewsData]);
  const categoriesList = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories.filter((c) => !c.parentId && !c.parent_id) : []),
    [rawCategories]
  );

  // States
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMobileStage, setActiveMobileStage] = useState('all');

  // Selected article for workflow drawer or actions
  const [drawerArticle, setDrawerArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('return');
  const [targetArticle, setTargetArticle] = useState(null);

  // Edit modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.author?.toLowerCase().includes(q) ||
        a.reporter?.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  // Group by workflow status
  const articlesByStatus = useMemo(() => {
    const groups = {
      draft: [],
      submitted: [],
      under_review: [],
      returned: [],
      approved: [],
      scheduled: [],
      published: [],
      rejected: []
    };

    filteredArticles.forEach((a) => {
      const st = a.status || 'draft';
      if (groups[st]) {
        groups[st].push(a);
      } else if (st === 'archived') {
        if (!groups.archived) groups.archived = [];
        groups.archived.push(a);
      } else {
        groups.draft.push(a);
      }
    });

    return groups;
  }, [filteredArticles]);

  // Execute Real Laravel Backend Transition
  const handlePerformTransition = async (article, toStatus, extra = {}) => {
    if (!article?.id) return false;

    try {
      const updated = await transitionArticleWorkflow({
        transitionMutation: transitionWorkflowMutation,
        articleId: article.id,
        fromStatus: article.status || 'draft',
        toStatus,
        comments: extra.comments || '',
        scheduled_at: extra.scheduledAt || undefined,
        isSuperAdmin
      });

      if (drawerArticle && drawerArticle.id === article.id && updated) {
        setDrawerArticle(updated);
      }

      const targetLabel = WORKFLOW_STATUS_CONFIG[toStatus]?.labelBn || toStatus;
      await sweetAlert.success('স্থিতি পরিবর্তিত হয়েছে!', `সংবাদের স্থিতি সফলভাবে "${targetLabel}" এ পরিবর্তিত হয়েছে।`);
      return true;
    } catch (error) {
      await sweetAlert.error('পরিবর্তন ব্যর্থ হয়েছে', extractApiError(error, 'স্ট্যাটাস পরিবর্তন করা যায়নি।'));
      return false;
    }
  };

  // Drawer action callback
  const handleDrawerAction = (action) => {
    if (!drawerArticle) return;

    if (action === 'submit') {
      handlePerformTransition(drawerArticle, 'submitted', {
        comments: 'প্রতিবেদক কর্তৃক পর্যালোচনার জন্য জমা দেওয়া হয়েছে'
      });
    } else if (action === 'start_review') {
      handlePerformTransition(drawerArticle, 'under_review', {
        comments: `${activeUserName} পর্যালোচনা শুরু করেছেন`
      });
    } else if (action === 'publish') {
      handlePerformTransition(drawerArticle, 'published', {
        comments: 'সম্পাদকীয় অনুমোদন ও লাইভ প্রকাশনা'
      });
    } else {
      setTargetArticle(drawerArticle);
      setActionType(action);
      setActionModalOpen(true);
    }
  };

  const handleModalConfirm = ({ comments, scheduledAt }) => {
    if (!targetArticle) return;
    let targetStatus = 'approved';
    if (actionType === 'return') targetStatus = 'returned';
    if (actionType === 'reject') targetStatus = 'rejected';
    if (actionType === 'schedule') targetStatus = 'scheduled';

    handlePerformTransition(targetArticle, targetStatus, {
      comments,
      scheduledAt
    });
  };

  const handleOpenDrawer = (article) => {
    setDrawerArticle(article);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (article) => {
    setEditingArticle(article);
    setEditorOpen(true);
  };

  // Pipeline stages to display on Kanban Board
  const pipelineStages = [
    { key: 'draft', label: 'খসড়া (Draft)', count: articlesByStatus.draft.length, color: 'border-stone-300 bg-stone-50' },
    { key: 'submitted', label: 'জমা দেওয়া (Submitted)', count: articlesByStatus.submitted.length, color: 'border-blue-300 bg-blue-50/40' },
    { key: 'under_review', label: 'পর্যালোচনাধীন (Review)', count: articlesByStatus.under_review.length, color: 'border-amber-300 bg-amber-50/40' },
    { key: 'returned', label: 'সংশোধনে ফেরত (Returned)', count: articlesByStatus.returned.length, color: 'border-orange-300 bg-orange-50/40' },
    { key: 'approved', label: 'অনুমোদিত (Approved)', count: articlesByStatus.approved.length, color: 'border-emerald-300 bg-emerald-50/40' },
    { key: 'scheduled', label: 'শিডিউল্ড (Scheduled)', count: articlesByStatus.scheduled.length, color: 'border-indigo-300 bg-indigo-50/40' },
    { key: 'published', label: 'লাইভ (Published)', count: articlesByStatus.published.length, color: 'border-emerald-500 bg-emerald-50/20' }
  ];

  return (
    <div className="space-y-6">

      {/* 1. Header with Role Gate Simulator */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
              সম্পাদকীয় অনুমোদন ও কাজের ধারা (Editorial Workflow)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800">
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            প্রতিবেদক, বার্তা সম্পাদক ও প্রধান সম্পাদকের যৌথ অনুমোদন ও সংশোধনী সিস্টেম
          </p>
        </div>

        {/* Active Verified Role Badge & Create Draft Button */}
        <div className="w-full sm:w-auto flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-stone-500 font-semibold whitespace-nowrap">সক্রিয় ভূমিকা:</span>
            <span className="font-bold text-stone-900">{roleMeta.nameBn}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingArticle(null);
              setEditorOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>নতুন ড্রাফট তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* 2. Role Instruction Banner */}
      <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-stone-100 text-sm">
              বর্তমান ভূমিকা: {roleMeta.nameBn}
            </p>
            <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
              {(effectiveRole === 'reporter' || effectiveRole === 'contributor') && 'প্রতিবেদক হিসেবে আপনি সংবাদ ড্রাফট করতে ও পর্যালোচনার জন্য জমা দিতে পারবেন।'}
              {(effectiveRole === 'news_editor' || effectiveRole === 'sub_editor') && 'সম্পাদক হিসেবে আপনি জমা পড়া সংবাদ রিভিউ করতে, সংশোধন নির্দেশ দিতে কিংবা অনুমোদন করতে পারবেন।'}
              {(effectiveRole === 'editor_in_chief' || effectiveRole === 'super_admin') && 'সর্বোচ্চ অনুমোদনকারী হিসেবে আপনার চূড়ান্ত অনুমোদন, শিডিউলিং ও সরাসরি লাইভ প্রকাশের পূর্ণ এখতিয়ার রয়েছে।'}
            </p>
          </div>
        </div>

        {/* View Switcher: Board vs List */}
        <div className="w-full md:w-auto flex items-center justify-end bg-stone-800 p-1 rounded-xl border border-stone-700 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${viewMode === 'board' ? 'bg-rose-700 text-white' : 'text-stone-400 hover:text-white'
              }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>বোর্ড ভিউ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${viewMode === 'list' ? 'bg-rose-700 text-white' : 'text-stone-400 hover:text-white'
              }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>লিস্ট ভিউ</span>
          </button>
        </div>
      </div>

      {/* 3. Search and Category Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="শিরোনাম বা প্রতিবেদকের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল বিভাগ (All Categories)</option>
            {categoriesList.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Stage Selector Filter (Visible on small screens) */}
      {viewMode === 'board' && (
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mt-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveMobileStage('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${activeMobileStage === 'all'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200'
              }`}
          >
            <span>সবগুলো ধাপ</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
              {toBengaliNumber(filteredArticles.length)}
            </span>
          </button>
          {pipelineStages.map((stage) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => setActiveMobileStage(stage.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${activeMobileStage === stage.key
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200'
                }`}
            >
              <span>{stage.label.split(' ')[0]}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {toBengaliNumber(stage.count)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Loading Notice */}
      {isNewsLoading && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
          <span>সম্পাদকীয় ওয়ার্কফ্লো ডেটা লোড হচ্ছে...</span>
        </div>
      )}

      {/* 4. Kanban Board View */}
      {!isNewsLoading && (viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar min-h-[560px]">
          {pipelineStages.map((stage) => {
            const items = articlesByStatus[stage.key] || [];

            return (
              <div
                key={stage.key}
                className={`w-full md:w-80 shrink-0 flex flex-col bg-stone-100/80 rounded-2xl p-3.5 border border-stone-200/80 space-y-3 ${activeMobileStage !== 'all' && activeMobileStage !== stage.key ? 'hidden md:flex' : 'flex'
                  }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 px-1">
                  <span className="font-bold text-xs text-stone-800 font-serif-bn">
                    {stage.label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white font-bold text-stone-700 border border-stone-200">
                    {toBengaliNumber(stage.count)}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[620px] pr-0.5">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 text-xs italic bg-white/50 rounded-xl border border-dashed border-stone-200">
                      কোনো সংবাদ নেই
                    </div>
                  ) : (
                    items.map((art) => {
                      const feedbackCount = (art.editorialFeedback || []).length;
                      const revisionsCount = (art.revisions || []).length;

                      // Permission check for primary action
                      const canSubmitThis = isSuperAdmin
                        ? art.status === 'draft' || art.status === 'returned'
                        : validateWorkflowPermission(effectiveRole, art.status, 'submitted').allowed;
                      const canApproveThis = isSuperAdmin
                        ? ['submitted', 'under_review'].includes(art.status)
                        : validateWorkflowPermission(effectiveRole, art.status, 'approved').allowed;
                      const canPublishThis = isSuperAdmin
                        ? art.status !== 'published'
                        : validateWorkflowPermission(effectiveRole, art.status, 'published').allowed;

                      return (
                        <div
                          key={art.id}
                          className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all space-y-2.5 group"
                        >
                          {/* Category and Badges */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                              {art.categoryName || art.category}
                            </span>
                            <span className="text-stone-400 font-mono">
                              {formatBengaliRelativeTime(art.publishedAt)}
                            </span>
                          </div>

                          {/* Headline */}
                          <h4
                            onClick={() => handleOpenDrawer(art)}
                            className="font-bold font-serif-bn text-stone-900 text-xs line-clamp-2 hover:text-rose-700 transition-colors cursor-pointer"
                          >
                            {art.title}
                          </h4>

                          {/* Author & Meta */}
                          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                            <span className="truncate max-w-[140px] font-medium text-stone-700">
                              {art.author || 'স্টাফ রিপোর্টার'}
                            </span>
                            <div className="flex items-center gap-2">
                              {feedbackCount > 0 && (
                                <span className="flex items-center gap-0.5 text-orange-700 font-mono text-[10px]" title="সম্পাদকীয় মন্তব্য">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{feedbackCount}</span>
                                </span>
                              )}
                              {revisionsCount > 0 && (
                                <span className="flex items-center gap-0.5 text-stone-400 font-mono text-[10px]" title="সংস্করণ সংখ্যা">
                                  <FileCode className="w-3 h-3" />
                                  <span>v{revisionsCount}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(art)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold text-stone-600 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                              title="বিস্তারিত ইতিহাস ও ফিডব্যাক দেখুন"
                            >
                              <History className="w-3 h-3" />
                              <span>হিস্ট্রি</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(art)}
                                className="p-1 rounded text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="সম্পাদনা করুন"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Primary Quick Action Button */}
                              {canSubmitThis && (
                                <button
                                  type="button"
                                  onClick={() => handlePerformTransition(art, 'submitted', { comments: 'জমা দেওয়া হয়েছে' })}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  জমা দিন
                                </button>
                              )}

                              {canApproveThis && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetArticle(art);
                                    setActionType('approve');
                                    setActionModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  অনুমোদন
                                </button>
                              )}

                              {canPublishThis && art.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handlePerformTransition(art, 'published', { comments: 'লাইভ অনুমোদন' })}
                                  className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  প্রকাশ
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. List View: Responsive Table on desktop/tablet + Card list on mobile */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Mobile Card List View (< sm:) */}
          <div className="sm:hidden divide-y divide-stone-100">
            {filteredArticles.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs italic">
                কোনো সংবাদ পাওয়া যায়নি
              </div>
            ) : (
              filteredArticles.map((art) => {
                const conf = WORKFLOW_STATUS_CONFIG[art.status || 'draft'] || WORKFLOW_STATUS_CONFIG.draft;
                const feedbackCount = (art.editorialFeedback || []).length;

                return (
                  <div key={art.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.color}`}>
                        {conf.labelBn}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {formatBengaliRelativeTime(art.publishedAt)}
                      </span>
                    </div>

                    <h4
                      onClick={() => handleOpenDrawer(art)}
                      className="font-bold font-serif-bn text-stone-900 text-sm line-clamp-2 hover:text-rose-700 cursor-pointer"
                    >
                      {art.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span>প্রতিবেদক: <strong className="text-stone-700">{art.author || 'স্টাফ রিপোর্টার'}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-semibold">
                        {art.categoryName || art.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      {feedbackCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-bold">
                          <MessageSquare className="w-3 h-3" />
                          <span>{toBengaliNumber(feedbackCount)} টি মন্তব্য</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">কোনো মন্তব্য নেই</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(art)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        ওয়ার্কফ্লো দেখুন
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet Table View (>= sm:) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">শিরোনাম</th>
                  <th className="px-4 py-3.5">বিভাগ</th>
                  <th className="px-4 py-3.5">প্রতিবেদক</th>
                  <th className="px-4 py-3.5">বর্তমান স্থিতি</th>
                  <th className="px-4 py-3.5">সর্বশেষ পর্যালোচক</th>
                  <th className="px-4 py-3.5">মন্তব্য</th>
                  <th className="px-4 py-3.5 text-right">পদক্ষেপ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredArticles.map((art) => {
                  const conf = WORKFLOW_STATUS_CONFIG[art.status || 'draft'] || WORKFLOW_STATUS_CONFIG.draft;
                  const feedbackCount = (art.editorialFeedback || []).length;

                  return (
                    <tr key={art.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-3 font-serif-bn">
                        <p
                          onClick={() => handleOpenDrawer(art)}
                          className="font-bold text-stone-900 text-sm line-clamp-1 hover:text-rose-700 cursor-pointer"
                        >
                          {art.title}
                        </p>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {formatBengaliRelativeTime(art.publishedAt)}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-semibold">
                          {art.categoryName || art.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-stone-700 font-medium">
                        {art.author || 'স্টাফ রিপোর্টার'}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${conf.color}`}>
                          {conf.labelBn}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {art.reviewerInfo ? (
                          <span className="font-semibold text-stone-900">
                            {art.reviewerInfo.reviewedBy}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {feedbackCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-bold">
                            <MessageSquare className="w-3 h-3" />
                            <span>{toBengaliNumber(feedbackCount)}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">০</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(art)}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ওয়ার্কফ্লো দেখুন
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Article Workflow Drawer */}
      <ArticleWorkflowDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        article={drawerArticle}
        currentRole={effectiveRole}
        onTriggerAction={handleDrawerAction}
      />

      {/* Workflow Action Modal (Return / Reject / Approve / Schedule) */}
      <WorkflowActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleModalConfirm}
        actionType={actionType}
        article={targetArticle}
      />

      {/* Article Editor Modal */}
      <ArticleEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        articleToEdit={editingArticle}
      />
    </div>
  );
}

export default AdminWorkflowPage;


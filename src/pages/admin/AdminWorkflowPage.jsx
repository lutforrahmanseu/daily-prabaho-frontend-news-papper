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
  Shield,
  MessageSquare,
  FileCode,
  Loader2,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const STATUS_STAGES = [
  { key: 'all', label: 'সকল স্থিতি (All)' },
  { key: 'submitted', label: 'জমা দেওয়া (Submitted)' },
  { key: 'under_review', label: 'পর্যালোচনাধীন (Review)' },
  { key: 'approved', label: 'অনুমোদিত (Approved)' },
  { key: 'draft', label: 'খসড়া (Draft)' },
  { key: 'returned', label: 'সংশোধনে ফেরত (Returned)' },
  { key: 'scheduled', label: 'শিডিউল্ড (Scheduled)' },
  { key: 'published', label: 'লাইভ (Published)' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত (Rejected)' }
];

export function AdminWorkflowPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const authUser = authState?.user;
  const currentUser = adminState?.currentUser;

  const effectiveRole = getEffectiveRole(authState, adminState);
  const roleMeta = getRoleDisplayMeta(effectiveRole);
  const isSuperAdmin = effectiveRole === 'super_admin';
  const activeUserName = authUser?.name || currentUser?.name || 'সম্পাদক';

  const { data: apiNewsData, isLoading: isNewsLoading, refetch: refetchNews } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const [transitionWorkflowMutation] = useTransitionWorkflowMutation();

  const articles = useMemo(() => apiNewsData?.items || [], [apiNewsData]);
  const categoriesList = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories.filter((c) => !c.parentId && !c.parent_id) : []),
    [rawCategories]
  );

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

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

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setCurrentPage(1);
    refetchNews();
  };

  const isFiltered = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'all' ||
    statusFilter !== 'all'
  );

  // 1. Base filter by search and category for status counts
  const baseFilteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.author?.toLowerCase().includes(q) ||
        a.reporter?.toLowerCase().includes(q) ||
        a.slug?.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  // Status counts based on current search & category filter
  const statusCounts = useMemo(() => {
    const counts = {
      all: baseFilteredArticles.length,
      draft: 0,
      submitted: 0,
      under_review: 0,
      returned: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      rejected: 0
    };
    baseFilteredArticles.forEach((a) => {
      const st = a.status || 'draft';
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [baseFilteredArticles]);

  // 2. Filter by status stage
  const filteredArticles = useMemo(() => {
    if (statusFilter === 'all') return baseFilteredArticles;
    return baseFilteredArticles.filter((a) => (a.status || 'draft') === statusFilter);
  }, [baseFilteredArticles, statusFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredArticles.length / pageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

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

      refetchNews();

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

  return (
    <div className="space-y-4">

      {/* 1. Header with Role Info */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
              সম্পাদকীয় অনুমোদন ও কাজের ধারা (Editorial Workflow)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
              <GitPullRequest className="w-3.5 h-3.5 text-rose-700" />
              <span>Workflow</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            প্রতিবেদক, বার্তা সম্পাদক ও প্রধান সম্পাদকের যৌথ অনুমোদন ও সংশোধনী সিস্টেম
          </p>
        </div>

        {/* Active Role & Create Draft Button */}
        <div className="w-full sm:w-auto flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-stone-200 px-3 py-2 rounded-xl text-xs">
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
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>নতুন ড্রাফট তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* 2. Status Stage Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_STAGES.map((stage) => {
          const count = statusCounts[stage.key] || 0;
          const isActive = statusFilter === stage.key;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => {
                setStatusFilter(stage.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white border-rose-600 text-rose-700 font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>{stage.label.split(' ')[0]}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {toBengaliNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search and Category Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="শিরোনাম, প্রতিবেদক বা কিওয়ার্ড দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-9 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
              title="অনুসন্ধান মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="all">সকল বিভাগ (All Categories)</option>
              {categoriesList.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Quick Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-white hover:bg-stone-50 border border-rose-300 transition-colors cursor-pointer"
              title="সকল ফিল্টার মুছুন ও পূর্ণ তালিকা দেখুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Workflow Articles Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Loading Notice */}
        {isNewsLoading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
            <span>সম্পাদকীয় ওয়ার্কফ্লো ডেটা লোড হচ্ছে...</span>
          </div>
        ) : paginatedArticles.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            <p className="italic">কোনো সংবাদ পাওয়া যায়নি (No matching news found)</p>
            {isFiltered && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-rose-700 hover:bg-stone-50 border border-rose-300 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ফিল্টার রিসেট করে সব সংবাদ দেখুন</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< sm:) */}
            <div className="sm:hidden divide-y divide-stone-100">
              {paginatedArticles.map((art) => {
                const conf = WORKFLOW_STATUS_CONFIG[art.status || 'draft'] || WORKFLOW_STATUS_CONFIG.draft;
                const feedbackCount = (art.editorialFeedback || []).length;
                const revisionsCount = (art.revisions || []).length;

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

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-2">
                      <div className="flex items-center gap-2">
                        {feedbackCount > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono text-orange-700 text-[11px] font-bold">
                            <MessageSquare className="w-3 h-3" />
                            <span>{toBengaliNumber(feedbackCount)}</span>
                          </span>
                        )}
                        {revisionsCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-stone-400 font-mono text-[10px]" title="সংস্করণ সংখ্যা">
                            <FileCode className="w-3 h-3" />
                            <span>v{revisionsCount}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(art)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-blue-600 hover:bg-stone-50 cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(art)}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ওয়ার্কফ্লো দেখুন
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop/Tablet Table View (>= sm:) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">সংবাদ শিরোনাম</th>
                    <th className="px-4 py-3.5">বিভাগ</th>
                    <th className="px-4 py-3.5">প্রতিবেদক</th>
                    <th className="px-4 py-3.5">বর্তমান স্থিতি</th>
                    <th className="px-4 py-3.5">সর্বশেষ পর্যালোচক</th>
                    <th className="px-4 py-3.5 text-center">মন্তব্য</th>
                    <th className="px-5 py-3.5 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {paginatedArticles.map((art) => {
                    const conf = WORKFLOW_STATUS_CONFIG[art.status || 'draft'] || WORKFLOW_STATUS_CONFIG.draft;
                    const feedbackCount = (art.editorialFeedback || []).length;
                    const revisionsCount = (art.revisions || []).length;

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
                      <tr key={art.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-5 py-3 font-serif-bn max-w-sm">
                          <p
                            onClick={() => handleOpenDrawer(art)}
                            className="font-bold text-stone-900 text-sm line-clamp-1 hover:text-rose-700 cursor-pointer"
                          >
                            {art.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-mono">
                            <span>{formatBengaliRelativeTime(art.publishedAt)}</span>
                            {revisionsCount > 0 && (
                              <span className="flex items-center gap-0.5 text-stone-400 font-mono text-[10px]" title="সংস্করণ">
                                <FileCode className="w-3 h-3" />
                                <span>v{revisionsCount}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-semibold">
                            {art.categoryName || art.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-stone-700 font-medium">
                          {art.author || 'স্টাফ রিপোর্টার'}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${conf.color}`}>
                            {conf.labelBn}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                          {art.reviewerInfo ? (
                            <span className="font-semibold text-stone-900">
                              {art.reviewerInfo.reviewedBy}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {feedbackCount > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded font-bold">
                              <MessageSquare className="w-3 h-3" />
                              <span>{toBengaliNumber(feedbackCount)}</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 font-mono">০</span>
                          )}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Action Button */}
                            {canSubmitThis && (
                              <button
                                type="button"
                                onClick={() => handlePerformTransition(art, 'submitted', { comments: 'জমা দেওয়া হয়েছে' })}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                অনুমোদন
                              </button>
                            )}

                            {canPublishThis && art.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => handlePerformTransition(art, 'published', { comments: 'লাইভ অনুমোদন' })}
                                className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                প্রকাশ
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(art)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-blue-600 hover:bg-stone-50 transition-colors cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(art)}
                              className="px-3 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              ওয়ার্কফ্লো দেখুন
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-stone-500 font-mono">
                মোট <strong>{toBengaliNumber(filteredArticles.length)}</strong> টি সংবাদের মধ্যে{' '}
                <strong>{toBengaliNumber(Math.min((currentPage - 1) * pageSize + 1, filteredArticles.length))}</strong> থেকে{' '}
                <strong>{toBengaliNumber(Math.min(currentPage * pageSize, filteredArticles.length))}</strong> প্রদর্শন
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="পূর্ববর্তী পেজ"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 rounded-lg bg-stone-100 font-bold font-mono text-stone-800 border border-stone-200">
                  {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="পরবর্তী পেজ"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
        onSuccess={() => {
          refetchNews();
        }}
      />
    </div>
  );
}

export default AdminWorkflowPage;

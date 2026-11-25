import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useGetReportersQuery } from '../../store/api/reporterApi.js';
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
import { AdminListRowsSkeleton } from '../../components/admin/AdminSkeletons.jsx';
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
  ChevronRight,
  Layers,
  UserCheck,
  User,
  Briefcase,
  CheckCircle2,
  Clock,
  Send,
  Eye
} from 'lucide-react';

const STATUS_STAGES = [
  { key: 'all', label: 'সকল স্থিতি (All)' },
  { key: 'submitted', label: 'জমা পড়া (Submitted)' },
  { key: 'under_review', label: 'পর্যালোচনায় (Review)' },
  { key: 'returned', label: 'সংশোধনে ফেরত (Returned)' },
  { key: 'approved', label: 'অনুমোদিত (Approved)' },
  { key: 'draft', label: 'খসড়া (Draft)' },
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

  // API Queries
  const { data: apiNewsData, isLoading: isNewsLoading, refetch: refetchNews } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const { data: reportersData } = useGetReportersQuery({ per_page: 100 });
  const [transitionWorkflowMutation] = useTransitionWorkflowMutation();

  const articles = useMemo(() => apiNewsData?.items || [], [apiNewsData]);
  const categoriesList = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories.filter((c) => !c.parentId && !c.parent_id) : []),
    [rawCategories]
  );

  // Workflow Scope Modes: 'all' | 'by_designation' | 'by_specific' | 'my_desk'
  const [scopeMode, setScopeMode] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selected article for drawer and modals
  const [drawerArticle, setDrawerArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('return');
  const [targetArticle, setTargetArticle] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // 1. Dynamic Designations list extracted from newsroom team and articles
  const availableDesignations = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => {
      const d1 = a.authorDesignation || a.authorObj?.designation;
      const d2 = a.reporterDesignation || a.reporterObj?.designation;
      if (d1 && d1.trim()) set.add(d1.trim());
      if (d2 && d2.trim()) set.add(d2.trim());
    });
    const repList = Array.isArray(reportersData?.items) ? reportersData.items : (Array.isArray(reportersData) ? reportersData : []);
    repList.forEach((r) => {
      if (r?.designation && r.designation.trim()) set.add(r.designation.trim());
    });
    // Add canonical newsroom designations
    [
      'প্রধান সম্পাদক (Editor-in-Chief)',
      'বার্তা সম্পাদক (News Editor)',
      'সহ-সম্পাদক (Sub Editor)',
      'সিনিয়র রিপোর্টার',
      'নিজস্ব প্রতিবেদক',
      'স্টাফ রিপোর্টার',
      'বিশেষ প্রতিনিধি',
      'ব্যুরো প্রধান',
      'জেলা প্রতিনিধি',
      'উপজেলা প্রতিনিধি'
    ].forEach((d) => set.add(d));
    return Array.from(set);
  }, [articles, reportersData]);

  // 2. Dynamic Specific Reporters/Editors/Authors list
  const specificPeople = useMemo(() => {
    const map = new Map();
    const repList = Array.isArray(reportersData?.items) ? reportersData.items : (Array.isArray(reportersData) ? reportersData : []);
    repList.forEach((r) => {
      if (r?.name) {
        map.set(r.name.toLowerCase().trim(), {
          name: r.name,
          designation: r.designation || 'প্রতিবেদক',
          type: 'reporter'
        });
      }
    });
    articles.forEach((a) => {
      if (a.reporter && a.reporter.trim()) {
        const key = a.reporter.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            name: a.reporter,
            designation: a.reporterDesignation || 'প্রতিবেদক',
            type: 'reporter'
          });
        }
      }
      if (a.author && a.author.trim()) {
        const key = a.author.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            name: a.author,
            designation: a.authorDesignation || 'কলামিস্ট/লেখক',
            type: 'author'
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }, [reportersData, articles]);

  // Reset all filters
  const resetAllFilters = () => {
    setScopeMode('all');
    setSelectedDesignation('all');
    setSelectedPerson('all');
    setSelectedCategory('all');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
    refetchNews();
  };

  const isFiltered = Boolean(
    scopeMode !== 'all' ||
    selectedDesignation !== 'all' ||
    selectedPerson !== 'all' ||
    selectedCategory !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim()
  );

  // 3. Filter Articles according to Scope, Designation, Specific Person, Status, Category, and Search
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQ =
          art.title?.toLowerCase().includes(q) ||
          art.excerpt?.toLowerCase().includes(q) ||
          art.author?.toLowerCase().includes(q) ||
          art.reporter?.toLowerCase().includes(q) ||
          art.slug?.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // Category
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && (art.status || 'draft') !== statusFilter) {
        return false;
      }

      // Scope Mode: My Desk
      if (scopeMode === 'my_desk') {
        const myName = activeUserName?.toLowerCase() || '';
        const myId = authUser?.id || currentUser?.id;
        const isMyArticle =
          (art.authorId && myId && String(art.authorId) === String(myId)) ||
          (art.reporterId && myId && String(art.reporterId) === String(myId)) ||
          (art.author && myName && art.author.toLowerCase().includes(myName)) ||
          (art.reporter && myName && art.reporter.toLowerCase().includes(myName));

        if (isSuperAdmin || effectiveRole === 'editor_in_chief' || effectiveRole === 'news_editor') {
          const isPendingReview = ['submitted', 'under_review'].includes(art.status);
          if (!isMyArticle && !isPendingReview) return false;
        } else {
          if (!isMyArticle) return false;
        }
      }

      // Designation Filter
      if (selectedDesignation !== 'all') {
        const artDes1 = (art.authorDesignation || art.authorObj?.designation || '').toLowerCase().trim();
        const artDes2 = (art.reporterDesignation || art.reporterObj?.designation || '').toLowerCase().trim();
        const targetDes = selectedDesignation.toLowerCase().trim();
        const matchesDes =
          (artDes1 && (artDes1.includes(targetDes) || targetDes.includes(artDes1))) ||
          (artDes2 && (artDes2.includes(targetDes) || targetDes.includes(artDes2)));
        if (!matchesDes) return false;
      }

      // Specific Person Filter
      if (selectedPerson !== 'all') {
        const targetName = selectedPerson.toLowerCase().trim();
        const artReporter = (art.reporter || '').toLowerCase().trim();
        const artAuthor = (art.author || '').toLowerCase().trim();
        const matchesPerson = artReporter.includes(targetName) || artAuthor.includes(targetName);
        if (!matchesPerson) return false;
      }

      return true;
    });
  }, [
    articles,
    searchQuery,
    selectedCategory,
    statusFilter,
    scopeMode,
    selectedDesignation,
    selectedPerson,
    activeUserName,
    authUser?.id,
    currentUser?.id,
    effectiveRole,
    isSuperAdmin
  ]);

  // 5. Status counts for the current active filter scope
  const statusCounts = useMemo(() => {
    const counts = {
      all: filteredArticles.length,
      draft: 0,
      submitted: 0,
      under_review: 0,
      returned: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      rejected: 0
    };
    filteredArticles.forEach((a) => {
      const st = a.status || 'draft';
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [filteredArticles]);

  // Pagination Math
  const totalPages = Math.ceil(filteredArticles.length / pageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  // Execute Real Laravel Backend Workflow Transition
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
      {/* Unified Single Card Container */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">

        {/* 1. Header with Role Info & Action Button */}
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
              সম্পাদকীয় অনুমোদন ও কাজের ধারা (Editorial Workflow)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
              <GitPullRequest className="w-3.5 h-3.5 text-rose-700" />
              <span>Editorial Desk</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            পদবি ও নির্দিষ্ট দায়িত্ব অনুযায়ী সংবাদ পর্যালোচনা, সংশোধন এবং অনুমোদন ব্যবস্থা
          </p>
        </div>

        {/* Active Role & Create Draft Button */}
        <div className="w-full sm:w-auto flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-2 rounded-xl text-xs">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-stone-500 dark:text-stone-400 font-semibold whitespace-nowrap">ভূমিকা:</span>
            <span className="font-bold text-stone-900 dark:text-stone-100">{roleMeta.nameBn}</span>
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
            <span>নতুন ড্রাফট</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Filter Toolbar */}
      <div className="p-4 bg-stone-50/40 dark:bg-stone-900/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="শিরোনাম বা প্রতিবেদক খুঁজুন..."
              className="w-full pl-9 pr-8 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title="অনুসন্ধান মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scope Quick Toggle: All vs My Desk */}
            <button
              type="button"
              onClick={() => {
                const next = scopeMode === 'my_desk' ? 'all' : 'my_desk';
                setScopeMode(next);
                setSelectedDesignation('all');
                setSelectedPerson('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                scopeMode === 'my_desk'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>আমার দায়িত্ব</span>
            </button>

            {/* Designation Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-xl text-xs">
              <Briefcase className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                value={selectedDesignation}
                onChange={(e) => {
                  setSelectedDesignation(e.target.value);
                  setScopeMode(e.target.value !== 'all' ? 'by_designation' : 'all');
                  setSelectedPerson('all');
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">সকল পদবি</option>
                {availableDesignations.map((des) => (
                  <option key={des} value={des}>
                    {des}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Person Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-xl text-xs">
              <UserCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                value={selectedPerson}
                onChange={(e) => {
                  setSelectedPerson(e.target.value);
                  setScopeMode(e.target.value !== 'all' ? 'by_specific' : 'all');
                  setSelectedDesignation('all');
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">সকল কর্মী</option>
                {specificPeople.map((person) => (
                  <option key={person.name} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="all">সকল বিভাগ</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                title="ফিল্টার রিসেট"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
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
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
                }`}
              >
                <span>{stage.label.split(' ')[0]}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                      : 'bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {toBengaliNumber(count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Dedicated Workflow Desk Articles Table */}
      <div>
        {/* Loading Skeleton */}
        {isNewsLoading ? (
          <AdminListRowsSkeleton rows={6} />
        ) : paginatedArticles.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            <p className="italic">কোনো সংবাদ পাওয়া যায়নি (No matching workflow articles found)</p>
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
                const designation = art.reporterDesignation || art.authorDesignation || 'নিজস্ব প্রতিবেদক';

                const canSubmitThis = isSuperAdmin
                  ? art.status === 'draft' || art.status === 'returned'
                  : validateWorkflowPermission(effectiveRole, art.status, 'submitted').allowed;
                const canStartReview = isSuperAdmin
                  ? art.status === 'submitted'
                  : validateWorkflowPermission(effectiveRole, art.status, 'under_review').allowed;
                const canApproveThis = isSuperAdmin
                  ? ['submitted', 'under_review'].includes(art.status)
                  : validateWorkflowPermission(effectiveRole, art.status, 'approved').allowed;
                const canPublishThis = isSuperAdmin
                  ? art.status !== 'published'
                  : validateWorkflowPermission(effectiveRole, art.status, 'published').allowed;

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

                    {/* Reporter & Designation Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-stone-600 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900">{art.reporter || art.author || 'স্টাফ রিপোর্টার'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold border border-stone-200">
                          {designation}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-stone-50 text-stone-700 text-[10px] font-semibold border border-stone-200">
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
                    <th className="px-5 py-3.5">সংবাদ শিরোনাম ও বিবরণ</th>
                    <th className="px-4 py-3.5">প্রতিবেদক ও পদবি (Designation)</th>
                    <th className="px-4 py-3.5">বিভাগ</th>
                    <th className="px-4 py-3.5">কাজের স্থিতি (Workflow Stage)</th>
                    <th className="px-4 py-3.5">পর্যালোচক (Reviewer)</th>
                    <th className="px-4 py-3.5 text-center">মন্তব্য</th>
                    <th className="px-5 py-3.5 text-right">পদক্ষেপ ও মেইনটেইন</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {paginatedArticles.map((art) => {
                    const conf = WORKFLOW_STATUS_CONFIG[art.status || 'draft'] || WORKFLOW_STATUS_CONFIG.draft;
                    const feedbackCount = (art.editorialFeedback || []).length;
                    const revisionsCount = (art.revisions || []).length;
                    const designation = art.reporterDesignation || art.authorDesignation || 'নিজস্ব প্রতিবেদক';

                    const canSubmitThis = isSuperAdmin
                      ? art.status === 'draft' || art.status === 'returned'
                      : validateWorkflowPermission(effectiveRole, art.status, 'submitted').allowed;
                    const canStartReview = isSuperAdmin
                      ? art.status === 'submitted'
                      : validateWorkflowPermission(effectiveRole, art.status, 'under_review').allowed;
                    const canApproveThis = isSuperAdmin
                      ? ['submitted', 'under_review'].includes(art.status)
                      : validateWorkflowPermission(effectiveRole, art.status, 'approved').allowed;
                    const canPublishThis = isSuperAdmin
                      ? art.status !== 'published'
                      : validateWorkflowPermission(effectiveRole, art.status, 'published').allowed;

                    return (
                      <tr key={art.id} className="hover:bg-stone-50/60 transition-colors">
                        
                        {/* 1. Article Title, Excerpt & Time */}
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

                        {/* 2. Reporter Name & Explicit Designation */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <p className="font-bold text-stone-900 text-xs">
                              {art.reporter || art.author || 'স্টাফ রিপোর্টার'}
                            </p>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                              {designation}
                            </span>
                          </div>
                        </td>

                        {/* 3. Category */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-stone-50 text-stone-800 text-xs font-semibold border border-stone-200">
                            {art.categoryName || art.category}
                          </span>
                        </td>

                        {/* 4. Workflow Stage Status Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${conf.color}`}>
                            {conf.labelBn}
                          </span>
                        </td>

                        {/* 5. Reviewer */}
                        <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                          {art.reviewerInfo ? (
                            <span className="font-semibold text-stone-900">
                              {art.reviewerInfo.reviewedBy}
                            </span>
                          ) : art.status === 'submitted' ? (
                            <span className="text-blue-600 text-[11px] font-semibold">রিভিউয়ের অপেক্ষায়</span>
                          ) : (
                            <span className="text-stone-400 italic">—</span>
                          )}
                        </td>

                        {/* 6. Editorial Feedback / Notes Count */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {feedbackCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(art)}
                              className="inline-flex items-center gap-1 font-mono text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded font-bold hover:bg-orange-50 cursor-pointer"
                              title="মন্তব্য ও সংশোধনী দেখুন"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{toBengaliNumber(feedbackCount)}</span>
                            </button>
                          ) : (
                            <span className="text-stone-400 font-mono">০</span>
                          )}
                        </td>

                        {/* 7. Workflow Actions */}
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Submit (Draft -> Submitted) */}
                            {canSubmitThis && (
                              <button
                                type="button"
                                onClick={() => handlePerformTransition(art, 'submitted', { comments: 'জমা দেওয়া হয়েছে' })}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                জমা দিন
                              </button>
                            )}

                            {/* Start Review (Submitted -> Under Review) */}
                            {canStartReview && art.status === 'submitted' && (
                              <button
                                type="button"
                                onClick={() => handlePerformTransition(art, 'under_review', { comments: `${activeUserName} পর্যালোচনা শুরু করেছেন` })}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                রিভিউ শুরু
                              </button>
                            )}

                            {/* Approve (Under Review -> Approved) */}
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

                            {/* Publish (Approved -> Published) */}
                            {canPublishThis && art.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => handlePerformTransition(art, 'published', { comments: 'লাইভ অনুমোদন' })}
                                className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                প্রকাশ
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(art)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-blue-600 hover:bg-stone-50 transition-colors cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* View Full Workflow History Drawer */}
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

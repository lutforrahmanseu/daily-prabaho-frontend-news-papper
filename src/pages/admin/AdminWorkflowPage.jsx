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

  // 3. Pipeline Overall Status Counts (across all articles in pipeline)
  const pipelineStats = useMemo(() => {
    const stats = {
      total: articles.length,
      submitted: 0,
      under_review: 0,
      returned: 0,
      approved: 0,
      draft: 0,
      scheduled: 0,
      published: 0,
      rejected: 0
    };
    articles.forEach((a) => {
      const st = a.status || 'draft';
      if (stats[st] !== undefined) {
        stats[st] += 1;
      }
    });
    return stats;
  }, [articles]);

  // 4. Filter Articles according to Scope, Designation, Specific Person, Status, Category, and Search
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

      {/* 1. Header with Role Info & Action Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* 2. Top Summary Stat Cards (Clean White Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white border-stone-800 shadow-xs ring-1 ring-stone-800'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <p className="text-[11px] font-semibold text-stone-500">মোট পাইপলাইন</p>
          <p className="text-lg font-black font-mono text-stone-900 mt-0.5">
            {toBengaliNumber(pipelineStats.total)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('submitted');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'submitted'
              ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600'
              : 'bg-white border-stone-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-700">জমা পড়া</p>
            <Send className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-lg font-black font-mono text-blue-900 mt-0.5">
            {toBengaliNumber(pipelineStats.submitted)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('under_review');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'under_review'
              ? 'bg-white border-amber-600 shadow-xs ring-1 ring-amber-600'
              : 'bg-white border-stone-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700">পর্যালোচনায়</p>
            <Eye className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-black font-mono text-amber-900 mt-0.5">
            {toBengaliNumber(pipelineStats.under_review)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('returned');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'returned'
              ? 'bg-white border-orange-600 shadow-xs ring-1 ring-orange-600'
              : 'bg-white border-stone-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-orange-700">সংশোধনে ফেরত</p>
            <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <p className="text-lg font-black font-mono text-orange-900 mt-0.5">
            {toBengaliNumber(pipelineStats.returned)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('approved');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
              : 'bg-white border-stone-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700">অনুমোদিত</p>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black font-mono text-emerald-900 mt-0.5">
            {toBengaliNumber(pipelineStats.approved)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('scheduled');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'scheduled'
              ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600'
              : 'bg-white border-stone-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-indigo-700">শিডিউল্ড</p>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-lg font-black font-mono text-indigo-900 mt-0.5">
            {toBengaliNumber(pipelineStats.scheduled)}
          </p>
        </button>
      </div>

      {/* 3. Scope Mode Selector: All | By Designation | Specific Person | My Desk */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-stone-700 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>ওয়ার্কফ্লো স্কোপ:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setScopeMode('all');
              setSelectedDesignation('all');
              setSelectedPerson('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              scopeMode === 'all' && selectedDesignation === 'all' && selectedPerson === 'all'
                ? 'bg-white border-rose-600 text-rose-700 font-bold shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            সকল সম্পাদকীয় কনটেন্ট (All)
          </button>

          <button
            type="button"
            onClick={() => {
              setScopeMode('by_designation');
              setSelectedPerson('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              scopeMode === 'by_designation' || selectedDesignation !== 'all'
                ? 'bg-white border-rose-600 text-rose-700 font-bold shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>পদবি অনুযায়ী (By Designation)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScopeMode('by_specific');
              setSelectedDesignation('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              scopeMode === 'by_specific' || selectedPerson !== 'all'
                ? 'bg-white border-rose-600 text-rose-700 font-bold shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>নির্দিষ্ট ব্যক্তি (Specific Staff)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScopeMode('my_desk');
              setSelectedDesignation('all');
              setSelectedPerson('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              scopeMode === 'my_desk'
                ? 'bg-white border-rose-600 text-rose-700 font-bold shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>আমার দায়িত্ব (My Desk)</span>
          </button>
        </div>

        {/* Quick Reset if filtered */}
        {isFiltered && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-white hover:bg-stone-50 border border-rose-300 transition-colors cursor-pointer"
            title="সকল ফিল্টার মুছুন ও পূর্ণ তালিকা দেখুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ফিল্টার রিসেট</span>
          </button>
        )}
      </div>

      {/* 4. Filter Toolbar: Designation, Specific Person, Category, and Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
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

        <div className="flex flex-wrap items-center gap-2">

          {/* 1. Designation Filter Dropdown */}
          <div className={`flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-xl text-xs ${
            selectedDesignation !== 'all' || scopeMode === 'by_designation' ? 'border-rose-400 ring-1 ring-rose-300' : 'border-stone-200'
          }`}>
            <Briefcase className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                if (e.target.value !== 'all') {
                  setScopeMode('by_designation');
                  setSelectedPerson('all');
                }
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-stone-700 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">পদবি: সকল পদবি</option>
              {availableDesignations.map((des) => (
                <option key={des} value={des}>
                  {des}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Specific Person Filter Dropdown */}
          <div className={`flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-xl text-xs ${
            selectedPerson !== 'all' || scopeMode === 'by_specific' ? 'border-rose-400 ring-1 ring-rose-300' : 'border-stone-200'
          }`}>
            <UserCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={selectedPerson}
              onChange={(e) => {
                setSelectedPerson(e.target.value);
                if (e.target.value !== 'all') {
                  setScopeMode('by_specific');
                  setSelectedDesignation('all');
                }
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-stone-700 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="all">ব্যক্তি: নির্দিষ্ট কর্মী/লেখক</option>
              {specificPeople.map((person) => (
                <option key={person.name} value={person.name}>
                  {person.name} ({person.designation})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Category Filter Dropdown */}
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

        </div>

      </div>

      {/* 5. Status Stage Filter Tabs */}
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

      {/* 6. Dedicated Workflow Desk Articles Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Loading Notice */}
        {isNewsLoading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
            <span>সম্পাদকীয় ওয়ার্কফ্লো ডেটা লোড হচ্ছে...</span>
          </div>
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

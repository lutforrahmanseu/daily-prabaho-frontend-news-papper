import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { useGetAdminNewsListQuery, useDeleteNewsMutation } from '../../store/api/newsApi.js';
import { useTransitionWorkflowMutation } from '../../store/api/workflowApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { extractApiError, transitionArticleWorkflow } from '../../utils/apiNormalizer.js';
import { getEffectiveRole } from '../../utils/permissions.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import ArticleEditorModal from '../../components/admin/ArticleEditorModal.jsx';
import { AdminTableRowsSkeleton } from '../../components/admin/AdminSkeletons.jsx';
import sweetAlert from '../../utils/sweetAlert.js';
import { EDITORIAL_EASE } from '../../components/common/MotionPrimitives.jsx';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  RotateCcw,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminNewsPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const { language } = useSelector((state) => state.ui || {});
  const isBn = language === 'bn';
  const isSuperAdmin = getEffectiveRole(authState, adminState) === 'super_admin';

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'review' | 'draft' | 'scheduled'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { data: apiNewsData, isLoading: isNewsLoading, refetch: refetchNews } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const [deleteNewsMutation] = useDeleteNewsMutation();
  const [transitionWorkflow] = useTransitionWorkflowMutation();

  const resetAllFilters = () => {
    setTableSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
    refetchNews();
  };

  const isFiltered = Boolean(
    tableSearch.trim() ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFilter !== 'all' ||
    customStartDate ||
    customEndDate
  );

  const articles = useMemo(() => apiNewsData?.items || [], [apiNewsData]);
  const categoriesList = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories.filter((c) => !c.parentId && !c.parent_id) : []),
    [rawCategories]
  );

  // Bulk Selection & Modal State
  const [selectedIds, setSelectedIds] = useState([]);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // 1. Filtering Logic
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const searchLower = tableSearch.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        art.title?.toLowerCase().includes(searchLower) ||
        art.titleEn?.toLowerCase().includes(searchLower) ||
        art.excerpt?.toLowerCase().includes(searchLower) ||
        art.summary?.toLowerCase().includes(searchLower) ||
        art.author?.toLowerCase().includes(searchLower) ||
        art.reporter?.toLowerCase().includes(searchLower) ||
        art.categoryName?.toLowerCase().includes(searchLower) ||
        art.slug?.toLowerCase().includes(searchLower);

      const matchesCat =
        categoryFilter === 'all' ||
        art.category === categoryFilter ||
        art.categoryName === categoryFilter ||
        String(art.categoryId) === String(categoryFilter) ||
        art.categoryObj?.slug === categoryFilter ||
        art.categoryObj?.name === categoryFilter ||
        art.subcategory === categoryFilter ||
        art.subcategoryName === categoryFilter ||
        String(art.subcategoryId) === String(categoryFilter);

      const currentStatus = art.status || 'published';
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'review'
            ? ['submitted', 'under_review', 'approved'].includes(currentStatus)
            : currentStatus === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const rawDate = art.publishedAt || art.createdAt;
        if (!rawDate) {
          matchesDate = true;
        } else {
          const articleDate = new Date(rawDate);
          const now = new Date();

          if (dateFilter === 'today') {
            const isSameLocal =
              articleDate.getFullYear() === now.getFullYear() &&
              articleDate.getMonth() === now.getMonth() &&
              articleDate.getDate() === now.getDate();
            const isSameUtc =
              articleDate.getUTCFullYear() === now.getUTCFullYear() &&
              articleDate.getUTCMonth() === now.getUTCMonth() &&
              articleDate.getUTCDate() === now.getUTCDate();
            matchesDate = isSameLocal || isSameUtc;
          } else if (dateFilter === 'this_week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = articleDate >= oneWeekAgo;
          } else if (dateFilter === 'this_month') {
            matchesDate =
              articleDate.getMonth() === now.getMonth() &&
              articleDate.getFullYear() === now.getFullYear();
          } else if (dateFilter === 'custom' && (customStartDate || customEndDate)) {
            if (customStartDate && new Date(customStartDate) > articleDate) matchesDate = false;
            if (customEndDate && new Date(customEndDate + 'T23:59:59') < articleDate) matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesCat && matchesStatus && matchesDate;
    });
  }, [articles, tableSearch, categoryFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Pagination Math
  const totalPages = Math.ceil(filteredArticles.length / pageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  // Bulk Selection Handlers
  const isAllCurrentSelected = paginatedArticles.length > 0 && paginatedArticles.every((a) => selectedIds.includes(a.id));
  const isSomeCurrentSelected = paginatedArticles.some((a) => selectedIds.includes(a.id)) && !isAllCurrentSelected;

  const handleSelectAllToggle = () => {
    if (isAllCurrentSelected) {
      const pageIds = paginatedArticles.map((a) => a.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedArticles.map((a) => a.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleRowSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Bulk Actions via Laravel API
  const handleBulkStatusChange = async (newStatus, labelBn) => {
    if (selectedIds.length === 0) return;
    const defaultSchedule = `${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('.')[0]}Z`;
    const results = await Promise.allSettled(
      selectedIds.map((id) => {
        const art = articles.find((a) => a.id === id);
        return transitionArticleWorkflow({
          transitionMutation: transitionWorkflow,
          articleId: id,
          fromStatus: art?.status || 'draft',
          toStatus: newStatus,
          scheduled_at: newStatus === 'scheduled' ? defaultSchedule : undefined,
          isSuperAdmin
        });
      })
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    if (succeeded > 0) {
      await sweetAlert.fire({
        icon: failed ? 'info' : 'success',
        title: 'স্থিতি পরিবর্তিত হয়েছে!',
        text: `${toBengaliNumber(succeeded)}টি সংবাদের স্থিতি "${labelBn}" এ পরিবর্তন করা হয়েছে${failed ? ` (${toBengaliNumber(failed)}টি ব্যর্থ)` : ''}`,
        timer: 2600,
        timerProgressBar: true
      });
    } else {
      await sweetAlert.error('ব্যর্থ হয়েছে', 'বাল্ক স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।');
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const { isConfirmed } = await sweetAlert.confirmDelete(
      `নির্বাচিত ${toBengaliNumber(selectedIds.length)}টি সংবাদ`,
      `আপনি কি নিশ্চিত যে নির্বাচিত ${toBengaliNumber(selectedIds.length)}টি সংবাদ স্থায়ীভাবে মুছে ফেলতে চান?`
    );
    if (!isConfirmed) return;

    const results = await Promise.allSettled(selectedIds.map((id) => deleteNewsMutation(id).unwrap()));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    if (succeeded > 0) {
      await sweetAlert.success(
        'অপসারিত হয়েছে!',
        `${toBengaliNumber(succeeded)}টি সংবাদ সফলভাবে মুছে ফেলা হয়েছে`
      );
    } else {
      await sweetAlert.error('ব্যর্থ হয়েছে', 'সংবাদ মুছে ফেলতে ব্যর্থ হয়েছে।');
    }
    setSelectedIds([]);
  };

  // Single Item Actions
  const handleEdit = (article) => {
    setEditingArticle(article);
    setEditorModalOpen(true);
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setEditorModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      title,
      `আপনি কি নিশ্চিত যে "${title}" সংবাদটি অপসারণ করতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteNewsMutation(id).unwrap();
      await sweetAlert.success('সংবাদ অপসারিত হয়েছে!', 'সংবাদটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error) {
      await sweetAlert.error('মুছে ফেলা যায়নি', extractApiError(error, 'সংবাদটি মুছে ফেলতে ব্যর্থ হয়েছে।'));
    }
  };

  const handleStatusChange = async (article, newStatus) => {
    if (['returned', 'rejected'].includes(newStatus)) {
      await sweetAlert.info('নির্দেশনা', 'ফেরত বা বাতিলের কারণ লিখতে "সম্পাদনা ওয়াকর্ফ্লো" প্যানেল ব্যবহার করুন।');
      return;
    }
    try {
      const defaultSchedule = `${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('.')[0]}Z`;
      await transitionArticleWorkflow({
        transitionMutation: transitionWorkflow,
        articleId: article.id,
        fromStatus: article.status || 'draft',
        toStatus: newStatus,
        scheduled_at: newStatus === 'scheduled' ? (article.scheduledAt || defaultSchedule) : undefined,
        isSuperAdmin
      });
      await sweetAlert.success('স্থিতি হালনাগাদ হয়েছে!', 'সংবাদের স্থিতি সফলভাবে পরিবর্তন করা হয়েছে।');
    } catch (error) {
      await sweetAlert.error('পরিবর্তন ব্যর্থ হয়েছে', extractApiError(error, 'স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।'));
    }
  };

  // Counts for pills (single-pass memoized)
  const { totalCount, publishedCount, inReviewCount, draftCount, scheduledCount } = useMemo(() => {
    let published = 0;
    let inReview = 0;
    let draft = 0;
    let scheduled = 0;
    for (const a of articles) {
      const s = a.status || 'published';
      if (s === 'published') published += 1;
      else if (s === 'submitted' || s === 'under_review' || s === 'approved') inReview += 1;
      else if (s === 'draft') draft += 1;
      else if (s === 'scheduled') scheduled += 1;
    }
    return {
      totalCount: apiNewsData?.pagination?.total || articles.length,
      publishedCount: published,
      inReviewCount: inReview,
      draftCount: draft,
      scheduledCount: scheduled
    };
  }, [articles, apiNewsData?.pagination?.total]);

  const statusTabs = useMemo(() => [
    { key: 'all', label: isBn ? 'সকল' : 'All', count: totalCount },
    { key: 'published', label: isBn ? 'প্রকাশিত' : 'Published', count: publishedCount },
    { key: 'review', label: isBn ? 'পর্যালোচনায়' : 'In Review', count: inReviewCount },
    { key: 'draft', label: isBn ? 'খসড়া' : 'Drafts', count: draftCount },
    { key: 'scheduled', label: isBn ? 'শিডিউল্ড' : 'Scheduled', count: scheduledCount }
  ], [isBn, totalCount, publishedCount, inReviewCount, draftCount, scheduledCount]);

  return (
    <div className="space-y-4">
      {/* Unified Single Card Container */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">

        {/* 1. Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-serif-bn text-stone-900 dark:text-stone-100 tracking-tight">
              {isBn ? 'সংবাদ ব্যবস্থাপনা' : 'News Management'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {isBn
                ? 'সংবাদ তৈরি, সম্পাদনা, পর্যালোচনা ও প্রকাশনা পরিচালনা'
                : 'Create, edit, review, and publish news articles'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন সংবাদ' : 'New Article'}</span>
          </button>
        </div>

        {/* 2. Status Tabs + Filter Toolbar Section */}
        <div className="p-4 bg-stone-50/40 dark:bg-stone-900/50 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  active
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  active
                    ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                    : 'bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}>
                  {isBn ? toBengaliNumber(tab.count) : tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">

          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isBn ? 'শিরোনাম বা প্রতিবেদক খুঁজুন...' : 'Search headline or reporter...'}
              className="w-full pl-9 pr-8 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title={isBn ? 'অনুসন্ধান মুছুন' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters: Category & Date */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="all">{isBn ? 'সকল বিভাগ' : 'All Categories'}</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {isBn ? cat.name : (cat.nameEn || cat.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="all">{isBn ? 'সকল সময়কাল' : 'All Dates'}</option>
                <option value="today">{isBn ? 'আজ' : 'Today'}</option>
                <option value="this_week">{isBn ? 'গত ৭ দিন' : 'Last 7 Days'}</option>
                <option value="this_month">{isBn ? 'এই মাস' : 'This Month'}</option>
                <option value="custom">{isBn ? 'নির্দিষ্ট তারিখ' : 'Custom Range'}</option>
              </select>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                title={isBn ? 'ফিল্টার রিসেট' : 'Reset filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? 'রিসেট' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Row if selected */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-stone-600">তারিখ সীমা:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 border border-stone-300 rounded-lg font-mono text-xs"
            />
            <span className="text-stone-400">থেকে</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 border border-stone-300 rounded-lg font-mono text-xs"
            />
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-rose-700 hover:underline text-[11px] font-bold"
              >
                রিসেট
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Floating / Sticky Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
            className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-rose-700 text-white flex items-center justify-center font-bold text-xs font-mono">
                {isBn ? toBengaliNumber(selectedIds.length) : selectedIds.length}
              </span>
              <span className="text-xs font-bold text-stone-200">
                {isBn
                  ? `${toBengaliNumber(selectedIds.length)}টি সংবাদ নির্বাচিত হয়েছে`
                  : `${selectedIds.length} articles selected`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-stone-400 hover:text-white text-xs underline cursor-pointer ml-1"
              >
                {isBn ? 'নির্বাচন বাতিল' : 'Deselect'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleBulkStatusChange('published', isBn ? 'লাইভ প্রকাশিত' : 'Published')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isBn ? 'সরাসরি প্রকাশ (Publish)' : 'Publish Live'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('submitted', isBn ? 'পর্যালোচনায়' : 'In Review')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isBn ? 'পর্যালোচনায় জমা (Review)' : 'Submit to Review'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('draft', isBn ? 'খসড়া' : 'Draft')}
                className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isBn ? 'খসড়ায় নিন (Draft)' : 'Move to Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'মুছে ফেলুন (Delete)' : 'Delete'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. News Table with Bulk Checkboxes (inside the same unified card) */}
      <div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {/* Bulk Select All Checkbox */}
                <th className="w-10 px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAllToggle}
                    className="p-1 rounded text-stone-600 hover:text-stone-900 cursor-pointer"
                    title={isAllCurrentSelected ? (isBn ? 'সব অনির্বাচন করুন' : 'Deselect all') : (isBn ? 'সব নির্বাচন করুন' : 'Select all')}
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-700" />
                    ) : isSomeCurrentSelected ? (
                      <MinusSquare className="w-4 h-4 text-rose-700" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">{isBn ? 'সংবাদ শিরোনাম ও বিবরণ' : 'Article Headline & Excerpt'}</th>
                <th className="px-4 py-3.5">{isBn ? 'বিভাগ' : 'Category'}</th>
                <th className="px-4 py-3.5">{isBn ? 'প্রতিবেদক' : 'Reporter'}</th>
                <th className="px-4 py-3.5">{isBn ? 'প্রকাশকাল' : 'Published'}</th>
                <th className="px-4 py-3.5">{isBn ? 'ভিউ' : 'Views'}</th>
                <th className="px-4 py-3.5">{isBn ? 'স্থিতি (Status)' : 'Status'}</th>
                <th className="px-4 py-3.5 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {isNewsLoading ? (
                <AdminTableRowsSkeleton rows={6} colSpan={8} />
              ) : paginatedArticles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-500 text-xs">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-800 text-sm">
                          {isFiltered ? 'ফিল্টারের সাথে মেলে এমন কোনো সংবাদ পাওয়া যায়নি' : 'এখনো কোনো সংবাদ নেই'}
                        </p>
                        <p className="text-stone-500 text-xs mt-1">
                          {isFiltered
                            ? 'অনুসন্ধান বা ফিল্টারের শর্ত পরিবর্তন করুন অথবা সব সংবাদ দেখতে রিসেট করুন।'
                            : 'নতুন সংবাদ যুক্ত করতে উপরের "নতুন সংবাদ প্রকাশ করুন" বোতামে ক্লিক করুন।'}
                        </p>
                      </div>

                      {isFiltered && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {tableSearch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium">
                              অনুসন্ধান: "{tableSearch}"
                              <button
                                type="button"
                                onClick={() => setTableSearch('')}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {categoryFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium">
                              বিভাগ: {categoriesList.find(c => c.slug === categoryFilter)?.name || categoryFilter}
                              <button
                                type="button"
                                onClick={() => setCategoryFilter('all')}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {dateFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium">
                              সময়কাল: {dateFilter === 'today' ? 'আজ' : dateFilter === 'this_week' ? 'গত ৭ দিন' : dateFilter === 'this_month' ? 'এই মাস' : 'নির্দিষ্ট'}
                              <button
                                type="button"
                                onClick={() => setDateFilter('all')}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {statusFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium">
                              স্ট্যাটাস: {statusFilter}
                              <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      )}

                      {isFiltered && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={resetAllFilters}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white hover:bg-rose-800 text-xs font-bold cursor-pointer transition-colors shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>সব ফিল্টার মুছে ফেলুন</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedArticles.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const status = row.status || 'published';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-stone-50/70 transition-colors ${isSelected ? 'bg-rose-50/40' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRowSelect(row.id)}
                          className="p-1 rounded text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-700" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300" />
                          )}
                        </button>
                      </td>

                      {/* Title & Badges */}
                      <td className="px-4 py-3">
                        <div className="max-w-md font-serif-bn">
                          <div className="flex items-center gap-1.5 mb-1">
                            {row.isLead && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                                {isBn ? '★ প্রধান শীর্ষ' : '★ Lead'}
                              </span>
                            )}
                            {row.isBreaking && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                {isBn ? '⚡ ব্রেকিং' : '⚡ Breaking'}
                              </span>
                            )}
                            {row.isFeatured && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                {isBn ? '✦ ফিচার্ড' : '✦ Featured'}
                              </span>
                            )}
                            {row.aiAssisted && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold px-1.5 py-0.2 rounded">
                                {isBn ? 'AI সহায়তা' : 'AI Assisted'}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-stone-900 text-sm line-clamp-1 hover:text-rose-700 transition-colors">
                            {isBn ? row.title : (row.titleEn || row.title)}
                          </p>
                          <p className="text-[11px] text-stone-500 font-sans line-clamp-1 mt-0.5">
                            {isBn ? row.excerpt : (row.excerptEn || row.excerpt)}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold">
                          {isBn ? row.categoryName : (row.categoryNameEn || row.categoryName)}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-stone-700">
                          {row.author || (isBn ? 'স্টাফ রিপোর্টার' : 'Staff Reporter')}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-stone-500 font-mono">
                          {isBn ? formatBengaliRelativeTime(row.publishedAt) : 'Recently'}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-stone-800">
                          {isBn ? toBengaliNumber(row.views || 0) : (row.views || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(row, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ['submitted', 'under_review', 'approved'].includes(status)
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : status === 'scheduled'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : ['returned', 'rejected'].includes(status)
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-stone-100 text-stone-700 border-stone-300'
                            }`}
                        >
                          <option value="published">{isBn ? 'লাইভ (Published)' : 'Published'}</option>
                          <option value="submitted">{isBn ? 'জমাকৃত (Submitted)' : 'Submitted'}</option>
                          <option value="under_review">{isBn ? 'পর্যালোচনায় (Under Review)' : 'Under Review'}</option>
                          <option value="approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved'}</option>
                          <option value="draft">{isBn ? 'খসড়া (Draft)' : 'Draft'}</option>
                          <option value="scheduled">{isBn ? 'শিডিউল্ড (Scheduled)' : 'Scheduled'}</option>
                          <option value="archived">{isBn ? 'আর্কাইভ (Archived)' : 'Archived'}</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/news/${row.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                            title={isBn ? 'পাবলিক পেজ দেখুন' : 'View Public Page'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title={isBn ? 'সম্পাদনা করুন' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id, row.title)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Pagination Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-stone-500 font-mono">
            {isBn ? (
              <>
                মোট <strong>{toBengaliNumber(filteredArticles.length)}</strong> টি সংবাদের মধ্যে{' '}
                <strong>{toBengaliNumber(Math.min((currentPage - 1) * pageSize + 1, filteredArticles.length))}</strong> থেকে{' '}
                <strong>{toBengaliNumber(Math.min(currentPage * pageSize, filteredArticles.length))}</strong> প্রদর্শন
              </>
            ) : (
              <>
                Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredArticles.length)}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredArticles.length)}</strong> of{' '}
                <strong>{filteredArticles.length}</strong> articles
              </>
            )}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={isBn ? 'পূর্ববর্তী পেজ' : 'Previous page'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-lg bg-stone-200 font-bold font-mono text-stone-800">
              {isBn ? toBengaliNumber(currentPage) : currentPage} / {isBn ? toBengaliNumber(totalPages) : totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={isBn ? 'পরবর্তী পেজ' : 'Next page'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Complete Article Editor Modal */}
      <ArticleEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        articleToEdit={editingArticle}
        onSuccess={resetAllFilters}
      />
    </div>
  );
}

export default AdminNewsPage;

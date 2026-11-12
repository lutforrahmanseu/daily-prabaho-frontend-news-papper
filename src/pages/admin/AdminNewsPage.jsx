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
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminNewsPage() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
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

  const { data: apiNewsData, isLoading: isNewsLoading } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const [deleteNewsMutation] = useDeleteNewsMutation();
  const [transitionWorkflow] = useTransitionWorkflowMutation();

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
        art.excerpt?.toLowerCase().includes(searchLower) ||
        art.author?.toLowerCase().includes(searchLower) ||
        art.reporter?.toLowerCase().includes(searchLower) ||
        art.slug?.toLowerCase().includes(searchLower);

      const matchesCat = categoryFilter === 'all' || art.category === categoryFilter;

      const currentStatus = art.status || 'published';
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'review'
            ? ['submitted', 'under_review', 'approved'].includes(currentStatus)
            : currentStatus === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all' && (art.publishedAt || art.createdAt)) {
        const articleDate = new Date(art.publishedAt || art.createdAt);
        const now = new Date();

        if (dateFilter === 'today') {
          matchesDate = articleDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'this_week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = articleDate >= oneWeekAgo;
        } else if (dateFilter === 'this_month') {
          matchesDate = articleDate.getMonth() === now.getMonth() && articleDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'custom' && (customStartDate || customEndDate)) {
          if (customStartDate && new Date(customStartDate) > articleDate) matchesDate = false;
          if (customEndDate && new Date(customEndDate + 'T23:59:59') < articleDate) matchesDate = false;
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

  // Counts for pills
  const totalCount = apiNewsData?.pagination?.total || articles.length;
  const publishedCount = articles.filter((a) => (a.status || 'published') === 'published').length;
  const inReviewCount = articles.filter((a) => ['submitted', 'under_review', 'approved'].includes(a.status)).length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const scheduledCount = articles.filter((a) => a.status === 'scheduled').length;

  return (
    <div className="space-y-6">

      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
            সংবাদ ব্যবস্থাপনা ও কনটেন্ট সিএমএস
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            ফিল্টারিং, বাল্ক একশন, রিচ-টেক্সট এডিটিং এবং প্রকাশনা ট্র্যাকিং
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন সংবাদ প্রকাশ করুন</span>
        </button>
      </div>

      {/* 2. Status Metric Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
            }`}
        >
          <p className="text-[11px] font-semibold opacity-75">সর্বমোট সংবাদ</p>
          <p className="text-xl font-extrabold font-serif-bn mt-0.5">{toBengaliNumber(totalCount)}টি</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('published'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === 'published'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
            }`}
        >
          <p className="text-[11px] font-semibold opacity-75">প্রকাশিত (Live)</p>
          <p className="text-xl font-extrabold font-serif-bn mt-0.5 text-emerald-600">
            {toBengaliNumber(publishedCount)}টি
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('review'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === 'review'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:border-amber-300'
            }`}
        >
          <p className="text-[11px] font-semibold opacity-75">পর্যালোচনায় (Review)</p>
          <p className={`text-xl font-extrabold font-serif-bn mt-0.5 ${statusFilter === 'review' ? 'text-white' : 'text-amber-600'}`}>
            {toBengaliNumber(inReviewCount)}টি
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('draft'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === 'draft'
              ? 'bg-stone-700 text-white border-stone-700 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
            }`}
        >
          <p className="text-[11px] font-semibold opacity-75">খসড়া (Draft)</p>
          <p className="text-xl font-extrabold font-serif-bn mt-0.5 text-stone-600">
            {toBengaliNumber(draftCount)}টি
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('scheduled'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === 'scheduled'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:border-blue-300'
            }`}
        >
          <p className="text-[11px] font-semibold opacity-75">শিডিউল্ড (Scheduled)</p>
          <p className="text-xl font-extrabold font-serif-bn mt-0.5 text-blue-600">
            {toBengaliNumber(scheduledCount)}টি
          </p>
        </button>
      </div>

      {/* 3. Search and Multi-Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="শিরোনাম, প্রতিবেদক বা কিওয়ার্ড দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Filters: Category & Date */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="all">সকল বিভাগ (All Categories)</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name} ({cat.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="all">সকল সময়কাল (All Dates)</option>
                <option value="today">আজকের সংবাদ (Today)</option>
                <option value="this_week">গত ৭ দিন (This Week)</option>
                <option value="this_month">এই মাস (This Month)</option>
                <option value="custom">নির্দিষ্ট সময়সীমা (Custom Range)</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
              <span>প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value={10}>১০টি</option>
                <option value={20}>২০টি</option>
                <option value={50}>৫০টি</option>
              </select>
            </div>

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
                {toBengaliNumber(selectedIds.length)}
              </span>
              <span className="text-xs font-bold text-stone-200">
                {toBengaliNumber(selectedIds.length)}টি সংবাদ নির্বাচিত হয়েছে
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-stone-400 hover:text-white text-xs underline cursor-pointer ml-1"
              >
                নির্বাচন বাতিল
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleBulkStatusChange('published', 'লাইভ প্রকাশিত')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>সরাসরি প্রকাশ (Publish)</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('submitted', 'পর্যালোচনায়')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>পর্যালোচনায় জমা (Review)</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('draft', 'খসড়া')}
                className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>খসড়ায় নিন (Draft)</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মুছে ফেলুন (Delete)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. News Table with Bulk Checkboxes */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
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
                    title={isAllCurrentSelected ? 'সব অনির্বাচন করুন' : 'সব নির্বাচন করুন'}
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
                <th className="px-4 py-3.5">সংবাদ শিরোনাম ও বিবরণ</th>
                <th className="px-4 py-3.5">বিভাগ</th>
                <th className="px-4 py-3.5">প্রতিবেদক</th>
                <th className="px-4 py-3.5">প্রকাশকাল</th>
                <th className="px-4 py-3.5">ভিউ</th>
                <th className="px-4 py-3.5">স্থিতি (Status)</th>
                <th className="px-4 py-3.5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {isNewsLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400 text-xs">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
                      <span>সংবাদ তালিকা লোড হচ্ছে...</span>
                    </span>
                  </td>
                </tr>
              ) : paginatedArticles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400 text-xs italic">
                    কোনো সংবাদ খুঁজে পাওয়া যায়নি (No matching news found)
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
                                ★ প্রধান শীর্ষ
                              </span>
                            )}
                            {row.isBreaking && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                ⚡ ব্রেকিং
                              </span>
                            )}
                            {row.isFeatured && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                ✦ ফিচার্ড
                              </span>
                            )}
                            {row.aiAssisted && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold px-1.5 py-0.2 rounded">
                                AI সহায়তা
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-stone-900 text-sm line-clamp-1 hover:text-rose-700 transition-colors">
                            {row.title}
                          </p>
                          <p className="text-[11px] text-stone-500 font-sans line-clamp-1 mt-0.5">
                            {row.excerpt}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold">
                          {row.categoryName}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-stone-700">{row.author}</span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-stone-500 font-mono">
                          {formatBengaliRelativeTime(row.publishedAt)}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-stone-800">
                          {toBengaliNumber(row.views || 0)}
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
                          <option value="published">লাইভ (Published)</option>
                          <option value="submitted">জমাকৃত (Submitted)</option>
                          <option value="under_review">পর্যালোচনায় (Under Review)</option>
                          <option value="approved">অনুমোদিত (Approved)</option>
                          <option value="draft">খসড়া (Draft)</option>
                          <option value="scheduled">শিডিউল্ড (Scheduled)</option>
                          <option value="archived">আর্কাইভ (Archived)</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/news/${row.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                            title="পাবলিক পেজ দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id, row.title)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
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
            মোট <strong>{toBengaliNumber(filteredArticles.length)}</strong> টি সংবাদের মধ্যে{' '}
            <strong>{toBengaliNumber(Math.min((currentPage - 1) * pageSize + 1, filteredArticles.length))}</strong> থেকে{' '}
            <strong>{toBengaliNumber(Math.min(currentPage * pageSize, filteredArticles.length))}</strong> প্রদর্শন
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="পূর্ববর্তী পেজ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-lg bg-stone-200 font-bold font-mono text-stone-800">
              {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="পরবর্তী পেজ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Complete Article Editor Modal */}
      <ArticleEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        articleToEdit={editingArticle}
      />
    </div>
  );
}

export default AdminNewsPage;

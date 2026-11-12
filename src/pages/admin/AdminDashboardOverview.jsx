import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import {
  useGetOverviewAnalyticsQuery,
  useGetRealtimeAnalyticsQuery
} from '../../store/api/analyticsApi.js';
import {
  useGetAdminNewsListQuery,
  useDeleteNewsMutation
} from '../../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useGetReportersQuery } from '../../store/api/reporterApi.js';
import { useGetAuditLogsQuery } from '../../store/api/auditLogApi.js';
import { useTransitionWorkflowMutation } from '../../store/api/workflowApi.js';
import { extractApiError, transitionArticleWorkflow } from '../../utils/apiNormalizer.js';
import { getEffectiveRole, hasEffectivePermission } from '../../utils/permissions.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import ArticleEditorModal from '../../components/admin/ArticleEditorModal.jsx';
import Table from '../../components/Table.jsx';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  EDITORIAL_EASE,
  MotionStaggerGrid,
  MotionStaggerItem
} from '../../components/common/MotionPrimitives.jsx';
import {
  FileText,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowUpRight,
  BarChart3,
  Edit,
  Trash2,
  ExternalLink,
  Activity,
  Loader2
} from 'lucide-react';

const BENGALI_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const CATEGORY_COLORS = ['#be123c', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

export function AdminDashboardOverview() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const effectiveRole = getEffectiveRole(authState, adminState);
  const isSuperAdmin = effectiveRole === 'super_admin';
  const canViewAuditLogs = hasEffectivePermission(authState, adminState, ['user.manage', 'settings.manage']);

  const { data: overview, isLoading: isOverviewLoading } = useGetOverviewAnalyticsQuery();
  const { data: realtime } = useGetRealtimeAnalyticsQuery();
  const { data: adminNewsData, isLoading: isNewsLoading } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: rawCategories = [] } = useGetCategoriesQuery();
  const { data: reportersData } = useGetReportersQuery({ per_page: 50 });
  const { data: auditLogsData } = useGetAuditLogsQuery({ per_page: 6 }, { skip: !canViewAuditLogs });

  const [deleteNewsMutation] = useDeleteNewsMutation();
  const [transitionWorkflow] = useTransitionWorkflowMutation();

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const articles = useMemo(() => adminNewsData?.items || [], [adminNewsData]);
  const reportersList = useMemo(() => reportersData?.items || [], [reportersData]);
  const recentLogs = useMemo(() => auditLogsData?.items || [], [auditLogsData]);

  // Derived real metrics (API overview first, article list fallback while loading)
  const totalArticles = overview?.total_news ?? adminNewsData?.pagination?.total ?? articles.length;
  const totalViews = overview?.total_views ?? articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const pendingApprovals = useMemo(
    () => articles.filter((a) => ['submitted', 'under_review'].includes(a.status)),
    [articles]
  );
  const inReviewCount = overview?.pending_review ?? pendingApprovals.length;
  const totalReportersCount = overview?.total_reporters ?? reportersList.length;
  const publishedToday = realtime?.published_today ?? 0;
  const viewsToday = realtime?.views_today ?? 0;
  const recentArticles = useMemo(() => articles.slice(0, 6), [articles]);

  // Real weekly readership series aggregated by publish/create weekday
  const weeklyChartData = useMemo(() => {
    const map = BENGALI_DAYS.map((day, idx) => ({
      dayIndex: idx,
      day,
      views: 0,
      shares: 0,
      count: 0
    }));
    articles.forEach((art) => {
      const dt = art.publishedAt || art.createdAt ? new Date(art.publishedAt || art.createdAt) : null;
      const idx = dt && !Number.isNaN(dt.getTime()) ? dt.getDay() : 0;
      map[idx].views += Number(art.views || 0);
      map[idx].shares += Number(art.shares || 0);
      map[idx].count += 1;
    });
    return map;
  }, [articles]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => new Date().getDay());
  const selectedDay = weeklyChartData[selectedDayIndex] || weeklyChartData[0];
  const maxDayViews = useMemo(
    () => Math.max(10, ...weeklyChartData.map((d) => d.views)),
    [weeklyChartData]
  );
  const peakDay = useMemo(
    () => weeklyChartData.reduce((best, curr) => (curr.views > best.views ? curr : best), weeklyChartData[0]),
    [weeklyChartData]
  );

  // Real category distribution computed from live articles & categories
  const categoryDistribution = useMemo(() => {
    const roots = (Array.isArray(rawCategories) ? rawCategories : []).filter((c) => !c.parentId && !c.parent_id);
    const counts = {};
    articles.forEach((art) => {
      const key = art.category || 'bangladesh';
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = articles.length || 1;
    const rows = (roots.length > 0 ? roots : Object.keys(counts).map((slug) => ({ slug, name: slug }))).map((cat, idx) => {
      const count = counts[cat.slug] ?? cat.newsCount ?? 0;
      return {
        name: cat.name,
        slug: cat.slug,
        count,
        percentage: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      };
    });
    return rows.sort((a, b) => b.count - a.count).slice(0, 6);
  }, [rawCategories, articles]);

  const handleApprove = async (item) => {
    try {
      await transitionArticleWorkflow({
        transitionMutation: transitionWorkflow,
        articleId: item.id,
        fromStatus: item.status || 'submitted',
        toStatus: 'approved',
        comments: 'ড্যাশবোর্ড থেকে অনুমোদিত',
        isSuperAdmin
      });
      await sweetAlert.success('অনুমোদিত হয়েছে!', `"${item.title.substring(0, 28)}..." সংবাদটি অনুমোদিত হয়েছে।`);
    } catch (error) {
      await sweetAlert.error('অনুমোদন ব্যর্থ হয়েছে', extractApiError(error, 'অনুমোদন করতে ব্যর্থ হয়েছে।'));
    }
  };

  const handleReject = async (item) => {
    const { isConfirmed } = await sweetAlert.confirm({
      title: 'সংবাদ প্রত্যাখ্যান করবেন?',
      text: `আপনি কি নিশ্চিত যে "${item.title}" সংবাদটি প্রত্যাখ্যান করতে চান?`,
      icon: 'warning',
      confirmButtonText: 'হ্যাঁ, প্রত্যাখ্যান করুন',
      confirmVariant: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await transitionArticleWorkflow({
        transitionMutation: transitionWorkflow,
        articleId: item.id,
        fromStatus: item.status || 'under_review',
        toStatus: 'rejected',
        comments: 'ড্যাশবোর্ড ওভারভিউ থেকে প্রত্যাখ্যাত',
        isSuperAdmin
      });
      await sweetAlert.success('প্রত্যাখ্যান সম্পন্ন!', 'সংবাদটি প্রত্যাখ্যান করা হয়েছে।');
    } catch (error) {
      await sweetAlert.error('প্রত্যাখ্যান ব্যর্থ হয়েছে', extractApiError(error, 'প্রত্যাখ্যান করতে ব্যর্থ হয়েছে।'));
    }
  };

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
      `আপনি কি "${title}" সংবাদটি অপসারণ করতে চান?`
    );
    if (!isConfirmed) return;

    try {
      await deleteNewsMutation(id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', 'সংবাদটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error) {
      await sweetAlert.error('মুছে ফেলা যায়নি', extractApiError(error, 'সংবাদটি মুছে ফেলতে ব্যর্থ হয়েছে।'));
    }
  };

  // Recent articles table columns
  const tableColumns = [
    {
      header: 'শিরোনাম ও স্ট্যাটাস',
      accessor: 'title',
      render: (row) => (
        <div className="max-w-md font-serif-bn">
          <p className="font-bold text-stone-900 line-clamp-1 hover:text-rose-700 transition-colors">
            {row.title}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
            <span className="font-sans px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-medium">
              {row.categoryName}
            </span>
            {row.isLead && <span className="text-rose-700 font-bold">★ প্রধান শীর্ষ</span>}
            {row.isBreaking && <span className="text-amber-700 font-bold">⚡ ব্রেকিং</span>}
          </div>
        </div>
      )
    },
    {
      header: 'প্রতিবেদক',
      accessor: 'author',
      render: (row) => <span className="text-xs text-stone-700 font-medium">{row.author}</span>
    },
    {
      header: 'সময়',
      accessor: 'publishedAt',
      render: (row) => (
        <span className="text-xs text-stone-500 font-mono">
          {formatBengaliRelativeTime(row.publishedAt)}
        </span>
      )
    },
    {
      header: 'ভিউ',
      accessor: 'views',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-stone-800">
          {toBengaliNumber(row.views || 0)}
        </span>
      )
    },
    {
      header: 'পদক্ষেপ',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
            title="সম্পাদনা করুন"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id, row.title)}
            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
            title="অপসারণ করুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
              সম্পাদকীয় ওভারভিউ ড্যাশবোর্ড
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              লাইভ নিউজরুম
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            দৈনিক বার্তা প্রবাহের সংবাদ সংগ্রহ, পাঠকদের পাঠ প্রতিক্রিয়া, অনুমোদন ও প্রকাশনা পর্যবেক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/news"
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors shadow-xs"
          >
            সকল সংবাদ
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সংবাদ তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Cards */}
      <MotionStaggerGrid immediate className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total News */}
        <MotionStaggerItem>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">মোট সংবাদ</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn">
              {isOverviewLoading && isNewsLoading ? '...' : toBengaliNumber(totalArticles)}
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{toBengaliNumber(publishedToday)} আজ</span>
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">সকল প্রকাশিত ও খসড়া সংবাদ</p>
          </div>
        </MotionStaggerItem>

        {/* Total Views */}
        <MotionStaggerItem>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">মোট ভিউ</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn">
              {isOverviewLoading ? '...' : toBengaliNumber(totalViews)}
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{toBengaliNumber(overview?.total_shares ?? 0)} শেয়ার</span>
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">আজকের ভিউ {toBengaliNumber(viewsToday)}</p>
          </div>
        </MotionStaggerItem>

        {/* Pending Approvals */}
        <MotionStaggerItem>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">অনুমোদনের অপেক্ষায়</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-serif-bn">
              {toBengaliNumber(inReviewCount)}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-800">
              পর্যালোচনা
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">জমাকৃত ও পর্যালোচনাধীন রিপোর্ট</p>
          </div>
        </MotionStaggerItem>

        {/* Active Reporters */}
        <MotionStaggerItem>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">সক্রিয় সাংবাদিক</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn">
              {toBengaliNumber(totalReportersCount)}
            </h3>
            <span className="text-[11px] text-blue-600 font-bold">
              ব্যুরো টিম
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            প্রকাশিত সংবাদ {toBengaliNumber(overview?.published_news ?? 0)}টি
          </p>
          </div>
        </MotionStaggerItem>

      </MotionStaggerGrid>

      {/* 3. News Performance Chart & Category Share (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-700" />
                  <span>সাপ্তাহিক পাঠক পরিসংখ্যান ও এনগেজমেন্ট</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  গত ৭ দিনের পাঠক ভিউ এবং শেয়ারের প্রবণতা
                </p>
              </div>

              {/* Selected Day Stats Badge */}
              <div className="flex items-center gap-3 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-mono">
                <span className="text-stone-500">{selectedDay?.day}বার ({toBengaliNumber(selectedDay?.count || 0)}টি):</span>
                <span className="font-bold text-rose-700">{toBengaliNumber(selectedDay?.views || 0)} ভিউ</span>
                <span className="text-stone-300">|</span>
                <span className="font-bold text-emerald-700">{toBengaliNumber(selectedDay?.shares || 0)} শেয়ার</span>
              </div>
            </div>

            {/* Interactive Bar Chart Representation */}
            <div className="h-60 flex items-end gap-3 pt-6 pb-2 border-b border-stone-100">
              {weeklyChartData.map((item) => {
                const heightPercent = Math.max(8, Math.round((item.views / maxDayViews) * 100));
                const isSelected = selectedDay?.dayIndex === item.dayIndex;

                return (
                  <div
                    key={item.day}
                    onClick={() => setSelectedDayIndex(item.dayIndex)}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                  >
                    <div className="w-full flex justify-center items-end h-full">
                      <motion.div
                        initial={{ height: '0%' }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.45, delay: item.dayIndex * 0.04, ease: EDITORIAL_EASE }}
                        whileHover={{ scaleY: 1.03 }}
                        style={{ originY: 1 }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-colors duration-200 relative ${
                          isSelected
                            ? 'bg-rose-700 shadow-md ring-2 ring-rose-200'
                            : 'bg-stone-200 group-hover:bg-rose-300'
                        }`}
                      >
                        {/* Hover Popup Label */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                          {toBengaliNumber(item.views)}
                        </div>
                      </motion.div>
                    </div>
                    <span className={`text-[11px] font-medium font-serif-bn transition-colors ${
                      isSelected ? 'font-bold text-rose-700' : 'text-stone-500 group-hover:text-stone-800'
                    }`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-700"></span>
              <span>বারভিত্তিক পাঠক ভিউ</span>
            </span>
            <span className="font-mono text-[11px]">
              সর্বোচ্চ: {peakDay?.day}বারে {toBengaliNumber(peakDay?.views || 0)} ভিউ
            </span>
          </div>
        </div>

        {/* Category Share Distribution (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-serif-bn text-stone-900 mb-1">
              বিভাগভিত্তিক পাঠক আকর্ষণ
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              সবচেয়ে বেশি প্রকাশিত ক্যাটাগরি ও সংবাদ বণ্টন
            </p>

            <div className="space-y-3.5">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-mono text-stone-500 font-semibold">
                      {toBengaliNumber(cat.percentage)}% ({toBengaliNumber(cat.count)}টি)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
                      className="h-2 rounded-full origin-left"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">শীর্ষ ট্রেন্ডিং বিষয়:</span>
            <span className="text-xs font-bold text-rose-700">বাংলাদেশ ও রাজনীতি</span>
          </div>
        </div>

      </div>

      {/* 4. Pending Approvals & Recent Newsroom Activity (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Approvals (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>অনুমোদনের অপেক্ষায় থাকা সংবাদ ({toBengaliNumber(pendingApprovals.length)})</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                সম্পাদকদের চূড়ান্ত অনুমোদনের জন্য অপেক্ষমান ড্রাফটসমূহ
              </p>
            </div>
            <Link
              to="/admin/news"
              className="text-xs font-bold text-rose-700 hover:underline"
            >
              সব ড্রাফট দেখুন →
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="py-12 text-center text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-medium">কোনো সংবাদ অনুমোদনের অপেক্ষায় নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                        {item.categoryName}
                      </span>
                      <span className="text-stone-500 font-medium">{item.author}</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-stone-400 font-mono">
                        {formatBengaliRelativeTime(item.createdAt || item.publishedAt)}
                      </span>
                    </div>
                    <h4 className="font-bold font-serif-bn text-stone-900 text-sm line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-stone-600 line-clamp-1">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReject(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="প্রত্যাখ্যান করুন"
                    >
                      <XCircle className="w-3.5 h-3.5 text-stone-500" />
                      <span>প্রত্যাখ্যান</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      title="অনুমোদন করুন"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>অনুমোদন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Newsroom Recent Activity (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-serif-bn text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-700" />
              <span>সাম্প্রতিক কার্যক্রম</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">রিয়েল-টাইম</span>
          </div>

          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                {canViewAuditLogs ? 'সাম্প্রতিক কোনো কার্যক্রম নেই' : 'সর্বশেষ অডিট কার্যক্রম দেখতে অ্যাডমিন অনুমতি প্রয়োজন'}
              </p>
            ) : (
              recentLogs.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 font-bold flex items-center justify-center shrink-0 mt-0.5 border border-rose-100">
                    {(act.userName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800">
                      <span className="font-bold text-stone-900">{act.userName || act.user}</span>{' '}
                      <span className="text-stone-600">{act.action}</span>
                    </p>
                    <p className="font-serif-bn font-semibold text-rose-700 truncate mt-0.5">
                      {act.target || act.modelType || act.url}
                    </p>
                    <span className="text-[10px] text-stone-400">{formatBengaliRelativeTime(act.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 text-center">
            <Link
              to="/admin/audit-logs"
              className="text-xs font-bold text-rose-700 hover:underline inline-flex items-center gap-1"
            >
              <span>সম্পূর্ণ অডিট লগ দেখুন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 5. Recent News Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-serif-bn text-stone-900">
              সাম্প্রতিক প্রকাশিত সংবাদসমূহ
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              সর্বশেষ প্রকাশিত প্রতিবেদন, পাঠ প্রতিক্রিয়া এবং কার্যসমূহ
            </p>
          </div>
          <Link
            to="/admin/news"
            className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
          >
            <span>সকল সংবাদ টেবিল</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Table
          columns={tableColumns}
          data={recentArticles}
        />
      </div>

      {/* Article Editor Modal */}
      <ArticleEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        articleToEdit={editingArticle}
      />
    </div>
  );
}

export default AdminDashboardOverview;


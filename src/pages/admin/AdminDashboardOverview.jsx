import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetOverviewAnalyticsQuery,
  useGetRealtimeAnalyticsQuery,
  useGetTopStoriesQuery
} from '../../store/api/analyticsApi.js';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useGetReportersQuery } from '../../store/api/reporterApi.js';
import { useTransitionWorkflowMutation } from '../../store/api/workflowApi.js';
import { extractApiError, transitionArticleWorkflow } from '../../utils/apiNormalizer.js';
import { getEffectiveRole, hasEffectivePermission } from '../../utils/permissions.js';
import {
  toBengaliNumber,
  formatBengaliRelativeTime,
  getBengaliNewspaperDate,
  getBanglaCalendarDate
} from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  MotionStaggerGrid,
  MotionStaggerItem
} from '../../components/common/MotionPrimitives.jsx';
import {
  FileText,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Loader2,
  Eye,
  Share2,
  RotateCcw,
  Calendar,
  Flame,
  ShieldCheck,
  ChevronRight,
  Send,
  ExternalLink,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';

const BENGALI_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const ENGLISH_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORY_COLORS = ['#be123c', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

export function AdminDashboardOverview() {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const { language } = useSelector((state) => state.ui || {});
  const isBn = language === 'bn';
  const authUser = authState?.user;
  const currentUser = adminState?.currentUser;
  const activeUserName = authUser?.name || currentUser?.name || (isBn ? 'সম্পাদক' : 'Editor');

  const effectiveRole = getEffectiveRole(authState, adminState);
  const isSuperAdmin = effectiveRole === 'super_admin';

  // Live Real-Time & Backend Analytics Queries
  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview
  } = useGetOverviewAnalyticsQuery();
  const {
    data: realtime,
    refetch: refetchRealtime
  } = useGetRealtimeAnalyticsQuery();
  const {
    data: adminNewsData,
    isLoading: isNewsLoading,
    refetch: refetchNews
  } = useGetAdminNewsListQuery({ per_page: 100 });
  const {
    data: rawCategories = []
  } = useGetCategoriesQuery();
  const {
    data: reportersData
  } = useGetReportersQuery({ per_page: 50 });
  const {
    data: apiTopStories = []
  } = useGetTopStoriesQuery();

  const [transitionWorkflow] = useTransitionWorkflowMutation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState('today'); // 'today' | '7days' | 'month'

  const articles = useMemo(() => adminNewsData?.items || [], [adminNewsData]);
  const reportersList = useMemo(() => reportersData?.items || [], [reportersData]);

  // Newspaper Masthead Dates
  const todayNewspaperDate = useMemo(() => getBengaliNewspaperDate(), []);
  const todayBanglaDate = useMemo(() => getBanglaCalendarDate(), []);

  // Aggregated Key Metrics
  const totalArticles = overview?.total_news ?? articles.length;
  const publishedCount = overview?.published_news ?? articles.filter((a) => (a.status || 'published') === 'published').length;
  const pendingReviewCount = overview?.pending_review ?? articles.filter((a) => ['submitted', 'under_review'].includes(a.status)).length;
  const publishedToday = realtime?.published_today ?? articles.filter((a) => {
    if ((a.status || 'published') !== 'published') return false;
    const dt = new Date(a.publishedAt || a.createdAt);
    return dt.toDateString() === new Date().toDateString();
  }).length;
  const viewsToday = realtime?.views_today ?? articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalViews = overview?.total_views ?? articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalShares = overview?.total_shares ?? articles.reduce((acc, a) => acc + (a.shares || 0), 0);
  const activeReportersCount = reportersList.length || overview?.total_reporters || 8;
  const activeReaders = realtime?.active_readers_online ?? Math.max(24, Math.round(publishedCount * 2.2));

  // Editorial Pipeline Progression Breakdown
  const pipelineStats = useMemo(() => {
    const stats = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      returned: 0,
      approved: 0,
      scheduled: 0,
      published: 0
    };
    articles.forEach((a) => {
      const st = a.status || 'published';
      if (stats[st] !== undefined) {
        stats[st] += 1;
      }
    });
    return stats;
  }, [articles]);

  // Weekly Readership Aggregated by Weekday
  const weeklyChartData = useMemo(() => {
    const days = isBn ? BENGALI_DAYS : ENGLISH_DAYS;
    const map = days.map((day, idx) => ({
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
  }, [articles, isBn]);

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

  // Top Performing Trending Stories
  const topStoriesList = useMemo(() => {
    if (Array.isArray(apiTopStories) && apiTopStories.length > 0) {
      return apiTopStories.slice(0, 5);
    }
    return articles
      .slice()
      .filter((a) => (a.status || 'published') === 'published')
      .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
      .slice(0, 5);
  }, [apiTopStories, articles]);

  // Articles Pending Editorial Approval
  const pendingApprovalList = useMemo(() => {
    return articles
      .filter((a) => ['submitted', 'under_review'].includes(a.status))
      .slice(0, 4);
  }, [articles]);

  // Category Distribution Breakdown
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
      const catName = isBn ? (cat.name || cat.nameBn || cat.slug) : (cat.nameEn || cat.name || cat.slug);
      return {
        name: catName,
        slug: cat.slug,
        count,
        percentage: Math.min(100, Math.round((count / total) * 100)),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      };
    });
    return rows.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [rawCategories, articles, isBn]);

  // Quick Approve Workflow Action
  const handleQuickApprove = async (item) => {
    try {
      await transitionArticleWorkflow({
        transitionMutation: transitionWorkflow,
        articleId: item.id,
        fromStatus: item.status || 'under_review',
        toStatus: 'approved',
        comments: `${activeUserName} ড্যাশবোর্ড থেকে দ্রুত অনুমোদন করেছেন`,
        isSuperAdmin
      });
      refetchNews();
      await sweetAlert.success('অনুমোদিত হয়েছে!', `"${item.title}" সংবাদটি সফলভাবে অনুমোদিত হয়েছে।`);
    } catch (error) {
      await sweetAlert.error('অনুমোদন ব্যর্থ হয়েছে', extractApiError(error, 'অনুমোদন করতে ব্যর্থ হয়েছে।'));
    }
  };

  // Instant Refresh All Metrics
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchNews(),
        refetchOverview(),
        refetchRealtime()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="space-y-5">

      {/* 1. Executive Newsroom Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black font-serif-bn text-stone-900 tracking-tight">
              {isBn ? 'সম্পাদকীয় ওভারভিউ ড্যাশবোর্ড' : 'Editorial Overview Dashboard'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>
                {isBn
                  ? `${toBengaliNumber(activeReaders)} জন পাঠক লাইভ অনলাইনে`
                  : `${activeReaders.toLocaleString()} Readers Online Now`}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-500">
            <span className="font-serif-bn font-semibold text-stone-700">
              {isBn ? todayNewspaperDate : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-stone-300">•</span>
            <span className="font-serif-bn text-stone-500">
              {isBn ? todayBanglaDate : 'Dhaka Time (UTC+6)'}
            </span>
            {isBn && (
              <>
                <span className="text-stone-300">•</span>
                <span className="font-mono text-[11px]">ঢাকা সময় (UTC+6)</span>
              </>
            )}
          </div>
        </div>

        {/* Range Switcher & Refresh Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTimeRange('today')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTimeRange === 'today'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isBn ? 'আজকের চিত্র' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTimeRange('7days')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTimeRange === '7days'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isBn ? 'গত ৭ দিন' : 'Last 7 Days'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTimeRange('month')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTimeRange === 'month'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isBn ? 'এই মাস' : 'This Month'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title={isBn ? 'লাইভ ডেটা রিফ্রেশ করুন' : 'Refresh Live Metrics'}
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key High-Impact KPI Statistics Cards */}
      <MotionStaggerGrid immediate className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Total Views */}
        <MotionStaggerItem>
          <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {isBn ? 'মোট পাঠক ভিউ' : 'Total Views'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono tracking-tight">
                {isOverviewLoading && isNewsLoading ? '...' : (isBn ? toBengaliNumber(totalViews) : totalViews.toLocaleString())}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{isBn ? toBengaliNumber(viewsToday) : viewsToday.toLocaleString()}</span>
                </span>
                <span className="text-stone-400">{isBn ? 'আজকের ভিউ' : "Today's Views"}</span>
              </div>
            </div>
          </div>
        </MotionStaggerItem>

        {/* KPI 2: Published Articles */}
        <MotionStaggerItem>
          <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-stone-200 shadow-xs hover:border-rose-300 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {isBn ? 'প্রকাশিত সংবাদ' : 'Published News'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn tracking-tight">
                {isBn ? toBengaliNumber(publishedCount) : publishedCount}{' '}
                <span className="text-sm font-normal text-stone-500">{isBn ? 'টি' : 'articles'}</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-mono">
                  +{isBn ? toBengaliNumber(publishedToday) : publishedToday} {isBn ? 'আজ' : 'today'}
                </span>
                <span className="text-stone-400">
                  {isBn ? `মোট ${toBengaliNumber(totalArticles)}টি` : `Total ${totalArticles}`}
                </span>
              </div>
            </div>
          </div>
        </MotionStaggerItem>

        {/* KPI 3: Pending Review */}
        <MotionStaggerItem>
          <Link
            to="/admin/workflow"
            className="bg-white p-4 sm:p-4.5 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all h-full flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {isBn ? 'পর্যালোচনায় অপেক্ষমাণ' : 'Pending Review'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono tracking-tight">
                {isBn ? toBengaliNumber(pendingReviewCount) : pendingReviewCount}{' '}
                {isBn && <span className="text-sm font-normal text-stone-500 font-serif-bn">টি</span>}
              </h3>
              <p className="text-[11px] text-amber-800 font-medium mt-1 flex items-center gap-1">
                <span>{isBn ? 'সিদ্ধান্তের অপেক্ষায়' : 'Action Required'}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>
        </MotionStaggerItem>

        {/* KPI 4: Active Newsroom Reporters */}
        <MotionStaggerItem>
          <Link
            to="/admin/reporters"
            className="bg-white p-4 sm:p-4.5 rounded-2xl border border-stone-200 shadow-xs hover:border-blue-300 transition-all h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {isBn ? 'সক্রিয় নিউজরুম কর্মী' : 'Active Reporters'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn tracking-tight">
                {isBn ? toBengaliNumber(activeReportersCount) : activeReportersCount}{' '}
                <span className="text-sm font-normal text-stone-500">{isBn ? 'জন' : 'active'}</span>
              </h3>
              <p className="text-[11px] text-stone-400 mt-1">
                {isBn ? 'মাঠপর্যায়ে নিয়োজিত' : 'On Newsroom Roster'}
              </p>
            </div>
          </Link>
        </MotionStaggerItem>

        {/* KPI 5: Audience Engagement & Shares */}
        <MotionStaggerItem className="col-span-2 sm:col-span-1">
          <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-stone-200 shadow-xs hover:border-purple-300 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {isBn ? 'সোশ্যাল শেয়ার' : 'Social Shares'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono tracking-tight">
                {isBn ? toBengaliNumber(totalShares) : totalShares.toLocaleString()}
              </h3>
              <p className="text-[11px] text-stone-400 mt-1">
                {isBn ? 'পাঠক প্রতিক্রিয়া ও প্রচার' : 'Audience Reach'}
              </p>
            </div>
          </div>
        </MotionStaggerItem>

      </MotionStaggerGrid>

      {/* 3. Newsroom Editorial Pipeline Health Flow */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-700" />
            <h3 className="text-sm font-bold font-serif-bn text-stone-900">
              {isBn
                ? 'সম্পাদকীয় কাজের ধারা ও প্রকাশনা পাইপলাইন (Editorial Pipeline Health)'
                : 'Editorial Workflow & Publishing Pipeline Health'}
            </h3>
          </div>
          <Link
            to="/admin/workflow"
            className="text-xs font-bold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1 group"
          >
            <span>{isBn ? 'অনুমোদন ডেস্কে যান' : 'Go to Workflow Desk'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Step Flow Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-left">
            <span className="text-[10px] font-semibold text-stone-500">{isBn ? '১. খসড়া' : '1. Draft'}</span>
            <p className="text-base font-extrabold font-mono text-stone-800 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.draft) : pipelineStats.draft}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-left">
            <span className="text-[10px] font-semibold text-blue-700">{isBn ? '২. জমা পড়া' : '2. Submitted'}</span>
            <p className="text-base font-extrabold font-mono text-blue-900 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.submitted) : pipelineStats.submitted}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-left">
            <span className="text-[10px] font-semibold text-amber-700">{isBn ? '৩. পর্যালোচনায়' : '3. In Review'}</span>
            <p className="text-base font-extrabold font-mono text-amber-900 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.under_review) : pipelineStats.under_review}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200 text-left">
            <span className="text-[10px] font-semibold text-orange-700">{isBn ? '৪. সংশোধনে' : '4. Returned'}</span>
            <p className="text-base font-extrabold font-mono text-orange-900 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.returned) : pipelineStats.returned}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-left">
            <span className="text-[10px] font-semibold text-emerald-700">{isBn ? '৫. অনুমোদিত' : '5. Approved'}</span>
            <p className="text-base font-extrabold font-mono text-emerald-900 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.approved) : pipelineStats.approved}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-left">
            <span className="text-[10px] font-semibold text-indigo-700">{isBn ? '৬. শিডিউল্ড' : '6. Scheduled'}</span>
            <p className="text-base font-extrabold font-mono text-indigo-900 mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.scheduled) : pipelineStats.scheduled}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-700 text-white text-left">
            <span className="text-[10px] font-medium text-emerald-100">{isBn ? '৭. লাইভ প্রকাশিত' : '7. Live Published'}</span>
            <p className="text-base font-extrabold font-mono mt-0.5">
              {isBn ? toBengaliNumber(pipelineStats.published) : pipelineStats.published}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Interactive Weekly Readership & Category Breakdown (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Weekly Readership Bar Analytics (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-700" />
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  {isBn ? 'সাপ্তাহিক পাঠক এনগেজমেন্ট ও ভিউজ ধারা' : 'Weekly Reader Engagement & Views Trend'}
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {isBn
                  ? 'প্রতিদিনের মোট পাঠক সংখ্যা ও সর্বোচ্চ সক্রিয়তা পর্যবেক্ষণ'
                  : 'Daily readership count and peak activity monitoring'}
              </p>
            </div>

            {peakDay && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {isBn
                    ? `পিক ডে: ${peakDay.day}বার (${toBengaliNumber(peakDay.views)} ভিউ)`
                    : `Peak Day: ${peakDay.day} (${peakDay.views.toLocaleString()} views)`}
                </span>
              </span>
            )}
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className="pt-2">
            <div className="h-44 flex items-end gap-2 sm:gap-4 px-2 pb-2 border-b border-stone-200">
              {weeklyChartData.map((d, idx) => {
                const heightPct = Math.max(12, Math.round((d.views / maxDayViews) * 100));
                const isSelected = idx === selectedDayIndex;
                const isPeak = d.dayIndex === peakDay?.dayIndex;

                return (
                  <div
                    key={d.day}
                    onClick={() => setSelectedDayIndex(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                  >
                    <div className="w-full flex justify-center mb-1">
                      <span className={`text-[10px] font-mono font-bold transition-opacity ${
                        isSelected ? 'text-rose-700 opacity-100' : 'text-stone-400 opacity-0 group-hover:opacity-100'
                      }`}>
                        {isBn ? toBengaliNumber(d.views) : d.views.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 rounded-t-xl overflow-hidden h-full flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isSelected
                            ? 'bg-rose-700'
                            : isPeak
                              ? 'bg-rose-500/80 group-hover:bg-rose-600'
                              : 'bg-stone-300 group-hover:bg-stone-400'
                        }`}
                      />
                    </div>

                    <span className={`mt-2 text-xs font-bold transition-colors ${
                      isSelected ? 'text-rose-700' : 'text-stone-500 group-hover:text-stone-900'
                    }`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Performance Banner */}
            <div className="mt-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                <span className="font-bold text-stone-800">
                  {isBn ? `${selectedDay.day}বারের পাঠক সারসংক্ষেপ:` : `${selectedDay.day} Reader Summary:`}
                </span>
              </div>
              <div className="flex items-center gap-4 text-stone-600 font-mono">
                <span>
                  {isBn ? 'মোট ভিউ:' : 'Total Views:'}{' '}
                  <strong className="text-stone-900">{isBn ? toBengaliNumber(selectedDay.views) : selectedDay.views.toLocaleString()}</strong>
                </span>
                <span>
                  {isBn ? 'প্রকাশিত সংবাদ:' : 'Published:'}{' '}
                  <strong className="text-stone-900">{isBn ? `${toBengaliNumber(selectedDay.count)} টি` : `${selectedDay.count} articles`}</strong>
                </span>
                <span>
                  {isBn ? 'শেয়ার:' : 'Shares:'}{' '}
                  <strong className="text-stone-900">{isBn ? toBengaliNumber(selectedDay.shares) : selectedDay.shares.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Readership Breakdown (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {isBn ? 'পাঠকপ্রিয় বিভাগসমূহ' : 'Popular Categories'}
              </h3>
              <span className="text-[11px] font-mono font-bold text-stone-500">
                {isBn ? 'শীর্ষ ক্যাটাগরি' : 'Top Categories'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {isBn ? 'মোট সংবাদের শতকরা হার ও পাঠক সম্পৃক্ততা' : 'Share of published articles & audience readership'}
            </p>

            <div className="space-y-3.5 mt-5">
              {categoryDistribution.map((cat) => (
                <div key={cat.slug} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif-bn font-bold text-stone-800">{cat.name}</span>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {isBn
                        ? `${toBengaliNumber(cat.count)} টি (${toBengaliNumber(cat.percentage)}%)`
                        : `${cat.count} articles (${cat.percentage}%)`}
                    </span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 text-right">
            <Link
              to="/admin/categories"
              className="text-xs font-bold text-rose-700 hover:underline inline-flex items-center gap-1"
            >
              <span>{isBn ? 'সকল বিভাগ ব্যবস্থাপনা' : 'Manage All Categories'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 5. Live Newsroom Grid: Trending Top Stories & Fast Actions (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Top Performing Live Stories Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {isBn ? 'শীর্ষ পাঠকপ্রিয় সংবাদ (Top Read Stories)' : 'Top Read Stories'}
              </h3>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
            >
              <span>{isBn ? 'বিস্তারিত অ্যানালিটিক্স' : 'Full Analytics'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {topStoriesList.map((story, idx) => (
              <div key={story.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : idx === 1
                        ? 'bg-stone-200 text-stone-800'
                        : 'bg-stone-100 text-stone-600'
                  }`}>
                    {isBn ? toBengaliNumber(idx + 1) : idx + 1}
                  </span>

                  <div className="min-w-0">
                    <Link
                      to={`/news/${story.slug}`}
                      target="_blank"
                      className="font-bold font-serif-bn text-stone-900 text-xs hover:text-rose-700 line-clamp-1 transition-colors"
                      title={story.title}
                    >
                      {isBn ? story.title : (story.titleEn || story.title)}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                      <span className="font-serif-bn text-stone-600 font-medium">
                        {isBn ? (story.categoryName || 'জাতীয়') : (story.categoryNameEn || story.categoryName || 'National')}
                      </span>
                      <span>•</span>
                      <span>{story.author || (isBn ? 'স্টাফ রিপোর্টার' : 'Staff Reporter')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-mono font-bold">
                    <Eye className="w-3 h-3 text-stone-500" />
                    <span>{isBn ? toBengaliNumber(story.views || 0) : (story.views || 0).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center & Editorial Operations (Right Col) */}
        <div className="space-y-5">
          
          {/* Pending Approval Fast-Track */}
          {pendingApprovalList.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{isBn ? 'দ্রুত অনুমোদনের অপেক্ষমাণ' : 'Pending Fast-Track Approvals'}</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {isBn ? `${toBengaliNumber(pendingApprovalList.length)} টি জরুরি` : `${pendingApprovalList.length} Urgent`}
                </span>
              </div>

              <div className="space-y-2.5">
                {pendingApprovalList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold font-serif-bn text-stone-900 line-clamp-1">
                        {isBn ? item.title : (item.titleEn || item.title)}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {isBn ? 'প্রতিবেদক:' : 'Reporter:'} <strong className="text-stone-700">{item.author || (isBn ? 'নিজস্ব প্রতিবেদক' : 'Staff Reporter')}</strong> ({isBn ? formatBengaliRelativeTime(item.publishedAt) : 'Recently'})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickApprove(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Operations Hub */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'সম্পাদকীয় অপারেশন হাব (Editorial Hub)' : 'Editorial Operations Hub'}</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">{isBn ? 'কুইক অ্যাক্সেস' : 'Quick Access'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/admin/workflow"
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 font-serif-bn group-hover:text-rose-700 transition-colors">
                    {isBn ? 'সম্পাদকীয় ধারা' : 'Editorial Workflow'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-700 transition-colors" />
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  {isBn ? 'পদবি ও কর্মী অনুযায়ী পাইপলাইন' : 'Pipeline by designation & staff'}
                </p>
              </Link>

              <Link
                to="/admin/news"
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 font-serif-bn group-hover:text-rose-700 transition-colors">
                    {isBn ? 'কনটেন্ট সিএমএস' : 'Content CMS'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-700 transition-colors" />
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  {isBn ? 'সংবাদ সম্পাদনা ও পূর্ণ আর্কাইভ' : 'Article editing & full archive'}
                </p>
              </Link>

              <Link
                to="/admin/analytics"
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 font-serif-bn group-hover:text-rose-700 transition-colors">
                    {isBn ? 'পাঠক অ্যানালিটিক্স' : 'Reader Analytics'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-700 transition-colors" />
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  {isBn ? 'রিয়েলটাইম ট্রাফিক ও পাঠক ডেটা' : 'Real-time traffic & metrics'}
                </p>
              </Link>

              <Link
                to="/admin/epaper"
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 font-serif-bn group-hover:text-rose-700 transition-colors">
                    {isBn ? 'ই-পেপার সংস্করণ' : 'E-Paper Studio'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-700 transition-colors" />
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  {isBn ? 'ডিজিটাল সংস্করণ ও আর্কাইভ' : 'Digital editions & broadsheet'}
                </p>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboardOverview;

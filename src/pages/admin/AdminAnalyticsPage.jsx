import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import {
  ANALYTICS_DATE_PRESETS,
  TRAFFIC_SOURCE_LABELS,
  DEVICE_TYPE_LABELS,
  FORMAT_DURATION_BN,
  downloadAnalyticsExport
} from '../../utils/analyticsHelpers.js';
import {
  useGetOverviewAnalyticsQuery,
  useGetRealtimeAnalyticsQuery,
  useGetTopStoriesQuery,
  useGetAdvancedDashboardQuery,
  useGetAudienceAnalyticsQuery,
  useGetEditorialAnalyticsQuery,
  useGetRevenueAnalyticsQuery
} from '../../store/api/analyticsApi.js';
import { useGetAdminNewsListQuery } from '../../store/api/newsApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import {
  DailyTrendChart,
  HorizontalShareBars,
  PublishingTimeHeatmap,
  RetentionFunnelChart
} from '../../components/admin/AnalyticsCharts.jsx';
import { AnalyticsExperimentsPanel } from '../../components/admin/AnalyticsExperimentsPanel.jsx';
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Globe,
  Share2,
  ArrowUpRight,
  Sparkles,
  FileText,
  MousePointerClick,
  Loader2,
  ShieldCheck,
  Download,
  Clock,
  Video,
  Mail,
  CreditCard,
  FlaskConical,
  Megaphone
} from 'lucide-react';

const BAR_COLORS = ['#be123c', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

export function AdminAnalyticsPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const canViewEditorial = hasEffectivePermission(authState, adminState, 'analytics.editorial.view');
  const canViewRevenue = hasEffectivePermission(authState, adminState, 'analytics.revenue.view');
  const canManageExperiments = hasEffectivePermission(authState, adminState, 'analytics.experiments.manage');
  const canExport = hasEffectivePermission(authState, adminState, 'analytics.export');

  const [activeTab, setActiveTab] = useState('overview');
  const [preset, setPreset] = useState('14d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [exporting, setExporting] = useState(false);

  const filterParams = useMemo(() => {
    const params = { preset };
    if (preset === 'custom' && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    if (categoryId) {
      params.category_id = categoryId;
    }
    return params;
  }, [preset, startDate, endDate, categoryId]);

  // Existing Phase overview + Phase 24 analytics queries
  const { data: overview, isLoading: isOverviewLoading } = useGetOverviewAnalyticsQuery();
  const { data: realtime } = useGetRealtimeAnalyticsQuery(undefined, { pollingInterval: 30000 });
  const { data: topStories = [], isLoading: isTopLoading } = useGetTopStoriesQuery();
  const { data: adminNewsData } = useGetAdminNewsListQuery({ per_page: 100 });
  const { data: categoriesList = [] } = useGetCategoriesQuery();

  const { data: advDashboard, isLoading: isAdvDashLoading } = useGetAdvancedDashboardQuery(filterParams);
  const { data: audienceData } = useGetAudienceAnalyticsQuery(filterParams);
  const { data: editorialData, isLoading: isEditorialLoading } = useGetEditorialAnalyticsQuery(filterParams, {
    skip: !canViewEditorial
  });
  const { data: revenueData, isLoading: isRevenueLoading } = useGetRevenueAnalyticsQuery(filterParams, {
    skip: !canViewRevenue
  });

  const articles = useMemo(() => adminNewsData?.items || [], [adminNewsData]);

  const categoryStats = useMemo(() => {
    const map = {};
    articles.forEach((art) => {
      const slug = art.category || 'general';
      const label = art.categoryName || slug;
      if (!map[slug]) {
        map[slug] = { slug, label, count: 0, views: 0 };
      }
      map[slug].count += 1;
      map[slug].views += Number(art.views || 0);
    });
    const list = Object.values(map).sort((a, b) => b.views - a.views);
    const total = list.reduce((sum, item) => sum + item.views, 0) || 1;
    return list.slice(0, 6).map((item, idx) => ({
      ...item,
      percentage: Math.round((item.views / total) * 100),
      color: BAR_COLORS[idx % BAR_COLORS.length]
    }));
  }, [articles]);

  const activeReadersNow = realtime?.active_readers_online ?? 0;
  const viewsToday = realtime?.views_today ?? 0;
  const publishedToday = realtime?.published_today ?? 0;
  const totalViews = advDashboard?.kpis?.total_page_views ?? overview?.total_views ?? 0;
  const uniqueVisitors = advDashboard?.kpis?.unique_visitors ?? 0;
  const avgEngagementSeconds = advDashboard?.kpis?.avg_engagement_seconds ?? 0;
  const completionRate = advDashboard?.kpis?.completion_rate_percent ?? 0;
  const totalShares = overview?.total_shares ?? 0;
  const adImpressions = overview?.ad_impressions ?? 0;
  const adClicks = overview?.ad_clicks ?? 0;
  const adCtr = overview?.ad_ctr ?? 0;

  const tabs = [
    { id: 'overview', label: 'ওভারভিউ ও ট্রাফিক', icon: BarChart3, visible: true },
    { id: 'editorial', label: 'সম্পাদকীয় ও রিটেনশন', icon: FileText, visible: canViewEditorial },
    { id: 'channels', label: 'ভিডিও ও নিউজলেটার', icon: Video, visible: canViewRevenue },
    { id: 'revenue', label: 'বিজ্ঞাপন ও সাবস্ক্রিপশন', icon: CreditCard, visible: canViewRevenue },
    { id: 'experiments', label: 'A/B এক্সপেরিমেন্টস', icon: FlaskConical, visible: true }
  ].filter((t) => t.visible);

  const exportSectionForTab = useMemo(() => {
    if (activeTab === 'editorial') return 'articles';
    if (activeTab === 'channels') return 'videos';
    if (activeTab === 'revenue') return 'subscriptions';
    if (activeTab === 'experiments') return 'experiments';
    return 'overview';
  }, [activeTab]);

  const handleExport = async (format, sectionOverride = null) => {
    setExporting(true);
    try {
      const apiBase = import.meta.env?.VITE_API_URL || '/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      await downloadAnalyticsExport({
        baseUrl: apiBase,
        token,
        section: sectionOverride || exportSectionForTab,
        format,
        filters: filterParams
      });
    } catch {
      // Errors handled silently or shown cleanly
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Privacy Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black font-serif-bn text-stone-900">
              পাঠক ও সম্পাদকীয় অ্যানালিটিক্স সিস্টেম
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              লাইভ ট্র্যাকিং
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              শূন্য PII · কনসেন্ট ও DNT সুরক্ষিত
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            ১৩টি মূল পাবলিশার মেট্রিক, সম্পাদকীয় রিটেনশন বিশ্লেষণ, রোল-ভিত্তিক রিপোর্ট ও A/B এক্সপেরিমেন্টেশন
          </p>
        </div>

        {/* Export Controls (gated by analytics.export) */}
        {canExport && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-700" />
              <span>CSV এক্সপোর্ট</span>
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>JSON এক্সপোর্ট</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar + Navigation Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {ANALYTICS_DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  preset === p.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {preset === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
                <span className="text-xs text-stone-400">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </>
            )}

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-semibold text-stone-700"
            >
              <option value="">সকল ক্যাটাগরি</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name || cat.nameBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Overview, Traffic Sources & Devices */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>মোট পেজ ভিউ</span>
                <Eye className="w-4 h-4 text-rose-700" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {(isOverviewLoading && isAdvDashLoading) ? '...' : toBengaliNumber(totalViews)}
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  আজ: {toBengaliNumber(viewsToday)} · প্রকাশ: {toBengaliNumber(publishedToday)}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>স্বতন্ত্র ভিজিটর</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {toBengaliNumber(uniqueVisitors)}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  সক্রিয় এখন: {toBengaliNumber(activeReadersNow)} জন
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>গড় এনগেজমেন্ট</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {FORMAT_DURATION_BN(avgEngagementSeconds)}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  ৭৫%+ পাঠ: {toBengaliNumber(completionRate)}%
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>মোট শেয়ার</span>
                <Share2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {toBengaliNumber(totalShares)}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  মোট প্রতিবেদন: {toBengaliNumber(overview?.published_news ?? 0)}টি
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>ভিডিও ভিউ</span>
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {toBengaliNumber(advDashboard?.kpis?.video_views ?? 0)}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">নির্বাচিত সময়কাল</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                <span>বিজ্ঞাপন CTR</span>
                <MousePointerClick className="w-4 h-4 text-rose-700" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-stone-900 font-serif-bn">
                  {toBengaliNumber(adCtr)}%
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  ক্লিক: {toBengaliNumber(adClicks)} / {toBengaliNumber(adImpressions)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Trend Chart */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 font-serif-bn mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-700" />
              <span>কনটেন্ট পারফরম্যান্স ট্রেন্ড (দৈনিক পেজ ভিউ, ভিজিটর ও ভিডিও)</span>
            </h2>
            <DailyTrendChart series={advDashboard?.daily_trends || []} />
          </div>

          {/* Traffic Sources & Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif-bn">
                  <Globe className="w-4 h-4 text-rose-700" />
                  <span>ট্রাফিক উৎস (Traffic Sources)</span>
                </h3>
                {canExport && (
                  <button
                    type="button"
                    onClick={() => handleExport('csv', 'sources')}
                    className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    উৎস CSV
                  </button>
                )}
              </div>

              <HorizontalShareBars
                items={audienceData?.traffic_sources || []}
                labelResolver={(item) => TRAFFIC_SOURCE_LABELS[item.source] || item.source}
                emptyText="ট্রাফিক উৎসের তথ্য সংগৃহীত হচ্ছে।"
              />

              {(audienceData?.top_referrers || []).length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-bold text-stone-700 mb-2">শীর্ষ রেফারেল ডোমেইন (নিরাপদ হোস্ট-অনলি)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {audienceData.top_referrers.slice(0, 6).map((ref) => (
                      <div key={ref.domain} className="flex items-center justify-between text-xs bg-stone-50 px-2.5 py-1.5 rounded-lg">
                        <span className="truncate font-medium text-stone-700">{ref.domain}</span>
                        <span className="font-mono font-bold text-stone-900">{toBengaliNumber(ref.views)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif-bn">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>ডিভাইস, ওএস ও ব্রাউজার পরিসংখ্যান</span>
                </h3>
                {canExport && (
                  <button
                    type="button"
                    onClick={() => handleExport('csv', 'devices')}
                    className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    ডিভাইস CSV
                  </button>
                )}
              </div>

              <HorizontalShareBars
                items={audienceData?.devices || []}
                labelResolver={(item) => DEVICE_TYPE_LABELS[item.device_type] || item.device_type}
                emptyText="ডিভাইস পরিসংখ্যান এখনো নেই।"
              />

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                <div>
                  <h4 className="text-xs font-bold text-stone-700 mb-2">অপারেটিং সিস্টেম</h4>
                  <div className="space-y-1">
                    {(audienceData?.operating_systems || []).slice(0, 4).map((os) => (
                      <div key={os.os_family} className="flex justify-between text-xs text-stone-600">
                        <span>{os.os_family}</span>
                        <span className="font-mono font-semibold">{toBengaliNumber(os.share_percent)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-700 mb-2">ব্রাউজার</h4>
                  <div className="space-y-1">
                    {(audienceData?.browsers || []).slice(0, 4).map((br) => (
                      <div key={br.browser_family} className="flex justify-between text-xs text-stone-600">
                        <span>{br.browser_family}</span>
                        <span className="font-mono font-semibold">{toBengaliNumber(br.share_percent)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Category Share & Top Stories preserved cleanly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif-bn">
                  <Sparkles className="w-4 h-4 text-rose-700" />
                  <span>ক্যাটাগরিভিত্তিক পাঠক শেয়ার</span>
                </h3>
                <span className="text-xs text-stone-400">শীর্ষ ৬ বিভাগ</span>
              </div>
              <div className="space-y-3">
                {categoryStats.map((cat) => (
                  <div key={cat.slug} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">{cat.label}</span>
                      <span className="text-stone-600 font-mono">
                        {toBengaliNumber(cat.views)} ({toBengaliNumber(cat.percentage)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif-bn">
                  <FileText className="w-4 h-4 text-rose-700" />
                  <span>সর্বাধিক পঠিত সংবাদসমূহ</span>
                </h3>
              </div>

              {isTopLoading ? (
                <div className="p-8 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> লোড হচ্ছে...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topStories.slice(0, 6).map((story, idx) => (
                    <div key={story.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {toBengaliNumber(idx + 1)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/news/${story.slug || story.id}`}
                            target="_blank"
                            className="text-xs font-bold text-stone-900 hover:text-rose-700 line-clamp-1 font-serif-bn flex items-center gap-1"
                          >
                            <span className="truncate">{story.title}</span>
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          </Link>
                          <span className="text-[11px] text-stone-500">{story.categoryName}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-800 shrink-0">
                        {toBengaliNumber(story.views ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Editorial, Categories, Reporters, Topics, Publishing Time & Retention */}
      {activeTab === 'editorial' && canViewEditorial && (
        <div className="space-y-6">
          {isEditorialLoading ? (
            <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
              সম্পাদকীয় বিশ্লেষণ লোড হচ্ছে...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
                    আর্টিকেল রিটেনশন ফানেল (Scroll Depth)
                  </h3>
                  <RetentionFunnelChart stages={editorialData?.retention_funnel || []} />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
                    প্রকাশনার সময় বিশ্লেষণ (ঢাকা সময় ০–২৩ ঘণ্টা)
                  </h3>
                  <PublishingTimeHeatmap hours={editorialData?.publishing_time_analysis || []} />
                </div>
              </div>

              {/* Best Headlines & Article Performance */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
                    সেরা শিরোনাম ও সংবাদের পারফরম্যান্স
                  </h3>
                  {canExport && (
                    <button
                      type="button"
                      onClick={() => handleExport('csv', 'articles')}
                      className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      আর্টিকেল CSV
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2 pr-3 font-semibold">শিরোনাম ও বিভাগ</th>
                        <th className="py-2 px-3 font-semibold text-right">সময়কাল ভিউ</th>
                        <th className="py-2 px-3 font-semibold text-right">মোট ভিউ</th>
                        <th className="py-2 px-3 font-semibold text-right">গড় পাঠ সময়</th>
                        <th className="py-2 px-3 font-semibold text-right">রিটেনশন</th>
                        <th className="py-2 pl-3 font-semibold text-right">শেয়ার / মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(editorialData?.best_headlines || []).map((art) => (
                        <tr key={art.id}>
                          <td className="py-2.5 pr-3">
                            <div className="font-bold text-stone-900 font-serif-bn line-clamp-1">{art.title}</div>
                            <div className="text-[11px] text-stone-500">
                              {art.category_name} · {art.reporter_name}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                            {toBengaliNumber(art.period_views)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{toBengaliNumber(art.cumulative_views)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {FORMAT_DURATION_BN(art.avg_engagement_seconds)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                            {toBengaliNumber(art.retention_rate_percent)}%
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono">
                            {toBengaliNumber(art.shares_count)} / {toBengaliNumber(art.comments_count)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Categories, Reporters & Topics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn">সবচেয়ে আকর্ষক ক্যাটাগরি</h3>
                    {canExport && (
                      <button type="button" onClick={() => handleExport('csv', 'categories')} className="text-xs text-rose-700 font-bold cursor-pointer">
                        CSV
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {(editorialData?.category_performance || []).slice(0, 8).map((cat) => (
                      <div key={cat.category_id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50">
                        <div>
                          <div className="font-bold text-stone-900">{cat.name}</div>
                          <div className="text-[11px] text-stone-500">
                            গড় সময়: {FORMAT_DURATION_BN(cat.avg_engagement_seconds)} · রিটেনশন: {toBengaliNumber(cat.retention_rate_percent)}%
                          </div>
                        </div>
                        <span className="font-mono font-bold text-rose-700">{toBengaliNumber(cat.period_views || cat.cumulative_views)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn">রিপোর্টার পারফরম্যান্স</h3>
                    {canExport && (
                      <button type="button" onClick={() => handleExport('csv', 'reporters')} className="text-xs text-rose-700 font-bold cursor-pointer">
                        CSV
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {(editorialData?.reporter_performance || []).slice(0, 8).map((rep) => (
                      <div key={rep.reporter_id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50">
                        <div>
                          <div className="font-bold text-stone-900">{rep.name}</div>
                          <div className="text-[11px] text-stone-500">
                            {toBengaliNumber(rep.published_articles)} প্রতিবেদন · {FORMAT_DURATION_BN(rep.avg_engagement_seconds)}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-900">{toBengaliNumber(rep.cumulative_views)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn">জনপ্রিয় টপিকসমূহ (Tags)</h3>
                    {canExport && (
                      <button type="button" onClick={() => handleExport('csv', 'topics')} className="text-xs text-rose-700 font-bold cursor-pointer">
                        CSV
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(editorialData?.popular_topics || []).slice(0, 8).map((topic) => (
                      <div key={topic.tag_id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50">
                        <div>
                          <span className="font-bold text-rose-800">#{topic.name}</span>
                          <span className="text-[11px] text-stone-500 ml-2">
                            ({toBengaliNumber(topic.articles_count)} সংবাদ)
                          </span>
                        </div>
                        <span className="font-mono font-bold text-stone-900">{toBengaliNumber(topic.total_views)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: Video & Newsletter Performance */}
      {activeTab === 'channels' && canViewRevenue && (
        <div className="space-y-6">
          {isRevenueLoading ? (
            <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
              ভিডিও ও নিউজলেটার অ্যানালিটিক্স লোড হচ্ছে...
            </div>
          ) : (
            <>
              {/* Video Performance */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-700" />
                    <span>ভিডিও পারফরম্যান্স ({toBengaliNumber(revenueData?.video_performance?.videos_count ?? 0)}টি ভিডিও)</span>
                  </h3>
                  {canExport && (
                    <button type="button" onClick={() => handleExport('csv', 'videos')} className="text-xs text-rose-700 font-bold cursor-pointer">
                      ভিডিও CSV
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2 pr-3 font-semibold">ভিডিও শিরোনাম</th>
                        <th className="py-2 px-3 font-semibold text-right">সময়কাল ভিউ</th>
                        <th className="py-2 px-3 font-semibold text-right">মোট ভিউ</th>
                        <th className="py-2 px-3 font-semibold text-right">গড় দেখার সময়</th>
                        <th className="py-2 pl-3 font-semibold text-right">সম্পূর্ণ দেখার হার</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(revenueData?.video_performance?.items || []).map((v) => (
                        <tr key={v.id}>
                          <td className="py-2.5 pr-3 font-bold text-stone-900 font-serif-bn">{v.title}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{toBengaliNumber(v.period_views)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{toBengaliNumber(v.cumulative_views)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{FORMAT_DURATION_BN(v.avg_watch_seconds)}</td>
                          <td className="py-2.5 pl-3 text-right font-mono text-emerald-700 font-bold">
                            {toBengaliNumber(v.completion_rate_percent)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Newsletter Performance */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-700" />
                    <span>নিউজলেটার পারফরম্যান্স (সমষ্টিগত, ব্যক্তিগত ইমেইল প্রদর্শিত হয় না)</span>
                  </h3>
                  {canExport && (
                    <button type="button" onClick={() => handleExport('csv', 'newsletters')} className="text-xs text-rose-700 font-bold cursor-pointer">
                      নিউজলেটার CSV
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="text-[11px] text-stone-500">সক্রিয় গ্রাহক</div>
                    <div className="text-lg font-extrabold text-stone-900 font-mono">
                      {toBengaliNumber(revenueData?.newsletter_performance?.active_subscribers_count ?? 0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="text-[11px] text-stone-500">গড় ওপেন রেট</div>
                    <div className="text-lg font-extrabold text-emerald-700 font-mono">
                      {toBengaliNumber(revenueData?.newsletter_performance?.avg_open_rate_percent ?? 0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="text-[11px] text-stone-500">গড় ক্লিক রেট (CTR)</div>
                    <div className="text-lg font-extrabold text-blue-700 font-mono">
                      {toBengaliNumber(revenueData?.newsletter_performance?.avg_click_rate_percent ?? 0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="text-[11px] text-stone-500">আনসাবস্ক্রাইব রেট</div>
                    <div className="text-lg font-extrabold text-rose-700 font-mono">
                      {toBengaliNumber(revenueData?.newsletter_performance?.unsubscribe_rate_percent ?? 0)}%
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2 pr-3 font-semibold">ক্যাম্পেইন</th>
                        <th className="py-2 px-3 font-semibold text-right">ডেলিভার্ড</th>
                        <th className="py-2 px-3 font-semibold text-right">ওপেন রেট</th>
                        <th className="py-2 pl-3 font-semibold text-right">ক্লিক রেট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(revenueData?.newsletter_performance?.campaigns || []).map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 pr-3 font-bold text-stone-900 font-serif-bn">{c.title}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{toBengaliNumber(c.delivered_count)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">{toBengaliNumber(c.open_rate_percent)}%</td>
                          <td className="py-2.5 pl-3 text-right font-mono text-blue-700 font-bold">{toBengaliNumber(c.click_rate_percent)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: Advertisement & Subscription Revenue Analytics */}
      {activeTab === 'revenue' && canViewRevenue && (
        <div className="space-y-6">
          {isRevenueLoading ? (
            <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
              বাণিজ্যিক ও সাবস্ক্রিপশন তথ্য লোড হচ্ছে...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Advertisement Performance */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-rose-700" />
                      <span>বিজ্ঞাপন ও স্পন্সরড কনটেন্ট পারফরম্যান্স</span>
                    </h3>
                    {canExport && (
                      <button type="button" onClick={() => handleExport('csv', 'ads')} className="text-xs text-rose-700 font-bold cursor-pointer">
                        বিজ্ঞাপন CSV
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">মোট ইম্প্রেশন / ক্লিক</div>
                      <div className="font-mono font-extrabold text-stone-900 mt-1">
                        {toBengaliNumber(revenueData?.advertisement_performance?.impressions ?? 0)} / {toBengaliNumber(revenueData?.advertisement_performance?.clicks ?? 0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">গড় CTR ও খরচ (BDT)</div>
                      <div className="font-mono font-extrabold text-rose-700 mt-1">
                        {toBengaliNumber(revenueData?.advertisement_performance?.ctr_percent ?? 0)}% · ৳{toBengaliNumber(revenueData?.advertisement_performance?.total_spend_bdt ?? 0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(revenueData?.advertisement_performance?.campaigns || []).slice(0, 6).map((camp) => (
                      <div key={camp.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-stone-50">
                        <div>
                          <div className="font-bold text-stone-900">{camp.name}</div>
                          <div className="text-[11px] text-stone-500">
                            {camp.advertiser_name} · CTR: {toBengaliNumber(camp.ctr_percent)}%
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-900">
                          ৳{toBengaliNumber(camp.spent_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription & Payment Gateway Performance */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 font-serif-bn flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>সাবস্ক্রিপশন ও পেমেন্ট গেটওয়ে আয়</span>
                    </h3>
                    {canExport && (
                      <button type="button" onClick={() => handleExport('csv', 'subscriptions')} className="text-xs text-rose-700 font-bold cursor-pointer">
                        সাবস্ক্রিপশন CSV
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">সক্রিয় প্রিমিয়াম</div>
                      <div className="text-base font-extrabold text-emerald-700 font-mono">
                        {toBengaliNumber(revenueData?.subscription_performance?.active_premium_count ?? 0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">সক্রিয় ফ্রি</div>
                      <div className="text-base font-extrabold text-stone-900 font-mono">
                        {toBengaliNumber(revenueData?.subscription_performance?.active_free_count ?? 0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">চার্ন রেট</div>
                      <div className="text-base font-extrabold text-rose-700 font-mono">
                        {toBengaliNumber(revenueData?.subscription_performance?.churn_rate_percent ?? 0)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="text-stone-500">মোট আয় (BDT)</div>
                      <div className="text-base font-extrabold text-stone-900 font-mono">
                        ৳{toBengaliNumber(revenueData?.subscription_performance?.total_revenue_bdt ?? 0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-stone-700">পেমেন্ট গেটওয়ে বিভাজন (bKash · Nagad · Card)</h4>
                    {(revenueData?.subscription_performance?.gateway_breakdown || []).map((gw) => (
                      <div key={gw.gateway} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-stone-50">
                        <span className="font-bold uppercase text-stone-800">{gw.gateway}</span>
                        <span className="font-mono text-stone-700">
                          {toBengaliNumber(gw.transactions)} লেনদেন · <strong className="text-emerald-700">৳{toBengaliNumber(gw.revenue_bdt)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 5: A/B Experimentation Studio */}
      {activeTab === 'experiments' && (
        <AnalyticsExperimentsPanel articles={articles} canManageExperiments={canManageExperiments} />
      )}
    </div>
  );
}

export default AdminAnalyticsPage;

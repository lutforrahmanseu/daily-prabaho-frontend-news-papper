import React, { useState } from 'react';
import { BarChart3, Download, Eye, Share2, PlayCircle, Users, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetCreatorStudioAnalyticsQuery } from '../../../store/api/creatorStudioApi.js';
import { downloadAuthorizedFile, STUDIO_CHANNELS, STUDIO_STATUS_META } from '../../../utils/creatorStudioHelpers.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export default function CreatorAnalyticsTab({ project }) {
  const [days, setDays] = useState(30);
  const [platform, setPlatform] = useState('all');
  const [filterProjectOnly, setFilterProjectOnly] = useState(false);

  const queryParams = {
    days,
    platform,
    ...(filterProjectOnly && project?.id ? { project_id: project.id } : {}),
  };

  const { data: analytics, isLoading, refetch } = useGetCreatorStudioAnalyticsQuery(queryParams);
  const totals = analytics?.totals || {};
  const byPlatform = analytics?.by_platform || [];
  const referralTraffic = analytics?.referral_traffic || [];
  const shareChannels = analytics?.share_channels || [];
  const topProjects = analytics?.top_projects || [];

  const handleExport = async (format) => {
    try {
      const qs = new URLSearchParams({
        format,
        days: String(days),
        platform,
        ...(filterProjectOnly && project?.id ? { project_id: String(project.id) } : {}),
      }).toString();
      await downloadAuthorizedFile(
        `/admin/creator-studio/analytics/export?${qs}`,
        `creator-studio-analytics-${days}d.${format}`
      );
      sweetAlert.toast(`অ্যানালিটিক্স রিপোর্ট (${format.toUpperCase()}) ডাউনলোড হয়েছে`, 'success');
    } catch (err) {
      sweetAlert.error('এক্সপোর্ট ব্যর্থ', err?.message || 'রিপোর্ট ডাউনলোড করা যায়নি');
    }
  };

  const kpiCards = [
    { label: 'মোট ভিউ (Views)', value: totals.views ?? 0, icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'স্বতন্ত্র দর্শক (Visitors)', value: totals.unique_visitors ?? 0, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: 'শেয়ার সংখ্যা (Shares)', value: totals.shares ?? 0, icon: Share2, color: 'text-emerald-600 bg-emerald-50' },
    {
      label: 'ভিডিও সমাপ্তি হার',
      value: `${totals.video_completion_rate ?? 0}%`,
      sub: `${totals.video_completions ?? 0} / ${totals.video_plays ?? 0} প্লে`,
      icon: PlayCircle,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'গড় এনগেজমেন্ট সময়',
      value: `${totals.avg_engagement_seconds ?? 0}s`,
      sub: `ওয়াচ: ${totals.avg_watch_seconds ?? 0}s`,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter & Export Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> ক্রিয়েটর স্টুডিও পারফরম্যান্স
          </div>

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
          >
            <option value={7}>গত ৭ দিন</option>
            <option value={30}>গত ৩০ দিন</option>
            <option value={90}>গত ৯০ দিন</option>
            <option value={365}>গত ১ বছর</option>
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
          >
            <option value="all">সকল প্ল্যাটফর্ম</option>
            {STUDIO_CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {project?.id && (
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterProjectOnly}
                onChange={(e) => setFilterProjectOnly(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              শুধু নির্বাচিত প্রজেক্ট (#{project.id})
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <span className={`p-1.5 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{isLoading ? '...' : card.value}</div>
              {card.sub && <div className="text-[11px] text-slate-500 mt-0.5">{card.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-3">প্ল্যাটফর্ম ভিত্তিক এনগেজমেন্ট</h4>
          {!byPlatform.length ? (
            <p className="text-xs text-slate-400">নির্বাচিত সময়সীমায় কোনো ইভেন্ট নেই।</p>
          ) : (
            <div className="space-y-2 text-xs">
              {byPlatform.map((row) => (
                <div key={row.platform} className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">{row.platform}</span>
                  <span className="text-slate-600">
                    {row.views} ভিউ • {row.shares} শেয়ার
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-3">রেফারেল ও ট্রাফিক উৎস</h4>
          {!referralTraffic.length ? (
            <p className="text-xs text-slate-400">কোনো রেফারেল তথ্য এখনো সংগৃহীত হয়নি।</p>
          ) : (
            <div className="space-y-2 text-xs">
              {referralTraffic.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">
                    {row.traffic_source} {row.referrer_domain ? `(${row.referrer_domain})` : ''}
                  </span>
                  <span className="font-bold text-indigo-700">{row.visits} ভিজিট</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-3">শেয়ার চ্যানেলসমূহ</h4>
          {!shareChannels.length ? (
            <p className="text-xs text-slate-400">কোনো শেয়ার ইভেন্ট এখনো নেই।</p>
          ) : (
            <div className="space-y-2 text-xs">
              {shareChannels.map((row) => (
                <div key={row.channel} className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">{row.channel}</span>
                  <span className="font-bold text-emerald-700">{row.shares} শেয়ার</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Projects */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-800 mb-3">শীর্ষ কনটেন্ট প্যাকেজ (Creator Projects)</h4>
        {!topProjects.length ? (
          <p className="text-xs text-slate-400">কোনো প্রজেক্ট পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">শিরোনাম</th>
                  <th className="py-2 px-3">বিভাগ</th>
                  <th className="py-2 px-3">অবস্থা</th>
                  <th className="py-2 px-3">ভিউ</th>
                  <th className="py-2 px-3">শেয়ার</th>
                  <th className="py-2 px-3">প্লে / সমাপ্তি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProjects.map((p) => {
                  const meta = STUDIO_STATUS_META[p.status] || STUDIO_STATUS_META.draft;
                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {p.status === 'published' ? (
                          <Link
                            to={`/creator-studio/${p.uuid}`}
                            target="_blank"
                            className="text-indigo-700 hover:underline"
                          >
                            {p.title}
                          </Link>
                        ) : (
                          p.title
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category?.name || 'সাধারণ'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}>
                          {meta.en}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">{p.views_count}</td>
                      <td className="py-2.5 px-3">{p.shares_count}</td>
                      <td className="py-2.5 px-3">
                        {p.video_starts_count} / {p.video_completions_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


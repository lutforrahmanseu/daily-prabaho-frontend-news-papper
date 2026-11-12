import React, { useState } from 'react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { FORMAT_DURATION_BN } from '../../utils/analyticsHelpers.js';

export function DailyTrendChart({ series = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(series) || series.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-stone-400">
        নির্বাচিত সময়কালে কোনো ট্রেন্ড তথ্য পাওয়া যায়নি।
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padX = 36;
  const padY = 24;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const maxViews = Math.max(10, ...series.map((d) => Number(d.page_views || 0)));
  const count = series.length;

  const pointsFor = (key) =>
    series.map((item, idx) => {
      const x = count === 1 ? padX + plotW / 2 : padX + (idx / (count - 1)) * plotW;
      const val = Number(item[key] || 0);
      const y = padY + plotH - (val / maxViews) * plotH;
      return { x, y, val, item };
    });

  const viewPts = pointsFor('page_views');
  const visitorPts = pointsFor('unique_visitors');

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const areaPath =
    viewPts.length > 0
      ? `${toPath(viewPts)} L ${viewPts[viewPts.length - 1].x.toFixed(1)} ${padY + plotH} L ${viewPts[0].x.toFixed(1)} ${padY + plotH} Z`
      : '';

  const activePoint = hoveredIdx !== null ? viewPts[hoveredIdx] : viewPts[viewPts.length - 1];
  const activeVisitor = hoveredIdx !== null ? visitorPts[hoveredIdx] : visitorPts[visitorPts.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-stone-700">
            <span className="w-3 h-3 rounded-full bg-rose-700 inline-block" />
            পেজ ভিউ
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-stone-700">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            স্বতন্ত্র ভিজিটর
          </span>
        </div>

        {activePoint && (
          <div className="px-3 py-1 rounded-lg bg-stone-100 text-stone-700 font-mono flex items-center gap-3">
            <span>{activePoint.item.date}</span>
            <span className="text-rose-700 font-bold">
              ভিউ: {toBengaliNumber(activePoint.item.page_views)}
            </span>
            <span className="text-blue-700 font-bold">
              ভিজিটর: {toBengaliNumber(activeVisitor?.item?.unique_visitors ?? 0)}
            </span>
            <span className="text-emerald-700 font-bold">
              ভিডিও: {toBengaliNumber(activePoint.item.video_views ?? 0)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px] h-56 select-none">
          <defs>
            <linearGradient id="newsflowViewsGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#be123c" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padY + plotH * (1 - ratio);
            const val = Math.round(maxViews * ratio);
            return (
              <g key={idx}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e7e5e4" strokeDasharray="3 3" />
                <text x={padX - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#78716c">
                  {toBengaliNumber(val)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#newsflowViewsGrad)" />}
          <path d={toPath(viewPts)} fill="none" stroke="#be123c" strokeWidth="2.5" strokeLinejoin="round" />
          <path d={toPath(visitorPts)} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />

          {viewPts.map((pt, idx) => {
            const showLabel = count <= 10 || idx % Math.ceil(count / 8) === 0 || idx === count - 1;
            return (
              <g key={pt.item.date} onMouseEnter={() => setHoveredIdx(idx)} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === idx ? 5 : 3.2}
                  fill="#be123c"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {visitorPts[idx] && (
                  <circle
                    cx={visitorPts[idx].x}
                    cy={visitorPts[idx].y}
                    r={hoveredIdx === idx ? 4.5 : 2.5}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                )}
                {showLabel && (
                  <text x={pt.x} y={height - 5} textAnchor="middle" fontSize="10" fill="#78716c">
                    {pt.item.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

const DEFAULT_COLORS = ['#be123c', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

export function HorizontalShareBars({ items = [], labelResolver, valueKey = 'views', percentKey = 'share_percent', emptyText = 'কোনো তথ্য নেই।' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-xs text-stone-400 py-6 text-center">{emptyText}</p>;
  }

  const maxVal = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const label = labelResolver ? labelResolver(item) : (item.name || item.label || 'অন্যান্য');
        const val = Number(item[valueKey] || 0);
        const pct = item[percentKey] !== undefined ? item[percentKey] : Math.round((val / maxVal) * 100);
        const color = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

        return (
          <div key={`${label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800 truncate pr-2">{label}</span>
              <span className="font-mono text-stone-600 shrink-0">
                {toBengaliNumber(val)} ({toBengaliNumber(pct)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(4, pct))}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PublishingTimeHeatmap({ hours = [] }) {
  const [selectedHour, setSelectedHour] = useState(null);
  const maxViews = Math.max(1, ...hours.map((h) => Number(h.views || 0)));
  const active = selectedHour !== null ? hours[selectedHour] : [...hours].sort((a, b) => (b.views || 0) - (a.views || 0))[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {hours.map((slot) => {
          const intensity = slot.views > 0 ? 0.18 + (slot.views / maxViews) * 0.82 : 0.05;
          const isSelected = active?.hour === slot.hour;
          return (
            <button
              key={slot.hour}
              type="button"
              onMouseEnter={() => setSelectedHour(slot.hour)}
              onClick={() => setSelectedHour(slot.hour)}
              className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                isSelected ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200'
              }`}
              style={{
                backgroundColor: `rgba(190, 18, 60, ${intensity.toFixed(2)})`
              }}
              title={`${slot.label} — ভিউ: ${slot.views}, প্রকাশিত: ${slot.published_articles}`}
            >
              <div className={`text-[11px] font-bold font-mono ${intensity > 0.55 ? 'text-white' : 'text-stone-900'}`}>
                {toBengaliNumber(String(slot.hour).padStart(2, '0'))}টা
              </div>
              <div className={`text-[10px] font-semibold ${intensity > 0.55 ? 'text-rose-100' : 'text-stone-600'}`}>
                {toBengaliNumber(slot.views)}
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-700">
          <span className="font-bold text-stone-900">
            সময় (ঢাকা): {active.label}
          </span>
          <span>পাঠক ভিউ: <strong>{toBengaliNumber(active.views)}</strong></span>
          <span>প্রকাশিত প্রতিবেদন: <strong>{toBengaliNumber(active.published_articles)}</strong></span>
          <span>গড় এনগেজমেন্ট: <strong>{FORMAT_DURATION_BN(active.avg_engagement_seconds)}</strong></span>
        </div>
      )}
    </div>
  );
}

export function RetentionFunnelChart({ stages = [] }) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return <p className="text-xs text-stone-400 py-6 text-center">রিটেনশন তথ্য পাওয়া যায়নি।</p>;
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const bgClasses = ['bg-rose-700', 'bg-amber-600', 'bg-blue-600', 'bg-emerald-600'];
        return (
          <div key={stage.bucket} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">{stage.label}</span>
              <span className="font-mono text-stone-600">
                {toBengaliNumber(stage.readers)} পাঠক ({toBengaliNumber(stage.percent)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${bgClasses[idx % bgClasses.length]}`}
                style={{ width: `${Math.min(100, Math.max(4, Number(stage.percent || 0)))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


import React, { useState } from 'react';
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Trash2,
  Flame,
  CheckCircle2,
  XCircle,
  Lock,
  Layers
} from 'lucide-react';
import {
  useGetReliabilityOverviewQuery,
  useRunReliabilityBackupMutation,
  useWarmReliabilityCacheMutation,
  useRetryAllFailedJobsMutation,
  useRetryFailedJobMutation,
  useFlushFailedJobsMutation,
  useLazyVerifyAuditChainQuery
} from '../../store/api/reliabilityApi.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { formatBengaliRelativeTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';

function StatusBadge({ ok, trueLabel = 'সচল (OK)', falseLabel = 'সমস্যা (Degraded)' }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
      {falseLabel}
    </span>
  );
}

export function AdminReliabilityPage() {
  const [feedback, setFeedback] = useState(null);

  const {
    data: overview,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useGetReliabilityOverviewQuery(undefined, { pollingInterval: 60000 });

  const [runBackup, { isLoading: isBackingUp }] = useRunReliabilityBackupMutation();
  const [warmCache, { isLoading: isWarming }] = useWarmReliabilityCacheMutation();
  const [retryAllJobs, { isLoading: isRetryingAll }] = useRetryAllFailedJobsMutation();
  const [retryJob] = useRetryFailedJobMutation();
  const [flushJobs, { isLoading: isFlushing }] = useFlushFailedJobsMutation();
  const [triggerAuditVerify, { data: liveAuditResult, isFetching: isVerifyingAudit }] =
    useLazyVerifyAuditChainQuery();

  const notify = (type, message) => setFeedback({ type, message });

  const handleAction = async (fn, successMsg) => {
    try {
      await fn().unwrap();
      notify('success', successMsg);
    } catch (err) {
      notify('error', extractApiError(err, 'কার্যক্রমটি সম্পন্ন করা যায়নি।'));
    }
  };

  const handleVerifyAudit = async () => {
    try {
      const res = await triggerAuditVerify().unwrap();
      notify(
        res?.valid ? 'success' : 'error',
        res?.valid
          ? `অডিট হ্যাশ চেইন যাচাই সম্পন্ন (${toBengaliNumber(res?.checked || 0)}টি রেকর্ড অক্ষত)।`
          : 'অডিট হ্যাশ চেইনে অসংগতি পাওয়া গেছে।'
      );
    } catch (err) {
      notify('error', extractApiError(err, 'অডিট চেইন যাচাই ব্যর্থ হয়েছে।'));
    }
  };

  const handleFlushJobs = async () => {
    if (typeof window !== 'undefined' && !window.confirm('ব্যর্থ হওয়া সব কিউ জব স্থায়ীভাবে মুছে ফেলতে চান?')) {
      return;
    }
    await handleAction(flushJobs, 'ব্যর্থ জব তালিকা পরিষ্কার করা হয়েছে।');
  };

  const checks = overview?.checks || {};
  const queues = overview?.queues || {};
  const audit = liveAuditResult || overview?.audit_integrity || {};
  const backups = overview?.backups || {};
  const security = overview?.security_posture || {};

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              সিস্টেম নির্ভরযোগ্যতা ও নিরাপত্তা কনসোল
            </h1>
            {overview && (
              <StatusBadge
                ok={overview.status === 'healthy'}
                trueLabel="সুস্থ (Healthy)"
                falseLabel="সতর্কতা (Degraded)"
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            লাইভ হেলথ প্রোব, ডেটাবেজ ব্যাকআপ ও রিস্টোর যাচাই, কিউ মনিটর এবং অডিট লগ অখণ্ডতা (Phase 25)।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            রিফ্রেশ
          </button>

          <button
            type="button"
            onClick={() => handleAction(warmCache, 'ফিড ও অ্যানালিটিক্স ক্যাশ ওয়ার্মিং জব ডিসপ্যাচ করা হয়েছে।')}
            disabled={isWarming}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition disabled:opacity-60"
          >
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            {isWarming ? 'চলছে...' : 'ক্যাশ ওয়ার্ম করুন'}
          </button>

          <button
            type="button"
            onClick={() => handleAction(runBackup, 'ডেটাবেজ ব্যাকআপ ও রিস্টোর যাচাই সফলভাবে সম্পন্ন হয়েছে।')}
            disabled={isBackingUp}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition disabled:opacity-60"
          >
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            {isBackingUp ? 'ব্যাকআপ যাচাই হচ্ছে...' : 'ব্যাকআপ ও রিস্টোর টেস্ট'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-xs sm:text-sm font-medium border flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline shrink-0"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {isError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{extractApiError(error, 'সিস্টেম টেলিমেট্রি লোড করা যায়নি।')}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-32 rounded-2xl bg-stone-200/70 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Health & Infrastructure Probes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-rose-700" aria-hidden="true" />
                  ডেটাবেজ প্রোব
                </span>
                <StatusBadge ok={Boolean(checks.database?.ok)} />
              </div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 uppercase">
                {checks.database?.driver || '—'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                লেটেন্সি: {toBengaliNumber(checks.database?.latency_ms ?? 0)} মি.সে.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  ক্যাশ স্টোর
                </span>
                <StatusBadge ok={Boolean(checks.cache?.ok)} />
              </div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 uppercase">
                {checks.cache?.driver || overview?.cache_store || '—'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                লেটেন্সি: {toBengaliNumber(checks.cache?.latency_ms ?? 0)} মি.সে.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  স্টোরেজ ও ডিস্ক
                </span>
                <StatusBadge ok={Boolean(checks.storage?.ok)} />
              </div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {checks.storage?.free_mb != null ? `${toBengaliNumber(checks.storage.free_mb)} MB ফাঁকা` : 'লিখনযোগ্য'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                সেশন ড্রাইভার: <span className="font-mono">{overview?.session_driver || '—'}</span>
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  জব কিউ (Queue)
                </span>
                <StatusBadge
                  ok={Boolean(queues.tables_ready) && (queues.failed_jobs || 0) === 0}
                  trueLabel="স্বাভাবিক"
                  falseLabel={`${toBengaliNumber(queues.failed_jobs || 0)} ব্যর্থ`}
                />
              </div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                অপেক্ষমাণ: {toBengaliNumber(queues.pending_jobs || 0)}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                কানেকশন: <span className="font-mono">{overview?.queue_connection || 'sync'}</span>
              </p>
            </div>
          </div>

          {/* Audit Integrity + Security Posture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    অডিট লগ HMAC হ্যাশ-চেইন অখণ্ডতা
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyAudit}
                  disabled={isVerifyingAudit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                >
                  {isVerifyingAudit ? 'যাচাই চলছে...' : 'পুনরায় যাচাই'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <StatusBadge
                  ok={Boolean(audit.valid)}
                  trueLabel="চেইন অক্ষত (Zero Tampering)"
                  falseLabel="চেইন ভঙ্গুর"
                />
                <span className="text-stone-600 dark:text-stone-300">
                  পরীক্ষিত রেকর্ড: <strong>{toBengaliNumber(audit.checked || 0)}</strong>
                </span>
                <span className="text-stone-600 dark:text-stone-300">
                  ত্রুটিপূর্ণ আইডি: <strong>{toBengaliNumber(audit.broken_ids?.length || 0)}</strong>
                </span>
              </div>

              {audit.latest_hash && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 font-mono text-[11px] text-stone-600 dark:text-stone-300 break-all">
                  সর্বশেষ HMAC: {audit.latest_hash}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-700" aria-hidden="true" />
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  রানটাইম নিরাপত্তা কনফিগারেশন
                </h2>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <dt className="text-stone-500">এনভায়রনমেন্ট</dt>
                  <dd className="font-bold text-stone-900 dark:text-stone-100 mt-0.5 uppercase font-mono">
                    {overview?.environment || 'unknown'}
                  </dd>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <dt className="text-stone-500">APP_DEBUG</dt>
                  <dd className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {security.app_debug ? 'চালু (Dev Only)' : 'বন্ধ (Hardened)'}
                  </dd>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <dt className="text-stone-500">সিকিউর কুকি (HTTPS)</dt>
                  <dd className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {security.https_redirect_or_proxy ? 'সক্রিয়' : 'নিষ্ক্রিয় (Local HTTP)'}
                  </dd>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <dt className="text-stone-500">টোকেন মেয়াদ (Sanctum)</dt>
                  <dd className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {security.sanctum_expiration_minutes
                      ? `${toBengaliNumber(security.sanctum_expiration_minutes)} মিনিট`
                      : 'সেট করা নেই'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Failed Jobs Queue Monitor */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  ব্যর্থ জব (Failed Jobs) মনিটর
                </h2>
                <p className="text-xs text-stone-500">
                  ব্যর্থ ব্যাকগ্রাউন্ড জব পুনরায় চালান বা নিরাপদে পরিষ্কার করুন।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(retryAllJobs, 'ব্যর্থ সব জব পুনরায় কিউতে পাঠানো হয়েছে।')}
                  disabled={isRetryingAll || !(queues.failed_jobs > 0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  সব রিট্রাই করুন
                </button>
                <button
                  type="button"
                  onClick={handleFlushJobs}
                  disabled={isFlushing || !(queues.failed_jobs > 0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  সব মুছুন
                </button>
              </div>
            </div>

            {(queues.recent_failed || []).length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-3">
                কোনো ব্যর্থ জব নেই। সমস্ত ব্যাকগ্রাউন্ড জব স্বাভাবিকভাবে সম্পন্ন হচ্ছে।
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 text-stone-500">
                    <tr>
                      <th className="py-2 pr-4">ID / UUID</th>
                      <th className="py-2 pr-4">কিউ</th>
                      <th className="py-2 pr-4">সময়</th>
                      <th className="py-2 pr-4">ত্রুটির সারাংশ</th>
                      <th className="py-2 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {queues.recent_failed.map((job) => (
                      <tr key={job.uuid || job.id}>
                        <td className="py-2.5 pr-4 font-mono">{job.id}</td>
                        <td className="py-2.5 pr-4 font-mono">{job.queue}</td>
                        <td className="py-2.5 pr-4">{job.failed_at}</td>
                        <td className="py-2.5 pr-4 max-w-md truncate text-rose-700">{job.summary}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                () => retryJob(job.uuid || job.id),
                                `জব #${job.id} পুনরায় কিউতে পাঠানো হয়েছে।`
                              )
                            }
                            className="px-2.5 py-1 rounded-md border border-stone-200 hover:bg-stone-100 font-semibold"
                          >
                            রিট্রাই
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Automated Backups & Restoration History */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  স্বয়ংক্রিয় ব্যাকআপ ও রিস্টোর যাচাই ইতিহাস
                </h2>
                <p className="text-xs text-stone-500">
                  মোট রান: {toBengaliNumber(backups.total_runs || 0)} | সর্বশেষ সফল রিস্টোর যাচাই:{' '}
                  {backups.latest_verified_at ? formatBengaliRelativeTime(backups.latest_verified_at) : 'এখনো হয়নি'}
                </p>
              </div>
            </div>

            {(backups.items || []).length === 0 ? (
              <p className="text-xs text-stone-500 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
                এখনো কোনো ব্যাকআপ যাচাই রান রেকর্ড হয়নি। উপরের “ব্যাকআপ ও রিস্টোর টেস্ট” বোতামে ক্লিক করে একটি ড্রিল চালান।
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 text-stone-500">
                    <tr>
                      <th className="py-2 pr-4">রান #</th>
                      <th className="py-2 pr-4">অবস্থা</th>
                      <th className="py-2 pr-4">রিস্টোর যাচাই</th>
                      <th className="py-2 pr-4">আকার</th>
                      <th className="py-2 pr-4">SHA-256 (সংক্ষিপ্ত)</th>
                      <th className="py-2 pr-4">সময় (ms)</th>
                      <th className="py-2">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {backups.items.map((run) => (
                      <tr key={run.id}>
                        <td className="py-2.5 pr-4 font-mono">#{run.id}</td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge
                            ok={run.status === 'verified'}
                            trueLabel="সম্পন্ন"
                            falseLabel={run.status}
                          />
                        </td>
                        <td className="py-2.5 pr-4">
                          {run.restore_verified ? 'হ্যাঁ (উত্তীর্ণ)' : 'না'}
                        </td>
                        <td className="py-2.5 pr-4 font-mono">
                          {run.size_bytes != null ? `${Math.round(run.size_bytes / 1024)} KB` : '—'}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-stone-500">
                          {run.checksum_sha256 ? `${run.checksum_sha256.slice(0, 16)}…` : '—'}
                        </td>
                        <td className="py-2.5 pr-4 font-mono">
                          {run.duration_ms != null ? `${run.duration_ms} ms` : '—'}
                        </td>
                        <td className="py-2.5 text-stone-500">
                          {run.verified_at || run.created_at
                            ? formatBengaliRelativeTime(run.verified_at || run.created_at)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReliabilityPage;


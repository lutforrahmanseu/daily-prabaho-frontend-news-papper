import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  CalendarClock,
  Archive,
  Ban,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useTransitionCreatorProjectWorkflowMutation,
  useAuthorizeExternalStudioPublishMutation,
  useDispatchCreatorPublishJobMutation,
  useCancelCreatorPublishJobMutation,
} from '../../../store/api/creatorStudioApi.js';
import {
  STUDIO_STATUS_META,
  STUDIO_CHANNELS,
  canExecuteExternalPublish,
} from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export default function PublishWorkflowTab({
  project,
  studioSettings,
  canCreate,
  canApprove,
  canPublish,
  canAuthorizeExternal,
}) {
  const [channel, setChannel] = useState('newsflow_internal');
  const [socialAssetId, setSocialAssetId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [authorizationNote, setAuthorizationNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [transitionWorkflow, { isLoading: isTransitioning }] = useTransitionCreatorProjectWorkflowMutation();
  const [authorizeExternal, { isLoading: isAuthorizing }] = useAuthorizeExternalStudioPublishMutation();
  const [dispatchPublish, { isLoading: isDispatching }] = useDispatchCreatorPublishJobMutation();
  const [cancelJob] = useCancelCreatorPublishJobMutation();

  const statusMeta = STUDIO_STATUS_META[project.status] || STUDIO_STATUS_META.draft;
  const approvedScripts = (project.scripts || []).filter((s) => s.approval_status === 'approved');
  const settingsObj = studioSettings?.settings || {};
  const selectedChannelMeta = STUDIO_CHANNELS.find((c) => c.id === channel) || STUDIO_CHANNELS[0];

  const externalReady = canExecuteExternalPublish(project, settingsObj, canAuthorizeExternal || canPublish);
  const canSubmit = project.status === 'draft' && (canCreate || canApprove);
  const canApproveProject = ['draft', 'in_review'].includes(project.status) && (canApprove || canPublish);
  const canRejectProject = ['in_review', 'approved', 'scheduled'].includes(project.status) && (canApprove || canPublish);

  const handleWorkflow = async (action) => {
    try {
      await transitionWorkflow({
        projectId: project.id,
        action,
        reason: action === 'reject' ? rejectReason : undefined,
      }).unwrap();
      if (action === 'reject') setRejectReason('');
      sweetAlert.toast(`প্রজেক্ট অবস্থা '${action}' হালনাগাদ হয়েছে`, 'success');
    } catch (err) {
      sweetAlert.error('ওয়ার্কফ্লো পরিবর্তন ব্যর্থ', extractApiError(err));
    }
  };

  const handleToggleExternalAuth = async (nextAuthorized) => {
    try {
      await authorizeExternal({
        projectId: project.id,
        authorized: nextAuthorized,
      }).unwrap();
      sweetAlert.toast(
        nextAuthorized
          ? 'বহিঃস্থ সোশ্যাল প্ল্যাটফর্মে প্রকাশের অনুমোদন প্রদান করা হয়েছে'
          : 'বহিঃস্থ প্রকাশের অনুমোদন প্রত্যাহার করা হয়েছে',
        nextAuthorized ? 'success' : 'warning'
      );
    } catch (err) {
      sweetAlert.error('অনুমোদন পরিবর্তন ব্যর্থ', extractApiError(err));
    }
  };

  const handlePublishDispatch = async () => {
    try {
      await dispatchPublish({
        projectId: project.id,
        channel,
        social_asset_id: socialAssetId ? Number(socialAssetId) : null,
        scheduled_at: scheduledAt || null,
        authorization_note: authorizationNote.trim() || null,
      }).unwrap();
      setScheduledAt('');
      setAuthorizationNote('');
      sweetAlert.toast(scheduledAt ? 'পাবলিশিং জব নির্ধারিত হয়েছে' : 'পাবলিশিং জব সম্পন্ন হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('পাবলিশিং ব্যর্থ', extractApiError(err));
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await cancelJob({ projectId: project.id, jobId }).unwrap();
      sweetAlert.toast('নির্ধারিত জব বাতিল করা হয়েছে', 'info');
    } catch (err) {
      sweetAlert.error('বাতিল ব্যর্থ', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Stepper & Gate Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">সম্পাদনা ও প্রকাশনার ধাপসমূহ</h4>
            <p className="text-xs text-slate-500">
              খসড়া (Draft) → পর্যালোচনা (In Review) → অনুমোদন (Approved) → সময় নির্ধারণ (Scheduled) → প্রকাশ (Published)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>
            {project.status === 'published' && (
              <Link
                to={`/creator-studio/${project.uuid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <ExternalLink className="w-3.5 h-3.5" /> পাবলিক শোকেস দেখুন
              </Link>
            )}
          </div>
        </div>

        {/* Safety checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3 rounded-lg border ${
              approvedScripts.length > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="font-bold">১. স্ক্রিপ্ট অনুমোদন</div>
            <div className="mt-0.5">
              {approvedScripts.length > 0
                ? `${approvedScripts.length}টি অনুমোদিত স্ক্রিপ্ট প্রস্তুত`
                : 'প্রকাশের আগে কমপক্ষে ১টি সাংবাদিক-অনুমোদিত স্ক্রিপ্ট প্রয়োজন'}
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              ['approved', 'scheduled', 'published'].includes(project.status)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="font-bold">২. প্রজেক্ট অনুমোদন</div>
            <div className="mt-0.5">
              {project.approver?.name ? `অনুমোদনকারী: ${project.approver.name}` : 'সম্পাদকীয় অনুমোদনের অপেক্ষায়'}
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              project.external_publish_authorized
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="font-bold">৩. বহিঃস্থ প্রকাশ অনুমতি (Fail-Closed)</div>
            <div className="mt-0.5">
              {project.external_publish_authorized
                ? `অনুমোদিত (${project.externalAuthorizer?.name || 'Editor'})`
                : 'স্বয়ংক্রিয়ভাবে বন্ধ — স্পষ্ট অনুমোদন ছাড়া বাইরের চ্যানেলে প্রকাশ হবে না'}
            </div>
          </div>
        </div>

        {project.rejection_reason && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <strong>সর্বশেষ ফেরত পাঠানোর কারণ:</strong> {project.rejection_reason}
          </div>
        )}

        {/* Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {canSubmit && (
            <button
              type="button"
              onClick={() => handleWorkflow('submit')}
              disabled={isTransitioning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {isTransitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              পর্যালোচনায় পাঠান (Submit)
            </button>
          )}

          {canApproveProject && (
            <button
              type="button"
              onClick={() => handleWorkflow('approve')}
              disabled={isTransitioning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> প্রজেক্ট অনুমোদন করুন (Approve)
            </button>
          )}

          {canRejectProject && (
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="সংশোধনের মন্তব্য (ঐচ্ছিক)..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={() => handleWorkflow('reject')}
                disabled={isTransitioning}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                <XCircle className="w-3.5 h-3.5" /> ফেরত পাঠান
              </button>
            </div>
          )}

          {project.status !== 'archived' && (canApprove || canCreate) && (
            <button
              type="button"
              onClick={() => handleWorkflow('archive')}
              disabled={isTransitioning}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 ml-auto"
            >
              <Archive className="w-3.5 h-3.5" /> আর্কাইভ
            </button>
          )}
        </div>
      </div>

      {/* Fail-Closed External Publishing Authorization Gate */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold">
            {project.external_publish_authorized ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
            বহিঃস্থ সোশ্যাল মিডিয়া প্রকাশনা অনুমোদন (Fail-Closed Policy)
          </div>
          <p className="text-xs text-slate-300">
            এই অনুমতি ছাড়া YouTube Shorts, Facebook Reels, Instagram, X, TikTok বা বহিঃস্থ Webhook-এ কোনো কনটেন্ট প্রকাশ বা শিডিউল করা যাবে না।
            {!settingsObj.allow_external_publish && (
              <span className="text-amber-300 font-semibold">
                {' '}
                (সতর্কতা: স্টুডিও সেটিংসে বহিঃস্থ প্রকাশনা বর্তমানে গ্লোবালভাবে বন্ধ রয়েছে)
              </span>
            )}
          </p>
        </div>

        {canAuthorizeExternal ? (
          <button
            type="button"
            disabled={isAuthorizing}
            onClick={() => handleToggleExternalAuth(!project.external_publish_authorized)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              project.external_publish_authorized
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
            }`}
          >
            {isAuthorizing
              ? 'সংরক্ষণ হচ্ছে...'
              : project.external_publish_authorized
              ? 'বহিঃস্থ অনুমোদন প্রত্যাহার করুন'
              : 'বহিঃস্থ প্রকাশের অনুমতি দিন'}
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            শুধুমাত্র অনুমোদিত সম্পাদক (creator_studio.publish.external) এটি পরিবর্তন করতে পারেন
          </span>
        )}
      </div>

      {/* Publish & Schedule Dispatcher */}
      {canPublish && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" /> কনটেন্ট প্রকাশ বা শিডিউল করুন
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পাবলিশিং চ্যানেল</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <optgroup label="অভ্যন্তরীণ (NewsFlow Platform)">
                  {STUDIO_CHANNELS.filter((c) => !c.external).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="বহিঃস্থ প্ল্যাটফর্ম (অনুমোদন সাপেক্ষে)">
                  {STUDIO_CHANNELS.filter((c) => c.external).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সংযুক্ত সোশ্যাল অ্যাসেট (ঐচ্ছিক)</label>
              <select
                value={socialAssetId}
                onChange={(e) => setSocialAssetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="">প্রজেক্ট মূল মিডিয়া / প্যাকেজ</option>
                {(project.social_assets || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} • {a.asset_type} ({a.aspect_ratio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" /> সময় নির্ধারণ (খালি রাখলে তাৎক্ষণিক)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সম্পাদকীয় নোট (ঐচ্ছিক)</label>
              <input
                type="text"
                value={authorizationNote}
                onChange={(e) => setAuthorizationNote(e.target.value)}
                placeholder="যেমন: রাত ৮টার বুলেটিন..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          {selectedChannelMeta.external && !externalReady && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              বহিঃস্থ চ্যানেলে প্রকাশের পূর্বে: (১) স্টুডিও সেটিংসে External Publish সক্রিয়, (২) প্রজেক্ট Approved এবং (৩) উপরোক্ত Fail-Closed বহিঃস্থ অনুমোদন চালু থাকতে হবে।
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePublishDispatch}
              disabled={isDispatching || (selectedChannelMeta.external && !externalReady)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {scheduledAt ? 'নির্ধারিত সময়ে শিডিউল করুন' : 'এখনই প্রকাশ করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Publish Jobs History */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">পাবলিশিং ও শিডিউল জব ইতিহাস</h4>
        {!(project.publish_jobs || []).length ? (
          <p className="text-xs text-slate-500">এখনো কোনো পাবলিশিং জব তৈরি হয়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">চ্যানেল</th>
                  <th className="py-2 px-3">অবস্থা</th>
                  <th className="py-2 px-3">সময় / অনুমোদন</th>
                  <th className="py-2 px-3">আউটপুট / নোট</th>
                  <th className="py-2 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(project.publish_jobs || []).map((job) => (
                  <tr key={job.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{job.channel}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          job.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : job.status === 'scheduled'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {job.published_at || job.scheduled_at || job.created_at}
                      {job.authorizer?.name ? ` • Auth: ${job.authorizer.name}` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {job.error_message && <span className="text-rose-600">{job.error_message}</span>}
                      {!job.error_message && job.external_post_url && (
                        <a
                          href={job.external_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          {job.external_post_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {!job.error_message && !job.external_post_url && (job.authorization_note || '—')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {['draft', 'approved', 'scheduled'].includes(job.status) && canPublish && (
                        <button
                          type="button"
                          onClick={() => handleCancelJob(job.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <Ban className="w-3 h-3" /> বাতিল
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


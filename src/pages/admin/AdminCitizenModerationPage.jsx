import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout.js';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserPlus,
  Flag,
  MessageSquare,
  Calendar,
  Megaphone,
  Users,
  Eye,
  Lock,
  Pin,
  Search,
  Trash2,
  Newspaper,
  X,
  Plus
} from 'lucide-react';
import {
  useGetAdminCitizenOverviewQuery,
  useGetAssignableCitizenReportersQuery,
  useGetAdminCitizenSubmissionsQuery,
  useGetAdminCitizenSubmissionDetailQuery,
  useReviewCitizenSubmissionMutation,
  useAssignCitizenSubmissionReporterMutation,
  usePublishCitizenSubmissionMutation,
  useRemoveCitizenSubmissionMutation,
  useGetAdminCommunityDiscussionsQuery,
  useModerateCommunityDiscussionMutation,
  useGetAdminDiscussionRepliesQuery,
  useModerateDiscussionReplyMutation,
  useGetAdminAbuseReportsQuery,
  useResolveAbuseReportMutation,
  useGetAdminContributorProfilesQuery,
  useModerateContributorProfileMutation,
  useGetAdminCommunityEventsQuery,
  useCreateCommunityEventMutation,
  useUpdateCommunityEventMutation,
  useGetAdminCommunityAnnouncementsQuery,
  useCreateCommunityAnnouncementMutation,
  useUpdateCommunityAnnouncementMutation
} from '../../store/api/citizenApi.js';
import {
  SUBMISSION_STATUS_META,
  VERIFICATION_STATUS_META,
  VERIFICATION_CHECKLIST_ITEMS,
  TRUST_LEVEL_META,
  EVENT_TYPES,
  ANNOUNCEMENT_TYPES
} from '../../utils/citizenHelpers.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { toBengaliNumber, formatBengaliFullDateTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

function ProtectedMediaPreview({ media }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (!media?.url || (!media.url.includes('/citizen/media/') && media.url.startsWith('http'))) {
      return undefined;
    }

    fetchWithTimeout(media.url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => {
        if (!res.ok) throw new Error('Stream failed');
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media?.url]);

  const src = blobUrl || (media?.url?.startsWith('http') ? media.url : null);
  if (failed || !src) {
    return (
      <div className="p-3 text-xs text-stone-500 bg-stone-100 rounded-lg">
        {media?.original_filename || 'Protected media'} ({media?.media_type})
      </div>
    );
  }

  return media?.media_type === 'video' ? (
    <video src={src} controls className="w-full max-h-60 rounded-lg bg-black" />
  ) : (
    <img src={src} alt={media?.caption || 'Citizen evidence'} className="w-full max-h-60 object-contain rounded-lg bg-stone-100" />
  );
}

export function AdminCitizenModerationPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const language = useSelector((state) => state.ui.language);
  const isBn = language === 'bn';

  const canReview = hasEffectivePermission(authState, adminState, 'citizen.review');
  const canPublish = hasEffectivePermission(authState, adminState, 'citizen.publish');
  const canModerate = hasEffectivePermission(authState, adminState, 'community.moderate');
  const canManageCommunity = hasEffectivePermission(authState, adminState, 'community.manage');

  const availableTabs = [
    ...(canReview || canPublish || canModerate
      ? [{ id: 'submissions', label: isBn ? 'নাগরিক প্রতিবেদন যাচাই' : 'Submissions Queue', icon: Newspaper }]
      : []),
    ...(canModerate ? [{ id: 'discussions', label: isBn ? 'আলোচনা ও মন্তব্য' : 'Discussions & Replies', icon: MessageSquare }] : []),
    ...(canModerate ? [{ id: 'abuse', label: isBn ? 'অভিযোগ ও রিপোর্ট' : 'Abuse Reports', icon: Flag }] : []),
    ...(canReview || canModerate ? [{ id: 'contributors', label: isBn ? 'অবদানকারী ডিরেক্টরি' : 'Contributors', icon: Users }] : []),
    ...(canManageCommunity ? [{ id: 'cms', label: isBn ? 'ইভেন্ট ও ঘোষণা' : 'Events & Announcements', icon: Megaphone }] : [])
  ];

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'submissions');

  // Submission Filters & Detail State
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [verifFilter, setVerifFilter] = useState('all');
  const [subSearch, setSubSearch] = useState('');
  const [selectedSubId, setSelectedSubId] = useState(null);

  // Review / Assignment / Publish Form States
  const [reviewForm, setReviewForm] = useState({
    status: 'under_review',
    verification_status: 'in_progress',
    verification_checklist: {},
    verification_notes: '',
    editor_feedback: ''
  });
  const [assignForm, setAssignForm] = useState({
    reporter_user_id: '',
    instructions: '',
    create_newsroom_assignment: true
  });
  const [createNewsDraft, setCreateNewsDraft] = useState(true);
  const [publishNote, setPublishNote] = useState('');
  const [removeReason, setRemoveReason] = useState('');

  // Discussions & Replies State
  const [discFilter, setDiscFilter] = useState('pending');
  const [replyFilter, setReplyFilter] = useState('pending');

  // Abuse Resolution State
  const [abuseFilter, setAbuseFilter] = useState('pending');
  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved_action_taken',
    action_taken: 'remove_content',
    resolution_notes: ''
  });

  // Contributors Filter
  const [trustFilter, setTrustFilter] = useState('all');

  // Events & Announcements Creation Forms
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    location_label: '',
    is_online: true,
    meeting_url: '',
    starts_at: '',
    capacity: 100
  });
  const [annForm, setAnnForm] = useState({
    title: '',
    body: '',
    announcement_type: 'call_for_stories',
    priority: 'important',
    is_pinned: true
  });

  // Queries
  const { data: overview } = useGetAdminCitizenOverviewQuery();
  const { data: reporters = [] } = useGetAssignableCitizenReportersQuery(undefined, { skip: !canReview });
  const { data: submissionsData } = useGetAdminCitizenSubmissionsQuery(
    {
      status: subStatusFilter,
      verification_status: verifFilter,
      search: subSearch || undefined
    },
    { skip: !(canReview || canPublish || canModerate) }
  );
  const { data: selectedSub } = useGetAdminCitizenSubmissionDetailQuery(selectedSubId, {
    skip: !selectedSubId
  });
  const { data: discussionsData } = useGetAdminCommunityDiscussionsQuery({ status: discFilter }, { skip: !canModerate });
  const { data: repliesData } = useGetAdminDiscussionRepliesQuery({ status: replyFilter }, { skip: !canModerate });
  const { data: abuseData } = useGetAdminAbuseReportsQuery({ status: abuseFilter }, { skip: !canModerate });
  const { data: contributorsData } = useGetAdminContributorProfilesQuery(
    { trust_level: trustFilter },
    { skip: !(canReview || canModerate) }
  );
  const { data: adminEvents = [] } = useGetAdminCommunityEventsQuery(undefined, { skip: !canManageCommunity });
  const { data: adminAnnouncements = [] } = useGetAdminCommunityAnnouncementsQuery(undefined, {
    skip: !canManageCommunity
  });

  // Mutations
  const [reviewSub, { isLoading: reviewing }] = useReviewCitizenSubmissionMutation();
  const [assignReporter, { isLoading: assigning }] = useAssignCitizenSubmissionReporterMutation();
  const [publishSub, { isLoading: publishing }] = usePublishCitizenSubmissionMutation();
  const [removeSub] = useRemoveCitizenSubmissionMutation();
  const [moderateDisc] = useModerateCommunityDiscussionMutation();
  const [moderateReply] = useModerateDiscussionReplyMutation();
  const [resolveAbuse] = useResolveAbuseReportMutation();
  const [moderateContrib] = useModerateContributorProfileMutation();
  const [createEvent, { isLoading: creatingEvent }] = useCreateCommunityEventMutation();
  const [updateEvent] = useUpdateCommunityEventMutation();
  const [createAnnouncement, { isLoading: creatingAnn }] = useCreateCommunityAnnouncementMutation();
  const [updateAnnouncement] = useUpdateCommunityAnnouncementMutation();

  useEffect(() => {
    if (selectedSub) {
      setReviewForm({
        status: selectedSub.status === 'published' ? 'under_review' : selectedSub.status || 'under_review',
        verification_status: selectedSub.verification_status || 'pending',
        verification_checklist: selectedSub.verification_checklist || {},
        verification_notes: selectedSub.verification_notes || '',
        editor_feedback: selectedSub.editor_feedback || ''
      });
      setAssignForm((prev) => ({
        ...prev,
        reporter_user_id: selectedSub.assigned_reporter_id || ''
      }));
    }
  }, [selectedSub]);

  const submissions = submissionsData?.items || [];
  const discussions = discussionsData?.items || [];
  const replies = repliesData?.items || [];
  const abuseReports = abuseData?.items || [];
  const contributors = contributorsData?.items || [];

  const toggleChecklist = (key) => {
    setReviewForm((prev) => ({
      ...prev,
      verification_checklist: {
        ...prev.verification_checklist,
        [key]: !prev.verification_checklist?.[key]
      }
    }));
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedSubId) return;
    try {
      await reviewSub({ id: selectedSubId, ...reviewForm }).unwrap();
      sweetAlert.success(isBn ? 'যাচাই ও পর্যালোচনা সংরক্ষিত হয়েছে' : 'Review & verification updated');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Review update failed');
    }
  };

  const handleAssignReporter = async (e) => {
    e.preventDefault();
    if (!selectedSubId || !assignForm.reporter_user_id) return;
    try {
      await assignReporter({
        id: selectedSubId,
        reporter_user_id: Number(assignForm.reporter_user_id),
        instructions: assignForm.instructions,
        create_newsroom_assignment: assignForm.create_newsroom_assignment
      }).unwrap();
      sweetAlert.success(isBn ? 'স্টাফ প্রতিবেদক ও নিউজরুম অ্যাসাইনমেন্ট যুক্ত হয়েছে' : 'Reporter assigned cleanly');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Assignment failed');
    }
  };

  const handlePublish = async () => {
    if (!selectedSubId) return;
    try {
      await publishSub({
        id: selectedSubId,
        create_news_draft: createNewsDraft,
        public_note: publishNote.trim() || undefined
      }).unwrap();
      sweetAlert.success(isBn ? 'সম্পাদকীয় অনুমোদনে নাগরিক প্রতিবেদন প্রকাশিত হয়েছে!' : 'Citizen report published!');
      setPublishNote('');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Publish failed');
    }
  };

  const handleRemoveSub = async () => {
    if (!selectedSubId || !removeReason.trim() || removeReason.trim().length < 5) {
      sweetAlert.warning(isBn ? 'অপসারণের কারণ (কমপক্ষে ৫ অক্ষর) লিখুন।' : 'Provide removal reason (min 5 chars).');
      return;
    }
    try {
      await removeSub({ id: selectedSubId, reason: removeReason.trim() }).unwrap();
      sweetAlert.info(isBn ? 'প্রতিবেদনটি অপসারণ করা হয়েছে' : 'Submission unpublished & removed');
      setRemoveReason('');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Remove failed');
    }
  };

  const handleResolveAbuse = async (e) => {
    e.preventDefault();
    if (!resolvingReport) return;
    try {
      await resolveAbuse({ id: resolvingReport.id, ...resolveForm }).unwrap();
      sweetAlert.success(isBn ? 'অভিযোগ নিষ্পত্তি সম্পন্ন হয়েছে' : 'Abuse report resolved');
      setResolvingReport(null);
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed to resolve report');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await createEvent(eventForm).unwrap();
      sweetAlert.success(isBn ? 'নতুন কমিউনিটি ইভেন্ট তৈরি হয়েছে' : 'Event created');
      setEventForm({
        title: '',
        description: '',
        event_type: 'workshop',
        location_label: '',
        is_online: true,
        meeting_url: '',
        starts_at: '',
        capacity: 100
      });
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Event creation failed');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement(annForm).unwrap();
      sweetAlert.success(isBn ? 'নতুন কমিউনিটি ঘোষণা প্রকাশিত হয়েছে' : 'Announcement published');
      setAnnForm({ title: '', body: '', announcement_type: 'call_for_stories', priority: 'important', is_pinned: true });
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Announcement creation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-serif-bn text-stone-900">
            {isBn ? 'নাগরিক সাংবাদিকতা ও কমিউনিটি মডারেশন ডেস্ক' : 'Citizen Journalism & Community Moderation'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {isBn
              ? 'জমা পড়া প্রতিবেদন যাচাই, স্টাফ অ্যাসাইনমেন্ট, অনুমোদন-পূর্ব প্রকাশনা, আলোচনা মডারেশন ও নিরাপত্তা নিয়ন্ত্রণ।'
              : 'Verify citizen reports, assign reporters, enforce moderation gates, resolve abuse reports, and manage community events.'}
          </p>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: isBn ? 'অপেক্ষমাণ প্রতিবেদন' : 'Pending Reports', val: overview?.pending_submissions_count ?? 0, tone: 'text-amber-700' },
          { label: isBn ? 'যাচাই কিউ' : 'Verification Queue', val: overview?.verification_queue_count ?? 0, tone: 'text-indigo-700' },
          { label: isBn ? 'প্রকাশিত নাগরিক খবর' : 'Published Reports', val: overview?.published_submissions_count ?? 0, tone: 'text-emerald-700' },
          { label: isBn ? 'অপেক্ষমাণ আলোচনা' : 'Pending Threads', val: overview?.pending_discussions_count ?? 0, tone: 'text-sky-700' },
          { label: isBn ? 'অপেক্ষমাণ মন্তব্য' : 'Pending Replies', val: overview?.pending_replies_count ?? 0, tone: 'text-purple-700' },
          { label: isBn ? 'খোলা অভিযোগ' : 'Open Abuse', val: overview?.open_abuse_reports_count ?? 0, tone: 'text-rose-700' }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-stone-200 rounded-2xl p-4">
            <p className={`text-2xl font-extrabold ${kpi.tone}`}>
              {isBn ? toBengaliNumber(kpi.val) : kpi.val}
            </p>
            <p className="text-[11px] font-semibold text-stone-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-stone-200 rounded-2xl p-2 flex flex-wrap gap-2">
        {availableTabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                active ? 'bg-rose-700 text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CITIZEN SUBMISSIONS QUEUE */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">{isBn ? 'সব অবস্থা' : 'All Statuses'}</option>
              {Object.entries(SUBMISSION_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{isBn ? v.labelBn : v.labelEn}</option>
              ))}
            </select>

            <select
              value={verifFilter}
              onChange={(e) => setVerifFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">{isBn ? 'সব যাচাই পর্যায়' : 'All Verification'}</option>
              {Object.entries(VERIFICATION_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{isBn ? v.labelBn : v.labelEn}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-48">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="search"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder={isBn ? 'ট্র্যাকিং কোড, শিরোনাম বা জেলা...' : 'Tracking code, title, district...'}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{isBn ? 'কোড ও শিরোনাম' : 'Tracking & Title'}</th>
                    <th className="px-4 py-3">{isBn ? 'অবদানকারী ও জেলা' : 'Contributor & District'}</th>
                    <th className="px-4 py-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                    <th className="px-4 py-3">{isBn ? 'যাচাই' : 'Verification'}</th>
                    <th className="px-4 py-3 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                        {isBn ? 'কোনো নাগরিক প্রতিবেদন পাওয়া যায়নি।' : 'No citizen submissions found.'}
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => {
                      const sMeta = SUBMISSION_STATUS_META[sub.status] || SUBMISSION_STATUS_META.submitted;
                      const vMeta = VERIFICATION_STATUS_META[sub.verification_status] || VERIFICATION_STATUS_META.pending;
                      return (
                        <tr key={sub.id} className="hover:bg-stone-50">
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] font-bold text-rose-700">{sub.tracking_code}</div>
                            <div className="font-bold text-stone-900 line-clamp-1">{sub.title}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-stone-800">{sub.contributor?.name || sub.contributor_profile?.display_name}</div>
                            <div className="text-[11px] text-stone-500">{sub.district} • {sub.credit_mode}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${sMeta.tone}`}>
                              {isBn ? sMeta.labelBn : sMeta.labelEn}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${vMeta.tone}`}>
                              {isBn ? vMeta.labelBn : vMeta.labelEn}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedSubId(sub.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isBn ? 'পর্যালোচনা ও যাচাই' : 'Review'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCUSSIONS & REPLIES MODERATION */}
      {activeTab === 'discussions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900">{isBn ? 'পাঠক আলোচনা থ্রেড' : 'Community Threads'}</h2>
              <select
                value={discFilter}
                onChange={(e) => setDiscFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="hidden">Hidden</option>
                <option value="removed">Removed</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="space-y-3">
              {discussions.map((d) => (
                <div key={d.id} className="border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-stone-900">{d.title}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-bold">{d.status}</span>
                  </div>
                  <p className="text-stone-600 line-clamp-2">{d.body}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => moderateDisc({ id: d.id, decision: 'approve' })}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateDisc({ id: d.id, decision: 'pin' })}
                      className="px-2.5 py-1 rounded bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Pin className="w-3 h-3 inline" /> Pin
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateDisc({ id: d.id, decision: 'lock' })}
                      className="px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Lock className="w-3 h-3 inline" /> Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateDisc({ id: d.id, decision: 'remove' })}
                      className="px-2.5 py-1 rounded bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900">{isBn ? 'আলোচনার মন্তব্যসমূহ' : 'Discussion Replies'}</h2>
              <select
                value={replyFilter}
                onChange={(e) => setReplyFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
                <option value="removed">Removed</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="space-y-3">
              {replies.map((r) => (
                <div key={r.id} className="border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>{r.author?.name} • {r.discussion?.title}</span>
                    <span className="font-bold">{r.status}</span>
                  </div>
                  <p className="text-stone-800">{r.body}</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => moderateReply({ id: r.id, decision: 'approve' })}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateReply({ id: r.id, decision: 'hide' })}
                      className="px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Hide
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateReply({ id: r.id, decision: 'remove' })}
                      className="px-2.5 py-1 rounded bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ABUSE REPORTS QUEUE */}
      {activeTab === 'abuse' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900">{isBn ? 'নিরাপত্তা ও অপব্যবহার অভিযোগ কিউ' : 'Abuse & Safety Reports'}</h2>
            <select
              value={abuseFilter}
              onChange={(e) => setAbuseFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-300"
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved_action_taken">Action Taken</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="space-y-3">
            {abuseReports.map((rep) => (
              <div key={rep.id} className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">{rep.report_code}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 font-bold">{rep.target_type} #{rep.target_id}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{rep.reason_category}</span>
                  </div>
                  <p className="text-stone-800">{rep.details}</p>
                  {rep.resolution_notes && (
                    <p className="text-[11px] text-emerald-700 font-semibold">Resolution: {rep.resolution_notes}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResolvingReport(rep);
                    setResolveForm({ status: 'resolved_action_taken', action_taken: 'remove_content', resolution_notes: '' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  {isBn ? 'ব্যবস্থা নিন' : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTRIBUTORS DIRECTORY */}
      {activeTab === 'contributors' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900">{isBn ? 'নাগরিক প্রতিবেদক তালিকা' : 'Contributor Profiles'}</h2>
            <select
              value={trustFilter}
              onChange={(e) => setTrustFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-300"
            >
              <option value="all">All Trust Levels</option>
              <option value="standard">Standard</option>
              <option value="trusted">Trusted</option>
              <option value="restricted">Restricted</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="space-y-3">
            {contributors.map((p) => {
              const tMeta = TRUST_LEVEL_META[p.trust_level] || TRUST_LEVEL_META.standard;
              return (
                <div key={p.id} className="border border-stone-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{p.display_name}</span>
                      <span className="font-mono text-stone-500">@{p.public_handle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tMeta.tone}`}>
                        {isBn ? tMeta.labelBn : tMeta.labelEn}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Submitted: {p.total_submissions} • Published: {p.published_submissions} • Warnings: {p.warnings_count}
                    </p>
                  </div>

                  {canModerate && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moderateContrib({ id: p.id, verified_contributor: !p.verified_contributor })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                          p.verified_contributor ? 'bg-emerald-600 text-white' : 'border border-stone-300 text-stone-700'
                        }`}
                      >
                        {p.verified_contributor ? 'Verified ✓' : 'Mark Verified'}
                      </button>
                      <select
                        value={p.trust_level}
                        onChange={(e) => moderateContrib({ id: p.id, trust_level: e.target.value })}
                        className="px-2.5 py-1.5 text-[11px] rounded-lg border border-stone-300 bg-white"
                      >
                        <option value="standard">Standard</option>
                        <option value="trusted">Trusted</option>
                        <option value="restricted">Restricted</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: COMMUNITY EVENTS & ANNOUNCEMENTS CMS */}
      {activeTab === 'cms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              {isBn ? 'কমিউনিটি ইভেন্ট তৈরি করুন' : 'Create Community Event'}
            </h2>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm((p) => ({ ...p, event_type: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{isBn ? t.labelBn : t.labelEn}</option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.starts_at}
                  onChange={(e) => setEventForm((p) => ({ ...p, starts_at: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <input
                type="text"
                placeholder="Location label / Online platform"
                value={eventForm.location_label}
                onChange={(e) => setEventForm((p) => ({ ...p, location_label: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
              <textarea
                rows={3}
                required
                placeholder="Event description"
                value={eventForm.description}
                onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
              <button
                type="submit"
                disabled={creatingEvent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? 'ইভেন্ট প্রকাশ করুন' : 'Publish Event'}</span>
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-stone-100">
              {adminEvents.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-stone-900">{ev.title}</p>
                    <p className="text-[11px] text-stone-500">
                      {ev.status} • Registered: {ev.registered_count} • {ev.starts_at ? formatBengaliFullDateTime(ev.starts_at) : ''}
                    </p>
                  </div>
                  <select
                    value={ev.status}
                    onChange={(e) => updateEvent({ id: ev.id, status: e.target.value })}
                    className="px-2 py-1 rounded border border-stone-300 bg-white text-[11px]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              {isBn ? 'কমিউনিটি ঘোষণা প্রকাশ করুন' : 'Create Community Announcement'}
            </h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Announcement headline"
                value={annForm.title}
                onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={annForm.announcement_type}
                  onChange={(e) => setAnnForm((p) => ({ ...p, announcement_type: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  {ANNOUNCEMENT_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{isBn ? a.labelBn : a.labelEn}</option>
                  ))}
                </select>
                <select
                  value={annForm.priority}
                  onChange={(e) => setAnnForm((p) => ({ ...p, priority: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                placeholder="Announcement body"
                value={annForm.body}
                onChange={(e) => setAnnForm((p) => ({ ...p, body: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
              <button
                type="submit"
                disabled={creatingAnn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>{isBn ? 'ঘোষণা প্রকাশ করুন' : 'Post Announcement'}</span>
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-stone-100">
              {adminAnnouncements.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-stone-900">{a.title}</p>
                    <p className="text-[11px] text-stone-500">{a.announcement_type} • {a.status}</p>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => updateAnnouncement({ id: a.id, status: e.target.value })}
                    className="px-2 py-1 rounded border border-stone-300 bg-white text-[11px]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submission Review, Verification, Reporter Assignment & Publish Drawer */}
      {selectedSubId && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                  <span className="font-mono font-bold text-rose-700">{selectedSub.tracking_code}</span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 font-bold">{selectedSub.submission_type}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                    {selectedSub.location_privacy_mode}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold font-serif-bn text-stone-900">{selectedSub.title}</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Contributor: {selectedSub.contributor?.name} ({selectedSub.contributor?.email}) • District: {selectedSub.district}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubId(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Private Verification Info + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <h3 className="font-bold text-stone-900">{isBn ? 'মূল প্রতিবেদন ও গোপনীয় অবস্থান' : 'Story & Private Location'}</h3>
                  {selectedSub.summary && <p className="font-semibold text-stone-800">{selectedSub.summary}</p>}
                  <p className="text-stone-700 whitespace-pre-line">{selectedSub.content}</p>
                  <div className="pt-2 border-t border-stone-200 text-[11px] text-rose-900">
                    <strong>Private Location Detail (Staff Only):</strong>{' '}
                    {selectedSub.private_location_detail || 'None provided'}
                  </div>
                </div>

                {(selectedSub.media || []).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-stone-700">Attached Media Evidence</h3>
                    {selectedSub.media.map((m) => (
                      <div key={m.id} className="space-y-1">
                        <ProtectedMediaPreview media={m} />
                        <p className="text-[11px] text-stone-500">
                          EXIF Stripped: {m.exif_stripped ? 'Yes' : 'No'} • Ownership Declared: {m.ownership_declared ? 'Yes' : 'No'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Verification & Review Form */}
                {canReview && (
                  <form onSubmit={handleSaveReview} className="border border-stone-200 rounded-xl p-4 space-y-3 text-xs">
                    <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>{isBn ? 'সম্পাদকীয় যাচাই চেকলিস্ট ও মতামত' : 'Verification Checklist & Review'}</span>
                    </h3>

                    <div className="space-y-1.5">
                      {VERIFICATION_CHECKLIST_ITEMS.map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(reviewForm.verification_checklist?.[item.key])}
                            onChange={() => toggleChecklist(item.key)}
                            className="rounded border-stone-300 text-emerald-700"
                          />
                          <span>{isBn ? item.labelBn : item.labelEn}</span>
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">Review Status</label>
                        <select
                          value={reviewForm.status}
                          onChange={(e) => setReviewForm((p) => ({ ...p, status: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="under_review">Under Review</option>
                          <option value="verification_in_progress">Verification In Progress</option>
                          <option value="changes_requested">Changes Requested</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Verification Result</label>
                        <select
                          value={reviewForm.verification_status}
                          onChange={(e) => setReviewForm((p) => ({ ...p, verification_status: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="verified">Verified</option>
                          <option value="disputed">Disputed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={reviewForm.verification_notes}
                      onChange={(e) => setReviewForm((p) => ({ ...p, verification_notes: e.target.value }))}
                      placeholder="Internal verification notes (strictly private to staff)"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    />
                    <textarea
                      rows={2}
                      value={reviewForm.editor_feedback}
                      onChange={(e) => setReviewForm((p) => ({ ...p, editor_feedback: e.target.value }))}
                      placeholder="Feedback visible to contributor in tracking view"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    />

                    <button
                      type="submit"
                      disabled={reviewing}
                      className="w-full py-2 rounded-lg bg-stone-900 text-white font-bold cursor-pointer"
                    >
                      {reviewing ? 'Saving...' : isBn ? 'যাচাই তথ্য সংরক্ষণ করুন' : 'Save Review & Verification'}
                    </button>
                  </form>
                )}

                {/* Reporter Assignment Form */}
                {canReview && (
                  <form onSubmit={handleAssignReporter} className="border border-stone-200 rounded-xl p-4 space-y-2.5 text-xs">
                    <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-purple-700" />
                      <span>{isBn ? 'স্টাফ প্রতিবেদক ও নিউজরুম অ্যাসাইনমেন্ট' : 'Assign Staff Reporter'}</span>
                    </h3>
                    <select
                      required
                      value={assignForm.reporter_user_id}
                      onChange={(e) => setAssignForm((p) => ({ ...p, reporter_user_id: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="">{isBn ? 'প্রতিবেদক নির্বাচন করুন' : 'Select staff reporter...'}</option>
                      {reporters.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.designation || r.email})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={assignForm.instructions}
                      onChange={(e) => setAssignForm((p) => ({ ...p, instructions: e.target.value }))}
                      placeholder="Field verification instructions..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignForm.create_newsroom_assignment}
                        onChange={(e) => setAssignForm((p) => ({ ...p, create_newsroom_assignment: e.target.checked }))}
                        className="rounded border-stone-300 text-purple-700"
                      />
                      <span>{isBn ? 'নিউজরুম অ্যাসাইনমেন্ট বোর্ডে যুক্ত করুন' : 'Create Phase 15 Newsroom Assignment'}</span>
                    </label>
                    <button
                      type="submit"
                      disabled={assigning}
                      className="w-full py-2 rounded-lg bg-purple-700 text-white font-bold cursor-pointer"
                    >
                      {assigning ? 'Assigning...' : isBn ? 'প্রতিবেদক বরাদ্দ করুন' : 'Assign Reporter'}
                    </button>
                  </form>
                )}

                {/* Final Editorial Approval & Publish */}
                {canPublish && !selectedSub.is_published && (
                  <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-4 space-y-2.5 text-xs">
                    <h3 className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>{isBn ? 'চূড়ান্ত সম্পাদকীয় অনুমোদন ও প্রকাশনা' : 'Editorial Approval & Publish'}</span>
                    </h3>
                    <input
                      type="text"
                      value={publishNote}
                      onChange={(e) => setPublishNote(e.target.value)}
                      placeholder="Public publication note (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createNewsDraft}
                        onChange={(e) => setCreateNewsDraft(e.target.checked)}
                        className="rounded border-emerald-300 text-emerald-700"
                      />
                      <span>{isBn ? 'মূল নিউজরুমে খসড়া (News Draft) তৈরি করুন' : 'Generate linked Newsroom Draft'}</span>
                    </label>
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={handlePublish}
                      className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      {publishing ? 'Publishing...' : isBn ? 'অনুমোদন ও প্রকাশ করুন' : 'Approve & Publish Submission'}
                    </button>
                  </div>
                )}

                {/* Remove / Takedown */}
                {(canPublish || canModerate) && (
                  <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        placeholder={isBn ? 'অপসারণের কারণ...' : 'Takedown reason...'}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-rose-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveSub}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অপসারণ' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Abuse Report Modal */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-sm text-stone-900">Resolve {resolvingReport.report_code}</h3>
              <button type="button" onClick={() => setResolvingReport(null)} className="cursor-pointer">
                <XCircle className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <p className="text-stone-700 bg-stone-50 p-3 rounded-lg">{resolvingReport.details}</p>
            <form onSubmit={handleResolveAbuse} className="space-y-3">
              <select
                value={resolveForm.status}
                onChange={(e) => setResolveForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
              >
                <option value="under_review">Under Review</option>
                <option value="resolved_action_taken">Resolved (Action Taken)</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={resolveForm.action_taken}
                onChange={(e) => setResolveForm((p) => ({ ...p, action_taken: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
              >
                <option value="none">No Enforcement Action</option>
                <option value="hide_content">Hide Content</option>
                <option value="remove_content">Remove Content</option>
                <option value="warn_contributor">Issue Contributor Warning</option>
                <option value="suspend_contributor">Suspend Contributor (14 Days)</option>
              </select>

              <textarea
                rows={3}
                value={resolveForm.resolution_notes}
                onChange={(e) => setResolveForm((p) => ({ ...p, resolution_notes: e.target.value }))}
                placeholder="Moderation resolution notes..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300"
              />

              <button type="submit" className="w-full py-2 rounded-xl bg-rose-700 text-white font-bold cursor-pointer">
                Confirm Moderation Decision
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCitizenModerationPage;


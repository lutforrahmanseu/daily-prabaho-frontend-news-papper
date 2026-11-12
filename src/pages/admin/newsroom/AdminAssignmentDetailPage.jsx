import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetAssignmentDetailQuery,
  useTransitionAssignmentStatusMutation,
  useStartAssignmentDraftMutation,
  useCreateEditorialCommunicationMutation,
  useResolveEditorialCommunicationMutation,
  useGetNewsSourcesQuery,
  useLinkNewsSourceMutation
} from '../../../store/api/newsroomApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import {
  ASSIGNMENT_PRIORITY_META,
  ASSIGNMENT_STATUS_META,
  formatDateTimeBn
} from '../../../utils/newsroomHelpers.js';
import {
  ArrowLeft,
  Clock,
  MapPin,
  FilePlus2,
  Send,
  MessageSquare,
  CheckCircle2,
  Database,
  Lock,
  Loader2,
  ExternalLink
} from 'lucide-react';

export function AdminAssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});

  const canManageAssignments = hasEffectivePermission(authState, adminState, 'assignment.manage');
  const canReviewNews = hasEffectivePermission(authState, adminState, 'news.review');
  const canLinkSources = hasEffectivePermission(authState, adminState, ['source.manage', 'assignment.manage']);

  const { data: assignment, isLoading, error } = useGetAssignmentDetailQuery(id);
  const { data: sourcesData } = useGetNewsSourcesQuery({ per_page: 50 }, { skip: !canLinkSources });

  const [transitionStatus, { isLoading: isTransitioning }] = useTransitionAssignmentStatusMutation();
  const [startDraft, { isLoading: isStartingDraft }] = useStartAssignmentDraftMutation();
  const [createComm, { isLoading: isSendingComm }] = useCreateEditorialCommunicationMutation();
  const [resolveComm] = useResolveEditorialCommunicationMutation();
  const [linkSource, { isLoading: isLinkingSource }] = useLinkNewsSourceMutation();

  const [submissionNotes, setSubmissionNotes] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageType, setMessageType] = useState(canManageAssignments ? 'editor_feedback' : 'reporter_response');
  const [visibility, setVisibility] = useState('newsroom');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [sourceRole, setSourceRole] = useState('primary');

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center text-stone-500">
        <Loader2 className="w-7 h-7 animate-spin text-rose-700" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-8 bg-white rounded-xl border border-rose-200 text-center space-y-3">
        <p className="text-sm font-bold text-rose-800">
          {extractApiError(error, 'অ্যাসাইনমেন্টটি পাওয়া যায়নি বা আপনার প্রবেশাধিকার নেই।')}
        </p>
        <Link to="/admin/newsroom/assignments" className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> অ্যাসাইনমেন্ট বোর্ডে ফিরে যান
        </Link>
      </div>
    );
  }

  const priorityMeta = ASSIGNMENT_PRIORITY_META[assignment.priority] || ASSIGNMENT_PRIORITY_META.normal;
  const statusMeta = ASSIGNMENT_STATUS_META[assignment.status] || ASSIGNMENT_STATUS_META.assigned;
  const communications = Array.isArray(assignment.communications) ? assignment.communications : [];
  const sourceLinks = Array.isArray(assignment.source_links) ? assignment.source_links : [];
  const availableSources = sourcesData?.items || [];

  const handleTransition = async (nextStatus) => {
    try {
      await transitionStatus({
        id: assignment.id,
        status: nextStatus,
        submission_notes: submissionNotes.trim() || undefined
      }).unwrap();
      setSubmissionNotes('');
      await sweetAlert.success('অবস্থা হালনাগাদ হয়েছে', `অ্যাসাইনমেন্ট "${ASSIGNMENT_STATUS_META[nextStatus]?.labelBn || nextStatus}" করা হয়েছে।`);
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'অবস্থা পরিবর্তন ব্যর্থ হয়েছে।'));
    }
  };

  const handleStartDraft = async () => {
    try {
      const news = await startDraft(assignment.id).unwrap();
      await sweetAlert.success('খসড়া সংবাদ তৈরি হয়েছে', `"${news.title}" ড্রাফট হিসেবে প্রস্তুত।`);
      navigate('/admin/news');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'খসড়া তৈরি করা যায়নি।'));
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!messageBody.trim()) return;
    try {
      await createComm({
        assignment_id: assignment.id,
        news_id: assignment.news_id || undefined,
        message_type: messageType,
        visibility,
        body: messageBody.trim()
      }).unwrap();
      setMessageBody('');
    } catch (err) {
      await sweetAlert.error('বার্তা পাঠানো যায়নি', extractApiError(err, 'যোগাযোগ বার্তা সংরক্ষণ ব্যর্থ হয়েছে।'));
    }
  };

  const handleAttachSource = async (e) => {
    e.preventDefault();
    if (!selectedSourceId) return;
    try {
      await linkSource({
        id: Number(selectedSourceId),
        assignment_id: assignment.id,
        news_id: assignment.news_id || undefined,
        role_in_story: sourceRole
      }).unwrap();
      setSelectedSourceId('');
      await sweetAlert.success('সংযুক্ত হয়েছে', 'সংবাদ উৎসটি এই অ্যাসাইনমেন্টে যুক্ত করা হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'উৎস সংযুক্ত করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/newsroom/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>অ্যাসাইনমেন্ট বোর্ডে ফিরে যান</span>
        </Link>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Brief & Editorial Communications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${priorityMeta.badgeClass}`}>
                {priorityMeta.labelBn}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                {statusMeta.labelBn}
              </span>
              {assignment.beat && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  বিট: {assignment.beat}
                </span>
              )}
              {assignment.is_overdue && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-700 text-white">
                  সময়োত্তীর্ণ
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif-bn text-stone-900">
              {assignment.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-200/70">
              <p><strong>প্রতিবেদক:</strong> {assignment.reporter_user?.name || 'অনির্ধারিত'}</p>
              <p><strong>আলোকচিত্রী:</strong> {assignment.photographer?.name || 'নেই'}</p>
              <p className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <strong>শেষ সময়:</strong> {formatDateTimeBn(assignment.deadline_at)}
              </p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <strong>স্থান:</strong> {assignment.location || 'অনির্ধারিত'}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">সম্পাদকীয় নির্দেশনা</h2>
              <p className="text-sm text-stone-800 whitespace-pre-line font-serif-bn leading-relaxed bg-stone-50/60 p-4 rounded-xl border border-stone-100">
                {assignment.instructions || 'কোনো অতিরিক্ত নির্দেশনা নেই।'}
              </p>
            </div>

            {assignment.submission_notes && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                <strong className="block mb-0.5">জমার নোট:</strong>
                <p>{assignment.submission_notes}</p>
              </div>
            )}
          </div>

          {/* Editorial Communication Thread */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-700" />
                <h2 className="text-sm font-bold text-stone-900">অভ্যন্তরীণ নোট, সম্পাদকীয় ফিডব্যাক ও প্রতিক্রিয়া</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {communications.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">এখনো কোনো আলোচনা বা নোট যুক্ত হয়নি।</p>
              ) : (
                <div className="space-y-3">
                  {communications.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        msg.visibility === 'editors_only'
                          ? 'bg-amber-50/70 border-amber-200'
                          : msg.message_type === 'editor_feedback'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{msg.author?.name || 'নিউজরুম'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-semibold">
                            {msg.message_type === 'editor_feedback'
                              ? 'সম্পাদকের ফিডব্যাক'
                              : msg.message_type === 'reporter_response'
                                ? 'প্রতিবেদকের উত্তর'
                                : 'অভ্যন্তরীণ নোট'}
                          </span>
                          {msg.visibility === 'editors_only' && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 font-bold">
                              <Lock className="w-2.5 h-2.5" /> শুধু সম্পাদকদের জন্য
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400">{formatDateTimeBn(msg.created_at)}</span>
                      </div>

                      <p className="text-stone-800 whitespace-pre-line leading-relaxed">{msg.body}</p>

                      {(canManageAssignments || canReviewNews) && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => resolveComm({ id: msg.id, is_resolved: !msg.is_resolved })}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer ${
                              msg.is_resolved ? 'text-emerald-700' : 'text-stone-500 hover:text-stone-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{msg.is_resolved ? 'সমাধানকৃত' : 'সমাধান চিহ্নিত করুন'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New Note Form */}
              <form onSubmit={handlePostMessage} className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="reporter_response">প্রতিবেদকের প্রতিক্রিয়া</option>
                    <option value="internal_note">অভ্যন্তরীণ নোট</option>
                    {(canManageAssignments || canReviewNews) && (
                      <option value="editor_feedback">সম্পাদকের ফিডব্যাক</option>
                    )}
                  </select>

                  {(canManageAssignments || canReviewNews) && (
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      <option value="newsroom">পুরো অ্যাসাইনমেন্ট টিম</option>
                      <option value="editors_only">শুধু সম্পাদকগণ (Editors Only)</option>
                    </select>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="নোট, তথ্য সংশোধন নির্দেশ বা আপডেট লিখুন..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingComm || !messageBody.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>বার্তা পাঠান</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Actions, Draft Link & Sources */}
        <div className="space-y-6">
          {/* Workflow Actions Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900">অবস্থা ও কপি জমা (Submission)</h2>

            {assignment.news ? (
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700">সংযুক্ত সংবাদ প্রতিবেদন</span>
                <p className="font-bold text-stone-900">{assignment.news.title}</p>
                <p className="text-[11px] text-stone-500">অবস্থা: {assignment.news.status}</p>
                <Link to="/admin/news" className="inline-flex items-center gap-1 text-rose-700 font-bold hover:underline">
                  <span>সংবাদ সিএমএস-এ খুলুন</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartDraft}
                disabled={isStartingDraft}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                {isStartingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
                <span>অ্যাসাইনমেন্ট থেকে খসড়া শুরু করুন</span>
              </button>
            )}

            <div className="space-y-2 pt-2 border-t border-stone-100">
              <textarea
                rows={2}
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="জমা বা পরিবর্তনের সংক্ষিপ্ত নোট..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => handleTransition('accepted')}
                  className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold cursor-pointer"
                >
                  গ্রহণ করুন
                </button>
                <button
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => handleTransition('in_progress')}
                  className="px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold cursor-pointer"
                >
                  কাজ চলমান
                </button>
                <button
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => handleTransition('submitted')}
                  className="col-span-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold cursor-pointer"
                >
                  জমা দিন (Submit Copy)
                </button>

                {canManageAssignments && (
                  <>
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('revision_requested')}
                      className="px-3 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-bold cursor-pointer"
                    >
                      সংশোধন চান
                    </button>
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('completed')}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      সম্পন্ন করুন
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Linked Sources Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-700" />
              <span>সংযুক্ত সংবাদ উৎস (Sources)</span>
            </h2>

            {sourceLinks.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো উৎস সংযুক্ত নেই (অথবা আপনার অ্যাক্সেসের বাইরে)।</p>
            ) : (
              <div className="space-y-2">
                {sourceLinks.map((lnk) => (
                  <div key={lnk.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                    <p className="font-bold text-stone-900">{lnk.source?.name}</p>
                    <p className="text-[11px] text-stone-500">
                      {lnk.source?.organization || lnk.source?.source_type} • ভূমিকা: {lnk.role_in_story}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {canLinkSources && availableSources.length > 0 && (
              <form onSubmit={handleAttachSource} className="pt-3 border-t border-stone-100 space-y-2">
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                >
                  <option value="">-- উৎস যুক্ত করুন --</option>
                  {availableSources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name} {src.is_confidential ? '(গোপনীয়)' : ''}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={sourceRole}
                    onChange={(e) => setSourceRole(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                  >
                    <option value="primary">প্রাথমিক উৎস</option>
                    <option value="corroborating">সহায়ক / যাচাই</option>
                    <option value="background">পটভূমি</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isLinkingSource || !selectedSourceId}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    যুক্ত করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssignmentDetailPage;


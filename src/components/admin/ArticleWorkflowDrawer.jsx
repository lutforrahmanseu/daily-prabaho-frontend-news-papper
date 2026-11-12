import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  X,
  Clock,
  History,
  MessageSquare,
  FileCode,
  CheckCircle2,
  RotateCcw,
  Ban,
  Calendar,
  Send,
  User,
  Shield,
  ChevronRight,
  Sparkles,
  Loader2,
  Lock,
  FileWarning
} from 'lucide-react';
import {
  WORKFLOW_STATUS_CONFIG,
  validateWorkflowPermission
} from '../../services/editorialWorkflowBackend.js';
import {
  useGetWorkflowHistoryQuery,
  useGetNewsRevisionsQuery
} from '../../store/api/workflowApi.js';
import { getRoleDisplayMeta } from '../../utils/permissions.js';
import { toBengaliNumber, formatBengaliFullDateTime, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import { MotionDrawerOverlay, SPRING_SNAPPY } from '../common/MotionPrimitives.jsx';

export function ArticleWorkflowDrawer({
  isOpen,
  onClose,
  article,
  currentRole,
  onTriggerAction // callback: (actionType: 'approve' | 'return' | 'reject' | 'schedule' | 'publish' | 'submit' | 'start_review')
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'feedback' | 'revisions' | 'meta'

  const { data: apiWorkflowHistory = [], isFetching: isLoadingHistory } = useGetWorkflowHistoryQuery(
    article?.id,
    { skip: !isOpen || !article?.id }
  );
  const { data: apiRevisions = [], isFetching: isLoadingRevisions } = useGetNewsRevisionsQuery(
    article?.id,
    { skip: !isOpen || !article?.id }
  );

  const statusHistory = useMemo(
    () => (apiWorkflowHistory.length > 0 ? apiWorkflowHistory : article?.workflows || article?.statusHistory || []),
    [apiWorkflowHistory, article]
  );

  const editorialFeedback = useMemo(() => {
    if (Array.isArray(article?.editorialFeedback) && article.editorialFeedback.length > 0) {
      return article.editorialFeedback;
    }
    return statusHistory
      .filter((step) => step?.comments && step.comments.trim())
      .map((step) => ({
        id: step.id,
        type:
          step.toStatus === 'returned'
            ? 'revision_request'
            : step.toStatus === 'rejected'
              ? 'rejection_notice'
              : 'note',
        author: step.actorName || step.actionBy || 'সম্পাদকীয় ডেস্ক',
        role: step.actorDesignation || step.role || '',
        timestamp: step.timestamp,
        message: step.comments
      }));
  }, [statusHistory, article]);

  const revisions = useMemo(
    () => (apiRevisions.length > 0 ? apiRevisions : article?.revisions || []),
    [apiRevisions, article]
  );

  const isDrawerOpen = Boolean(isOpen && article);
  const currentStatus = article?.status || 'draft';
  const statusConfig = WORKFLOW_STATUS_CONFIG[currentStatus] || WORKFLOW_STATUS_CONFIG.draft;
  const isSuperAdmin = currentRole === 'super_admin';
  const roleLabel = getRoleDisplayMeta(currentRole).nameBn;

  // Permissions check for action buttons
  const canSubmit = isSuperAdmin ? currentStatus !== 'submitted' : validateWorkflowPermission(currentRole, currentStatus, 'submitted').allowed;
  const canStartReview = isSuperAdmin ? currentStatus !== 'under_review' : validateWorkflowPermission(currentRole, currentStatus, 'under_review').allowed;
  const canApprove = isSuperAdmin ? currentStatus !== 'approved' : validateWorkflowPermission(currentRole, currentStatus, 'approved').allowed;
  const canReturn = isSuperAdmin ? currentStatus !== 'returned' : validateWorkflowPermission(currentRole, currentStatus, 'returned').allowed;
  const canReject = isSuperAdmin ? currentStatus !== 'rejected' : validateWorkflowPermission(currentRole, currentStatus, 'rejected').allowed;
  const canSchedule = isSuperAdmin ? currentStatus !== 'scheduled' : validateWorkflowPermission(currentRole, currentStatus, 'scheduled').allowed;
  const canPublish = isSuperAdmin ? currentStatus !== 'published' : validateWorkflowPermission(currentRole, currentStatus, 'published').allowed;

  const latestStep = statusHistory[statusHistory.length - 1];
  const reviewerInfo = article?.reviewerInfo || (latestStep || article?.editor
    ? {
        reviewedBy: article?.editor || latestStep?.actorName || 'সম্পাদক',
        reviewerRole: latestStep?.actorDesignation || 'সম্পাদকীয় বোর্ড',
        lastAction: (WORKFLOW_STATUS_CONFIG[latestStep?.toStatus] || statusConfig).labelBn,
        reviewedAt: latestStep?.timestamp || article?.updatedAt
      }
    : null);

  const drawerTabs = [
    { id: 'history', Icon: History, label: `স্থিতি ইতিহাস (${toBengaliNumber(statusHistory.length)})` },
    { id: 'feedback', Icon: MessageSquare, label: `মন্তব্য ও ফিডব্যাক (${toBengaliNumber(editorialFeedback.length)})` },
    { id: 'revisions', Icon: FileCode, label: `রিভিশন (${toBengaliNumber(revisions.length)})` },
    { id: 'meta', Icon: Shield, label: 'পর্যালোচক তথ্য' }
  ];

  return (
    <MotionDrawerOverlay
      isOpen={isDrawerOpen}
      onBackdropClick={onClose}
      side="right"
      backdropClassName="bg-stone-950/60 backdrop-blur-xs"
      panelClassName="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col font-sans border-l border-stone-200"
    >
      {article && (
        <>
        
        {/* 1. Drawer Header */}
        <div className="p-5 border-b border-stone-200 flex items-start justify-between bg-stone-50 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                {statusConfig.labelBn}
              </span>
              {(article.isEmbargoed || article.is_embargoed) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-800 text-white">
                  <Lock className="w-3 h-3" />
                  <span>এমবার্গো</span>
                </span>
              )}
              <span className="text-[10px] text-stone-400 font-mono">
                ID: {article.id}
              </span>
              <Link
                to="/admin/newsroom/corrections"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              >
                <FileWarning className="w-3 h-3" />
                <span>সংশোধনী</span>
              </Link>
            </div>
            <h2 className="text-base font-bold font-serif-bn text-stone-900 line-clamp-1">
              {article.title}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              প্রতিবেদক: <strong className="text-stone-700">{article.author || 'স্টাফ রিপোর্টার'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Drawer Tabs */}
        <div className="flex items-center gap-1 px-4 border-b border-stone-200 bg-white shrink-0 text-xs font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
          {drawerTabs.map((tab) => {
            const TabIcon = tab.Icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-3 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isTabActive
                    ? 'text-rose-700'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {isTabActive && (
                  <motion.span
                    layoutId="workflow-drawer-tab"
                    transition={SPRING_SNAPPY}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Tab Content Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: Status History Timeline */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  ওয়ার্কফ্লো ট্রানজিশন টাইমলাইন
                </h3>
                {isLoadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />}
              </div>

              {statusHistory.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs italic bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  এখনো কোনো স্ট্যাটাস পরিবর্তন রেকর্ড করা হয়নি
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {statusHistory.map((step, idx) => {
                    const toConf = WORKFLOW_STATUS_CONFIG[step.toStatus] || {};
                    const fromConf = WORKFLOW_STATUS_CONFIG[step.fromStatus] || {};

                    return (
                      <div key={step.id || idx} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-rose-700 ring-4 ring-white shadow-xs" />
                        
                        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-stone-800 flex items-center gap-1 font-serif-bn">
                              <span>{fromConf.labelBn || step.fromStatus || 'নতুন'}</span>
                              <ChevronRight className="w-3 h-3 text-stone-400" />
                              <span className="text-rose-700 font-extrabold">{toConf.labelBn || step.toStatus}</span>
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {formatBengaliRelativeTime(step.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                            <User className="w-3 h-3 text-stone-400" />
                            <span>
                              কর্তা: <strong className="text-stone-800">{step.actorName || step.actionBy}</strong>
                              {(step.actorDesignation || step.role) ? ` (${step.actorDesignation || step.role})` : ''}
                            </span>
                          </div>

                          {step.comments && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 font-serif-bn">
                              {step.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Comments & Feedback Thread */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  সম্পাদকীয় ফিডব্যাক ও সংশোধনীর নোট
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  প্রতিবেদক ও সম্পাদকের অভ্যন্তরীণ আলোচনা
                </span>
              </div>

              {editorialFeedback.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs italic bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  কোনো সম্পাদকীয় ফিডব্যাক পাওয়া যায়নি
                </div>
              ) : (
                <div className="space-y-3">
                  {editorialFeedback.map((fb, idx) => (
                    <div
                      key={fb.id || idx}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                        fb.type === 'revision_request'
                          ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                          : fb.type === 'rejection_notice'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          <span>{fb.author}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-stone-200">
                            {fb.role}
                          </span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {formatBengaliRelativeTime(fb.timestamp)}
                        </span>
                      </div>

                      <p className="font-serif-bn leading-relaxed text-sm pt-1">
                        {fb.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Revision History */}
          {activeTab === 'revisions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  সংবাদ সংস্করণের ইতিহাস (Revision History)
                </h3>
                {isLoadingRevisions && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />}
              </div>

              {revisions.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs italic bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  এখনো কোনো পূর্ববর্তী সংস্করণ সংরক্ষিত হয়নি
                </div>
              ) : (
                <div className="space-y-3">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id || rev.revisionNumber || rev.version}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            সংস্করণ v{toBengaliNumber(rev.revisionNumber || rev.version || 1)}
                          </span>
                          {rev.isAiAssisted && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                              AI সহায়তা
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {formatBengaliRelativeTime(rev.timestamp)}
                        </span>
                      </div>

                      <p className="font-serif-bn font-bold text-stone-900 text-sm">
                        {rev.title || rev.headline}
                      </p>

                      <p className="text-[11px] text-stone-600">
                        সংশোধনকারী: <strong>{rev.userName || rev.updatedBy}</strong>
                      </p>

                      {(rev.changeSummary || rev.notes) && (
                        <p className="text-[11px] bg-white p-2 rounded border border-stone-200 text-stone-500 italic">
                          নোট: {rev.changeSummary || rev.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Reviewer & Approval Timestamps */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  সর্বশেষ পর্যালোচক তথ্য
                </h4>
                {reviewerInfo ? (
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between">
                      <span className="text-stone-500">পর্যালোচকের নাম:</span>
                      <strong className="text-stone-900">{reviewerInfo.reviewedBy}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-stone-500">পদবী / ভূমিকা:</span>
                      <span className="font-mono">{reviewerInfo.reviewerRole}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-stone-500">সর্বশেষ পদক্ষেপ:</span>
                      <span className="font-bold text-rose-700">{reviewerInfo.lastAction}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-stone-500">পর্যালোচনার সময়:</span>
                      <span className="font-mono text-stone-600">
                        {formatBengaliFullDateTime(reviewerInfo.reviewedAt)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">কোনো পর্যালোচক তথ্য সংযুক্ত নেই</p>
                )}
              </div>

              {/* Milestone Timestamps */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                  মাইলস্টোন ও সময়রেখা
                </h4>
                <div className="space-y-1.5 divide-y divide-stone-200/60 font-mono">
                  <p className="flex justify-between pt-1">
                    <span className="text-stone-500">খসড়া তৈরি:</span>
                    <span className="text-stone-800">{formatBengaliRelativeTime(article.publishedAt)}</span>
                  </p>
                  {article.submittedAt && (
                    <p className="flex justify-between pt-1">
                      <span className="text-stone-500">জমা দেওয়ার সময়:</span>
                      <span className="text-stone-800">{formatBengaliFullDateTime(article.submittedAt)}</span>
                    </p>
                  )}
                  {article.approvedAt && (
                    <p className="flex justify-between pt-1">
                      <span className="text-stone-500">অনুমোদনের সময়:</span>
                      <span className="text-emerald-700 font-bold">{formatBengaliFullDateTime(article.approvedAt)}</span>
                    </p>
                  )}
                  {article.scheduledAt && (
                    <p className="flex justify-between pt-1">
                      <span className="text-stone-500">শিডিউল সময়:</span>
                      <span className="text-indigo-700 font-bold">{formatBengaliFullDateTime(article.scheduledAt)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 4. Drawer Action Bar based on Role & Status */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>আপনার সক্রিয় ভূমিকা: <strong className="text-stone-800">{roleLabel}</strong></span>
            <span>বর্তমান স্থিতি: <strong className="text-rose-700">{statusConfig.labelBn}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Reporter Action: Submit for Review */}
            {canSubmit && (
              <button
                type="button"
                onClick={() => onTriggerAction('submit')}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পর্যালোচনায় জমা দিন (Submit for Review)</span>
              </button>
            )}

            {/* Editor Action: Start Review */}
            {canStartReview && (currentStatus === 'submitted' || (isSuperAdmin && currentStatus === 'draft')) && (
              <button
                type="button"
                onClick={() => onTriggerAction('start_review')}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>পর্যালোচনা শুরু করুন (Start Review)</span>
              </button>
            )}

            {/* Editor & Chief: Return for Revision */}
            {canReturn && (
              <button
                type="button"
                onClick={() => onTriggerAction('return')}
                className="py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সংশোধনে ফেরত (Return)</span>
              </button>
            )}

            {/* Editor & Chief: Reject */}
            {canReject && (
              <button
                type="button"
                onClick={() => onTriggerAction('reject')}
                className="py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>বাতিল (Reject)</span>
              </button>
            )}

            {/* Editor & Chief: Approve */}
            {canApprove && (
              <button
                type="button"
                onClick={() => onTriggerAction('approve')}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>অনুমোদন (Approve)</span>
              </button>
            )}

            {/* Editor-in-Chief: Schedule */}
            {canSchedule && (
              <button
                type="button"
                onClick={() => onTriggerAction('schedule')}
                className="py-2 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>শিডিউল (Schedule)</span>
              </button>
            )}

            {/* Editor-in-Chief: Publish Live */}
            {canPublish && (
              <button
                type="button"
                onClick={() => onTriggerAction('publish')}
                className="py-2 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>সরাসরি প্রকাশ (Publish Live)</span>
              </button>
            )}

          </div>
        </div>
        </>
      )}
    </MotionDrawerOverlay>
  );
}

export default ArticleWorkflowDrawer;


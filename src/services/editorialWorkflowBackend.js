/**
 * Editorial Workflow & Permission Enforcement Engine (Backend Service)
 * Daily Prabaho (দৈনিক বার্তা প্রবাহ)
 *
 * Implements strict role-based state machine transitions:
 * - Reporter: Create, Draft, Submit for Review, View Feedback
 * - Editor: View Pending, Review, Edit, Return for Revision, Reject, Approve
 * - Editor-in-Chief: Final Review, Approve, Schedule, Publish, Archive
 */

export const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  RETURNED: 'returned',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const WORKFLOW_STATUS_CONFIG = {
  draft: {
    labelBn: 'খসড়া',
    labelEn: 'Draft',
    color: 'bg-stone-100 text-stone-700 border-stone-200',
    description: 'প্রতিবেদক কর্তৃক প্রাথমিক খসড়া তৈরি'
  },
  submitted: {
    labelBn: 'জমা দেওয়া হয়েছে',
    labelEn: 'Submitted',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'সম্পাদকের পর্যালোচনার জন্য জমা দেওয়া হয়েছে'
  },
  under_review: {
    labelBn: 'পর্যালোচনাধীন',
    labelEn: 'Under Review',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'বার্তা সম্পাদক দ্বারা তথ্য ও ভাষা পরীক্ষা চলছে'
  },
  returned: {
    labelBn: 'সংশোধনের জন্য ফেরত',
    labelEn: 'Returned for Revision',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'সম্পাদকের মন্তব্য ও সংশোধনী নির্দেশনাসহ ফেরত'
  },
  rejected: {
    labelBn: 'প্রত্যাখ্যাত',
    labelEn: 'Rejected',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'সম্পাদকীয় নীতিমালা পরিপন্থী হওয়ায় বাতিল'
  },
  approved: {
    labelBn: 'অনুমোদিত',
    labelEn: 'Approved',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'বার্তা সম্পাদক কর্তৃক অনুমোদিত, চূড়ান্ত সিদ্ধান্তের অপেক্ষায়'
  },
  scheduled: {
    labelBn: 'সময় নির্ধারিত (Scheduled)',
    labelEn: 'Scheduled',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'ভবিষ্যৎ নির্দিষ্ট সময়ে স্বয়ংক্রিয় প্রকাশের অপেক্ষায়'
  },
  published: {
    labelBn: 'লাইভ প্রকাশিত',
    labelEn: 'Published',
    color: 'bg-emerald-700 text-white border-emerald-800',
    description: 'পাবলিক পোর্টালে লাইভ প্রদর্শিত হচ্ছে'
  },
  archived: {
    labelBn: 'আর্কাইভকৃত',
    labelEn: 'Archived',
    color: 'bg-stone-800 text-stone-200 border-stone-900',
    description: 'লাইভ রোটেশন থেকে সরিয়ে আর্কাইভে সংরক্ষিত'
  }
};

/**
 * Backend Role Permission Rules Matrix
 */
const ROLE_ALLOWED_TRANSITIONS = {
  reporter: {
    allowedTransitions: {
      draft: ['submitted'],
      returned: ['submitted', 'draft']
    },
    canEditOwn: ['draft', 'returned'],
    canPublish: false,
    canApprove: false,
    canSchedule: false,
    canReturn: false,
    canReject: false
  },
  editor: {
    allowedTransitions: {
      draft: ['submitted', 'under_review'],
      submitted: ['under_review', 'returned', 'rejected', 'approved'],
      under_review: ['returned', 'rejected', 'approved', 'submitted'],
      returned: ['under_review', 'rejected', 'draft'],
      approved: ['under_review', 'returned', 'rejected']
    },
    canEditOwn: true,
    canEditAny: true,
    canPublish: false, // Editors approve to queue for Editor-in-Chief
    canApprove: true,
    canSchedule: false,
    canReturn: true,
    canReject: true
  },
  news_editor: {
    allowedTransitions: {
      draft: ['submitted', 'under_review'],
      submitted: ['under_review', 'returned', 'rejected', 'approved'],
      under_review: ['returned', 'rejected', 'approved', 'submitted'],
      returned: ['under_review', 'rejected', 'draft'],
      approved: ['under_review', 'returned', 'rejected']
    },
    canEditOwn: true,
    canEditAny: true,
    canPublish: false,
    canApprove: true,
    canSchedule: false,
    canReturn: true,
    canReject: true
  },
  editor_in_chief: {
    allowedTransitions: {
      draft: ['submitted', 'under_review', 'published', 'scheduled'],
      submitted: ['under_review', 'approved', 'published', 'scheduled', 'returned', 'rejected'],
      under_review: ['approved', 'published', 'scheduled', 'returned', 'rejected'],
      returned: ['under_review', 'approved', 'rejected'],
      rejected: ['under_review', 'draft'],
      approved: ['published', 'scheduled', 'under_review', 'returned', 'rejected'],
      scheduled: ['published', 'draft', 'archived'],
      published: ['archived', 'draft', 'under_review'],
      archived: ['draft', 'published']
    },
    canEditOwn: true,
    canEditAny: true,
    canPublish: true,
    canApprove: true,
    canSchedule: true,
    canReturn: true,
    canReject: true
  },
  super_admin: {
    // Root administrator inherits all transitions
    allowedTransitions: '*',
    canEditOwn: true,
    canEditAny: true,
    canPublish: true,
    canApprove: true,
    canSchedule: true,
    canReturn: true,
    canReject: true
  }
};

/**
 * Validate whether a role is authorized to transition an article
 * @param {string} role - 'reporter' | 'editor' | 'editor_in_chief' | 'super_admin'
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function validateWorkflowPermission(role, fromStatus, toStatus) {
  let normalizedRole = role || 'reporter';
  if (normalizedRole === 'news_editor') normalizedRole = 'editor';
  if (normalizedRole === 'journalist') normalizedRole = 'reporter';
  const roleConfig = ROLE_ALLOWED_TRANSITIONS[normalizedRole];

  if (!roleConfig) {
    return {
      allowed: false,
      reason: `অননুমোদিত ভূমিকা: '${normalizedRole}' সিস্টেম দ্বারা স্বীকৃত নয়`
    };
  }

  // Super Admin bypass
  if (roleConfig.allowedTransitions === '*') {
    return { allowed: true };
  }

  // Check fromStatus
  const allowedNextStatuses = roleConfig.allowedTransitions[fromStatus];
  if (!allowedNextStatuses || !allowedNextStatuses.includes(toStatus)) {
    const roleBn = normalizedRole === 'reporter'
      ? 'প্রতিবেদক (Reporter)'
      : normalizedRole === 'editor'
      ? 'বার্তা সম্পাদক (News Editor)'
      : 'প্রধান সম্পাদক (Editor-in-Chief)';

    return {
      allowed: false,
      reason: `${roleBn} হিসেবে '${fromStatus}' থেকে '${toStatus}' এ পরিবর্তন করার অনুমতি নেই।`
    };
  }

  return { allowed: true };
}

/**
 * Executes a backend workflow transition, generating history, feedback, timestamps and audit log.
 * @param {Object} params
 * @param {Object} params.article - Current article state
 * @param {string} params.toStatus - Target status
 * @param {Object} params.user - Current user { id, name, role, email }
 * @param {string} [params.comments] - Required for 'returned' and 'rejected'
 * @param {string} [params.scheduledAt] - Required for 'scheduled'
 * @param {Object} [params.articleUpdates] - Optional content edits made during review
 * @returns {{ success: boolean, updatedArticle?: Object, auditLog?: Object, error?: string }}
 */
export function executeWorkflowTransition({
  article,
  toStatus,
  user,
  comments = '',
  scheduledAt = null,
  articleUpdates = {}
}) {
  if (!article) {
    return { success: false, error: 'সংবাদ পাওয়া যায়নি (Article not found)' };
  }

  const fromStatus = article.status || WORKFLOW_STATUSES.DRAFT;
  const role = user?.role || 'reporter';
  const userName = user?.name || 'অজ্ঞাত ব্যবহারকারী';

  // 1. Backend Permission Check
  const authCheck = validateWorkflowPermission(role, fromStatus, toStatus);
  if (!authCheck.allowed) {
    return {
      success: false,
      error: authCheck.reason || 'অননুমোদিত অ্যাক্সেস (Permission Denied)'
    };
  }

  // 2. Business Validation Checks
  if ((toStatus === WORKFLOW_STATUSES.RETURNED || toStatus === WORKFLOW_STATUSES.REJECTED) && !comments.trim()) {
    return {
      success: false,
      error: `সংবাদটি '${WORKFLOW_STATUS_CONFIG[toStatus]?.labelBn}' করতে কারণ বা মন্তব্য উল্লেখ করা আবশ্যক।`
    };
  }

  if (toStatus === WORKFLOW_STATUSES.SCHEDULED && !scheduledAt) {
    return {
      success: false,
      error: 'শিডিউল করার জন্য ভবিষ্যৎ প্রকাশনার তারিখ ও সময় উল্লেখ করা আবশ্যক।'
    };
  }

  const nowIso = new Date().toISOString();

  // 3. Construct Status History Item
  const historyEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    fromStatus,
    toStatus,
    actionBy: userName,
    role,
    timestamp: nowIso,
    comments: comments.trim() || undefined
  };

  const statusHistory = Array.isArray(article.statusHistory)
    ? [historyEntry, ...article.statusHistory]
    : [historyEntry];

  // 4. Construct Feedback Item if comments provided
  let editorialFeedback = Array.isArray(article.editorialFeedback)
    ? [...article.editorialFeedback]
    : [];

  if (comments.trim()) {
    editorialFeedback.unshift({
      id: `fb-${Date.now()}`,
      author: userName,
      role,
      message: comments.trim(),
      timestamp: nowIso,
      type: toStatus === WORKFLOW_STATUSES.RETURNED
        ? 'revision_request'
        : toStatus === WORKFLOW_STATUSES.REJECTED
        ? 'rejection_notice'
        : 'general_note'
    });
  }

  // 5. Construct Revision Snapshot if content updated
  let revisions = Array.isArray(article.revisions)
    ? [...article.revisions]
    : [];

  if (articleUpdates && (articleUpdates.title || articleUpdates.content)) {
    const versionNumber = revisions.length + 1;
    revisions.unshift({
      id: `rev-v${versionNumber}`,
      version: versionNumber,
      updatedBy: userName,
      role,
      timestamp: nowIso,
      notes: comments.trim() || 'সম্পাদকীয় সংশোধন',
      headline: articleUpdates.title || article.title,
      excerpt: articleUpdates.excerpt || article.excerpt
    });
  }

  // 6. Update Reviewer Info & Timestamps
  const reviewerInfo = {
    reviewedBy: userName,
    reviewerRole: role,
    reviewedAt: nowIso,
    lastAction: WORKFLOW_STATUS_CONFIG[toStatus]?.labelBn || toStatus
  };

  const updatedArticle = {
    ...article,
    ...articleUpdates,
    status: toStatus,
    statusHistory,
    editorialFeedback,
    revisions,
    reviewerInfo,
    updatedAt: nowIso
  };

  // Specific milestone timestamps
  if (toStatus === WORKFLOW_STATUSES.SUBMITTED && !article.submittedAt) {
    updatedArticle.submittedAt = nowIso;
  }
  if (toStatus === WORKFLOW_STATUSES.APPROVED) {
    updatedArticle.approvedAt = nowIso;
  }
  if (toStatus === WORKFLOW_STATUSES.PUBLISHED) {
    updatedArticle.publishedAt = nowIso;
  }
  if (toStatus === WORKFLOW_STATUSES.SCHEDULED) {
    updatedArticle.scheduledAt = scheduledAt;
  }

  // 7. Audit Log Entry
  const auditLog = {
    user: userName,
    role,
    action: `ওয়ার্কফ্লো পরিবর্তন: ${WORKFLOW_STATUS_CONFIG[fromStatus]?.labelBn || fromStatus} ➔ ${WORKFLOW_STATUS_CONFIG[toStatus]?.labelBn || toStatus}`,
    target: article.title,
    details: {
      articleId: article.id,
      fromStatus,
      toStatus,
      comments: comments.trim() || null
    }
  };

  return {
    success: true,
    updatedArticle,
    auditLog
  };
}


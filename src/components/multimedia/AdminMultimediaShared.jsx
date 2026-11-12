import React from 'react';
import { CheckCircle2, Send, Trash2, Archive, ExternalLink } from 'lucide-react';
import { getMultimediaStatusMeta } from '../../utils/multimediaHelpers.js';

export function MultimediaStatusBadge({ status = 'draft' }) {
  const meta = getMultimediaStatusMeta(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

export function WorkflowActionButtons({
  status,
  canCreate = false,
  canPublish = false,
  canDelete = false,
  publicUrl = null,
  onTransition,
  onDelete
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {publicUrl && status === 'published' && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold"
        >
          <ExternalLink className="w-3 h-3" />
          <span>দেখুন</span>
        </a>
      )}

      {canCreate && status === 'draft' && (
        <button
          type="button"
          onClick={() => onTransition?.('submit')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold cursor-pointer"
        >
          <Send className="w-3 h-3" />
          <span>জমা দিন</span>
        </button>
      )}

      {canPublish && status !== 'published' && (
        <button
          type="button"
          onClick={() => onTransition?.('publish')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>প্রকাশ করুন</span>
        </button>
      )}

      {canPublish && status === 'published' && (
        <button
          type="button"
          onClick={() => onTransition?.('archive')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold cursor-pointer"
        >
          <Archive className="w-3 h-3" />
          <span>সংরক্ষণ</span>
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="অপসারণ করুন"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}


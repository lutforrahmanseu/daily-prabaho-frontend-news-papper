import React from 'react';
import { useSelector } from 'react-redux';
import { REACTION_META } from '../../utils/readerHelpers.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  useGetArticleReactionsQuery,
  useToggleArticleReactionMutation
} from '../../store/api/readerApi.js';
import { Sparkles } from 'lucide-react';

export function ArticleReactionsBar({ slug, className = '' }) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data } = useGetArticleReactionsQuery(slug, { skip: !slug });
  const [toggleReaction, { isLoading }] = useToggleArticleReactionMutation();

  const counts = data?.counts || {};
  const total = Number(data?.total || 0);
  const userReactions = Array.isArray(data?.user_reactions) ? data.user_reactions : [];

  const handleReact = async (reactionType) => {
    if (!slug || isLoading) return;
    try {
      await toggleReaction({ slug, reaction_type: reactionType }).unwrap();
    } catch {
      // Rate limit or network failure gracefully ignored
    }
  };

  return (
    <div
      className={`bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-stone-900 font-serif-bn">
          <Sparkles className="w-4 h-4 text-rose-700" />
          <span>{isBn ? 'এই প্রতিবেদন সম্পর্কে আপনার অনুভূতি জানান' : 'How does this story make you feel?'}</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-0.5">
          {isBn
            ? `মোট ${toBengaliNumber(total)} জন পাঠক প্রতিক্রিয়া জানিয়েছেন`
            : `${total} reader reactions recorded`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {REACTION_META.map((item) => {
          const active = userReactions.includes(item.type);
          const count = Number(counts[item.type] || 0);

          return (
            <button
              key={item.type}
              type="button"
              disabled={isLoading}
              onClick={() => handleReact(item.type)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                active
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs scale-[1.03]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-rose-400 hover:bg-rose-50/60'
              }`}
              aria-pressed={active}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{isBn ? item.labelBn : item.labelEn}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {isBn ? toBengaliNumber(count) : count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ArticleReactionsBar;


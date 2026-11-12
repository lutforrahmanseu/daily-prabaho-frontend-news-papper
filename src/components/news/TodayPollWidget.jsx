import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { votePoll as voteFallbackPoll } from '../../store/newsSlice.js';
import { useGetPublicPollsQuery, useVotePollMutation } from '../../store/api/readerApi.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { HelpCircle, CheckCircle2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

export function TodayPollWidget() {
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.ui);
  const { poll: fallbackPoll } = useSelector((state) => state.news);
  const isBn = language === 'bn';

  const { data: apiPolls = [] } = useGetPublicPollsQuery({ limit: 5 });
  const [submitVote, { isLoading: isVoting }] = useVotePollMutation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [voteError, setVoteError] = useState('');

  const hasServerPolls = apiPolls.length > 0;
  const activeServerPoll = hasServerPolls ? apiPolls[activeIndex % apiPolls.length] : null;

  const handleServerVote = async (optionId) => {
    if (!activeServerPoll || isVoting || !activeServerPoll.isOpen) return;
    setVoteError('');
    try {
      await submitVote({ pollId: activeServerPoll.id, optionId }).unwrap();
    } catch (err) {
      setVoteError(err?.data?.message || (isBn ? 'ভোট জমা দেওয়া যায়নি।' : 'Failed to cast vote.'));
    }
  };

  if (!hasServerPolls) {
    // Offline/initial fallback using redux initial poll
    const totalVotes = fallbackPoll.yes + fallbackPoll.no + fallbackPoll.noOpinion;
    const yesPercent = totalVotes > 0 ? Math.round((fallbackPoll.yes / totalVotes) * 100) : 0;
    const noPercent = totalVotes > 0 ? Math.round((fallbackPoll.no / totalVotes) * 100) : 0;
    const noOpinionPercent = totalVotes > 0 ? 100 - yesPercent - noPercent : 0;

    return (
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100">
          <HelpCircle className="w-4 h-4 text-rose-700" />
          <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
            {isBn ? 'মতামত জরিপ' : "Today's Reader Poll"}
          </h3>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed font-serif-bn mb-4">
          {isBn ? fallbackPoll.question : fallbackPoll.questionEn}
        </p>
        {!fallbackPoll.userVoted ? (
          <div className="space-y-2">
            {[
              { id: 'yes', bn: 'হ্যাঁ', en: 'Yes' },
              { id: 'no', bn: 'না', en: 'No' },
              { id: 'noOpinion', bn: 'মন্তব্য নেই', en: 'No Opinion' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => dispatch(voteFallbackPoll(opt.id))}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-stone-300 hover:border-rose-600 hover:bg-rose-50 text-stone-800 transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? opt.bn : opt.en}</span>
                <span className="text-stone-400 text-[11px]">{isBn ? 'ভোট দিন' : 'Vote'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isBn ? 'আপনার মতামত গ্রহণ করা হয়েছে' : 'Vote recorded'}</span>
            </p>
            {[
              { label: isBn ? 'হ্যাঁ' : 'Yes', pct: yesPercent, color: 'bg-emerald-600' },
              { label: isBn ? 'না' : 'No', pct: noPercent, color: 'bg-rose-600' },
              { label: isBn ? 'মন্তব্য নেই' : 'No Opinion', pct: noOpinionPercent, color: 'bg-stone-500' }
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>{bar.label}</span>
                  <span className="font-bold">{isBn ? toBengaliNumber(bar.pct) : bar.pct}%</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const showResults = activeServerPoll.userVoted || !activeServerPoll.isOpen;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-rose-700" />
          <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
            {isBn ? 'পাঠকের মতামত জরিপ' : "Reader Opinion Poll"}
          </h3>
        </div>

        {apiPolls.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + apiPolls.length) % apiPolls.length)}
              aria-label="Previous poll"
              className="p-1 rounded hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-stone-500">
              {isBn ? toBengaliNumber(activeIndex + 1) : activeIndex + 1}/
              {isBn ? toBengaliNumber(apiPolls.length) : apiPolls.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % apiPolls.length)}
              aria-label="Next poll"
              className="p-1 rounded hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed font-serif-bn mb-3">
        {isBn ? activeServerPoll.questionBn : activeServerPoll.questionEn}
      </p>

      {!activeServerPoll.isOpen && (
        <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md mb-3">
          <Lock className="w-3 h-3" />
          <span>{isBn ? 'জরিপের ভোটগ্রহণ সমাপ্ত হয়েছে' : 'Poll closed — showing final results'}</span>
        </div>
      )}

      {voteError && (
        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5 mb-3">
          {voteError}
        </p>
      )}

      {!showResults ? (
        <div className="space-y-2">
          {activeServerPoll.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isVoting}
              onClick={() => handleServerVote(option.id)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-stone-300 hover:border-rose-700 hover:bg-rose-50 text-stone-800 hover:text-rose-900 transition-all text-left flex items-center justify-between cursor-pointer disabled:opacity-60"
            >
              <span>{isBn ? option.labelBn : option.labelEn}</span>
              <span className="text-stone-400 text-[11px] shrink-0 ml-2">
                {isBn ? 'ভোট দিন' : 'Vote'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {activeServerPoll.userVoted && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isBn ? 'আপনার মূল্যবান মতামত গ্রহণ করা হয়েছে' : 'Thank you for voting!'}</span>
            </div>
          )}

          {activeServerPoll.options.map((option, idx) => {
            const isPicked = activeServerPoll.userVotedOptionIds.includes(option.id);
            const barColors = ['bg-emerald-600', 'bg-rose-600', 'bg-stone-500', 'bg-amber-600'];
            const colorClass = barColors[idx % barColors.length];

            return (
              <div key={option.id}>
                <div className="flex justify-between items-center text-xs text-stone-700 mb-1 gap-2">
                  <span className={isPicked ? 'font-bold text-stone-900' : ''}>
                    {isBn ? option.labelBn : option.labelEn}
                    {isPicked ? ' ✓' : ''}
                  </span>
                  <span className="font-bold shrink-0">
                    {isBn ? toBengaliNumber(option.percentage) : option.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${Math.min(100, option.percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-stone-400 mt-3 pt-2 border-t border-stone-100 flex justify-between">
        <span>{isBn ? 'মোট অংশগ্রহণ' : 'Total votes'}</span>
        <span className="font-bold text-stone-600">
          {isBn ? toBengaliNumber(activeServerPoll.totalVotes) : activeServerPoll.totalVotes}{' '}
          {isBn ? 'জন' : 'votes'}
        </span>
      </p>
    </div>
  );
}

export default TodayPollWidget;

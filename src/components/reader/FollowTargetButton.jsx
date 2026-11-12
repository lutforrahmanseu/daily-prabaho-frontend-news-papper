import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BellPlus, Check, Loader2 } from 'lucide-react';
import { selectIsReaderAuthenticated } from '../../store/readerSlice.js';
import {
  useGetReaderFollowsQuery,
  useFollowTargetMutation,
  useUnfollowTargetMutation
} from '../../store/api/readerApi.js';

export function FollowTargetButton({
  type, // 'category' | 'author' | 'tag'
  targetId = null,
  targetSlug = null,
  label = '',
  size = 'md',
  className = ''
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);

  const { data: followsData } = useGetReaderFollowsQuery(undefined, { skip: !isReaderAuth });
  const [followTarget, { isLoading: isFollowingLoading }] = useFollowTargetMutation();
  const [unfollowTarget, { isLoading: isUnfollowingLoading }] = useUnfollowTargetMutation();

  const summaryIds = followsData?.summary_ids?.[type] || [];
  const collectionKey = type === 'tag' ? 'topics' : type === 'author' ? 'authors' : 'categories';
  const followedObjects = followsData?.[collectionKey] || [];

  const isFollowed = Boolean(
    isReaderAuth &&
      ((targetId && summaryIds.includes(Number(targetId))) ||
        (targetSlug &&
          followedObjects.some(
            (item) => item.slug === targetSlug || (item.name && item.name === targetSlug)
          )))
  );

  const busy = isFollowingLoading || isUnfollowingLoading;

  const handleToggle = async () => {
    if (!isReaderAuth) {
      navigate('/reader/login', { state: { from: location } });
      return;
    }

    const payload = {
      type,
      ...(targetId && !Number.isNaN(Number(targetId)) ? { id: Number(targetId) } : { slug: targetSlug })
    };

    try {
      if (isFollowed) {
        await unfollowTarget(payload).unwrap();
      } else {
        await followTarget(payload).unwrap();
      }
    } catch {
      // Handled silently or retried by user
    }
  };

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-[11px] gap-1' : 'px-3.5 py-2 text-xs gap-1.5';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center rounded-full font-semibold transition-all cursor-pointer border ${sizeClasses} ${
        isFollowed
          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
          : 'bg-rose-700 border-rose-700 text-white hover:bg-rose-800 shadow-2xs'
      } ${className}`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowed ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <BellPlus className="w-3.5 h-3.5" />
      )}
      <span>
        {isFollowed
          ? isBn
            ? 'অনুসরণ করছেন'
            : 'Following'
          : label || (isBn ? 'অনুসরণ করুন' : 'Follow')}
      </span>
    </button>
  );
}

export default FollowTargetButton;


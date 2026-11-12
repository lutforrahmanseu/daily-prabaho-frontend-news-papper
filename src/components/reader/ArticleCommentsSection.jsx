import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsReaderAuthenticated, selectReaderUser } from '../../store/readerSlice.js';
import {
  useGetArticleCommentsQuery,
  usePostArticleCommentMutation,
  useLikeCommentMutation,
  useDeleteOwnCommentMutation
} from '../../store/api/readerApi.js';
import { formatBengaliRelativeTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Reply,
  Trash2,
  ShieldCheck,
  Lock
} from 'lucide-react';

export function ArticleCommentsSection({ slug, sectionRef = null }) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const readerUser = useSelector(selectReaderUser);

  const { data: commentsData, isLoading } = useGetArticleCommentsQuery({ slug }, { skip: !slug });
  const [postComment, { isLoading: isSubmitting }] = usePostArticleCommentMutation();
  const [likeComment] = useLikeCommentMutation();
  const [deleteOwnComment] = useDeleteOwnCommentMutation();

  const comments = Array.isArray(commentsData?.items) ? commentsData.items : [];
  const likedIds = Array.isArray(commentsData?.liked_comment_ids) ? commentsData.liked_comment_ids : [];
  const totalApproved = Number(commentsData?.total_approved ?? comments.length);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [content, setContent] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    const rawBody = parentId ? replyText : content;
    if (!rawBody.trim()) return;

    setFeedback({ type: '', text: '' });

    try {
      const res = await postComment({
        slug,
        content: rawBody.trim(),
        ...(parentId ? { parent_id: parentId } : {}),
        ...(!isReaderAuth ? { author_name: guestName.trim(), author_email: guestEmail.trim() } : {})
      }).unwrap();

      const status = res?.data?.status;
      setFeedback({
        type: 'success',
        text:
          status === 'pending'
            ? isBn
              ? 'আপনার মন্তব্য সম্পাদকীয় অনুমোদনের জন্য জমা হয়েছে।'
              : 'Your comment was submitted for editorial moderation.'
            : isBn
            ? 'আপনার মন্তব্য সফলভাবে প্রকাশিত হয়েছে।'
            : 'Your comment has been published.'
      });

      if (parentId) {
        setReplyText('');
        setReplyToId(null);
      } else {
        setContent('');
        setGuestName('');
        setGuestEmail('');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err?.data?.message ||
          (isBn ? 'মন্তব্য জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিন।' : 'Could not post comment.')
      });
    }
  };

  const handleLike = async (commentId) => {
    try {
      await likeComment(commentId).unwrap();
    } catch {
      // Ignore silently
    }
  };

  const handleDeleteOwn = async (commentId) => {
    try {
      await deleteOwnComment(commentId).unwrap();
    } catch {
      // Ignore silently
    }
  };

  return (
    <section ref={sectionRef} className="mt-8 pt-8 border-t border-stone-200" aria-label="Comments">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-700" />
          <h3 className="text-xl font-bold text-stone-900 font-serif-bn">
            {isBn ? 'পাঠকের মন্তব্য' : 'Reader Comments'}
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
            {isBn ? toBengaliNumber(totalApproved) : totalApproved}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
          <Lock className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isBn ? 'পাঠকের ব্যক্তিগত ইমেইল কখনোই প্রকাশ করা হয় না' : 'Reader email privacy protected'}</span>
        </div>
      </div>

      {/* Main Comment Form */}
      <form
        onSubmit={(e) => handleSubmitComment(e, null)}
        className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-bold text-stone-800 font-serif-bn">
            {isBn ? 'আপনার সুচিন্তিত মতামত জানান' : 'Join the Discussion'}
          </h4>
          {isReaderAuth ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              {readerUser?.display_name || readerUser?.name}
            </span>
          ) : (
            <Link
              to="/reader/login"
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              {isBn ? 'তাৎক্ষণিক মন্তব্য প্রকাশের জন্য লগইন করুন →' : 'Sign in for instant publishing →'}
            </Link>
          )}
        </div>

        {!isReaderAuth && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              required
              placeholder={isBn ? 'আপনার নাম' : 'Your display name'}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-rose-700"
            />
            <input
              type="email"
              required
              placeholder={isBn ? 'ইমেইল (গোপন থাকবে, প্রকাশিত হবে না)' : 'Email (private, never published)'}
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-rose-700"
            />
          </div>
        )}

        <textarea
          rows={3}
          placeholder={isBn ? 'সংবাদের ওপর আপনার মতামত লিখুন...' : 'Write your thoughtful comment...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={2000}
          className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-rose-700 mb-3 font-serif-bn"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-stone-500">
            {isReaderAuth
              ? isBn
                ? 'নিবন্ধিত পাঠকের মন্তব্য তাৎক্ষণিক প্রকাশিত হয়।'
                : 'Verified reader comments publish immediately.'
              : isBn
              ? 'অতিথি মন্তব্য মডারেটরের অনুমোদনের পর প্রদর্শিত হবে।'
              : 'Guest comments appear after moderation review.'}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? (isBn ? 'জমা হচ্ছে...' : 'Posting...') : isBn ? 'মন্তব্য প্রকাশ করুন' : 'Post Comment'}</span>
          </button>
        </div>

        {feedback.text && (
          <div
            className={`mt-3 p-2.5 rounded text-xs font-medium border ${
              feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-stone-100 rounded-xl" />
          <div className="h-20 bg-stone-100 rounded-xl" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-stone-500 text-sm text-center py-6 font-serif-bn">
          {isBn ? 'এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি করুন আপনি!' : 'No comments yet. Start the conversation!'}
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const liked = likedIds.includes(comment.id);
            return (
              <div
                key={comment.id}
                className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {comment.author_initial || 'প'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900">{comment.author_name}</span>
                        {comment.is_registered_reader && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            {isBn ? 'নিবন্ধিত পাঠক' : 'Verified Reader'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {isBn ? formatBengaliRelativeTime(comment.created_at) : new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {comment.is_own && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOwn(comment.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'মুছুন' : 'Delete'}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif-bn">
                  {comment.content}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-stone-500">
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      liked ? 'text-rose-700 font-bold' : 'hover:text-rose-700'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {isBn
                        ? `পছন্দ (${toBengaliNumber(comment.likes_count || 0)})`
                        : `Like (${comment.likes_count || 0})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 hover:text-stone-900 cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{isBn ? 'উত্তর দিন' : 'Reply'}</span>
                  </button>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <form
                    onSubmit={(e) => handleSubmitComment(e, comment.id)}
                    className="mt-2 pt-3 border-t border-stone-100 space-y-2"
                  >
                    {!isReaderAuth && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder={isBn ? 'আপনার নাম' : 'Your name'}
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-300 bg-white"
                        />
                        <input
                          type="email"
                          required
                          placeholder={isBn ? 'ইমেইল (গোপন থাকবে)' : 'Email (private)'}
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-300 bg-white"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isBn ? 'আপনার উত্তর লিখুন...' : 'Write your reply...'}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-rose-700"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {isBn ? 'পাঠান' : 'Send'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Nested Replies */}
                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                  <div className="pl-4 sm:pl-6 mt-2 border-l-2 border-stone-200 space-y-2.5">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-stone-50 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center">
                              {reply.author_initial || 'প'}
                            </span>
                            <span className="text-xs font-bold text-stone-800">{reply.author_name}</span>
                            <span className="text-[10px] text-stone-400">
                              • {isBn ? formatBengaliRelativeTime(reply.created_at) : 'Recently'}
                            </span>
                          </div>
                          {reply.is_own && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOwn(reply.id)}
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                            >
                              {isBn ? 'মুছুন' : 'Delete'}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-700 font-serif-bn leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ArticleCommentsSection;


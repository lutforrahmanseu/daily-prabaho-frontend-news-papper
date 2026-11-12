import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
  useDeleteAdminCommentMutation,
  useGetAdminPollsQuery,
  useCreateAdminPollMutation,
  usePublishAdminPollMutation,
  useCloseAdminPollMutation,
  useDeleteAdminPollMutation
} from '../../store/api/readerApi.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Lock,
  Radio,
  AlertOctagon
} from 'lucide-react';

export function AdminEngagementPage({ initialTab = 'comments' }) {
  const [tab, setTab] = useState(initialTab);
  const [commentFilter, setCommentFilter] = useState('pending');

  const { data: commentsRes, isLoading: loadingComments } = useGetAdminCommentsQuery(
    { status: commentFilter, per_page: 25 },
    { skip: tab !== 'comments' }
  );
  const [moderateComment] = useModerateCommentMutation();
  const [deleteComment] = useDeleteAdminCommentMutation();

  const { data: pollsRes, isLoading: loadingPolls } = useGetAdminPollsQuery(
    { per_page: 25 },
    { skip: tab !== 'polls' }
  );
  const [createPoll, { isLoading: creatingPoll }] = useCreateAdminPollMutation();
  const [publishPoll] = usePublishAdminPollMutation();
  const [closePoll] = useCloseAdminPollMutation();
  const [deletePoll] = useDeleteAdminPollMutation();

  const [questionBn, setQuestionBn] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [options, setOptions] = useState([
    { label_bn: 'হ্যাঁ', label_en: 'Yes' },
    { label_bn: 'না', label_en: 'No' },
    { label_bn: 'মন্তব্য নেই', label_en: 'No Opinion' }
  ]);

  const handleModerate = async (id, status) => {
    await moderateComment({ id, status }).unwrap();
    sweetAlert.success('মন্তব্যের অবস্থা আপডেট হয়েছে');
  };

  const handleDeleteComment = async (id) => {
    const { isConfirmed } = await sweetAlert.confirmDelete({
      title: 'মন্তব্য মুছে ফেলবেন?',
      text: 'এটি স্থায়ীভাবে অপসারণ করা হবে।'
    });
    if (!isConfirmed) return;
    await deleteComment(id).unwrap();
    sweetAlert.success('মন্তব্য মুছে ফেলা হয়েছে');
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.label_bn.trim() !== '');
    if (validOptions.length < 2) {
      sweetAlert.warning('কমপক্ষে ২টি বিকল্প যুক্ত করুন');
      return;
    }
    try {
      await createPoll({
        question_bn: questionBn.trim(),
        question_en: questionEn.trim() || null,
        status: 'published',
        is_featured: isFeatured,
        options: validOptions
      }).unwrap();
      setQuestionBn('');
      setQuestionEn('');
      sweetAlert.success('পাঠক জরিপ প্রকাশিত হয়েছে');
    } catch {
      sweetAlert.error('জরিপ তৈরি করা যায়নি');
    }
  };

  const comments = commentsRes?.items || [];
  const counts = commentsRes?.counts || {};
  const polls = pollsRes?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-bn">
            পাঠক সম্পৃক্ততা ও মডারেশন স্টুডিও
          </h1>
          <p className="text-xs text-stone-500">
            পাঠকের মন্তব্য অনুমোদন ও মতামত জরিপ পরিচালনা (প্রাইভেসি-সুরক্ষিত)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/citizen-journalism"
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
          >
            নাগরিক সাংবাদিকতা ও কমিউনিটি →
          </Link>
          <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'comments' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>মন্তব্য মডারেশন</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('polls')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'polls' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>মতামত জরিপ CMS</span>
          </button>
          </div>
        </div>
      </div>

      {tab === 'comments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pending', label: `অপেক্ষমাণ (${toBengaliNumber(counts.pending || 0)})` },
              { id: 'approved', label: `অনুমোদিত (${toBengaliNumber(counts.approved || 0)})` },
              { id: 'rejected', label: `বাতিল (${toBengaliNumber(counts.rejected || 0)})` },
              { id: 'spam', label: `স্প্যাম (${toBengaliNumber(counts.spam || 0)})` }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCommentFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  commentFilter === item.id
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
            {loadingComments ? (
              <p className="p-6 text-xs text-stone-500">লোড হচ্ছে...</p>
            ) : comments.length === 0 ? (
              <p className="p-8 text-center text-xs text-stone-500">এই তালিকায় কোনো মন্তব্য নেই।</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-stone-900">{comment.author_name}</span>
                      {comment.author_email_masked && (
                        <span className="text-[11px] font-mono text-stone-400">({comment.author_email_masked})</span>
                      )}
                      {comment.news_title && (
                        <span className="text-[11px] text-rose-700 font-semibold">• {comment.news_title}</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 font-serif-bn">{comment.content}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {comment.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleModerate(comment.id, 'approved')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>অনুমোদন</span>
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleModerate(comment.id, 'rejected')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>বাতিল</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleModerate(comment.id, 'spam')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>স্প্যাম</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'polls' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreatePoll} className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 h-fit">
            <h2 className="text-base font-bold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              নতুন পাঠক জরিপ তৈরি করুন
            </h2>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">প্রশ্ন (বাংলা) *</label>
              <input
                type="text"
                required
                value={questionBn}
                onChange={(e) => setQuestionBn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Question (English)</label>
              <input
                type="text"
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">বিকল্পসমূহ (কমপক্ষে ২টি)</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={opt.label_bn}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = { ...next[idx], label_bn: e.target.value };
                      setOptions(next);
                    }}
                    placeholder={`বিকল্প ${idx + 1} (বাংলা)`}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300"
                  />
                  <input
                    type="text"
                    value={opt.label_en}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = { ...next[idx], label_en: e.target.value };
                      setOptions(next);
                    }}
                    placeholder="English"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300"
                  />
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, { label_bn: '', label_en: '' }])}
                  className="text-xs font-bold text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> বিকল্প যোগ করুন
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-rose-700"
              />
              <span>হোমপেজ ও সাইডবারে প্রধান জরিপ হিসেবে দেখান</span>
            </label>
            <button
              type="submit"
              disabled={creatingPoll}
              className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              {creatingPoll ? 'প্রকাশ হচ্ছে...' : 'জরিপ প্রকাশ করুন'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
            {loadingPolls ? (
              <p className="p-6 text-xs text-stone-500">লোড হচ্ছে...</p>
            ) : polls.length === 0 ? (
              <p className="p-8 text-center text-xs text-stone-500">কোনো পাঠক জরিপ পাওয়া যায়নি।</p>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            poll.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : poll.status === 'closed'
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {poll.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          মোট ভোট: {toBengaliNumber(poll.totalVotes)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 font-serif-bn">{poll.questionBn}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {poll.status !== 'published' ? (
                        <button
                          type="button"
                          onClick={() => publishPoll(poll.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          <Radio className="w-3 h-3" /> চালু করুন
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => closePoll(poll.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
                        >
                          <Lock className="w-3 h-3" /> বন্ধ করুন
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePoll(poll.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {poll.options.map((opt) => (
                      <div key={opt.id} className="bg-stone-50 px-2.5 py-1.5 rounded-lg flex justify-between">
                        <span className="truncate">{opt.labelBn}</span>
                        <span className="font-bold text-rose-700 ml-2">{opt.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEngagementPage;

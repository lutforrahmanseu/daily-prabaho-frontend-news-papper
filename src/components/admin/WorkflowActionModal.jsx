import React, { useState } from 'react';
import { X, Send, AlertTriangle, Clock, CheckCircle2, RotateCcw, Ban, Calendar } from 'lucide-react';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';

export function WorkflowActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'return', // 'return' | 'reject' | 'approve' | 'schedule'
  article = null
}) {
  const [comments, setComments] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if ((actionType === 'return' || actionType === 'reject') && !comments.trim()) {
      setError(
        actionType === 'return'
          ? 'প্রতিবেদকের জন্য সংশোধনের সুনির্দিষ্ট দিকনির্দেশনা লিখুন'
          : 'সংবাদটি বাতিলের কারণ উল্লেখ করা আবশ্যক'
      );
      return;
    }

    if (actionType === 'schedule') {
      if (!scheduledDate || !scheduledTime) {
        setError('প্রকাশের তারিখ ও সময় উভয়টি নির্বাচন করুন');
        return;
      }
      onConfirm({
        comments: comments.trim(),
        scheduledAt: `${scheduledDate}T${scheduledTime}:00Z`
      });
    } else {
      onConfirm({
        comments: comments.trim()
      });
    }

    setComments('');
    onClose();
  };

  const titles = {
    return: 'সংশোধনের জন্য ফেরত পাঠান (Return for Revision)',
    reject: 'সংবাদ প্রত্যাখ্যান করুন (Reject Article)',
    approve: 'সংবাদ অনুমোদন করুন (Approve Article)',
    schedule: 'প্রকাশনার সময় নির্ধারণ (Schedule Publication)'
  };

  const icons = {
    return: <RotateCcw className="w-5 h-5 text-orange-600" />,
    reject: <Ban className="w-5 h-5 text-rose-600" />,
    approve: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    schedule: <Clock className="w-5 h-5 text-indigo-600" />
  };

  return (
    <MotionOverlay
      isOpen={Boolean(isOpen && article)}
      onBackdropClick={onClose}
      wrapperClassName="z-50 p-3 sm:p-4"
      backdropClassName="bg-stone-950/75 backdrop-blur-xs"
      panelClassName="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 space-y-4 font-sans max-h-[92vh] overflow-y-auto"
    >
      {article && (
        <>
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
              {icons[actionType]}
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                {titles[actionType]}
              </h3>
              <p className="text-xs text-stone-500 line-clamp-1 max-w-sm mt-0.5 font-serif-bn">
                {article.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Scheduling Date/Time pickers */}
          {actionType === 'schedule' && (
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>তারিখ (Date)</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>সময় (Time)</span>
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Comments and Feedback Input */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              {actionType === 'return' ? (
                <>সম্পাদকীয় মন্তব্য ও নির্দেশাবলী <span className="text-rose-600">*</span></>
              ) : actionType === 'reject' ? (
                <>বাতিলকরণের কারণ <span className="text-rose-600">*</span></>
              ) : (
                <>সম্পাদকীয় নোট ও মন্তব্য (ঐচ্ছিক)</>
              )}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                actionType === 'return'
                  ? 'যেমন: অনুগ্রহ করে ২য় অনুচ্ছেদের তথ্যসূত্র যাচাই করুন এবং ছবি ক্যাপশন সংযোজন করুন...'
                  : actionType === 'reject'
                  ? 'সম্পাদকীয় নীতিমালা কিংবা সত্যতা যাচাইয়ে অসঙ্গতির বিবরণ...'
                  : 'অনুমোদন সংক্রান্ত কোনো নির্দেশনা থাকলে লিখুন...'
              }
              className={`w-full px-3 py-2 border rounded-xl text-xs font-serif-bn focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                error ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300'
              }`}
            />
            {error && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Action Explanations */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            {actionType === 'return' && (
              <p>
                সংবাদটি প্রতিবেদকের ড্রাফটে ফেরত যাবে এবং তিনি এই মন্তব্যটি তার নোটিফিকেশন ও ফিডব্যাক প্যানেলে দেখতে পাবেন।
              </p>
            )}
            {actionType === 'reject' && (
              <p>
                বাতিলকৃত সংবাদটি প্রকাশনা পাইপলাইন থেকে বাদ দেওয়া হবে এবং অডিট ট্রেইলে স্থায়ী রেকর্ড থাকবে।
              </p>
            )}
            {actionType === 'approve' && (
              <p>
                সংবাদটি বার্তা সম্পাদক কর্তৃক অনুমোদিত হয়ে প্রধান সম্পাদকের চূড়ান্ত সিদ্ধান্তের টেবিলে জমা হবে।
              </p>
            )}
            {actionType === 'schedule' && (
              <p>
                নির্ধারিত তারিখ ও সময়ে স্বয়ংক্রিয়ভাবে সংবাদটি লাইভ পোর্টালে প্রকাশিত হবে।
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
                actionType === 'return'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : actionType === 'reject'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>নিশ্চিত করুন</span>
            </button>
          </div>

        </form>
        </>
      )}
    </MotionOverlay>
  );
}

export default WorkflowActionModal;


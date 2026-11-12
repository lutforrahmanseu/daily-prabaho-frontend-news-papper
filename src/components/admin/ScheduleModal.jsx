import React, { useState } from 'react';
import { Calendar, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';

export function ScheduleModal({ isOpen, onClose, onConfirm, currentScheduledAt = null }) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [scheduleDate, setScheduleDate] = useState(
    currentScheduledAt ? currentScheduledAt.split('T')[0] : tomorrow
  );
  const [scheduleTime, setScheduleTime] = useState(
    currentScheduledAt ? currentScheduledAt.split('T')[1]?.substring(0, 5) || '০৯:০০' : '09:00'
  );

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) return;

    const fullTimestamp = `${scheduleDate}T${scheduleTime}:00Z`;
    onConfirm(fullTimestamp);
    onClose();
  };

  return (
    <MotionOverlay
      isOpen={isOpen}
      onBackdropClick={onClose}
      wrapperClassName="z-50 p-4"
      backdropClassName="bg-stone-950/75 backdrop-blur-xs"
      panelClassName="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
    >
        
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                সংবাদ প্রকাশের সময় নির্ধারণ (Schedule)
              </h3>
              <p className="text-[11px] text-stone-500">স্বয়ংক্রিয়ভাবে নির্ধারিত সময়ে সংবাদটি লাইভ হবে</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>প্রকাশের তারিখ (Date)</span>
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>প্রকাশের সময় (Time)</span>
            </label>
            <input
              type="time"
              required
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              নির্ধারিত সময়ের পূর্বে সংবাদটি পাঠকদের মূল সাইটে দৃশ্যমান হবে না। তবে অ্যাডমিন প্যানেলে শিডিউল্ড হিসেবে সংরক্ষিত থাকবে।
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>শিডিউল নিশ্চিত করুন</span>
            </button>
          </div>
        </form>
    </MotionOverlay>
  );
}

export default ScheduleModal;


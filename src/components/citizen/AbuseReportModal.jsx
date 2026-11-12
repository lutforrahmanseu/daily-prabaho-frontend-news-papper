import React, { useState } from 'react';
import { Flag, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ABUSE_REASONS } from '../../utils/citizenHelpers.js';
import { useReportCommunityAbuseMutation } from '../../store/api/citizenApi.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function AbuseReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle = '',
  isBn = true
}) {
  const [reasonCategory, setReasonCategory] = useState('misinformation');
  const [details, setDetails] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [reportAbuse, { isLoading }] = useReportCommunityAbuseMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details || details.trim().length < 10) {
      sweetAlert.warning(isBn ? 'অনুগ্রহ করে কমপক্ষে ১০ অক্ষরে বিস্তারিত অভিযোগ লিখুন।' : 'Please enter at least 10 characters explaining the issue.');
      return;
    }

    try {
      const res = await reportAbuse({
        target_type: targetType,
        target_id: Number(targetId),
        reason_category: reasonCategory,
        details: details.trim()
      }).unwrap();
      setSubmittedCode(res?.report_code || 'REPORTED');
      setDetails('');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'অভিযোগ জমা দেওয়া যায়নি।' : 'Failed to submit abuse report.'));
    }
  };

  const handleClose = () => {
    setSubmittedCode('');
    setDetails('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <Flag className="w-4 h-4" />
            <span>{isBn ? 'অপব্যবহার / নীতিমালা ভঙ্গের অভিযোগ' : 'Report Policy / Safety Violation'}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {submittedCode ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">
                {isBn ? 'আপনার অভিযোগটি নথিভুক্ত হয়েছে' : 'Report Logged Safely'}
              </h3>
              <p className="text-xs text-stone-600">
                {isBn
                  ? 'আমাদের মডারেশন টিম অভিযোগটি পর্যালোচনা করে দ্রুত প্রয়োজনীয় ব্যবস্থা নেবে।'
                  : 'Our moderation desk has received this report and will review it promptly.'}
              </p>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 font-mono text-xs font-bold text-stone-800">
                {submittedCode}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {targetTitle && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                  <span className="font-bold text-stone-900">{isBn ? 'বিষয়:' : 'Target:'}</span> {targetTitle}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'অভিযোগের ধরন' : 'Reason Category'}
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
                >
                  {ABUSE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {isBn ? r.labelBn : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'বিস্তারিত বিবরণ (কমপক্ষে ১০ অক্ষর)' : 'Detailed Explanation (min 10 chars)'}
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    isBn
                      ? 'কেন এই বিষয়বস্তু বা আচরণ নীতিমালা ভঙ্গ করেছে তা সংক্ষেপে লিখুন...'
                      : 'Describe the safety, privacy, misinformation, or copyright concern...'
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'আপনার পরিচয় ও অভিযোগ সংক্রান্ত তথ্য মডারেশন টিমের কাছে গোপন রাখা হয়।'
                    : 'Reporter identity and submission metadata remain strictly confidential within moderation.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {isLoading ? (isBn ? 'পাঠানো হচ্ছে...' : 'Submitting...') : isBn ? 'অভিযোগ জমা দিন' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AbuseReportModal;


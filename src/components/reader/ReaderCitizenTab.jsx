import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FileText,
  Save,
  Plus,
  ExternalLink,
  ShieldCheck,
  Clock,
  Edit3,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  useGetMyContributorHistoryQuery,
  useUpdateMyContributorProfileMutation,
  useUpdateMyCitizenSubmissionMutation
} from '../../store/api/citizenApi.js';
import {
  SUBMISSION_STATUS_META,
  VERIFICATION_STATUS_META,
  TRUST_LEVEL_META
} from '../../utils/citizenHelpers.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function ReaderCitizenTab() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data: history, isLoading } = useGetMyContributorHistoryQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateMyContributorProfileMutation();
  const [updateSubmission, { isLoading: savingRevision }] = useUpdateMyCitizenSubmissionMutation();

  const [displayName, setDisplayName] = useState('');
  const [publicHandle, setPublicHandle] = useState('');
  const [cityDistrict, setCityDistrict] = useState('');
  const [bio, setBio] = useState('');
  const [anonDefault, setAnonDefault] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (history?.profile) {
      setDisplayName(history.profile.display_name || '');
      setPublicHandle(history.profile.public_handle || '');
      setCityDistrict(history.profile.city_district || '');
      setBio(history.profile.bio || '');
      setAnonDefault(Boolean(history.profile.is_anonymous_by_default));
    }
  }, [history]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        display_name: displayName.trim(),
        public_handle: publicHandle.trim(),
        city_district: cityDistrict.trim(),
        bio: bio.trim(),
        is_anonymous_by_default: anonDefault
      }).unwrap();
      sweetAlert.success(isBn ? 'কন্ট্রিবিউটর প্রোফাইল সংরক্ষিত হয়েছে' : 'Contributor profile saved');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save profile'));
    }
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setEditTitle(sub.title || '');
    setEditSummary(sub.summary || '');
    setEditContent(sub.content || '');
  };

  const handleSaveRevision = async (e) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      await updateSubmission({
        id: editingSub.id,
        title: editTitle.trim(),
        summary: editSummary.trim(),
        content: editContent.trim()
      }).unwrap();
      sweetAlert.success(isBn ? 'সংশোধিত প্রতিবেদন পুনরায় পর্যালোচনায় পাঠানো হয়েছে' : 'Updated submission sent for review');
      setEditingSub(null);
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'সংশোধন ব্যর্থ হয়েছে' : 'Revision failed'));
    }
  };

  if (isLoading) {
    return <div className="h-48 rounded-2xl bg-stone-100 animate-pulse" />;
  }

  const profile = history?.profile;
  const submissions = history?.submissions || [];
  const discussions = history?.discussions || [];
  const registrations = history?.event_registrations || [];
  const trustMeta = TRUST_LEVEL_META[profile?.trust_level || 'standard'] || TRUST_LEVEL_META.standard;

  return (
    <div className="space-y-6">
      {/* Contributor Profile Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
              {isBn ? 'নাগরিক প্রতিবেদক প্রোফাইল ও অবদান পরিসংখ্যান' : 'Contributor Profile & History'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold ${trustMeta.tone}`}>
                {isBn ? trustMeta.labelBn : trustMeta.labelEn}
              </span>
              {profile?.verified_contributor && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                </span>
              )}
              {profile?.public_handle && (
                <Link
                  to={`/citizen/contributor/${profile.public_handle}`}
                  className="inline-flex items-center gap-1 text-rose-700 font-bold hover:underline"
                >
                  <span>{isBn ? 'পাবলিক প্রোফাইল' : 'Public Showcase'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          <Link
            to="/citizen/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isBn ? 'নতুন প্রতিবেদন পাঠান' : 'New Submission'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <p className="text-lg font-extrabold text-stone-900">
              {isBn ? toBengaliNumber(profile?.total_submissions || 0) : profile?.total_submissions || 0}
            </p>
            <p className="text-[11px] text-stone-500">{isBn ? 'মোট পাঠানো' : 'Total Submitted'}</p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <p className="text-lg font-extrabold text-emerald-700">
              {isBn ? toBengaliNumber(profile?.approved_submissions || 0) : profile?.approved_submissions || 0}
            </p>
            <p className="text-[11px] text-stone-500">{isBn ? 'অনুমোদিত' : 'Approved'}</p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <p className="text-lg font-extrabold text-rose-700">
              {isBn ? toBengaliNumber(profile?.published_submissions || 0) : profile?.published_submissions || 0}
            </p>
            <p className="text-[11px] text-stone-500">{isBn ? 'প্রকাশিত' : 'Published'}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'প্রদর্শনী নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'পাবলিক হ্যান্ডেল' : 'Public Handle'}
              </label>
              <input
                type="text"
                required
                value={publicHandle}
                onChange={(e) => setPublicHandle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'জেলা / শহর' : 'District / City'}
              </label>
              <input
                type="text"
                value={cityDistrict}
                onChange={(e) => setCityDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isBn ? 'সংক্ষিপ্ত পরিচিতি' : 'Contributor Bio'}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={anonDefault}
              onChange={(e) => setAnonDefault(e.target.checked)}
              className="rounded border-stone-300 text-rose-700"
            />
            <span>{isBn ? 'ডিফল্টভাবে নাম গোপন রেখে প্রতিবেদন প্রকাশ করুন (Anonymous)' : 'Default to anonymous credit'}</span>
          </label>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingProfile ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'কন্ট্রিবিউটর তথ্য সংরক্ষণ' : 'Save Contributor Settings'}</span>
          </button>
        </form>
      </div>

      {/* Submission Tracking & History */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-stone-900 font-serif-bn border-b border-stone-100 pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-700" />
          <span>{isBn ? 'আমার পাঠানো প্রতিবেদন ও অগ্রগতি' : 'My Submitted Reports & Tracking'}</span>
        </h3>

        {submissions.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">
            {isBn ? 'আপনি এখনো কোনো নাগরিক প্রতিবেদন পাঠাননি।' : 'You have not submitted any citizen reports yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const sMeta = SUBMISSION_STATUS_META[sub.status] || SUBMISSION_STATUS_META.submitted;
              const vMeta = VERIFICATION_STATUS_META[sub.verification_status] || VERIFICATION_STATUS_META.pending;
              const isExpanded = expandedId === sub.id;
              const canEdit = sub.status === 'submitted' || sub.status === 'changes_requested';

              return (
                <div key={sub.id} className="border border-stone-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-rose-700">{sub.tracking_code}</span>
                      <span className={`px-2 py-0.5 rounded-full border font-bold ${sMeta.tone}`}>
                        {isBn ? sMeta.labelBn : sMeta.labelEn}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${vMeta.tone}`}>
                        {isBn ? vMeta.labelBn : vMeta.labelEn}
                      </span>
                    </div>
                    <span className="text-stone-400">
                      {sub.created_at ? formatBengaliRelativeTime(sub.created_at) : ''}
                    </span>
                  </div>

                  <p className="text-sm font-bold font-serif-bn text-stone-900">{sub.title}</p>

                  {sub.editor_feedback && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold">{isBn ? 'সম্পাদকের মন্তব্য:' : 'Editor Feedback:'}</span> {sub.editor_feedback}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="inline-flex items-center gap-1 font-bold text-stone-700 hover:text-rose-700 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'অগ্রগতির ধাপ দেখুন' : 'Timeline'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditModal(sub)}
                        className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সংশোধন করুন' : 'Revise'}</span>
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-stone-100 space-y-1.5">
                      {(sub.events || []).map((ev, idx) => (
                        <div key={idx} className="text-[11px] text-stone-600 flex items-start justify-between gap-2">
                          <span>• {ev.public_note || ev.event_type}</span>
                          <span className="text-stone-400 shrink-0">
                            {ev.created_at ? formatBengaliRelativeTime(ev.created_at) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discussions & Events Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <MessageSquare className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'আমার কমিউনিটি আলোচনা' : 'My Discussions'}</span>
          </h3>
          {discussions.length === 0 ? (
            <p className="text-xs text-stone-500">{isBn ? 'কোনো আলোচনা তৈরি করেননি।' : 'No discussions created.'}</p>
          ) : (
            <div className="space-y-2">
              {discussions.map((d) => (
                <div key={d.id} className="text-xs border-b border-stone-100 pb-2">
                  <p className="font-bold text-stone-900">{d.title}</p>
                  <p className="text-[11px] text-stone-500">
                    {isBn ? 'অবস্থা:' : 'Status:'} {d.status} • {d.is_approved ? (isBn ? 'অনুমোদিত' : 'Approved') : (isBn ? 'মডারেশন অপেক্ষমাণ' : 'Pending Review')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <Calendar className="w-4 h-4 text-rose-700" />
            <span>{isBn ? 'আমার ইভেন্ট নিবন্ধন' : 'My Event RSVPs'}</span>
          </h3>
          {registrations.length === 0 ? (
            <p className="text-xs text-stone-500">{isBn ? 'কোনো ইভেন্টে নিবন্ধন করেননি।' : 'No event registrations yet.'}</p>
          ) : (
            <div className="space-y-2">
              {registrations.map((r) => (
                <div key={r.id} className="text-xs border-b border-stone-100 pb-2">
                  <p className="font-bold text-stone-900">{r.event?.title || 'Event'}</p>
                  <p className="text-[11px] text-stone-500">
                    {r.status} • {r.event?.location_label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revise Submission Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              {isBn ? `প্রতিবেদন সংশোধন (${editingSub.tracking_code})` : `Revise Submission (${editingSub.tracking_code})`}
            </h3>
            <form onSubmit={handleSaveRevision} className="space-y-3">
              <input
                type="text"
                required
                minLength={8}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
              <textarea
                rows={2}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder={isBn ? 'সারসংক্ষেপ' : 'Summary'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
              <textarea
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder={isBn ? 'বিস্তারিত বিবরণ' : 'Content'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingRevision}
                  className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {savingRevision ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'সংশোধন জমা দিন' : 'Submit Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReaderCitizenTab;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Camera,
  FileText,
  Video,
  Send,
  ShieldCheck,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Info
} from 'lucide-react';
import { selectIsReaderAuthenticated } from '../../store/readerSlice.js';
import { usePortalCategories } from '../../hooks/usePortalData.js';
import { useSubmitCitizenReportMutation } from '../../store/api/citizenApi.js';
import {
  SUBMISSION_TYPES,
  LOCATION_PRIVACY_MODES,
  CREDIT_MODES,
  BANGLADESH_DIVISIONS,
  hasRequiredSubmissionConsents,
  sanitizeSubmissionLocationPreview,
  validateSafeSubmissionDraft
} from '../../utils/citizenHelpers.js';
import SEO from '../../components/common/SEO.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

export function CitizenSubmitPage() {
  const { language } = useSelector((state) => state.ui);
  const { isAuthenticated: isStaffAuth } = useSelector((state) => state.auth);
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const canSubmit = isReaderAuth || isStaffAuth;
  const isBn = language === 'bn';

  const { categories = [] } = usePortalCategories();
  const [submitReport, { isLoading }] = useSubmitCitizenReportMutation();

  const [form, setForm] = useState({
    submission_type: 'story',
    category_id: '',
    title: '',
    summary: '',
    content: '',
    language: 'bn',
    district: '',
    division: 'ঢাকা',
    public_location_label: '',
    private_location_detail: '',
    private_latitude: '',
    private_longitude: '',
    location_privacy_mode: 'district_only',
    incident_at: '',
    credit_mode: 'public_profile',
    attribution_credit: '',
    copyright_holder_name: '',
    media_url: '',
    media_caption: '',
    consent_editorial_review: false,
    consent_privacy_policy: false,
    consent_publish_license: true,
    copyright_declared: false,
    media_ownership_declared: false
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setSelectedFiles(files);
  };

  const publicLocationPreview = sanitizeSubmissionLocationPreview(form);
  const consentStatus = hasRequiredSubmissionConsents(form);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const check = validateSafeSubmissionDraft(form);
    if (!check.valid) {
      const msg = Object.values(check.errors)[0];
      sweetAlert.warning(msg);
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val === '' || val === null || val === undefined) return;
        if (typeof val === 'boolean') {
          fd.append(key, val ? '1' : '0');
        } else {
          fd.append(key, String(val));
        }
      });

      selectedFiles.forEach((file) => {
        fd.append('media_files[]', file);
      });

      const created = await submitReport(fd).unwrap();
      setSubmittedRecord(created);
      sweetAlert.success(isBn ? 'আপনার প্রতিবেদনটি নিরাপদে জমা হয়েছে!' : 'Submission received for editorial review.');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'প্রতিবেদন জমা দিতে সমস্যা হয়েছে।' : 'Failed to submit report.'));
    }
  };

  const typeIcons = {
    story: FileText,
    photo: Camera,
    video: Video,
    tip: Info
  };

  if (submittedRecord) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <SEO title={isBn ? 'প্রতিবেদন জমা সম্পন্ন' : 'Submission Received'} />
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-5 shadow-xs">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              {isBn ? 'সম্পাদকীয় পর্যালোচনা ও যাচাই অপেক্ষমাণ' : 'Pending Editorial Verification & Approval'}
            </span>
            <h1 className="text-2xl font-extrabold font-serif-bn text-stone-900">
              {isBn ? 'ধন্যবাদ! আপনার নাগরিক প্রতিবেদন জমা হয়েছে' : 'Thank You! Citizen Report Submitted'}
            </h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              {isBn
                ? 'নীতিমালা অনুযায়ী সম্পাদকীয় যাচাই ও অনুমোদন ব্যতীত কোনো প্রতিবেদন সরাসরি প্রকাশিত হয় না। নিচের ট্র্যাকিং কোড দিয়ে অগ্রগতি দেখুন।'
                : 'For editorial accuracy and reader safety, submissions are strictly verified before publication. Track your submission below.'}
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 inline-block">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              {isBn ? 'আপনার ট্র্যাকিং কোড' : 'Tracking Code'}
            </p>
            <p className="text-2xl font-mono font-extrabold text-rose-700 select-all">
              {submittedRecord.tracking_code}
            </p>
          </div>

          <div className="text-left bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-1.5">
            <p><span className="font-bold">{isBn ? 'শিরোনাম:' : 'Title:'}</span> {submittedRecord.title}</p>
            <p>
              <span className="font-bold">{isBn ? 'প্রকাশিতব্য অবস্থান:' : 'Public Location Display:'}</span>{' '}
              {submittedRecord.public_location_label || (isBn ? 'সম্পূর্ণ গোপন (Hidden)' : 'Hidden')}
            </p>
            <p>
              <span className="font-bold">{isBn ? 'সংযুক্ত মিডিয়া:' : 'Attached Media:'}</span>{' '}
              {(submittedRecord.media || []).length} {isBn ? 'টি ফাইল/লিংক (ব্যক্তিগত সুরক্ষিত স্টোরেজে সংরক্ষিত)' : 'item(s) protected'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/reader/profile?tab=citizen"
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
            >
              {isBn ? 'আমার প্রতিবেদন ও ট্র্যাকিং দেখুন' : 'Track in My Profile'}
            </Link>
            <Link
              to="/community"
              className="px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold"
            >
              {isBn ? 'কমিউনিটি পোর্টালে ফিরুন' : 'Back to Community'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO
        title={isBn ? 'নাগরিক প্রতিবেদন পাঠান' : 'Submit Citizen Journalism Report'}
        description={isBn ? 'সংবাদ, ছবি ও ভিডিও পাঠান সম্পাদকীয় যাচাইয়ের জন্য' : 'Submit verified citizen stories, photos, and videos'}
      />

      <div className="flex items-center justify-between gap-3">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700">
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'কমিউনিটি ও নাগরিক সংবাদে ফিরুন' : 'Back to Community Portal'}</span>
        </Link>
      </div>

      {/* Header + Safety Guarantee */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>{isBn ? 'সম্পাদকীয় যাচাই ও সুরক্ষিত নাগরিক সাংবাদিকতা' : 'Verified & Privacy-Protected Citizen Journalism'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-bn">
          {isBn ? 'আপনার এলাকার সংবাদ, ছবি বা ভিডিও পাঠান' : 'Submit a Citizen Report, Photo, or Video'}
        </h1>
        <p className="text-sm text-stone-300 max-w-2xl leading-relaxed">
          {isBn
            ? 'পাঠকদের পাঠানো প্রতিটি প্রতিবেদন ও ছবি প্রথমে আমাদের বার্তাকক্ষের ফ্যাক্ট-চেকার ও সম্পাদকীয় ডেস্ক যাচাই করে। অনুমোদন ছাড়া কোনো কনটেন্ট প্রকাশ করা হয় না এবং আপনার ব্যক্তিগত ঠিকানা বা GPS স্থানাঙ্ক কখনোই জনসম্মুখে প্রকাশ করা হয় না।'
            : 'Every citizen report goes through newsroom verification and mandatory editorial approval before publication. Private addresses and GPS coordinates are strictly shielded from public access.'}
        </p>
      </div>

      {!canSubmit ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center space-y-4">
          <Lock className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
            {isBn ? 'প্রতিবেদন পাঠাতে পাঠক অ্যাকাউন্টে লগইন করুন' : 'Sign In to Submit a Citizen Report'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            {isBn
              ? 'কপিরাইট স্বত্ব, সম্মতি সংরক্ষণ ও আপনার প্রতিবেদনের অগ্রগতি ট্র্যাক করার জন্য নিরাপদ লগইন প্রয়োজন।'
              : 'Account authentication ensures proper consent logging, privacy protection, and submission tracking.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/reader/login"
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
            >
              {isBn ? 'পাঠক লগইন করুন' : 'Reader Sign In'}
            </Link>
            <Link
              to="/reader/register"
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-50"
            >
              {isBn ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account'}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Type & Content */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              {isBn ? '১. প্রতিবেদনের ধরন ও বিবরণ' : '1. Report Type & Story Details'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUBMISSION_TYPES.map((t) => {
                const Icon = typeIcons[t.value] || FileText;
                const active = form.submission_type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateField('submission_type', t.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-rose-700 bg-rose-50 text-rose-900 shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-rose-700' : 'text-stone-500'}`} />
                    <div className="text-xs font-bold">{isBn ? t.labelBn : t.labelEn}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'বিভাগ (Category)' : 'Category'}
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
                >
                  <option value="">{isBn ? 'বিভাগ নির্বাচন করুন (ঐচ্ছিক)' : 'Select Category (Optional)'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isBn ? c.name : c.nameEn || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'ভাষা' : 'Language'}
                </label>
                <select
                  value={form.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
                >
                  <option value="bn">বাংলা</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {isBn ? 'শিরোনাম * (কমপক্ষে ৮ অক্ষর)' : 'Headline / Title * (min 8 chars)'}
              </label>
              <input
                type="text"
                required
                minLength={8}
                maxLength={300}
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={isBn ? 'ঘটনার স্পষ্ট ও সংক্ষিপ্ত শিরোনাম লিখুন' : 'Write a clear, factual headline'}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-rose-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {isBn ? 'সারসংক্ষেপ' : 'Summary'}
              </label>
              <textarea
                rows={2}
                value={form.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder={isBn ? 'ঘটনার মূল তথ্য ১-২ বাক্যে উল্লেখ করুন' : 'Brief summary of the incident or observation'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {isBn ? 'বিস্তারিত বিবরণ (প্রত্যক্ষদর্শীর তথ্য, সময় ও প্রেক্ষাপট)' : 'Full Story / Field Notes'}
              </label>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder={isBn ? 'কী ঘটেছে, কারা প্রভাবিত হয়েছে এবং আপনি কী দেখেছেন তা নিরপেক্ষভাবে লিখুন...' : 'Describe what happened factually...'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-rose-700 leading-relaxed"
              />
            </div>
          </section>

          {/* Step 2: Photo & Video Evidence */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              {isBn ? '২. ছবি বা ভিডিও সংযুক্তি (সর্বোচ্চ ৫টি ফাইল)' : '2. Photo or Video Attachments'}
            </h2>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-rose-600 rounded-2xl p-6 bg-stone-50/70 cursor-pointer transition-colors">
              <Upload className="w-7 h-7 text-rose-700 mb-2" />
              <span className="text-xs font-bold text-stone-800">
                {isBn ? 'ছবি (JPG/PNG/WEBP) অথবা ভিডিও (MP4/WEBM/MOV) নির্বাচন করুন' : 'Select photos or video files (max 50MB each)'}
              </span>
              <span className="text-[11px] text-stone-500 mt-1">
                {isBn ? 'গোপনীয়তা সুরক্ষায় ছবি থেকে স্বয়ংক্রিয়ভাবে EXIF/GPS তথ্য অপসারণ করা হয়' : 'EXIF/GPS camera metadata is stripped automatically when supported'}
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                {selectedFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                    <span className="font-medium truncate">{f.name}</span>
                    <span className="text-stone-500">{Math.round(f.size / 1024)} KB</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'বিকল্প ভিডিও/মিডিয়া লিংক (যদি থাকে)' : 'External Media URL (optional)'}
                </label>
                <input
                  type="url"
                  value={form.media_url}
                  onChange={(e) => updateField('media_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'ছবি বা ভিডিওর ক্যাপশন' : 'Media Caption'}
                </label>
                <input
                  type="text"
                  value={form.media_caption}
                  onChange={(e) => updateField('media_caption', e.target.value)}
                  placeholder={isBn ? 'ছবি/ভিডিওতে কী দেখা যাচ্ছে লিখুন' : 'Describe what is shown'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>
            </div>
          </section>

          {/* Step 3: Location & Privacy Protection */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-700" />
                <span>{isBn ? '৩. ঘটনাস্থলের তথ্য ও লোকেশন প্রাইভেসি' : '3. Location & Privacy Controls'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'জেলা *' : 'District *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  placeholder={isBn ? 'যেমন: বগুড়া, চট্টগ্রাম' : 'e.g. Dhaka, Bogura'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'বিভাগ' : 'Division'}
                </label>
                <select
                  value={form.division}
                  onChange={(e) => updateField('division', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
                >
                  {BANGLADESH_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'ঘটনার তারিখ ও সময়' : 'Incident Date & Time'}
                </label>
                <input
                  type="datetime-local"
                  value={form.incident_at}
                  onChange={(e) => updateField('incident_at', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {isBn ? 'জনসম্মুখে অবস্থান প্রকাশের নীতি' : 'Location Privacy Mode'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {LOCATION_PRIVACY_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateField('location_privacy_mode', mode.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      form.location_privacy_mode === mode.value
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{isBn ? mode.labelBn : mode.labelEn}</div>
                    <p className="text-[11px] opacity-80 leading-snug">{isBn ? mode.hintBn : mode.hintEn}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.location_privacy_mode === 'masked_approximate' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'জনসম্মুখে দৃশ্যমান সাধারণ এলাকা' : 'Public Approximate Area Label'}
                </label>
                <input
                  type="text"
                  value={form.public_location_label}
                  onChange={(e) => updateField('public_location_label', e.target.value)}
                  placeholder={isBn ? 'যেমন: মিরপুর ১০, ঢাকা' : 'e.g. Mirpur 10, Dhaka'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
                />
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-stone-700">
                {isBn ? 'প্রকাশনার পর পাঠকেরা দেখবেন:' : 'Public Readers Will See:'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-stone-300 font-bold text-stone-900">
                {publicLocationPreview || (isBn ? 'অবস্থান সম্পূর্ণ গোপন থাকবে' : 'Location Hidden')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn
                  ? 'শুধুমাত্র বার্তাকক্ষের জন্য সুনির্দিষ্ট ঠিকানা বা সূত্র (কখনোই প্রকাশিত হবে না)'
                  : 'Private Location Notes for Verification Desk Only (Never Public)'}
              </label>
              <input
                type="text"
                value={form.private_location_detail}
                onChange={(e) => updateField('private_location_detail', e.target.value)}
                placeholder={isBn ? 'যেমন: সড়ক নম্বর, ল্যান্ডমার্ক বা যোগাযোগের নিরাপদ তথ্য' : 'Exact landmark or verification note'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-rose-700"
              />
            </div>
          </section>

          {/* Step 4: Contributor Attribution & Mandatory Consents */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              {isBn ? '৪. পরিচয় প্রদর্শন ও বাধ্যতামূলক নিরাপত্তা ঘোষণা' : '4. Credit Mode & Safety Declarations'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'প্রতিবেদনে নাম প্রদর্শনের ধরন' : 'Public Attribution Mode'}
                </label>
                <select
                  value={form.credit_mode}
                  onChange={(e) => updateField('credit_mode', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-rose-700"
                >
                  {CREDIT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {isBn ? m.labelBn : m.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {form.credit_mode === 'alias' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isBn ? 'ক্রেডিট / ছদ্মনাম' : 'Alias Credit Name'}
                  </label>
                  <input
                    type="text"
                    value={form.attribution_credit}
                    onChange={(e) => updateField('attribution_credit', e.target.value)}
                    placeholder={isBn ? 'যেমন: সচেতন নাগরিক, বগুড়া' : 'e.g. Concerned Resident'}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2.5 bg-rose-50/50 border border-rose-200 rounded-xl p-4">
              <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>{isBn ? 'জমা দেওয়ার পূর্বে নিচের ৪টি বাধ্যতামূলক ঘোষণায় সম্মতি দিন:' : 'Mandatory Safety, Privacy & Copyright Declarations:'}</span>
              </p>

              {[
                {
                  key: 'consent_editorial_review',
                  bn: 'আমি সম্মতি দিচ্ছি যে আমার প্রেরিত প্রতিবেদন, ছবি বা ভিডিও বার্তাকক্ষের তথ্য যাচাই ও চূড়ান্ত সম্পাদকীয় অনুমোদন ছাড়া প্রকাশিত হবে না।',
                  en: 'I understand my submission undergoes editorial verification and requires editor approval before publishing.'
                },
                {
                  key: 'consent_privacy_policy',
                  bn: 'আমি গোপনীয়তা ও অবস্থান সুরক্ষা নীতিতে সম্মত এবং কোনো ব্যক্তির সংবেদনশীল ব্যক্তিগত তথ্য বেআইনিভাবে প্রকাশ করিনি।',
                  en: 'I agree to the Privacy Policy and confirm no unlawful disclosure of third-party personal data.'
                },
                {
                  key: 'copyright_declared',
                  bn: 'প্রেরিত লেখা ও তথ্যের মৌলিক কপিরাইট/স্বত্ব আমার অথবা বৈধভাবে সংবাদ প্রকাশের অনুমতিসহ প্রেরিত হয়েছে।',
                  en: 'I hold the copyright or lawful permission to share this story and information.'
                },
                {
                  key: 'media_ownership_declared',
                  bn: 'সংযুক্ত সকল ছবি/ভিডিও আমার নিজস্ব ধারণকৃত বা বৈধ মালিকানাধীন — এতে কোনো কৃত্রিম বিকৃতি বা কপিরাইট লঙ্ঘন নেই।',
                  en: 'All attached photos/videos are authentic, unaltered, and legitimately owned by me.'
                }
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-2.5 text-xs text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[item.key])}
                    onChange={(e) => updateField(item.key, e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-rose-700 focus:ring-rose-700"
                  />
                  <span>{isBn ? item.bn : item.en}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-stone-500">
                {consentStatus.valid
                  ? (isBn ? 'সকল নিরাপত্তা শর্ত পূরণ হয়েছে' : 'All safety declarations confirmed')
                  : (isBn ? 'জমা দিতে উপরের ৪টি শর্ত টিক দিন' : 'Check all 4 declarations to submit')}
              </span>
              <button
                type="submit"
                disabled={isLoading || !consentStatus.valid}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-sm font-bold shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isLoading
                    ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...')
                    : (isBn ? 'যাচাইয়ের জন্য প্রতিবেদন পাঠান' : 'Submit for Editorial Verification')}
                </span>
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}

export default CitizenSubmitPage;


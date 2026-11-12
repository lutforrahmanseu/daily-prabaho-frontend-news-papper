import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Award, MapPin, ShieldCheck, ArrowLeft, Flag, FileText, Camera, Video } from 'lucide-react';
import { useGetPublicContributorProfileQuery } from '../../store/api/citizenApi.js';
import { TRUST_LEVEL_META, SUBMISSION_TYPES } from '../../utils/citizenHelpers.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import SEO from '../../components/common/SEO.jsx';
import AbuseReportModal from '../../components/citizen/AbuseReportModal.jsx';

export function ContributorProfilePage() {
  const { handle } = useParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';
  const [reportOpen, setReportOpen] = useState(false);

  const { data, isLoading, isError } = useGetPublicContributorProfileQuery(handle);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-36 rounded-2xl bg-stone-200 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900 font-serif-bn">
          {isBn ? 'অবদানকারীর প্রোফাইল পাওয়া যায়নি' : 'Contributor Profile Not Found'}
        </h1>
        <Link to="/community" className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'কমিউনিটি পাতায় ফিরুন' : 'Back to Community'}</span>
        </Link>
      </div>
    );
  }

  const { profile, submissions = [] } = data;
  const trustMeta = TRUST_LEVEL_META[profile.trust_level] || TRUST_LEVEL_META.standard;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <SEO title={`${profile.display_name} — ${isBn ? 'নাগরিক প্রতিবেদক' : 'Citizen Contributor'}`} />

      <Link to="/community" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700">
        <ArrowLeft className="w-4 h-4" />
        <span>{isBn ? 'কমিউনিটি পোর্টালে ফিরুন' : 'Back to Community Hub'}</span>
      </Link>

      {/* Contributor Hero */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-700 to-stone-900 text-white font-extrabold text-2xl flex items-center justify-center shrink-0">
            {(profile.display_name || 'C').charAt(0)}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold font-serif-bn text-stone-900">{profile.display_name}</h1>
              {profile.verified_contributor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'যাচাইকৃত নাগরিক প্রতিবেদক' : 'Verified Contributor'}</span>
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${trustMeta.tone}`}>
                {isBn ? trustMeta.labelBn : trustMeta.labelEn}
              </span>
            </div>

            <p className="text-xs font-mono text-stone-500">@{profile.public_handle}</p>

            {profile.bio && <p className="text-sm text-stone-700 max-w-2xl leading-relaxed">{profile.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-600">
              {profile.city_district && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-700" />
                  <span>{profile.city_district}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-semibold">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isBn
                    ? `প্রকাশিত প্রতিবেদন: ${toBengaliNumber(profile.published_submissions || 0)}টি`
                    : `Published Reports: ${profile.published_submissions || 0}`}
                </span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 self-start cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5 text-rose-700" />
          <span>{isBn ? 'প্রোফাইল রিপোর্ট করুন' : 'Report Profile'}</span>
        </button>
      </div>

      {/* Published Non-Anonymous Contributions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-serif-bn text-stone-900">
          {isBn ? 'প্রকাশিত নাগরিক প্রতিবেদনসমূহ' : 'Published Contributions'}
        </h2>

        {submissions.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500">
            {isBn ? 'এই প্রোফাইল থেকে এখনো কোনো প্রকাশ্য প্রতিবেদন পাওয়া যায়নি।' : 'No non-anonymous published reports yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => {
              const typeMeta = SUBMISSION_TYPES.find((t) => t.value === sub.submission_type);
              const Icon = sub.submission_type === 'photo' ? Camera : sub.submission_type === 'video' ? Video : FileText;
              return (
                <article key={sub.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 hover:border-rose-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold">
                      <Icon className="w-3 h-3 text-rose-700" />
                      <span>{isBn ? typeMeta?.labelBn : typeMeta?.labelEn}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isBn ? 'তথ্য যাচাইকৃত' : 'Fact-Verified'}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-serif-bn text-stone-900 leading-snug">{sub.title}</h3>
                  {sub.summary && <p className="text-xs text-stone-600 line-clamp-3">{sub.summary}</p>}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <span>{sub.location || (isBn ? 'অবস্থান সুরক্ষিত' : 'Location protected')}</span>
                    <span>{sub.published_at ? formatBengaliRelativeTime(sub.published_at) : ''}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AbuseReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="contributor_profile"
        targetId={profile.id}
        targetTitle={profile.display_name}
        isBn={isBn}
      />
    </div>
  );
}

export default ContributorProfilePage;


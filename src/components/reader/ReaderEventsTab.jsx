import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Award,
  Calendar,
  Download,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Trophy,
  XCircle
} from 'lucide-react';
import {
  useCancelPhase23EventRegistrationMutation,
  useGetMyCertificatesQuery,
  useGetMyCompetitionEntriesQuery,
  useGetMyEventRegistrationsQuery
} from '../../store/api/eventsApi.js';
import {
  COMPETITION_ENTRY_STATUSES,
  PARTICIPANT_STATUS_META,
  openPrintableCertificate
} from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function ReaderEventsTab() {
  const { language } = useSelector((state) => state.ui);
  const { token: readerToken } = useSelector((state) => state.reader);
  const { token: adminToken } = useSelector((state) => state.auth);
  const effectiveToken = readerToken || adminToken || null;
  const isBn = language === 'bn';

  const { data: registrations = [], isLoading: loadingRegs } = useGetMyEventRegistrationsQuery();
  const { data: entries = [], isLoading: loadingEntries } = useGetMyCompetitionEntriesQuery();
  const { data: certificates = [], isLoading: loadingCerts } = useGetMyCertificatesQuery();
  const [cancelReg, { isLoading: cancelling }] = useCancelPhase23EventRegistrationMutation();

  const handleCancel = async (eventId) => {
    try {
      await cancelReg(eventId).unwrap();
      sweetAlert.success(isBn ? 'ইভেন্ট নিবন্ধন বাতিল করা হয়েছে।' : 'Registration cancelled.');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'বাতিল করা সম্ভব হয়নি' : 'Failed to cancel'));
    }
  };

  const handlePrintCert = async (certId) => {
    try {
      await openPrintableCertificate(certId, effectiveToken);
    } catch {
      sweetAlert.error(isBn ? 'সনদ ডাউনলোড করা যায়নি।' : 'Failed to open certificate.');
    }
  };

  if (loadingRegs || loadingEntries || loadingCerts) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 text-xs text-stone-500">
        {isBn ? 'ইভেন্ট, প্রতিযোগিতা ও সনদের তথ্য লোড হচ্ছে...' : 'Loading your events, entries & certificates...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Certificates */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-700" />
            <h2 className="text-base font-bold text-stone-900 font-serif-bn">
              {isBn ? 'আমার প্রাপ্ত সনদসমূহ' : 'My Official Certificates'}
            </h2>
          </div>
          <Link
            to="/certificates/verify"
            className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isBn ? 'সনদ যাচাই কেন্দ্র' : 'Verify Center'}</span>
          </Link>
        </div>

        {certificates.length === 0 ? (
          <p className="text-xs text-stone-500">
            {isBn
              ? 'এখনো কোনো ইভেন্ট বা প্রতিযোগিতার সনদ ইস্যু করা হয়নি।'
              : 'No event or competition certificates have been issued yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className={`border rounded-xl p-4 space-y-2 ${
                  cert.is_revoked ? 'bg-red-50/40 border-red-200' : 'bg-stone-50/60 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                    {cert.certificate_code}
                  </span>
                  {cert.is_revoked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      {isBn ? 'বাতিলকৃত' : 'Revoked'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      {cert.certificate_type}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-stone-900">{cert.achievement_title}</p>
                {cert.event && (
                  <Link to={`/events/${cert.event.slug}`} className="text-xs text-rose-700 font-semibold hover:underline block">
                    {cert.event.title}
                  </Link>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePrintCert(cert.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ডাউনলোড / প্রিন্ট' : 'Print / Download'}</span>
                  </button>
                  <Link
                    to={`/certificates/verify/${cert.certificate_code}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? 'যাচাই লিংক' : 'Verify'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Event Registrations */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-700" />
            <h2 className="text-base font-bold text-stone-900 font-serif-bn">
              {isBn ? 'আমার ইভেন্ট নিবন্ধন' : 'My Event Registrations'}
            </h2>
          </div>
          <Link to="/events" className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1">
            <span>{isBn ? 'সব ইভেন্ট দেখুন' : 'Explore Events'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registrations.length === 0 ? (
          <p className="text-xs text-stone-500">
            {isBn ? 'আপনি এখনো কোনো ইভেন্টে নিবন্ধন করেননি।' : 'You have not registered for any events yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => {
              const statusMeta = PARTICIPANT_STATUS_META[reg.status] || PARTICIPANT_STATUS_META.registered;
              const isActive = ['registered', 'confirmed', 'waitlisted'].includes(reg.status);
              return (
                <div key={reg.id} className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {reg.registration_code && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {reg.registration_code}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta.badgeClass}`}>
                        {isBn ? statusMeta.labelBn : statusMeta.labelEn}
                      </span>
                    </div>
                    {reg.event ? (
                      <>
                        <Link to={`/events/${reg.event.slug}`} className="text-sm font-bold text-stone-900 hover:text-rose-700 block">
                          {reg.event.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                          <span>{formatBengaliFullDateTime(reg.event.starts_at)}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {reg.event.location_label}
                          </span>
                        </div>
                        {reg.event.meeting_url && (
                          <a
                            href={reg.event.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline pt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{isBn ? 'অনলাইন মিটিং লিংক' : 'Join Meeting Link'}</span>
                          </a>
                        )}
                      </>
                    ) : null}
                  </div>
                  {isActive && reg.event && (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => handleCancel(reg.event.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 self-start"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isBn ? 'নিবন্ধন বাতিল' : 'Cancel RSVP'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Competition Submissions */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-stone-900 font-serif-bn">
            {isBn ? 'আমার প্রতিযোগিতা এন্ট্রি' : 'My Competition Submissions'}
          </h2>
        </div>

        {entries.length === 0 ? (
          <p className="text-xs text-stone-500">
            {isBn ? 'কোনো প্রতিযোগিতা প্রকল্প বা এন্ট্রি এখনো জমা দেওয়া হয়নি।' : 'No competition entries submitted yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const st = COMPETITION_ENTRY_STATUSES[entry.status] || COMPETITION_ENTRY_STATUSES.submitted;
              return (
                <div key={entry.id} className="border border-stone-200 rounded-xl p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-stone-600">{entry.entry_code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${st.badgeClass}`}>
                      {st.labelBn}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-stone-900">{entry.title}</p>
                  {entry.competition?.title && (
                    <p className="text-xs text-stone-600">{entry.competition.title}</p>
                  )}
                  {entry.award_title && (
                    <p className="text-xs font-bold text-emerald-700">
                      {isBn ? 'সম্মাননা:' : 'Award:'} {entry.award_title}
                    </p>
                  )}
                  {entry.event?.slug && (
                    <Link to={`/events/${entry.event.slug}`} className="inline-block text-xs font-bold text-rose-700 hover:underline pt-1">
                      {entry.event.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ReaderEventsTab;


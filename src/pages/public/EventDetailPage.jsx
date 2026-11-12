import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  MapPin,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
  X
} from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';
import {
  useCancelPhase23EventRegistrationMutation,
  useGetEventDetailQuery,
  useRegisterForPhase23EventMutation,
  useSubmitCompetitionEntryMutation
} from '../../store/api/eventsApi.js';
import {
  EVENT_LIFECYCLE_STATUSES,
  PARTICIPANT_STATUS_META,
  SPECIAL_PROJECT_TRACK_MAP,
  isRegistrationOpen,
  openPrintableCertificate,
  resolveEventMediaUrl,
  validateEventRegistrationForm
} from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function EventDetailPage() {
  const { slug } = useParams();
  const { language } = useSelector((state) => state.ui);
  const { reader, token: readerToken } = useSelector((state) => state.reader);
  const { user: adminUser, token: adminToken } = useSelector((state) => state.auth);
  const effectiveUser = reader || adminUser || null;
  const effectiveToken = readerToken || adminToken || null;
  const isBn = language === 'bn';

  const { data, isLoading, isError, refetch } = useGetEventDetailQuery(slug, { skip: !slug });
  const [registerEvent, { isLoading: registering }] = useRegisterForPhase23EventMutation();
  const [cancelReg, { isLoading: cancelling }] = useCancelPhase23EventRegistrationMutation();
  const [submitEntry, { isLoading: submittingEntry }] = useSubmitCompetitionEntryMutation();

  const [activeTab, setActiveTab] = useState('overview');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

  const [regForm, setRegForm] = useState({
    participant_name: effectiveUser?.name || '',
    participant_phone: '',
    organization: '',
    district: '',
    age_group: '',
    notes: '',
    consent_event_updates: true,
    consent_privacy_policy: false,
    consent_public_roster: false
  });

  const [entryCompetitionId, setEntryCompetitionId] = useState(null);
  const [entryForm, setEntryForm] = useState({
    title: '',
    team_or_participant_name: effectiveUser?.name || '',
    district: '',
    summary: '',
    content: '',
    external_url: '',
    file: null,
    consent_public_display: false
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-stone-500">
        {isBn ? 'ইভেন্টের বিস্তারিত লোড হচ্ছে...' : 'Loading event details...'}
      </div>
    );
  }

  if (isError || !data?.event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-base font-bold text-stone-800">
          {isBn ? 'ইভেন্টটি খুঁজে পাওয়া যায়নি।' : 'Event not found.'}
        </p>
        <Link to="/events" className="text-sm font-bold text-rose-700 hover:underline">
          {isBn ? 'ইভেন্ট কেন্দ্রে ফিরুন' : 'Back to Events'}
        </Link>
      </div>
    );
  }

  const {
    event,
    announcements = [],
    gallery = [],
    reports = [],
    competitions = [],
    my_registration: myReg,
    my_competition_entries: myEntries = [],
    my_certificates: myCerts = [],
    can_view_meeting_url: canViewMeetingUrl
  } = data;

  const canRegisterNow = isRegistrationOpen(event);
  const hasActiveReg = myReg && ['registered', 'confirmed', 'attended', 'waitlisted'].includes(myReg.status);
  const isConfirmedParticipant = myReg && ['registered', 'confirmed', 'attended'].includes(myReg.status);
  const statusMeta = EVENT_LIFECYCLE_STATUSES[event.status] || EVENT_LIFECYCLE_STATUSES.published;
  const trackMeta = event.project_track ? SPECIAL_PROJECT_TRACK_MAP[event.project_track] : null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const validation = validateEventRegistrationForm(regForm, event);
    if (!validation.valid) {
      sweetAlert.error(validation.errors[0]);
      return;
    }

    try {
      const res = await registerEvent({
        eventId: event.id,
        ...regForm
      }).unwrap();
      setShowRegisterModal(false);
      sweetAlert.success(
        res?.status === 'waitlisted'
          ? isBn
            ? 'আসন পূর্ণ থাকায় আপনাকে অপেক্ষমাণ তালিকায় যুক্ত করা হয়েছে।'
            : 'Added to the waitlist.'
          : isBn
          ? `নিবন্ধন সম্পন্ন! কোড: ${res?.registration_code || ''}`
          : 'Registration successful!'
      );
      refetch();
    } catch (err) {
      const firstErr =
        err?.data?.errors ? Object.values(err.data.errors).flat()[0] : null;
      sweetAlert.error(firstErr || err?.data?.message || (isBn ? 'নিবন্ধন ব্যর্থ হয়েছে' : 'Registration failed'));
    }
  };

  const handleCancelReg = async () => {
    try {
      await cancelReg(event.id).unwrap();
      sweetAlert.success(isBn ? 'নিবন্ধন বাতিল করা হয়েছে।' : 'Registration cancelled.');
      refetch();
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'বাতিল করা সম্ভব হয়নি' : 'Failed to cancel'));
    }
  };

  const handleSubmitCompetition = async (e) => {
    e.preventDefault();
    if (!entryCompetitionId) return;
    if (entryForm.title.trim().length < 3) {
      sweetAlert.error(isBn ? 'প্রকল্প বা রচনার শিরোনাম লিখুন।' : 'Enter an entry title.');
      return;
    }

    const fd = new FormData();
    fd.append('title', entryForm.title.trim());
    if (entryForm.team_or_participant_name) fd.append('team_or_participant_name', entryForm.team_or_participant_name.trim());
    if (entryForm.district) fd.append('district', entryForm.district.trim());
    if (entryForm.summary) fd.append('summary', entryForm.summary.trim());
    if (entryForm.content) fd.append('content', entryForm.content.trim());
    if (entryForm.external_url) fd.append('external_url', entryForm.external_url.trim());
    fd.append('consent_public_display', entryForm.consent_public_display ? '1' : '0');
    if (entryForm.file) {
      fd.append('file', entryForm.file);
    }

    try {
      const res = await submitEntry({ competitionId: entryCompetitionId, body: fd }).unwrap();
      setEntryCompetitionId(null);
      setEntryForm({
        title: '',
        team_or_participant_name: effectiveUser?.name || '',
        district: '',
        summary: '',
        content: '',
        external_url: '',
        file: null,
        consent_public_display: false
      });
      sweetAlert.success(
        isBn
          ? `আপনার এন্ট্রি (${res?.entry_code || ''}) সফলভাবে গৃহীত হয়েছে।`
          : 'Competition entry submitted!'
      );
      refetch();
    } catch (err) {
      const firstErr =
        err?.data?.errors ? Object.values(err.data.errors).flat()[0] : null;
      sweetAlert.error(firstErr || err?.data?.message || (isBn ? 'জমা ব্যর্থ হয়েছে' : 'Submission failed'));
    }
  };

  const handleDownloadCert = async (certId) => {
    try {
      await openPrintableCertificate(certId, effectiveToken);
    } catch {
      sweetAlert.error(isBn ? 'সনদ খোলা সম্ভব হয়নি।' : 'Unable to open certificate.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SEO title={event.title} description={event.summary || event.title} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link to="/events" className="inline-flex items-center gap-1 font-bold text-stone-600 hover:text-rose-700">
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'ইভেন্ট কেন্দ্রে ফিরুন' : 'All Events'}</span>
        </Link>
        {event.special_project && (
          <Link
            to={`/events/projects/${event.special_project.slug}`}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            {isBn ? 'প্রকল্প:' : 'Project:'} {event.special_project.title} →
          </Link>
        )}
      </div>

      {/* Main Event Hero Card */}
      <section className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        {event.cover_image_url && (
          <img
            src={resolveEventMediaUrl(event.cover_image_url)}
            alt={event.title}
            className="w-full h-56 sm:h-80 object-cover"
          />
        )}

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-stone-100 text-stone-800">
                  {event.category.name}
                </span>
              )}
              {trackMeta && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${trackMeta.badgeClass}`}>
                  {isBn ? trackMeta.labelBn : trackMeta.labelEn}
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${statusMeta.badgeClass}`}>
                {isBn ? statusMeta.labelBn : statusMeta.labelEn}
              </span>
              {event.is_competition && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  <Trophy className="w-3.5 h-3.5" />
                  {isBn ? 'প্রতিযোগিতা সংযুক্ত' : 'Competition Event'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-serif-bn leading-tight">
              {event.title}
            </h1>
            {event.summary && <p className="text-sm text-stone-600 leading-relaxed">{event.summary}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 pt-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">{isBn ? 'সময়সূচি' : 'Schedule'}</p>
                  <p>{formatBengaliFullDateTime(event.starts_at)}</p>
                  {event.ends_at && <p className="text-[11px] text-stone-500">→ {formatBengaliFullDateTime(event.ends_at)}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">{isBn ? 'স্থান ও মাধ্যম' : 'Venue & District'}</p>
                  <p>{event.location_label}</p>
                  {event.venue_address && <p className="text-[11px] text-stone-500">{event.venue_address}</p>}
                  {event.district && <p className="text-[11px] font-semibold text-stone-700">{event.district}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Registration & Privacy Status Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 self-start">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-600 inline-flex items-center gap-1">
                <Users className="w-4 h-4 text-stone-500" />
                {isBn ? 'অংশগ্রহণকারী' : 'Registered'}
              </span>
              <span className="font-black text-stone-900">
                {event.capacity
                  ? isBn
                    ? `${toBengaliNumber(event.registered_count)} / ${toBengaliNumber(event.capacity)}`
                    : `${event.registered_count} / ${event.capacity}`
                  : isBn
                  ? toBengaliNumber(event.registered_count)
                  : event.registered_count}
              </span>
            </div>

            {event.registration_deadline_at && (
              <p className="text-[11px] text-stone-600">
                <strong>{isBn ? 'নিবন্ধনের শেষ সময়:' : 'Registration Deadline:'}</strong>{' '}
                {formatBengaliFullDateTime(event.registration_deadline_at)}
              </p>
            )}

            {event.eligibility_note && (
              <p className="text-[11px] text-stone-600 bg-white border border-stone-200 rounded-lg p-2.5">
                <strong>{isBn ? 'যোগ্যতা:' : 'Eligibility:'}</strong> {event.eligibility_note}
              </p>
            )}

            {hasActiveReg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {PARTICIPANT_STATUS_META[myReg.status]?.labelBn || myReg.status}
                  </span>
                  {myReg.registration_code && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800">
                      {myReg.registration_code}
                    </span>
                  )}
                </div>

                {canViewMeetingUrl && event.meeting_url && (
                  <a
                    href={event.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অনলাইন মিটিংয়ে যুক্ত হোন' : 'Join Online Session'}</span>
                  </a>
                )}

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelReg}
                  className="w-full py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-700 hover:text-red-700 hover:border-red-200"
                >
                  {isBn ? 'নিবন্ধন বাতিল করুন' : 'Cancel Registration'}
                </button>
              </div>
            ) : canRegisterNow ? (
              effectiveUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setRegForm((prev) => ({ ...prev, participant_name: prev.participant_name || effectiveUser.name || '' }));
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-black shadow-sm"
                >
                  {event.capacity !== null &&
                  event.registered_count >= event.capacity &&
                  event.allow_waitlist
                    ? isBn
                      ? 'অপেক্ষমাণ তালিকায় নিবন্ধন করুন'
                      : 'Join Waitlist'
                    : isBn
                    ? 'ইভেন্টে নিবন্ধন করুন'
                    : 'Register Now'}
                </button>
              ) : (
                <Link
                  to="/reader/login"
                  className="block text-center w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
                >
                  {isBn ? 'নিবন্ধন করতে পাঠক অ্যাকাউন্টে লগইন করুন' : 'Sign in to Register'}
                </Link>
              )
            ) : (
              <div className="bg-stone-200/70 rounded-xl p-3 text-center text-xs font-bold text-stone-600">
                {isBn ? 'নিবন্ধন বন্ধ রয়েছে' : 'Registration Closed'}
              </div>
            )}

            <p className="text-[10px] text-stone-500 flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0 text-stone-400 mt-0.5" />
              <span>
                {isBn
                  ? 'গোপনীয়তা সুরক্ষা: অংশগ্রহণকারীর ফোন ও ব্যক্তিগত তথ্য জনসম্মুখে প্রকাশ করা হয় না।'
                  : 'Participant privacy protected: contact details remain restricted to authorized event staff.'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'overview', labelBn: 'বিবরণ ও ঘোষণা', labelEn: 'Overview & Notices', count: announcements.length },
          ...(competitions.length > 0 || event.is_competition
            ? [{ id: 'competitions', labelBn: 'প্রতিযোগিতা ও ফলাফল', labelEn: 'Competitions & Results', count: competitions.length }]
            : []),
          { id: 'gallery', labelBn: 'ছবি ও ভিডিও গ্যালারি', labelEn: 'Gallery', count: gallery.length },
          { id: 'reports', labelBn: 'ইভেন্ট প্রতিবেদন', labelEn: 'Reports', count: reports.length },
          ...(myCerts.length > 0
            ? [{ id: 'certificates', labelBn: 'আমার সনদ', labelEn: 'My Certificates', count: myCerts.length }]
            : [])
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-rose-700 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {isBn ? tab.labelBn : tab.labelEn}{' '}
            {tab.count > 0 && `(${isBn ? toBengaliNumber(tab.count) : tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-stone-900 font-serif-bn">
              {isBn ? 'বিস্তারিত বিবরণ' : 'About This Event'}
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            {event.organizer_name && (
              <p className="text-xs text-stone-500 pt-3 border-t border-stone-100">
                <strong>{isBn ? 'আয়োজক:' : 'Organizer:'}</strong> {event.organizer_name}
              </p>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-stone-900 font-serif-bn flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-700" />
              <span>{isBn ? 'ইভেন্ট ঘোষণাবলি' : 'Announcements'}</span>
            </h3>
            {announcements.length === 0 ? (
              <p className="text-xs text-stone-500">
                {isBn ? 'কোনো নতুন ঘোষণা নেই।' : 'No announcements yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-3.5 rounded-xl border space-y-1 ${
                      ann.priority === 'urgent'
                        ? 'bg-red-50/70 border-red-200'
                        : ann.is_pinned
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <p className="text-xs font-black text-stone-900">{ann.title}</p>
                    <p className="text-xs text-stone-700 leading-relaxed">{ann.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'competitions' && (
        <div className="space-y-6">
          {competitions.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
              {isBn ? 'প্রতিযোগিতার ট্র্যাক শীঘ্রই প্রকাশ করা হবে।' : 'Competition tracks will open soon.'}
            </div>
          ) : (
            competitions.map((comp) => (
              <div key={comp.id} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      <h2 className="text-lg font-black text-stone-900 font-serif-bn">{comp.title}</h2>
                    </div>
                    {comp.track_name && <p className="text-xs font-bold text-rose-700 mt-1">{comp.track_name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 uppercase">
                      {comp.status}
                    </span>
                    {comp.status === 'open' && !comp.results_published && isConfirmedParticipant && (
                      <button
                        type="button"
                        onClick={() => setEntryCompetitionId(comp.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isBn ? 'প্রকল্প / এন্ট্রি জমা দিন' : 'Submit Entry'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {comp.description && <p className="text-xs text-stone-700 leading-relaxed">{comp.description}</p>}
                {comp.rules && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 space-y-1">
                    <p className="font-bold text-stone-900">{isBn ? 'নিয়মাবলি:' : 'Rules & Guidelines:'}</p>
                    <p className="whitespace-pre-line">{comp.rules}</p>
                  </div>
                )}

                {/* Results Leaderboard ONLY when officially published */}
                {comp.results_published ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>{isBn ? 'অফিশিয়াল বিজয়ী ও ফলাফল তালিকা' : 'Official Published Results'}</span>
                    </h3>
                    {comp.winners?.length === 0 ? (
                      <p className="text-xs text-stone-600">
                        {isBn ? 'ফলাফল তালিকা হালনাগাদ হচ্ছে।' : 'Results list is updating.'}
                      </p>
                    ) : (
                      <div className="divide-y divide-emerald-200/70 bg-white rounded-xl border border-emerald-200">
                        {comp.winners.map((w) => (
                          <div key={w.id} className="p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-black text-rose-700 mr-2">
                                #{w.rank_position || '—'}
                              </span>
                              <span className="font-bold text-stone-900">{w.winner_display_name}</span>
                              <p className="text-[11px] text-stone-600 mt-0.5">{w.title}</p>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              {w.award_title || w.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    {isBn
                      ? 'বিচারকদের মূল্যায়ন শেষে আনুষ্ঠানিকভাবে ফলাফল এখানে প্রকাশ করা হবে।'
                      : 'Official results remain hidden until evaluated and published by the editorial board.'}
                  </p>
                )}
              </div>
            ))
          )}

          {myEntries.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-base font-black text-stone-900 font-serif-bn">
                {isBn ? 'এই ইভেন্টে আপনার জমাকৃত এন্ট্রি' : 'Your Submitted Entries'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myEntries.map((ent) => (
                  <div key={ent.id} className="border border-stone-200 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-stone-600">{ent.entry_code}</span>
                      <span className="font-bold uppercase text-rose-700">{ent.status}</span>
                    </div>
                    <p className="font-bold text-stone-900">{ent.title}</p>
                    {ent.award_title && <p className="font-bold text-emerald-700">{ent.award_title}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          {gallery.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">
              {isBn ? 'এখনো কোনো গ্যালারি ছবি বা ভিডিও যুক্ত করা হয়নি।' : 'No gallery items published yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setLightboxItem(g)}
                  className="border border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:border-rose-300 transition bg-stone-50"
                >
                  {g.media_type === 'video' ? (
                    <video
                      src={resolveEventMediaUrl(g.url)}
                      controls
                      className="w-full h-48 object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={resolveEventMediaUrl(g.url)}
                      alt={g.caption || event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {(g.caption || g.credit_text) && (
                    <div className="p-3 text-xs space-y-0.5">
                      {g.caption && <p className="font-semibold text-stone-800">{g.caption}</p>}
                      {g.credit_text && <p className="text-[10px] text-stone-500">{g.credit_text}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
              {isBn ? 'ইভেন্ট পরবর্তী প্রতিবেদন এখনো প্রকাশিত হয়নি।' : 'No event reports published yet.'}
            </div>
          ) : (
            reports.map((rep) => (
              <article key={rep.id} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-stone-900 font-serif-bn">{rep.title}</h2>
                  {rep.attendance_count !== null && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {isBn ? `মোট উপস্থিতি: ${toBengaliNumber(rep.attendance_count)}` : `Attendance: ${rep.attendance_count}`}
                    </span>
                  )}
                </div>
                {rep.summary && <p className="text-xs font-semibold text-stone-600">{rep.summary}</p>}
                {rep.impact_metrics && typeof rep.impact_metrics === 'object' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(rep.impact_metrics).map(([k, v]) => (
                      <div key={k} className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
                        <p className="text-stone-500 uppercase text-[10px] font-bold">{k.replace(/_/g, ' ')}</p>
                        <p className="text-base font-black text-stone-900 mt-0.5">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{rep.body}</p>
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCerts.map((cert) => (
            <div key={cert.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">
                  {cert.certificate_code}
                </span>
                <span className="text-[11px] font-bold uppercase text-emerald-700">{cert.certificate_type}</span>
              </div>
              <p className="text-sm font-black text-stone-900">{cert.achievement_title}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownloadCert(cert.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সনদ ডাউনলোড' : 'Download Certificate'}</span>
                </button>
                <Link
                  to={`/certificates/verify/${cert.certificate_code}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'যাচাই করুন' : 'Verify'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 font-serif-bn">
                {isBn ? 'ইভেন্ট নিবন্ধন ফর্ম' : 'Event Registration'}
              </h3>
              <button type="button" onClick={() => setShowRegisterModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'অংশগ্রহণকারীর পূর্ণ নাম *' : 'Participant Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={regForm.participant_name}
                  onChange={(e) => setRegForm({ ...regForm, participant_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? `মোবাইল নম্বর ${event.require_phone ? '*' : ''}` : `Phone ${event.require_phone ? '*' : ''}`}
                  </label>
                  <input
                    type="text"
                    required={Boolean(event.require_phone)}
                    value={regForm.participant_phone}
                    onChange={(e) => setRegForm({ ...regForm, participant_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'জেলা' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={regForm.district}
                    onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? `প্রতিষ্ঠান / সংগঠন ${event.require_organization ? '*' : ''}` : `Organization ${event.require_organization ? '*' : ''}`}
                  </label>
                  <input
                    type="text"
                    required={Boolean(event.require_organization)}
                    value={regForm.organization}
                    onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'বয়স সীমা / শ্রেণি' : 'Age Group / Track'}
                  </label>
                  <input
                    type="text"
                    value={regForm.age_group}
                    onChange={(e) => setRegForm({ ...regForm, age_group: e.target.value })}
                    placeholder="যেমন: ১৮–২৫ বা স্কুল পর্যায়"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regForm.consent_event_updates}
                    onChange={(e) => setRegForm({ ...regForm, consent_event_updates: e.target.checked })}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'ইভেন্টের সময়সূচি ও জরুরি ঘোষণা গ্রহণে সম্মতি দিচ্ছি *'
                      : 'I consent to receive essential event updates *'}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regForm.consent_privacy_policy}
                    onChange={(e) => setRegForm({ ...regForm, consent_privacy_policy: e.target.checked })}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'প্রাইভেসি নীতিমালা মেনে আমার তথ্য আয়োজক কর্তৃক সংরক্ষণে সম্মত *'
                      : 'I agree to the participant privacy policy *'}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer text-stone-600">
                  <input
                    type="checkbox"
                    checked={regForm.consent_public_roster}
                    onChange={(e) => setRegForm({ ...regForm, consent_public_roster: e.target.checked })}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'বিজয়ী হলে জনসম্মুখে আমার পূর্ণ নাম প্রদর্শনের অনুমতি দিচ্ছি (ঐচ্ছিক)'
                      : 'Allow displaying my full name in public winner lists (optional)'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm"
              >
                {registering ? (isBn ? 'প্রক্রিয়াকরণ...' : 'Submitting...') : isBn ? 'নিবন্ধন নিশ্চিত করুন' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Competition Entry Submission Modal */}
      {entryCompetitionId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 font-serif-bn">
                {isBn ? 'প্রতিযোগিতা প্রকল্প জমা' : 'Submit Competition Entry'}
              </h3>
              <button type="button" onClick={() => setEntryCompetitionId(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitCompetition} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'প্রকল্প / রচনার শিরোনাম *' : 'Entry Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={entryForm.title}
                  onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'অংশগ্রহণকারী / দলের নাম' : 'Team / Participant Name'}
                  </label>
                  <input
                    type="text"
                    value={entryForm.team_or_participant_name}
                    onChange={(e) => setEntryForm({ ...entryForm, team_or_participant_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{isBn ? 'জেলা' : 'District'}</label>
                  <input
                    type="text"
                    value={entryForm.district}
                    onChange={(e) => setEntryForm({ ...entryForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{isBn ? 'সংক্ষিপ্ত সারসংক্ষেপ' : 'Summary'}</label>
                <textarea
                  rows={2}
                  value={entryForm.summary}
                  onChange={(e) => setEntryForm({ ...entryForm, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{isBn ? 'বিস্তারিত / রচনা (ঐচ্ছিক)' : 'Submission Body'}</label>
                <textarea
                  rows={3}
                  value={entryForm.content}
                  onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{isBn ? 'ফাইল সংযুক্তি (PDF/ছবি/ZIP)' : 'Attachment'}</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
                  onChange={(e) => setEntryForm({ ...entryForm, file: e.target.files?.[0] || null })}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{isBn ? 'বিকল্প লিংক (URL)' : 'External Link (Optional)'}</label>
                <input
                  type="url"
                  value={entryForm.external_url}
                  onChange={(e) => setEntryForm({ ...entryForm, external_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={entryForm.consent_public_display}
                  onChange={(e) => setEntryForm({ ...entryForm, consent_public_display: e.target.checked })}
                  className="mt-0.5 accent-rose-700"
                />
                <span>
                  {isBn
                    ? 'ফলাফল প্রকাশিত হলে পূর্ণ নাম প্রদর্শনে সম্মতি দিচ্ছি (অন্যথায় আংশিক নাম প্রদর্শিত হবে)'
                    : 'Allow displaying full name if selected in published results'}
                </span>
              </label>
              <button
                type="submit"
                disabled={submittingEntry}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm"
              >
                {submittingEntry ? (isBn ? 'জমা হচ্ছে...' : 'Uploading...') : isBn ? 'এন্ট্রি জমা দিন' : 'Submit Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                {lightboxItem.caption || event.title}
              </span>
              <button type="button" onClick={() => setLightboxItem(null)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            {lightboxItem.media_type === 'video' ? (
              <video src={resolveEventMediaUrl(lightboxItem.url)} controls className="w-full max-h-[75vh] bg-black" />
            ) : (
              <img
                src={resolveEventMediaUrl(lightboxItem.url)}
                alt={lightboxItem.caption || event.title}
                className="w-full max-h-[75vh] object-contain bg-stone-950"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetailPage;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Bell,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
  XCircle
} from 'lucide-react';
import {
  useAddEventGalleryItemMutation,
  useBulkIssueEventCertificatesMutation,
  useCheckInParticipantByCodeMutation,
  useCreateEventAnnouncementMutation,
  useCreateEventCompetitionMutation,
  useCreateEventReportMutation,
  useDeleteEventAnnouncementMutation,
  useDeleteEventGalleryItemMutation,
  useGetAdminCompetitionEntriesQuery,
  useGetAdminEventCertificatesQuery,
  useGetAdminEventDetailQuery,
  useGetAdminEventParticipantsQuery,
  useIssueEventCertificateMutation,
  useJudgeCompetitionEntryMutation,
  usePublishCompetitionResultsMutation,
  useRevokeEventCertificateMutation,
  useUpdateAdminParticipantMutation
} from '../../store/api/eventsApi.js';
import {
  CERTIFICATE_TYPES,
  COMPETITION_ENTRY_STATUSES,
  EVENT_ANNOUNCEMENT_TYPES,
  PARTICIPANT_STATUS_META,
  openPrintableCertificate,
  resolveEventMediaUrl
} from '../../utils/eventsHelpers.js';
import { formatBengaliFullDateTime, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export default function AdminEventWorkspace({
  eventId,
  hasManagePerm,
  hasParticipantsPerm,
  hasJudgePerm,
  hasResultsPerm,
  isBn,
  effectiveToken,
  onClose
}) {
  const defaultTab = hasParticipantsPerm
    ? 'participants'
    : hasJudgePerm || hasResultsPerm
    ? 'competitions'
    : 'announcements';

  const [tab, setTab] = useState(defaultTab);
  const [partSearch, setPartSearch] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [judgingEntry, setJudgingEntry] = useState(null);

  const { data: event, isLoading, refetch: refetchDetail } = useGetAdminEventDetailQuery(eventId);
  const { data: participants = [], refetch: refetchParticipants } = useGetAdminEventParticipantsQuery(
    { eventId, search: partSearch || undefined },
    { skip: !hasParticipantsPerm || tab !== 'participants' }
  );
  const { data: certificates = [], refetch: refetchCerts } = useGetAdminEventCertificatesQuery(eventId, {
    skip: (!hasResultsPerm && !hasParticipantsPerm) || tab !== 'certificates'
  });

  const activeCompId = selectedCompetitionId || event?.competitions?.[0]?.id || null;
  const { data: compEntries = [], refetch: refetchEntries } = useGetAdminCompetitionEntriesQuery(activeCompId, {
    skip: (!hasJudgePerm && !hasResultsPerm) || !activeCompId || tab !== 'competitions'
  });

  const [updateParticipant] = useUpdateAdminParticipantMutation();
  const [checkInByCode] = useCheckInParticipantByCodeMutation();
  const [createAnnouncement] = useCreateEventAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteEventAnnouncementMutation();
  const [addGallery] = useAddEventGalleryItemMutation();
  const [deleteGallery] = useDeleteEventGalleryItemMutation();
  const [createReport] = useCreateEventReportMutation();
  const [createCompetition] = useCreateEventCompetitionMutation();
  const [judgeEntry] = useJudgeCompetitionEntryMutation();
  const [publishResults] = usePublishCompetitionResultsMutation();
  const [issueCertificate] = useIssueEventCertificateMutation();
  const [bulkIssueCerts] = useBulkIssueEventCertificatesMutation();
  const [revokeCert] = useRevokeEventCertificateMutation();

  const [annForm, setAnnForm] = useState({
    title: '',
    body: '',
    announcement_type: 'general',
    priority: 'normal',
    is_pinned: false
  });
  const [galForm, setGalForm] = useState({
    media_type: 'photo',
    external_url: '',
    caption: '',
    credit_text: '',
    file: null
  });
  const [repForm, setRepForm] = useState({
    title: '',
    summary: '',
    body: '',
    attendance_count: '',
    is_published: true,
    create_news_draft: false
  });
  const [compForm, setCompForm] = useState({
    title: '',
    track_name: '',
    description: '',
    rules: '',
    max_entries_per_user: 1
  });
  const [judgeForm, setJudgeForm] = useState({
    status: 'shortlisted',
    judge_score: '',
    rank_position: '',
    award_title: '',
    judge_notes: ''
  });
  const [certForm, setCertForm] = useState({
    user_id: '',
    certificate_type: 'winner',
    recipient_display_name: '',
    achievement_title: ''
  });

  if (isLoading || !event) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 text-xs text-stone-500">
        {isBn ? 'ইভেন্ট ওয়ার্কস্পেস লোড হচ্ছে...' : 'Loading event workspace...'}
      </div>
    );
  }

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;
    try {
      await checkInByCode({ eventId, registration_code: checkInCode.trim() }).unwrap();
      setCheckInCode('');
      sweetAlert.success(isBn ? 'চেক-ইন সম্পন্ন হয়েছে।' : 'Checked in.');
      refetchParticipants();
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'কোড পাওয়া যায়নি।' : 'Check-in failed.'));
    }
  };

  const handleParticipantStatus = async (regId, status) => {
    try {
      await updateParticipant({ registrationId: regId, status }).unwrap();
      sweetAlert.success(isBn ? 'অংশগ্রহণকারীর অবস্থা হালনাগাদ হয়েছে।' : 'Status updated.');
      refetchParticipants();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Update failed');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement({ eventId, ...annForm, is_published: true }).unwrap();
      setAnnForm({ title: '', body: '', announcement_type: 'general', priority: 'normal', is_pinned: false });
      sweetAlert.success(isBn ? 'ঘোষণা প্রকাশিত হয়েছে।' : 'Announcement published.');
      refetchDetail();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed');
    }
  };

  const handleAddGallery = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('media_type', galForm.media_type);
    if (galForm.file) fd.append('file', galForm.file);
    if (galForm.external_url) fd.append('external_url', galForm.external_url.trim());
    if (galForm.caption) fd.append('caption', galForm.caption.trim());
    if (galForm.credit_text) fd.append('credit_text', galForm.credit_text.trim());
    fd.append('is_published', '1');
    try {
      await addGallery({ eventId, body: fd }).unwrap();
      setGalForm({ media_type: 'photo', external_url: '', caption: '', credit_text: '', file: null });
      sweetAlert.success(isBn ? 'গ্যালারি আইটেম যুক্ত হয়েছে।' : 'Gallery item added.');
      refetchDetail();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Upload failed');
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await createReport({
        eventId,
        ...repForm,
        attendance_count: repForm.attendance_count ? Number(repForm.attendance_count) : null
      }).unwrap();
      setRepForm({ title: '', summary: '', body: '', attendance_count: '', is_published: true, create_news_draft: false });
      sweetAlert.success(isBn ? 'ইভেন্ট প্রতিবেদন সংরক্ষিত হয়েছে।' : 'Event report saved.');
      refetchDetail();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed to save report');
    }
  };

  const handleCreateComp = async (e) => {
    e.preventDefault();
    try {
      await createCompetition({ eventId, ...compForm, max_entries_per_user: Number(compForm.max_entries_per_user || 1) }).unwrap();
      setCompForm({ title: '', track_name: '', description: '', rules: '', max_entries_per_user: 1 });
      sweetAlert.success(isBn ? 'প্রতিযোগিতা তৈরি হয়েছে।' : 'Competition created.');
      refetchDetail();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed to create competition');
    }
  };

  const handleJudgeSubmit = async (e) => {
    e.preventDefault();
    if (!judgingEntry) return;
    try {
      await judgeEntry({
        entryId: judgingEntry.id,
        status: judgeForm.status,
        judge_score: judgeForm.judge_score !== '' ? Number(judgeForm.judge_score) : null,
        rank_position: judgeForm.rank_position !== '' ? Number(judgeForm.rank_position) : null,
        award_title: judgeForm.award_title || null,
        judge_notes: judgeForm.judge_notes || null
      }).unwrap();
      setJudgingEntry(null);
      sweetAlert.success(isBn ? 'মূল্যায়ন সংরক্ষিত হয়েছে।' : 'Entry judged.');
      refetchEntries();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Failed');
    }
  };

  const handlePublishResults = async (competitionId) => {
    try {
      await publishResults({ competitionId, create_announcement: true }).unwrap();
      sweetAlert.success(isBn ? 'প্রতিযোগিতার ফলাফল প্রকাশিত হয়েছে।' : 'Competition results published.');
      refetchDetail();
      refetchEntries();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Publish failed');
    }
  };

  const handleBulkIssue = async () => {
    try {
      const res = await bulkIssueCerts(eventId).unwrap();
      sweetAlert.success(isBn ? `মোট ${toBengaliNumber(res?.issued_count || 0)}টি সনদ ইস্যু করা হয়েছে।` : `Issued ${res?.issued_count || 0} certificates.`);
      refetchCerts();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Bulk issue failed');
    }
  };

  const handleIssueCustomCert = async (e) => {
    e.preventDefault();
    try {
      await issueCertificate({ eventId, ...certForm, user_id: Number(certForm.user_id) }).unwrap();
      setCertForm({ user_id: '', certificate_type: 'winner', recipient_display_name: '', achievement_title: '' });
      sweetAlert.success(isBn ? 'সনদ সফলভাবে ইস্যু হয়েছে।' : 'Certificate issued.');
      refetchCerts();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Issue failed');
    }
  };

  const handleRevoke = async (certId) => {
    const reason = window.prompt(isBn ? 'সনদ বাতিলের কারণ লিখুন:' : 'Revocation reason:');
    if (!reason || reason.trim().length < 3) return;
    try {
      await revokeCert({ certificateId: certId, reason: reason.trim() }).unwrap();
      sweetAlert.success(isBn ? 'সনদ বাতিল করা হয়েছে।' : 'Certificate revoked.');
      refetchCerts();
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'Revoke failed');
    }
  };

  const tabs = [
    ...(hasParticipantsPerm ? [{ id: 'participants', labelBn: 'অংশগ্রহণকারী ও চেক-ইন', icon: Users }] : []),
    ...(hasManagePerm ? [{ id: 'announcements', labelBn: 'ঘোষণা', icon: Bell }] : []),
    ...(hasManagePerm ? [{ id: 'gallery', labelBn: 'গ্যালারি', icon: ImageIcon }] : []),
    ...(hasManagePerm ? [{ id: 'reports', labelBn: 'প্রতিবেদন', icon: BarChart3 }] : []),
    ...(hasManagePerm || hasJudgePerm || hasResultsPerm ? [{ id: 'competitions', labelBn: 'প্রতিযোগিতা ও বিচার', icon: Trophy }] : []),
    ...(hasResultsPerm || hasParticipantsPerm ? [{ id: 'certificates', labelBn: 'সনদ ব্যবস্থাপনা', icon: Award }] : [])
  ];

  return (
    <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            {isBn ? 'ইভেন্ট ওয়ার্কস্পেস' : 'Event Workspace'}
          </span>
          <h2 className="text-lg font-black text-stone-900 font-serif-bn">{event.title}</h2>
          <p className="text-xs text-stone-500">
            {formatBengaliFullDateTime(event.starts_at)} • {event.location_label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/events/${event.slug}`}
            target="_blank"
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            {isBn ? 'পাবলিক পেজ' : 'Public View'}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600"
            aria-label="Close workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                tab === t.id
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* PARTICIPANTS & CHECK-IN */}
      {tab === 'participants' && hasParticipantsPerm && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <input
              type="text"
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
              placeholder={isBn ? 'নাম, জেলা বা নিবন্ধন কোড খুঁজুন...' : 'Search participants...'}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
            />
            <form onSubmit={handleCheckIn} className="flex gap-2">
              <input
                type="text"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                placeholder="REG-202611-... দ্রুত চেক-ইন"
                className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-lg border border-stone-300 bg-white"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold">
                {isBn ? 'চেক-ইন' : 'Check In'}
              </button>
            </form>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="p-3">{isBn ? 'কোড ও নাম' : 'Code & Name'}</th>
                  <th className="p-3">{isBn ? 'ব্যক্তিগত যোগাযোগ' : 'Contact (Restricted)'}</th>
                  <th className="p-3">{isBn ? 'প্রতিষ্ঠান ও জেলা' : 'Org & District'}</th>
                  <th className="p-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {participants.map((p) => {
                  const st = PARTICIPANT_STATUS_META[p.status] || PARTICIPANT_STATUS_META.registered;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">
                        <p className="font-mono font-bold text-[11px] text-stone-500">{p.registration_code || `#${p.id}`}</p>
                        <p className="font-bold text-stone-900">{p.participant_name}</p>
                        <span className="text-[10px] text-stone-400">User ID: {p.user_id}</span>
                      </td>
                      <td className="p-3">
                        <p>{p.participant_email || '—'}</p>
                        <p className="text-stone-600">{p.participant_phone || '—'}</p>
                      </td>
                      <td className="p-3">
                        <p>{p.organization || '—'}</p>
                        <p className="text-stone-500">{p.district || '—'}</p>
                      </td>
                      <td className="p-3">
                        <select
                          value={p.status}
                          onChange={(e) => handleParticipantStatus(p.id, e.target.value)}
                          className={`px-2 py-1 rounded border text-[11px] font-bold ${st.badgeClass}`}
                        >
                          {Object.entries(PARTICIPANT_STATUS_META).map(([k, m]) => (
                            <option key={k} value={k}>
                              {m.labelBn}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {participants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-stone-500">
                      {isBn ? 'কোনো নিবন্ধিত অংশগ্রহণকারী পাওয়া যায়নি।' : 'No participants yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {tab === 'announcements' && hasManagePerm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form onSubmit={handleCreateAnnouncement} className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
            <h3 className="font-black text-stone-900">{isBn ? 'নতুন ঘোষণা প্রকাশ' : 'New Announcement'}</h3>
            <input
              type="text"
              required
              placeholder={isBn ? 'শিরোনাম' : 'Title'}
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <textarea
              required
              rows={3}
              placeholder={isBn ? 'ঘোষণার বিবরণ...' : 'Announcement body...'}
              value={annForm.body}
              onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={annForm.announcement_type}
                onChange={(e) => setAnnForm({ ...annForm, announcement_type: e.target.value })}
                className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
              >
                {EVENT_ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.labelBn}
                  </option>
                ))}
              </select>
              <select
                value={annForm.priority}
                onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={annForm.is_pinned}
                onChange={(e) => setAnnForm({ ...annForm, is_pinned: e.target.checked })}
              />
              <span>{isBn ? 'শীর্ষে পিন করুন' : 'Pin to top'}</span>
            </label>
            <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
              {isBn ? 'ঘোষণা প্রকাশ করুন' : 'Publish'}
            </button>
          </form>

          <div className="space-y-2.5 text-xs">
            {(event.announcements || []).map((a) => (
              <div key={a.id} className="border border-stone-200 rounded-xl p-3.5 flex justify-between gap-2">
                <div>
                  <p className="font-bold text-stone-900">{a.title}</p>
                  <p className="text-stone-600 mt-0.5">{a.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAnnouncement(a.id).unwrap().then(refetchDetail)}
                  className="text-red-600 hover:text-red-800 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALLERY */}
      {tab === 'gallery' && hasManagePerm && (
        <div className="space-y-4">
          <form onSubmit={handleAddGallery} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
            <select
              value={galForm.media_type}
              onChange={(e) => setGalForm({ ...galForm, media_type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
            >
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
            <input
              type="file"
              onChange={(e) => setGalForm({ ...galForm, file: e.target.files?.[0] || null })}
              className="text-xs"
            />
            <input
              type="url"
              placeholder={isBn ? 'অথবা URL' : 'Or External URL'}
              value={galForm.external_url}
              onChange={(e) => setGalForm({ ...galForm, external_url: e.target.value })}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <input
              type="text"
              placeholder={isBn ? 'ক্যাপশন' : 'Caption'}
              value={galForm.caption}
              onChange={(e) => setGalForm({ ...galForm, caption: e.target.value })}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white sm:col-span-2"
            />
            <input
              type="text"
              placeholder={isBn ? 'ফটো ক্রেডিট' : 'Credit'}
              value={galForm.credit_text}
              onChange={(e) => setGalForm({ ...galForm, credit_text: e.target.value })}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
              <Upload className="w-3.5 h-3.5" />
              <span>{isBn ? 'যুক্ত করুন' : 'Upload'}</span>
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(event.gallery_items || []).map((g) => (
              <div key={g.id} className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <img src={resolveEventMediaUrl(g.url)} alt={g.caption || ''} className="w-full h-28 object-cover bg-stone-100" />
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="truncate font-semibold">{g.caption || `#${g.id}`}</span>
                  <button
                    type="button"
                    onClick={() => deleteGallery(g.id).unwrap().then(refetchDetail)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && hasManagePerm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <form onSubmit={handleCreateReport} className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h3 className="font-black text-stone-900">{isBn ? 'ইভেন্ট পরবর্তী প্রতিবেদন লিখুন' : 'Create Event Report'}</h3>
            <input
              type="text"
              required
              placeholder={isBn ? 'প্রতিবেদনের শিরোনাম' : 'Report title'}
              value={repForm.title}
              onChange={(e) => setRepForm({ ...repForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <input
              type="number"
              placeholder={isBn ? 'উপস্থিতির সংখ্যা' : 'Attendance count'}
              value={repForm.attendance_count}
              onChange={(e) => setRepForm({ ...repForm, attendance_count: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <textarea
              required
              rows={4}
              placeholder={isBn ? 'পূর্ণ প্রতিবেদন...' : 'Full report body...'}
              value={repForm.body}
              onChange={(e) => setRepForm({ ...repForm, body: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
            />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 font-semibold">
                <input
                  type="checkbox"
                  checked={repForm.is_published}
                  onChange={(e) => setRepForm({ ...repForm, is_published: e.target.checked })}
                />
                <span>{isBn ? 'পাবলিক প্রকাশ' : 'Publish Report'}</span>
              </label>
              <label className="flex items-center gap-1.5 font-semibold">
                <input
                  type="checkbox"
                  checked={repForm.create_news_draft}
                  onChange={(e) => setRepForm({ ...repForm, create_news_draft: e.target.checked })}
                />
                <span>{isBn ? 'নিউজরুম ড্রাফট তৈরি' : 'Also create News draft'}</span>
              </label>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
              {isBn ? 'প্রতিবেদন সংরক্ষণ' : 'Save Report'}
            </button>
          </form>

          <div className="space-y-3">
            {(event.reports || []).map((r) => (
              <div key={r.id} className="border border-stone-200 rounded-xl p-4 space-y-1">
                <p className="font-bold text-stone-900">{r.title}</p>
                {r.attendance_count !== null && (
                  <p className="text-emerald-700 font-semibold">উপস্থিতি: {r.attendance_count}</p>
                )}
                <p className="text-stone-600 line-clamp-3">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPETITIONS & JUDGING */}
      {tab === 'competitions' && (
        <div className="space-y-5 text-xs">
          {hasManagePerm && (
            <form onSubmit={handleCreateComp} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <input
                type="text"
                required
                placeholder={isBn ? 'প্রতিযোগিতার নাম' : 'Competition title'}
                value={compForm.title}
                onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                className="px-3 py-2 rounded-lg border border-stone-300 bg-white sm:col-span-2"
              />
              <input
                type="text"
                placeholder={isBn ? 'বিভাগ / ট্র্যাক' : 'Track'}
                value={compForm.track_name}
                onChange={(e) => setCompForm({ ...compForm, track_name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? 'ট্র্যাক যুক্ত করুন' : 'Create Track'}</span>
              </button>
            </form>
          )}

          {(event.competitions || []).length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="flex flex-wrap gap-2">
                {event.competitions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCompetitionId(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      activeCompId === c.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {hasResultsPerm && activeCompId && (
                <button
                  type="button"
                  onClick={() => handlePublishResults(activeCompId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'ফলাফল প্রকাশ করুন (Publish Results)' : 'Publish Results'}</span>
                </button>
              )}
            </div>
          )}

          {(hasJudgePerm || hasResultsPerm) && activeCompId && (
            <div className="space-y-3">
              {compEntries.map((entry) => {
                const st = COMPETITION_ENTRY_STATUSES[entry.status] || COMPETITION_ENTRY_STATUSES.submitted;
                return (
                  <div key={entry.id} className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-500">{entry.entry_code}</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${st.badgeClass}`}>{st.labelBn}</span>
                        {entry.rank_position && <span className="font-black text-rose-700">#{entry.rank_position}</span>}
                      </div>
                      <p className="font-bold text-sm text-stone-900">{entry.title}</p>
                      <p className="text-stone-600">{entry.team_or_participant_name} ({entry.district || 'N/A'})</p>
                      {entry.award_title && <p className="font-bold text-emerald-700">{entry.award_title}</p>}
                    </div>
                    {hasJudgePerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setJudgingEntry(entry);
                          setJudgeForm({
                            status: entry.status,
                            judge_score: entry.judge_score ?? '',
                            rank_position: entry.rank_position ?? '',
                            award_title: entry.award_title ?? '',
                            judge_notes: entry.judge_notes ?? ''
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white font-bold self-start"
                      >
                        {isBn ? 'মূল্যায়ন ও নম্বর' : 'Score / Rank'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {judgingEntry && (
            <form onSubmit={handleJudgeSubmit} className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-black text-stone-900">মূল্যায়ন: {judgingEntry.title}</p>
                <button type="button" onClick={() => setJudgingEntry(null)} className="text-stone-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <select
                  value={judgeForm.status}
                  onChange={(e) => setJudgeForm({ ...judgeForm, status: e.target.value })}
                  className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
                >
                  {Object.entries(COMPETITION_ENTRY_STATUSES).map(([k, m]) => (
                    <option key={k} value={k}>
                      {m.labelBn}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Score (0-100)"
                  value={judgeForm.judge_score}
                  onChange={(e) => setJudgeForm({ ...judgeForm, judge_score: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="number"
                  placeholder="Rank (1, 2...)"
                  value={judgeForm.rank_position}
                  onChange={(e) => setJudgeForm({ ...judgeForm, rank_position: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Award title"
                  value={judgeForm.award_title}
                  onChange={(e) => setJudgeForm({ ...judgeForm, award_title: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Private Judge Notes"
                value={judgeForm.judge_notes}
                onChange={(e) => setJudgeForm({ ...judgeForm, judge_notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
                {isBn ? 'মূল্যায়ন সংরক্ষণ' : 'Save Evaluation'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* CERTIFICATES */}
      {tab === 'certificates' && (hasResultsPerm || hasParticipantsPerm) && (
        <div className="space-y-4 text-xs">
          {hasResultsPerm && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-2">
                <p className="font-black text-stone-900">{isBn ? 'একত্রে অংশগ্রহণ সনদ' : 'Bulk Participation Certificates'}</p>
                <p className="text-stone-600">
                  {isBn
                    ? 'উপস্থিত (Attended) চিহ্নিত সকল নিবন্ধিত অংশগ্রহণকারীদের এক ক্লিকে সনদ প্রদান করুন।'
                    : 'Issue participation certificates for all attended participants.'}
                </p>
                <button
                  type="button"
                  onClick={handleBulkIssue}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold"
                >
                  {isBn ? 'সকল উপস্থিত অংশগ্রহণকারীকে সনদ দিন' : 'Bulk Issue Certificates'}
                </button>
              </div>

              <form onSubmit={handleIssueCustomCert} className="space-y-2 border-t lg:border-t-0 lg:border-l border-stone-200 lg:pl-4 pt-3 lg:pt-0">
                <p className="font-black text-stone-900">{isBn ? 'বিজয়ী / বিশেষ সনদ প্রদান' : 'Issue Individual Certificate'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="User ID"
                    value={certForm.user_id}
                    onChange={(e) => setCertForm({ ...certForm, user_id: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  />
                  <select
                    value={certForm.certificate_type}
                    onChange={(e) => setCertForm({ ...certForm, certificate_type: e.target.value })}
                    className="px-2 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {CERTIFICATE_TYPES.map((ct) => (
                      <option key={ct.key} value={ct.key}>
                        {ct.labelBn}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder={isBn ? 'সনদে প্রদর্শিত নাম' : 'Recipient Display Name'}
                  value={certForm.recipient_display_name}
                  onChange={(e) => setCertForm({ ...certForm, recipient_display_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'অর্জন / সম্মাননা শিরোনাম' : 'Achievement Title'}
                  value={certForm.achievement_title}
                  onChange={(e) => setCertForm({ ...certForm, achievement_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 text-white font-bold">
                  {isBn ? 'সনদ ইস্যু করুন' : 'Issue Certificate'}
                </button>
              </form>
            </div>
          )}

          <div className="space-y-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="border border-stone-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-stone-600 mr-2">{cert.certificate_code}</span>
                  <span className="font-bold text-stone-900">{cert.recipient_display_name}</span>
                  <p className="text-stone-600">{cert.achievement_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPrintableCertificate(cert.id, effectiveToken)}
                    className="px-2.5 py-1 rounded border border-stone-300 font-semibold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    HTML
                  </button>
                  <Link
                    to={`/certificates/verify/${cert.certificate_code}`}
                    target="_blank"
                    className="px-2.5 py-1 rounded border border-stone-300 font-semibold inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Verify
                  </Link>
                  {!cert.is_revoked && hasResultsPerm ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(cert.id)}
                      className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-bold inline-flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      {isBn ? 'বাতিল' : 'Revoke'}
                    </button>
                  ) : cert.is_revoked ? (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Revoked</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


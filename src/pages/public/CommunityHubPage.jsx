import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Megaphone,
  MessageSquare,
  Calendar,
  BarChart3,
  Camera,
  Video,
  FileText,
  ShieldCheck,
  Search,
  MapPin,
  Flag,
  Send,
  Plus,
  ExternalLink,
  Users,
  X,
  CheckCircle2,
  Pin,
  Clock
} from 'lucide-react';
import { selectIsReaderAuthenticated } from '../../store/readerSlice.js';
import {
  useGetPublicCitizenSubmissionsQuery,
  useLazyTrackCitizenSubmissionQuery,
  useGetCommunityDiscussionsQuery,
  useGetCommunityDiscussionDetailQuery,
  useGetCommunityEventsQuery,
  useGetCommunityAnnouncementsQuery,
  useCreateCommunityDiscussionMutation,
  useCreateDiscussionReplyMutation,
  useRegisterCommunityEventMutation,
  useCancelCommunityEventMutation
} from '../../store/api/citizenApi.js';
import { useGetPublicPollsQuery, useVotePollMutation } from '../../store/api/readerApi.js';
import {
  SUBMISSION_TYPES,
  SUBMISSION_STATUS_META,
  VERIFICATION_STATUS_META,
  ANNOUNCEMENT_TYPES,
  EVENT_TYPES
} from '../../utils/citizenHelpers.js';
import {
  toBengaliNumber,
  formatBengaliRelativeTime,
  formatBengaliFullDateTime
} from '../../utils/bengaliFormatter.js';
import SEO from '../../components/common/SEO.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import AbuseReportModal from '../../components/citizen/AbuseReportModal.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

export function CommunityHubPage() {
  const { language } = useSelector((state) => state.ui);
  const { isAuthenticated: isStaffAuth } = useSelector((state) => state.auth);
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const isLoggedIn = isReaderAuth || isStaffAuth;
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState('reports');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Quick Tracking Lookup
  const [trackInput, setTrackInput] = useState('');
  const [triggerTrack, { data: trackedResult, isFetching: trackingLoading, error: trackError }] =
    useLazyTrackCitizenSubmissionQuery();

  // Detail Drawers / Modals
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedDiscSlug, setSelectedDiscSlug] = useState(null);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscBody, setNewDiscBody] = useState('');
  const [newDiscTag, setNewDiscTag] = useState('');
  const [replyText, setReplyText] = useState('');

  // Event RSVP modal state
  const [rsvpTargetEvent, setRsvpTargetEvent] = useState(null);
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [rsvpConsent, setRsvpConsent] = useState(true);

  // Abuse report modal
  const [abuseModal, setAbuseModal] = useState({ open: false, targetType: '', targetId: 0, title: '' });

  // Queries
  const { data: submissionsData, isLoading: loadingStories } = useGetPublicCitizenSubmissionsQuery({
    type: typeFilter,
    search: searchFilter || undefined,
    per_page: 12
  });
  const { data: announcements = [] } = useGetCommunityAnnouncementsQuery();
  const { data: discussionsData, isLoading: loadingDiscussions } = useGetCommunityDiscussionsQuery({ per_page: 15 });
  const { data: discDetail } = useGetCommunityDiscussionDetailQuery(selectedDiscSlug, {
    skip: !selectedDiscSlug
  });
  const { data: events = [], isLoading: loadingEvents } = useGetCommunityEventsQuery();
  const { data: polls = [] } = useGetPublicPollsQuery({ limit: 8 });

  // Mutations
  const [createDiscussion, { isLoading: creatingDisc }] = useCreateCommunityDiscussionMutation();
  const [createReply, { isLoading: postingReply }] = useCreateDiscussionReplyMutation();
  const [registerEvent, { isLoading: rsvping }] = useRegisterCommunityEventMutation();
  const [cancelEvent] = useCancelCommunityEventMutation();
  const [votePoll, { isLoading: votingPoll }] = useVotePollMutation();

  const stories = submissionsData?.items || [];
  const discussions = discussionsData?.items || [];

  const handleTrackLookup = (e) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    triggerTrack(trackInput.trim());
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await createDiscussion({
        title: newDiscTitle.trim(),
        body: newDiscBody.trim(),
        topic_tag: newDiscTag.trim() || undefined
      }).unwrap();
      sweetAlert.success(
        isBn
          ? 'আপনার আলোচনা জমা হয়েছে! মডারেশন অনুমোদনের পর এটি সবার জন্য দৃশ্যমান হবে।'
          : 'Discussion submitted! It will appear publicly after moderator approval.'
      );
      setNewDiscTitle('');
      setNewDiscBody('');
      setNewDiscTag('');
      setShowNewDiscussion(false);
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'আলোচনা জমা দেওয়া যায়নি।' : 'Failed to create discussion.'));
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!discDetail?.id || !replyText.trim()) return;
    try {
      await createReply({ discussionId: discDetail.id, body: replyText.trim() }).unwrap();
      setReplyText('');
      sweetAlert.success(
        isBn
          ? 'মন্তব্য জমা হয়েছে! মডারেশন পর্যালোচনার পর এটি প্রকাশিত হবে।'
          : 'Reply submitted for moderation approval.'
      );
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'মন্তব্য জমা দেওয়া যায়নি।' : 'Failed to post reply.'));
    }
  };

  const handleConfirmRsvp = async (e) => {
    e.preventDefault();
    if (!rsvpTargetEvent) return;
    try {
      await registerEvent({
        eventId: rsvpTargetEvent.id,
        notes: rsvpNotes.trim() || undefined,
        consent_event_updates: rsvpConsent
      }).unwrap();
      sweetAlert.success(isBn ? 'ইভেন্ট নিবন্ধন নিশ্চিত হয়েছে!' : 'Event RSVP confirmed!');
      setRsvpTargetEvent(null);
      setRsvpNotes('');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'নিবন্ধন সম্পন্ন করা যায়নি।' : 'Failed to register for event.'));
    }
  };

  const handleCancelRsvp = async (eventId) => {
    try {
      await cancelEvent(eventId).unwrap();
      sweetAlert.info(isBn ? 'ইভেন্ট নিবন্ধন বাতিল করা হয়েছে।' : 'RSVP cancelled.');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'বাতিল করা যায়নি।' : 'Could not cancel registration.'));
    }
  };

  const openAbuseModal = (targetType, targetId, title) => {
    setAbuseModal({ open: true, targetType, targetId, title });
  };

  const tabs = [
    { id: 'reports', label: isBn ? 'নাগরিক প্রতিবেদন' : 'Citizen Reports', icon: Camera, count: stories.length },
    { id: 'discussions', label: isBn ? 'পাঠক আলোচনা' : 'Discussions', icon: MessageSquare, count: discussions.length },
    { id: 'events', label: isBn ? 'কমিউনিটি ইভেন্ট' : 'Events & RSVP', icon: Calendar, count: events.length },
    { id: 'polls', label: isBn ? 'মতামত জরিপ' : 'Reader Polls', icon: BarChart3, count: polls.length }
  ];

  return (
    <div className="space-y-6">
      <SEO
        title={isBn ? 'নাগরিক সাংবাদিকতা ও পাঠক কমিউনিটি' : 'Citizen Journalism & Community'}
        description={isBn ? 'পাঠকের যাচাইকৃত সংবাদ, আলোচনা, ইভেন্ট ও জরিপ' : 'Verified citizen reports, moderated discussions, events, and polls'}
      />

      {/* Editorial Citizen Journalism Hero */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? '১০০% সম্পাদকীয় যাচাই ও প্রাইভেসি-সুরক্ষিত প্ল্যাটফর্ম' : 'Editor-Verified & Privacy-Protected Platform'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-bn leading-snug">
            {isBn ? 'নাগরিক সাংবাদিকতা ও পাঠক কমিউনিটি' : 'Citizen Journalism & Community Hub'}
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            {isBn
              ? 'আপনার এলাকার জনগুরুত্বপূর্ণ খবর, ছবি ও ভিডিও পাঠান। বার্তাকক্ষের যাচাই-বাছাই ও সম্পাদকীয় অনুমোদনের পর তা প্রকাশিত হয় — এবং পাঠক আলোচনা ও ইভেন্টে অংশ নিন নিরাপদ মডারেশনের আওতায়।'
              : 'Share local news, eyewitness photos, or videos reviewed by our verification desk, join moderated reader discussions, and RSVP for newsroom workshops.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/citizen/submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'প্রতিবেদন / ছবি পাঠান' : 'Submit Story / Media'}</span>
          </Link>
          <Link
            to={isLoggedIn ? '/reader/profile?tab=citizen' : '/reader/login'}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>{isBn ? 'আমার অবদান ও ট্র্যাকিং' : 'My Contributions'}</span>
          </Link>
        </div>
      </section>

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {announcements.slice(0, 4).map((ann) => {
            const meta = ANNOUNCEMENT_TYPES.find((a) => a.value === ann.announcement_type) || ANNOUNCEMENT_TYPES[0];
            return (
              <div key={ann.id} className={`rounded-xl border p-4 flex items-start gap-3 ${meta.tone}`}>
                <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70">
                      {isBn ? meta.labelBn : meta.labelEn}
                    </span>
                    {ann.is_pinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold">
                        <Pin className="w-3 h-3" /> {isBn ? 'পিন করা' : 'Pinned'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold font-serif-bn leading-snug">{ann.title}</h2>
                  <p className="text-xs opacity-90 mt-1 line-clamp-2">{ann.body}</p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Main Content + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Sub-Navigation Tabs */}
          <div className="bg-white border border-stone-200 rounded-2xl p-2 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    active ? 'bg-rose-700 text-white shadow-2xs' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {isBn ? toBengaliNumber(t.count) : t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: VERIFIED CITIZEN REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      typeFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {isBn ? 'সব ধরন' : 'All'}
                  </button>
                  {SUBMISSION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTypeFilter(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        typeFilter === t.value ? 'bg-rose-700 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isBn ? t.labelBn : t.labelEn}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="search"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder={isBn ? 'শিরোনাম বা জেলা খুঁজুন...' : 'Search stories or districts...'}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 w-full sm:w-56 focus:outline-rose-700"
                  />
                </div>
              </div>

              {loadingStories ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-52 rounded-2xl bg-stone-100 animate-pulse" />
                  ))}
                </div>
              ) : stories.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-2">
                  <p className="text-sm font-bold text-stone-700">
                    {isBn ? 'এই মুহূর্তে কোনো প্রকাশিত নাগরিক প্রতিবেদন নেই।' : 'No published citizen reports matched your filter.'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {isBn ? 'প্রথম নাগরিক প্রতিবেদন পাঠাতে উপরের বোতামে ক্লিক করুন।' : 'Be the first to contribute a verified local story.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stories.map((story) => {
                    const typeMeta = SUBMISSION_TYPES.find((t) => t.value === story.submission_type);
                    const TypeIcon = story.submission_type === 'photo' ? Camera : story.submission_type === 'video' ? Video : FileText;
                    const coverMedia = story.media?.[0];
                    return (
                      <article
                        key={story.id}
                        className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-rose-300 transition-colors"
                      >
                        {coverMedia?.media_type === 'photo' && coverMedia?.url && (
                          <div className="h-44 bg-stone-100 overflow-hidden">
                            <img src={coverMedia.url} alt={story.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold">
                                <TypeIcon className="w-3 h-3 text-rose-700" />
                                <span>{isBn ? typeMeta?.labelBn : typeMeta?.labelEn}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedStory(story)}
                              className="text-left text-base font-bold font-serif-bn text-stone-900 hover:text-rose-700 leading-snug cursor-pointer"
                            >
                              {story.title}
                            </button>

                            {story.summary && <p className="text-xs text-stone-600 line-clamp-2">{story.summary}</p>}
                          </div>

                          <div className="pt-3 border-t border-stone-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-700" />
                                <span>{story.location || (isBn ? 'অবস্থান গোপন' : 'Location Private')}</span>
                              </span>
                              <span>{story.published_at ? formatBengaliRelativeTime(story.published_at) : ''}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              {story.contributor?.public_handle && !story.contributor?.is_anonymous ? (
                                <Link
                                  to={`/citizen/contributor/${story.contributor.public_handle}`}
                                  className="font-bold text-stone-800 hover:text-rose-700"
                                >
                                  {story.contributor.display_name}
                                </Link>
                              ) : (
                                <span className="font-semibold text-stone-600">{story.contributor?.display_name}</span>
                              )}

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStory(story)}
                                  className="font-bold text-rose-700 hover:underline cursor-pointer"
                                >
                                  {isBn ? 'বিস্তারিত' : 'Read'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAbuseModal('citizen_submission', story.id, story.title)}
                                  className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-700 cursor-pointer"
                                  title={isBn ? 'অভিযোগ জানান' : 'Report'}
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MODERATED DISCUSSIONS */}
          {activeTab === 'discussions' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    {isBn ? 'মডারেশন-নিয়ন্ত্রিত পাঠক আলোচনা' : 'Moderated Reader Forum'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {isBn
                      ? 'প্রতিটি আলোচনা ও মন্তব্য মডারেশন টিমের অনুমোদনের পর প্রকাশিত হয়।'
                      : 'All topics and replies undergo moderator review before public display.'}
                  </p>
                </div>
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => setShowNewDiscussion((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? 'নতুন আলোচনা শুরু করুন' : 'Start Topic'}</span>
                  </button>
                ) : (
                  <Link
                    to="/reader/login"
                    className="px-4 py-2 rounded-xl border border-rose-700 text-rose-700 text-xs font-bold hover:bg-rose-50"
                  >
                    {isBn ? 'আলোচনায় যোগ দিতে লগইন করুন' : 'Sign In to Post'}
                  </Link>
                )}
              </div>

              {showNewDiscussion && (
                <form onSubmit={handleCreateDiscussion} className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-stone-900">{isBn ? 'নতুন আলোচনার বিষয় প্রস্তাব করুন' : 'Propose New Discussion'}</h3>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={newDiscTitle}
                    onChange={(e) => setNewDiscTitle(e.target.value)}
                    placeholder={isBn ? 'আলোচনার শিরোনাম (কমপক্ষে ৮ অক্ষর)...' : 'Discussion title...'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300"
                  />
                  <input
                    type="text"
                    value={newDiscTag}
                    onChange={(e) => setNewDiscTag(e.target.value)}
                    placeholder={isBn ? 'টপিক ট্যাগ (যেমন: শিক্ষা, পরিবেশ, নগর জীবন)' : 'Topic tag (optional)'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300"
                  />
                  <textarea
                    rows={4}
                    required
                    minLength={15}
                    value={newDiscBody}
                    onChange={(e) => setNewDiscBody(e.target.value)}
                    placeholder={isBn ? 'আপনার গঠনমূলক মতামত লিখুন...' : 'Write your thoughtful commentary...'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewDiscussion(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={creatingDisc}
                      className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {creatingDisc ? (isBn ? 'পাঠানো হচ্ছে...' : 'Submitting...') : isBn ? 'অনুমোদনের জন্য পাঠান' : 'Submit for Approval'}
                    </button>
                  </div>
                </form>
              )}

              {loadingDiscussions ? (
                <div className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
              ) : discussions.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500">
                  {isBn ? 'এখনো কোনো অনুমোদিত আলোচনা নেই।' : 'No approved community discussions yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {discussions.map((disc) => (
                    <div key={disc.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          {disc.is_pinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              <Pin className="w-3 h-3" /> {isBn ? 'নির্বাচিত' : 'Pinned'}
                            </span>
                          )}
                          {disc.topic_tag && (
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                              #{disc.topic_tag}
                            </span>
                          )}
                        </div>
                        <span className="text-stone-500">
                          {isBn ? `মন্তব্য: ${toBengaliNumber(disc.replies_count || 0)}` : `Replies: ${disc.replies_count || 0}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDiscSlug(disc.slug)}
                        className="text-left text-base font-bold font-serif-bn text-stone-900 hover:text-rose-700 cursor-pointer"
                      >
                        {disc.title}
                      </button>
                      <p className="text-xs text-stone-600 line-clamp-2">{disc.body}</p>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                        <span>{disc.author?.display_name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedDiscSlug(disc.slug)}
                            className="font-bold text-rose-700 hover:underline cursor-pointer"
                          >
                            {isBn ? 'আলোচনা দেখুন ও মতামত দিন' : 'Open Thread'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openAbuseModal('community_discussion', disc.id, disc.title)}
                            className="text-stone-400 hover:text-rose-700 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY EVENTS & RSVP */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {loadingEvents ? (
                <div className="h-44 rounded-2xl bg-stone-100 animate-pulse" />
              ) : events.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500">
                  {isBn ? 'আসন্ন কোনো কমিউনিটি ইভেন্ট নির্ধারিত নেই।' : 'No upcoming community events scheduled.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => {
                    const evType = EVENT_TYPES.find((e) => e.value === ev.event_type);
                    return (
                      <div key={ev.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 font-bold">
                              {isBn ? evType?.labelBn : evType?.labelEn}
                            </span>
                            <span className="text-stone-500 font-semibold">
                              {ev.is_online ? (isBn ? 'অনলাইন' : 'Online') : (isBn ? 'সশরীরে' : 'In-Person')}
                            </span>
                          </div>
                          <h3 className="text-base font-bold font-serif-bn text-stone-900">{ev.title}</h3>
                          <p className="text-xs text-stone-600 leading-relaxed">{ev.description}</p>
                        </div>

                        <div className="space-y-2.5 pt-3 border-t border-stone-100 text-xs">
                          <div className="flex items-center gap-2 text-stone-700">
                            <Clock className="w-3.5 h-3.5 text-rose-700" />
                            <span>{ev.starts_at ? formatBengaliFullDateTime(ev.starts_at) : ''}</span>
                          </div>
                          {ev.location_label && (
                            <div className="flex items-center gap-2 text-stone-600">
                              <MapPin className="w-3.5 h-3.5 text-stone-500" />
                              <span>{ev.location_label}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>
                              {isBn
                                ? `নিবন্ধিত: ${toBengaliNumber(ev.registered_count || 0)}${ev.capacity ? '/' + toBengaliNumber(ev.capacity) : ''}`
                                : `Registered: ${ev.registered_count || 0}${ev.capacity ? '/' + ev.capacity : ''}`}
                            </span>
                          </div>

                          {ev.is_registered ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isBn ? 'আপনি নিবন্ধিত আছেন' : 'You are Registered'}</span>
                              </div>
                              {ev.meeting_url && (
                                <a
                                  href={ev.meeting_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                                >
                                  <span>{isBn ? 'মিটিং লিংকে যোগ দিন' : 'Join Meeting'}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCancelRsvp(ev.id)}
                                className="block text-[11px] font-bold text-stone-500 hover:text-rose-700 cursor-pointer"
                              >
                                {isBn ? 'নিবন্ধন বাতিল করুন' : 'Cancel Registration'}
                              </button>
                            </div>
                          ) : isLoggedIn ? (
                            <button
                              type="button"
                              onClick={() => setRsvpTargetEvent(ev)}
                              className="w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
                            >
                              {isBn ? 'অংশগ্রহণের জন্য নিবন্ধন করুন (RSVP)' : 'Register / RSVP'}
                            </button>
                          ) : (
                            <Link
                              to="/reader/login"
                              className="block w-full py-2 text-center rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                            >
                              {isBn ? 'RSVP করতে লগইন করুন' : 'Sign In to RSVP'}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL ACTIVE READER POLLS */}
          {activeTab === 'polls' && (
            <div className="space-y-4">
              {polls.length === 0 ? (
                <TodayPollWidget />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {polls.map((poll) => {
                    const showResults = poll.userVoted || !poll.isOpen;
                    return (
                      <div key={poll.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                        <p className="text-sm font-bold font-serif-bn text-stone-900">
                          {isBn ? poll.questionBn : poll.questionEn}
                        </p>
                        {!showResults ? (
                          <div className="space-y-2">
                            {poll.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={votingPoll}
                                onClick={() => votePoll({ pollId: poll.id, optionId: opt.id })}
                                className="w-full py-2 px-3 rounded-xl border border-stone-300 hover:border-rose-700 hover:bg-rose-50 text-xs font-semibold text-left flex justify-between items-center cursor-pointer"
                              >
                                <span>{isBn ? opt.labelBn : opt.labelEn}</span>
                                <span className="text-[11px] text-rose-700 font-bold">{isBn ? 'ভোট' : 'Vote'}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {poll.options.map((opt) => (
                              <div key={opt.id}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{isBn ? opt.labelBn : opt.labelEn}</span>
                                  <span className="font-bold">
                                    {isBn ? toBengaliNumber(opt.percentage) : opt.percentage}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                                  <div className="h-full bg-rose-700" style={{ width: `${opt.percentage}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                          {isBn
                            ? `মোট ভোট: ${toBengaliNumber(poll.totalVotes || 0)}`
                            : `Total votes: ${poll.totalVotes || 0}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Utility Rail */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Tracking Code Lookup Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
              {isBn ? 'প্রতিবেদনের অবস্থা ট্র্যাক করুন' : 'Track Submission Status'}
            </h3>
            <form onSubmit={handleTrackLookup} className="flex gap-2">
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="CJ-202611-PUB01"
                className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-xl border border-stone-300 focus:outline-rose-700"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'দেখুন' : 'Track'}
              </button>
            </form>

            {trackError && (
              <p className="text-xs text-rose-700">
                {isBn ? 'এই ট্র্যাকিং কোডের কোনো প্রতিবেদন পাওয়া যায়নি।' : 'Tracking code not found.'}
              </p>
            )}

            {trackedResult && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-rose-700">{trackedResult.tracking_code}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                      SUBMISSION_STATUS_META[trackedResult.status]?.tone || 'bg-stone-100'
                    }`}
                  >
                    {isBn
                      ? SUBMISSION_STATUS_META[trackedResult.status]?.labelBn
                      : SUBMISSION_STATUS_META[trackedResult.status]?.labelEn}
                  </span>
                </div>
                <p className="font-bold text-stone-900">{trackedResult.title}</p>
                <p className="text-[11px] text-stone-600">
                  {isBn ? 'যাচাই:' : 'Verification:'}{' '}
                  <span className="font-semibold">
                    {isBn
                      ? VERIFICATION_STATUS_META[trackedResult.verification_status]?.labelBn
                      : VERIFICATION_STATUS_META[trackedResult.verification_status]?.labelEn}
                  </span>
                </p>
                {Array.isArray(trackedResult.events) && trackedResult.events.length > 0 && (
                  <div className="pt-2 border-t border-stone-200 space-y-1">
                    {trackedResult.events.slice(-3).map((ev, i) => (
                      <p key={i} className="text-[11px] text-stone-600">
                        • {ev.public_note || ev.event_type}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <TodayPollWidget />

          {/* Safety Policy Promise */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2 text-xs text-emerald-950">
            <h3 className="font-bold flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{isBn ? 'আমাদের নিরাপত্তা ও গোপনীয়তা অঙ্গীকার' : 'Editorial Safety Commitment'}</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc pl-4">
              <li>{isBn ? 'সম্পাদকীয় যাচাই ছাড়া কোনো পাঠকের পাঠানো লেখা বা ছবি প্রকাশিত হয় না।' : 'Zero auto-publishing: editors verify every claim.'}</li>
              <li>{isBn ? 'প্রতিবেদকের সুনির্দিষ্ট বাড়ির ঠিকানা, ফোন নম্বর ও GPS স্থানাঙ্ক সম্পূর্ণ গোপন থাকে।' : 'Private addresses and GPS coordinates never appear in public APIs.'}</li>
              <li>{isBn ? 'কপিরাইট, ভুল তথ্য বা হয়রানির বিষয়ে সাথে সাথে রিপোর্ট করার সুযোগ।' : 'Instant moderation abuse reporting and rapid takedown protection.'}</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Citizen Report Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সম্পাদকীয়ভাবে যাচাইকৃত ও প্রকাশিত' : 'Editorially Verified & Published'}</span>
                </span>
                <h2 className="text-xl font-extrabold font-serif-bn text-stone-900">{selectedStory.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedStory.media?.length > 0 && (
              <div className="space-y-3">
                {selectedStory.media.map((m) => (
                  <div key={m.id} className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                    {m.media_type === 'photo' ? (
                      <img src={m.url} alt={m.caption || selectedStory.title} className="w-full max-h-80 object-contain mx-auto" />
                    ) : (
                      <video src={m.url} controls className="w-full max-h-80 bg-black" />
                    )}
                    {(m.caption || m.credit_text) && (
                      <p className="p-2.5 text-[11px] text-stone-600">
                        {m.caption} {m.credit_text ? `— (${m.credit_text})` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedStory.summary && <p className="text-sm font-semibold text-stone-800">{selectedStory.summary}</p>}
            <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{selectedStory.content}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
              <span>{selectedStory.location || (isBn ? 'অবস্থান গোপন' : 'Location Private')}</span>
              <button
                type="button"
                onClick={() => {
                  const target = selectedStory;
                  setSelectedStory(null);
                  openAbuseModal('citizen_submission', target.id, target.title);
                }}
                className="inline-flex items-center gap-1 text-rose-700 font-bold hover:underline cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isBn ? 'অভিযোগ / সংশোধন রিপোর্ট করুন' : 'Report Issue'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Thread Detail & Replies Modal */}
      {selectedDiscSlug && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold font-serif-bn text-stone-900">
                  {discDetail?.title || (isBn ? 'লোড হচ্ছে...' : 'Loading...')}
                </h2>
                {discDetail?.author && (
                  <p className="text-xs text-stone-500 mt-1">{discDetail.author.display_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiscSlug(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {discDetail && (
              <>
                <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">{discDetail.body}</p>

                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {isBn
                      ? `অনুমোদিত মন্তব্য (${toBengaliNumber((discDetail.replies || []).length)})`
                      : `Approved Replies (${(discDetail.replies || []).length})`}
                  </h3>

                  {(discDetail.replies || []).length === 0 ? (
                    <p className="text-xs text-stone-500">
                      {isBn ? 'এখনো কোনো অনুমোদিত মন্তব্য নেই।' : 'No approved replies yet.'}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {discDetail.replies.map((r) => (
                        <div key={r.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-900">{r.author?.display_name}</span>
                            <button
                              type="button"
                              onClick={() => openAbuseModal('community_reply', r.id, r.body.slice(0, 60))}
                              className="text-stone-400 hover:text-rose-700 cursor-pointer"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-stone-700">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isLoggedIn && discDetail.status !== 'locked' && (
                    <form onSubmit={handlePostReply} className="pt-2 space-y-2">
                      <textarea
                        rows={2}
                        required
                        minLength={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isBn ? 'আপনার মতামত লিখুন (মডারেশনের পর প্রকাশিত হবে)...' : 'Write a reply (moderated before publish)...'}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                      />
                      <button
                        type="submit"
                        disabled={postingReply}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isBn ? 'মন্তব্য পাঠান' : 'Submit Reply'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Event RSVP Modal */}
      {rsvpTargetEvent && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">{isBn ? 'ইভেন্ট নিবন্ধন নিশ্চিত করুন' : 'Confirm Event RSVP'}</h3>
              <button
                type="button"
                onClick={() => setRsvpTargetEvent(null)}
                className="p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm font-bold text-rose-700 font-serif-bn">{rsvpTargetEvent.title}</p>

            <form onSubmit={handleConfirmRsvp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'প্রশ্ন বা নোট (ঐচ্ছিক)' : 'Questions / Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={rsvpNotes}
                  onChange={(e) => setRsvpNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={rsvpConsent}
                  onChange={(e) => setRsvpConsent(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-rose-700"
                />
                <span>
                  {isBn
                    ? 'ইভেন্ট সংক্রান্ত আপডেট ও অংশগ্রহণ নির্দেশনা পেতে আমি সম্মত।'
                    : 'I consent to receive event updates and session instructions.'}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRsvpTargetEvent(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={rsvping || !rsvpConsent}
                  className="px-5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {rsvping ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Saving...') : isBn ? 'নিবন্ধন সম্পন্ন করুন' : 'Confirm RSVP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AbuseReportModal
        isOpen={abuseModal.open}
        onClose={() => setAbuseModal({ open: false, targetType: '', targetId: 0, title: '' })}
        targetType={abuseModal.targetType}
        targetId={abuseModal.targetId}
        targetTitle={abuseModal.title}
        isBn={isBn}
      />
    </div>
  );
}

export default CommunityHubPage;


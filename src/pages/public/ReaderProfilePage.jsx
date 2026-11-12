import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsReaderAuthenticated,
  setReaderProfile,
  readerLogout
} from '../../store/readerSlice.js';
import {
  useGetReaderProfileQuery,
  useUpdateReaderProfileMutation,
  useUpdateReaderPreferencesMutation,
  useGetReaderBookmarksQuery,
  useRemoveReaderBookmarkMutation,
  useGetReaderHistoryQuery,
  useRemoveReadingHistoryItemMutation,
  useClearReadingHistoryMutation,
  useGetReaderFollowsQuery,
  useFollowTargetMutation,
  useUnfollowTargetMutation,
  useGetReaderSessionsQuery,
  useRevokeReaderSessionMutation,
  useRevokeOtherReaderSessionsMutation,
  useExportReaderDataMutation,
  useDeleteReaderAccountMutation,
  useReaderLogoutMutation
} from '../../store/api/readerApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useGetAuthorsQuery } from '../../store/api/authorApi.js';
import { useGetTagsQuery } from '../../store/api/tagApi.js';
import { NEWSLETTER_FREQUENCIES, buildDataExportFilename } from '../../utils/readerHelpers.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import SEO from '../../components/common/SEO.jsx';
import ReaderMembershipTab from '../../components/reader/ReaderMembershipTab.jsx';
import ReaderCitizenTab from '../../components/reader/ReaderCitizenTab.jsx';
import ReaderEventsTab from '../../components/reader/ReaderEventsTab.jsx';
import { useUpdateReaderHyperlocalPreferencesMutation } from '../../store/api/hyperlocalApi.js';
import { LocationSelectorBar } from '../../components/hyperlocal/LocationSelectorBar.jsx';
import {
  LOCAL_ALERT_FREQUENCIES,
  buildPrivacySafeLocalPreferencePayload
} from '../../utils/hyperlocalHelpers.js';
import {
  User,
  Bookmark,
  History,
  Bell,
  Shield,
  Sparkles,
  Trash2,
  Download,
  LogOut,
  Check,
  Plus,
  Laptop,
  Mail,
  Save,
  AlertTriangle,
  Crown,
  Megaphone,
  Calendar,
  MapPin
} from 'lucide-react';

export function ReaderProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab) setActiveTab(paramTab);
  }, [searchParams]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Queries
  const { data: profileRes } = useGetReaderProfileQuery(undefined, { skip: !isReaderAuth });
  const { data: bookmarksData } = useGetReaderBookmarksQuery(undefined, { skip: !isReaderAuth });
  const { data: historyData } = useGetReaderHistoryQuery({ per_page: 25 }, { skip: !isReaderAuth });
  const { data: followsData } = useGetReaderFollowsQuery(undefined, { skip: !isReaderAuth });
  const { data: sessions = [] } = useGetReaderSessionsQuery(undefined, { skip: !isReaderAuth });

  // Public Taxonomies for Follow Picker
  const { data: categoriesRes } = useGetCategoriesQuery({ per_page: 30 });
  const { data: authorsRes } = useGetAuthorsQuery({ per_page: 30, active_only: true });
  const { data: tagsRes } = useGetTagsQuery({ per_page: 30 });

  // Mutations
  const [updateProfile, { isLoading: savingProfile }] = useUpdateReaderProfileMutation();
  const [updatePreferences, { isLoading: savingPrefs }] = useUpdateReaderPreferencesMutation();
  const [updateHyperlocalPreferences] = useUpdateReaderHyperlocalPreferencesMutation();
  const [removeBookmark] = useRemoveReaderBookmarkMutation();
  const [removeHistoryItem] = useRemoveReadingHistoryItemMutation();
  const [clearHistory] = useClearReadingHistoryMutation();
  const [followTarget] = useFollowTargetMutation();
  const [unfollowTarget] = useUnfollowTargetMutation();
  const [revokeSession] = useRevokeReaderSessionMutation();
  const [revokeOtherSessions] = useRevokeOtherReaderSessionsMutation();
  const [exportReaderData, { isLoading: exportingData }] = useExportReaderDataMutation();
  const [deleteAccount, { isLoading: deletingAccount }] = useDeleteReaderAccountMutation();
  const [apiLogout] = useReaderLogoutMutation();

  const reader = profileRes?.reader;
  const stats = profileRes?.stats || {};

  // Local Form States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [locationField, setLocationField] = useState('');
  const [prefLang, setPrefLang] = useState('bn');

  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterFrequency, setNewsletterFrequency] = useState('daily');
  const [newsletterCategories, setNewsletterCategories] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [breakingAlerts, setBreakingAlerts] = useState(true);
  const [pushTopics, setPushTopics] = useState([]);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [localGeo, setLocalGeo] = useState({
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
    wardId: ''
  });
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(false);
  const [localNotificationFrequency, setLocalNotificationFrequency] = useState('daily');

  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pushPermissionState, setPushPermissionState] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (reader) {
      setDisplayName(reader.display_name || reader.name || '');
      setBio(reader.bio || '');
      setLocationField(reader.location || '');
      setPrefLang(reader.preferred_language || 'bn');

      const prefs = reader.preferences || {};
      setNewsletterEnabled(Boolean(prefs.newsletter_enabled));
      setNewsletterFrequency(prefs.newsletter_frequency || 'daily');
      setNewsletterCategories(Array.isArray(prefs.newsletter_categories) ? prefs.newsletter_categories : []);
      setPushEnabled(Boolean(prefs.push_enabled));
      setBreakingAlerts(prefs.breaking_alerts !== undefined ? Boolean(prefs.breaking_alerts) : true);
      setPushTopics(Array.isArray(prefs.push_topics) ? prefs.push_topics : []);
      setPersonalizationEnabled(
        prefs.personalization_enabled !== undefined ? Boolean(prefs.personalization_enabled) : true
      );
      const consentValue = prefs.analytics_consent !== undefined ? Boolean(prefs.analytics_consent) : true;
      setLocalGeo({
        divisionId: reader.preferred_division_id ? String(reader.preferred_division_id) : '',
        districtId: reader.preferred_district_id ? String(reader.preferred_district_id) : '',
        upazilaId: reader.preferred_upazila_id ? String(reader.preferred_upazila_id) : '',
        unionId: reader.preferred_union_id ? String(reader.preferred_union_id) : '',
        wardId: reader.preferred_ward_id ? String(reader.preferred_ward_id) : ''
      });
      setLocalNotificationsEnabled(Boolean(prefs.local_notifications_enabled));
      setLocalNotificationFrequency(prefs.local_notification_frequency || 'daily');
      setAnalyticsConsent(consentValue);
      try {
        localStorage.setItem('newsflow_analytics_consent', consentValue ? 'true' : 'false');
      } catch {
        // ignore storage errors
      }
    }
  }, [reader]);

  if (!isReaderAuth) {
    return <Navigate to="/reader/login" replace />;
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({
        name: displayName.trim(),
        display_name: displayName.trim(),
        bio,
        location: locationField,
        preferred_language: prefLang
      }).unwrap();
      dispatch(setReaderProfile(updated));
      sweetAlert.success(isBn ? 'প্রোফাইল সফলভাবে হালনাগাদ হয়েছে' : 'Profile updated');
    } catch {
      sweetAlert.error(isBn ? 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে' : 'Could not update profile');
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const updated = await updatePreferences({
        newsletter_enabled: newsletterEnabled,
        newsletter_frequency: newsletterFrequency,
        newsletter_categories: newsletterCategories,
        push_enabled: pushEnabled,
        push_topics: pushTopics,
        breaking_alerts: breakingAlerts,
        personalization_enabled: personalizationEnabled,
        analytics_consent: analyticsConsent
      }).unwrap();
      const updatedHyperlocal = await updateHyperlocalPreferences(
        buildPrivacySafeLocalPreferencePayload({
          ...localGeo,
          localNotificationsEnabled,
          localNotificationFrequency,
          clearLocation: !localGeo.divisionId && !localGeo.districtId && !localGeo.upazilaId
        })
      ).unwrap();
      dispatch(setReaderProfile(updatedHyperlocal || updated));
      try {
        localStorage.setItem('newsflow_analytics_consent', analyticsConsent ? 'true' : 'false');
      } catch {
        // ignore storage errors
      }
      sweetAlert.success(isBn ? 'পছন্দসমূহ সংরক্ষিত হয়েছে' : 'Preferences saved');
    } catch {
      sweetAlert.error(isBn ? 'পছন্দ সংরক্ষণ করা যায়নি' : 'Failed to save preferences');
    }
  };

  const handleRequestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      sweetAlert.warning(isBn ? 'আপনার ব্রাউজার পুশ নোটিফিকেশন সমর্থন করে না' : 'Browser notifications unsupported');
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setPushPermissionState(permission);
      if (permission === 'granted') {
        setPushEnabled(true);
        sweetAlert.success(isBn ? 'ব্রাউজার পুশ নোটিফিকেশন অনুমোদিত হয়েছে' : 'Push notifications enabled');
      }
    } catch {
      // Ignore permission rejection
    }
  };

  const handleDownloadExport = async () => {
    try {
      const payload = await exportReaderData().unwrap();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildDataExportFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      sweetAlert.success(isBn ? 'আপনার ব্যক্তিগত ডেটা JSON ফাইল ডাউনলোড হয়েছে' : 'Data exported successfully');
    } catch {
      sweetAlert.error(isBn ? 'ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে' : 'Export failed');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!confirmDelete || !deletePassword) return;
    const { isConfirmed } = await sweetAlert.confirmDelete({
      title: isBn ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছবেন?' : 'Delete account permanently?',
      text: isBn
        ? 'আপনার ব্যক্তিগত প্রোফাইল, বুকমার্ক, ইতিহাস এবং সব লগইন সেশন স্থায়ীভাবে মুছে ফেলা হবে।'
        : 'All personal reader data, bookmarks, reading history, and tokens will be permanently removed.',
      confirmButtonText: isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete Forever'
    });
    if (!isConfirmed) return;

    try {
      await deleteAccount({ password: deletePassword, confirm_deletion: true }).unwrap();
      dispatch(readerLogout());
      sweetAlert.success(isBn ? 'আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'Account deleted permanently');
      navigate('/');
    } catch (err) {
      sweetAlert.error(err?.data?.message || (isBn ? 'সঠিক পাসওয়ার্ড দিন' : 'Incorrect password'));
    }
  };

  const handleClearHistory = async () => {
    const { isConfirmed } = await sweetAlert.confirm({
      title: isBn ? 'পড়ার সম্পূর্ণ ইতিহাস মুছবেন?' : 'Clear reading history?',
      text: isBn ? 'আপনার সকল সম্প্রতি দেখা সংবাদের তালিকা মুছে যাবে।' : 'All reading history will be cleared.'
    });
    if (!isConfirmed) return;
    await clearHistory().unwrap();
    sweetAlert.success(isBn ? 'পড়ার ইতিহাস পরিষ্কার করা হয়েছে' : 'History cleared');
  };

  const handleLogout = async () => {
    try {
      await apiLogout().unwrap();
    } catch {
      // Clear local state regardless
    }
    dispatch(readerLogout());
    navigate('/');
  };

  const toggleFollow = async (type, id, isFollowed) => {
    if (isFollowed) {
      await unfollowTarget({ type, id }).unwrap();
    } else {
      await followTarget({ type, id }).unwrap();
    }
  };

  const categoriesList = Array.isArray(categoriesRes?.items)
    ? categoriesRes.items
    : Array.isArray(categoriesRes)
    ? categoriesRes
    : [];
  const authorsList = Array.isArray(authorsRes?.items) ? authorsRes.items : [];
  const tagsList = Array.isArray(tagsRes?.items) ? tagsRes.items : [];

  const summaryIds = followsData?.summary_ids || { category: [], author: [], tag: [] };
  const bookmarks = bookmarksData?.items || [];
  const historyItems = historyData?.items || [];

  const tabs = [
    { id: 'overview', label: isBn ? 'প্রোফাইল' : 'Profile', icon: User },
    { id: 'membership', label: isBn ? 'মেম্বারশিপ ও বিলিং' : 'Membership & Billing', icon: Crown },
    { id: 'citizen', label: isBn ? 'নাগরিক প্রতিবেদন ও কমিউনিটি' : 'Citizen Reports', icon: Megaphone },
    { id: 'events', label: isBn ? 'আমার ইভেন্ট ও সনদ' : 'Events & Certificates', icon: Calendar },
    { id: 'bookmarks', label: isBn ? 'বুকমার্ক' : 'Bookmarks', icon: Bookmark },
    { id: 'history', label: isBn ? 'পড়ার ইতিহাস' : 'Reading History', icon: History },
    { id: 'follows', label: isBn ? 'অনুসরণ' : 'Follows', icon: Sparkles },
    { id: 'preferences', label: isBn ? 'নিউজলেটার ও পুশ' : 'Notifications', icon: Bell },
    { id: 'privacy', label: isBn ? 'প্রাইভেসি ও সেশন' : 'Privacy & Security', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <SEO title={isBn ? 'পাঠক প্রোফাইল ও প্রাইভেসি' : 'Reader Profile & Privacy'} />

      {/* Top Reader Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
            {(reader?.display_name || reader?.name || 'R').charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-serif-bn">
              {reader?.display_name || reader?.name}
            </h1>
            <p className="text-xs text-stone-300">{reader?.email}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-rose-200">
              <span>{isBn ? `বুকমার্ক: ${toBengaliNumber(stats.bookmarks_count || 0)}` : `Bookmarks: ${stats.bookmarks_count || 0}`}</span>
              <span>•</span>
              <span>{isBn ? `অনুসরণ: ${toBengaliNumber(stats.follows_count || 0)}` : `Follows: ${stats.follows_count || 0}`}</span>
              <span>•</span>
              <span>{isBn ? `পঠিত: ${toBengaliNumber(stats.history_count || 0)}` : `Read: ${stats.history_count || 0}`}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/for-you"
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
          >
            {isBn ? 'আমার ব্যক্তিগত ফিড →' : 'My Personalized Feed →'}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white border border-stone-200 rounded-xl p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold text-stone-900 font-serif-bn border-b border-stone-100 pb-3">
            {isBn ? 'ব্যক্তিগত প্রোফাইল তথ্য' : 'Personal Reader Profile'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'প্রদর্শিত নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'শহর / অবস্থান' : 'Location'}
              </label>
              <input
                type="text"
                value={locationField}
                onChange={(e) => setLocationField(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isBn ? 'সংক্ষিপ্ত পরিচিতি' : 'Reader Bio'}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isBn ? 'পছন্দের ভাষা' : 'Preferred Language'}
            </label>
            <select
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
            >
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'প্রোফাইল সংরক্ষণ করুন' : 'Save Profile'}</span>
          </button>
        </form>
      )}

      {activeTab === 'bookmarks' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 font-serif-bn border-b border-stone-100 pb-3">
            {isBn ? 'সংরক্ষিত সংবাদ তালিকা (বুকমার্ক)' : 'Saved Bookmarks'}
          </h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-stone-500 py-8 text-center">
              {isBn ? 'এখনো কোনো সংবাদ বুকমার্ক করা হয়নি।' : 'You have not bookmarked any stories yet.'}
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {bookmarks.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <Link
                      to={`/news/${item.slug || item.id}`}
                      className="text-sm font-bold text-stone-900 hover:text-rose-700 font-serif-bn"
                    >
                      {isBn ? item.title : item.titleEn || item.title}
                    </Link>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {item.categoryName} • {formatBengaliRelativeTime(item.publishedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(item.id)}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title={isBn ? 'বুকমার্ক সরান' : 'Remove bookmark'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
              {isBn ? 'সম্প্রতি পঠিত সংবাদের ইতিহাস' : 'Reading History'}
            </h2>
            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'সব ইতিহাস মুছুন' : 'Clear History'}</span>
              </button>
            )}
          </div>
          {historyItems.length === 0 ? (
            <p className="text-sm text-stone-500 py-8 text-center">
              {isBn ? 'আপনার পড়ার ইতিহাস ফাঁকা রয়েছে।' : 'No reading history recorded.'}
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {historyItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <Link
                      to={`/news/${item.slug || item.id}`}
                      className="text-sm font-bold text-stone-900 hover:text-rose-700 font-serif-bn"
                    >
                      {isBn ? item.title : item.titleEn || item.title}
                    </Link>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isBn
                        ? `পড়া হয়েছে: ${formatBengaliRelativeTime(item.readingMeta?.last_viewed_at)} • ${toBengaliNumber(item.readingMeta?.view_count || 1)} বার`
                        : `Viewed ${item.readingMeta?.view_count || 1}x`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHistoryItem(item.id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'follows' && (
        <div className="space-y-6">
          {/* Categories */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-stone-900 font-serif-bn">
              {isBn ? 'বিভাগসমূহ অনুসরণ করুন' : 'Follow News Categories'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {categoriesList.map((cat) => {
                const followed = (summaryIds.category || []).includes(Number(cat.id));
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleFollow('category', cat.id, followed)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                      followed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-rose-400'
                    }`}
                  >
                    {followed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authors */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-stone-900 font-serif-bn">
              {isBn ? 'লেখক ও সাংবাদিকদের অনুসরণ করুন' : 'Follow Authors & Journalists'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {authorsList.map((author) => {
                const followed = (summaryIds.author || []).includes(Number(author.id));
                return (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => toggleFollow('author', author.id, followed)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                      followed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-rose-400'
                    }`}
                  >
                    {followed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{author.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics / Tags */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-stone-900 font-serif-bn">
              {isBn ? 'বিষয় ও টপিক অনুসরণ করুন' : 'Follow Topics & Tags'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag) => {
                const followed = (summaryIds.tag || []).includes(Number(tag.id));
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleFollow('tag', tag.id, followed)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                      followed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-rose-400'
                    }`}
                  >
                    {followed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 max-w-3xl">
          {/* Newsletter Controls */}
          <div className="space-y-3 pb-5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-700" />
              <h3 className="text-base font-bold text-stone-900 font-serif-bn">
                {isBn ? 'ইমেইল নিউজলেটার পছন্দ' : 'Newsletter Preferences'}
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletterEnabled}
                onChange={(e) => setNewsletterEnabled(e.target.checked)}
                className="accent-rose-700"
              />
              <span>{isBn ? 'দৈনিক বার্তা প্রবাহের নিউজলেটার গ্রহণ করতে চাই' : 'Subscribe to NewsFlow Email Newsletter'}</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBn ? 'পাঠানোর সময়সূচি' : 'Delivery Frequency'}
              </label>
              <select
                value={newsletterFrequency}
                onChange={(e) => setNewsletterFrequency(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
              >
                {NEWSLETTER_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {isBn ? freq.labelBn : freq.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoriesList.slice(0, 8).map((cat) => {
                const selected = newsletterCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() =>
                      setNewsletterCategories((prev) =>
                        prev.includes(cat.slug) ? prev.filter((s) => s !== cat.slug) : [...prev, cat.slug]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                      selected ? 'bg-rose-700 text-white border-rose-700' : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Push Notification Controls */}
          <div className="space-y-3 pb-5 border-b border-stone-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-700" />
                <h3 className="text-base font-bold text-stone-900 font-serif-bn">
                  {isBn ? 'পুশ নোটিফিকেশন ও ব্রেকিং অ্যালার্ট' : 'Push Notification Preferences'}
                </h3>
              </div>
              {pushPermissionState !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestBrowserPush}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-[11px] font-semibold cursor-pointer"
                >
                  {isBn ? 'ব্রাউজার অনুমতি চালু করুন' : 'Enable Browser Permission'}
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="accent-rose-700"
              />
              <span>{isBn ? 'ওয়েব পুশ নোটিফিকেশন সক্রিয় রাখুন' : 'Enable Web Push Alerts'}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={breakingAlerts}
                onChange={(e) => setBreakingAlerts(e.target.checked)}
                className="accent-rose-700"
              />
              <span>{isBn ? 'জরুরি ব্রেকিং নিউজ অ্যালার্ট' : 'Breaking News Urgent Alerts'}</span>
            </label>
          </div>

          {/* Hyperlocal Manual District & Upazila Preferences */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-700" />
                <h4 className="text-sm font-bold text-stone-900">
                  {isBn ? 'আপনার পছন্দের জেলা ও উপজেলা (ম্যানুয়াল নির্বাচন)' : 'Preferred District & Upazila (Manual)'}
                </h4>
              </div>
              <Link to="/local" className="text-xs font-bold text-rose-700 hover:underline">
                {isBn ? 'দেশ ও জনপদ পেজে যান →' : 'Open Local News Hub →'}
              </Link>
            </div>
            <LocationSelectorBar
              value={localGeo}
              onChange={(next) => setLocalGeo(next)}
              isBn={isBn}
              compact
              onClear={() => setLocalGeo({ divisionId: '', districtId: '', upazilaId: '', unionId: '', wardId: '' })}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localNotificationsEnabled}
                  onChange={(e) => setLocalNotificationsEnabled(e.target.checked)}
                  className="accent-rose-700"
                />
                <span>{isBn ? 'নির্বাচিত এলাকার স্থানীয় সংবাদ নোটিফিকেশন চালু রাখুন' : 'Enable local news alerts for selected area'}</span>
              </label>
              {localNotificationsEnabled && (
                <select
                  value={localNotificationFrequency}
                  onChange={(e) => setLocalNotificationFrequency(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800"
                >
                  {LOCAL_ALERT_FREQUENCIES.filter((f) => f.value !== 'none').map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {isBn ? freq.labelBn : freq.labelEn}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Personalization & Analytics Consents */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={personalizationEnabled}
                onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                className="accent-rose-700"
              />
              <span>{isBn ? 'অনুসরণকৃত বিষয় অনুযায়ী ব্যক্তিগত নিউজফিড চালু রাখুন' : 'Enable Personalized News Feed'}</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={(e) => setAnalyticsConsent(e.target.checked)}
                className="accent-rose-700"
              />
              <span>{isBn ? 'পড়ার অভিজ্ঞতা উন্নয়নে অজ্ঞাতনামা পাঠক বিশ্লেষণে সম্মতি' : 'Consent to anonymized reading analytics'}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingPrefs ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'পছন্দসমূহ সংরক্ষণ করুন' : 'Save Preferences'}</span>
          </button>
        </form>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6 max-w-3xl">
          {/* Active Sessions Management */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-rose-700" />
                <h3 className="text-base font-bold text-stone-900 font-serif-bn">
                  {isBn ? 'সক্রিয় লগইন সেশনসমূহ' : 'Active Login Sessions'}
                </h3>
              </div>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => revokeOtherSessions()}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  {isBn ? 'অন্যান্য সব সেশন লগআউট করুন' : 'Sign Out Other Devices'}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {sessions.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-stone-900 flex items-center gap-2">
                      <span>{s.device_name || 'Web Browser'}</span>
                      {s.is_current && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {isBn ? 'বর্তমান সেশন' : 'Current Session'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isBn ? 'শেষ ব্যবহৃত:' : 'Last used:'}{' '}
                      {s.last_used_at ? formatBengaliRelativeTime(s.last_used_at) : 'Recently'}
                    </p>
                  </div>
                  {!s.is_current && (
                    <button
                      type="button"
                      onClick={() => revokeSession(s.id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Revoke'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Export & Consent Record */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-serif-bn border-b border-stone-100 pb-2">
              {isBn ? 'ডেটা এক্সপোর্ট ও সম্মতি ইতিহাস' : 'Data Portability & Consent Record'}
            </h3>
            <div className="text-xs text-stone-600 space-y-1">
              <p>
                {isBn ? 'শর্তাবলি সম্মতি:' : 'Terms Accepted:'}{' '}
                <span className="font-mono text-stone-800">{reader?.consents?.terms_accepted_at || 'Recorded'}</span>
              </p>
              <p>
                {isBn ? 'প্রাইভেসি নীতি সম্মতি:' : 'Privacy Accepted:'}{' '}
                <span className="font-mono text-stone-800">{reader?.consents?.privacy_accepted_at || 'Recorded'}</span>
              </p>
            </div>
            <button
              type="button"
              disabled={exportingData}
              onClick={handleDownloadExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {exportingData
                  ? isBn
                    ? 'প্রস্তুত হচ্ছে...'
                    : 'Preparing Export...'
                  : isBn
                  ? 'আমার সব ডেটা ডাউনলোড করুন (JSON)'
                  : 'Download My Personal Data (JSON)'}
              </span>
            </button>
          </div>

          {/* Permanent Account Deletion */}
          <form onSubmit={handleDeleteAccount} className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold font-serif-bn">
                {isBn ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন' : 'Delete Account Permanently'}
              </h3>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              {isBn
                ? 'এই প্রক্রিয়া আপনার প্রোফাইল, বুকমার্ক, পড়ার ইতিহাস, অনুসরণ এবং সকল টোকেন স্থায়ীভাবে মুছে ফেলবে এবং আপনার মন্তব্যগুলো থেকে ব্যক্তিগত পরিচয় অপসারণ করবে।'
                : 'This permanently deletes your profile, bookmarks, reading history, follows, revokes all sessions, and anonymizes any comments you posted.'}
            </p>
            <div>
              <label className="block text-xs font-bold text-rose-900 mb-1">
                {isBn ? 'বর্তমান পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Current Password'}
              </label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-xs rounded-lg border border-rose-300 bg-white"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-rose-900 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="accent-rose-700"
              />
              <span>
                {isBn
                  ? 'আমি বুঝেছি যে এই পদক্ষেপটি ফিরিয়ে আনা সম্ভব নয় এবং স্থায়ীভাবে অ্যাকাউন্ট মুছতে চাই।'
                  : 'I understand this action is irreversible and want to permanently delete my account.'}
              </span>
            </label>
            <button
              type="submit"
              disabled={deletingAccount || !confirmDelete || !deletePassword}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBn ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছুন' : 'Delete Account Forever'}</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'membership' && <ReaderMembershipTab />}
      {activeTab === 'citizen' && <ReaderCitizenTab />}
      {activeTab === 'events' && <ReaderEventsTab />}
    </div>
  );
}

export default ReaderProfilePage;

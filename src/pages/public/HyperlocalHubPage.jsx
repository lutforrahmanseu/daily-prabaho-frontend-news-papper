import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  MapPin,
  Flame,
  Users,
  Compass,
  Bell,
  ShieldCheck,
  Search,
  ChevronRight,
  BookmarkCheck,
  Building2,
  Newspaper,
  CheckCircle2
} from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';
import LocationSelectorBar from '../../components/hyperlocal/LocationSelectorBar.jsx';
import BangladeshDistrictDirectory from '../../components/hyperlocal/BangladeshDistrictDirectory.jsx';
import {
  useGetGeoTreeQuery,
  useGetHyperlocalFeedQuery,
  useGetLocalTrendingQuery,
  useGetDivisionPageQuery,
  useGetDistrictPageQuery,
  useGetUpazilaPageQuery,
  useGetPublicCorrespondentsQuery,
  useGetReaderHyperlocalFeedQuery,
  useUpdateReaderHyperlocalPreferencesMutation
} from '../../store/api/hyperlocalApi.js';
import {
  selectIsReaderAuthenticated,
  selectReaderUser,
  setReaderProfile
} from '../../store/readerSlice.js';
import {
  getArticlePrimaryGeo,
  buildPrivacySafeLocalPreferencePayload,
  LOCAL_ALERT_FREQUENCIES
} from '../../utils/hyperlocalHelpers.js';
import { toBengaliNumber, formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';

export function HyperlocalHubPage({ levelMode = 'hub' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { divisionSlug, districtSlug, upazilaSlug } = useParams();

  const { language } = useSelector((state) => state.ui);
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const reader = useSelector(selectReaderUser);
  const isBn = language === 'bn';

  const identifier = upazilaSlug || districtSlug || divisionSlug || null;
  const activeLevel = upazilaSlug ? 'upazila' : districtSlug ? 'district' : divisionSlug ? 'division' : levelMode;

  const [activeTab, setActiveTab] = useState('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [manualSelection, setManualSelection] = useState({
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
    wardId: ''
  });
  const [localAlertsEnabled, setLocalAlertsEnabled] = useState(false);
  const [localAlertFreq, setLocalAlertFreq] = useState('daily');

  useEffect(() => {
    if (reader) {
      setManualSelection((prev) => ({
        divisionId: prev.divisionId || (reader.preferred_division_id ? String(reader.preferred_division_id) : ''),
        districtId: prev.districtId || (reader.preferred_district_id ? String(reader.preferred_district_id) : ''),
        upazilaId: prev.upazilaId || (reader.preferred_upazila_id ? String(reader.preferred_upazila_id) : ''),
        unionId: prev.unionId || (reader.preferred_union_id ? String(reader.preferred_union_id) : ''),
        wardId: prev.wardId || (reader.preferred_ward_id ? String(reader.preferred_ward_id) : '')
      }));
      setLocalAlertsEnabled(Boolean(reader.preferences?.local_notifications_enabled));
      setLocalAlertFreq(reader.preferences?.local_notification_frequency || 'daily');
    }
  }, [reader]);

  useEffect(() => {
    setPage(1);
  }, [identifier, manualSelection.divisionId, manualSelection.districtId, manualSelection.upazilaId, sortBy, searchTerm]);

  const { data: geoTree = [] } = useGetGeoTreeQuery();

  const divQuery = useGetDivisionPageQuery(
    { identifier: divisionSlug, search: searchTerm || undefined, per_page: 12 },
    { skip: activeLevel !== 'division' || !divisionSlug }
  );
  const distQuery = useGetDistrictPageQuery(
    { identifier: districtSlug, search: searchTerm || undefined, per_page: 12 },
    { skip: activeLevel !== 'district' || !districtSlug }
  );
  const upzQuery = useGetUpazilaPageQuery(
    { identifier: upazilaSlug, search: searchTerm || undefined, per_page: 12 },
    { skip: activeLevel !== 'upazila' || !upazilaSlug }
  );

  const hubFeedQuery = useGetHyperlocalFeedQuery(
    {
      division_id: manualSelection.divisionId || undefined,
      district_id: manualSelection.districtId || undefined,
      upazila_id: manualSelection.upazilaId || undefined,
      union_id: manualSelection.unionId || undefined,
      ward_id: manualSelection.wardId || undefined,
      only_hyperlocal: !(manualSelection.divisionId || manualSelection.districtId || manualSelection.upazilaId) ? 1 : undefined,
      search: searchTerm || undefined,
      sort: sortBy,
      per_page: 12,
      page
    },
    { skip: activeLevel !== 'hub' }
  );

  const { data: hubTrending = [] } = useGetLocalTrendingQuery(
    {
      division_id: manualSelection.divisionId || undefined,
      district_id: manualSelection.districtId || undefined,
      upazila_id: manualSelection.upazilaId || undefined,
      limit: 6
    },
    { skip: activeLevel !== 'hub' }
  );

  const activeLocationQuery =
    activeLevel === 'upazila' ? upzQuery : activeLevel === 'district' ? distQuery : activeLevel === 'division' ? divQuery : null;
  const pageData = activeLocationQuery?.data;
  const currentLocation = pageData?.location || null;

  const articles = activeLevel === 'hub' ? hubFeedQuery.data?.items || [] : pageData?.items || [];
  const trendingStories = activeLevel === 'hub' ? hubTrending : pageData?.trending || [];
  const subLocations = pageData?.sub_locations || [];

  const { data: correspondentsData } = useGetPublicCorrespondentsQuery({
    division_id: currentLocation?.level === 'division' ? currentLocation.id : manualSelection.divisionId || undefined,
    district_id: currentLocation?.level === 'district' ? currentLocation.id : manualSelection.districtId || undefined,
    upazila_id: currentLocation?.level === 'upazila' ? currentLocation.id : manualSelection.upazilaId || undefined,
    per_page: 24
  });

  const locationCorrespondents =
    activeLevel !== 'hub' && Array.isArray(pageData?.correspondents) && pageData.correspondents.length > 0
      ? pageData.correspondents
      : correspondentsData?.items || [];

  const { data: readerLocalFeed, isFetching: loadingReaderFeed } = useGetReaderHyperlocalFeedQuery(
    {
      division_id: manualSelection.divisionId || undefined,
      district_id: manualSelection.districtId || undefined,
      upazila_id: manualSelection.upazilaId || undefined
    },
    { skip: !isReaderAuth || activeTab !== 'my-local' }
  );

  const [saveReaderHyperlocal, { isLoading: savingLocationPref }] = useUpdateReaderHyperlocalPreferencesMutation();

  const handleManualSelectorChange = (nextSel, resolvedObjs) => {
    setManualSelection(nextSel);
    if (activeLevel !== 'hub') {
      if (resolvedObjs?.upazila?.slug) {
        navigate(`/local/upazila/${resolvedObjs.upazila.slug}`);
      } else if (resolvedObjs?.district?.slug) {
        navigate(`/local/district/${resolvedObjs.district.slug}`);
      } else if (resolvedObjs?.division?.slug) {
        navigate(`/local/${resolvedObjs.division.slug}`);
      } else {
        navigate('/local');
      }
    }
  };

  const handleSavePreferredLocation = async () => {
    if (!isReaderAuth) {
      navigate('/reader/login');
      return;
    }
    try {
      const updated = await saveReaderHyperlocal(
        buildPrivacySafeLocalPreferencePayload({
          ...manualSelection,
          localNotificationsEnabled: localAlertsEnabled,
          localNotificationFrequency: localAlertFreq
        })
      ).unwrap();
      dispatch(setReaderProfile(updated));
      sweetAlert.success(isBn ? 'আপনার পছন্দের এলাকা সংরক্ষিত হয়েছে' : 'Preferred local area saved');
    } catch {
      sweetAlert.error(isBn ? 'এলাকা সংরক্ষণে সমস্যা হয়েছে' : 'Could not save preferred area');
    }
  };

  const pageTitle = useMemo(() => {
    if (currentLocation) {
      return isBn
        ? `${currentLocation.name_bn} — আঞ্চলিক ও স্থানীয় সংবাদ`
        : `${currentLocation.name_en} — Local News`;
    }
    return isBn ? 'বাংলাদেশ হাইপারলোকাল নেটওয়ার্ক — ৬৪ জেলার সংবাদ' : 'Bangladesh Hyperlocal News Network';
  }, [currentLocation, isBn]);

  const displayArticles = activeTab === 'my-local' && isReaderAuth ? readerLocalFeed?.items || [] : articles;
  const isFeedLoading =
    activeTab === 'my-local' ? loadingReaderFeed : activeLevel === 'hub' ? hubFeedQuery.isFetching : activeLocationQuery?.isFetching;

  return (
    <div className="py-6 space-y-6">
      <SEO
        title={pageTitle}
        description={
          isBn
            ? 'বাংলাদেশের ৮ বিভাগ, ৬৪ জেলা ও উপজেলা-ওয়ার্ড ভিত্তিক যাচাইকৃত স্থানীয় সংবাদ।'
            : 'Verified hyperlocal news across Bangladesh Divisions, 64 Districts, Upazilas, Unions, and Wards.'
        }
      />

      {/* Hero Header & Breadcrumb */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-300">
          <Link to="/" className="hover:text-white">
            {isBn ? 'প্রচ্ছদ' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/local" className="hover:text-white font-semibold text-rose-200">
            {isBn ? 'দেশ ও জনপদ (হাইপারলোকাল)' : 'Bangladesh Local Network'}
          </Link>
          {currentLocation?.division && currentLocation.level !== 'division' && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/local/${currentLocation.division.slug}`} className="hover:text-white">
                {isBn ? currentLocation.division.name_bn : currentLocation.division.name_en}
              </Link>
            </>
          )}
          {currentLocation?.district && !['division', 'district'].includes(currentLocation.level) && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/local/district/${currentLocation.district.slug}`} className="hover:text-white">
                {isBn ? currentLocation.district.name_bn : currentLocation.district.name_en}
              </Link>
            </>
          )}
          {currentLocation && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white font-bold">{isBn ? currentLocation.name_bn : currentLocation.name_en}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-700/80 text-white">
              <MapPin className="w-3.5 h-3.5" />
              <span>{isBn ? 'বিভাগ > জেলা > উপজেলা > ইউনিয়ন > ওয়ার্ড' : 'Division > District > Upazila > Union > Ward'}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-bn">{pageTitle}</h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              {isBn
                ? 'কোনো GPS ট্র্যাকিং ছাড়াই ম্যানুয়ালি আপনার জেলা ও উপজেলা নির্বাচন করুন এবং নিজ এলাকার যাচাইকৃত স্থানীয় প্রতিবেদন পড়ুন।'
                : 'Manually pick your preferred District and Upazila without passive location tracking to read verified local reporting.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSavePreferredLocation}
              disabled={savingLocationPref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>
                {isReaderAuth
                  ? savingLocationPref
                    ? isBn
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : isBn
                      ? 'নির্বাচিত এলাকা আমার ফিডে সংরক্ষণ করুন'
                      : 'Save Area to My Feed'
                  : isBn
                    ? 'লগইন করে এলাকা সেভ করুন'
                    : 'Sign In to Save Area'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy-first Manual Cascading Selector */}
      <LocationSelectorBar
        value={manualSelection}
        onChange={handleManualSelectorChange}
        includeDeepLevels={true}
        isBn={isBn}
        onClear={() => {
          setManualSelection({ divisionId: '', districtId: '', upazilaId: '', unionId: '', wardId: '' });
          if (activeLevel !== 'hub') navigate('/local');
        }}
      />

      {/* Sub-locations Strip when viewing a Division/District/Upazila/Union */}
      {subLocations.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5">
          <p className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-rose-700" />
            <span>
              {isBn
                ? `${currentLocation?.name_bn || ''} এর অধীনস্থ এলাকাসমূহ:`
                : `Areas under ${currentLocation?.name_en || ''}:`}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {subLocations.map((sub) => {
              const targetUrl =
                sub.level === 'district'
                  ? `/local/district/${sub.slug}`
                  : sub.level === 'upazila'
                    ? `/local/upazila/${sub.slug}`
                    : `/local/district/${currentLocation?.district?.slug || currentLocation?.slug}?upazila=${sub.id}`;
              return (
                <Link
                  key={sub.id}
                  to={targetUrl}
                  className="px-3 py-1.5 rounded-full bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-xs font-semibold text-stone-800 transition-colors"
                >
                  {isBn ? sub.name_bn : sub.name_en}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Tabs + Search/Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'feed', labelBn: 'আঞ্চলিক সংবাদ', labelEn: 'Regional News', icon: Newspaper },
            { id: 'my-local', labelBn: 'আমার এলাকার পাতা', labelEn: 'My Local Feed', icon: Compass },
            { id: 'directory', labelBn: '৬৪ জেলা ডিরেক্টরি', labelEn: '64 Districts', icon: MapPin },
            { id: 'correspondents', labelBn: 'স্থানীয় প্রতিনিধি', labelEn: 'Correspondents', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  active ? 'bg-rose-700 text-white shadow-xs' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {(activeTab === 'feed' || activeTab === 'my-local') && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'এলাকার সংবাদ খুঁজুন...' : 'Search local news...'}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            {activeLevel === 'hub' && activeTab === 'feed' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="latest">{isBn ? 'সর্বশেষ' : 'Latest'}</option>
                <option value="trending">{isBn ? 'স্থানীয় ট্রেন্ডিং' : 'Local Trending'}</option>
                <option value="popular">{isBn ? 'সর্বাধিক পঠিত' : 'Most Read'}</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'directory' ? (
        <BangladeshDistrictDirectory tree={geoTree} isBn={isBn} activeDistrictSlug={districtSlug} />
      ) : activeTab === 'correspondents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationCorrespondents.map((corr) => (
            <div key={corr.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif-bn">
                    {isBn ? corr.full_name_bn : corr.full_name_en || corr.full_name_bn}
                  </h3>
                  <p className="text-xs text-rose-700 font-semibold">
                    {isBn ? corr.designation_bn : corr.designation_en}
                  </p>
                </div>
                {corr.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                  </span>
                )}
              </div>
              {corr.bio_bn && <p className="text-xs text-stone-600 line-clamp-3">{isBn ? corr.bio_bn : corr.bio_en || corr.bio_bn}</p>}
              {Array.isArray(corr.coverage_areas) && corr.coverage_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {corr.coverage_areas.map((area) => (
                    <span
                      key={area.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700"
                    >
                      {isBn ? area.location?.name_bn : area.location?.name_en}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {locationCorrespondents.length === 0 && (
            <p className="col-span-full text-center text-sm text-stone-500 py-10">
              {isBn ? 'নির্বাচিত এলাকায় এখনো কোনো যাচাইকৃত প্রতিনিধি যুক্ত হয়নি।' : 'No verified correspondents listed for this area yet.'}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Articles Feed */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 'my-local' && (
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-rose-700" />
                    <span>{isBn ? 'ঐচ্ছিক স্থানীয় সংবাদ নোটিফিকেশন ও ম্যানুয়াল ফিড' : 'Optional Local News Alerts & Feed'}</span>
                  </h2>
                  <p className="text-xs text-stone-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      {isBn
                        ? 'আপনার সম্মতি ও ম্যানুয়ালি নির্বাচিত জেলা/উপজেলা ছাড়া কোনো লোকেশন তথ্য সংগ্রহ করা হয় না।'
                        : 'Your location is strictly manual; no passive device coordinates are collected.'}
                    </span>
                  </p>
                </div>

                {isReaderAuth ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localAlertsEnabled}
                        onChange={(e) => setLocalAlertsEnabled(e.target.checked)}
                        className="accent-rose-700"
                      />
                      <span>{isBn ? 'লোকাল অ্যালার্ট' : 'Local Alerts'}</span>
                    </label>
                    {localAlertsEnabled && (
                      <select
                        value={localAlertFreq}
                        onChange={(e) => setLocalAlertFreq(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      >
                        {LOCAL_ALERT_FREQUENCIES.filter((f) => f.value !== 'none').map((f) => (
                          <option key={f.value} value={f.value}>
                            {isBn ? f.labelBn : f.labelEn}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={handleSavePreferredLocation}
                      disabled={savingLocationPref}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                    >
                      {isBn ? 'সংরক্ষণ' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/reader/login"
                    className="px-3.5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold shrink-0"
                  >
                    {isBn ? 'লগইন করুন' : 'Sign In'}
                  </Link>
                )}
              </div>
            )}

            {isFeedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-stone-200 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : displayArticles.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2">
                <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">
                  {isBn ? 'এই এলাকায় এখনো কোনো প্রকাশিত প্রতিবেদন নেই।' : 'No published articles found for this area yet.'}
                </p>
                <p className="text-xs text-stone-500">
                  {isBn ? 'উপরের ড্রপডাউন থেকে অন্য জেলা বা ৬৪ জেলা ডিরেক্টরি থেকে এলাকা নির্বাচন করে দেখুন।' : 'Select another district above or browse the 64-district directory.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayArticles.map((item) => {
                  const geoBadge = getArticlePrimaryGeo(item, isBn);
                  return (
                    <article
                      key={item.id}
                      className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-rose-300 transition-colors"
                    >
                      {item.image && (
                        <Link to={`/news/${item.slug}`} className="sm:w-48 aspect-video rounded-xl overflow-hidden bg-stone-100 shrink-0">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </Link>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {geoBadge && (
                            <Link
                              to={geoBadge.path}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold hover:bg-rose-100"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{geoBadge.label}</span>
                            </Link>
                          )}
                          <span className="text-stone-500">{formatBengaliRelativeTime(item.publishedAt)}</span>
                          {item.correspondent && (
                            <span className="text-emerald-800 font-semibold">
                              • {isBn ? item.correspondent.full_name_bn : item.correspondent.full_name_en}
                            </span>
                          )}
                        </div>
                        <Link to={`/news/${item.slug}`} className="block">
                          <h2 className="text-lg font-bold text-stone-900 hover:text-rose-700 font-serif-bn leading-snug">
                            {item.title}
                          </h2>
                        </Link>
                        {item.excerpt && <p className="text-xs text-stone-600 line-clamp-2">{item.excerpt}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Local Trending + Area Stats */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
                <Flame className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'আঞ্চলিক ট্রেন্ডিং সংবাদ' : 'Local Trending Stories'}</span>
              </h3>
              <div className="space-y-3">
                {trendingStories.map((tItem, idx) => {
                  const tGeo = getArticlePrimaryGeo(tItem, isBn);
                  return (
                    <Link
                      key={tItem.id}
                      to={`/news/${tItem.slug}`}
                      className="flex items-start gap-2.5 group pb-2.5 border-b border-stone-100 last:border-b-0 last:pb-0"
                    >
                      <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {isBn ? toBengaliNumber(idx + 1) : idx + 1}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-stone-800 group-hover:text-rose-700 font-serif-bn line-clamp-2">
                          {tItem.title}
                        </p>
                        {tGeo && <p className="text-[10px] font-semibold text-stone-500">{tGeo.shortLabel}</p>}
                      </div>
                    </Link>
                  );
                })}
                {trendingStories.length === 0 && (
                  <p className="text-xs text-stone-500 py-3">
                    {isBn ? 'এখনো স্থানীয় ট্রেন্ডিং তালিকা তৈরি হয়নি।' : 'No trending local stories yet.'}
                  </p>
                )}
              </div>
            </div>

            {locationCorrespondents.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>{isBn ? 'এলাকার যাচাইকৃত প্রতিনিধি' : 'Verified Area Correspondents'}</span>
                </h3>
                <div className="space-y-2.5">
                  {locationCorrespondents.slice(0, 4).map((corr) => (
                    <div key={corr.id} className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-stone-800">{isBn ? corr.full_name_bn : corr.full_name_en}</p>
                        <p className="text-[11px] text-stone-500">{isBn ? corr.designation_bn : corr.designation_en}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default HyperlocalHubPage;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { baseApi } from '../../store/api/baseApi.js';
import {
  useGetAllSettingsQuery,
  useUpdateSettingsMutation
} from '../../store/api/settingsApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import {
  Save,
  RefreshCw,
  CheckCircle,
  ShieldAlert,
  Globe,
  Phone,
  Share2,
  Menu,
  FileText,
  Languages,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import sweetAlert from '../../utils/sweetAlert.js';

const buildSettingsState = (normalized = {}, fallback = {}) => ({
  websiteNameBn: normalized.websiteNameBn || fallback.websiteNameBn || 'দৈনিক বার্তা প্রবাহ',
  websiteNameEn: normalized.websiteNameEn || fallback.websiteNameEn || 'Daily Prabaho',
  tagline: normalized.tagline || fallback.tagline || 'সত্যের সন্ধানে নির্ভীক কণ্ঠস্বর',
  logo: normalized.logoUrl || normalized.logo || fallback.logo || '/logo.svg',
  favicon: normalized.faviconUrl || normalized.favicon || fallback.favicon || '/favicon.ico',
  editorName: normalized.editor_name || normalized.editorName || fallback.editorName || '',
  publisherName: normalized.publisher_name || normalized.publisherName || fallback.publisherName || '',
  publisherAddress: normalized.contactAddress || fallback.publisherAddress || '',
  editorEmail: normalized.editor_email || normalized.editorEmail || fallback.editorEmail || '',
  email: normalized.email || fallback.email || '',
  phone: normalized.phone || fallback.phone || '',
  hotline: normalized.hotline || fallback.hotline || '',
  socialLinks: {
    facebook: normalized.socialLinks?.facebook || fallback.socialLinks?.facebook || '',
    twitter: normalized.socialLinks?.twitter || fallback.socialLinks?.twitter || '',
    youtube: normalized.socialLinks?.youtube || fallback.socialLinks?.youtube || '',
    instagram: normalized.socialLinks?.instagram || fallback.socialLinks?.instagram || '',
    linkedin: normalized.social_links?.linkedin || normalized.socialLinks?.linkedin || fallback.socialLinks?.linkedin || '',
    telegram: normalized.social_links?.telegram || normalized.socialLinks?.telegram || fallback.socialLinks?.telegram || ''
  },
  footerSettings: {
    copyrightBn: normalized.footer_settings?.copyrightBn || normalized.footerSettings?.copyrightBn || fallback.footerSettings?.copyrightBn || '© ২০২৬ দৈনিক বার্তা প্রবাহ। সর্বস্বত্ব সংরক্ষিত।',
    pressRegNo: normalized.footer_settings?.pressRegNo || normalized.footerSettings?.pressRegNo || fallback.footerSettings?.pressRegNo || '',
    editorialNotice: normalized.footer_settings?.editorialNotice || normalized.footerSettings?.editorialNotice || fallback.footerSettings?.editorialNotice || '',
    showEpaperLink: normalized.footer_settings?.showEpaperLink ?? normalized.footerSettings?.showEpaperLink ?? fallback.footerSettings?.showEpaperLink ?? true
  },
  languageSettings: {
    defaultLanguage: normalized.language_settings?.defaultLanguage || normalized.defaultLanguage || fallback.languageSettings?.defaultLanguage || 'bn',
    numerals: normalized.language_settings?.numerals || fallback.languageSettings?.numerals || 'bengali',
    timeZone: normalized.language_settings?.timeZone || fallback.languageSettings?.timeZone || 'Asia/Dhaka (GMT+6)',
    dateFormat: normalized.language_settings?.dateFormat || fallback.languageSettings?.dateFormat || 'DD MMMM YYYY'
  }
});

export function AdminSettingsPage() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const fallbackSettings = adminState?.settings || {};
  const canManageSettings = hasEffectivePermission(authState, adminState, 'settings.manage');

  const { data: apiSettings, isLoading: isSettingsLoading, isError, error, refetch } = useGetAllSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [formData, setFormData] = useState(() => buildSettingsState({}, fallbackSettings));
  const [navItems, setNavItems] = useState(fallbackSettings.navigationMenu || []);
  const [activeTab, setActiveTab] = useState('general');

  // Status & feedback
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const normalized = apiSettings?.normalized;
    if (!normalized) return;
    setFormData(buildSettingsState(normalized, fallbackSettings));
    if (Array.isArray(normalized.navigation_menu) && normalized.navigation_menu.length > 0) {
      setNavItems(normalized.navigation_menu);
    }
  }, [apiSettings, fallbackSettings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleToggleNavVisibility = (itemId) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isVisible: !item.isVisible } : item))
    );
  };

  const handleMoveNavItem = (index, direction) => {
    const nextItems = [...navItems];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextItems.length) return;
    const temp = nextItems[index];
    nextItems[index] = nextItems[targetIdx];
    nextItems[targetIdx] = temp;
    setNavItems(nextItems);
  };

  // Persist all setting groups to Laravel `POST /api/v1/settings`
  const handleSave = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!canManageSettings) {
      const msg = 'সেটিংস পরিবর্তন করার অনুমতি আপনার নেই।';
      setAuthError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    try {
      const groupPayloads = [
        {
          group: 'general',
          settings: {
            site_name: formData.websiteNameBn,
            site_name_en: formData.websiteNameEn,
            site_tagline: formData.tagline,
            logo_url: formData.logo,
            favicon_url: formData.favicon
          }
        },
        {
          group: 'contact',
          settings: {
            contact_info: {
              email: formData.email,
              phone: formData.phone,
              address: formData.publisherAddress
            },
            editor_name: formData.editorName,
            publisher_name: formData.publisherName,
            editor_email: formData.editorEmail,
            hotline: formData.hotline
          }
        },
        {
          group: 'social',
          settings: {
            social_links: formData.socialLinks
          }
        },
        {
          group: 'navigation',
          settings: {
            navigation_menu: navItems
          }
        },
        {
          group: 'footer',
          settings: {
            footer_settings: formData.footerSettings
          }
        },
        {
          group: 'language',
          settings: {
            default_language: formData.languageSettings.defaultLanguage,
            language_settings: formData.languageSettings
          }
        }
      ];

      await Promise.all(groupPayloads.map((payload) => updateSettings(payload).unwrap()));
      await sweetAlert.success(
        'সেটিংস সংরক্ষিত হয়েছে!',
        'সকল কনফিগারেশন সেটিংস সফলভাবে লারাভেল সার্ভারে সংরক্ষিত হয়েছে।'
      );
    } catch (err) {
      const msg = extractApiError(err, 'সেটিংস সংরক্ষণ করা যায়নি।');
      setAuthError(msg);
      await sweetAlert.error('সংরক্ষণ ব্যর্থ হয়েছে', msg);
    }
  };

  // Purge RTK Query client cache & re-sync with Laravel API
  const handleFlushCache = async () => {
    setAuthError('');
    if (!canManageSettings) {
      const msg = 'ক্যাশ ফ্লাশ করার অনুমতি আপনার নেই।';
      setAuthError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    setIsFlushingCache(true);
    try {
      dispatch(baseApi.util.invalidateTags(['Settings', 'News', 'Category', 'Advertisement', 'Tag']));
      await refetch().unwrap();
      await sweetAlert.success(
        'ক্যাশ রিফ্রেশ সম্পন্ন!',
        'এপিআই ক্যাশ এবং ওয়েবসাইট কনফিগারেশন সফলভাবে রিফ্রেশ করা হয়েছে।'
      );
    } catch (err) {
      await sweetAlert.error('রিফ্রেশ ব্যর্থ হয়েছে', extractApiError(err, 'ক্যাশ রিফ্রেশ করা যায়নি।'));
    } finally {
      setIsFlushingCache(false);
    }
  };

  if (isSettingsLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-rose-700 mx-auto mb-2" />
        <p className="text-xs font-semibold">ওয়েবসাইট কনফিগারেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {(authError || isError) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">
              {authError || extractApiError(error, 'সেটিংস লোড করা যায়নি।')}
            </span>
          </div>
          {authError && (
            <button
              type="button"
              onClick={() => setAuthError('')}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            ওয়েবসাইট ও সিস্টেম কনফিগারেশন (Website Settings)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            পত্রিকার লোগো, যোগাযোগ, সামাজিক যোগাযোগ মাধ্যম, নেভিগেশন মেনু ও আঞ্চলিক ভাষা সেটিংস
          </p>
        </div>

        <button
          type="button"
          onClick={handleFlushCache}
          disabled={isFlushingCache}
          className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFlushingCache ? 'animate-spin' : ''}`} />
          <span>ক্যাশ ফ্লাশ (Refresh API Cache)</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'general' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>নাম ও লোগো (Brand Identity)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'contact' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>যোগাযোগ ও সম্পাদকীয় দপ্তর</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'social' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>সোশ্যাল মিডিয়া লিংক</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('navigation')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'navigation' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>নেভিগেশন মেনু ({navItems.filter((i) => i.isVisible).length} সক্রিয়)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'footer' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ফুটার ও লিগ্যাল নোটিস</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('language')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'language' ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>ভাষা ও আঞ্চলিক ফরম্যাট</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'general' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                পত্রিকার মূল নাম, লোগো ও ফেভিকন
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                হেডার ব্র্যান্ডিং, সার্চ ইঞ্জিন টাইটেল ও ব্রাউজার ট্যাব আইকন
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ওয়েবসাইটের নাম (বাংলা)
                </label>
                <input
                  type="text"
                  required
                  value={formData.websiteNameBn || ''}
                  onChange={(e) => handleChange('websiteNameBn', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ওয়েবসাইটের নাম (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.websiteNameEn || ''}
                  onChange={(e) => handleChange('websiteNameEn', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  স্লোগান বা ট্যাগলাইন (Tagline)
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  প্রধান ব্র্যান্ড লোগো ইউআরএল (Primary Logo)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={formData.logo || ''}
                    onChange={(e) => handleChange('logo', e.target.value)}
                    placeholder="/logo.svg অথবা রিমোট ইমেজ লিংক"
                    className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <div className="w-12 h-10 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <span className="font-bold text-rose-700 font-serif-bn text-sm">প্র</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ফেভিকন আইকন ইউআরএল (Favicon .ico / .png)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={formData.favicon || ''}
                    onChange={(e) => handleChange('favicon', e.target.value)}
                    placeholder="/favicon.ico"
                    className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <div className="w-10 h-10 rounded-xl border border-stone-200 bg-stone-900 flex items-center justify-center p-1 text-white font-serif-bn font-bold text-xs shrink-0">
                    প্র
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                সম্পাদকীয় দপ্তর ও যোগাযোগের বিবরণ
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                যোগাযোগের ঠিকানা, নিউজরুমের ফোন ও প্রাতিষ্ঠানিক ইমেইল
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  প্রধান সম্পাদকের নাম
                </label>
                <input
                  type="text"
                  value={formData.editorName || ''}
                  onChange={(e) => handleChange('editorName', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  প্রকাশক ও প্রকাশনা সংস্থা
                </label>
                <input
                  type="text"
                  value={formData.publisherName || ''}
                  onChange={(e) => handleChange('publisherName', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  কার্যালয়ের পূর্ণাঙ্গ ঠিকানা (Office Address)
                </label>
                <textarea
                  rows={2}
                  value={formData.publisherAddress || ''}
                  onChange={(e) => handleChange('publisherAddress', e.target.value)}
                  className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  সম্পাদকীয় ইমেইল (Editorial Desk)
                </label>
                <input
                  type="email"
                  value={formData.editorEmail || ''}
                  onChange={(e) => handleChange('editorEmail', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  সাধারণ ও পাঠক যোগাযোগ ইমেইল
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  টেলিফোন নম্বর
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ২৪/৭ ব্রেকিং নিউজ হটলাইন
                </label>
                <input
                  type="text"
                  value={formData.hotline || ''}
                  onChange={(e) => handleChange('hotline', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                অফিসিয়াল সোশ্যাল মিডিয়া হ্যান্ডেল
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                হেডার, ফুটার ও সোশ্যাল শেয়ারিং বাটনসমূহে ব্যবহৃত লিংক
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ফেসবুক পেজ (Facebook Page URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.facebook || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'facebook', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  এক্স / টুইটার প্রোফাইল (X Profile URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'twitter', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ইউটিউব চ্যানেল (YouTube Channel URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.youtube || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'youtube', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ইনস্টাগ্রাম (Instagram URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.instagram || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'instagram', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  লিংকডইন (LinkedIn Page URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'linkedin', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  টেলিগ্রাম চ্যানেল (Telegram Channel URL)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.telegram || ''}
                  onChange={(e) => handleNestedChange('socialLinks', 'telegram', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  মূল নেভিগেশন বার মেনু পরিচালনা (Navbar Menu Manager)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  প্রধান হেডার বারে প্রদর্শিত বিভাগ ও লিংকসমূহের দৃশ্যমানতা এবং ক্রম নির্ধারণ করুন
                </p>
              </div>
            </div>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
              {navItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    item.isVisible ? 'bg-white hover:bg-stone-50' : 'bg-stone-50/70 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-mono font-bold text-stone-500">
                      {idx + 1}
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${item.isVisible ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                        {item.labelBn}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {item.labelEn} • {item.path}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveNavItem(idx, 'up')}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === navItems.length - 1}
                      onClick={() => handleMoveNavItem(idx, 'down')}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleNavVisibility(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        item.isVisible
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-stone-200 bg-stone-100 text-stone-500'
                      }`}
                    >
                      {item.isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>সক্রিয়</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>লুকানো</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                ফুটার ও আইনি বিজ্ঞপ্তি সেটিংস (Footer & Legal Notices)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                কপিরাইট স্বত্বাধিকার, প্রেস রেজিস্ট্রেশন ও ডিসক্লেইমার
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  কপিরাইট টেক্সট (বাংলা)
                </label>
                <input
                  type="text"
                  value={formData.footerSettings?.copyrightBn || ''}
                  onChange={(e) => handleNestedChange('footerSettings', 'copyrightBn', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  তথ্য মন্ত্রণালয় রেজিস্ট্রেশন নম্বর
                </label>
                <input
                  type="text"
                  value={formData.footerSettings?.pressRegNo || ''}
                  onChange={(e) => handleNestedChange('footerSettings', 'pressRegNo', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  সম্পাদকীয় ও আইনি সতর্কবার্তা (Editorial Notice / Disclaimer)
                </label>
                <textarea
                  rows={3}
                  value={formData.footerSettings?.editorialNotice || ''}
                  onChange={(e) => handleNestedChange('footerSettings', 'editorialNotice', e.target.value)}
                  className="w-full p-3 border border-stone-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.footerSettings?.showEpaperLink ?? true}
                    onChange={(e) => handleNestedChange('footerSettings', 'showEpaperLink', e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300"
                  />
                  <span>ফুটারে ডিজিটাল ই-পেপার লিংক প্রদর্শন করুন</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold font-serif-bn text-stone-900">
                ভাষা, ক্যালেন্ডার ও আঞ্চলিক ফরম্যাটিং (Language & Localization)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                ডিফল্ট প্রকাশনা ভাষা, সংখ্যা রূপান্তর ও টাইমজোন
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ডিফল্ট প্রকাশনা ভাষা (Default Language)
                </label>
                <select
                  value={formData.languageSettings?.defaultLanguage || 'bn'}
                  onChange={(e) => handleNestedChange('languageSettings', 'defaultLanguage', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="bn">বাংলা (Bengali - Default)</option>
                  <option value="en">English (ইংরেজি)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  সংখ্যা ও তারিখ প্রদর্শন রীতি (Numerals Formatting)
                </label>
                <select
                  value={formData.languageSettings?.numerals || 'bengali'}
                  onChange={(e) => handleNestedChange('languageSettings', 'numerals', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="bengali">বাংলা সংখ্যা (১, ২, ৩, ৪, ৫)</option>
                  <option value="western">ইংরেজি সংখ্যা (1, 2, 3, 4, 5)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  নিউজ সার্ভার টাইমজোন (Server Timezone)
                </label>
                <input
                  type="text"
                  value={formData.languageSettings?.timeZone || 'Asia/Dhaka (GMT+6)'}
                  onChange={(e) => handleNestedChange('languageSettings', 'timeZone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  তারিখের বিন্যাস (Date Format String)
                </label>
                <input
                  type="text"
                  value={formData.languageSettings?.dateFormat || 'DD MMMM YYYY'}
                  onChange={(e) => handleNestedChange('languageSettings', 'dateFormat', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>পরিবর্তন নিশ্চিত করতে সেভ বাটনে ক্লিক করুন</span>
          </div>

          <button
            type="submit"
            disabled={isSaving || !canManageSettings}
            className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'কনফিগারেশন সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettingsPage;

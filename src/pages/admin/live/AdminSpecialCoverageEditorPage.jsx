import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Plus,
  Save,
  Trash2,
  Video
} from 'lucide-react';
import {
  useCreateSpecialCoverageItemMutation,
  useDeleteSpecialCoverageItemMutation,
  useGetAdminSpecialCoverageQuery,
  useTransitionSpecialCoverageMutation,
  useUpdateSpecialCoverageMutation
} from '../../../store/api/liveCoverageApi.js';
import { useGetAdminNewsListQuery } from '../../../store/api/newsApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import {
  COVERAGE_SECTION_META,
  COVERAGE_STATUS_META,
  SPECIAL_COVERAGE_TYPE_META
} from '../../../utils/liveCoverageHelpers.js';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import sweetAlert from '../../../utils/sweetAlert.js';
import { DynamicInfographicCard } from '../../../components/live/LiveCoverageShared.jsx';

export function AdminSpecialCoverageEditorPage() {
  const { id } = useParams();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canPublish = hasEffectivePermission(authState, adminState, 'coverage.publish');

  const { data: coverage, isLoading } = useGetAdminSpecialCoverageQuery(id, { skip: !id });
  const { data: newsData } = useGetAdminNewsListQuery({ status: 'published', per_page: 40 });
  const { data: mediaData } = useGetMediaListQuery({ per_page: 24 });

  const [updateCoverage, { isLoading: isSavingMeta }] = useUpdateSpecialCoverageMutation();
  const [transitionCoverage] = useTransitionSpecialCoverageMutation();
  const [createItem, { isLoading: isAddingItem }] = useCreateSpecialCoverageItemMutation();
  const [deleteItem] = useDeleteSpecialCoverageItemMutation();

  const [activeTab, setActiveTab] = useState('settings'); // settings | news | timeline | media | infographics

  // Settings + Topics + Hero KPI state
  const [metaForm, setMetaForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    coverage_type: 'election',
    badge_text: '',
    hero_image: '',
    theme_color: '#be123c',
    is_featured: true,
    show_in_navbar: true,
    topics: [],
    infographic_summary: []
  });
  const [newTopicLabel, setNewTopicLabel] = useState('');
  const [newTopicSlug, setNewTopicSlug] = useState('');
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatValue, setNewStatValue] = useState('');

  // Quick Section Item Builders
  const [newsItemForm, setNewsItemForm] = useState({
    section_type: 'related_news',
    news_id: '',
    title: '',
    summary: '',
    topic_slug: '',
    badge: ''
  });
  const [timelineForm, setTimelineForm] = useState({
    event_time_label: '',
    title: '',
    summary: '',
    badge: '',
    topic_slug: '',
    sort_order: 1
  });
  const [mediaItemForm, setMediaItemForm] = useState({
    section_type: 'gallery',
    title: '',
    media_id: '',
    media_url: '',
    video_url: '',
    caption: '',
    credit: '',
    summary: '',
    topic_slug: ''
  });
  const [infographicForm, setInfographicForm] = useState({
    title: '',
    summary: '',
    badge: 'ডেটা বিশ্লেষণ',
    topic_slug: '',
    highlight_value: '',
    highlight_label: '',
    source: 'দৈনিক বার্তা প্রবাহ গবেষণা সেল',
    bars: [{ label: '', value: 50, max: 100, unit: '%', color: '#be123c' }]
  });

  useEffect(() => {
    if (!coverage) return;
    setMetaForm({
      title: coverage.title || '',
      subtitle: coverage.subtitle || '',
      description: coverage.description || '',
      coverage_type: coverage.coverage_type || 'election',
      badge_text: coverage.badge_text || '',
      hero_image: coverage.hero_image || '',
      theme_color: coverage.theme_color || '#be123c',
      is_featured: Boolean(coverage.is_featured),
      show_in_navbar: Boolean(coverage.show_in_navbar),
      topics: Array.isArray(coverage.topics) ? coverage.topics : [],
      infographic_summary: Array.isArray(coverage.infographic_summary) ? coverage.infographic_summary : []
    });
  }, [coverage]);

  const items = useMemo(() => (Array.isArray(coverage?.items) ? coverage.items : []), [coverage]);
  const publishedNewsList = newsData?.items || [];
  const mediaList = mediaData?.items || [];

  const handleSaveMeta = async (e) => {
    e.preventDefault();
    try {
      await updateCoverage({ id: coverage.id, ...metaForm }).unwrap();
      sweetAlert.success('সংরক্ষিত হয়েছে', 'বিশেষ আয়োজনের সাধারণ তথ্য ও টপিক নেভিগেশন হালনাগাদ হয়েছে।');
    } catch (err) {
      sweetAlert.error('সংরক্ষণ ব্যর্থ', err?.data?.message || 'তথ্য যাচাই করুন।');
    }
  };

  const handleTransition = async (action, label) => {
    try {
      await transitionCoverage({ id: coverage.id, action }).unwrap();
      sweetAlert.success('সফল হয়েছে', `"${label}" সম্পন্ন হয়েছে।`);
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message || 'অনুমতি নেই।');
    }
  };

  const handleAddItem = async (payload, resetFn) => {
    try {
      await createItem({ coverageId: coverage.id, ...payload }).unwrap();
      resetFn?.();
      sweetAlert.success('যুক্ত হয়েছে', 'নতুন উপাদান বিশেষ পাতায় যুক্ত হয়েছে।');
    } catch (err) {
      sweetAlert.error('যুক্ত করা যায়নি', err?.data?.message || 'তথ্য যাচাই করুন।');
    }
  };

  const handleRemoveItem = async (item) => {
    const res = await sweetAlert.confirmDelete(item.title || COVERAGE_SECTION_META[item.section_type]?.label || 'উপাদান');
    if (!res.isConfirmed) return;

    try {
      await deleteItem({ coverageId: coverage.id, itemId: item.id }).unwrap();
      sweetAlert.success('অপসারিত হয়েছে');
    } catch (err) {
      sweetAlert.error('ব্যর্থ হয়েছে', err?.data?.message);
    }
  };

  if (isLoading || !coverage) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
        <div className="h-80 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
      </div>
    );
  }

  const statusMeta = COVERAGE_STATUS_META[coverage.status] || COVERAGE_STATUS_META.draft;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link to="/admin/special-coverage" className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-rose-700">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সব বিশেষ আয়োজন</span>
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>
          </div>
          <h1 className="font-serif-bn text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {coverage.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPublish && ['draft', 'submitted'].includes(coverage.status) && (
            <button
              type="button"
              onClick={() => handleTransition('approve', 'অনুমোদন')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>অনুমোদন</span>
            </button>
          )}
          {canPublish && coverage.status !== 'published' && (
            <button
              type="button"
              onClick={() => handleTransition('publish', 'পাবলিক প্রকাশ')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>প্রকাশ করুন</span>
            </button>
          )}
          {coverage.status === 'published' && (
            <Link
              to={`/coverage/${coverage.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>পাবলিক মাইক্রোসাইট দেখুন</span>
            </Link>
          )}
        </div>
      </div>

      {/* Section Builder Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'settings', label: 'হিরো ও টপিক ট্যাগ', icon: Layers },
          { id: 'news', label: 'সংশ্লিষ্ট সংবাদ ও নোট', icon: FileText },
          { id: 'timeline', label: 'টাইমলাইন', icon: Clock },
          { id: 'media', label: 'ফটো গ্যালারি ও ভিডিও', icon: Camera },
          { id: 'infographics', label: 'ইনফোগ্রাফিক্স চার্ট', icon: BarChart3 }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SETTINGS, HERO, TOPICS, KPI */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveMeta} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">শিরোনাম *</label>
              <input
                type="text"
                required
                value={metaForm.title}
                onChange={(e) => setMetaForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ধরন (Archetype)</label>
              <select
                value={metaForm.coverage_type}
                onChange={(e) => setMetaForm((f) => ({ ...f, coverage_type: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              >
                {Object.values(SPECIAL_COVERAGE_TYPE_META).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">উপ-শিরোনাম</label>
              <input
                type="text"
                value={metaForm.subtitle}
                onChange={(e) => setMetaForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">হিরো ব্যানার ছবি URL</label>
              <input
                type="url"
                value={metaForm.hero_image}
                onChange={(e) => setMetaForm((f) => ({ ...f, hero_image: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">বিস্তারিত বিবরণ</label>
            <textarea
              rows={2}
              value={metaForm.description}
              onChange={(e) => setMetaForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
            />
          </div>

          {/* Topic Tags Manager */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
              টপিক নেভিগেশন ট্যাগসমূহ
            </h3>
            <div className="flex flex-wrap gap-2">
              {metaForm.topics.map((t, idx) => (
                <span key={`${t.slug}-${idx}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold">
                  <span>{t.label} ({t.slug})</span>
                  <button
                    type="button"
                    onClick={() => setMetaForm((f) => ({ ...f, topics: f.topics.filter((_, i) => i !== idx) }))}
                    className="text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newTopicLabel}
                onChange={(e) => setNewTopicLabel(e.target.value)}
                placeholder="টপিক নাম (যেমন: ইশতেহার)"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <input
                type="text"
                value={newTopicSlug}
                onChange={(e) => setNewTopicSlug(e.target.value)}
                placeholder="স্লাগ (যেমন: manifesto)"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTopicLabel.trim() || !newTopicSlug.trim()) return;
                  setMetaForm((f) => ({
                    ...f,
                    topics: [...f.topics, { label: newTopicLabel.trim(), slug: newTopicSlug.trim() }]
                  }));
                  setNewTopicLabel('');
                  setNewTopicSlug('');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold cursor-pointer"
              >
                + টপিক যোগ
              </button>
            </div>
          </div>

          {/* Hero Stat Cards Manager */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
              হিরো পরিসংখ্যান কার্ড (KPI Summary)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metaForm.infographic_summary.map((s, idx) => (
                <div key={`${s.label}-${idx}`} className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-stone-500">{s.label}</div>
                    <div className="font-extrabold">{s.value}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMetaForm((f) => ({ ...f, infographic_summary: f.infographic_summary.filter((_, i) => i !== idx) }))}
                    className="text-rose-600 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newStatLabel}
                onChange={(e) => setNewStatLabel(e.target.value)}
                placeholder="লেবেল (যেমন: মোট আসন)"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <input
                type="text"
                value={newStatValue}
                onChange={(e) => setNewStatValue(e.target.value)}
                placeholder="মান (যেমন: ৩০০)"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newStatLabel.trim() || !newStatValue.trim()) return;
                  setMetaForm((f) => ({
                    ...f,
                    infographic_summary: [...f.infographic_summary, { label: newStatLabel.trim(), value: newStatValue.trim() }]
                  }));
                  setNewStatLabel('');
                  setNewStatValue('');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold cursor-pointer"
              >
                + কার্ড যোগ
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="submit"
              disabled={isSavingMeta}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingMeta ? 'সংরক্ষণ হচ্ছে...' : 'সাধারণ তথ্য সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RELATED NEWS & TOPIC NOTES */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h3 className="font-serif-bn font-extrabold text-base">সংশ্লিষ্ট সংবাদ / টপিক নোট যোগ করুন</h3>
            <select
              value={newsItemForm.section_type}
              onChange={(e) => setNewsItemForm((f) => ({ ...f, section_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            >
              <option value="related_news">সংশ্লিষ্ট সংবাদ (News Article)</option>
              <option value="topic_update">বিষয়ভিত্তিক নোট (Topic Highlight)</option>
            </select>

            {newsItemForm.section_type === 'related_news' && (
              <select
                value={newsItemForm.news_id}
                onChange={(e) => {
                  const chosen = publishedNewsList.find((a) => String(a.id) === e.target.value);
                  setNewsItemForm((f) => ({
                    ...f,
                    news_id: e.target.value,
                    title: chosen?.title || f.title
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
              >
                <option value="">প্রকাশিত প্রতিবেদন বেছে নিন</option>
                {publishedNewsList.map((article) => (
                  <option key={article.id} value={article.id}>{article.title}</option>
                ))}
              </select>
            )}

            <input
              type="text"
              value={newsItemForm.title}
              onChange={(e) => setNewsItemForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="শিরোনাম *"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <textarea
              rows={2}
              value={newsItemForm.summary}
              onChange={(e) => setNewsItemForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="সংক্ষিপ্ত নোট (ঐচ্ছিক)"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newsItemForm.topic_slug}
                onChange={(e) => setNewsItemForm((f) => ({ ...f, topic_slug: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              >
                <option value="">সব টপিক</option>
                {metaForm.topics.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newsItemForm.badge}
                onChange={(e) => setNewsItemForm((f) => ({ ...f, badge: e.target.value }))}
                placeholder="ব্যাজ (ঐচ্ছিক)"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
            </div>

            <button
              type="button"
              disabled={isAddingItem}
              onClick={() =>
                handleAddItem(
                  {
                    ...newsItemForm,
                    news_id: newsItemForm.news_id ? Number(newsItemForm.news_id) : null
                  },
                  () => setNewsItemForm({ section_type: 'related_news', news_id: '', title: '', summary: '', topic_slug: '', badge: '' })
                )
              }
              className="w-full py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              + যুক্ত করুন
            </button>
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            {items
              .filter((i) => ['related_news', 'topic_update'].includes(i.section_type))
              .map((item) => (
                <div key={item.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                      {COVERAGE_SECTION_META[item.section_type]?.label}
                    </span>
                    <h4 className="font-serif-bn font-bold text-sm mt-1">{item.news?.title || item.title}</h4>
                    {item.summary && <p className="text-xs text-stone-500 mt-0.5">{item.summary}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item)} className="text-rose-600 p-1.5 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h3 className="font-serif-bn font-extrabold text-base">টাইমলাইন মাইলফলক যুক্ত করুন</h3>
            <input
              type="text"
              value={timelineForm.event_time_label}
              onChange={(e) => setTimelineForm((f) => ({ ...f, event_time_label: e.target.value }))}
              placeholder="সময় লেবেল * (যেমন: দুপুর ২:৩০ বা ১১ জুন)"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <input
              type="text"
              value={timelineForm.title}
              onChange={(e) => setTimelineForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="মাইলফলক শিরোনাম *"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <textarea
              rows={2}
              value={timelineForm.summary}
              onChange={(e) => setTimelineForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="সংক্ষিপ্ত বিবরণ"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={timelineForm.badge}
                onChange={(e) => setTimelineForm((f) => ({ ...f, badge: e.target.value }))}
                placeholder="ব্যাজ (যেমন: মূল ঘোষণা)"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <input
                type="number"
                value={timelineForm.sort_order}
                onChange={(e) => setTimelineForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                placeholder="ক্রম"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
            </div>
            <button
              type="button"
              disabled={isAddingItem}
              onClick={() =>
                handleAddItem(
                  { section_type: 'timeline', ...timelineForm },
                  () => setTimelineForm({ event_time_label: '', title: '', summary: '', badge: '', topic_slug: '', sort_order: 1 })
                )
              }
              className="w-full py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              + টাইমলাইন যুক্ত করুন
            </button>
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            {items
              .filter((i) => i.section_type === 'timeline')
              .map((item) => (
                <div key={item.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-rose-700">{item.event_time_label}</span>
                    <h4 className="font-serif-bn font-bold text-sm">{item.title}</h4>
                    {item.summary && <p className="text-xs text-stone-500 mt-0.5">{item.summary}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item)} className="text-rose-600 p-1.5 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: PHOTO GALLERY & VIDEOS */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h3 className="font-serif-bn font-extrabold text-base">ফটো গ্যালারি / ভিডিও যুক্ত করুন</h3>
            <select
              value={mediaItemForm.section_type}
              onChange={(e) => setMediaItemForm((f) => ({ ...f, section_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            >
              <option value="gallery">ফটো গ্যালারি (Photo)</option>
              <option value="video">ভিডিও প্রতিবেদন (Video)</option>
            </select>

            <input
              type="text"
              value={mediaItemForm.title}
              onChange={(e) => setMediaItemForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="শিরোনাম *"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <input
              type="url"
              value={mediaItemForm.media_url}
              onChange={(e) => setMediaItemForm((f) => ({ ...f, media_url: e.target.value }))}
              placeholder={mediaItemForm.section_type === 'gallery' ? 'ছবির URL *' : 'থাম্বনেইল ছবির URL'}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            {mediaItemForm.section_type === 'video' && (
              <input
                type="url"
                value={mediaItemForm.video_url}
                onChange={(e) => setMediaItemForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="YouTube / Vimeo / MP4 ভিডিও URL *"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={mediaItemForm.caption}
                onChange={(e) => setMediaItemForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="ক্যাপশন"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <input
                type="text"
                value={mediaItemForm.credit}
                onChange={(e) => setMediaItemForm((f) => ({ ...f, credit: e.target.value }))}
                placeholder="চিত্রগ্রাহক / সূত্র"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
            </div>

            <div className="text-[11px] font-bold text-stone-500">দ্রুত মিডিয়া লাইব্রেরি থেকে নিন:</div>
            <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto">
              {mediaList.slice(0, 12).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setMediaItemForm((f) => ({
                      ...f,
                      media_id: m.id,
                      media_url: m.url,
                      title: f.title || m.title,
                      caption: m.caption || f.caption
                    }))
                  }
                  className="aspect-video rounded overflow-hidden border border-stone-200 hover:border-rose-600 cursor-pointer"
                >
                  <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isAddingItem}
              onClick={() =>
                handleAddItem(
                  {
                    ...mediaItemForm,
                    media_id: mediaItemForm.media_id ? Number(mediaItemForm.media_id) : null
                  },
                  () => setMediaItemForm({ section_type: 'gallery', title: '', media_id: '', media_url: '', video_url: '', caption: '', credit: '', summary: '', topic_slug: '' })
                )
              }
              className="w-full py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              + গ্যালারি / ভিডিও যুক্ত করুন
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items
              .filter((i) => ['gallery', 'video'].includes(i.section_type))
              .map((item) => (
                <div key={item.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        {item.section_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                        <span>{COVERAGE_SECTION_META[item.section_type]?.label}</span>
                      </span>
                      <button type="button" onClick={() => handleRemoveItem(item)} className="text-rose-600 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="font-serif-bn font-bold text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-stone-500 truncate">{item.video_url || item.media_url}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: INFOGRAPHICS BUILDER */}
      {activeTab === 'infographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h3 className="font-serif-bn font-extrabold text-base">নতুন ইনফোগ্রাফিক কার্ড তৈরি</h3>
            <input
              type="text"
              value={infographicForm.title}
              onChange={(e) => setInfographicForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="চার্ট শিরোনাম *"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <textarea
              rows={2}
              value={infographicForm.summary}
              onChange={(e) => setInfographicForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="ব্যাখ্যা"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-white dark:bg-stone-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={infographicForm.highlight_value}
                onChange={(e) => setInfographicForm((f) => ({ ...f, highlight_value: e.target.value }))}
                placeholder="হাইলাইট মান (যেমন: ৳৮.৫ লাখ কো.)"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
              <input
                type="text"
                value={infographicForm.highlight_label}
                onChange={(e) => setInfographicForm((f) => ({ ...f, highlight_label: e.target.value }))}
                placeholder="হাইলাইট লেবেল"
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-800"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>বার চার্ট ডেটা সারি</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfographicForm((f) => ({
                      ...f,
                      bars: [...f.bars, { label: '', value: 25, max: 100, unit: '%', color: '#0f766e' }]
                    }))
                  }
                  className="text-rose-700 cursor-pointer"
                >
                  + সারি যোগ
                </button>
              </div>
              {infographicForm.bars.map((bar, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                  <input
                    type="text"
                    value={bar.label}
                    onChange={(e) =>
                      setInfographicForm((f) => ({
                        ...f,
                        bars: f.bars.map((b, i) => (i === idx ? { ...b, label: e.target.value } : b))
                      }))
                    }
                    placeholder="লেবেল"
                    className="col-span-5 px-2 py-1.5 rounded border text-xs bg-white dark:bg-stone-800"
                  />
                  <input
                    type="number"
                    value={bar.value}
                    onChange={(e) =>
                      setInfographicForm((f) => ({
                        ...f,
                        bars: f.bars.map((b, i) => (i === idx ? { ...b, value: Number(e.target.value) } : b))
                      }))
                    }
                    placeholder="মান"
                    className="col-span-3 px-2 py-1.5 rounded border text-xs bg-white dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    value={bar.unit}
                    onChange={(e) =>
                      setInfographicForm((f) => ({
                        ...f,
                        bars: f.bars.map((b, i) => (i === idx ? { ...b, unit: e.target.value } : b))
                      }))
                    }
                    placeholder="একক"
                    className="col-span-2 px-2 py-1.5 rounded border text-xs bg-white dark:bg-stone-800"
                  />
                  <input
                    type="color"
                    value={bar.color}
                    onChange={(e) =>
                      setInfographicForm((f) => ({
                        ...f,
                        bars: f.bars.map((b, i) => (i === idx ? { ...b, color: e.target.value } : b))
                      }))
                    }
                    className="col-span-2 h-7 w-full rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isAddingItem}
              onClick={() =>
                handleAddItem(
                  {
                    section_type: 'infographic',
                    title: infographicForm.title,
                    summary: infographicForm.summary,
                    badge: infographicForm.badge,
                    topic_slug: infographicForm.topic_slug || null,
                    payload: {
                      highlight_value: infographicForm.highlight_value,
                      highlight_label: infographicForm.highlight_label,
                      source: infographicForm.source,
                      bars: infographicForm.bars.filter((b) => b.label.trim())
                    }
                  },
                  () =>
                    setInfographicForm({
                      title: '',
                      summary: '',
                      badge: 'ডেটা বিশ্লেষণ',
                      topic_slug: '',
                      highlight_value: '',
                      highlight_label: '',
                      source: 'দৈনিক বার্তা প্রবাহ গবেষণা সেল',
                      bars: [{ label: '', value: 50, max: 100, unit: '%', color: '#be123c' }]
                    })
                )
              }
              className="w-full py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              + ইনফোগ্রাফিক যুক্ত করুন
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 gap-4">
            {items
              .filter((i) => i.section_type === 'infographic')
              .map((item) => (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                    title="মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <DynamicInfographicCard item={item} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSpecialCoverageEditorPage;


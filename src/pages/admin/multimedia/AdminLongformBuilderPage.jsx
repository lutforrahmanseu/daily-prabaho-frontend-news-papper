import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Clock,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Mic,
  Plus,
  Quote,
  Save,
  Share2,
  Trash2,
  Type
} from 'lucide-react';
import {
  useGetAdminLongformStoryByIdQuery,
  useGetAdminTimelinesQuery,
  useTransitionLongformStoryMutation,
  useUpdateLongformStoryMutation
} from '../../../store/api/multimediaApi.js';
import { useGetCategoriesQuery } from '../../../store/api/categoryApi.js';
import { useGetReportersQuery } from '../../../store/api/reporterApi.js';
import { useGetMediaListQuery } from '../../../store/api/mediaApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import { STORY_BLOCK_TYPE_META, parseSafeSocialEmbedUrl } from '../../../utils/multimediaHelpers.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import sweetAlert from '../../../utils/sweetAlert.js';

const BLOCK_PALETTE = [
  { type: 'heading', label: 'শিরোনাম', icon: Type },
  { type: 'text', label: 'অনুচ্ছেদ', icon: BookOpen },
  { type: 'quote', label: 'উদ্ধৃতি', icon: Quote },
  { type: 'image', label: 'ছবি', icon: ImageIcon },
  { type: 'video', label: 'ভিডিও', icon: Film },
  { type: 'audio', label: 'অডিও', icon: Mic },
  { type: 'timeline', label: 'টাইমলাইন', icon: Clock },
  { type: 'embed', label: 'এমবেড', icon: Share2 }
];

export function AdminLongformBuilderPage() {
  const { id } = useParams();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');

  const { data: story, isLoading } = useGetAdminLongformStoryByIdQuery(id, { skip: !id });
  const { data: timelinesRes } = useGetAdminTimelinesQuery({ per_page: 40 });
  const { data: categoriesRes } = useGetCategoriesQuery();
  const { data: reportersRes } = useGetReportersQuery({ per_page: 60 });
  const { data: mediaRes } = useGetMediaListQuery({ per_page: 60 });

  const [updateStory, { isLoading: isSaving }] = useUpdateLongformStoryMutation();
  const [transitionStory] = useTransitionLongformStoryMutation();

  const timelines = timelinesRes?.items || [];
  const categories = categoriesRes?.items || categoriesRes?.data || (Array.isArray(categoriesRes) ? categoriesRes : []);
  const reporters = reportersRes?.items || [];
  const mediaAssets = mediaRes?.items || [];

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [themeStyle, setThemeStyle] = useState('editorial');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(5);
  const [categoryId, setCategoryId] = useState('');
  const [reporterId, setReporterId] = useState('');
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (!story) return;
    setTitle(story.title || '');
    setSubtitle(story.subtitle || '');
    setExcerpt(story.excerpt || '');
    setCoverImage(story.cover_image || '');
    setThemeStyle(story.theme_style || 'editorial');
    setReadingTimeMinutes(story.reading_time_minutes || 5);
    setCategoryId(story.category_id ? String(story.category_id) : '');
    setReporterId(story.reporter_id ? String(story.reporter_id) : '');
    setBlocks(
      Array.isArray(story.blocks)
        ? story.blocks.map((b) => ({
            block_type: b.block_type,
            title: b.title || '',
            content: b.content || '',
            media_id: b.media_id ? String(b.media_id) : '',
            media_url: b.media_url || '',
            caption: b.caption || '',
            credit: b.credit || '',
            timeline_id: b.timeline_id ? String(b.timeline_id) : ''
          }))
        : []
    );
  }, [story]);

  const addBlock = (blockType) => {
    setBlocks((prev) => [
      ...prev,
      {
        block_type: blockType,
        title: '',
        content: '',
        media_id: '',
        media_url: '',
        caption: '',
        credit: '',
        timeline_id: blockType === 'timeline' && timelines[0]?.id ? String(timelines[0].id) : ''
      }
    ]);
  };

  const moveBlock = (idx, dir) => {
    setBlocks((prev) => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  const updateBlockField = (idx, key, val) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    for (const blk of blocks) {
      if (blk.media_url.trim()) {
        const chk = parseSafeSocialEmbedUrl(blk.media_url);
        if (!chk.safe) {
          await sweetAlert.error('অনিরাপদ ইউআরএল', 'ব্লকে শুধুমাত্র বৈধ HTTP/HTTPS অথবা সিস্টেম স্টোরেজ URL ব্যবহার করুন।');
          return;
        }
      }
    }

    try {
      await updateStory({
        id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        excerpt: excerpt.trim() || null,
        cover_image: coverImage.trim() || null,
        theme_style: themeStyle,
        reading_time_minutes: Number(readingTimeMinutes || 5),
        category_id: categoryId ? Number(categoryId) : null,
        reporter_id: reporterId ? Number(reporterId) : null,
        blocks: blocks.map((b, i) => ({
          block_type: b.block_type,
          title: b.title.trim() || null,
          content: b.content.trim() || null,
          media_id: b.media_id ? Number(b.media_id) : null,
          media_url: b.media_url.trim() || null,
          caption: b.caption.trim() || null,
          credit: b.credit.trim() || null,
          timeline_id: b.timeline_id ? Number(b.timeline_id) : null,
          sort_order: i + 1
        }))
      }).unwrap();
      await sweetAlert.success('সংরক্ষিত!', 'স্টোরিটেলিং ব্লক এবং মেটাডাটা সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'সংরক্ষণ করা যায়নি।'));
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-xs text-stone-500">স্টোরি বিল্ডার লোড হচ্ছে...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <Link
            to="/admin/multimedia/stories"
            className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-rose-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>সব দীর্ঘ প্রতিবেদন</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black font-serif-bn text-stone-900">ভিজ্যুয়াল স্টোরিটেলিং ব্লক বিল্ডার</h1>
            {story && <MultimediaStatusBadge status={story.status} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {story?.status === 'published' && (
            <a
              href={`/stories/${story.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>পাবলিক পেজ</span>
            </a>
          )}
          {story && (
            <WorkflowActionButtons
              status={story.status}
              canCreate={canCreate}
              canPublish={canPublish}
              canDelete={false}
              onTransition={(act) => transitionStory({ id: story.id, action: act })}
            />
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সমস্ত ব্লক সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Story Metadata Panel */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 text-xs shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">মূল শিরোনাম *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">উপশিরোনাম</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="কভার ছবি URL"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="sm:col-span-2 px-3 py-2 border border-stone-300 rounded-xl font-mono"
          />
          <select
            value={themeStyle}
            onChange={(e) => setThemeStyle(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
          >
            <option value="editorial">Editorial ক্লাসিক</option>
            <option value="magazine">Magazine ওয়ার্ম</option>
            <option value="dark">Dark সিনেমাটিক</option>
          </select>
          <input
            type="number"
            min={1}
            value={readingTimeMinutes}
            onChange={(e) => setReadingTimeMinutes(e.target.value)}
            placeholder="পাঠের সময় (মিনিট)"
            className="px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
          >
            <option value="">বিভাগ বাছাই করুন</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={reporterId}
            onChange={(e) => setReporterId(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
          >
            <option value="">প্রতিবেদক বাছাই করুন</option>
            {reporters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Block Palette */}
      <div className="bg-stone-900 text-white p-4 rounded-2xl flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-rose-400 mr-2 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          <span>ব্লক যোগ করুন:</span>
        </span>
        {BLOCK_PALETTE.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => addBlock(item.type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Block Editor Stack */}
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          const meta = STORY_BLOCK_TYPE_META[block.block_type] || { label: block.block_type };
          return (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-rose-700">
                  #{idx + 1} • {meta.label}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, -1)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, 1)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(block.block_type === 'heading' ||
                block.block_type === 'timeline' ||
                block.block_type === 'embed' ||
                block.block_type === 'audio' ||
                block.block_type === 'video') && (
                <input
                  type="text"
                  placeholder="ব্লক শিরোনাম"
                  value={block.title}
                  onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
                />
              )}

              {(block.block_type === 'text' || block.block_type === 'quote' || block.block_type === 'audio') && (
                <textarea
                  rows={block.block_type === 'text' ? 4 : 2}
                  placeholder={block.block_type === 'audio' ? 'অডিও ট্রান্সক্রিপ্ট (ঐচ্ছিক)' : 'মূল লেখা বা উদ্ধৃতি লিখুন...'}
                  value={block.content}
                  onChange={(e) => updateBlockField(idx, 'content', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              )}

              {(block.block_type === 'image' ||
                block.block_type === 'video' ||
                block.block_type === 'audio' ||
                block.block_type === 'embed') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="মিডিয়া / এমবেড URL (HTTPS)"
                    value={block.media_url}
                    onChange={(e) => updateBlockField(idx, 'media_url', e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                  {block.block_type !== 'embed' && (
                    <select
                      value={block.media_id}
                      onChange={(e) => {
                        const chosen = mediaAssets.find((m) => String(m.id) === e.target.value);
                        updateBlockField(idx, 'media_id', e.target.value);
                        if (chosen) {
                          updateBlockField(idx, 'media_url', chosen.url);
                          if (!block.credit && chosen.credit) updateBlockField(idx, 'credit', chosen.credit);
                        }
                      }}
                      className="px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="">মিডিয়া লাইব্রেরি থেকে বাছাই</option>
                      {mediaAssets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {block.block_type === 'timeline' && (
                <select
                  value={block.timeline_id}
                  onChange={(e) => updateBlockField(idx, 'timeline_id', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="">সংযুক্ত ইন্টারঅ্যাক্টিভ টাইমলাইন বাছাই করুন</option>
                  {timelines.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.title} ({tl.status})
                    </option>
                  ))}
                </select>
              )}

              {block.block_type !== 'heading' && block.block_type !== 'text' && block.block_type !== 'timeline' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="ক্যাপশন"
                    value={block.caption}
                    onChange={(e) => updateBlockField(idx, 'caption', e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="ক্রেডিট / বক্তা"
                    value={block.credit}
                    onChange={(e) => updateBlockField(idx, 'credit', e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
}

export default AdminLongformBuilderPage;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BookOpen, Edit3, Plus } from 'lucide-react';
import {
  useCreateLongformStoryMutation,
  useDeleteLongformStoryMutation,
  useGetAdminLongformStoriesQuery,
  useTransitionLongformStoryMutation
} from '../../../store/api/multimediaApi.js';
import { hasEffectivePermission } from '../../../utils/permissions.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import { MultimediaStatusBadge, WorkflowActionButtons } from '../../../components/multimedia/AdminMultimediaShared.jsx';
import { toBengaliNumber } from '../../../utils/bengaliFormatter.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export function AdminLongformStoriesPage() {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canCreate = hasEffectivePermission(authState, adminState, 'multimedia.create');
  const canPublish = hasEffectivePermission(authState, adminState, 'multimedia.publish');
  const canDelete = hasEffectivePermission(authState, adminState, 'multimedia.delete');

  const { data: res, isLoading } = useGetAdminLongformStoriesQuery({ per_page: 30 });
  const [createStory, { isLoading: isCreating }] = useCreateLongformStoryMutation();
  const [deleteStory] = useDeleteLongformStoryMutation();
  const [transitionStory] = useTransitionLongformStoryMutation();

  const stories = res?.items || [];
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      const created = await createStory({
        title: quickTitle.trim(),
        theme_style: 'editorial',
        reading_time_minutes: 6,
        blocks: [{ block_type: 'heading', title: 'সূচনা অধ্যায়', sort_order: 1 }]
      }).unwrap();
      setQuickTitle('');
      navigate(`/admin/multimedia/stories/${created.id}`);
    } catch (err) {
      await sweetAlert.error('ত্রুটি', extractApiError(err, 'স্টোরি তৈরি করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            দীর্ঘ প্রতিবেদন ও স্টোরিটেলিং বিল্ডার (Long-form Storytelling CMS)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            লেখা, ছবি, ভিডিও, অডিও, টাইমলাইন ও এমবেড ব্লক সমৃদ্ধ বিশেষ ফিচার স্টোরি
          </p>
        </div>

        {canCreate && (
          <form onSubmit={handleQuickCreate} className="flex items-center gap-2">
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="নতুন দীর্ঘ প্রতিবেদনের শিরোনাম..."
              className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs w-64"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্টোরি খুলুন</span>
            </button>
          </form>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-rose-700 font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{toBengaliNumber(story.blocks_count ?? story.blocks?.length ?? 0)}টি ব্লক</span>
                    <span>•</span>
                    <span>{toBengaliNumber(story.reading_time_minutes || 5)} মিনিট</span>
                  </div>
                  <h2 className="text-base font-black font-serif-bn text-stone-900">{story.title}</h2>
                  {story.subtitle && <p className="text-xs text-stone-500 line-clamp-2">{story.subtitle}</p>}
                </div>
                <MultimediaStatusBadge status={story.status} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <Link
                  to={`/admin/multimedia/stories/${story.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>কনটেন্ট বিল্ডার খুলুন</span>
                </Link>

                <WorkflowActionButtons
                  status={story.status}
                  canCreate={canCreate}
                  canPublish={canPublish}
                  canDelete={canDelete}
                  publicUrl={`/stories/${story.slug}`}
                  onTransition={(act) => transitionStory({ id: story.id, action: act })}
                  onDelete={async () => {
                    const { isConfirmed } = await sweetAlert.confirmDelete(story.title);
                    if (isConfirmed) await deleteStory(story.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminLongformStoriesPage;


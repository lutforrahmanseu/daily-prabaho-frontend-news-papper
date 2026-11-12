import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMediaListQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation
} from '../../store/api/mediaApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import {
  Image as ImageIcon,
  Trash2,
  Search,
  Copy,
  Check,
  X,
  Film,
  Camera,
  UploadCloud,
  ShieldAlert,
  Edit3,
  Play,
  Loader2,
  Mic,
  Lock,
  Sparkles
} from 'lucide-react';
import { useRunAiAssistMutation, useApplyAiGenerationMutation } from '../../store/api/aiApi.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { getVisibilityMeta } from '../../utils/multimediaHelpers.js';

export function AdminMediaPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canUploadMedia = hasEffectivePermission(authState, adminState, 'media.upload');
  const canManagePrivate = hasEffectivePermission(authState, adminState, 'media.manage_private');
  const canUseAi = hasEffectivePermission(authState, adminState, 'ai.use');
  const canApplyAi = hasEffectivePermission(authState, adminState, 'ai.apply');

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'image' | 'video'

  const { data: mediaResponse, isLoading: isMediaLoading, isFetching, isError, error } = useGetMediaListQuery({
    per_page: 60,
    media_type: typeFilter !== 'all' ? typeFilter : undefined
  });
  const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();
  const [updateMedia, { isLoading: isUpdating }] = useUpdateMediaMutation();
  const [runAiAssist, { isLoading: isGeneratingAlt }] = useRunAiAssistMutation();
  const [applyAiGeneration] = useApplyAiGenerationMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  const media = useMemo(
    () => mediaResponse?.items || mediaResponse?.data || (Array.isArray(mediaResponse) ? mediaResponse : []),
    [mediaResponse]
  );

  // Modals & UI feedback
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [authError, setAuthError] = useState('');

  // Upload/Create Form State
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video' | 'audio'
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private' | 'restricted'
  const [folder, setFolder] = useState('general');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [credit, setCredit] = useState('দৈনিক বার্তা প্রবাহ');

  // Filtered media items
  const filteredMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return media.filter((item) => {
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.caption || '').toLowerCase().includes(q) ||
        (item.altText || '').toLowerCase().includes(q) ||
        (item.credit || '').toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [media, searchQuery, typeFilter]);

  const handleCopyLink = (item) => {
    navigator.clipboard?.writeText(item.url);
    setCopiedId(item.id);
    sweetAlert.success('কপি হয়েছে!', 'মিডিয়া ফাইলের ইউআরএল ক্লিপবোর্ডে কপি হয়েছে।');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetUploadForm = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setSelectedFile(null);
    setPreviewObjectUrl('');
    setVisibility('public');
    setFolder('general');
    setTitle('');
    setUrl('');
    setAltText('');
    setCaption('');
    setCredit('দৈনিক বার্তা প্রবাহ');
  };

  // Upload File (FormData) or External URL (JSON) via Laravel API
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!canUploadMedia) {
      const msg = 'মিডিয়া আপলোড করার অনুমতি আপনার নেই।';
      setAuthError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    if (!selectedFile && !url.trim()) {
      await sweetAlert.warning('তথ্য প্রয়োজন', 'একটি ফাইল নির্বাচন করুন অথবা সরাসরি ছবির ইউআরএল দিন।');
      return;
    }

    try {
      let payload;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('media_type', mediaType);
        formData.append('visibility', canManagePrivate ? visibility : 'public');
        if (folder.trim()) formData.append('folder', folder.trim());
        if (title.trim()) formData.append('name', title.trim());
        if (altText.trim()) formData.append('alt_text', altText.trim());
        if (caption.trim()) formData.append('caption', caption.trim());
        if (credit.trim()) formData.append('credit', credit.trim());
        payload = formData;
      } else {
        payload = {
          url: url.trim(),
          media_type: mediaType,
          visibility: canManagePrivate ? visibility : 'public',
          folder: folder.trim() || undefined,
          name: title.trim() || undefined,
          alt_text: altText.trim() || undefined,
          caption: caption.trim() || undefined,
          credit: credit.trim() || undefined
        };
      }

      await uploadMedia(payload).unwrap();
      setShowUploadModal(false);
      resetUploadForm();
      await sweetAlert.success(
        'আপলোড সফল!',
        `${mediaType === 'video' ? 'ভিডিও' : mediaType === 'audio' ? 'অডিও' : 'ছবি'} সফলভাবে মিডিয়া লাইব্রেরিতে যুক্ত হয়েছে।`
      );
    } catch (err) {
      const msg = extractApiError(err, 'মিডিয়া আপলোড ব্যর্থ হয়েছে।');
      setAuthError(msg);
      await sweetAlert.error('আপলোড ব্যর্থ হয়েছে', msg);
    }
  };

  // Update Metadata via Laravel API
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!canUploadMedia) {
      const msg = 'মেটাডাটা সম্পাদনার অনুমতি আপনার নেই।';
      setAuthError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    try {
      const updated = await updateMedia({
        id: editingItem.id,
        name: editingItem.title.trim(),
        alt_text: editingItem.altText || null,
        caption: editingItem.caption || null,
        credit: editingItem.credit || null
      }).unwrap();

      if (editingItem.aiAltGenerationId && canApplyAi && editingItem.altText?.trim()) {
        await applyAiGeneration({
          id: editingItem.aiAltGenerationId,
          target_type: 'media',
          target_id: editingItem.id,
          fields: { alt_text: editingItem.altText.trim() },
          human_edited: editingItem.altText.trim() !== (editingItem.aiAltSuggestedText || '').trim(),
          review_notes: 'Reviewed inside Media Library metadata modal'
        }).unwrap();
      }

      if (selectedPreview?.id === updated.id) {
        setSelectedPreview(updated);
      }
      setEditingItem(null);
      await sweetAlert.success('মেটাডাটা হালনাগাদ হয়েছে!', `"${updated.title}" এর মেটাডাটা সংরক্ষিত হয়েছে।`);
    } catch (err) {
      const msg = extractApiError(err, 'মেটাডাটা হালনাগাদ করা যায়নি।');
      setAuthError(msg);
      await sweetAlert.error('হালনাগাদ ব্যর্থ হয়েছে', msg);
    }
  };

  // Delete media via Laravel API
  const handleDelete = async (item) => {
    setAuthError('');
    if (!canUploadMedia) {
      const msg = 'মিডিয়া অপসারণের অনুমতি আপনার নেই।';
      setAuthError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    const { isConfirmed } = await sweetAlert.confirmDelete(
      item.title,
      `আপনি কি "${item.title}" মিডিয়া ফাইলটি সম্পূর্ণ মুছে ফেলতে চান?`
    );
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteMedia(item.id).unwrap();
      if (selectedPreview?.id === item.id) {
        setSelectedPreview(null);
      }
      await sweetAlert.success('অপসারিত হয়েছে!', 'মিডিয়া ফাইলটি স্থায়ীভাবে অপসারণ করা হয়েছে।');
    } catch (err) {
      const msg = extractApiError(err, 'মিডিয়া ফাইল মুছে ফেলা যায়নি।');
      setAuthError(msg);
      await sweetAlert.error('মুছে ফেলা যায়নি', msg);
    }
  };

  // Real File input selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    const isVideo = file.type.startsWith('video');
    const isAudio = file.type.startsWith('audio');
    setMediaType(isAudio ? 'audio' : isVideo ? 'video' : 'image');
    setSelectedFile(file);
    setPreviewObjectUrl(URL.createObjectURL(file));
    setUrl('');

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!title.trim()) setTitle(cleanName);
    if (!altText.trim()) setAltText(cleanName);
  };

  return (
    <div className="space-y-6">
      {(authError || isError) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">
              {authError || extractApiError(error, 'মিডিয়া লাইব্রেরি লোড করা যায়নি।')}
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
            ডিজিটাল মিডিয়া লাইব্রেরি (Media Assets & Archive)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            ছবি ও ভিডিও কন্টেন্ট সংগ্রহশালা, অল্ট টেক্সট, কপিরাইট ক্রেডিট ও ফাইল মেটাডাটা
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!canUploadMedia) {
              setAuthError('আপনার মিডিয়া আপলোড করার অনুমতি নেই।');
              return;
            }
            setShowUploadModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>নতুন মিডিয়া আপলোড</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ছবির নাম, ক্যাপশন, অল্ট টেক্সট বা ক্রেডিট দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            সকল মিডিয়া ({media.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('image')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              typeFilter === 'image' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-rose-600" />
            <span>ছবি ({media.filter((m) => m.type === 'image').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('video')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              typeFilter === 'video' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-600" />
            <span>ভিডিও ({media.filter((m) => m.type === 'video').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('audio')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              typeFilter === 'audio' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-violet-600" />
            <span>অডিও ({media.filter((m) => m.type === 'audio').length})</span>
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {isMediaLoading || isFetching ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700 mx-auto mb-2" />
          <p className="text-xs font-semibold">মিডিয়া লাইব্রেরি লোড হচ্ছে...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">কোনো মিডিয়া ফাইল পাওয়া যায়নি</h3>
          <p className="text-xs text-stone-500">আপনার সার্চ বা ফিল্টারের সাথে মানানসই কোনো ফাইল নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredMedia.map((item) => {
            const isVideo = item.type === 'video';
            const isAudio = item.type === 'audio';
            const visMeta = getVisibilityMeta(item.visibility);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-video bg-stone-900 overflow-hidden cursor-pointer flex items-center justify-center">
                    {isVideo ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : isAudio ? (
                      <div className="w-full h-full bg-linear-to-br from-violet-950 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-4 gap-2">
                        <Mic className="w-8 h-8 text-violet-300" />
                        <audio src={item.url} controls className="w-full max-w-[230px] h-8" />
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.altText || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      {isVideo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/85 text-indigo-300 text-[10px] font-mono font-bold backdrop-blur-xs border border-indigo-700/50">
                          <Play className="w-2.5 h-2.5 fill-indigo-300" />
                          <span>ভিডিও</span>
                        </span>
                      ) : isAudio ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-950/85 text-violet-200 text-[10px] font-mono font-bold backdrop-blur-xs border border-violet-700/50">
                          <Mic className="w-2.5 h-2.5" />
                          <span>অডিও</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-950/80 text-stone-300 text-[10px] font-mono font-bold backdrop-blur-xs border border-stone-700/50">
                          <Camera className="w-2.5 h-2.5" />
                          <span>{item.format}</span>
                        </span>
                      )}
                      {item.visibility && item.visibility !== 'public' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${visMeta.badgeClass}`}>
                          <Lock className="w-2.5 h-2.5" />
                          <span>{visMeta.label}</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreview(item)}
                        className="p-2 rounded-xl bg-white text-stone-900 shadow hover:bg-stone-100 transition-transform hover:scale-110 cursor-pointer"
                        title="পূর্ণাঙ্গ প্রিভিউ ও বিস্তারিত"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...item })}
                        className="p-2 rounded-xl bg-white text-stone-900 shadow hover:bg-stone-100 transition-transform hover:scale-110 cursor-pointer"
                        title="মেটাডাটা সম্পাদনা"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        className="p-2 rounded-xl bg-white text-stone-900 shadow hover:bg-stone-100 transition-transform hover:scale-110 cursor-pointer"
                        title="লিংক কপি করুন"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-stone-900 text-xs font-serif-bn line-clamp-1" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-2" title={item.caption}>
                      {item.caption || 'ক্যাপশন নেই'}
                    </p>

                    <div className="space-y-1 pt-1.5 border-t border-stone-100 text-[10px]">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="font-medium text-stone-400">ক্রেডিট:</span>
                        <span className="truncate max-w-[170px] font-semibold text-stone-700">{item.credit || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="font-medium text-stone-400">অল্ট টেক্সট:</span>
                        <span className="truncate max-w-[170px] italic">{item.altText || item.title}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400">
                    <span>{item.dimensions}</span>
                    <span>•</span>
                    <span>{item.sizeFormatted || 'External'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL INSPECTION / PREVIEW MODAL */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row">
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4 relative">
              {selectedPreview.type === 'video' ? (
                <video
                  src={selectedPreview.url}
                  controls
                  poster={selectedPreview.thumbnailUrl}
                  className="max-h-[70vh] w-full rounded-xl object-contain shadow-lg"
                />
              ) : (
                <img
                  src={selectedPreview.url}
                  alt={selectedPreview.altText || selectedPreview.title}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              )}
            </div>

            <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto max-h-[70vh] md:max-h-none space-y-4 bg-white">
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-bold">
                      {selectedPreview.type === 'video' ? 'ভিডিও মেটাডাটা' : 'ইমেজ মেটাডাটা'}
                    </span>
                    <h3 className="text-base font-bold font-serif-bn text-stone-900 mt-1">
                      {selectedPreview.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPreview(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block uppercase">ক্যাপশন (Caption)</label>
                    <p className="text-stone-800 font-serif-bn leading-relaxed mt-0.5">
                      {selectedPreview.caption || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block uppercase">অল্ট টেক্সট (Alt Text for SEO)</label>
                    <p className="text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100 font-sans mt-0.5">
                      {selectedPreview.altText || selectedPreview.title}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block uppercase">ছবির কৃতিত্ব ও কপিরাইট (Credit)</label>
                    <p className="font-semibold text-rose-700 mt-0.5">
                      {selectedPreview.credit || '—'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 font-mono text-[11px]">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <span className="text-stone-400 text-[10px] block">ফরম্যাট / টাইপ</span>
                      <strong className="text-stone-800">{selectedPreview.format}</strong>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <span className="text-stone-400 text-[10px] block">ফাইল সাইজ</span>
                      <strong className="text-stone-800">{selectedPreview.sizeFormatted || 'External'}</strong>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <span className="text-stone-400 text-[10px] block">রেজোলিউশন / ডাইমেনশন</span>
                      <strong className="text-stone-800">{selectedPreview.dimensions}</strong>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <span className="text-stone-400 text-[10px] block">আপলোডকারী</span>
                      <strong className="text-stone-800">{selectedPreview.uploadedBy}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedPreview)}
                  className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>লিংক কপি</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedPreview;
                    setSelectedPreview(null);
                    setEditingItem({ ...target });
                  }}
                  className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>সম্পাদনা</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPreview)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  মিডিয়া মেটাডাটা সম্পাদনা
                </h3>
                <p className="text-[11px] text-stone-500">অল্ট টেক্সট, ক্যাপশন ও ক্রেডিট তথ্য পরিবর্তন করুন</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    অল্ট টেক্সট (Alt Text for Screen Readers & SEO)
                  </label>
                  {canUseAi && (
                    <button
                      type="button"
                      disabled={isGeneratingAlt}
                      onClick={async () => {
                        try {
                          const res = await runAiAssist({
                            feature: 'image_alt_text',
                            media_id: editingItem.id,
                            title: editingItem.title || '',
                            caption: editingItem.caption || '',
                            credit: editingItem.credit || ''
                          }).unwrap();
                          const generatedAlt = res?.output_payload?.alt_text || '';
                          setEditingItem((prev) => ({
                            ...prev,
                            altText: generatedAlt,
                            aiAltGenerationId: res?.id || null,
                            aiAltSuggestedText: generatedAlt
                          }));
                          await sweetAlert.warning(
                            'AI Alt Text প্রস্তুত — দৃশ্যমান যাচাই আবশ্যক',
                            'AI প্রদত্ত মেটাডাটার ভিত্তিতে খসড়া Alt Text তৈরি করেছে। সংরক্ষণের আগে ছবি দেখে বিষয়বস্তু যাচাই করে নিন।'
                          );
                        } catch (err) {
                          await sweetAlert.error('AI Alt Text ব্যর্থ', extractApiError(err, 'Alt Text তৈরি করা যায়নি।'));
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAlt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>AI Alt Text</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingItem.altText || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, altText: e.target.value })}
                  placeholder="দৃষ্টিপ্রতিবন্ধী পাঠক ও গুগল এসইও এর জন্য বর্ণনামূলক টেক্সট"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                {(editingItem.altTextIsAiGenerated || editingItem.aiAltGenerationId) && (
                  <p className="mt-1 text-[10px] font-semibold text-amber-700">
                    ✦ AI-সহায়তাপ্রাপ্ত Alt Text — প্রকাশের আগে ছবি দেখে মানব সম্পাদকীয় যাচাই নিশ্চিত করুন।
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্যাপশন (Editorial Caption)
                </label>
                <textarea
                  rows={2}
                  value={editingItem.caption || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  আলোকচিত্রী / ভিডিও ক্রেডিট (Credit)
                </label>
                <input
                  type="text"
                  value={editingItem.credit || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, credit: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'সংরক্ষণ হচ্ছে...' : 'মেটাডাটা সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD NEW MEDIA MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  নতুন মিডিয়া আপলোড ও আর্কাইভ
                </h3>
                <p className="text-[11px] text-stone-500">ফাইল আপলোড করুন অথবা বহিঃস্থ ইউআরএল যুক্ত করুন</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mediaType === 'image' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Camera className="w-4 h-4 text-rose-600" />
                <span>আলোকচিত্র</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mediaType === 'video' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Film className="w-4 h-4 text-indigo-600" />
                <span>ভিডিও</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('audio')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mediaType === 'audio' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Mic className="w-4 h-4 text-violet-600" />
                <span>অডিও</span>
              </button>
            </div>

            {canManagePrivate && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    স্টোরেজ ও গোপনীয়তা (Access Control)
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="public">Public (সর্বজনীন CDN/Public Disk)</option>
                    <option value="private">Private (অনুমতি-ভিত্তিক স্ট্রিম)</option>
                    <option value="restricted">Restricted (এমবার্গোড প্রটেক্টেড)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    ফোল্ডার / সেকশন (Folder)
                  </label>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="general / investigations / podcasts"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div className="border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-2xl p-4 text-center bg-stone-50/50 hover:bg-rose-50/20 transition-all relative">
                <input
                  type="file"
                  accept={
                    mediaType === 'video'
                      ? 'video/mp4,video/quicktime,video/webm,video/x-msvideo'
                      : mediaType === 'audio'
                        ? 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm'
                        : 'image/jpeg,image/png,image/webp,image/gif'
                  }
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-stone-200 mx-auto flex items-center justify-center text-rose-600">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-stone-800">
                    {selectedFile ? `নির্বাচিত ফাইল: ${selectedFile.name}` : 'ফাইল নির্বাচন করতে ক্লিক করুন বা ড্র্যাগ করুন'}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    JPG, PNG, WEBP, MP4, MOV, MP3, WAV, OGG, M4A (সর্বোচ্চ ৫০ মেগাবাইট)
                  </p>
                </div>
              </div>

              {previewObjectUrl && mediaType === 'image' && (
                <div className="rounded-xl overflow-hidden border border-stone-200 max-h-40 flex items-center justify-center bg-stone-100">
                  <img src={previewObjectUrl} alt="Preview" className="max-h-40 object-contain" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অথবা সরাসরি মিডিয়া ইউআরএল (External URL)
                </label>
                <input
                  type="url"
                  required={!selectedFile}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (selectedFile) {
                      setSelectedFile(null);
                      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
                      setPreviewObjectUrl('');
                    }
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মিডিয়া ফাইলের শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: পদ্মা সেতুতে ট্রেনের পরীক্ষামূলক চলাচল"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিকল্প টেক্সট (Alt Text for SEO)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="দৃষ্টিপ্রতিবন্ধী ও এসইও এর জন্য দৃশ্যমান বিবরণ"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সম্পাদকীয় ক্যাপশন (Caption)
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="সংবাদের নিচে প্রদর্শনযোগ্য পূর্ণ বিবরণ..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্রেডিট / আলোকচিত্রী
                </label>
                <input
                  type="text"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="যেমন: রফিকুল ইসলাম / AFP"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploading ? 'আপলোড হচ্ছে...' : 'মিডিয়া সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMediaPage;

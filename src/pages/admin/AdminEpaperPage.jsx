import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useCreateAdminEpaperEditionMutation,
  useCreateAdminEpaperPageMutation,
  useDeleteAdminEpaperEditionMutation,
  useDeleteAdminEpaperPageMutation,
  useGetAdminEpaperEditionQuery,
  useGetAdminEpaperListQuery,
  useGetAdminEpaperSubscribersQuery,
  useReorderAdminEpaperPagesMutation,
  useTransitionAdminEpaperEditionMutation,
  useUpdateAdminEpaperEditionMutation,
  useUpdateAdminEpaperPageMutation,
  useUpdateAdminEpaperSubscriberTierMutation,
  useUploadAdminEpaperMasterPdfMutation
} from '../../store/api/epaperArchiveApi.js';
import { useProtectedBlobUrl } from '../../hooks/useProtectedBlobUrl.js';
import {
  EPAPER_ACCESS_LEVELS,
  EPAPER_DOWNLOAD_POLICIES,
  EPAPER_EDITION_CODES,
  EPAPER_STATUS_META,
  buildPdfFragmentUrl,
  formatPdfBytes,
  resolveEpaperApiUrl
} from '../../utils/epaperHelpers.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  FileText,
  FileUp,
  Layers,
  Lock,
  Newspaper,
  Plus,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';

const emptyEditionForm = () => ({
  title: 'দৈনিক বার্তা প্রবাহ — জাতীয় সংস্করণ',
  title_en: 'Daily Prabaho — National Edition',
  publication_date: new Date().toISOString().slice(0, 10),
  edition_code: 'national',
  edition_name_bn: 'জাতীয় সংস্করণ',
  edition_name_en: 'National Edition',
  volume_number: 'বর্ষ ০১',
  issue_number: '',
  price_label: '১০ টাকা',
  summary: '',
  access_level: 'public',
  download_policy: 'registered',
  is_featured: false,
  auto_generate_pages: true
});

const emptyPageForm = () => ({
  page_number: '',
  pdf_source_page: '',
  section_name_bn: 'প্রথম পাতা',
  section_name_en: 'Front Page',
  headline: '',
  summary: ''
});

export function AdminEpaperPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const token = authState?.token || null;

  const canManage = hasEffectivePermission(authState, adminState, 'epaper.manage');
  const canPublish = hasEffectivePermission(authState, adminState, 'epaper.publish');

  const [tab, setTab] = useState('editions'); // 'editions' | 'pages' | 'subscribers'
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEditionCode, setFilterEditionCode] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const [selectedEditionId, setSelectedEditionId] = useState(null);
  const [editingEditionId, setEditingEditionId] = useState(null);
  const [editionForm, setEditionForm] = useState(emptyEditionForm);
  const [masterPdfFile, setMasterPdfFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [showEditionForm, setShowEditionForm] = useState(false);

  const [editingPageId, setEditingPageId] = useState(null);
  const [pageForm, setPageForm] = useState(emptyPageForm);
  const [pagePdfFile, setPagePdfFile] = useState(null);
  const [pagePreviewFile, setPagePreviewFile] = useState(null);
  const [previewSourcePage, setPreviewSourcePage] = useState(1);

  const { data: listData, isLoading } = useGetAdminEpaperListQuery({
    search: filterSearch.trim() || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    edition_code: filterEditionCode !== 'all' ? filterEditionCode : undefined,
    date: filterDate || undefined,
    per_page: 20
  });

  const editions = listData?.items || [];
  const summary = listData?.summary || {};
  const activeEditionId = selectedEditionId || editions[0]?.id || null;

  const { data: activeEdition } = useGetAdminEpaperEditionQuery(activeEditionId, {
    skip: !activeEditionId
  });

  const { data: subscribers = [] } = useGetAdminEpaperSubscribersQuery(undefined, {
    skip: tab !== 'subscribers' || !canManage
  });

  const [createEdition, { isLoading: creating }] = useCreateAdminEpaperEditionMutation();
  const [updateEdition, { isLoading: updating }] = useUpdateAdminEpaperEditionMutation();
  const [uploadMasterPdf, { isLoading: uploadingPdf }] = useUploadAdminEpaperMasterPdfMutation();
  const [transitionEdition] = useTransitionAdminEpaperEditionMutation();
  const [deleteEdition] = useDeleteAdminEpaperEditionMutation();

  const [createPage, { isLoading: savingPage }] = useCreateAdminEpaperPageMutation();
  const [updatePage, { isLoading: updatingPage }] = useUpdateAdminEpaperPageMutation();
  const [reorderPages] = useReorderAdminEpaperPagesMutation();
  const [deletePage] = useDeleteAdminEpaperPageMutation();
  const [updateSubscriberTier] = useUpdateAdminEpaperSubscriberTierMutation();

  const { blobUrl: adminPdfBlobUrl, loading: loadingPreviewPdf } = useProtectedBlobUrl(
    activeEdition?.has_pdf
      ? resolveEpaperApiUrl(`/api/v1/epaper/editions/${activeEdition.id}/pdf?silent=1`)
      : null,
    token,
    tab !== 'pages' || !activeEdition?.has_pdf
  );

  const pages = useMemo(() => activeEdition?.pages || [], [activeEdition]);

  const handleOpenCreateForm = () => {
    setEditingEditionId(null);
    setEditionForm(emptyEditionForm());
    setMasterPdfFile(null);
    setCoverImageFile(null);
    setShowEditionForm(true);
  };

  const handleEditEdition = (ed) => {
    setEditingEditionId(ed.id);
    setEditionForm({
      title: ed.title,
      title_en: ed.title_en,
      publication_date: ed.publication_date,
      edition_code: ed.edition_code,
      edition_name_bn: ed.edition_name_bn,
      edition_name_en: ed.edition_name_en,
      volume_number: ed.volume_number || '',
      issue_number: ed.issue_number || '',
      price_label: ed.price_label || '',
      summary: ed.summary || '',
      access_level: ed.access_level || 'public',
      download_policy: ed.download_policy || 'registered',
      is_featured: Boolean(ed.is_featured),
      auto_generate_pages: true
    });
    setMasterPdfFile(null);
    setCoverImageFile(null);
    setShowEditionForm(true);
  };

  const handleSaveEdition = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(editionForm).forEach(([key, val]) => {
        if (typeof val === 'boolean') {
          formData.append(key, val ? '1' : '0');
        } else if (val !== null && val !== undefined && val !== '') {
          formData.append(key, String(val));
        }
      });
      if (coverImageFile) {
        formData.append('cover_image', coverImageFile);
      }

      if (editingEditionId) {
        const updated = await updateEdition({ id: editingEditionId, body: formData }).unwrap();
        if (masterPdfFile) {
          const pdfFd = new FormData();
          pdfFd.append('pdf_file', masterPdfFile);
          pdfFd.append('auto_generate_pages', editionForm.auto_generate_pages ? '1' : '0');
          await uploadMasterPdf({ editionId: editingEditionId, formData: pdfFd }).unwrap();
        }
        setSelectedEditionId(updated.id);
        sweetAlert.success('ই-পেপার সংস্করণ হালনাগাদ হয়েছে');
      } else {
        if (masterPdfFile) {
          formData.append('pdf_file', masterPdfFile);
        }
        const created = await createEdition(formData).unwrap();
        setSelectedEditionId(created.id);
        sweetAlert.success('নতুন ই-পেপার সংস্করণ সংরক্ষিত হয়েছে');
      }
      setShowEditionForm(false);
    } catch (err) {
      const msg = err?.data?.errors?.pdf_file?.[0] || err?.data?.message || 'সংস্করণ সংরক্ষণ করা যায়নি';
      sweetAlert.error(msg);
    }
  };

  const handleQuickPdfReplace = async (editionId, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('pdf_file', file);
    fd.append('auto_generate_pages', '1');
    try {
      await uploadMasterPdf({ editionId, formData: fd }).unwrap();
      setSelectedEditionId(editionId);
      sweetAlert.success('PDF যাচাই ও নিরাপদ প্রাইভেট স্টোরেজে সংরক্ষিত হয়েছে');
    } catch (err) {
      sweetAlert.error(err?.data?.errors?.pdf_file?.[0] || err?.data?.message || 'PDF আপলোড ব্যর্থ হয়েছে');
    }
  };

  const handleTransition = async (editionId, action) => {
    try {
      await transitionEdition({ id: editionId, action }).unwrap();
      sweetAlert.success('ই-পেপার স্ট্যাটাস আপডেট হয়েছে');
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'স্ট্যাটাস পরিবর্তন করা যায়নি');
    }
  };

  const handleDeleteEdition = async (editionId) => {
    const { isConfirmed } = await sweetAlert.confirmDelete({
      title: 'ই-পেপার সংস্করণ মুছে ফেলবেন?',
      text: 'সংস্করণ এবং সংশ্লিষ্ট পৃষ্ঠাসমূহ আর্কাইভ থেকে অপসারিত হবে।'
    });
    if (!isConfirmed) return;
    try {
      await deleteEdition(editionId).unwrap();
      if (selectedEditionId === editionId) setSelectedEditionId(null);
      sweetAlert.success('ই-পেপার সংস্করণ মুছে ফেলা হয়েছে');
    } catch {
      sweetAlert.error('সংস্করণ মুছে ফেলা যায়নি');
    }
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    if (!activeEditionId) return;
    const fd = new FormData();
    Object.entries(pageForm).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
    });
    if (pagePdfFile) fd.append('page_pdf', pagePdfFile);
    if (pagePreviewFile) fd.append('preview_image', pagePreviewFile);

    try {
      if (editingPageId) {
        await updatePage({ editionId: activeEditionId, pageId: editingPageId, body: fd }).unwrap();
        sweetAlert.success('পৃষ্ঠা হালনাগাদ হয়েছে');
      } else {
        await createPage({ editionId: activeEditionId, body: fd }).unwrap();
        sweetAlert.success('নতুন পৃষ্ঠা যুক্ত হয়েছে');
      }
      setEditingPageId(null);
      setPageForm(emptyPageForm());
      setPagePdfFile(null);
      setPagePreviewFile(null);
    } catch (err) {
      sweetAlert.error(err?.data?.message || 'পৃষ্ঠা সংরক্ষণ করা যায়নি');
    }
  };

  const handleMovePage = async (index, direction) => {
    const nextPages = [...pages];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= nextPages.length) return;
    const [moved] = nextPages.splice(index, 1);
    nextPages.splice(targetIdx, 0, moved);
    try {
      await reorderPages({
        editionId: activeEditionId,
        page_ids: nextPages.map((p) => p.id)
      }).unwrap();
      sweetAlert.success('পৃষ্ঠার ক্রম পরিবর্তন হয়েছে');
    } catch {
      sweetAlert.error('পৃষ্ঠার ক্রম পরিবর্তন করা যায়নি');
    }
  };

  const handleDeletePage = async (pageId) => {
    const { isConfirmed } = await sweetAlert.confirmDelete({
      title: 'পৃষ্ঠা মুছে ফেলবেন?',
      text: 'পৃষ্ঠার PDF ও প্রিভিউ ফাইল স্থায়ীভাবে মুছে যাবে।'
    });
    if (!isConfirmed) return;
    try {
      await deletePage({ editionId: activeEditionId, pageId }).unwrap();
      sweetAlert.success('পৃষ্ঠা মুছে ফেলা হয়েছে');
    } catch {
      sweetAlert.error('পৃষ্ঠা মুছে ফেলা যায়নি');
    }
  };

  const handleToggleSubscriber = async (reader) => {
    const nextTier = reader.subscription_tier === 'epaper_plus' ? 'free' : 'epaper_plus';
    try {
      await updateSubscriberTier({ userId: reader.id, subscription_tier: nextTier }).unwrap();
      sweetAlert.success(`সাবস্ক্রিপশন স্তর ${nextTier === 'epaper_plus' ? 'E-Paper Plus' : 'Free'} এ সেট করা হয়েছে`);
    } catch {
      sweetAlert.error('সাবস্ক্রিপশন পরিবর্তন করা যায়নি');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-bn flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-700" />
            <span>ডিজিটাল ই-পেপার ও প্রাইভেট PDF স্টুডিও</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            দৈনিক সংস্করণ, নিরাপদ PDF প্রক্রিয়াকরণ, পৃষ্ঠা বিন্যাস, এবং পাঠক এক্সেস ও ডাউনলোড নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTab('editions')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                tab === 'editions' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
              }`}
            >
              সংস্করণসমূহ
            </button>
            <button
              type="button"
              onClick={() => setTab('pages')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                tab === 'pages' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
              }`}
            >
              পৃষ্ঠা ও PDF প্রিভিউ
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setTab('subscribers')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                  tab === 'subscribers' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
                }`}
              >
                পাঠক এক্সেস কন্ট্রোল
              </button>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সংস্করণ</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500">মোট সংস্করণ</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">
            {toBengaliNumber(summary.total_editions || 0)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            প্রকাশিত: {toBengaliNumber(summary.published_editions || 0)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500">মোট ই-পেপার পৃষ্ঠা</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">
            {toBengaliNumber(summary.total_pages || 0)}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            সর্বশেষ সংখ্যা: {summary.latest_publication_date || '—'}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500">মোট পঠন / ভিউ</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">
            {toBengaliNumber(summary.total_views || 0)}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">নিরাপদ PDF স্ট্রিম</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <p className="text-xs text-stone-500">মোট PDF ডাউনলোড</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">
            {toBengaliNumber(summary.total_downloads || 0)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>প্রাইভেট ডিস্ক সুরক্ষিত</span>
          </p>
        </div>
      </div>

      {/* Create / Edit Edition Form */}
      {showEditionForm && canManage && (
        <form
          onSubmit={handleSaveEdition}
          className="rounded-2xl border border-rose-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-base font-extrabold text-stone-900 font-serif-bn">
              {editingEditionId ? 'ই-পেপার সংস্করণ সম্পাদনা' : 'নতুন দৈনিক ই-পেপার সংস্করণ তৈরি ও PDF আপলোড'}
            </h2>
            <button
              type="button"
              onClick={() => setShowEditionForm(false)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">শিরোনাম (বাংলা) *</label>
              <input
                required
                value={editionForm.title}
                onChange={(e) => setEditionForm({ ...editionForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">শিরোনাম (English)</label>
              <input
                value={editionForm.title_en}
                onChange={(e) => setEditionForm({ ...editionForm, title_en: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">প্রকাশের তারিখ *</label>
              <input
                type="date"
                required
                value={editionForm.publication_date}
                onChange={(e) => setEditionForm({ ...editionForm, publication_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">সংস্করণ কোড</label>
              <select
                value={editionForm.edition_code}
                onChange={(e) => {
                  const chosen = EPAPER_EDITION_CODES.find((ec) => ec.code === e.target.value);
                  setEditionForm({
                    ...editionForm,
                    edition_code: e.target.value,
                    edition_name_bn: chosen?.nameBn || editionForm.edition_name_bn,
                    edition_name_en: chosen?.nameEn || editionForm.edition_name_en
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                {EPAPER_EDITION_CODES.map((ec) => (
                  <option key={ec.code} value={ec.code}>
                    {ec.nameBn} ({ec.nameEn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">পাঠক প্রবেশাধিকার (Access Control)</label>
              <select
                value={editionForm.access_level}
                onChange={(e) => setEditionForm({ ...editionForm, access_level: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                {EPAPER_ACCESS_LEVELS.map((lv) => (
                  <option key={lv.id} value={lv.id}>
                    {lv.labelBn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">ডাউনলোড অনুমতি (Download Policy)</label>
              <select
                value={editionForm.download_policy}
                onChange={(e) => setEditionForm({ ...editionForm, download_policy: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                {EPAPER_DOWNLOAD_POLICIES.map((dp) => (
                  <option key={dp.id} value={dp.id}>
                    {dp.labelBn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">বর্ষ / সংখ্যা (Issue)</label>
              <input
                value={editionForm.issue_number}
                onChange={(e) => setEditionForm({ ...editionForm, issue_number: e.target.value })}
                placeholder="সংখ্যা ৩১২"
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">মূল দৈনিক PDF আপলোড (সর্বোচ্চ ৫০MB)</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setMasterPdfFile(e.target.files?.[0] || null)}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-700 file:font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">কভার প্রিভিউ ছবি (ঐচ্ছিক)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700 file:font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editionForm.auto_generate_pages}
                  onChange={(e) => setEditionForm({ ...editionForm, auto_generate_pages: e.target.checked })}
                />
                <span>PDF পৃষ্ঠা সংখ্যা থেকে স্বয়ংক্রিয় পাতা তৈরি করুন</span>
              </label>
              <label className="inline-flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editionForm.is_featured}
                  onChange={(e) => setEditionForm({ ...editionForm, is_featured: e.target.checked })}
                />
                <span>প্রধান সংস্করণ (Featured)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={creating || updating || uploadingPdf}
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {creating || updating || uploadingPdf ? 'প্রক্রিয়াকরণ চলছে...' : 'নিরাপদে সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: EDITIONS LIST */}
      {tab === 'editions' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="search"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="সংস্করণ বা পাতার শিরোনাম..."
              className="px-3 py-2 rounded-xl border border-stone-300"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300"
            />
            <select
              value={filterEditionCode}
              onChange={(e) => setFilterEditionCode(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">সব সংস্করণ</option>
              {EPAPER_EDITION_CODES.map((ec) => (
                <option key={ec.code} value={ec.code}>
                  {ec.nameBn}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="draft">খসড়া (Draft)</option>
              <option value="published">প্রকাশিত (Published)</option>
              <option value="archived">সংরক্ষিত (Archived)</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              লোড হচ্ছে...
            </div>
          ) : editions.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              কোনো ই-পেপার সংস্করণ পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {editions.map((ed) => {
                const statusMeta = EPAPER_STATUS_META[ed.status] || EPAPER_STATUS_META.draft;
                const accessMeta = EPAPER_ACCESS_LEVELS.find((a) => a.id === ed.access_level) || EPAPER_ACCESS_LEVELS[0];
                const downloadMeta = EPAPER_DOWNLOAD_POLICIES.find((d) => d.id === ed.download_policy) || EPAPER_DOWNLOAD_POLICIES[1];
                return (
                  <div
                    key={ed.id}
                    className={`rounded-2xl border p-4 sm:p-5 bg-white transition-colors ${
                      activeEditionId === ed.id ? 'border-rose-400 shadow-xs' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                            {ed.publication_date}
                          </span>
                          <span className={`px-2 py-0.5 rounded border font-bold ${statusMeta.badgeClass}`}>
                            {statusMeta.labelBn}
                          </span>
                          <span className={`px-2 py-0.5 rounded border font-semibold ${accessMeta.badgeClass}`}>
                            {accessMeta.labelBn}
                          </span>
                          <span className={`px-2 py-0.5 rounded border font-semibold ${downloadMeta.badgeClass}`}>
                            {downloadMeta.labelBn}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-stone-900 font-serif-bn">
                          {ed.title}
                        </h3>
                        <p className="text-xs text-stone-500 flex flex-wrap items-center gap-3">
                          <span>{ed.edition_name_bn}</span>
                          <span>· {toBengaliNumber(ed.pages_count)} পাতা</span>
                          {ed.has_pdf ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              PDF v{ed.pdf_version || '1.4'} · {formatPdfBytes(ed.pdf_size)} (প্রাইভেট)
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold">PDF আপলোড বাকি</span>
                          )}
                          <span>· ভিউ {toBengaliNumber(ed.views_count)} · ডাউনলোড {toBengaliNumber(ed.downloads_count)}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEditionId(ed.id);
                            setTab('pages');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>পৃষ্ঠা ও PDF প্রিভিউ</span>
                        </button>

                        {canManage && (
                          <>
                            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold cursor-pointer">
                              <FileUp className="w-3.5 h-3.5" />
                              <span>PDF আপলোড</span>
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                className="hidden"
                                onChange={(e) => handleQuickPdfReplace(ed.id, e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleEditEdition(ed)}
                              className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 font-semibold cursor-pointer"
                            >
                              সম্পাদনা
                            </button>
                          </>
                        )}

                        {canPublish && ed.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(ed.id, 'publish')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>প্রকাশ করুন</span>
                          </button>
                        )}
                        {canPublish && ed.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(ed.id, 'archive')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>আর্কাইভ</span>
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEdition(ed.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Delete edition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAGE MANAGEMENT & AUTHENTICATED PDF PREVIEW */}
      {tab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Ordered Pages & Add/Edit Page Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold font-serif-bn flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-700" />
                  <span>পৃষ্ঠাসমূহ ({toBengaliNumber(pages.length)})</span>
                </h2>
                <select
                  value={activeEditionId || ''}
                  onChange={(e) => setSelectedEditionId(Number(e.target.value))}
                  className="max-w-[210px] px-2.5 py-1 rounded-lg border border-stone-300 text-xs font-semibold bg-white"
                >
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.publication_date} · {ed.edition_name_bn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {pages.map((pg, idx) => (
                  <div
                    key={pg.id}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                      previewSourcePage === pg.pdf_source_page
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setPreviewSourcePage(pg.pdf_source_page || pg.page_number)}
                    >
                      <div className="font-bold text-stone-900">
                        পৃষ্ঠা {toBengaliNumber(pg.page_number)} · {pg.section_name_bn}
                      </div>
                      <p className="text-stone-600 line-clamp-1 mt-0.5">{pg.headline || 'শিরোনাম নেই'}</p>
                      <span className="text-[10px] text-stone-400">
                        PDF উৎস পাতা #{pg.pdf_source_page || pg.page_number}
                        {pg.has_own_pdf ? ' · স্বতন্ত্র PDF' : ''}
                      </span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePage(idx, -1)}
                          className="p-1 rounded bg-white border border-stone-200 disabled:opacity-40 cursor-pointer"
                          title="উপরে"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={() => handleMovePage(idx, 1)}
                          className="p-1 rounded bg-white border border-stone-200 disabled:opacity-40 cursor-pointer"
                          title="নিচে"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPageId(pg.id);
                            setPageForm({
                              page_number: pg.page_number,
                              pdf_source_page: pg.pdf_source_page,
                              section_name_bn: pg.section_name_bn,
                              section_name_en: pg.section_name_en || '',
                              headline: pg.headline || '',
                              summary: pg.summary || ''
                            });
                          }}
                          className="px-2 py-1 rounded bg-white border border-stone-200 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(pg.id)}
                          className="p-1 rounded bg-white border border-rose-200 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {canManage && activeEditionId && (
              <form onSubmit={handleSavePage} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-stone-900">
                    {editingPageId ? 'পৃষ্ঠা সম্পাদনা' : 'নতুন পৃষ্ঠা যোগ করুন'}
                  </h3>
                  {editingPageId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPageId(null);
                        setPageForm(emptyPageForm());
                      }}
                      className="text-rose-700 font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">পৃষ্ঠা নং</label>
                    <input
                      type="number"
                      min="1"
                      value={pageForm.page_number}
                      onChange={(e) => setPageForm({ ...pageForm, page_number: e.target.value })}
                      placeholder="Auto"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">PDF উৎস পাতা নং</label>
                    <input
                      type="number"
                      min="1"
                      value={pageForm.pdf_source_page}
                      onChange={(e) => setPageForm({ ...pageForm, pdf_source_page: e.target.value })}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">বিভাগ (বাংলা) *</label>
                    <input
                      required
                      value={pageForm.section_name_bn}
                      onChange={(e) => setPageForm({ ...pageForm, section_name_bn: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Section (English)</label>
                    <input
                      value={pageForm.section_name_en}
                      onChange={(e) => setPageForm({ ...pageForm, section_name_en: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">পৃষ্ঠার প্রধান শিরোনাম</label>
                  <input
                    value={pageForm.headline}
                    onChange={(e) => setPageForm({ ...pageForm, headline: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">সারসংক্ষেপ</label>
                  <textarea
                    rows={2}
                    value={pageForm.summary}
                    onChange={(e) => setPageForm({ ...pageForm, summary: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">পৃষ্ঠার নিজস্ব PDF (ঐচ্ছিক)</label>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => setPagePdfFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">প্রিভিউ ছবি (ঐচ্ছিক)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setPagePreviewFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPage || updatingPage}
                  className="w-full py-2 rounded-xl bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {savingPage || updatingPage ? 'সংরক্ষণ হচ্ছে...' : editingPageId ? 'পৃষ্ঠা আপডেট করুন' : 'পৃষ্ঠা যুক্ত করুন'}
                </button>
              </form>
            )}
          </div>

          {/* Right: Live Authenticated PDF Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
              <span className="font-extrabold text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-700" />
                <span>নিরাপদ PDF প্রিভিউ (পৃষ্ঠা #{previewSourcePage})</span>
              </span>
              {activeEdition?.pdf_checksum_sha256 && (
                <span className="font-mono text-[10px] text-stone-400">
                  SHA256: {activeEdition.pdf_checksum_sha256.slice(0, 16)}...
                </span>
              )}
            </div>

            {loadingPreviewPdf ? (
              <div className="h-[520px] flex items-center justify-center text-xs text-stone-500">
                প্রাইভেট ডিস্ক থেকে PDF লোড হচ্ছে...
              </div>
            ) : adminPdfBlobUrl ? (
              <iframe
                key={`${activeEdition?.id}-${previewSourcePage}`}
                src={buildPdfFragmentUrl(adminPdfBlobUrl, previewSourcePage, 100)}
                title="Admin E-paper PDF Preview"
                className="w-full h-[600px] rounded-xl border border-stone-300"
              />
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-xs text-stone-500 gap-2 bg-stone-50 rounded-xl">
                <Lock className="w-6 h-6 text-stone-400" />
                <span>এই সংস্করণে কোনো PDF আপলোড করা হয়নি। বাম পাশ থেকে PDF আপলোড করুন।</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIBER / READER ACCESS CONTROL */}
      {tab === 'subscribers' && canManage && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-700" />
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 font-serif-bn">
                নিবন্ধিত পাঠক ও ই-পেপার সাবস্ক্রিপশন নিয়ন্ত্রণ
              </h2>
              <p className="text-xs text-stone-500">
                সাবস্ক্রাইবার-সংরক্ষিত (&quot;Subscriber Only&quot;) সংস্করণ পড়ার জন্য পাঠককে E-Paper Plus স্তরে উন্নীত করুন।
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {subscribers.map((reader) => {
              const isPlus = reader.subscription_tier === 'epaper_plus';
              return (
                <div key={reader.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-stone-900">{reader.name}</p>
                    <p className="text-stone-500">{reader.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        isPlus ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isPlus ? 'E-Paper Plus' : 'Free Reader'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSubscriber(reader)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-bold cursor-pointer"
                    >
                      {isPlus ? 'Free এ নামান' : 'E-Paper Plus দিন'}
                    </button>
                  </div>
                </div>
              );
            })}
            {subscribers.length === 0 && (
              <p className="py-6 text-center text-xs text-stone-500">কোনো নিবন্ধিত পাঠক পাওয়া যায়নি।</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEpaperPage;


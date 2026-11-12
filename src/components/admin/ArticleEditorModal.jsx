import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetAdminNewsByIdQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation
} from '../../store/api/newsApi.js';
import { useTransitionWorkflowMutation } from '../../store/api/workflowApi.js';
import { useGetCategoriesQuery } from '../../store/api/categoryApi.js';
import { useGetTagsQuery } from '../../store/api/tagApi.js';
import { useGetReportersQuery } from '../../store/api/reporterApi.js';
import { useGetMediaListQuery, useUploadMediaMutation } from '../../store/api/mediaApi.js';
import { extractApiError, toCleanSlug, transitionArticleWorkflow } from '../../utils/apiNormalizer.js';
import { getEffectiveRole, hasEffectivePermission } from '../../utils/permissions.js';
import TipTapEditor from './TipTapEditor.jsx';
import ArticlePreviewModal from './ArticlePreviewModal.jsx';
import ScheduleModal from './ScheduleModal.jsx';
import AiArticleAssistantPanel from './AiArticleAssistantPanel.jsx';
import { LocationSelectorBar } from '../hyperlocal/LocationSelectorBar.jsx';
import { buildArticleGeoPayload } from '../../utils/hyperlocalHelpers.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { MotionOverlay } from '../common/MotionPrimitives.jsx';
import {
  Save,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Send,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  Flame,
  Star,
  Layers,
  Upload,
  Loader2
} from 'lucide-react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

export function ArticleEditorModal({ isOpen, onClose, articleToEdit = null }) {
  const authState = useSelector((state) => state.auth || {});
  const adminState = useSelector((state) => state.admin || {});
  const authUser = authState?.user;
  const currentUser = adminState?.currentUser;
  const isSuperAdmin = getEffectiveRole(authState, adminState) === 'super_admin';
  const canManageEmbargo = hasEffectivePermission(authState, adminState, 'embargo.manage');
  const canUseAi = hasEffectivePermission(authState, adminState, 'ai.use');
  const canApplyAi = hasEffectivePermission(authState, adminState, 'ai.apply');

  // Live API Data
  const {
    data: fullArticleData,
    isFetching: isLoadingFullArticle,
    refetch: refetchFullArticle
  } = useGetAdminNewsByIdQuery(
    articleToEdit?.id,
    { skip: !isOpen || !articleToEdit?.id }
  );
  const { data: rawCategories = [] } = useGetCategoriesQuery({ tree: true }, { skip: !isOpen });
  const { data: tagsResponse } = useGetTagsQuery({ per_page: 30 }, { skip: !isOpen });
  const { data: reportersResponse } = useGetReportersQuery({ per_page: 50 }, { skip: !isOpen });
  const { data: mediaResponse } = useGetMediaListQuery({ per_page: 12 }, { skip: !isOpen });

  const [createNews, { isLoading: isCreating }] = useCreateNewsMutation();
  const [updateNews, { isLoading: isUpdating }] = useUpdateNewsMutation();
  const [transitionWorkflow, { isLoading: isTransitioning }] = useTransitionWorkflowMutation();
  const [uploadMedia, { isLoading: isUploadingMedia }] = useUploadMediaMutation();

  const isSaving = isCreating || isUpdating || isTransitioning;

  const rootCategories = useMemo(() => {
    const list = Array.isArray(rawCategories) ? rawCategories : [];
    const roots = list.filter((c) => !c.parentId && !c.parent_id);
    return roots.length > 0 ? roots : list;
  }, [rawCategories]);

  const reportersList = useMemo(() => reportersResponse?.items || [], [reportersResponse]);
  const tagsList = useMemo(() => tagsResponse?.items || [], [tagsResponse]);
  const mediaList = useMemo(() => mediaResponse?.items || [], [mediaResponse]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    slug: '',
    subheadline: '',
    excerpt: '',
    content: '',
    image: DEFAULT_IMAGE_URL,
    imageCaption: '',
    imageCredit: 'দৈনিক বার্তা প্রবাহ ফাইল ছবি',
    category: '',
    subcategory: '',
    tags: '',
    reporterId: '',
    authorName: authUser?.name || currentUser?.name || 'মোঃ লুৎফর রহমান',
    authorRole: authUser?.designation || currentUser?.designation || 'প্রধান সম্পাদক',
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    isBreaking: false,
    isFeatured: false,
    isLead: false,
    isTrending: false,
    status: 'draft',
    scheduledAt: null,
    isEmbargoed: false,
    embargoUntil: '',
    embargoReason: '',
    autoReleaseEmbargo: true,
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
    wardId: '',
    isHyperlocal: false
  });

  // Validation errors & modals
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [pendingAiGenerationIds, setPendingAiGenerationIds] = useState([]);
  const [aiModifiedFields, setAiModifiedFields] = useState([]);

  // Resolve source article (prefer full detail endpoint when editing)
  const effectiveEditArticle = fullArticleData?.id ? fullArticleData : articleToEdit;

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (effectiveEditArticle) {
      const firstCategorySlug =
        effectiveEditArticle.categoryObj?.slug ||
        effectiveEditArticle.category ||
        rootCategories[0]?.slug ||
        'bangladesh';
      const subcatSlug =
        effectiveEditArticle.subcategoryObj?.slug ||
        effectiveEditArticle.subcategory ||
        '';
      const resolvedReporterId =
        effectiveEditArticle.reporterId ||
        effectiveEditArticle.reporterObj?.id ||
        reportersList[0]?.id ||
        '';

      setFormData({
        title: effectiveEditArticle.title || '',
        titleEn: effectiveEditArticle.titleEn || '',
        slug: effectiveEditArticle.slug || '',
        subheadline: effectiveEditArticle.subheadline || '',
        excerpt: effectiveEditArticle.excerpt || effectiveEditArticle.summary || '',
        content: effectiveEditArticle.content || '',
        image: effectiveEditArticle.image || DEFAULT_IMAGE_URL,
        imageCaption: effectiveEditArticle.imageCaption || '',
        imageCredit: effectiveEditArticle.imageCredit || 'দৈনিক বার্তা প্রবাহ',
        category: firstCategorySlug,
        subcategory: subcatSlug,
        tags: Array.isArray(effectiveEditArticle.tags)
          ? effectiveEditArticle.tags.join(', ')
          : effectiveEditArticle.tags || '',
        reporterId: resolvedReporterId ? String(resolvedReporterId) : '',
        authorName: effectiveEditArticle.author || effectiveEditArticle.reporter || authUser?.name || '',
        authorRole: effectiveEditArticle.authorDesignation || effectiveEditArticle.reporterObj?.designation || '',
        seoTitle: effectiveEditArticle.seo?.metaTitle || effectiveEditArticle.meta_title || effectiveEditArticle.title || '',
        seoDescription:
          effectiveEditArticle.seo?.metaDescription ||
          effectiveEditArticle.meta_description ||
          effectiveEditArticle.excerpt ||
          '',
        canonicalUrl:
          effectiveEditArticle.seo?.canonicalUrl ||
          effectiveEditArticle.canonical_url ||
          `https://dailyprabaho.com/news/${effectiveEditArticle.slug || ''}`,
        isBreaking: Boolean(effectiveEditArticle.isBreaking),
        isFeatured: Boolean(effectiveEditArticle.isFeatured),
        isLead: Boolean(effectiveEditArticle.isLead ?? effectiveEditArticle.isFeatured),
        isTrending: Boolean(effectiveEditArticle.isTrending),
        status: effectiveEditArticle.status || 'draft',
        scheduledAt: effectiveEditArticle.scheduledAt || null,
        isEmbargoed: Boolean(effectiveEditArticle.isEmbargoed ?? effectiveEditArticle.is_embargoed),
        embargoUntil: (effectiveEditArticle.embargoUntil || effectiveEditArticle.embargo_until || '').slice(0, 16),
        embargoReason: effectiveEditArticle.embargoReason || effectiveEditArticle.embargo_reason || '',
        autoReleaseEmbargo: effectiveEditArticle.autoReleaseEmbargo !== undefined ? Boolean(effectiveEditArticle.autoReleaseEmbargo) : true,
        divisionId: effectiveEditArticle.divisionId ? String(effectiveEditArticle.divisionId) : (effectiveEditArticle.division_id ? String(effectiveEditArticle.division_id) : ''),
        districtId: effectiveEditArticle.districtId ? String(effectiveEditArticle.districtId) : (effectiveEditArticle.district_id ? String(effectiveEditArticle.district_id) : ''),
        upazilaId: effectiveEditArticle.upazilaId ? String(effectiveEditArticle.upazilaId) : (effectiveEditArticle.upazila_id ? String(effectiveEditArticle.upazila_id) : ''),
        unionId: effectiveEditArticle.unionId ? String(effectiveEditArticle.unionId) : (effectiveEditArticle.union_id ? String(effectiveEditArticle.union_id) : ''),
        wardId: effectiveEditArticle.wardId ? String(effectiveEditArticle.wardId) : (effectiveEditArticle.ward_id ? String(effectiveEditArticle.ward_id) : ''),
        isHyperlocal: Boolean(effectiveEditArticle.isHyperlocal ?? effectiveEditArticle.is_hyperlocal)
      });
    } else {
      setFormData({
        title: '',
        titleEn: '',
        slug: '',
        subheadline: '',
        excerpt: '',
        content: '',
        image: DEFAULT_IMAGE_URL,
        imageCaption: '',
        imageCredit: 'দৈনিক বার্তা প্রবাহ ফাইল ছবি',
        category: rootCategories[0]?.slug || 'bangladesh',
        subcategory: '',
        tags: 'বাংলাদেশ, জাতীয়, সংবাদ',
        reporterId: reportersList[0]?.id ? String(reportersList[0].id) : '',
        authorName: authUser?.name || currentUser?.name || 'নিজস্ব প্রতিবেদক',
        authorRole: authUser?.designation || currentUser?.designation || 'স্টাফ রিপোর্টার',
        seoTitle: '',
        seoDescription: '',
        canonicalUrl: '',
        isBreaking: false,
        isFeatured: false,
        isLead: false,
        isTrending: false,
        status: 'draft',
        scheduledAt: null,
        isEmbargoed: false,
        embargoUntil: '',
        embargoReason: '',
        autoReleaseEmbargo: true,
        divisionId: '',
        districtId: '',
        upazilaId: '',
        unionId: '',
        wardId: '',
        isHyperlocal: false
      });
    }
    setPendingAiGenerationIds([]);
    setAiModifiedFields(Array.isArray(effectiveEditArticle?.aiModifiedFields) ? effectiveEditArticle.aiModifiedFields : []);
    setErrors({});
  }, [effectiveEditArticle, isOpen, rootCategories, reportersList, authUser, currentUser]);

  // Selected Category's subcategories (before early return)
  const currentCategoryObj = useMemo(
    () => rootCategories.find((c) => c.slug === formData.category) || rootCategories[0] || null,
    [rootCategories, formData.category]
  );

  const subcategoriesList = useMemo(() => {
    if (!currentCategoryObj) return [];
    if (Array.isArray(currentCategoryObj.subcategories) && currentCategoryObj.subcategories.length > 0) {
      return currentCategoryObj.subcategories;
    }
    return (Array.isArray(rawCategories) ? rawCategories : []).filter(
      (c) => Number(c.parentId || c.parent_id) === Number(currentCategoryObj.id)
    );
  }, [currentCategoryObj, rawCategories]);

  // Slug generator helper
  const handleGenerateSlug = () => {
    let base = formData.titleEn.trim();
    if (!base) {
      base = formData.title.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, '').trim();
    }
    const generatedSlug = toCleanSlug(base, `news-${Date.now()}`);

    setFormData((prev) => ({
      ...prev,
      slug: generatedSlug,
      canonicalUrl: `https://dailyprabaho.com/news/${generatedSlug}`
    }));
  };

  // Validation
  const validateForm = (actionType) => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'সংবাদের শিরোনাম আবশ্যক';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'শিরোনাম অন্তত ৫ অক্ষরের হতে হবে';
    }

    if (formData.slug.trim() && !/^[a-z0-9-]+$/.test(formData.slug.trim())) {
      newErrors.slug = 'স্লাগে কেবল ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (-) ব্যবহার করা যাবে';
    }

    if (actionType !== 'draft') {
      if (!currentCategoryObj?.id) {
        newErrors.category = 'বিভাগ নির্বাচন করুন';
      }
      if (!formData.content.trim() || formData.content === '<p></p>') {
        newErrors.content = 'সংবাদের বিস্তারিত বিবরণ লেখা আবশ্যক';
      }
      if (!formData.excerpt.trim()) {
        newErrors.excerpt = 'সংক্ষিপ্ত সারসংক্ষেপ আবশ্যক';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build Laravel API payload matching StoreNewsRequest / UpdateNewsRequest
  const buildApiPayload = (extra = {}) => {
    const matchedSubcategory = subcategoriesList.find(
      (sub) => sub.slug === formData.subcategory || sub.name === formData.subcategory || String(sub.id) === String(formData.subcategory)
    );
    const tagList = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      subheadline: formData.subheadline.trim() || null,
      summary: formData.excerpt.trim() || formData.title.trim(),
      content: formData.content.trim() || `<p>${formData.excerpt.trim() || formData.title.trim()}</p>`,
      category_id: Number(currentCategoryObj?.id),
      subcategory_id: matchedSubcategory?.id ? Number(matchedSubcategory.id) : null,
      reporter_id: formData.reporterId ? Number(formData.reporterId) : null,
      featured_image: formData.image.trim() || DEFAULT_IMAGE_URL,
      featured_image_caption: formData.imageCaption.trim() || null,
      featured_image_credit: formData.imageCredit.trim() || null,
      is_breaking: Boolean(formData.isBreaking),
      is_featured: Boolean(formData.isFeatured || formData.isLead),
      is_trending: Boolean(formData.isTrending),
      tags: tagList,
      meta_title: (formData.seoTitle || formData.title).trim(),
      meta_description: (formData.seoDescription || formData.excerpt || formData.title).trim(),
      canonical_url: formData.canonicalUrl.trim() || null,
      ...buildArticleGeoPayload({
        divisionId: formData.divisionId,
        districtId: formData.districtId,
        upazilaId: formData.upazilaId,
        unionId: formData.unionId,
        wardId: formData.wardId,
        isHyperlocal: formData.isHyperlocal
      }),
      ...extra
    };

    if (formData.slug.trim()) {
      payload.slug = formData.slug.trim();
    }

    if (canManageEmbargo) {
      payload.is_embargoed = Boolean(formData.isEmbargoed);
      payload.embargo_until = formData.isEmbargoed && formData.embargoUntil ? formData.embargoUntil : null;
      payload.embargo_reason = formData.isEmbargoed ? (formData.embargoReason.trim() || null) : null;
      payload.auto_release_embargo = Boolean(formData.autoReleaseEmbargo);
    }

    if (!articleToEdit?.id && pendingAiGenerationIds.length > 0) {
      payload.ai_generation_ids = pendingAiGenerationIds;
    }
    if (!articleToEdit?.id && aiModifiedFields.length > 0) {
      payload.ai_modified_fields = aiModifiedFields;
    }

    return payload;
  };

  // Save & optional workflow transition
  const saveArticleWithStatus = async ({ initialCreateStatus = 'draft', targetStatus = null, scheduledAt = null, successMessage }) => {
    try {
      const apiPayload = buildApiPayload(
        articleToEdit ? { change_summary: 'CMS থেকে হালনাগাদ' } : { status: initialCreateStatus }
      );

      if (!apiPayload.category_id) {
        await sweetAlert.warning('বিভাগ প্রয়োজন', 'অন্তত একটি বিভাগ লোড হওয়ার পর সংরক্ষণ করুন।');
        return;
      }

      let saved;
      if (articleToEdit?.id) {
        saved = await updateNews({ id: articleToEdit.id, ...apiPayload }).unwrap();
      } else {
        saved = await createNews(apiPayload).unwrap();
      }

      const savedId = saved?.id || articleToEdit?.id;
      const currentStatus = saved?.status || formData.status || initialCreateStatus;

      if (targetStatus && savedId && currentStatus !== targetStatus) {
        await transitionArticleWorkflow({
          transitionMutation: transitionWorkflow,
          articleId: savedId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          scheduled_at: scheduledAt || undefined,
          isSuperAdmin
        });
      }

      onClose();
      await sweetAlert.success(
        articleToEdit ? 'সংবাদ হালনাগাদ হয়েছে!' : 'সংবাদ সংরক্ষিত হয়েছে!',
        successMessage
      );
    } catch (error) {
      await sweetAlert.error('সংরক্ষণ ব্যর্থ হয়েছে', extractApiError(error, 'সংবাদ সংরক্ষণ করতে সমস্যা হয়েছে।'));
    }
  };

  // Actions
  const handleSaveDraft = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) {
      setErrors({ title: 'খসড়া সংরক্ষণের জন্য অন্তত একটি শিরোনাম দিন' });
      return;
    }
    await saveArticleWithStatus({
      initialCreateStatus: 'draft',
      targetStatus: articleToEdit?.id && formData.status !== 'draft' ? 'draft' : null,
      successMessage: articleToEdit ? 'খসড়া সফলভাবে হালনাগাদ হয়েছে' : 'সংবাদটি খসড়া হিসেবে সংরক্ষিত হয়েছে'
    });
  };

  const handleSubmitForReview = async (e) => {
    e?.preventDefault();
    if (!validateForm('review')) return;
    await saveArticleWithStatus({
      initialCreateStatus: 'submitted',
      targetStatus: 'submitted',
      successMessage: 'সংবাদটি সম্পাদকের পর্যালোচনার জন্য জমা দেওয়া হয়েছে'
    });
  };

  const handlePublishNow = async (e) => {
    e?.preventDefault();
    if (!validateForm('publish')) return;
    await saveArticleWithStatus({
      initialCreateStatus: 'draft',
      targetStatus: articleToEdit?.status === 'published' ? null : 'published',
      successMessage: articleToEdit ? 'সংবাদটি সফলভাবে হালনাগাদ হয়েছে' : 'নতুন সংবাদ লাইভ প্রকাশিত হয়েছে!'
    });
  };

  const handleScheduleConfirm = async (scheduledTimestamp) => {
    if (!validateForm('schedule')) return;
    await saveArticleWithStatus({
      initialCreateStatus: 'draft',
      targetStatus: 'scheduled',
      scheduledAt: scheduledTimestamp,
      successMessage: 'সংবাদ প্রকাশের সময় সফলভাবে নির্ধারিত হয়েছে'
    });
  };

  const handleSelectMediaSample = (sampleUrl, sampleCaption) => {
    setFormData((prev) => ({
      ...prev,
      image: sampleUrl,
      imageCaption: sampleCaption || prev.imageCaption
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('media_type', 'image');
      uploadData.append('name', formData.title || file.name);
      if (formData.imageCaption) uploadData.append('caption', formData.imageCaption);
      if (formData.imageCredit) uploadData.append('credit', formData.imageCredit);

      const uploaded = await uploadMedia(uploadData).unwrap();
      if (uploaded?.url) {
        setFormData((prev) => ({
          ...prev,
          image: uploaded.url,
          imageCaption: uploaded.caption || prev.imageCaption
        }));
        await sweetAlert.success('ছবি আপলোড হয়েছে!', 'ছবি সফলভাবে সার্ভারে আপলোড হয়েছে।');
      }
    } catch (error) {
      await sweetAlert.error('আপলোড ব্যর্থ হয়েছে', extractApiError(error, 'ছবি আপলোড করতে ব্যর্থ হয়েছে।'));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <MotionOverlay
        isOpen={isOpen}
        onBackdropClick={onClose}
        wrapperClassName="z-40 p-2 sm:p-4"
        backdropClassName="bg-stone-950/80 backdrop-blur-xs"
        panelClassName="bg-white rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 font-sans"
      >
          
          {/* 1. Modal Top Bar */}
          <div className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                <span>{articleToEdit ? 'সংবাদ সম্পাদনা' : 'নতুন সংবাদ রচনা'}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  formData.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ['submitted', 'under_review', 'approved'].includes(formData.status)
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}>
                  {formData.status}
                </span>
                {isLoadingFullArticle && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-stone-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>লোড হচ্ছে...</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500">
                টিপট্যাপ রিচ-টেক্সট এডিটর ও মেটাডাটা অপটিমাইজেশন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="প্রিভিউ দেখুন"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">প্রিভিউ</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Navigation Tabs */}
          <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'border-rose-700 text-rose-700 bg-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              মূল বিষয়বস্তু ও এডিটর
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'media'
                  ? 'border-rose-700 text-rose-700 bg-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              ছবি ও মিডিয়া
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'seo'
                  ? 'border-rose-700 text-rose-700 bg-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              এসইও ও মেটা
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-rose-700 text-rose-700 bg-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              ট্যাক্সোনমি ও ফ্ল্যাগ
            </button>
            {canUseAi && (
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'border-indigo-700 text-indigo-700 bg-white'
                    : 'border-transparent text-stone-600 hover:text-indigo-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI সহায়তা</span>
              </button>
            )}
          </div>

          {/* 3. Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* TAB 1: Content & TipTap */}
            {activeTab === 'content' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                
                {/* Headline */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      সংবাদের মূল শিরোনাম (Headline) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-stone-400">
                      {toBengaliNumber(formData.title.length)} অক্ষর
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        title: e.target.value,
                        seoTitle: prev.seoTitle || e.target.value
                      }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                    }}
                    placeholder="স্পষ্ট ও আকর্ষণীয় সংবাদ শিরোনাম লিখুন..."
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold font-serif-bn focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                      errors.title ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>

                {/* Subheadline (Kicker) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    উপ-শিরোনাম / শোল্ডার (Subheadline)
                  </label>
                  <input
                    type="text"
                    value={formData.subheadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
                    placeholder="সংবাদের পরিপূরক সংক্ষিপ্ত উপ-শিরোনাম (ঐচ্ছিক)"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-serif-bn focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Slug Generator Row */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
                      <span>ইউআরএল স্লাগ (SEO Slug) <span className="text-rose-600">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="px-2.5 py-1 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-rose-700" />
                      <span>শিরোনাম থেকে স্লাগ তৈরি</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400 hidden sm:inline">
                      /news/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setFormData(prev => ({
                          ...prev,
                          slug: val,
                          canonicalUrl: `https://dailyprabaho.com/news/${val}`
                        }));
                        if (errors.slug) setErrors(prev => ({ ...prev, slug: null }));
                      }}
                      placeholder="e.g. metro-rail-expansion-tongi"
                      className={`flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        errors.slug ? 'border-rose-500' : 'border-stone-300'
                      }`}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.slug}</span>
                    </p>
                  )}
                </div>

                {/* Short Description (Excerpt) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      সংক্ষিপ্ত সারসংক্ষেপ (Short Description / Excerpt) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-stone-400">
                      {toBengaliNumber(formData.excerpt.length)} অক্ষর
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        excerpt: e.target.value,
                        seoDescription: prev.seoDescription || e.target.value
                      }));
                      if (errors.excerpt) setErrors(prev => ({ ...prev, excerpt: null }));
                    }}
                    placeholder="সংবাদের মূল সারমর্ম যা হোমপেজ ও সোশ্যাল মিডিয়া শেয়ারে প্রদর্শিত হবে..."
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-serif-bn focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      errors.excerpt ? 'border-rose-500' : 'border-stone-300'
                    }`}
                  />
                  {errors.excerpt && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.excerpt}</span>
                    </p>
                  )}
                </div>

                {/* TipTap Rich Text Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-800">
                      সম্পূর্ণ বিস্তারিত সংবাদ (TipTap Rich Text Article) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-stone-500">বোল্ড, হেডিং, তালিকা ও ছবি সমর্থন করে</span>
                  </div>

                  <TipTapEditor
                    content={formData.content}
                    onChange={(html) => {
                      setFormData(prev => ({ ...prev, content: html }));
                      if (errors.content) setErrors(prev => ({ ...prev, content: null }));
                    }}
                    placeholder="অনুচ্ছেদ, হেডিং ও উদ্ধৃতি সহকারে বিস্তারিত সংবাদ এখানে লিখুন..."
                  />

                  {errors.content && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.content}</span>
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Image & Media */}
            {activeTab === 'media' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-700" />
                    <span>প্রধান নির্বাচিত ছবি (Featured Image)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ছবির সরাসরি ইউআরএল (Image URL)
                      </label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="https://... বা /storage/..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="w-full px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                        {isUploadingMedia ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingMedia ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploadingMedia}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {formData.image && (
                    <div className="border border-stone-200 rounded-xl overflow-hidden aspect-video max-h-72 bg-stone-100 flex items-center justify-center">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ছবির ক্যাপশন (Image Caption)
                      </label>
                      <input
                        type="text"
                        value={formData.imageCaption}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageCaption: e.target.value }))}
                        placeholder="ছবিতে যা দেখা যাচ্ছে তার বিবরণ..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ছবির ক্রেডিট ও সূত্র (Image Credit)
                      </label>
                      <input
                        type="text"
                        value={formData.imageCredit}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageCredit: e.target.value }))}
                        placeholder="যেমন: বার্তা প্রবাহ / ফাইল ছবি"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Pick from Media Library */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      মিডিয়া লাইব্রেরি থেকে দ্রুত নির্বাচন করুন:
                    </span>
                    <span className="text-[11px] text-stone-500">১-ক্লিক নির্বাচন</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {mediaList.map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleSelectMediaSample(med.url, med.caption)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          formData.image === med.url ? 'border-rose-700 ring-2 ring-rose-200' : 'border-transparent hover:border-stone-400'
                        }`}
                        title={med.title || med.name}
                      >
                        <img src={med.url} alt={med.altText || med.title || med.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {mediaList.length === 0 && (
                      <p className="col-span-6 text-xs text-stone-400 py-3 text-center">
                        মিডিয়া লাইব্রেরিতে এখনো কোনো ছবি নেই — উপরে ফাইল আপলোড বা সরাসরি URL দিন।
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEO & Meta */}
            {activeTab === 'seo' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold font-serif-bn text-stone-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>সার্চ ইঞ্জিন অপটিমাইজেশন (SEO Settings)</span>
                  </h3>

                  {/* Google Snippet Simulation */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 font-mono tracking-wider">
                      গুগল সার্চ ফলাফল প্রিভিউ (SERP Preview)
                    </span>
                    <p className="text-xs text-emerald-800 font-mono truncate">
                      https://dailyprabaho.com/news/{formData.slug || 'example-slug'}
                    </p>
                    <h4 className="text-sm font-bold text-blue-800 hover:underline cursor-pointer line-clamp-1">
                      {formData.seoTitle || formData.title || 'শিরোনাম এখানে প্রদর্শিত হবে'} - দৈনিক বার্তা প্রবাহ
                    </h4>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {formData.seoDescription || formData.excerpt || 'সংবাদের সংক্ষিপ্ত বিবরণ সার্চ ফলাফলে পাঠকদের আকৃষ্ট করবে...'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        এসইও মেটা টাইটেল (SEO Title)
                      </label>
                      <span className="text-[11px] font-mono text-stone-400">
                        {toBengaliNumber((formData.seoTitle || formData.title).length)} / ৬০ অক্ষর
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="সার্চ ইঞ্জিনে প্রদর্শিত শিরোনাম..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        এসইও মেটা বিবরণ (Meta Description)
                      </label>
                      <span className="text-[11px] font-mono text-stone-400">
                        {toBengaliNumber((formData.seoDescription || formData.excerpt).length)} / ১৬০ অক্ষর
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="সার্চ ইঞ্জিন ও সামাজিক মাধ্যমের জন্য সংক্ষিপ্ত বিবরণ..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ক্যানোনিকাল ইউআরএল (Canonical URL)
                    </label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                      placeholder="https://dailyprabaho.com/news/..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Taxonomy & Editorial Flags */}
            {activeTab === 'settings' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold font-serif-bn text-stone-900">
                    ট্যাক্সোনমি, প্রতিবেদক ও প্রকাশনা ফ্ল্যাগ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        মূল বিভাগ (Category) <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                          subcategory: ''
                        }))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        {rootCategories.map((cat) => (
                          <option key={cat.id || cat.slug} value={cat.slug}>
                            {cat.name} ({cat.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        উপ-বিভাগ (Subcategory)
                      </label>
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="">কোনো উপ-বিভাগ নেই</option>
                        {subcategoriesList.map((sub, idx) => (
                          <option key={sub.id || idx} value={sub.slug || sub.name || sub}>
                            {sub.name || sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reporter */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        প্রতিবেদক (Newsroom Reporter)
                      </label>
                      <select
                        value={formData.reporterId}
                        onChange={(e) => {
                          const rep = reportersList.find((r) => String(r.id) === String(e.target.value));
                          setFormData((prev) => ({
                            ...prev,
                            reporterId: e.target.value,
                            authorName: rep ? rep.name : prev.authorName,
                            authorRole: rep ? rep.designation : prev.authorRole
                          }));
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="">স্বয়ংক্রিয় (লগইনকৃত লেখক)</option>
                        {reportersList.map((rep) => (
                          <option key={rep.id} value={String(rep.id)}>
                            {rep.name} — {rep.designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      সংবাদ ট্যাগ (কমা দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="ঢাকা, মেট্রোরেল, যোগাযোগ ব্যবস্থা"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-serif-bn focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />

                    {/* Trending tag chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-stone-500 font-bold mr-1">দ্রুত ট্যাগ যোগ করুন:</span>
                      {tagsList.slice(0, 8).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            const current = formData.tags
                              ? formData.tags.split(',').map((x) => x.trim()).filter(Boolean)
                              : [];
                            if (!current.includes(t.name)) {
                              setFormData((prev) => ({
                                ...prev,
                                tags: current.concat(t.name).join(', ')
                              }));
                            }
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 hover:bg-rose-100 hover:text-rose-800 font-medium cursor-pointer transition-colors"
                        >
                          + {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editorial Toggles */}
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <span className="block text-xs font-bold text-stone-700">সম্পাদকীয় ফ্ল্যাগ ও অগ্রাধিকার:</span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isBreaking}
                          onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-800 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>ব্রেকিং নিউজ</span>
                          </p>
                          <p className="text-[10px] text-stone-500">টিকার ও লাল ব্যানারে প্রদর্শন</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                          className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-800 flex items-center gap-1">
                            <Star className="w-3 h-3 text-blue-600" />
                            <span>ফিচার্ড সংবাদ</span>
                          </p>
                          <p className="text-[10px] text-stone-500">হোমপেজ বিশেষ গ্রিডে প্রদর্শন</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isLead}
                          onChange={(e) => setFormData(prev => ({ ...prev, isLead: e.target.checked }))}
                          className="rounded border-stone-300 text-rose-700 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-800 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-rose-700" />
                            <span>প্রধান শীর্ষ সংবাদ</span>
                          </p>
                          <p className="text-[10px] text-stone-500">হোমপেজ হিরো ব্যানার লিড</p>
                        </div>
                      </label>
                    </div>

                    {/* Phase 30: Hyperlocal Bangladesh Geo Assignment */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-800">
                          হাইপারলোকাল অবস্থান (বিভাগ &gt; জেলা &gt; উপজেলা &gt; ইউনিয়ন &gt; ওয়ার্ড)
                        </span>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(formData.isHyperlocal)}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isHyperlocal: e.target.checked }))}
                            className="accent-rose-700"
                          />
                          <span>স্থানীয় সংবাদ হিসেবে চিহ্নিত করুন</span>
                        </label>
                      </div>
                      <LocationSelectorBar
                        value={{
                          divisionId: formData.divisionId,
                          districtId: formData.districtId,
                          upazilaId: formData.upazilaId,
                          unionId: formData.unionId,
                          wardId: formData.wardId
                        }}
                        onChange={(next) =>
                          setFormData((prev) => ({
                            ...prev,
                            ...next,
                            isHyperlocal: Boolean(next.divisionId || next.districtId || next.upazilaId || next.unionId || next.wardId || prev.isHyperlocal)
                          }))
                        }
                        onClear={() =>
                          setFormData((prev) => ({
                            ...prev,
                            divisionId: '',
                            districtId: '',
                            upazilaId: '',
                            unionId: '',
                            wardId: '',
                            isHyperlocal: false
                          }))
                        }
                        includeDeepLevels={true}
                        showPrivacyNote={false}
                        isBn={true}
                        compact={true}
                      />
                    </div>

                    {canManageEmbargo && (
                      <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <div>
                            <p className="text-xs font-bold text-rose-900">সংবাদ এমবার্গো নিয়ন্ত্রণ (News Embargo)</p>
                            <p className="text-[10px] text-stone-600">সক্রিয় থাকলে নির্ধারিত সময় পর্যন্ত জনসমক্ষে প্রকাশ সম্পূর্ণ বন্ধ থাকবে</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.isEmbargoed}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isEmbargoed: e.target.checked }))}
                            className="rounded border-rose-300 text-rose-700 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                        </label>
                        {formData.isEmbargoed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-1">এমবার্গো শেষ হওয়ার সময়</label>
                              <input
                                type="datetime-local"
                                value={formData.embargoUntil}
                                onChange={(e) => setFormData((prev) => ({ ...prev, embargoUntil: e.target.value }))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-1">এমবার্গোর কারণ / নোট</label>
                              <input
                                type="text"
                                value={formData.embargoReason}
                                onChange={(e) => setFormData((prev) => ({ ...prev, embargoReason: e.target.value }))}
                                placeholder="যেমন: যৌথ ব্রিফিং পর্যন্ত নিষিদ্ধ"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: Phase 20 AI Newsroom Assistant */}
            {activeTab === 'ai' && canUseAi && (
              <div className="max-w-4xl mx-auto">
                <AiArticleAssistantPanel
                  articleId={articleToEdit?.id || null}
                  formData={formData}
                  canApply={canApplyAi}
                  trackedAiFields={aiModifiedFields}
                  onAcceptIntoDraft={({ generationId, fields, modifiedKeys }) => {
                    setFormData((prev) => {
                      const next = { ...prev };
                      if (fields?.title) next.title = fields.title;
                      if (fields?.subheadline) next.subheadline = fields.subheadline;
                      if (fields?.summary) next.excerpt = fields.summary;
                      if (fields?.content) next.content = fields.content;
                      if (fields?.meta_title) next.seoTitle = fields.meta_title;
                      if (fields?.meta_description) next.seoDescription = fields.meta_description;
                      if (fields?.slug) next.slug = fields.slug;
                      if (Array.isArray(fields?.tags) && fields.tags.length > 0) {
                        const existing = prev.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean);
                        const merged = Array.from(new Set([...existing, ...fields.tags.map((t) => String(t).trim()).filter(Boolean)]));
                        next.tags = merged.join(', ');
                      }
                      return next;
                    });
                    if (generationId) {
                      setPendingAiGenerationIds((prev) => (prev.includes(generationId) ? prev : [...prev, generationId]));
                    }
                    if (Array.isArray(modifiedKeys) && modifiedKeys.length > 0) {
                      setAiModifiedFields((prev) => Array.from(new Set([...prev, ...modifiedKeys])));
                    }
                  }}
                  onAfterApplySavedArticle={() => refetchFullArticle()}
                />
              </div>
            )}

          </div>

          {/* 4. Action Footer Buttons */}
          <div className="bg-stone-50 border-t border-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-white disabled:opacity-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-stone-500" />
                <span>খসড়া সংরক্ষণ (Save Draft)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-white text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>প্রিভিউ দেখুন</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSubmitForReview}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পর্যালোচনায় জমা দিন (Review)</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => setScheduleModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-white disabled:opacity-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>সময় নির্ধারণ (Schedule)</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handlePublishNow}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : articleToEdit ? 'হালনাগাদ করুন' : 'সরাসরি প্রকাশ করুন'}</span>
              </button>
            </div>
          </div>
      </MotionOverlay>

      {/* Preview Modal */}
      <ArticlePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        article={formData}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleScheduleConfirm}
        currentScheduledAt={formData.scheduledAt}
      />
    </>
  );
}

export default ArticleEditorModal;

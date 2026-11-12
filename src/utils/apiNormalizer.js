/**
 * API Response Adapters & Normalizers
 * Maps Laravel 11 API JSON Resources (`snake_case`, pivot objects, `{ items, pagination }`)
 * into uniform structures expected by React UI components without duplicating mapping logic.
 */

import { stripHtmlTags } from './securitySanitizer.js';

const FALLBACK_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';

/**
 * Unwrap Laravel `{ success, message, data }` payload safely.
 */
export const unwrapPayload = (response) => {
  if (!response) return response;
  return response.data !== undefined ? response.data : response;
};

/**
 * Normalize Laravel paginated payloads (`{ items, pagination }` or `{ data, meta }` or flat array).
 */
export const normalizePaginated = (response, itemNormalizer = (x) => x) => {
  const payload = unwrapPayload(response);
  if (Array.isArray(payload)) {
    const items = payload.map(itemNormalizer);
    return { items, data: items, pagination: { current_page: 1, last_page: 1, per_page: items.length || 15, total: items.length } };
  }

  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const items = rawItems.map(itemNormalizer);
  const pagination = payload?.pagination || payload?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: items.length || 15,
    total: items.length
  };

  return {
    items,
    data: items,
    pagination,
    meta: pagination
  };
};

/**
 * Normalize Laravel `/storage/...` and external media URLs to avoid cross-origin issues in Vite proxy/Nginx.
 */
export const normalizeMediaUrl = (url, fallback = '') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  }
  if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `/storage/${trimmed.replace(/^\/+/, '')}`;
};

/**
 * Normalize a string into a lowercase URL-safe ASCII slug.
 */
export const toCleanSlug = (value = '', fallback = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback;

export const normalizeWorkflowLog = (wf) => {
  if (!wf) return null;
  const actorObj = typeof wf.actor === 'object' ? wf.actor : null;
  return {
    ...wf,
    id: wf.id,
    fromStatus: wf.from_status ?? wf.fromStatus ?? null,
    toStatus: wf.to_status ?? wf.toStatus ?? '',
    actorName: actorObj?.name || wf.actorName || 'সম্পাদকীয় ডেস্ক',
    actorDesignation: actorObj?.designation || '',
    comments: wf.comments || '',
    timestamp: wf.created_at || wf.timestamp || null
  };
};

export const normalizeRevision = (rev) => {
  if (!rev) return null;
  const userObj = typeof rev.user === 'object' ? rev.user : null;
  return {
    ...rev,
    id: rev.id,
    revisionNumber: rev.revision_number ?? rev.revisionNumber ?? 1,
    title: rev.title || '',
    changeSummary: rev.change_summary || rev.changeSummary || '',
    isAiAssisted: Boolean(rev.is_ai_assisted ?? rev.isAiAssisted),
    aiGenerationId: rev.ai_generation_id ?? rev.aiGenerationId ?? null,
    aiActionType: rev.ai_action_type ?? rev.aiActionType ?? null,
    userName: userObj?.name || rev.userName || 'সম্পাদক',
    timestamp: rev.created_at || rev.timestamp || null
  };
};

/**
 * Normalize Laravel NewsResource / NewsListResource into uniform frontend article object.
 */
export const normalizeArticle = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const catObj = raw.category && typeof raw.category === 'object' ? raw.category : null;
  const subcatObj = raw.subcategory && typeof raw.subcategory === 'object' ? raw.subcategory : null;
  const authorObj = raw.author && typeof raw.author === 'object' ? raw.author : null;
  const reporterObj = raw.reporter && typeof raw.reporter === 'object' ? raw.reporter : null;
  const editorObj = raw.editor && typeof raw.editor === 'object' ? raw.editor : null;

  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const tagObjects = rawTags.map((t) =>
    typeof t === 'object' ? { id: t.id, name: t.name, slug: t.slug } : { name: String(t), slug: String(t) }
  );
  const tagNames = tagObjects.map((t) => t.name);

  const image = normalizeMediaUrl(
    raw.featured_image ?? raw.featuredImage ?? raw.image,
    FALLBACK_ARTICLE_IMAGE
  );

  const categorySlug = catObj?.slug || (typeof raw.category === 'string' ? raw.category : '') || 'bangladesh';
  const categoryName = catObj?.name || raw.categoryName || categorySlug;

  const publishedAt = raw.published_at || raw.publishedAt || raw.created_at || raw.createdAt || new Date().toISOString();

  return {
    ...raw,
    id: raw.id,
    title: raw.title || '',
    titleEn: raw.title_en || raw.titleEn || raw.title || '',
    slug: raw.slug || String(raw.id || ''),
    subheadline: raw.subheadline || '',
    excerpt: stripHtmlTags(raw.summary ?? raw.excerpt ?? ''),
    excerptEn: stripHtmlTags(raw.summary_en || raw.excerptEn || raw.summary || ''),
    summary: stripHtmlTags(raw.summary ?? raw.excerpt ?? ''),
    content: raw.content || `<p>${raw.summary || ''}</p>`,
    contentEn: raw.content_en || raw.contentEn || raw.content || '',
    image,
    featuredImage: image,
    featured_image: image,
    imageCaption: raw.featured_image_caption ?? raw.imageCaption ?? '',
    imageCredit: raw.featured_image_credit ?? raw.imageCredit ?? '',
    category: categorySlug,
    categoryId: catObj?.id ?? raw.category_id ?? raw.categoryId ?? null,
    categoryName,
    categoryNameEn: catObj?.name_en || raw.categoryNameEn || categoryName,
    categoryObj: catObj,
    subcategory: subcatObj?.slug || (typeof raw.subcategory === 'string' ? raw.subcategory : '') || '',
    subcategoryId: subcatObj?.id ?? raw.subcategory_id ?? raw.subcategoryId ?? null,
    subcategoryName: subcatObj?.name || raw.subcategoryName || '',
    subcategoryObj: subcatObj,
    author: authorObj?.name || (typeof raw.author === 'string' ? raw.author : 'নিজস্ব প্রতিবেদক'),
    authorId: authorObj?.id ?? raw.author_id ?? raw.authorId ?? null,
    authorAvatar: normalizeMediaUrl(authorObj?.avatar_url, FALLBACK_AVATAR),
    authorDesignation: authorObj?.designation || '',
    authorSlug: authorObj?.slug || (authorObj?.id ? String(authorObj.id) : ''),
    authorObj,
    reporter: reporterObj?.name || (typeof raw.reporter === 'string' ? raw.reporter : ''),
    reporterId: reporterObj?.id ?? raw.reporter_id ?? raw.reporterId ?? null,
    reporterObj,
    editor: editorObj?.name || (typeof raw.editor === 'string' ? raw.editor : ''),
    editorObj,
    tags: tagNames,
    tagObjects,
    status: raw.status || 'published',
    rejectionReason: raw.rejection_reason ?? raw.rejectionReason ?? '',
    isBreaking: Boolean(raw.is_breaking ?? raw.isBreaking),
    isFeatured: Boolean(raw.is_featured ?? raw.isFeatured),
    isTrending: Boolean(raw.is_trending ?? raw.isTrending),
    isLead: Boolean(raw.is_lead ?? raw.isLead ?? raw.is_featured),
    views: Number(raw.views_count ?? raw.views ?? 0),
    shares: Number(raw.shares_count ?? raw.shares ?? 0),
    readingTime: Number(raw.reading_time ?? raw.readingTime ?? 3),
    publishedAt,
    scheduledAt: raw.scheduled_at ?? raw.scheduledAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? publishedAt,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? publishedAt,
    seo: {
      metaTitle: raw.meta_title || raw.seo?.metaTitle || raw.title || '',
      metaDescription: raw.meta_description || raw.seo?.metaDescription || raw.summary || '',
      focusKeyword: Array.isArray(raw.meta_keywords)
        ? (raw.meta_keywords[0] || '')
        : (raw.seo?.focusKeyword || ''),
      canonicalUrl: raw.canonical_url || raw.seo?.canonicalUrl || ''
    },
    workflows: Array.isArray(raw.workflows) ? raw.workflows.map(normalizeWorkflowLog) : [],
    revisions: Array.isArray(raw.revisions) ? raw.revisions.map(normalizeRevision) : [],
    assignmentId: raw.assignment_id ?? raw.assignmentId ?? null,
    isEmbargoed: Boolean(raw.is_embargoed ?? raw.isEmbargoed),
    embargoUntil: raw.embargo_until ?? raw.embargoUntil ?? null,
    embargoReason: raw.embargo_reason ?? raw.embargoReason ?? '',
    embargoAuthorizedBy: raw.embargo_authorized_by ?? raw.embargoAuthorizedBy ?? null,
    embargoReleasedAt: raw.embargo_released_at ?? raw.embargoReleasedAt ?? null,
    autoReleaseEmbargo: raw.auto_release_embargo !== undefined ? Boolean(raw.auto_release_embargo) : true,
    aiAssisted: Boolean(raw.ai_assisted ?? raw.aiAssisted),
    aiModifiedFields: Array.isArray(raw.ai_modified_fields)
      ? raw.ai_modified_fields
      : (Array.isArray(raw.aiModifiedFields) ? raw.aiModifiedFields : []),
    aiLastReviewedAt: raw.ai_last_reviewed_at ?? raw.aiLastReviewedAt ?? null,
    isPremium: Boolean(raw.is_premium ?? raw.isPremium),
    isSponsored: Boolean(raw.is_sponsored ?? raw.isSponsored),
    sponsoredLabel: raw.sponsored_label ?? raw.sponsoredLabel ?? (raw.is_sponsored ? 'স্পনসরড কনটেন্ট' : ''),
    sponsorDisclosure: raw.sponsor_disclosure ?? raw.sponsorDisclosure ?? '',
    advertiserId: raw.advertiser_id ?? raw.advertiserId ?? null,
    campaignId: raw.campaign_id ?? raw.campaignId ?? null,
    sponsoredContent: raw.sponsored_content ?? raw.sponsoredContent ?? null,
    publicCorrections: Array.isArray(raw.public_corrections)
      ? raw.public_corrections
      : (Array.isArray(raw.publicCorrections) ? raw.publicCorrections : []),
    geoLocationId: raw.geo_location_id ?? raw.geoLocationId ?? raw.geo_location?.id ?? null,
    divisionId: raw.division_id ?? raw.divisionId ?? raw.division?.id ?? null,
    districtId: raw.district_id ?? raw.districtId ?? raw.district?.id ?? null,
    upazilaId: raw.upazila_id ?? raw.upazilaId ?? raw.upazila?.id ?? null,
    unionId: raw.union_id ?? raw.unionId ?? raw.union?.id ?? null,
    wardId: raw.ward_id ?? raw.wardId ?? raw.ward?.id ?? null,
    isHyperlocal: Boolean(raw.is_hyperlocal ?? raw.isHyperlocal ?? raw.geo_location_id ?? raw.district_id),
    correspondentId: raw.correspondent_id ?? raw.correspondentId ?? raw.correspondent?.id ?? null,
    regionalApprovalStatus: raw.regional_approval_status ?? raw.regionalApprovalStatus ?? 'not_required',
    regionalReviewNote: raw.regional_review_note ?? raw.regionalReviewNote ?? '',
    geoLocation: raw.geo_location ?? raw.geoLocation ?? null,
    division: raw.division ?? null,
    district: raw.district ?? null,
    upazila: raw.upazila ?? null,
    union: raw.union ?? null,
    ward: raw.ward ?? null,
    correspondent: raw.correspondent ?? null
  };
};

export const normalizeCategory = (cat) => {
  if (!cat || typeof cat !== 'object') return cat;
  const children = Array.isArray(cat.children)
    ? cat.children
    : Array.isArray(cat.subcategories)
      ? cat.subcategories
      : [];
  return {
    ...cat,
    id: cat.id,
    name: cat.name,
    nameEn: cat.name_en || cat.nameEn || cat.name,
    slug: cat.slug,
    description: cat.description || '',
    parentId: cat.parent_id ?? cat.parentId ?? null,
    order: cat.order ?? 0,
    isActive: Boolean(cat.is_active ?? cat.isActive ?? true),
    newsCount: Number(cat.news_count ?? cat.newsCount ?? 0),
    subcategories: children.map(normalizeCategory)
  };
};

export const normalizeTag = (tag) => {
  if (!tag || typeof tag !== 'object') return tag;
  return {
    ...tag,
    id: tag.id,
    name: tag.name,
    nameEn: tag.name_en || tag.nameEn || tag.name,
    slug: tag.slug,
    description: tag.description || '',
    count: Number(tag.news_count ?? tag.count ?? 0),
    trending: Number(tag.count ?? 0) >= 20
  };
};

export const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  const roleList = Array.isArray(user.roles) ? user.roles : [];
  const primaryRoleSlug =
    typeof roleList[0] === 'object'
      ? roleList[0]?.slug
      : (typeof roleList[0] === 'string' ? roleList[0] : user.role) || 'reporter';

  const avatar = normalizeMediaUrl(user.avatar_url || user.avatar, FALLBACK_AVATAR);

  return {
    ...user,
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    designation: user.designation || '',
    department: user.designation || user.department || '',
    bio: user.bio || '',
    avatar,
    avatar_url: avatar,
    role: primaryRoleSlug,
    roleName: typeof roleList[0] === 'object' ? roleList[0]?.name : '',
    roles: roleList,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    status: user.status || 'active',
    lastLogin: user.last_login_at || user.lastLogin || null
  };
};

export const normalizeReporter = (rep) => {
  if (!rep || typeof rep !== 'object') return rep;
  const avatar = normalizeMediaUrl(rep.avatar_url || rep.avatar, FALLBACK_AVATAR);
  return {
    ...rep,
    id: rep.id,
    userId: rep.user_id ?? rep.userId ?? null,
    name: rep.name || '',
    nameEn: rep.name_en || rep.nameEn || rep.name || '',
    slug: rep.slug || String(rep.id || ''),
    email: rep.email || '',
    phone: rep.phone || '',
    designation: rep.designation || 'প্রতিবেদক',
    role: rep.designation || 'Staff Reporter',
    roleBn: rep.designation || 'প্রতিবেদক',
    beat: rep.beat || '',
    location: rep.location || 'ঢাকা',
    bio: rep.bio || '',
    avatar,
    avatar_url: avatar,
    articlesCount: Number(rep.articles_count ?? rep.articlesCount ?? 0),
    status: rep.status || 'active'
  };
};

export const normalizeAuthor = (author) => {
  if (!author || typeof author !== 'object') return author;
  const avatar = normalizeMediaUrl(author.avatar_url || author.avatar, FALLBACK_AVATAR);
  return {
    ...author,
    id: author.id,
    userId: author.user_id ?? author.userId ?? null,
    name: author.name || '',
    nameEn: author.name_en || author.nameEn || author.name || '',
    slug: author.slug || String(author.id || ''),
    email: author.email || '',
    phone: author.phone || '',
    designation: author.designation || 'কলামিস্ট',
    role: author.designation || 'Columnist',
    location: author.location || 'ঢাকা',
    bio: author.bio || '',
    avatar,
    avatar_url: avatar,
    socialLinks: author.social_links || author.socialLinks || {},
    isActive: Boolean(author.is_active ?? author.isActive ?? true),
    articlesCount: Number(author.articles_count ?? author.articlesCount ?? 0),
    status: (author.is_active ?? true) ? 'active' : 'inactive'
  };
};

export const normalizeMedia = (item) => {
  if (!item || typeof item !== 'object') return item;
  const url = normalizeMediaUrl(item.url || item.path);
  const sizeBytes = Number(item.size ?? 0);
  const sizeLabel =
    sizeBytes > 1048576
      ? `${(sizeBytes / 1048576).toFixed(1)} MB`
      : sizeBytes > 0
        ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
        : 'External';

  return {
    ...item,
    id: item.id,
    title: item.name || item.title || item.file_name || 'Media',
    name: item.name || item.title || item.file_name || 'Media',
    url,
    thumbnailUrl: url,
    type: item.media_type || item.type || 'image',
    media_type: item.media_type || item.type || 'image',
    visibility: item.visibility || 'public',
    folder: item.folder || 'general',
    checksumSha256: item.checksum_sha256 || null,
    durationSeconds: item.duration_seconds ?? null,
    altText: item.alt_text ?? item.altText ?? '',
    caption: item.caption || '',
    credit: item.credit || '',
    dimensions: item.width && item.height ? `${item.width}x${item.height}` : (item.dimensions || 'Auto'),
    size: sizeBytes,
    sizeFormatted: sizeLabel,
    format: (item.mime_type || '').split('/')[1]?.toUpperCase() || (item.media_type === 'audio' ? 'AUDIO' : 'IMAGE'),
    uploadedBy: item.uploader?.name || 'Admin',
    createdAt: item.created_at || item.createdAt
  };
};

export const normalizeAdvertisement = (ad) => {
  if (!ad || typeof ad !== 'object') return ad;
  const image = normalizeMediaUrl(ad.image_url || ad.image);
  const impressions = Number(ad.impressions_count ?? ad.impressions ?? 0);
  const clicks = Number(ad.clicks_count ?? ad.clicks ?? 0);
  const ctr = ad.ctr !== undefined ? Number(ad.ctr) : (impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0);

  return {
    ...ad,
    id: ad.id,
    title: ad.title || '',
    advertiser: ad.advertiser_name || ad.advertiser || '',
    advertiser_name: ad.advertiser_name || ad.advertiser || '',
    placement: ad.placement || 'homepage_top',
    image,
    image_url: image,
    destinationUrl: ad.destination_url || ad.destinationUrl || '#',
    destination_url: ad.destination_url || ad.destinationUrl || '#',
    startDate: ad.start_date || ad.startDate || '',
    endDate: ad.end_date || ad.endDate || '',
    status: ad.status || 'active',
    campaignId: ad.campaign_id ?? ad.campaignId ?? null,
    advertiserId: ad.advertiser_id ?? ad.advertiserId ?? null,
    placementId: ad.placement_id ?? ad.placementId ?? null,
    cpmRate: Number(ad.cpm_rate ?? ad.cpmRate ?? 0),
    cpcRate: Number(ad.cpc_rate ?? ad.cpcRate ?? 0),
    dailyCapImpressions: ad.daily_cap_impressions ?? ad.dailyCapImpressions ?? null,
    scheduleTimezone: ad.schedule_timezone ?? ad.scheduleTimezone ?? 'Asia/Dhaka',
    campaign: ad.campaign || null,
    advertiserProfile: ad.advertiser && typeof ad.advertiser === 'object' ? ad.advertiser : null,
    budget: Number(ad.budget ?? 0),
    revenue: `৳ ${Number(ad.budget ?? 0).toLocaleString('en-US')}`,
    impressions,
    clicks,
    ctr
  };
};

export const normalizeAuditLog = (log) => {
  if (!log || typeof log !== 'object') return log;
  const userObj = typeof log.user === 'object' ? log.user : null;
  return {
    ...log,
    id: log.id,
    timestamp: log.created_at || log.timestamp || new Date().toISOString(),
    user: userObj?.name || (typeof log.user === 'string' ? log.user : 'System'),
    role: userObj?.designation || '',
    action: log.action || '',
    target: log.auditable_type
      ? `${log.auditable_type}${log.auditable_id ? ` #${log.auditable_id}` : ''}`
      : (log.target || '—'),
    ip: log.ip_address || log.ip || '127.0.0.1'
  };
};

const unwrapSettingValue = (val) => {
  if (val && typeof val === 'object' && !Array.isArray(val) && 'value' in val && Object.keys(val).length === 1) {
    return val.value;
  }
  return val;
};

/**
 * Normalize Laravel public settings dictionary (`settings/public`) or grouped settings (`settings`).
 */
export const normalizePublicSettings = (raw = {}) => {
  const flat = {};
  if (raw && typeof raw === 'object') {
    for (const [key, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        // Grouped collection response `{ general: [{ key, value }], ... }`
        for (const row of val) {
          if (row?.key) {
            flat[row.key] = unwrapSettingValue(row.value);
          }
        }
      } else {
        flat[key] = unwrapSettingValue(val);
      }
    }
  }

  const contact = typeof flat.contact_info === 'object' && flat.contact_info ? flat.contact_info : {};
  const social = typeof flat.social_links === 'object' && flat.social_links ? flat.social_links : {};
  const seo = typeof flat.seo_meta === 'object' && flat.seo_meta ? flat.seo_meta : {};
  const footer = typeof flat.footer_settings === 'object' && flat.footer_settings ? flat.footer_settings : {};

  return {
    ...flat,
    websiteNameBn: flat.site_name || 'দৈনিক বার্তা প্রবাহ',
    portalNameBn: flat.site_name || 'দৈনিক বার্তা প্রবাহ',
    websiteNameEn: flat.site_name_en || 'Daily Prabaho',
    portalNameEn: flat.site_name_en || 'Daily Prabaho',
    tagline: flat.site_tagline || 'সত্যের সন্ধানে নির্ভীক কণ্ঠস্বর',
    logoUrl: flat.logo_url || '/logo.svg',
    faviconUrl: flat.favicon_url || '/favicon.ico',
    editorName: flat.editor_name || 'মোঃ লুৎফর রহমান',
    publisherName: flat.publisher_name || 'দৈনিক বার্তা প্রবাহ',
    email: contact.email || flat.contact_email || 'lutforrahmanseu@gmail.com',
    contactEmail: contact.email || flat.contact_email || 'lutforrahmanseu@gmail.com',
    phone: contact.phone || flat.contact_phone || '+৮৮০ ২ ৯৮৭৬৫৪৩',
    hotline: contact.hotline || flat.hotline || '+৮৮০১৭০০০০০০০০',
    contactAddress: contact.address || flat.address || 'নিকুঞ্জ-২, খিলক্ষেত, ঢাকা, বাংলাদেশ।',
    publisherAddress: contact.address || flat.address || 'নিকুঞ্জ-২, খিলক্ষেত, ঢাকা, বাংলাদেশ।',
    contactAddressEn: contact.address_en || flat.address_en || 'Nikunja-2, Khilkhet, Dhaka, Bangladesh',
    publisherAddressEn: contact.address_en || flat.address_en || 'Nikunja-2, Khilkhet, Dhaka, Bangladesh',
    footerSettings: {
      copyrightBn: footer.copyrightBn || '© ২০২৬ দৈনিক বার্তা প্রবাহ। সর্বস্বত্ব সংরক্ষিত।',
      pressRegNo: footer.pressRegNo || 'তথ্য মন্ত্রণালয় নিবন্ধন নং: ডিএইচ-১২৮৯/২০২৬',
      editorialNotice: footer.editorialNotice || 'অনলাইন সংস্করণে প্রকাশিত কোনো সংবাদ, ছবি, অডিও ও ভিডিও বিনা অনুমতিতে ব্যবহার দণ্ডনীয় অপরাধ।',
      showEpaperLink: footer.showEpaperLink ?? true
    },
    socialLinks: {
      facebook: social.facebook || flat.facebook_url || 'https://facebook.com/dailyprabaho',
      twitter: social.twitter || flat.twitter_url || 'https://twitter.com/dailyprabaho',
      youtube: social.youtube || flat.youtube_url || 'https://youtube.com/@dailyprabaho',
      instagram: social.instagram || 'https://instagram.com/dailyprabaho'
    },
    metaTitle: seo.meta_title || '',
    metaDescription: seo.meta_description || '',
    defaultLanguage: flat.default_language || 'bn'
  };
};

/**
 * Extract human-readable error message from RTK Query / Laravel validation errors.
 */
export const extractApiError = (error, fallback = 'অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const data = error?.data || error;
  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstVal = data.errors[firstKey];
    if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
    if (typeof firstVal === 'string' && firstVal) return firstVal;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error;
  }

  return fallback;
};

const WORKFLOW_PATHS = {
  submitted: {
    draft: ['submitted'],
    returned: ['submitted']
  },
  under_review: {
    draft: ['submitted', 'under_review'],
    submitted: ['under_review'],
    returned: ['submitted', 'under_review'],
    approved: ['under_review']
  },
  approved: {
    draft: ['submitted', 'under_review', 'approved'],
    submitted: ['under_review', 'approved'],
    under_review: ['approved'],
    returned: ['submitted', 'under_review', 'approved'],
    scheduled: ['approved']
  },
  scheduled: {
    draft: ['submitted', 'under_review', 'approved', 'scheduled'],
    submitted: ['under_review', 'approved', 'scheduled'],
    under_review: ['approved', 'scheduled'],
    returned: ['submitted', 'under_review', 'approved', 'scheduled'],
    approved: ['scheduled']
  },
  published: {
    draft: ['submitted', 'under_review', 'approved', 'published'],
    submitted: ['under_review', 'approved', 'published'],
    under_review: ['approved', 'published'],
    returned: ['submitted', 'under_review', 'approved', 'published'],
    approved: ['published'],
    scheduled: ['published']
  }
};

/**
 * Execute workflow transitions respecting Laravel's state machine.
 */
export const transitionArticleWorkflow = async ({
  transitionMutation,
  articleId,
  fromStatus,
  toStatus,
  comments,
  scheduled_at,
  isSuperAdmin = false
}) => {
  if (!articleId || !toStatus || fromStatus === toStatus) return null;

  const steps = isSuperAdmin
    ? [toStatus]
    : WORKFLOW_PATHS[toStatus]?.[fromStatus] || [toStatus];

  let latestResult = null;
  for (let i = 0; i < steps.length; i += 1) {
    const stepStatus = steps[i];
    const isFinalStep = i === steps.length - 1;
    const payload = { id: articleId, status: stepStatus };
    if (isFinalStep) {
      if (comments) payload.comments = comments;
      if (scheduled_at) payload.scheduled_at = scheduled_at;
    }
    latestResult = await transitionMutation(payload).unwrap();
  }
  return latestResult;
};


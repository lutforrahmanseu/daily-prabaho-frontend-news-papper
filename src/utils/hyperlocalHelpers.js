export const GEO_LEVEL_META = {
  division: { labelBn: 'বিভাগ', labelEn: 'Division', childLevel: 'district', order: 1 },
  district: { labelBn: 'জেলা', labelEn: 'District', childLevel: 'upazila', order: 2 },
  upazila: { labelBn: 'উপজেলা / থানা', labelEn: 'Upazila / Thana', childLevel: 'union', order: 3 },
  union: { labelBn: 'ইউনিয়ন / পৌরসভা', labelEn: 'Union / Pourashava', childLevel: 'ward', order: 4 },
  ward: { labelBn: 'ওয়ার্ড', labelEn: 'Ward', childLevel: null, order: 5 }
};

export const CORRESPONDENT_VERIFICATION_BADGES = {
  verified: { labelBn: 'যাচাইকৃত প্রতিনিধি', labelEn: 'Verified', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pending: { labelBn: 'যাচাই অপেক্ষমাণ', labelEn: 'Pending Verification', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  suspended: { labelBn: 'সাময়িক স্থগিত', labelEn: 'Suspended', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  revoked: { labelBn: 'বাতিল', labelEn: 'Revoked', className: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export const REGIONAL_APPROVAL_BADGES = {
  not_required: { labelBn: 'সাধারণ', labelEn: 'Standard', className: 'bg-stone-100 text-stone-700' },
  pending_regional_review: { labelBn: 'আঞ্চলিক অনুমোদন বাকি', labelEn: 'Pending Regional Review', className: 'bg-amber-100 text-amber-800' },
  approved: { labelBn: 'আঞ্চলিকভাবে অনুমোদিত', labelEn: 'Regional Approved', className: 'bg-emerald-100 text-emerald-800' },
  changes_requested: { labelBn: 'সংশোধন প্রয়োজন', labelEn: 'Changes Requested', className: 'bg-orange-100 text-orange-800' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', labelEn: 'Rejected', className: 'bg-rose-100 text-rose-800' }
};

export const GAP_SEVERITY_STYLES = {
  critical: { labelBn: 'অতি জরুরি (প্রতিনিধি ও সংবাদ শূন্য)', labelEn: 'Critical Gap', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  high: { labelBn: 'উচ্চ ঘাটতি (সাম্প্রতিক সংবাদ শূন্য)', labelEn: 'High Gap', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  moderate: { labelBn: 'মাঝারি (প্রতিনিধি নির্ধারিত নয়)', labelEn: 'Moderate Gap', className: 'bg-sky-100 text-sky-800 border-sky-200' }
};

export const LOCAL_ALERT_FREQUENCIES = [
  { value: 'instant', labelBn: 'তাৎক্ষণিক (নতুন স্থানীয় সংবাদ প্রকাশেই)', labelEn: 'Instant' },
  { value: 'daily', labelBn: 'দৈনিক স্থানীয় ডাইজেস্ট', labelEn: 'Daily Digest' },
  { value: 'weekly', labelBn: 'সাপ্তাহিক সারসংক্ষেপ', labelEn: 'Weekly Digest' },
  { value: 'none', labelBn: 'বন্ধ রাখুন', labelEn: 'Disabled' }
];

/**
 * Resolve clickable primary geo badge (Upazila > District > Division) for an article.
 */
export const getArticlePrimaryGeo = (article = {}, isBn = true) => {
  if (!article) return null;
  const upazila = article.upazila || null;
  const district = article.district || null;
  const division = article.division || null;
  const union = article.union || null;
  const ward = article.ward || null;

  const target = upazila || district || division;
  if (!target) return null;

  let path = '/local';
  if (upazila?.slug) {
    path = `/local/upazila/${upazila.slug}`;
  } else if (district?.slug) {
    path = `/local/district/${district.slug}`;
  } else if (division?.slug) {
    path = `/local/${division.slug}`;
  }

  const parts = [
    isBn ? ward?.name_bn : ward?.name_en,
    isBn ? union?.name_bn : union?.name_en,
    isBn ? upazila?.name_bn : upazila?.name_en,
    isBn ? district?.name_bn : district?.name_en,
    !district ? (isBn ? division?.name_bn : division?.name_en) : null
  ].filter(Boolean);

  return {
    label: parts.join(', ') || (isBn ? target.name_bn : target.name_en),
    shortLabel: isBn
      ? (upazila?.name_bn || district?.name_bn || division?.name_bn || '')
      : (upazila?.name_en || district?.name_en || division?.name_en || ''),
    path,
    districtPath: district?.slug ? `/local/district/${district.slug}` : '/local',
    upazilaPath: upazila?.slug ? `/local/upazila/${upazila.slug}` : null,
    divisionPath: division?.slug ? `/local/${division.slug}` : '/local',
    geoCode: article.geoLocation?.geo_code || target.geo_code || ''
  };
};

/**
 * Filter active geo records by parent ID cleanly.
 */
export const filterGeoChildren = (locations = [], parentId) => {
  if (!parentId || !Array.isArray(locations)) return [];
  const pid = Number(parentId);
  return locations.filter((loc) => Number(loc.parent_id) === pid && loc.is_active !== false);
};

/**
 * Build privacy-safe manual reader preference payload (never transmits raw GPS/IP coordinates).
 */
export const buildPrivacySafeLocalPreferencePayload = (selection = {}) => {
  const {
    divisionId = null,
    districtId = null,
    upazilaId = null,
    unionId = null,
    wardId = null,
    localNotificationsEnabled = false,
    localNotificationFrequency = 'daily',
    clearLocation = false
  } = selection || {};

  return {
    preferred_division_id: divisionId ? Number(divisionId) : null,
    preferred_district_id: districtId ? Number(districtId) : null,
    preferred_upazila_id: upazilaId ? Number(upazilaId) : null,
    preferred_union_id: unionId ? Number(unionId) : null,
    preferred_ward_id: wardId ? Number(wardId) : null,
    local_notifications_enabled: Boolean(localNotificationsEnabled),
    local_notification_frequency: localNotificationsEnabled ? (localNotificationFrequency || 'daily') : 'none',
    clear_location: Boolean(clearLocation)
  };
};

/**
 * Build clean geo payload for Article Editor CMS submission.
 */
export const buildArticleGeoPayload = ({
  divisionId = '',
  districtId = '',
  upazilaId = '',
  unionId = '',
  wardId = '',
  isHyperlocal = false
} = {}) => {
  const deepestId = wardId || unionId || upazilaId || districtId || divisionId || '';
  return {
    geo_location_id: deepestId ? Number(deepestId) : null,
    division_id: divisionId ? Number(divisionId) : null,
    district_id: districtId ? Number(districtId) : null,
    upazila_id: upazilaId ? Number(upazilaId) : null,
    union_id: unionId ? Number(unionId) : null,
    ward_id: wardId ? Number(wardId) : null,
    is_hyperlocal: Boolean(isHyperlocal || deepestId)
  };
};


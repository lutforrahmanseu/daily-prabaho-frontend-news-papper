/**
 * Form Validation Suite for Daily Prabaho CMS
 * Enforces production-grade data validation across all modules
 */

export function validateNewsForm(data) {
  const errors = {};

  // Title
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = 'সংবাদের শিরোনাম আবশ্যক (Headline is required)';
  } else if (data.title.trim().length < 5) {
    errors.title = 'শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে (Headline must be at least 5 characters)';
  } else if (data.title.trim().length > 300) {
    errors.title = 'শিরোনাম ৩০০ অক্ষরের বেশি হতে পারবে না (Headline cannot exceed 300 characters)';
  }

  // Slug
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
    errors.slug = 'ইউআরএল স্লাগ আবশ্যক (Slug is required)';
  } else if (!slugRegex.test(data.slug)) {
    errors.slug = 'স্লাগে কেবল ইংরেজি ছোট অক্ষর, সংখ্যা এবং হাইফেন ব্যবহার করা যাবে (Slug must be kebab-case)';
  }

  // Category
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.category = 'সংবাদের বিভাগ নির্বাচন আবশ্যক (Category is required)';
  }

  // Content or excerpt
  if (!data.content && !data.excerpt) {
    errors.content = 'সংবাদের বিস্তারিত বিবরণ অথবা সারাংশ আবশ্যক (Content or excerpt is required)';
  }

  // Image URL if provided
  if (data.image) {
    try {
      new URL(data.image);
    } catch {
      if (!data.image.startsWith('/')) {
        errors.image = 'সঠিক ছবির ইউআরএল প্রদান করুন (Invalid image URL)';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateCategoryForm(data, existingCategories = []) {
  const errors = {};

  if (!data.nameBn || data.nameBn.trim().length === 0) {
    errors.nameBn = 'বাংলা বিভাগের নাম আবশ্যক (Bengali category name is required)';
  }

  if (!data.nameEn || data.nameEn.trim().length === 0) {
    errors.nameEn = 'ইংরেজি বিভাগের নাম আবশ্যক (English category name is required)';
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!data.slug || !slugRegex.test(data.slug)) {
    errors.slug = 'স্লাগ ইংরেজি ছোট হাতের অক্ষরে হাইফেনযুক্ত হতে হবে (Slug must be valid kebab-case)';
  } else if (existingCategories.some(c => c.slug === data.slug && c.id !== data.id)) {
    errors.slug = 'এই স্লাগটি ইতোমধ্যে বিদ্যমান (Category slug must be unique)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateUserForm(data) {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'ব্যবহারকারীর পূর্ণ নাম আবশ্যক (Full name must be at least 2 characters)';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'সঠিক ইমেইল ঠিকানা প্রদান করুন (Valid email is required)';
  }

  if (!data.role) {
    errors.role = 'ব্যবহারকারীর ভূমিকা (Role) নির্বাচন আবশ্যক (Role is required)';
  }

  // Password validation if creating a new user or explicitly changing password
  if (data.isNew || data.password) {
    if (!data.password || data.password.length < 8) {
      errors.password = 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে (Password must be at least 8 characters)';
    } else if (!/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
      errors.password = 'পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর ও একটি সংখ্যা থাকতে হবে (Must contain uppercase and digit)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateAdCampaignForm(data) {
  const errors = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'বিজ্ঞাপন ক্যাম্পেইনের নাম আবশ্যক (Campaign title is required)';
  }

  if (!data.advertiser || data.advertiser.trim().length === 0) {
    errors.advertiser = 'বিজ্ঞাপনদাতার নাম আবশ্যক (Advertiser name is required)';
  }

  const validPlacements = ['leaderboard', 'sidebar_top', 'sidebar_bottom', 'in_article', 'popup_interstitial'];
  if (!data.placement || !validPlacements.includes(data.placement)) {
    errors.placement = 'বৈধ বিজ্ঞাপনের স্থান নির্বাচন করুন (Valid placement is required)';
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    if (end < start) {
      errors.endDate = 'বিজ্ঞাপন সমাপ্তির তারিখ শুরুর তারিখের পরে হতে হবে (End date must be after start date)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}


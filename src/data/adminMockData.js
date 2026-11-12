/**
 * Realistic Mock Data for Editorial Admin CMS & Newsroom Control Panel
 * Daily Prabaho (দৈনিক বার্তা প্রবাহ)
 */

export const ADMIN_STATS = {
  totalArticles: 148,
  publishedToday: 14,
  pendingApprovals: 6,
  totalViews: 384520,
  viewsGrowth: '+18.4%',
  activeJournalists: 18,
  todayVisitors: 42910,
  avgReadTime: '৩ মি. ৪৫ সে.',
  bounceRate: '৩২.১%'
};

export const PERFORMANCE_CHART_DATA = [
  { day: 'শনিবার', date: '০৪ নভে', views: 32400, readers: 19200, shares: 1420 },
  { day: 'রবিবার', date: '০৫ নভে', views: 41800, readers: 24500, shares: 1980 },
  { day: 'সোমবার', date: '০৬ নভে', views: 38900, readers: 22100, shares: 1650 },
  { day: 'মঙ্গলবার', date: '০৭ নভে', views: 49200, readers: 29800, shares: 2410 },
  { day: 'বুধবার', date: '০৮ নভে', views: 45600, readers: 26700, shares: 2100 },
  { day: 'বৃহস্পতিবার', date: '০৯ নভে', views: 56800, readers: 33400, shares: 2890 },
  { day: 'শুক্রবার', date: '১০ নভে', views: 64200, readers: 38900, shares: 3450 }
];

export const CATEGORY_DISTRIBUTION = [
  { name: 'বাংলাদেশ', nameEn: 'Bangladesh', percentage: 32, count: 48, color: '#b91c1c' },
  { name: 'রাজনীতি', nameEn: 'Politics', percentage: 22, count: 33, color: '#dc2626' },
  { name: 'অর্থনীতি', nameEn: 'Economy', percentage: 18, count: 27, color: '#059669' },
  { name: 'খেলাধুলা', nameEn: 'Sports', percentage: 14, count: 21, color: '#2563eb' },
  { name: 'প্রযুক্তি', nameEn: 'Tech', percentage: 8, count: 12, color: '#7c3aed' },
  { name: 'আন্তর্জাতিক', nameEn: 'International', percentage: 6, count: 9, color: '#ea580c' }
];

export const PENDING_APPROVALS_DATA = [
  {
    id: 'pend-01',
    title: 'নির্বাচন কমিশনের নতুন আচরণবিধি চূড়ান্ত: নির্বাচনী প্রচারণায় আধুনিক প্রযুক্তির ব্যবহার',
    titleEn: 'Election Commission finalizes new code of conduct',
    category: 'politics',
    categoryName: 'রাজনীতি',
    author: 'ফারহানা ইসলাম তন্বী',
    authorRole: 'জ্যেষ্ঠ প্রতিবেদক',
    submittedAt: '২০২৬-১১-১০T০৯:১৫:০০Z',
    wordsCount: 680,
    status: 'in_review',
    excerpt: 'জাতীয় সংসদ নির্বাচনকে সামনে রেখে রাজনৈতিক দলগুলোর প্রচারণায় কৃত্রিম বুদ্ধিমত্তা ও সামাজিক মাধ্যমের ব্যবহার নিয়ন্ত্রণে নতুন নীতিমালা প্রণয়ন করেছে কমিশন।'
  },
  {
    id: 'pend-02',
    title: 'চট্টগ্রাম বন্দর টার্মিনালে স্বয়ংক্রিয় স্ক্যানিং ব্যবস্থার উদ্বোধন',
    titleEn: 'Automated scanning system inaugurated at Chittagong Port',
    category: 'economy',
    categoryName: 'অর্থনীতি',
    author: 'মোঃ লুৎফর রহমান',
    authorRole: 'প্রধান সম্পাদক',
    submittedAt: '২০২৬-১১-১০T০৮:৪০:০০Z',
    wordsCount: 540,
    status: 'in_review',
    excerpt: 'পণ্য খালাসের সময়সীমা ৫০ শতাংশ কমিয়ে আনতে চবকের প্রধান কনটেইনার টার্মিনালে বসানো হলো অত্যাধুনিক এআই-নির্ভর স্ক্যানার।'
  },
  {
    id: 'pend-03',
    title: 'বিপিএল ফাইনালের টিকিট বিক্রি শুরু: দর্শকদের দীর্ঘ সারি',
    titleEn: 'BPL final ticket sale begins with long queues',
    category: 'sports',
    categoryName: 'খেলাধুলা',
    author: 'আহমেদ জাবের',
    authorRole: 'ক্রীড়া প্রতিবেদক',
    submittedAt: '২০২৬-১১-১০T০৮:১০:০০Z',
    wordsCount: 420,
    status: 'in_review',
    excerpt: 'মিরপুর শেরেবাংলা স্টেডিয়ামে অনুষ্ঠিতব্য ফাইনাল ম্যাচ ঘিরে সমর্থকদের মাঝে বিপুল উন্মাদনা দেখা গেছে।'
  },
  {
    id: 'pend-04',
    title: 'কক্সবাজার সমুদ্রসৈকতে পরিবেশবান্ধব বৈদ্যুতিক বাস সেবা চালু',
    titleEn: 'Eco-friendly electric bus service launched in Coxs Bazar',
    category: 'bangladesh',
    categoryName: 'বাংলাদেশ',
    author: 'নাসরিন সুলতানা',
    authorRole: 'প্রযুক্তি ও জীবনযাপন প্রতিবেদক',
    submittedAt: '২০২৬-১১-১০T০৭:৩০:০০Z',
    wordsCount: 510,
    status: 'in_review',
    excerpt: 'পর্যটকদের যাতায়াত সহজ ও পরিবেশ দূষণ রোধে কলাতলী থেকে ইনানী পর্যন্ত বিশেষ পরিবেশবান্ধব শাটল সেবা শুরু হয়েছে।'
  }
];

export const RECENT_ACTIVITIES = [
  {
    id: 'act-01',
    user: 'মোঃ লুৎফর রহমান',
    userRole: 'প্রধান সম্পাদক',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    action: 'একটি নতুন শীর্ষ সংবাদ অনুমোদন করেছেন',
    target: 'ঢাকা মেট্রোরেল সম্প্রসারণে নতুন গতি',
    time: '৫ মিনিট আগে',
    type: 'approve'
  },
  {
    id: 'act-02',
    user: 'ফারহানা ইসলাম তন্বী',
    userRole: 'জ্যেষ্ঠ প্রতিবেদক',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    action: 'অর্থনীতি বিষয়ক খসড়া প্রতিবেদন জমা দিয়েছেন',
    target: 'মুদ্রাস্ফীতি নিয়ন্ত্রণে কেন্দ্রীয় ব্যাংকের নতুন মুদ্রানীতি',
    time: '২৫ মিনিট আগে',
    type: 'submit'
  },
  {
    id: 'act-03',
    user: 'সিস্টেম অ্যাডমিন',
    userRole: 'সিস্টেম ইঞ্জিনিয়ার',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    action: 'টপ-ব্যানার বিজ্ঞাপন ক্যাম্পেইন সক্রিয় করেছেন',
    target: 'গ্রামীণফোন ৫জি ডিজিটাল লাইফ ক্যাম্পেইন',
    time: '১ ঘণ্টা আগে',
    type: 'ad'
  },
  {
    id: 'act-04',
    user: 'আহমেদ জাবের',
    userRole: 'ক্রীড়া প্রতিবেদক',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    action: 'সংবাদের প্রধান ছবি ও ক্যাপশন হালনাগাদ করেছেন',
    target: 'মিরপুরে রুদ্ধশ্বাস লড়াইয়ে টাইগারদের রোমাঞ্চকর জয়',
    time: '২ ঘণ্টা আগে',
    type: 'edit'
  },
  {
    id: 'act-05',
    user: 'নাসরিন সুলতানা',
    userRole: 'প্রযুক্তি সম্পাদক',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    action: 'নতুন ট্যাগ যুক্ত করেছেন',
    target: '#স্মার্টবাংলাদেশ২০২৬',
    time: '৩ ঘণ্টা আগে',
    type: 'tag'
  }
];

export const TAGS_DATA = [
  { id: 'tag-1', name: 'মেট্রোরেল', nameEn: 'Metro Rail', slug: 'metro-rail', count: 38, trending: true },
  { id: 'tag-2', name: 'অর্থনীতি', nameEn: 'Economy', slug: 'economy', count: 54, trending: true },
  { id: 'tag-3', name: 'ক্রিকেট', nameEn: 'Cricket', slug: 'cricket', count: 42, trending: true },
  { id: 'tag-4', name: 'নির্বাচন কমিশন', nameEn: 'Election Commission', slug: 'election-commission', count: 29, trending: false },
  { id: 'tag-5', name: 'স্মার্ট বাংলাদেশ', nameEn: 'Smart Bangladesh', slug: 'smart-bangladesh', count: 31, trending: true },
  { id: 'tag-6', name: 'বাংলাদেশ ব্যাংক', nameEn: 'Bangladesh Bank', slug: 'bangladesh-bank', count: 26, trending: false },
  { id: 'tag-7', name: 'পদ্মা সেতু', nameEn: 'Padma Bridge', slug: 'padma-bridge', count: 22, trending: false },
  { id: 'tag-8', name: 'কৃত্রিম বুদ্ধিমত্তা', nameEn: 'Artificial Intelligence', slug: 'ai', count: 19, trending: true },
  { id: 'tag-9', name: 'বিপিএল ২০২৬', nameEn: 'BPL 2026', slug: 'bpl-2026', count: 35, trending: true },
  { id: 'tag-10', name: 'জলবায়ু পরিবর্তন', nameEn: 'Climate Change', slug: 'climate-change', count: 18, trending: false },
  { id: 'tag-11', name: 'ঢাকা মেট্রো', nameEn: 'Dhaka Metro', slug: 'dhaka-metro', count: 27, trending: false },
  { id: 'tag-12', name: 'পুঁজিবাজার', nameEn: 'Share Market', slug: 'share-market', count: 24, trending: false }
];

export const AUTHORS_DATA = [
  {
    id: 'auth-01',
    name: 'ড. মুহাম্মদ জাফর ইকবাল',
    nameEn: 'Dr. Muhammed Zafar Iqbal',
    slug: 'zafar-iqbal',
    role: 'বিশিষ্ট কলামিস্ট ও শিক্ষাবিদ',
    email: 'zafar.iqbal@opinion.dailyprabaho.com',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    bio: 'প্রখ্যাত শিক্ষাবিদ, কথাসাহিত্যিক ও বিজ্ঞান লেখক। আধুনিক তরুণ প্রজন্ম, শিক্ষা সংস্কার ও বিজ্ঞানমনস্কতা নিয়ে তাঁর সাপ্তাহিক কলাম "মুক্তচিন্তা" প্রকাশিত হয়।',
    articlesCount: 64,
    status: 'active',
    location: 'সিলেট'
  },
  {
    id: 'auth-02',
    name: 'অধ্যাপক রেহমান সোবহান',
    nameEn: 'Prof. Rehman Sobhan',
    slug: 'rehman-sobhan',
    role: 'অর্থনীতিবিদ ও গবেষক',
    email: 'rehman.sobhan@cpd.org.bd',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'আন্তর্জাতিক খ্যাতিসম্পন্ন অর্থনীতিবিদ ও সিপিডির চেয়ারম্যান। সামষ্টিক অর্থনৈতিক নীতি, বৈষম্য নিরসন এবং সুশাসন নিয়ে গবেষণাধর্মী বিশ্লেষণ উপস্থাপন করেন।',
    articlesCount: 42,
    status: 'active',
    location: 'ঢাকা'
  },
  {
    id: 'auth-03',
    name: 'সৈয়দা রিজওয়ানা হাসান',
    nameEn: 'Syeda Rizwana Hasan',
    slug: 'rizwana-hasan',
    role: 'পরিবেশ আইনজীবী ও মানবাধিকারকর্মী',
    email: 'rizwana.env@bela.org.bd',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
    bio: 'ম্যাগসাইসাই পুরস্কারপ্রাপ্ত পরিবেশবিদ ও আইনজীবী। নদী রক্ষা, বনভূমি সংরক্ষণ ও জলবায়ু সুবিচার নিয়ে নিয়মিত কলাম লিখে থাকেন।',
    articlesCount: 38,
    status: 'active',
    location: 'ঢাকা'
  },
  {
    id: 'auth-04',
    name: 'মতিউর রহমান',
    nameEn: 'Matiur Rahman',
    slug: 'matiur-rahman',
    role: 'বরিষ্ঠ সাংবাদিক ও রাজনৈতিক বিশ্লেষক',
    email: 'matiur.analysis@dailyprabaho.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'বাংলাদেশের রাজনৈতিক ইতিহাস ও গণতান্ত্রিক উত্তরণ নিয়ে দীর্ঘ চার দশকেরও বেশি সময় ধরে সাংবাদিকতা ও কলাম লিখে চলেছেন।',
    articlesCount: 58,
    status: 'active',
    location: 'ঢাকা'
  }
];

export const USERS_DATA = [
  {
    id: 'usr-01',
    name: 'মোঃ লুৎফর রহমান',
    email: 'editor@dailyprabaho.com',
    role: 'super_admin',
    roleName: 'সুপার অ্যাডমিন',
    department: 'সম্পাদকীয় প্রশাসন',
    status: 'active',
    lastLogin: '১০ মিনিট আগে',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-02',
    name: 'ফারহানা ইসলাম তন্বী',
    email: 'farhana.t@dailyprabaho.com',
    role: 'editor',
    roleName: 'বার্তা সম্পাদক',
    department: 'অর্থনীতি ডেস্ক',
    status: 'active',
    lastLogin: '৪৫ মিনিট আগে',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-03',
    name: 'আহমেদ জাবের',
    email: 'jaber.sports@dailyprabaho.com',
    role: 'reporter',
    roleName: 'জ্যেষ্ঠ প্রতিবেদক',
    department: 'ক্রীড়া বিভাগ',
    status: 'active',
    lastLogin: '২ ঘণ্টা আগে',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-04',
    name: 'নাসরিন সুলতানা',
    email: 'nasreen.s@dailyprabaho.com',
    role: 'editor',
    roleName: 'সহকারী সম্পাদক',
    department: 'ফিচার ও তথ্যপ্রযুক্তি',
    status: 'active',
    lastLogin: '৫ ঘণ্টা আগে',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-05',
    name: 'তানভীর হাসান',
    email: 'tanvir.mod@dailyprabaho.com',
    role: 'moderator',
    roleName: 'মন্তব্য মডারেটর',
    department: 'ডিজিটাল অডিয়েন্স',
    status: 'active',
    lastLogin: 'গতকাল',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-06',
    name: 'সাজেদুল করিম',
    email: 'sajedul.seo@dailyprabaho.com',
    role: 'reporter',
    roleName: 'অনলাইন রিপোর্টার',
    department: 'ব্রেকিং ডেস্ক',
    status: 'inactive',
    lastLogin: '৩ দিন আগে',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  }
];

export const ROLES_PERMISSIONS_MATRIX = [
  {
    id: 'super_admin',
    name: 'সুপার অ্যাডমিন (Super Admin)',
    description: 'সম্পূর্ণ সিস্টেমের সর্বোচ্চ নিয়ন্ত্রণ, ব্যাকআপ ও অ্যাডমিন ব্যবস্থাপনা',
    usersCount: 2,
    permissions: {
      create_news: true,
      edit_any_news: true,
      publish_news: true,
      delete_news: true,
      manage_categories: true,
      manage_tags: true,
      manage_users: true,
      manage_roles: true,
      manage_ads: true,
      view_analytics: true,
      manage_settings: true,
      view_audit: true
    }
  },
  {
    id: 'editor_in_chief',
    name: 'প্রধান সম্পাদক (Editor-in-Chief)',
    description: 'সম্পাদকীয় কাজের চূড়ান্ত সিদ্ধান্ত, প্রকাশনা ও সংবাদকর্মী পরিচালনা',
    usersCount: 3,
    permissions: {
      create_news: true,
      edit_any_news: true,
      publish_news: true,
      delete_news: true,
      manage_categories: true,
      manage_tags: true,
      manage_users: false,
      manage_roles: false,
      manage_ads: true,
      view_analytics: true,
      manage_settings: false,
      view_audit: true
    }
  },
  {
    id: 'editor',
    name: 'বার্তা সম্পাদক (News Editor)',
    description: 'খসড়া পরীক্ষা, কপি এডিটিং ও অনুমোদন প্রক্রিয়ার পর্যালোচনা',
    usersCount: 5,
    permissions: {
      create_news: true,
      edit_any_news: true,
      publish_news: true,
      delete_news: false,
      manage_categories: false,
      manage_tags: true,
      manage_users: false,
      manage_roles: false,
      manage_ads: false,
      view_analytics: true,
      manage_settings: false,
      view_audit: false
    }
  },
  {
    id: 'reporter',
    name: 'প্রতিবেদক (Reporter / Journalist)',
    description: 'সংবাদ ও ফিচার ড্রাফট তৈরি এবং পর্যালোচনার জন্য জমা দেওয়া',
    usersCount: 12,
    permissions: {
      create_news: true,
      edit_any_news: false,
      publish_news: false,
      delete_news: false,
      manage_categories: false,
      manage_tags: false,
      manage_users: false,
      manage_roles: false,
      manage_ads: false,
      view_analytics: false,
      manage_settings: false,
      view_audit: false
    }
  },
  {
    id: 'moderator',
    name: 'কমিউনিটি মডারেটর (Moderator)',
    description: 'পাঠক মন্তব্য নিরীক্ষণ, ফ্ল্যাগযুক্ত কন্টেন্ট অপসারণ',
    usersCount: 4,
    permissions: {
      create_news: false,
      edit_any_news: false,
      publish_news: false,
      delete_news: false,
      manage_categories: false,
      manage_tags: false,
      manage_users: false,
      manage_roles: false,
      manage_ads: false,
      view_analytics: false,
      manage_settings: false,
      view_audit: false
    }
  }
];

export const MEDIA_LIBRARY = [
  {
    id: 'med-01',
    type: 'image',
    title: 'ঢাকা মেট্রোরেল উত্তরা-মতিঝিল ট্রেন চলাচলের দৃশ্য',
    url: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg',
    thumbnailUrl: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg',
    altText: 'উত্তরা থেকে মতিঝিলগামী আধুনিক ঢাকা মেট্রোরেল উড়ালসেতুতে চলন্ত ট্রেন',
    caption: 'মিরপুর ১০ নম্বর গোলচত্বরে আধুনিক মেট্রোরেল ট্র্যাকের নান্দনিক দৃশ্য',
    credit: 'রফিকুল ইসলাম / দৈনিক বার্তা প্রবাহ',
    category: 'infrastructure',
    dimensions: '1920x1080',
    size: '1.4 MB',
    sizeBytes: 1468006,
    format: 'JPEG',
    uploadedAt: '২০২৬-১১-০৯',
    uploadedBy: 'মোঃ লুৎফর রহমান'
  },
  {
    id: 'med-02',
    type: 'image',
    title: 'জাতীয় সংসদ ভবন ও মানিক মিয়া এভিনিউ চত্বর',
    url: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=400&auto=format&fit=crop&q=80',
    altText: 'সবুজ চত্বরে পরিবেষ্টিত বাংলাদেশ জাতীয় সংসদ ভবনের স্থাপত্য',
    caption: 'লুই কানের কালজয়ী নকশায় নির্মিত বাংলাদেশ জাতীয় সংসদ ভবন',
    credit: 'বার্তা সংস্থা এএফপি / পিআইডি',
    category: 'politics',
    dimensions: '2048x1152',
    size: '1.8 MB',
    sizeBytes: 1887436,
    format: 'JPEG',
    uploadedAt: '২০২৬-১১-০৮',
    uploadedBy: 'ফারহানা ইসলাম তন্বী'
  },
  {
    id: 'med-03',
    type: 'video',
    title: 'মিরপুর শের-ই-বাংলা স্টেডিয়ামে টাইগারদের সিরিজ জয়ের মুহূর্ত',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    altText: 'মিরপুরে শেষ উইকেটের পতনের পর বাংলাদেশ দলের বাঁধভাঙা উদযাপন ভিডিও',
    caption: 'মিরপুর শের-ই-বাংলা জাতীয় ক্রিকেট স্টেডিয়ামে শ্বাসরুদ্ধকর শেষ ওভারে রোমাঞ্চকর উইকেটে গ্যালারির উল্লাস',
    credit: 'আহমেদ জাবের ও ভিডিও ইউনিট',
    category: 'sports',
    dimensions: '1080p Full HD',
    duration: '০৩:৪৫',
    size: '৩৮.৫ MB',
    sizeBytes: 40370176,
    format: 'MP4',
    uploadedAt: '২০২৬-১১-০৭',
    uploadedBy: 'আহমেদ জাবের'
  },
  {
    id: 'med-04',
    type: 'image',
    title: 'কালিয়াকৈর হাই-টেক পার্কে সফটওয়্যার প্রকৌশলীদের কোডিং সেশন',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    altText: 'ল্যাপটপে কৃত্রিম বুদ্ধিমত্তা মডেল প্রশিক্ষণ দিচ্ছেন তরুণ সফটওয়্যার প্রকৌশলীরা',
    caption: 'বঙ্গবন্ধু হাইটেক সিটিতে এআই সফটওয়্যার ডেভেলপারদের কোডিং ও গবেষণা সেশন',
    credit: 'নাসরিন সুলতানা / বার্তা প্রবাহ',
    category: 'technology',
    dimensions: '1600x1066',
    size: '৯৮০ KB',
    sizeBytes: 1003520,
    format: 'PNG',
    uploadedAt: '২০২৬-১১-০৬',
    uploadedBy: 'নাসরিন সুলতানা'
  },
  {
    id: 'med-05',
    type: 'video',
    title: 'পদ্মা সেতু করিডোরে বুলেট ট্রেনের স্পিড ট্রায়াল রান',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=80',
    altText: 'পদ্মা সেতুর নিচতলার রেললাইনে দ্রুতগতির পরীক্ষামূলক ট্রেন চলাচল ভিডিও',
    caption: 'পদ্মা সেতুর মাওয়া থেকে জাজিরা প্রান্তে সূর্যাস্তের পটভূমিতে হাই-স্পিড ট্রেনের ট্রায়াল ভিডিও',
    credit: 'রফিকুল ইসলাম / ড্রোন সিনেমাটোগ্রাফি',
    category: 'economy',
    dimensions: '4K Ultra HD',
    duration: '০৪:২০',
    size: '৮৪.২ MB',
    sizeBytes: 88290099,
    format: 'MP4',
    uploadedAt: '২০২৬-১১-০৫',
    uploadedBy: 'রফিকুল ইসলাম'
  },
  {
    id: 'med-06',
    type: 'image',
    title: 'চট্টগ্রাম সমুদ্রবন্দরে স্বয়ংক্রিয় এআই স্ক্যানারে রপ্তানি পণ্য পরীক্ষাকরণ',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    altText: 'কনটেইনার টার্মিনালে স্বয়ংক্রিয় ক্রেন ও আধুনিক জাহাজে কার্গো হ্যান্ডলিং',
    caption: 'চট্টগ্রাম সমুদ্রবন্দরে স্বয়ংক্রিয় এআই স্ক্যানারে দ্রুততম সময়ে কাস্টমস ক্লিয়ারেন্স',
    credit: 'চট্টগ্রাম ব্যুরো / বার্তা প্রবাহ',
    category: 'economy',
    dimensions: '1920x1080',
    size: '১.২ MB',
    sizeBytes: 1258291,
    format: 'WEBP',
    uploadedAt: '২০২৬-১১-০৪',
    uploadedBy: 'ফারহানা ইসলাম তন্বী'
  }
];

export const ADS_CAMPAIGNS = [
  {
    id: 'ad-01',
    title: 'গ্রামীণফোন ৫জি আল্ট্রা-ফাস্ট ইন্টারনেট ক্যাম্পেইন',
    advertiser: 'Grameenphone Ltd.',
    contactPerson: 'ইমতিয়াজ হাসান (মিডিয়া ডিরেক্টর)',
    advertiserEmail: 'ads@grameenphone.com',
    advertiserPhone: '+৮৮০ ১২১০০০০০০',
    placement: 'homepage_top',
    placementName: 'হোমপেজ শীর্ষ ব্যানার (Homepage Top Leaderboard)',
    impressions: 485200,
    clicks: 12450,
    ctr: '2.57%',
    startDate: '২০২৬-১১-০১',
    endDate: '২০২৬-১১-৩০',
    status: 'active',
    revenue: '৳ ১,২০,০০০',
    destinationUrl: 'https://www.grameenphone.com',
    dimensions: '728x90',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=728&h=90&fit=crop&q=80'
  },
  {
    id: 'ad-02',
    title: 'বিকাশ অটো পে ও ইউটিলিটি বিল ক্যাশব্যাক অফার',
    advertiser: 'bKash Bangladesh PLC',
    contactPerson: 'ফারজানা চৌধুরী (ব্র্যান্ড ম্যানেজার)',
    advertiserEmail: 'marketing@bkash.com',
    advertiserPhone: '+৮৮০ ১৭৫৫০০০০০০',
    placement: 'homepage_sidebar',
    placementName: 'হোমপেজ সাইডবার স্টিকি ব্যানার (Homepage Sidebar 300x250)',
    impressions: 312000,
    clicks: 9840,
    ctr: '3.15%',
    startDate: '২০২৬-১১-০৫',
    endDate: '২০২৬-১১-২৫',
    status: 'active',
    revenue: '৳ ৮৫,০০০',
    destinationUrl: 'https://www.bkash.com',
    dimensions: '300x250',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&h=250&fit=crop&q=80'
  },
  {
    id: 'ad-03',
    title: 'বাটার এক্সক্লুসিভ উইন্টার শু কালেকশন ২০২৬',
    advertiser: 'Bata Bangladesh Ltd.',
    contactPerson: 'তানভীর আহমেদ',
    advertiserEmail: 'corporate@batabd.com',
    advertiserPhone: '+৮৮০ ২ ৯৮৯০০০০',
    placement: 'news_details_top',
    placementName: 'নিউজ বিস্তারিত শীর্ষ ব্যানার (News Details Top)',
    impressions: 245000,
    clicks: 6120,
    ctr: '2.50%',
    startDate: '২০২৬-১১-০৮',
    endDate: '২০২৬-১১-২৮',
    status: 'active',
    revenue: '৳ ৭০,০০০',
    destinationUrl: 'https://www.batabd.com',
    dimensions: '728x90',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=728&h=90&fit=crop&q=80'
  },
  {
    id: 'ad-04',
    title: 'ওয়ালটন প্রাইম স্মার্ট ফ্রিজ এআই ইনভার্টার সিরিজ',
    advertiser: 'Walton Hi-Tech Industries',
    contactPerson: 'গোলাম মোর্শেদ',
    advertiserEmail: 'sales@waltonbd.com',
    advertiserPhone: '+৮৮০ ৯৬১২০০০০০০',
    placement: 'news_details_middle',
    placementName: 'সংবাদের মাঝের ব্যানার (News Details Middle 600x120)',
    impressions: 198000,
    clicks: 4120,
    ctr: '2.08%',
    startDate: '২০২৬-১১-০২',
    endDate: '২০২৬-১১-২২',
    status: 'active',
    revenue: '৳ ৫৫,০০০',
    destinationUrl: 'https://waltonbd.com',
    dimensions: '600x120',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&h=120&fit=crop&q=80'
  },
  {
    id: 'ad-05',
    title: 'ইস্টার্ন ব্যাংক ডিজিটাল হোম লোন স্পেশাল স্কিম',
    advertiser: 'Eastern Bank PLC',
    contactPerson: 'মেহজাবিন আলম',
    advertiserEmail: 'retail@ebl-bd.com',
    advertiserPhone: '+৮৮০ ১৬২৩০০০০০০',
    placement: 'category_page',
    placementName: 'ক্যাটাগরি পেজ ব্যানার (Category Page 728x90)',
    impressions: 142000,
    clicks: 2180,
    ctr: '1.53%',
    startDate: '২০২৬-১০-১৫',
    endDate: '২০২৬-১১-৩০',
    status: 'active',
    revenue: '৳ ৬৫,০০০',
    destinationUrl: 'https://www.ebl.com.bd',
    dimensions: '728x90',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=728&h=90&fit=crop&q=80'
  }
];

export const ANALYTICS_REALTIME = {
  activeReadersNow: 1428,
  todayPageViews: 184500,
  uniqueVisitors: 62400,
  trafficSources: [
    { source: 'গুগল সার্চ (Organic Search)', percentage: 48, visitors: 29950, color: '#059669' },
    { source: 'সোশ্যাল মিডিয়া (Facebook / X)', percentage: 31, visitors: 19340, color: '#2563eb' },
    { source: 'সরাসরি পাঠক (Direct URL)', percentage: 15, visitors: 9360, color: '#b91c1c' },
    { source: 'অন্যান্য রেফারেল (Referral)', percentage: 6, visitors: 3750, color: '#7c3aed' }
  ],
  deviceBreakdown: [
    { device: 'স্মার্টফোন (Mobile)', percentage: 76, color: '#dc2626' },
    { device: 'কম্পিউটার (Desktop)', percentage: 21, color: '#2563eb' },
    { device: 'ট্যাবলেট (Tablet)', percentage: 3, color: '#059669' }
  ],
  topReadStoriesToday: [
    { rank: 1, title: 'ঢাকা মেট্রোরেল সম্প্রসারণে নতুন গতি: টঙ্গী পর্যন্ত সার্ভে শুরু', views: 34200, shares: 1240 },
    { rank: 2, title: 'মিরপুরে রুদ্ধশ্বাস শেষ ওভারে ভারতের বিপক্ষে টাইগারদের জয়', views: 28900, shares: 3100 },
    { rank: 3, title: 'রেমিট্যান্সে নতুন রেকর্ড: এক মাসে এলো ২৪০ কোটি ডলার', views: 21500, shares: 980 },
    { rank: 4, title: 'কৃত্রিম বুদ্ধিমত্তা ব্যবহারে বাংলাদেশের তরুণ স্টার্টআপদের বিশ্বজয়', views: 16800, shares: 820 },
    { rank: 5, title: 'পদ্মা সেতু করিডরে নতুন অর্থনৈতিক হাব নির্মাণ কাজ দ্রুত এগিয়ে চলছে', views: 14200, shares: 640 }
  ]
};

export const NOTIFICATIONS_DATA = [
  {
    id: 'notif-1',
    title: 'নতুন সংবাদ অনুমোদনের অপেক্ষায়',
    message: 'ফারহানা ইসলাম তন্বী নির্বাচন কমিশনের নীতিমালার উপর একটি নতুন ড্রাফট জমা দিয়েছেন।',
    time: '১০ মিনিট আগে',
    read: false,
    type: 'review'
  },
  {
    id: 'notif-2',
    title: 'ব্রেকিং নিউজ প্রকাশ হয়েছে',
    message: 'মিরপুর টেস্টে বাংলাদেশের জয় তাৎক্ষণিকভাবে লাইভ হয়েছে।',
    time: '১ ঘণ্টা আগে',
    read: false,
    type: 'breaking'
  },
  {
    id: 'notif-3',
    title: 'বিজ্ঞাপন ক্যাম্পেইন মেয়াদ শেষ হচ্ছে',
    message: 'ইস্টার্ন ব্যাংক হোম লোন ক্যাম্পেইনটির মেয়াদ সমাপ্ত হয়েছে।',
    time: '৩ ঘণ্টা আগে',
    read: true,
    type: 'ad'
  },
  {
    id: 'notif-4',
    title: 'সিস্টেম ব্যাকআপ সম্পন্ন',
    message: 'দৈনিক স্বয়ংক্রিয় ডাটাবেস ও মিডিয়া ব্যাকআপ সফল হয়েছে।',
    time: '১২ ঘণ্টা আগে',
    read: true,
    type: 'system'
  }
];

export const SETTINGS_DEFAULT = {
  websiteNameBn: 'দৈনিক বার্তা প্রবাহ',
  websiteNameEn: 'Daily Prabaho',
  portalNameBn: 'দৈনিক বার্তা প্রবাহ',
  portalNameEn: 'Daily Prabaho',
  tagline: 'সত্যের সন্ধানে অবিচল প্রতিদিনের কণ্ঠস্বর',
  logo: '/src/assets/images/logo.svg',
  logoDark: '/src/assets/images/logo-dark.svg',
  favicon: '/favicon.ico',
  editorName: 'মোঃ লুৎফর রহমান',
  editorEmail: 'lutforrahmanseu@gmail.com',
  publisherName: 'দৈনিক বার্তা প্রবাহ',
  publisherAddress: 'নিকুঞ্জ-২, খিলক্ষেত, ঢাকা, বাংলাদেশ।',
  publisherAddressEn: 'Nikunja-2, Khilkhet, Dhaka, Bangladesh',
  phone: '+৮৮০ ২ ৯৮৭৬৫৪৩',
  hotline: '+৮৮০১৭০০০০০০০০',
  email: 'lutforrahmanseu@gmail.com',
  socialLinks: {
    facebook: 'https://facebook.com/dailyprabaho',
    twitter: 'https://x.com/dailyprabaho',
    youtube: 'https://youtube.com/@dailyprabaho',
    instagram: 'https://instagram.com/dailyprabaho',
    linkedin: 'https://linkedin.com/company/dailyprabaho',
    telegram: 'https://t.me/dailyprabaho'
  },
  navigationMenu: [
    { id: 'nav-1', labelBn: 'জাতীয়', labelEn: 'Bangladesh', path: '/category/bangladesh', isVisible: true, order: 1 },
    { id: 'nav-2', labelBn: 'রাজনীতি', labelEn: 'Politics', path: '/category/politics', isVisible: true, order: 2 },
    { id: 'nav-3', labelBn: 'অর্থনীতি', labelEn: 'Economy', path: '/category/economy', isVisible: true, order: 3 },
    { id: 'nav-4', labelBn: 'আন্তর্জাতিক', labelEn: 'International', path: '/category/international', isVisible: true, order: 4 },
    { id: 'nav-5', labelBn: 'খেলাধুলা', labelEn: 'Sports', path: '/category/sports', isVisible: true, order: 5 },
    { id: 'nav-6', labelBn: 'বিনোদন', labelEn: 'Entertainment', path: '/category/entertainment', isVisible: true, order: 6 },
    { id: 'nav-7', labelBn: 'তথ্যপ্রযুক্তি', labelEn: 'Technology', path: '/category/technology', isVisible: true, order: 7 },
    { id: 'nav-8', labelBn: 'মতামত', labelEn: 'Opinion', path: '/category/opinion', isVisible: true, order: 8 }
  ],
  footerSettings: {
    copyrightBn: '© ২০২৬ দৈনিক বার্তা প্রবাহ। সর্বস্বত্ব সংরক্ষিত।',
    copyrightEn: '© 2026 Daily Prabaho. All rights reserved.',
    pressRegNo: 'তথ্য মন্ত্রণালয় নিবন্ধন নং: ডিএইচ-১২৮৯/২০২৬',
    editorialNotice: 'অনলাইন সংস্করণে প্রকাশিত কোনো সংবাদ, ছবি, অডিও ও ভিডিও বিনা অনুমতিতে ব্যবহার দণ্ডনীয় অপরাধ।',
    showEpaperLink: true,
    showArchiveLink: true
  },
  languageSettings: {
    defaultLanguage: 'bn',
    numerals: 'bengali',
    timeZone: 'Asia/Dhaka (GMT+6)',
    dateFormat: 'DD MMMM YYYY',
    calendarType: 'bengali-gregorian'
  },
  enableBreakingTicker: true,
  enableComments: true,
  autoModerateComments: true,
  allowGuestSubmissions: false,
  maintenanceMode: false
};


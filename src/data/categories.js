export const CATEGORIES = [
  {
    id: 'bangladesh',
    name: 'বাংলাদেশ',
    nameEn: 'Bangladesh',
    slug: 'bangladesh',
    description: 'সারাদেশের ঘটে যাওয়া প্রধান সংবাদ, মাঠপর্যায়ের অনুসন্ধান ও খবরাখবর',
    color: '#dc2626',
    subcategories: [
      { name: 'সারাদেশ', nameEn: 'National', slug: 'national' },
      { name: 'রাজধানী', nameEn: 'Capital', slug: 'capital' },
      { name: 'জেলা বার্তা', nameEn: 'Districts', slug: 'districts' },
      { name: 'অপরাধ ও আদালত', nameEn: 'Crime & Law', slug: 'crime-law' }
    ]
  },
  {
    id: 'politics',
    name: 'রাজনীতি',
    nameEn: 'Politics',
    slug: 'politics',
    description: 'দেশের সমসাময়িক রাজনৈতিক পরিস্থিতি, নির্বাচন, সংস্কার ও নীতি নির্ধারণ',
    color: '#b91c1c',
    subcategories: [
      { name: 'নির্বাচন', nameEn: 'Election', slug: 'election' },
      { name: 'সংস্কার ও নীতি', nameEn: 'Reforms', slug: 'reforms' },
      { name: 'রাজনৈতিক দল', nameEn: 'Parties', slug: 'parties' },
      { name: 'জাতীয় সংসদ', nameEn: 'Parliament', slug: 'parliament' }
    ]
  },
  {
    id: 'international',
    name: 'বিশ্ব সংবাদ',
    nameEn: 'World',
    slug: 'international',
    description: 'বিশ্ব রাজনীতি, কূটনীতি, আন্তর্জাতিক অর্থনীতি এবং বৈশ্বিক ঘটনাবলি',
    color: '#1d4ed8',
    subcategories: [
      { name: 'দক্ষিণ এশিয়া', nameEn: 'South Asia', slug: 'south-asia' },
      { name: 'মধ্যপ্রাচ্য', nameEn: 'Middle East', slug: 'middle-east' },
      { name: 'আমেরিকা ও জাতিসংঘ', nameEn: 'Americas & UN', slug: 'americas-un' },
      { name: 'ইউরোপ', nameEn: 'Europe', slug: 'europe' }
    ]
  },
  {
    id: 'economy',
    name: 'বাণিজ্য',
    nameEn: 'Business',
    slug: 'economy',
    description: 'ব্যাংক, পুঁজিবাজার, শিল্প বাণিজ্য, রফতানি ও রাজস্ব নীতি',
    color: '#047857',
    subcategories: [
      { name: 'ব্যাংক ও বীমা', nameEn: 'Banking', slug: 'banking' },
      { name: 'পুঁজিবাজার', nameEn: 'Stock Market', slug: 'stocks' },
      { name: 'শিল্প ও বাণিজ্য', nameEn: 'Trade & Industry', slug: 'trade' },
      { name: 'রাজস্ব ও বাজেট', nameEn: 'Revenue & Budget', slug: 'revenue' }
    ]
  },
  {
    id: 'sports',
    name: 'খেলাধুলা',
    nameEn: 'Sports',
    slug: 'sports',
    description: 'ক্রিকেট, ফুটবল, বৈশ্বিক টুর্নামেন্ট এবং দেশ-বিদেশের ক্রীড়াঙ্গন',
    color: '#d97706',
    subcategories: [
      { name: 'ক্রিকেট', nameEn: 'Cricket', slug: 'cricket' },
      { name: 'ফুটবল', nameEn: 'Football', slug: 'football' },
      { name: 'টেনিস ও অ্যাথলেটিকস', nameEn: 'Tennis & Athletics', slug: 'tennis' },
      { name: 'ঘরোয়া ক্রীড়াঙ্গন', nameEn: 'Domestic Sports', slug: 'domestic-sports' }
    ]
  },
  {
    id: 'entertainment',
    name: 'বিনোদন',
    nameEn: 'Entertainment',
    slug: 'entertainment',
    description: 'চলচ্চিত্র, নাটক, সঙ্গীত, ওটিটি এবং সাংস্কৃতিক জগতের খবরাখবর',
    color: '#7c3aed',
    subcategories: [
      { name: 'চলচ্চিত্র', nameEn: 'Cinema', slug: 'cinema' },
      { name: 'নাটক ও ওটিটি', nameEn: 'Drama & OTT', slug: 'drama-ott' },
      { name: 'সঙ্গীত', nameEn: 'Music', slug: 'music' },
      { name: 'সংস্কৃতি ও উৎসব', nameEn: 'Culture & Festivals', slug: 'culture' }
    ]
  },
  {
    id: 'technology',
    name: 'প্রযুক্তি',
    nameEn: 'Technology',
    slug: 'technology',
    description: 'কৃত্রিম বুদ্ধিমত্তা, স্টার্টআপ, স্মার্ট গ্যাজেট, বিজ্ঞান ও উদ্ভাবন',
    color: '#0891b2',
    subcategories: [
      { name: 'কৃত্রিম বুদ্ধিমত্তা', nameEn: 'AI & Data', slug: 'ai' },
      { name: 'স্টার্টআপ ও ইনোভেশন', nameEn: 'Startups', slug: 'startups' },
      { name: 'গ্যাজেট ও রিভিউ', nameEn: 'Gadgets', slug: 'gadgets' },
      { name: 'সাইবার ও টেলিকম', nameEn: 'Cyber & Telecom', slug: 'cyber-telecom' }
    ]
  },
  {
    id: 'lifestyle',
    name: 'জীবনযাপন',
    nameEn: 'Lifestyle',
    slug: 'lifestyle',
    description: 'স্বাস্থ্য, পর্যটন ও ভ্রমণ, রন্ধনশিল্প, সুস্থতা ও ফ্যাশন',
    color: '#db2777',
    subcategories: [
      { name: 'ভ্রমণ ও পর্যটন', nameEn: 'Travel & Tourism', slug: 'travel' },
      { name: 'স্বাস্থ্য ও চিকিৎসা', nameEn: 'Health & Wellness', slug: 'health' },
      { name: 'রন্ধন ও রেসিপি', nameEn: 'Food & Cuisine', slug: 'food' },
      { name: 'ফ্যাশন ও রূপচর্চা', nameEn: 'Fashion & Style', slug: 'fashion' }
    ]
  },
  {
    id: 'opinion',
    name: 'মতামত',
    nameEn: 'Opinion',
    slug: 'opinion',
    description: 'বিশিষ্ট কলামিস্টদের সুচিন্তিত নিবন্ধ, সম্পাদকীয় ও মুক্তমত',
    color: '#475569',
    subcategories: [
      { name: 'সম্পাদকীয়', nameEn: 'Editorial', slug: 'editorial' },
      { name: 'উপসম্পাদকীয় ও কলাম', nameEn: 'Columns', slug: 'columns' },
      { name: 'বিশেষ সাক্ষাৎকার', nameEn: 'Interviews', slug: 'interviews' },
      { name: 'মুক্তমত', nameEn: 'Open Forum', slug: 'open-forum' }
    ]
  }
];

export default CATEGORIES;

/**
 * NewsFlow - Editorial & Sample News Dataset
 * Realistic Bengali news stories covering all 9 public categories.
 * Enriched with slugs, subcategories, author slugs, reporter credits,
 * publish/update timestamps, image credits, rich text formatting, and comments.
 */

export const INITIAL_NEWS = [
  // 1. BANGLADESH / METRO RAIL (LEAD)
  {
    id: 'news-01',
    slug: 'dhaka-metro-expansion-tongi-savar-feasibility',
    title: 'ঢাকা মেট্রোরেল সম্প্রসারণে নতুন গতি: টঙ্গী ও সাভার পর্যন্ত রুট সমীক্ষা সম্পন্ন',
    titleEn: 'New Momentum in Dhaka Metro Expansion: Feasibility Completed for Tongi and Savar Routes',
    subheadline: 'উত্তরা-টঙ্গী এবং হেমায়েতপুর-সাভার রুটে দৈনিক অতিরিক্ত ৫ লাখ যাত্রী পরিবহনের লক্ষ্যমাত্রা',
    excerpt: 'রাজধানীর যানজট নিরসনে এমআরটি লাইন-৬ সম্প্রসারণের কাজ দ্রুত এগিয়ে চলেছে। নতুন ডিপো এবং স্বয়ংক্রিয় সিগন্যালিং ব্যবস্থার মাধ্যমে দৈনিক যাত্রী সক্ষমতা ১০ লাখে উন্নীত করার পরিকল্পনা চূড়ান্ত হয়েছে।',
    excerptEn: 'MRT Line-6 extension moves rapidly to alleviate capital congestion. Capacity planned to increase to 1 million daily passengers with automated signaling.',
    content: `রাজধানী ঢাকার আধুনিক গণপরিবহন ব্যবস্থার যুগান্তকারী রূপান্তর ঘটতে চলেছে। মেট্রোরেল পরিচালনাকারী কর্তৃপক্ষ ঢাকা ম্যাস ট্রানজিট কোম্পানি লিমিটেড (ডিএমটিসিএল) জানিয়েছে, উত্তরা উত্তর থেকে টঙ্গী এবং হেমায়েতপুর হয়ে সাভার পর্যন্ত রুট সম্প্রসারণের বিস্তারিত সম্ভাব্যতা যাচাই প্রতিবেদন চূড়ান্ত হয়েছে।

আজ সকালে নগর ভবনে আয়োজিত এক উচ্চপর্যায়ের পর্যালোচনা সভায় সড়ক পরিবহন ও সেতু মন্ত্রণালয়ের জ্যেষ্ঠ কর্মকর্তারা জানান, সাভার ও টঙ্গী রুটে যুক্ত হলে ঢাকার মূল কেন্দ্রস্থলে প্রতিদিন অন্তত ৩ লাখ ব্যক্তিগত গাড়ির চাপ হ্রাস পাবে। পরিবেশবান্ধব এই গণপরিবহনে কার্বন নির্গমন বার্ষিক প্রায় ১.৫ লাখ টন হ্রাস পাবে বলে পূর্বাভাস দেওয়া হয়েছে।

> "আমরা কেবল একটি রেলপথ নির্মাণ করছি না, বরং পুরো রাজধানীর নাগরিক চলাচলে এক নতুন মানবিক সংস্কৃতি গড়ে তুলছি। সাধারণ শিক্ষার্থী ও পেশাজীবীরা এখন ২০ মিনিটে উত্তরা থেকে মতিঝিল পৌঁছাতে পারছেন।"
> — প্রকল্প পরিচালক, ডিএমটিসিএল

### প্রকল্পের মূল রূপরেখা ও বৈশিষ্ট্য:
* **দৈর্ঘ্য ও স্টেশন:** উত্তরা-টঙ্গী অংশে নতুন ৫টি স্টেশন এবং হেমায়েতপুর-সাভার অংশে ৭টি আধুনিক সুযোগ-সুবিধাসম্পন্ন স্টেশন নির্মাণ করা হবে।
* **সিগন্যালিং:** সর্বাধুনিক কমিউনিকেশন-বেসড ট্রেন কন্ট্রোল (CBTC) প্রযুক্তি সংযুক্ত থাকবে।
* **ফিডার যোগাযোগ:** প্রতিটি স্টেশনের প্রবেশদ্বারে ডেডিকেটেড সাইকেল পার্কিং, ই-রিকশা এবং আধুনিক ফিডার শাটল বাস সার্ভিস চালু থাকবে।
* **পরিবেশবান্ধব জ্বালানি:** ছাদজুড়ে সোলার প্যানেল স্থাপন করে স্টেশনের দৈনিক ৩০ শতাংশ বিদ্যুৎ চাহিদা নবায়নযোগ্য উৎস থেকে পূরণ করা হবে।

আসন্ন উন্নয়ন বাজেটে এই সম্প্রসারণের জন্য পর্যাপ্ত অর্থায়ন নিশ্চিত করা হয়েছে বলে অর্থ মন্ত্রণালয় সূত্রে জানা গেছে। ডিএমটিসিএলের ব্যবস্থাপনা পরিচালক বলেন, ২০২৭ সালের মধ্যেই এই বর্ধিত অংশের নির্মাণ কাজ পুরোদমে দৃশ্যমান হবে।`,
    contentEn: `Dhaka's modern public transit transformation is accelerating. Dhaka Mass Transit Company Limited (DMTCL) confirmed that detailed feasibility studies for extending routes to Tongi and Savar have been finalized. The extension is expected to eliminate over 300,000 private vehicles from central Dhaka roadways every day, drastically cutting carbon emissions.`,
    category: 'bangladesh',
    categoryName: 'বাংলাদেশ',
    categoryNameEn: 'Bangladesh',
    subcategory: 'রাজধানী',
    subcategorySlug: 'capital',
    authorId: 'rep-05',
    author: 'কামরুল হাসান রাসেল',
    authorSlug: 'kamrul-hasan-russell',
    authorRole: 'নিজস্ব প্রতিবেদক (নগর ও যোগাযোগ)',
    reporterName: 'কামরুল হাসান রাসেল, নিজস্ব প্রতিবেদক',
    image: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg',
    imageCaption: 'উত্তরা-মতিঝিল রুটে দ্রুত গতিতে ছুটে চলেছে আধুনিক মেট্রোরেল।',
    imageCredit: 'ছবি: নিউজফ্লো / ফোকাস বাংলা',
    publishedAt: '2026-11-10T09:15:00Z',
    updatedAt: '2026-11-10T11:45:00Z',
    isLead: true,
    isBreaking: true,
    isFeatured: true,
    views: 28450,
    shares: 1220,
    tags: ['মেট্রোরেল', 'ঢাকা', 'যোগাযোগ', 'ডিএমটিসিএল', 'গণপরিবহন'],
    status: 'published',
    commentsList: [
      {
        id: 'c1',
        author: 'তানভীর হোসাইন',
        time: '১৫ মিনিট আগে',
        text: 'মেট্রোরেলের এই রুট সম্প্রসারণ ঢাকার সামগ্রিক যানজট নিরসনে সত্যিই মাইলফলক হয়ে থাকবে। বিশেষ করে সাভারের শিক্ষার্থীদের জন্য দারুণ সুবিধা হবে।',
        likes: 18
      },
      {
        id: 'c2',
        author: 'ড. রফিকুল ইসলাম',
        time: '১ ঘণ্টা আগে',
        text: 'পরিবেশবান্ধব পরিবহন ব্যবস্থা গড়ে তোলার জন্য কর্তৃপক্ষকে সাধুবাদ জানাই। তবে কাজের গুণগত মান যাতে বজায় থাকে সেদিকে নজর দেওয়া দরকার।',
        likes: 9
      }
    ]
  },

  // 2. SPORTS / CRICKET
  {
    id: 'news-02',
    slug: 'thrilling-victory-bangladesh-mirpur-last-over-cricket',
    title: 'মিরপুরে রুদ্ধশ্বাস লড়াইয়ে জয় বাংলাদেশের: শেষ ওভারে রোমাঞ্চকর সমাপ্তি',
    titleEn: 'Thrilling Victory for Bangladesh in Mirpur: Epic Last-Over Finish',
    subheadline: 'অসাধারণ ডেথ বোলিং ও ফিল্ডিংয়ে সফরকারী দলের বিপক্ষে দ্বিপাক্ষিক সিরিজ নিশ্চিত টাইগারদের',
    excerpt: 'হোম অব ক্রিকেটে স্বাগতিকদের দুর্দান্ত অলরাউন্ড পারফরম্যান্স। তরুণ পেসার ও মিডল অর্ডারের অসাধারণ জুটিতে সিরিজ জয় নিশ্চিত করল বাংলাদেশ।',
    excerptEn: 'Brilliant all-round performance at Home of Cricket secures series victory with clutch last-over bowling.',
    content: `মিরপুর শের-ই-বাংলা জাতীয় ক্রিকেট স্টেডিয়ামে লাখো দর্শকের করতালির মাঝে এক ঐতিহাসিক জয় ছিনিয়ে আনল বাংলাদেশ দল। প্রতিপক্ষ দলের বিপক্ষে শেষ ওভারে জয়ের জন্য প্রয়োজন ছিল ১২ রান, যা অসাধারণ ইয়র্কার ও ক্ষিপ্র ফিল্ডিংয়ের মাধ্যমে আটকে দেন জাতীয় দলের তরুণ পেসার।

ব্যাটিংয়ে দলের পক্ষে সর্বোচ্চ অপরাজিত ৭৪ রানের ইনিংস খেলেন মিডল অর্ডার ব্যাটসম্যান। ম্যাচের সেরা খেলোয়াড় নির্বাচিত হওয়া তরুণ অলরাউন্ডার বলেন, "আমরা জানতাম ঘরের মাঠে আমাদের শৃঙ্খলাবদ্ধ থাকতে হবে। এই জয় গোটা দেশের ক্রিকেটপ্রেমীদের জন্য উৎসর্গ করছি।"

> "শেষ ওভারে বোলিং করতে নামার আগে অধিনায়ক বলেছিলেন নিজের শক্তির ওপর বিশ্বাস রাখতে। পরিকল্পনা অনুযায়ী ফিল্ড সাজিয়ে বল করতে পেরেছি।"
> — ম্যাচসেরা বোলার

ম্যাচ শেষে স্টেডিয়ামজুড়ে লাল-সবুজের উল্লাস ছড়িয়ে পড়ে। ক্রীড়াঙ্গনের বিশিষ্ট ব্যক্তিবর্গ এবং প্রধান উপদেষ্টা দলটিকে আন্তরিক অভিনন্দন জানিয়েছেন। সিরিজের শেষ ম্যাচ আগামী শুক্রবার অনুষ্ঠিত হবে।`,
    contentEn: `In front of an electrified crowd at Sher-e-Bangla National Cricket Stadium, Bangladesh clinched a dramatic last-over victory to seal the bilateral series. Superb death bowling secured the triumph.`,
    category: 'sports',
    categoryName: 'খেলাধুla',
    categoryNameEn: 'Sports',
    subcategory: 'ক্রিকেট',
    subcategorySlug: 'cricket',
    authorId: 'rep-03',
    author: 'আহমেদ জাবের',
    authorSlug: 'ahmed-jaber',
    authorRole: 'বিশেষ প্রতিনিধি (খেলাধুলা)',
    reporterName: 'আহমেদ জাবের, বিশেষ প্রতিনিধি',
    image: '/src/assets/images/bangladesh_cricket_match_1794291830719.jpg',
    imageCaption: 'মিরপুরে চোখধাঁধানো কাভার ড্রাইভে রান তুলছেন ব্যাটসম্যান।',
    imageCredit: 'ছবি: বিসিবি / নিউজফ্লো',
    publishedAt: '2026-11-10T08:30:00Z',
    updatedAt: '2026-11-10T10:15:00Z',
    isLead: false,
    isBreaking: true,
    isFeatured: true,
    views: 34300,
    shares: 1820,
    tags: ['ক্রিকেট', 'বিসিবি', 'মিরপুর', 'বাংলাদেশ', 'টাইগার্স'],
    status: 'submitted',
    submittedAt: '2026-11-10T08:30:00Z',
    statusHistory: [
      {
        id: 'h1',
        fromStatus: 'draft',
        toStatus: 'submitted',
        actionBy: 'আহমেদ জাবের',
        role: 'reporter',
        timestamp: '2026-11-10T08:30:00Z',
        comments: 'ক্রিকেট সিরিজের ম্যাচ রিপোর্ট পর্যালোচনার জন্য জমা দেওয়া হলো'
      }
    ],
    commentsList: [
      {
        id: 'c-sp-1',
        author: 'সাকিব আল হাসান ভক্ত',
        time: '৩০ মিনিট আগে',
        text: 'অবিশ্বাস্য বোলিং! শেষ ৩টি বলে যে স্নায়ুচাপ সামলেছে তা সত্যিই প্রশংসনীয়। সাবাস বাংলাদেশ!',
        likes: 24
      }
    ]
  },

  // 3. BUSINESS / ECONOMY
  {
    id: 'news-03',
    slug: 'padma-bridge-corridor-economic-hub-mongla-cargo-record',
    title: 'পদ্মা সেতু করিডরে নতুন অর্থনৈতিক হাব: পায়রা ও মোংলায় রফতানি কার্গো পরিবহনে রেকর্ড',
    titleEn: 'New Economic Hub in Padma Corridor: Record Export Cargo Handled at Payra and Mongla Ports',
    subheadline: 'দক্ষিণাঞ্চলের ২১ জেলায় নতুন কর্মসংস্থান সৃষ্টি, বন্দর ব্যবহারে সময় সাশ্রয় ৪০ শতাংশ',
    excerpt: 'দক্ষিণাঞ্চলের জেলাগুলোতে গড়ে উঠেছে অর্ধশতাধিক নতুন শিল্পপার্ক। মোংলা বন্দর দিয়ে পণ্য খালাসের সময় নেমে এসেছে অর্ধেকে।',
    excerptEn: 'Over 50 new industrial parks established across southern Bangladesh, halving cargo turnaround at Mongla port.',
    content: `পদ্মা বহুমুখী সেতু ও সংশ্লিষ্ট এক্সপ্রেসওয়ে চালু হওয়ার পর দেশের দক্ষিণাঞ্চলে সমন্বিত অর্থনৈতিক বিপ্লব শুরু হয়েছে। বাংলাদেশ অর্থনৈতিক অঞ্চল কর্তৃপক্ষ (বেজা) সূত্রে জানা গেছে, ফরিদপুর, মাদারীপুর, গোপালগঞ্জ ও খুলনায় নতুন প্রায় ৪০টি যৌথ বিনিয়োগ কারখানা উৎপাদন শুরু করেছে।

নদী ও সড়ক সংযোগের মেলবন্ধনে রফতানিমুখী তৈরি পোশাক ও কৃষিজাত পণ্য এখন মাত্র ৪ ঘণ্টায় মোংলা বন্দর থেকে সরাসরি ঢাকার লজিস্টিকস কেন্দ্রে পৌঁছাচ্ছে। এর ফলে বার্ষিক বৈদেশিক বাণিজ্যে উল্লেখযোগ্য সময় ও ব্যয় সাশ্রয় হচ্ছে।

> "লজিস্টিকস খরচ হ্রাস পাওয়া মানেই আমাদের রফতানি পণ্যের বৈশ্বিক প্রতিযোগিতা সক্ষমতা বহুগুণ বৃদ্ধি পাওয়া।"
> — সভাপতি, বিজিএমইএ

মোংলা বন্দর কর্তৃপক্ষের তথ্যমতে, গত এক মাসে কনটেইনার হ্যান্ডলিং বেড়েছে ৩৫ শতাংশ। বন্দরে সার্বক্ষণিক কাস্টমস ক্লিয়ারেন্স সুবিধা নিশ্চিত হওয়ায় বিদেশি শিপিং লাইনগুলো নতুন ফিডার ভ্যাসেল চালুর আগ্রহ প্রকাশ করেছে।`,
    contentEn: `Following the operational success of the Padma Bridge multi-modal corridor, southern Bangladesh is witnessing rapid industrial growth with 40 new joint venture facilities launching operations.`,
    category: 'economy',
    categoryName: 'বাণিজ্য',
    categoryNameEn: 'Business',
    subcategory: 'শিল্প ও বাণিজ্য',
    subcategorySlug: 'trade',
    authorId: 'rep-02',
    author: 'ফারহানা ইসলাম তন্বী',
    authorSlug: 'farhana-islam-tonny',
    authorRole: 'জ্যেষ্ঠ প্রতিবেদক (বাণিজ্য ও অর্থনীতি)',
    reporterName: 'ফারহানা ইসলাম তন্বী, জ্যেষ্ঠ প্রতিবেদক',
    image: '/src/assets/images/padma_bridge_river_shipping_1794291831460.jpg',
    imageCaption: 'পদ্মা নদীর ওপর বিস্তৃত আধুনিক সেতু ও নৌবাণিজ্য রুট।',
    imageCredit: 'ছবি: সেতু কর্তৃপক্ষ / নিউজফ্লো',
    publishedAt: '2026-11-10T07:45:00Z',
    updatedAt: '2026-11-10T09:30:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 19900,
    shares: 810,
    tags: ['পদ্মা সেতু', 'অর্থনীতি', 'মোংলা', 'রফতানি', 'বাণিজ্য'],
    status: 'under_review',
    submittedAt: '2026-11-10T07:45:00Z',
    reviewerInfo: {
      reviewedBy: 'ফারহানা ইসলাম তন্বী',
      reviewerRole: 'editor',
      reviewedAt: '2026-11-10T08:15:00Z',
      lastAction: 'পর্যালোচনাধীন'
    },
    statusHistory: [
      {
        id: 'h2',
        fromStatus: 'submitted',
        toStatus: 'under_review',
        actionBy: 'ফারহানা ইসলাম তন্বী',
        role: 'editor',
        timestamp: '2026-11-10T08:15:00Z',
        comments: 'অর্থনীতি ও মোংলা বন্দরের রফতানি পরিসংখ্যান যাচাই চলছে'
      }
    ],
    commentsList: [
      {
        id: 'c-biz-1',
        author: 'মাহবুব আলম',
        time: '৪৫ মিনিট আগে',
        text: 'মোংলা বন্দরের আধুনিকায়ন দেশের অর্থনীতির নতুন প্রাণ সঞ্চার করেছে।',
        likes: 12
      }
    ]
  },

  // 4. TECHNOLOGY
  {
    id: 'news-04',
    slug: 'bangladeshi-ai-startups-shine-globally-100m-investment',
    title: 'আন্তর্জাতিক বাজারে বাংলাদেশী সফটওয়্যার ও এআই স্টার্টআপের চমক: ১০০ মিলিয়ন ডলার বিনিয়োগ প্রস্তাব',
    titleEn: 'Bangladeshi Software & AI Startups Shine Globally: $100M Venture Investment Pledges',
    subheadline: 'সিলিকন ভ্যালি ও সিঙ্গাপুরের শীর্ষ ভিসি ফান্ডগুলোর সাথে চুক্তি স্বাক্ষর করল ঢাকার ৫ টেক কোম্পানি',
    excerpt: 'ঢাকার কারওয়ান বাজার ও বনানীর প্রযুক্তি হাব থেকে বিশ্বখ্যাত টেক জায়ান্টদের জন্য ক্লাউড সফটওয়্যার ও ডাটা মডেল তৈরি করছেন তরুণ প্রকৌশলীরা।',
    excerptEn: 'Young Bangladeshi software engineers from Dhaka tech parks attract $100M in venture backing for cutting-edge AI software solutions.',
    content: `বিশ্বের শীর্ষস্থানীয় প্রযুক্তি সম্মেলনে অংশ নিয়ে বাংলাদেশী পাঁচটি কৃত্রিম বুদ্ধিমত্তা স্টার্টআপ যৌথভাবে ১০০ মিলিয়ন ডলারেরও বেশি বিনিয়োগের আগ্রহপত্র পেয়েছে। সফটওয়্যার রফতানি খাতে ২০২৬ সালে বাংলাদেশ ৫ বিলিয়ন ডলার আয়ের লক্ষ্যমাত্রা ছাড়িয়ে যাওয়ার পথে রয়েছে।

বিশেষজ্ঞদের মতে, দেশের বিশ্ববিদ্যালয়গুলোতে কম্পিউটার বিজ্ঞান ও মেশিন লার্নিং শিক্ষার আধুনিকায়ন এবং ইন্টারনেট কানেক্টিভিটি গ্রাম পর্যায় পর্যন্ত বিস্তৃত হওয়ার ফলেই আজকের এই সাফল্য। ফ্রিল্যান্সিং থেকে তরুণরা এখন নিজেদের স্বত্বাধিকারী সফটওয়্যার কোম্পানিতে রূপান্তরিত হচ্ছেন।

> "আমাদের তরুণরা এখন কেবল কোড লিখছে না, বরং বিশ্বমানের লার্জ ল্যাঙ্গুয়েজ মডেল এবং স্বাস্থ্য-প্রযুক্তি সমাধান উদ্ভাবন করছে।"
> — নাসরিন সুলতানা, প্রযুক্তি সম্পাদক

বিনিয়োগ পাওয়া প্রতিষ্ঠানগুলো মূলত ফিনটেক, এআই মেডিকেল ডায়াগনস্টিকস এবং সাপ্লাই চেইন অপটিমাইজেশন নিয়ে কাজ করছে।`,
    contentEn: `At leading global tech summits, Bangladeshi AI startups have received landmark investment pledges. Software exports are well on track to surpass previous national milestones.`,
    category: 'technology',
    categoryName: 'প্রযুক্তি',
    categoryNameEn: 'Technology',
    subcategory: 'স্টার্টআপ ও ইনোভেশন',
    subcategorySlug: 'startups',
    authorId: 'rep-04',
    author: 'নাসরিন সুলতানা',
    authorSlug: 'nasreen-sultana',
    authorRole: 'প্রযুক্তি ও জীবনযাপন সম্পাদক',
    reporterName: 'নাসরিন সুলতানা, প্রযুক্তি সম্পাদক',
    image: '/src/assets/images/bangladesh_tech_hub_1794291831587.jpg',
    imageCaption: 'ঢাকার একটি উদ্ভাবনী সফটওয়্যার ল্যাবে প্রকৌশলীদের ব্যস্ততা।',
    imageCredit: 'ছবি: নিউজফ্লো টেক হাব',
    publishedAt: '2026-11-10T06:50:00Z',
    updatedAt: '2026-11-10T08:15:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 21400,
    shares: 1180,
    tags: ['আইটি', 'এআই', 'স্টার্টআপ', 'প্রযুক্তি', 'বিনিয়োগ'],
    status: 'returned',
    submittedAt: '2026-11-10T06:50:00Z',
    reviewerInfo: {
      reviewedBy: 'মোঃ লুৎফর রহমান',
      reviewerRole: 'editor_in_chief',
      reviewedAt: '2026-11-10T07:30:00Z',
      lastAction: 'সংশোধনে ফেরত'
    },
    editorialFeedback: [
      {
        id: 'fb-1',
        author: 'মোঃ লুৎফর রহমান',
        role: 'editor_in_chief',
        message: 'অনুগ্রহ করে ৩ নম্বর অনুচ্ছেদে ভিসি ফান্ডগুলোর সুনির্দিষ্ট নাম এবং ১০০ মিলিয়ন ডলার বিনিয়োগের সময়কাল উল্লেখ করুন।',
        timestamp: '2026-11-10T07:30:00Z',
        type: 'revision_request'
      }
    ],
    statusHistory: [
      {
        id: 'h3',
        fromStatus: 'under_review',
        toStatus: 'returned',
        actionBy: 'মোঃ লুৎফর রহমান',
        role: 'editor_in_chief',
        timestamp: '2026-11-10T07:30:00Z',
        comments: 'বিনিয়োগ সংক্রান্ত তথ্যসূত্রের অতিরিক্ত ব্যাখ্যা প্রয়োজন'
      }
    ],
    commentsList: [
      {
        id: 'c-tech-1',
        author: 'প্রকৌশলী সাজিদ',
        time: '২ ঘণ্টা আগে',
        text: 'বাংলাদেশী প্রকৌশলীদের মেধার বিশ্ব স্বীকৃতি দেখে গর্ববোধ হচ্ছে। এআই খাতে সরকারি সহায়তা আরো বাড়ানো উচিত।',
        likes: 31
      }
    ]
  },

  // 5. POLITICS
  {
    id: 'news-05',
    slug: 'national-stakeholder-dialogue-election-commission-reform',
    title: 'নির্বাচন কমিশন ও সাংবিধানিক সংস্কারে অংশীজনদের জাতীয় সংলাপ অনুষ্ঠিত',
    titleEn: 'National Stakeholder Dialogue on Election Commission and Constitutional Reforms',
    subheadline: 'নাগরিক সমাজের সাথে গোলটেবিল বৈঠকে স্বচ্ছ নির্বাচনী রোডম্যাপ ও প্রযুক্তিনির্ভর মনিটরিংয়ের প্রস্তাব',
    excerpt: 'সুশীল সমাজ ও নাগরিক প্রতিনিধিদের সাথে জাতীয় সংলাপে অবাধ ও নিরপেক্ষ নির্বাচন নিশ্চিত করতে সময়োপযোগী আচরণবিধি এবং কঠোর জবাবদিহিতার তাগিদ দেওয়া হয়েছে।',
    excerptEn: 'Civil society dialogue urges clear electoral roadmaps, updated codes of conduct, and stringent institutional accountability.',
    content: `একটি অবাধ, নিরপেক্ষ ও বিশ্বাসযোগ্য নির্বাচন ব্যবস্থা নিশ্চিত করতে নির্বাচন কমিশন সংস্কার বিষয়ক নাগরিক সংলাপ আজ রাজধানীতে অনুষ্ঠিত হয়েছে। সংলাপে প্রবাসীদের ভোটাধিকার কার্যকর করা, নির্বাচনী প্রচারণায় কৃত্রিম বুদ্ধিমত্তার অপব্যবহার রোধ এবং কঠোর আর্থিক স্বচ্ছতার বিধান রাখার সুপারিশ করা হয়।

বিশিষ্ট রাষ্ট্রবিজ্ঞানী ও নাগরিক প্ল্যাটফর্মের সংগঠকরা বলেন, "জনগণের আস্থার ওপর দাঁড়িয়ে থাকা রাষ্ট্রকাঠামো নির্মাণে নির্বাচন কমিশনকে সম্পূর্ণ স্বাধীন কর্তৃত্ব ও প্রশাসনিক ক্ষমতা প্রদান করতে হবে।" কমিশন সদস্যরা জানান, প্রাপ্ত সব গঠনমূলক মতামত বিবেচনায় নিয়ে চূড়ান্ত খসড়া আইন মন্ত্রণালয়ে প্রেরণ করা হবে।

> "গণতান্ত্রিক অগ্রযাত্রার মূল ভিত্তি হলো জনগণের নিঃশঙ্ক ভোটাধিকার।"
> — মোঃ লুৎফর রহমান, প্রধান সম্পাদক

সংলাপে বিভিন্ন রাজনৈতিক দলের শীর্ষ প্রতিনিধিবৃন্দ ও নাগরিক অধিকার কর্মীরা অংশ নেন। আগামী সপ্তাহে বিভাগীয় শহরগুলোতেও অনুরূপ সংলাপ আয়োজিত হবে।`,
    contentEn: `Consultations with civic leaders and experts emphasized modernized voting safeguards, transparent audit trails, and expatriate voting rights.`,
    category: 'politics',
    categoryName: 'রাজনীতি',
    categoryNameEn: 'Politics',
    subcategory: 'নির্বাচন',
    subcategorySlug: 'election',
    authorId: 'rep-01',
    author: 'মোঃ লুৎফর রহমান',
    authorSlug: 'md-lutfor-rahman',
    authorRole: 'প্রধান সম্পাদক',
    reporterName: 'মোঃ লুৎফর রহমান, প্রধান সম্পাদক',
    image: '/src/assets/images/bangladesh_politics_conference_1794293624945.jpg',
    imageCaption: 'রাজধানীর মিলনায়তনে নাগরিক সংলাপে বক্তব্য রাখছেন প্যানেল আলোচকবৃন্দ।',
    imageCredit: 'ছবি: নিউজফ্লো ব্যুরো',
    publishedAt: '2026-11-10T05:20:00Z',
    updatedAt: '2026-11-10T07:10:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 18900,
    shares: 670,
    tags: ['নির্বাচন', 'রাজনীতি', 'সংস্কার', 'সংলাপ', 'সংবিধান'],
    status: 'approved',
    submittedAt: '2026-11-10T05:20:00Z',
    approvedAt: '2026-11-10T06:15:00Z',
    reviewerInfo: {
      reviewedBy: 'ফারহানা ইসলাম তন্বী',
      reviewerRole: 'editor',
      reviewedAt: '2026-11-10T06:15:00Z',
      lastAction: 'অনুমোদিত'
    },
    statusHistory: [
      {
        id: 'h4',
        fromStatus: 'under_review',
        toStatus: 'approved',
        actionBy: 'ফারহানা ইসলাম তন্বী',
        role: 'editor',
        timestamp: '2026-11-10T06:15:00Z',
        comments: 'নির্বাচনী সংস্কার ও রাজনৈতিক সংলাপ রিপোর্টটি তথ্যগতভাবে নির্ভুল'
      }
    ],
    commentsList: []
  },

  // 6. ENTERTAINMENT
  {
    id: 'news-06',
    slug: '24th-dhaka-international-film-festival-celebrating-asian-cinema',
    title: 'ঢাকায় পর্দা উঠল ২৪তম আন্তর্জাতিক চলচ্চিত্র উৎসবের: এশিয়ান সিনেমার মহোৎসব',
    titleEn: '24th Dhaka International Film Festival Opens: Celebrating Vibrant Asian Cinema',
    subheadline: 'জাতীয় জাদুঘর ও শিল্পকলা একাডেমিতে ৭ দিনব্যাপী প্রদর্শিত হবে ৭০টি দেশের ২৫০টি চলচ্চিত্র',
    excerpt: 'দেশবরেণ্য নির্মাতা, জুরিবৃন্দ এবং আন্তর্জাতিক তারকাদের উপস্থিতিতে উৎসবের উদ্বোধন। স্বাধীন নির্মাতাদের জন্য থাকছে বিশেষ অনুদান ও মাস্টারক্লাস।',
    excerptEn: 'Over 250 feature films and documentaries from 70 nations to screen during the 7-day festival in Dhaka.',
    content: `উৎসবমুখর পরিবেশে পর্দা উঠল ঢাকা আন্তর্জাতিক চলচ্চিত্র উৎসবের ২৪তম আসরের। উদ্বোধন অনুষ্ঠানে উপস্থিত ছিলেন দেশবরেণ্য অভিনয়শিল্পী, নির্মাতা ও আন্তর্জাতিক জুরিবৃন্দ। তরুণ নির্মাতাদের তৈরি স্বাধীন চলচ্চিত্রের জন্য রাখা হয়েছে বিশেষ প্রদর্শনী।

উৎসব পরিচালক জানান, এবার এশিয়ান সিনেমা কম্পিটিশন বিভাগে বাংলাদেশের তিনটি চলচ্চিত্র চূড়ান্ত মনোনয়ন পেয়েছে। সাধারণ দর্শকরা নামমাত্র রেজিস্ট্রেশনে বিশ্বমানের সিনেমা উপভোগ করতে পারবেন।

চলচ্চিত্র উৎসবে রয়েছে নারী নির্মাতাদের নিয়ে বিশেষ সেমিনার 'উইমেন ইন সিনেমা'। সপ্তাহজুড়ে জাতীয় জাদুঘর মিলনায়তন ও আলিয়ঁস ফ্রঁসেজে দর্শনার্থীদের মিলনমেলা বসবে।`,
    contentEn: `The 24th Dhaka International Film Festival commenced today with an opening ceremony celebrating independent South Asian filmmakers and international juries.`,
    category: 'entertainment',
    categoryName: 'বিনোদন',
    categoryNameEn: 'Entertainment',
    subcategory: 'চলচ্চিত্র',
    subcategorySlug: 'cinema',
    authorId: 'rep-04',
    author: 'নাসরিন সুলতানা',
    authorSlug: 'nasreen-sultana',
    authorRole: 'বিনোদন প্রতিনিধি',
    reporterName: 'নাসরিন সুলতানা, ফিচার প্রতিনিধি',
    image: '/src/assets/images/dhaka_film_festival_stage_1794293638525.jpg',
    imageCaption: 'উদ্বোধনী সন্ধ্যায় শিল্পকলা একাডেমি মিলনায়তনে বিশিষ্ট অতিথিবৃন্দ ও শিল্পীগণ।',
    imageCredit: 'ছবি: উৎসব কমিটি / নিউজফ্লো',
    publishedAt: '2026-11-10T04:40:00Z',
    updatedAt: '2026-11-10T06:00:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 14500,
    shares: 490,
    tags: ['চলচ্চিত্র', 'সংস্কৃতি', 'উৎসব', 'ঢাকা', 'বিনোদন'],
    status: 'draft',
    statusHistory: [
      {
        id: 'h5',
        fromStatus: 'draft',
        toStatus: 'draft',
        actionBy: 'নাসরিন সুলতানা',
        role: 'reporter',
        timestamp: '2026-11-10T04:40:00Z',
        comments: 'চলচ্চিত্র উৎসব উদ্বোধনী খসড়া তৈরি'
      }
    ],
    commentsList: []
  },

  // 7. LIFESTYLE
  {
    id: 'news-07',
    slug: 'tourist-influx-coxs-bazar-saint-martin-eco-coastal-travel',
    title: 'পর্যটন মৌসুমে কক্সবাজার ও সেন্টমার্টিনে পর্যটকদের ঢল: পরিবেশবান্ধব ভ্রমণের বার্তা',
    titleEn: 'Tourist Influx at Cox’s Bazar and Saint Martin: Promoting Eco-Friendly Coastal Travel',
    subheadline: 'বিশ্বের দীর্ঘতম সমুদ্র সৈকতে শীতকালীন অবসর উদযাপনে লাখো ভ্রমণপিপাসু, জোরদার নিরাপত্তা ব্যবস্থা',
    excerpt: 'স্বচ্ছ নীল জলরাশি ও সূর্যাস্তের মনোরম দৃশ্য উপভোগ করতে পর্যটকদের ভিড়। একক ব্যবহারযোগ্য প্লাস্টিক বর্জ্য বন্ধে হোটেল মালিক ও প্রশাসনের যৌথ নজরদারি।',
    excerptEn: 'Winter holidaymakers flock to coastal beaches while hotel associations and authorities enforce zero-plastic eco guidelines.',
    content: `শীতের মিষ্টি কুয়াশা ভেদ করে সূর্য ওঠার সাথে সাথেই কক্সবাজারের লাবণী, সুগন্ধা ও ইনানী সৈকতে পর্যটকদের পদচারণায় মুখরিত হয়ে উঠেছে। পর্যটন সংশ্লিষ্ট ব্যবসায়ীরা জানিয়েছেন, আগামী এক মাসের জন্য উপকূলবর্তী বেশিরভাগ হোটেল ও রিসোর্ট পূর্ণ বুকিং রয়েছে।

জেলা প্রশাসনের উদ্যোগে সৈকতের পরিচ্ছন্নতা রক্ষায় এবার কঠোর পরিবেশ নির্দেশিকা জারি করা হয়েছে। সমুদ্র সৈকতে কোনো ধরনের প্লাস্টিক বোতল ও পলিথিন ফেলা নিষিদ্ধ করা হয়েছে। পর্যটকদের নিরাপত্তায় সার্বক্ষণিক টহলে নিয়োজিত রয়েছে বিচ পুলিশ ও লাইফগার্ড দল।

স্থানীয় সামুদ্রিক মাছ ও ঐতিহ্যবাহী চাটগাঁইয়া খাবারের স্বাদ নিতে রেস্তোরাঁগুলোতে ভ্রমণপিপাসুদের দীর্ঘ লাইন দেখা গেছে। সেন্টমার্টিন দ্বীপে পরিমিতসংখ্যক পর্যটক পাঠানোর নীতি কার্যকর করা হয়েছে।`,
    contentEn: `Cox's Bazar and surrounding coastal islands are buzzing with travelers enjoying the serene beaches and authentic seafood cuisine, guided by responsible tourism standards.`,
    category: 'lifestyle',
    categoryName: 'জীবনযাপন',
    categoryNameEn: 'Lifestyle',
    subcategory: 'ভ্রমণ ও পর্যটন',
    subcategorySlug: 'travel',
    authorId: 'rep-02',
    author: 'ফারহানা ইসলাম তন্বী',
    authorSlug: 'farhana-islam-tonny',
    authorRole: 'ফিচার ও ভ্রমণ প্রতিবেদক',
    reporterName: 'ফারহানা ইসলাম তন্বী, ভ্রমণ প্রতিবেদক',
    image: '/src/assets/images/cox_bazar_beach_sunset_1794293651808.jpg',
    imageCaption: 'কক্সবাজার সমুদ্র সৈকতে গোধূলি লগ্নে সাম্পান নৌকা ও ভ্রমণপিপাসুদের আনন্দঘন মুহূর্ত।',
    imageCredit: 'ছবি: জেলা প্রশাসন / নিউজফ্লো',
    publishedAt: '2026-11-10T03:50:00Z',
    updatedAt: '2026-11-10T05:15:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 16700,
    shares: 720,
    tags: ['কক্সবাজার', 'পর্যটন', 'ভ্রমণ', 'জীবনযাপন', 'সেন্টমার্টিন'],
    status: 'scheduled',
    scheduledAt: '2026-11-11T09:00:00Z',
    reviewerInfo: {
      reviewedBy: 'মোঃ লুৎফর রহমান',
      reviewerRole: 'editor_in_chief',
      reviewedAt: '2026-11-10T04:00:00Z',
      lastAction: 'শিডিউল্ড'
    },
    statusHistory: [
      {
        id: 'h6',
        fromStatus: 'approved',
        toStatus: 'scheduled',
        actionBy: 'মোঃ লুৎফর রহমান',
        role: 'editor_in_chief',
        timestamp: '2026-11-10T04:00:00Z',
        comments: 'কাল সকাল ৯টায় পর্যটন বিশেষ ফিচারে স্বয়ংক্রিয় প্রকাশ'
      }
    ],
    commentsList: []
  },

  // 8. WORLD / INTERNATIONAL
  {
    id: 'news-08',
    slug: 'historic-climate-pact-un-summit-direct-loss-damage-funding',
    title: 'জাতিসংঘ জলবায়ু সম্মেলনে ক্ষতিগ্রস্ত দেশগুলোর জন্য জরুরি অর্থায়নের ঐতিহাসিক চুক্তি',
    titleEn: 'Historic Climate Pact at UN Summit: Urgent Financing for Vulnerable Delta Nations',
    subheadline: 'উপকূলীয় ভাঙন ও প্রাকৃতিক দুর্যোগ মোকাবেলায় সরাসরি ক্ষতিপূরণ তহবিল বরাদ্দের সিদ্ধান্ত',
    excerpt: 'দীর্ঘ দরকষাকষির পর জেনেভায় অনুষ্ঠিত বিশ্ব জলবায়ু অধিবেশনে উন্নয়নশীল দেশগুলোর ন্যায্য হিস্যা আদায়ে সম্মতি জানিয়েছে উন্নত বিশ্ব।',
    excerptEn: 'After intensive negotiations, UN climate summit delegates agree to direct loss-and-damage fund disbursements for delta nations.',
    content: `জাতিসংঘের বিশেষ জলবায়ু অধিবেশনে ক্ষতিগ্রস্ত ডেল্টা ও উপকূলীয় অঞ্চলের সুরক্ষায় ১০০ বিলিয়ন ডলারের বৈশ্বিক ক্ষতিপূরণ ফ্রেমওয়ার্ক অনুমোদন পেয়েছে। বাংলাদেশের প্রতিনিধিদল এই চুক্তির রূপরেখা প্রণয়নে অন্যতম প্রধান সমন্বয়কের ভূমিকা পালন করেছে।

আন্তর্জাতিক বিশ্লেষকরা এই চুক্তিকে পরিবেশ ন্যায়বিচারের ক্ষেত্রে একটি যুগান্তকারী মাইলফলক হিসেবে অভিহিত করেছেন। তহবিলের প্রথম কিস্তি আগামী বছরের প্রথমার্ধে ঝুঁকিপূর্ণ উপকূলীয় এলাকায় বাঁধ পুনর্নির্মাণ ও বনায়নে ব্যয় করা হবে।

সম্মেলনে অংশ নেওয়া বিশ্বনেতারা একমত হয়েছেন যে, বৈশ্বিক উষ্ণতা বৃদ্ধি ১.৫ ডিগ্রির মধ্যে সীমাবদ্ধ রাখতে হলে কার্বন নিঃসরণ হ্রাসে তাৎক্ষণিক কঠোর পদক্ষেপ গ্রহণ করতে হবে।`,
    contentEn: `Global delegates reached an accord on direct climate adaptation grants, providing vital funding for delta protection and flood defenses.`,
    category: 'international',
    categoryName: 'বিশ্ব সংবাদ',
    categoryNameEn: 'World',
    subcategory: 'ইউরোপ',
    subcategorySlug: 'europe',
    authorId: 'rep-01',
    author: 'মোঃ লুৎফর রহমান',
    authorSlug: 'md-lutfor-rahman',
    authorRole: 'প্রধান সম্পাদক',
    reporterName: 'মোঃ লুৎফর রহমান, বিশেষ দূত',
    image: '/src/assets/images/editorial_video_journalism_1794293666196.jpg',
    imageCaption: 'আন্তর্জাতিক সংবাদ বুলেটিনে বিশ্ব জলবায়ু চুক্তি সম্প্রচার।',
    imageCredit: 'ছবি: ইউএন ক্লাইমেট / নিউজফ্লো স্টুডিও',
    publishedAt: '2026-11-10T02:30:00Z',
    updatedAt: '2026-11-10T04:20:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 13200,
    shares: 410,
    tags: ['জলবায়ু', 'জাতিসংঘ', 'আন্তর্জাতিক', 'বিশ্ব', 'পরিবেশ'],
    status: 'rejected',
    reviewerInfo: {
      reviewedBy: 'ফারহানা ইসলাম তন্বী',
      reviewerRole: 'editor',
      reviewedAt: '2026-11-10T03:00:00Z',
      lastAction: 'প্রত্যাখ্যাত'
    },
    editorialFeedback: [
      {
        id: 'fb-2',
        author: 'ফারহানা ইসলাম তন্বী',
        role: 'editor',
        message: 'জাতিসংঘের জলবায়ু চুক্তির আন্তর্জাতিক খসড়ার তথ্যসূত্র এখনও অসম্পূর্ণ এবং এতে সত্যতা যাচাইয়ের ঘাটতি রয়েছে।',
        timestamp: '2026-11-10T03:00:00Z',
        type: 'rejection_notice'
      }
    ],
    statusHistory: [
      {
        id: 'h7',
        fromStatus: 'under_review',
        toStatus: 'rejected',
        actionBy: 'ফারহানা ইসলাম তন্বী',
        role: 'editor',
        timestamp: '2026-11-10T03:00:00Z',
        comments: 'তথ্যের উৎস অপর্যাপ্ত ও যাচাইহীন'
      }
    ],
    commentsList: []
  },

  // 9. OPINION / EDITORIAL
  {
    id: 'news-09',
    slug: 'editorial-institutional-governance-transparency-sustainable-growth',
    title: 'সম্পাদকীয়: টেকসই অর্থনৈতিক প্রবৃদ্ধি অর্জনে প্রাতিষ্ঠানিক সুশাসন ও স্বচ্ছতা অপরিহার্য',
    titleEn: 'Editorial: Institutional Governance and Transparency Essential for Sustainable Growth',
    subheadline: 'ব্যাংকিং খাত সংস্কার ও রাজস্ব আদায়ে ডিজিটালাইজেশন গতিশীল করার বিকল্প নেই',
    excerpt: 'একটি দেশের দীর্ঘমেয়াদী উন্নয়ন কেবল অবকাঠামো নির্মাণের ওপর নির্ভর করে না; বরং রাষ্ট্রীয় প্রতিষ্ঠানগুলোর স্বচ্ছতা, আইনের শাসন ও জনমুখী নীতির ওপর নির্ভরশীল।',
    excerptEn: 'Long-term national progress hinges on institutional accountability, rule of law, and fair public policies.',
    content: `আমাদের সামগ্রিক অর্থনৈতিক যাত্রায় অবকাঠামোগত উন্নয়ন আজ দৃশ্যমান। পদ্মা সেতু, মেট্রোরেল কিংবা এক্সপ্রেসওয়ে যোগাযোগ ব্যবস্থাকে অভূতপূর্ব গতি দিয়েছে। তবে এই অগ্রগতিকে দীর্ঘস্থায়ী করতে হলে এখন সবচেয়ে বেশি নজর দিতে হবে প্রাতিষ্ঠানিক সংস্কারে।

ব্যাংকিং খাতে সুশাসন প্রতিষ্ঠা, খেলাপি ঋণ আদায়ে আপসহীন পদক্ষেপ এবং কর ব্যবস্থাকে শতভাগ ডিজিটাল রূপান্তর এখন সময়ের দাবি। যখন একজন সাধারণ উদ্যোক্তা কোনো ধরনের হয়রানি ছাড়াই ব্যবসা শুরু করতে পারবেন, তখনই দেশের প্রকৃত মেধার বিকাশ ঘটবে।

আইনের শাসন ও দুর্নীতিমুক্ত প্রশাসনিক ব্যবস্থাপনা নিশ্চিত করা গেলে দেশি-বিদেশি প্রত্যক্ষ বিনিয়োগের জোয়ার তৈরি হবে। রাষ্ট্রকে প্রতিটি নাগরিকের মৌলিক অধিকার ও নাগরিক সেবার নিশ্চয়তা দিতে হবে।`,
    contentEn: `Building a just society requires deep structural reforms across the financial sector, judiciary, and civil administration.`,
    category: 'opinion',
    categoryName: 'মতামত',
    categoryNameEn: 'Opinion',
    subcategory: 'সম্পাদকীয়',
    subcategorySlug: 'editorial',
    authorId: 'rep-01',
    author: 'মোঃ লুৎফর রহমান',
    authorSlug: 'md-lutfor-rahman',
    authorRole: 'প্রধান সম্পাদক ও জ্যেষ্ঠ কলামিস্ট',
    reporterName: 'মোঃ লুৎফর রহমান, প্রধান সম্পাদক',
    image: '/src/assets/images/bangladesh_politics_conference_1794293624945.jpg',
    imageCaption: 'সুশাসন ও অর্থনৈতিক নীতি নিয়ে জাতীয় সেমিনার।',
    imageCredit: 'ছবি: নিউজফ্লো আর্কাইভ',
    publishedAt: '2026-11-10T01:45:00Z',
    updatedAt: '2026-11-10T03:30:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: true,
    views: 17800,
    shares: 890,
    tags: ['সম্পাদকীয়', 'সুশাসন', 'অর্থনীতি', 'মতামত', 'সংস্কার'],
    status: 'archived',
    statusHistory: [
      {
        id: 'h8',
        fromStatus: 'published',
        toStatus: 'archived',
        actionBy: 'মোঃ লুৎফর রহমান',
        role: 'editor_in_chief',
        timestamp: '2026-11-10T02:00:00Z',
        comments: 'আর্কাইভে সংরক্ষণ করা হলো'
      }
    ],
    commentsList: []
  },

  // 10. BANGLADESH (ADDITIONAL)
  {
    id: 'news-10',
    slug: 'chittagong-port-bay-terminal-automation-container-handling',
    title: 'চট্টগ্রাম বন্দর বে-টার্মিনাল অটোমেশন: জাহাজজট শূন্যের কোঠায় নামিয়ে আনার লক্ষ্য',
    titleEn: 'Chittagong Port Bay Terminal Automation: Zero Anchorage Congestion in Target',
    subheadline: 'নতুন স্ক্যানার ও এআই টার্মিনাল অপারেটিং সিস্টেমে খালাসের গতি বাড়ল ৬০ শতাংশ',
    excerpt: 'দেশের প্রধান সমুদ্রবন্দরে যুক্ত হচ্ছে নতুন প্রজন্মের কনটেইনার স্ক্যানার এবং স্বয়ংক্রিয় গেটওয়ে। বিদেশী জাহাজগুলোর টার্ন-অ্যারাউন্ড সময় ২৪ ঘণ্টায় নেমে এসেছে।',
    excerptEn: 'Automated terminal operating systems boost container velocity by 60% at Bangladesh’s primary maritime gateway.',
    content: `দেশের প্রধান সমুদ্রবন্দর চট্টগ্রামে আধুনিক প্রযুক্তির সমন্বয়ে কনটেইনার হ্যান্ডলিংয়ে নতুন মাইলফলক অর্জিত হয়েছে। বন্দর কর্তৃপক্ষ জানিয়েছে, নতুন অটোমেটেড গেট সিস্টেম ও ডিজিটাল ভেহিকল ট্র্যাকিং চালুর ফলে বহির্নোঙরে জাহাজের গড় অপেক্ষার সময় নেমে এসেছে শূন্যে।

বাণিজ্যিক প্রতিনিধিরা বলছেন, এর ফলে রফতানিকারকদের অতিরিক্ত বিলম্ব ফি গুনতে হচ্ছে না এবং আমদানিকৃত কাঁচামাল তাৎক্ষণিকভাবে কারখানায় পৌঁছাচ্ছে।`,
    contentEn: `Turnaround times at Chittagong seaport have fallen sharply following the introduction of smart gate systems and paperless clearance.`,
    category: 'bangladesh',
    categoryName: 'বাংলাদেশ',
    categoryNameEn: 'Bangladesh',
    subcategory: 'সারাদেশ',
    subcategorySlug: 'national',
    authorId: 'rep-05',
    author: 'কামরুল হাসান রাসেল',
    authorSlug: 'kamrul-hasan-russell',
    authorRole: 'নিজস্ব প্রতিবেদক (নগর ও যোগাযোগ)',
    reporterName: 'কামরুল হাসান রাসেল, নিজস্ব প্রতিবেদক',
    image: '/src/assets/images/padma_bridge_river_shipping_1794291831460.jpg',
    imageCaption: 'চট্টগ্রাম বন্দর জেটিতে বিশালাকার কনটেইনারবাহী জাহাজের মালামাল খালাস।',
    imageCredit: 'ছবি: বন্দর কর্তৃপক্ষ / নিউজফ্লো',
    publishedAt: '2026-11-09T18:20:00Z',
    updatedAt: '2026-11-09T20:00:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: false,
    views: 15400,
    shares: 430,
    tags: ['চট্টগ্রাম', 'বন্দর', 'বাণিজ্য', 'বাংলাদেশ', 'যোগাযোগ'],
    status: 'published',
    commentsList: []
  },

  // 11. SPORTS (ADDITIONAL)
  {
    id: 'news-11',
    slug: 'bpl-t20-grand-auction-young-talents-record-bids',
    title: 'বিপিএল টি-টোয়েন্টি নিলামে নতুন তারকার চমক: কোটি টাকার ক্লাবে তরুণ অলরাউন্ডার',
    titleEn: 'BPL T20 Grand Auction: Young All-Rounder Enters Crore Club Amid Fierce Bidding',
    subheadline: 'দেশি ও বিদেশি তারকা ক্রিকেটারদের নিয়ে ৬ ফ্র্যাঞ্চাইজির দল গঠন সম্পন্ন',
    excerpt: 'বাংলাদেশ প্রিমিয়ার লিগের আসন্ন আসরকে ঘিরে ক্রীড়ামোদীদের মধ্যে তুমুল উত্তেজনা। স্থানীয় প্রথম শ্রেণির ক্রিকেট থেকে উঠে আসা ৫ পেসার ডাক পেলেন ফ্র্যাঞ্চাইজিতে।',
    excerptEn: 'Excitement surges as six franchises finalize rosters for the upcoming season of Bangladesh Premier League.',
    content: `রাজধানীর একটি অভিজাত হোটেলে অনুষ্ঠিত হলো বাংলাদেশ প্রিমিয়ার লিগ (বিপিএল) টি-টোয়েন্টির একাদশ আসরের খেলোয়াড় নিলাম। দেশি তরুণ প্রতিভা ও আন্তর্জাতিক তারকাদের ঘিরে ফ্র্যাঞ্চাইজিগুলোর মধ্যে হাড্ডাহাড্ডি লড়াই দেখা গেছে।

সবচেয়ে বড় চমক সৃষ্টি করেছেন অনুর্ধ্ব-১৯ বিশ্বকাপজয়ী তরুণ পেস-অলরাউন্ডার, যাকে ১ কোটি ২০ লাখ টাকায় দলে ভিড়িয়েছে ঢাকা ক্যাপিটালস। টুর্নামেন্ট শুরু হবে আগামী জানুয়ারির প্রথম সপ্তাহে।`,
    contentEn: `Rising domestic performers bagged record bids in the high-stakes auction for the next BPL T20 championship.`,
    category: 'sports',
    categoryName: 'খেলাধুলা',
    categoryNameEn: 'Sports',
    subcategory: 'ক্রিকেট',
    subcategorySlug: 'cricket',
    authorId: 'rep-03',
    author: 'আহমেদ জাবের',
    authorSlug: 'ahmed-jaber',
    authorRole: 'বিশেষ প্রতিনিধি (খেলাধুলা)',
    reporterName: 'আহমেদ জাবের, বিশেষ প্রতিনিধি',
    image: '/src/assets/images/bangladesh_cricket_match_1794291830719.jpg',
    imageCaption: 'বিপিএল নিলাম অনুষ্ঠানে ফ্র্যাঞ্চাইজি মালিক ও বিসিবি কর্তাবৃন্দ।',
    imageCredit: 'ছবি: বিসিবি / নিউজফ্লো',
    publishedAt: '2026-11-09T16:15:00Z',
    updatedAt: '2026-11-09T18:00:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: false,
    views: 22100,
    shares: 980,
    tags: ['ক্রিকেট', 'বিপিএল', 'টি-টোয়েন্টি', 'বিসিবি'],
    status: 'published',
    commentsList: []
  },

  // 12. ECONOMY (ADDITIONAL)
  {
    id: 'news-12',
    slug: 'bangladesh-bank-foreign-reserve-crosses-20-billion-dollar',
    title: 'কেন্দ্রীয় ব্যাংকের বৈদেশিক মুদ্রার রিজার্ভ ফের ২০ বিলিয়ন ডলার অতিক্রম করল',
    titleEn: 'Bangladesh Bank FX Reserves Cross $20 Billion Milestone on Robust Remittance',
    subheadline: 'প্রবাসী আয়ের ঊর্ধ্বগতি ও রফতানি প্রণোদনায় স্বস্তি ফিরেছে বৈদেশিক লেনদেনের ভারসাম্যে',
    excerpt: 'আইএমএফের বিপিএম-৬ গণনাপদ্ধতি অনুযায়ী দেশের বৈদেশিক মুদ্রার নেট রিজার্ভ ইতিবাচক ধারায় ফিরল। গত মাসে প্রবাসী আয় এসেছে ২.৩ বিলিয়ন ডলার।',
    excerptEn: 'Foreign reserves rebound past $20 billion threshold driven by record worker remittances and export receipts.',
    content: `বাংলাদেশ ব্যাংকের হালনাগাদ তথ্যে দেখা গেছে, আন্তর্জাতিক মুদ্রা তহবিলের (আইএমএফ) মানদণ্ড অনুযায়ী দেশের বৈদেশিক মুদ্রার রিজার্ভ ফের ২০ দশমিক ২ বিলিয়ন ডলারের ঘর অতিক্রম করেছে।

ব্যাংকিং চ্যানেলে ডলারের দর স্থিতিশীল থাকা এবং প্রণোদনা বৃদ্ধির কারণে প্রবাসীরা বৈধ পথে রেমিট্যান্স পাঠাতে উৎসাহিত হচ্ছেন। এর ফলে আমদানি দায় পরিশোধের সক্ষমতা সন্তোষজনক পর্যায়ে পৌঁছেছে।`,
    contentEn: `Healthy remittance inflows pushed Bangladesh's gross and net reserve buffers comfortably above international safety thresholds.`,
    category: 'economy',
    categoryName: 'বাণিজ্য',
    categoryNameEn: 'Business',
    subcategory: 'ব্যাংক ও বীমা',
    subcategorySlug: 'banking',
    authorId: 'rep-02',
    author: 'ফারহানা ইসলাম তন্বী',
    authorSlug: 'farhana-islam-tonny',
    authorRole: 'জ্যেষ্ঠ প্রতিবেদক (বাণিজ্য ও অর্থনীতি)',
    reporterName: 'ফারহানা ইসলাম তন্বী, জ্যেষ্ঠ প্রতিবেদক',
    image: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg',
    imageCaption: 'বাংলাদেশ ব্যাংক কেন্দ্রীয় ভবন ও মতিঝিল বাণিজ্যিক এলাকা।',
    imageCredit: 'ছবি: নিউজফ্লো আর্কাইভ',
    publishedAt: '2026-11-09T14:40:00Z',
    updatedAt: '2026-11-09T15:30:00Z',
    isLead: false,
    isBreaking: false,
    isFeatured: false,
    views: 18700,
    shares: 620,
    tags: ['বাংলাদেশ ব্যাংক', 'রিজার্ভ', 'রেমিট্যান্স', 'অর্থনীতি', 'ব্যাংক'],
    status: 'published',
    commentsList: []
  }
];

export const BREAKING_NEWS_LIST = [
  'ঢাকা মেট্রোরেল লাইন-৬ সম্প্রসারণের কাজ আগামী প্রান্তিকে শুরুর ঘোষণা',
  'মিরপুর টেস্টে অবিশ্বাস্য জয় ছিনিয়ে নিল বাংলাদেশ টাইগার্স',
  'বাংলাদেশ ব্যাংকের বৈদেশিক মুদ্রার রিজার্ভ ফের ২০ বিলিয়ন ডলার অতিক্রম করল',
  'আন্তর্জাতিক বাজারে বাংলাদেশী এআই স্টার্টআপের ১০০ মিলিয়ন ডলার বিনিয়োগ প্রস্তাব',
  'জাতীয় রাজস্ব বোর্ড এনবিআরের অনলাইন ট্যাক্স রিটার্ন জমার সময় বৃদ্ধি'
];

export const BREAKING_NEWS_LIST_EN = [
  'Announcement to commence MRT Line-6 expansion in the coming quarter',
  'Bangladesh Tigers pull off memorable last-over series victory in Mirpur',
  'Bangladesh Bank foreign exchange reserves cross $20 billion threshold',
  '$100 million FDI pledged for leading Bangladeshi AI & tech startups',
  'National Board of Revenue extends deadline for individual online tax returns'
];

export const OPINION_AUTHORS = [
  {
    id: 'col-1',
    name: 'ড. জামিলুর রেজা করিম',
    nameEn: 'Dr. Jamilur Reza Karim',
    designation: 'অর্থনীতিবিদ ও সাবেক গবেষণা পরিচালক, বিআইডিএস',
    topic: 'মূল্যস্ফীতি নিয়ন্ত্রণ ও মুদ্রানীতির সমন্বিত কৌশল',
    topicEn: 'Integrated Strategy for Inflation Control and Monetary Policy',
    quote: 'কেবল সুদের হার বাড়িয়ে মূল্যস্ফীতি রোধ সম্ভব নয়; সরবরাহ শৃঙ্খলের সিন্ডিকেট ভাঙা ও বাজারে প্রতিদ্বন্দ্বিতা নিশ্চিত করাই মূল সমাধান।',
    readTime: '৪ মিনিট পাঠ',
    avatar: '/src/assets/images/bangladesh_politics_conference_1794293624945.jpg'
  },
  {
    id: 'col-2',
    name: 'অধ্যাপক শিরীন আখতার',
    nameEn: 'Prof. Shirin Akhter',
    designation: 'শিক্ষাবিদ ও সমাজ বিশ্লেষক, ঢাকা বিশ্ববিদ্যালয়',
    topic: 'উচ্চশিক্ষার মানোন্নয়ন ও গবেষণা খাতে অর্থায়ন সংকট',
    topicEn: 'Quality of Higher Education and Financing Deficits in National Research',
    quote: 'বিশ্ববিদ্যালয়কে শুধু সনদ বিতরণের কারখানায় পরিণত না করে মৌলিক বিজ্ঞান ও প্রযুক্তির গবেষণাগার হিসেবে গড়ে তুলতে হবে।',
    readTime: '৫ মিনিট পাঠ',
    avatar: '/src/assets/images/dhaka_film_festival_stage_1794293638525.jpg'
  },
  {
    id: 'col-3',
    name: 'ব্যারিস্টার তানভীর আহমেদ',
    nameEn: 'Barrister Tanveer Ahmed',
    designation: 'আইনজীবী, বাংলাদেশ সুপ্রিম কোর্ট',
    topic: 'আইনের শাসন ও নাগরিক অধিকার সুরক্ষায় সাংবিধানিক ভারসাম্য',
    topicEn: 'Rule of Law and Constitutional Checks in Protecting Citizens’ Rights',
    quote: 'আইনের চোখে প্রত্যেকে সমান—এই সাংবিধানিক প্রতিশ্রুতির বাস্তবায়নে বিচার বিভাগের স্বাধীনতা অক্ষুণ্ণ রাখতেই হবে।',
    readTime: '৩ মিনিট পাঠ',
    avatar: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg'
  }
];

export const VIDEO_NEWS_ITEMS = [
  {
    id: 'vid-1',
    title: 'স্টুডিও বুলেটিন: বিশ্ব জলবায়ু চুক্তিতে বাংলাদেশের ঐতিহাসিক ভূমিকা ও কৌশল',
    titleEn: 'Studio Bulletin: Strategic Role of Bangladesh in Historic UN Climate Accord',
    duration: '০৫:৪০',
    durationSeconds: 340,
    presenter: 'নাদিয়া সুলতানা',
    timeAgoBn: '১ ঘণ্টা আগে',
    timeAgoEn: '1 hour ago',
    viewsBn: '৪৫,২০০ বার দেখা হয়েছে',
    viewsEn: '45.2K views',
    thumbnail: '/src/assets/images/editorial_video_journalism_1794293666196.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    summary: 'আন্তর্জাতিক সংবাদ বুলেটিন থেকে সরাসরি সম্প্রচার। জেনেভায় জলবায়ু সমঝোতার খুঁটিনাটি ও অর্থনীতিতে এর সম্ভাব্য সুফল নিয়ে বিস্তারিত আলোচনা।'
  },
  {
    id: 'vid-2',
    title: 'উত্তরা থেকে সাভার: মেট্রোরেল রুট সম্প্রসারণের বিশেষ মাঠ পর্যায়ের ভিডিও চিত্র',
    titleEn: 'Ground Video Report: Metro Rail MRT Line-6 Extension from Uttara to Savar',
    duration: '০৩:১৫',
    durationSeconds: 195,
    presenter: 'কামরুল হাসান রাসেল',
    timeAgoBn: '৩ ঘণ্টা আগে',
    timeAgoEn: '3 hours ago',
    viewsBn: '৬২,১০০ বার দেখা হয়েছে',
    viewsEn: '62.1K views',
    thumbnail: '/src/assets/images/hero_dhaka_metro_bridge_1794291829969.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    summary: 'উত্তরা উত্তর স্টেশন থেকে টঙ্গী জংশন পর্যন্ত প্রস্তাবিত রেললাইন এলাকা এবং ড্রোন ক্যামেরায় ধারণকৃত সামগ্রিক সমীক্ষার চিত্র।'
  },
  {
    id: 'vid-3',
    title: 'মিরপুরের শেষ ওভারের প্রতিটি বলের রোমাঞ্চ ও স্টেডিয়ামের উচ্ছ্বাস',
    titleEn: 'Ball-by-Ball Drama: Last Over Thrills and Wild Celebrations in Mirpur',
    duration: '০৪:২২',
    durationSeconds: 262,
    presenter: 'আহমেদ জাবের',
    timeAgoBn: '৫ ঘণ্টা আগে',
    timeAgoEn: '5 hours ago',
    viewsBn: '৮৯,৪০০ বার দেখা হয়েছে',
    viewsEn: '89.4K views',
    thumbnail: '/src/assets/images/bangladesh_cricket_match_1794291830719.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    summary: 'শেষ ওভারে ১২ রান ডিফেন্ড করার টানটান মুহূর্ত এবং ড্রেসিংরুম থেকে দর্শকদের গ্যালারির বাঁধভাঙা আনন্দের বিশেষ মুহূর্ত।'
  }
];

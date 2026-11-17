import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Filter,
  FileText,
  Share2,
  Mail,
  Megaphone,
  Video,
  ShoppingBag,
  Flame,
  Globe,
  SlidersHorizontal,
  Copy,
  Check,
  Send,
  RotateCcw,
  Bookmark,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Loader2,
  Wand2,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  HelpCircle,
  X
} from 'lucide-react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { useCreateNewsMutation } from '../../store/api/newsApi.js';
import { useRunAiAssistMutation } from '../../store/api/aiApi.js';
import { EDITORIAL_EASE } from '../../components/common/MotionPrimitives.jsx';

// Template Catalog Data
const CONTENT_TEMPLATES = [
  {
    id: 'blog-post',
    title: 'Blog Post',
    titleBn: 'ব্লগ ও ফিচার প্রতিবেদন',
    description: 'Write articles, guides, and tutorials',
    descriptionBn: 'তথ্যবহুল নিবন্ধ, বিশ্লেষণমূলক ফিচার ও দীর্ঘ প্রতিবেদন তৈরি করুন',
    category: 'copywrite',
    badgeCategory: 'Copywrite',
    icon: FileText,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
    accentBorder: 'hover:border-sky-500/50',
    btnVariant: 'filled-purple',
    aiFeature: 'content_quality',
    defaultTone: 'তথ্যবহুল ও প্রমিত বাংলা',
    samplePrompt: 'যেমন: বাংলাদেশে কৃত্রিম বুদ্ধিমত্তার ভবিষ্যৎ ও তরুণদের সুযোগ'
  },
  {
    id: 'social-post',
    title: 'Social Media Post',
    titleBn: 'সোশ্যাল মিডিয়া পোস্ট',
    description: 'Create engaging social content',
    descriptionBn: 'ফেসবুক, এক্স (Twitter), ইনস্টাগ্রামের জন্য ভাইরাল ও আকর্ষণীয় পোস্ট তৈরি করুন',
    category: 'social',
    badgeCategory: 'Social Media',
    icon: Share2,
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    accentBorder: 'hover:border-emerald-500/50',
    btnVariant: 'outline',
    aiFeature: 'headline_suggestions',
    defaultTone: 'রোমাঞ্চকর ও সংবেদনশীল',
    samplePrompt: 'যেমন: বাংলাদেশ বনাম শ্রীলঙ্কা ম্যাচ জয়ের উত্তেজনাপূর্ণ মুহূর্ত'
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing',
    titleBn: 'ইমেইল ও নিউজলেটার',
    description: 'Craft compelling email campaigns',
    descriptionBn: 'আকর্ষণীয় দৈনিক সকালের ব্রিফিং, সাবস্ক্রাইবার নিউজলেটার ও ক্যাম্পেইন মেসেজ',
    category: 'email',
    badgeCategory: 'Email',
    icon: Mail,
    iconBg: 'bg-purple-600',
    iconColor: 'text-white',
    accentBorder: 'hover:border-purple-500/50',
    btnVariant: 'outline',
    aiFeature: 'summarization',
    defaultTone: 'মার্জিত ও সরাসরি কথোপকথন',
    samplePrompt: 'যেমন: আজকের ৫টি প্রধান শীর্ষ সংবাদ ও বিশেষ সম্পাদকীয় মতামত'
  },
  {
    id: 'ad-copy',
    title: 'Ad Copy',
    titleBn: 'বিজ্ঞাপন ও প্রচার কপি',
    description: 'Generate persuasive advertisements',
    descriptionBn: 'সোশ্যাল ও ডিজিটাল বিজ্ঞাপনের জন্য আকর্ষণীয় হেডলাইন, প্রাইমারি টেক্সট ও CTA',
    category: 'copywrite',
    badgeCategory: 'Copywrite',
    icon: Megaphone,
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
    accentBorder: 'hover:border-orange-500/50',
    btnVariant: 'outline',
    aiFeature: 'headline_suggestions',
    defaultTone: 'উচ্চ রূপান্তরকারী ও আকর্ষণীয়',
    samplePrompt: 'যেমন: দৈনিক বার্তা প্রবাহ প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশন অফার'
  },
  {
    id: 'video-script',
    title: 'Video Script',
    titleBn: 'ভিডিও ও রিলস স্ক্রিপ্ট',
    description: 'Write scripts for video content',
    descriptionBn: 'ইউটিউব, ফেসবুক রিলস ও শর্টসের জন্য দৃশ্যপট, হুক এবং ভয়েসওভার স্ক্রিপ্ট',
    category: 'social',
    badgeCategory: 'Social Media',
    icon: Video,
    iconBg: 'bg-pink-600',
    iconColor: 'text-white',
    accentBorder: 'hover:border-pink-500/50',
    btnVariant: 'outline',
    aiFeature: 'transcript_generation',
    defaultTone: 'প্রাণবন্ত, দ্রুতগতির ও গল্পনির্ভর',
    samplePrompt: 'যেমন: ৬০ সেকেন্ডের মধ্যে মেট্রোরেলের নতুন ৫টি স্টেশনের আপডেট'
  },
  {
    id: 'product-description',
    title: 'Product Description',
    titleBn: 'প্রোডাক্ট ও ফিচার বিবরণ',
    description: 'Describe products effectively',
    descriptionBn: 'স্পনসরড পণ্য, নতুন ফিচার বা ই-কমার্স সার্ভিসের তথ্যবহুল আকর্ষণীয় বিবরণ',
    category: 'seo',
    badgeCategory: 'SEO',
    icon: ShoppingBag,
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    accentBorder: 'hover:border-teal-500/50',
    btnVariant: 'outline',
    aiFeature: 'seo_metadata',
    defaultTone: 'গ্রাহকবান্ধব ও সুস্পষ্ট',
    samplePrompt: 'যেমন: প্রতিদিনের ই-পেপার পড়ার অ্যান্ড্রয়েড অ্যাপের নতুন ফিচার'
  },
  {
    id: 'breaking-lead',
    title: 'Breaking News Lead',
    titleBn: 'ব্রেকিং নিউজ লিড ও সারমর্ম',
    description: 'Instant breaking headlines & leads',
    descriptionBn: 'মুহূর্তের খবরকে ৩টি বিকল্প আকর্ষণীয় শিরোনাম ও তাৎক্ষণিক বুলেটিন লিডে রূপান্তর',
    category: 'copywrite',
    badgeCategory: 'Copywrite',
    icon: Flame,
    iconBg: 'bg-rose-600',
    iconColor: 'text-white',
    accentBorder: 'hover:border-rose-500/50',
    btnVariant: 'outline',
    aiFeature: 'headline_suggestions',
    defaultTone: 'জরুরি ও বস্তুনিষ্ঠ সাংবাদিকতা',
    samplePrompt: 'যেমন: জাতীয় সংসদে বাজেট পাস: এক নজরে প্রধান ৫টি কর সুবিধা'
  },
  {
    id: 'seo-metadata',
    title: 'SEO Meta & Keywords',
    titleBn: 'এসইও মেটাডাটা ও ট্যাগ',
    description: 'High-ranking search engine metadata',
    descriptionBn: 'গুগল সার্চ র‍্যাংকিংয়ের জন্য অপটিমাইজড মেটা টাইটেল, মেটা ডেসক্রিপশন ও ট্যাগ তালিকা',
    category: 'seo',
    badgeCategory: 'SEO',
    icon: Globe,
    iconBg: 'bg-indigo-600',
    iconColor: 'text-white',
    accentBorder: 'hover:border-indigo-500/50',
    btnVariant: 'outline',
    aiFeature: 'tag_suggestions',
    defaultTone: 'অনুসন্ধান ইঞ্জিন অপটিমাইজড',
    samplePrompt: 'যেমন: রমজানের সময়সূচি ২০২৬ ও স্বাস্থ্যকর খাদ্যাভ্যাস গাইড'
  }
];

const FILTER_TABS = [
  { id: 'all', label: 'All', labelBn: 'সকল টেমপ্লেট' },
  { id: 'copywrite', label: 'Copywrite', labelBn: 'কপিরাইট ও ব্লগ' },
  { id: 'email', label: 'Email', labelBn: 'ইমেইল ও নিউজলেটার' },
  { id: 'social', label: 'Social Media', labelBn: 'সোশ্যাল মিডিয়া' },
  { id: 'seo', label: 'SEO', labelBn: 'এসইও ও মেটা' }
];

export function AdminAiContentGeneratorPage() {
  const authState = useSelector((state) => state.auth || {});
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('templates'); // 'templates' | 'library' | 'brand_voice'

  // Generator Modal State
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [toneInput, setToneInput] = useState('তথ্যবহুল ও প্রমিত বাংলা');
  const [languageInput, setLanguageInput] = useState('bn');
  const [audienceInput, setAudienceInput] = useState('সাধারণ পাঠক');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [lengthInput, setLengthInput] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Content Library Local Persistence
  const [savedLibrary, setSavedLibrary] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_prabaho_ai_content_library');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Brand Voice State
  const [brandVoice, setBrandVoice] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_prabaho_brand_voice');
      return stored
        ? JSON.parse(stored)
        : {
            name: 'দৈনিক বার্তা প্রবাহ সম্পাদকীয় শৈলী',
            guidelines: 'বস্তুনিষ্ঠ, দায়িত্বশীল, সহজবোধ্য ও প্রমিত বাংলা বানানরীতি অনুসরণকারী।',
            defaultTone: 'পেশাদার ও তথ্যবহুল',
            signature: '— দৈনিক বার্তা প্রবাহ ডেস্ক'
          };
    } catch {
      return {
        name: 'দৈনিক বার্তা প্রবাহ সম্পাদকীয় শৈলী',
        guidelines: 'বস্তুনিষ্ঠ, দায়িত্বশীল, সহজবোধ্য ও প্রমিত বাংলা বানানরীতি অনুসরণকারী।',
        defaultTone: 'পেশাদার ও তথ্যবহুল',
        signature: '— দৈনিক বার্তা প্রবাহ ডেস্ক'
      };
    }
  });

  const [createNewsMutation, { isLoading: isSendingToCms }] = useCreateNewsMutation();
  const [runAiAssist] = useRunAiAssistMutation();

  // Save library to localStorage
  const persistLibrary = (items) => {
    setSavedLibrary(items);
    try {
      localStorage.setItem('daily_prabaho_ai_content_library', JSON.stringify(items));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Filter Templates
  const filteredTemplates = useMemo(() => {
    return CONTENT_TEMPLATES.filter((tpl) => {
      const matchesCat = activeCategory === 'all' || tpl.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.title.toLowerCase().includes(q) ||
        tpl.titleBn.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.descriptionBn.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Open Generator for a Template
  const handleOpenTemplate = (template) => {
    setActiveTemplate(template);
    setTopicInput('');
    setToneInput(template.defaultTone || brandVoice.defaultTone);
    setKeywordsInput('');
    setGeneratedOutput('');
    setCopiedSuccess(false);
    setGeneratorOpen(true);
  };

  // Run Content Generation Engine
  const handleGenerateContent = async (e) => {
    e?.preventDefault();
    if (!topicInput.trim()) {
      await sweetAlert.warning('শিরোনাম প্রয়োজন', 'অনুগ্রহ করে কী বিষয়ে কনটেন্ট তৈরি করতে চান তা লিখুন।');
      return;
    }

    setIsGenerating(true);
    setGeneratedOutput('');

    try {
      // 1. Attempt using backend AI assist endpoint
      const aiPayload = {
        feature: activeTemplate?.aiFeature || 'headline_suggestions',
        title: topicInput.trim(),
        text: `বিষয়ের নাম: ${topicInput}\nটোন: ${toneInput}\nটার্গেট অডিয়েন্স: ${audienceInput}\nকিওয়ার্ড: ${keywordsInput}\nদৈর্ঘ্য: ${lengthInput}\nব্র্যান্ড ভয়েস নির্দেশিকা: ${brandVoice.guidelines}`
      };

      let resultText = '';
      try {
        const response = await runAiAssist(aiPayload).unwrap();
        if (response?.suggestion?.content || response?.suggestion?.text) {
          resultText = response.suggestion.content || response.suggestion.text;
        } else if (response?.suggestions && Array.isArray(response.suggestions)) {
          resultText = response.suggestions.join('\n\n');
        }
      } catch {
        // Fallback to intelligent client prompt generator if backend rate limited or offline
      }

      if (!resultText) {
        resultText = generateTemplateContentLocally(
          activeTemplate?.id,
          topicInput.trim(),
          toneInput,
          audienceInput,
          keywordsInput,
          lengthInput,
          brandVoice
        );
      }

      setGeneratedOutput(resultText);

      // Save to history automatically
      const newItem = {
        id: `gen-${Date.now()}`,
        templateId: activeTemplate?.id,
        templateTitle: activeTemplate?.titleBn || activeTemplate?.title,
        templateCategory: activeTemplate?.badgeCategory,
        topic: topicInput.trim(),
        tone: toneInput,
        content: resultText,
        wordsCount: resultText.trim().split(/\s+/).length,
        createdAt: new Date().toISOString()
      };
      persistLibrary([newItem, ...savedLibrary]);

      await sweetAlert.toast('কনটেন্ট সফলভাবে তৈরি হয়েছে!', 'success', 2200);
    } catch (err) {
      await sweetAlert.error('ব্যর্থ হয়েছে', 'কনটেন্ট জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy output to clipboard
  const handleCopyOutput = async (textToCopy = null) => {
    const text = textToCopy || generatedOutput;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      await sweetAlert.toast('ক্লিপবোর্ডে কপি করা হয়েছে!', 'success', 1800);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {
      await sweetAlert.error('কপি করা যায়নি', 'ব্রাউজারে কপি করার অনুমতি পাওয়া যায়নি।');
    }
  };

  // Send Generated Content directly to News CMS as a Draft
  const handleSendToCmsDraft = async () => {
    if (!generatedOutput) return;

    try {
      const title = topicInput.trim() || 'AI জেনারেটেড নতুন সংবাদ';
      const cleanSlug = `ai-${Date.now()}`;
      const payload = {
        title,
        slug: cleanSlug,
        subheadline: `${activeTemplate?.titleBn || 'AI কনটেন্ট'} থেকে প্রস্তুতকৃত খসড়া`,
        summary: generatedOutput.slice(0, 180) + '...',
        content: `<p>${generatedOutput.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
        category_id: 1, // Default to Bangladesh / national category
        status: 'draft',
        is_breaking: false,
        is_featured: false,
        tags: keywordsInput ? keywordsInput.split(',').map((k) => k.trim()).filter(Boolean) : ['AI Generated']
      };

      await createNewsMutation(payload).unwrap();
      await sweetAlert.success(
        'সিএমএস-এ খসড়া সংরক্ষিত!',
        'সংবাদটি সফলভাবে খসড়া (Draft) হিসেবে "সংবাদ ব্যবস্থাপনা" তালিকায় পাঠানো হয়েছে।'
      );
    } catch (err) {
      await sweetAlert.error('সংরক্ষণ ব্যর্থ হয়েছে', 'সিএমএস-এ ড্রাফট সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Delete from Library
  const handleDeleteLibraryItem = async (id) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      'সংরক্ষিত কনটেন্ট',
      'আপনি কি এই কনটেন্টটি লাইব্রেরি থেকে মুছে ফেলতে চান?'
    );
    if (isConfirmed) {
      const updated = savedLibrary.filter((item) => item.id !== id);
      persistLibrary(updated);
      await sweetAlert.toast('মুছে ফেলা হয়েছে', 'info', 1600);
    }
  };

  // Output Stats Math
  const outputStats = useMemo(() => {
    if (!generatedOutput) return { words: 0, characters: 0, readTimeMinutes: 0 };
    const clean = generatedOutput.trim();
    const words = clean.split(/\s+/).filter(Boolean).length;
    const characters = clean.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 140));
    return { words, characters, readTimeMinutes };
  }, [generatedOutput]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. Header with Dark Glowing Masthead aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-stone-800 text-white p-6 sm:p-8 shadow-2xl">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Heading */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase font-mono bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Content Studio
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black font-serif-bn tracking-tight text-stone-100">
              Create Content
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl font-normal">
              Choose a template to get started with AI-powered content generation for newsroom, blogs, social & marketing.
            </p>
          </div>

          {/* Quick AI Assistant Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenTemplate(CONTENT_TEMPLATES[0])}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>✨ AI Assistant</span>
            </button>
          </div>

        </div>

        {/* Top Mode Navigation Tabs */}
        <div className="relative z-10 mt-6 pt-5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
          
          {/* Main Navigation */}
          <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setActiveMainTab('templates')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'templates'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              টেমপ্লেট নির্বাচন
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('library')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'library'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>কনটেন্ট লাইব্রেরি</span>
              {savedLibrary.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-stone-800 text-[10px] flex items-center justify-center font-mono">
                  {toBengaliNumber(savedLibrary.length)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('brand_voice')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'brand_voice'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ব্র্যান্ড ভয়েস ও টোন
            </button>
          </div>

          {/* Quick Search */}
          {activeMainTab === 'templates' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="টেমপ্লেট বা কিওয়ার্ড খুঁজুন..."
                className="w-full pl-8 pr-7 py-1.5 bg-stone-900/90 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* 2. TAB: TEMPLATE SELECTION (Main Screen matching Screenshot) */}
      {activeMainTab === 'templates' && (
        <div className="space-y-6">

          {/* Category Filter Pills */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-x-auto max-w-full">
              {FILTER_TABS.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-stone-500 font-mono">
              মোট <strong>{toBengaliNumber(filteredTemplates.length)}</strong> টি টেমপ্লেট
            </div>
          </div>

          {/* Template Cards Grid (Matching the Dark Modern Glass Aesthetic) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => {
              const IconComponent = tpl.icon;
              return (
                <motion.div
                  key={tpl.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
                  className="relative group rounded-3xl bg-[#111218] border border-stone-800 hover:border-purple-500/40 p-6 flex flex-col justify-between shadow-xl shadow-black/20 transition-all overflow-hidden"
                >
                  {/* Subtle Top-Right Ambient Light */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-2xl group-hover:bg-purple-600/10 transition-colors pointer-events-none" />

                  {/* Top Content Area */}
                  <div className="space-y-4 text-center">
                    
                    {/* Centered Colorful Square Icon */}
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                      style={{ backgroundColor: tpl.iconBg.replace('bg-', '') }}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${tpl.iconBg} flex items-center justify-center shadow-md`}>
                        <IconComponent className={`w-6 h-6 ${tpl.iconColor}`} />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-stone-100 font-serif-bn tracking-tight">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-stone-400 font-normal leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Bengali Purpose subtitle badge */}
                    <div className="pt-1">
                      <span className="inline-block text-[11px] font-serif-bn text-stone-400 bg-stone-900/90 border border-stone-800/80 px-2.5 py-1 rounded-full">
                        {tpl.titleBn}
                      </span>
                    </div>

                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-6 mt-4 border-t border-stone-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenTemplate(tpl)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tpl.btnVariant === 'filled-purple'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30'
                          : 'bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-purple-500/50 text-stone-200'
                      }`}
                    >
                      <span>Create</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>

        </div>
      )}

      {/* 3. TAB: SAVED CONTENT LIBRARY */}
      {activeMainTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif-bn text-stone-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-600" />
              <span>সংরক্ষিত কনটেন্ট লাইব্রেরি</span>
            </h2>
            <span className="text-xs text-stone-500 font-mono">
              মোট {toBengaliNumber(savedLibrary.length)} টি কনটেন্ট সংরক্ষিত
            </span>
          </div>

          {savedLibrary.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800 font-serif-bn">লাইব্রেরি বর্তমানে খালি</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                যেকোনো টেমপ্লেট নির্বাচন করে কনটেন্ট তৈরি করুন, সেগুলো স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।
              </p>
              <button
                type="button"
                onClick={() => setActiveMainTab('templates')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                টেমপ্লেট দেখুন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedLibrary.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:border-purple-300 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold font-mono">
                        {item.templateCategory || 'Content'}
                      </span>
                      <h4 className="font-bold font-serif-bn text-stone-900 text-sm">
                        {item.topic}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                      <span>{toBengaliNumber(item.wordsCount || 0)} শব্দ</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('bn-BD')}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700 font-serif-bn whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                    {item.content}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-400">
                      টেমপ্লেট: <strong className="text-stone-600">{item.templateTitle}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyOutput(item.content)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLibraryItem(item.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: BRAND VOICE & NEWSROOM SETTINGS */}
      {activeMainTab === 'brand_voice' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-serif-bn text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <span>নিউজব্র্যান্ড ভয়েস ও সম্পাদকীয় নীতি</span>
            </h2>
            <p className="text-xs text-stone-500">
              দৈনিক বার্তা প্রবাহের নির্ধারিত সাংবাদিকতা শৈলী ও টোন নির্ধারণ করুন, যা সকল AI জেনারেশনে স্বয়ংক্রিয়ভাবে বজায় থাকবে।
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                ব্র্যান্ডের নাম বা প্রোফাইল
              </label>
              <input
                type="text"
                value={brandVoice.name}
                onChange={(e) => setBrandVoice({ ...brandVoice, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                ডিফল্ট লেখার টোন (Default Tone)
              </label>
              <select
                value={brandVoice.defaultTone}
                onChange={(e) => setBrandVoice({ ...brandVoice, defaultTone: e.target.value })}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="পেশাদার ও তথ্যবহুল">পেশাদার ও তথ্যবহুল (Professional & Informative)</option>
                <option value="তথ্যবহুল ও প্রমিত বাংলা">তথ্যবহুল ও প্রমিত বাংলা (Standard Bengali Editorial)</option>
                <option value="রোমাঞ্চকর ও আকর্ষণীয়">রোমাঞ্চকর ও আকর্ষণীয় (Engaging & Storytelling)</option>
                <option value="সংক্ষিপ্ত ও জরুরি">সংক্ষিপ্ত ও জরুরি (Breaking / Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                সম্পাদকীয় নির্দেশিকা ও নিষিদ্ধ পরিভাষা
              </label>
              <textarea
                rows={3}
                value={brandVoice.guidelines}
                onChange={(e) => setBrandVoice({ ...brandVoice, guidelines: e.target.value })}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="সম্পাদকীয় রুলস ও শব্দচয়ন..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                ডিফল্ট বাইলাইন বা স্বাক্ষর
              </label>
              <input
                type="text"
                value={brandVoice.signature}
                onChange={(e) => setBrandVoice({ ...brandVoice, signature: e.target.value })}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('daily_prabaho_brand_voice', JSON.stringify(brandVoice));
                sweetAlert.success('সংরক্ষিত হয়েছে!', 'ব্র্যান্ড ভয়েস সেটিংস সফলভাবে হালনাগাদ করা হয়েছে।');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              সেটিংস সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      {/* 5. GENERATOR MODAL / WORKSPACE */}
      <AnimatePresence>
        {generatorOpen && activeTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="relative w-full max-w-4xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Top Header */}
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${activeTemplate.iconBg} flex items-center justify-center shadow-xs`}>
                    <activeTemplate.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif-bn text-stone-900">
                      {activeTemplate.title} ({activeTemplate.titleBn})
                    </h3>
                    <p className="text-[11px] text-stone-500 font-sans">
                      {activeTemplate.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratorOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Grid (Left Form | Right Result) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 max-h-[75vh] overflow-y-auto">
                
                {/* Left Form: Inputs */}
                <form onSubmit={handleGenerateContent} className="lg:col-span-5 p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      মূল বিষয়বস্তু বা হেডলাইন <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder={activeTemplate.samplePrompt}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-serif-bn focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">টোন (Tone)</label>
                      <select
                        value={toneInput}
                        onChange={(e) => setToneInput(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="তথ্যবহুল ও প্রমিত বাংলা">তথ্যবহুল ও প্রমিত</option>
                        <option value="পেশাদার ও প্রাতিষ্ঠানিক">পেশাদার</option>
                        <option value="রোমাঞ্চকর ও আকর্ষণীয়">রোমাঞ্চকর / ভাইরাল</option>
                        <option value="সংক্ষিপ্ত ও জরুরি">জরুরি / ব্রেকিং</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">দৈর্ঘ্য (Length)</label>
                      <select
                        value={lengthInput}
                        onChange={(e) => setLengthInput(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="short">সংক্ষিপ্ত (~১৫০ শব্দ)</option>
                        <option value="medium">মাঝারি (~৩৫০ শব্দ)</option>
                        <option value="long">বিস্তারিত (~৭০০+ শব্দ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      টার্গেট অডিয়েন্স (Target Audience)
                    </label>
                    <input
                      type="text"
                      value={audienceInput}
                      onChange={(e) => setAudienceInput(e.target.value)}
                      placeholder="যেমন: সাধারণ পাঠক, তরুণ প্রজন্ম, পেশাজীবী"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      মূল কিওয়ার্ড বা ফোকাস পয়েন্ট (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="কমা দিয়ে পৃথক করুন (যেমন: ক্রিকেট, বিশ্বকাপ, ঢাকা)"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating || !topicInput.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI তৈরি করছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Generate Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Right Result Panel */}
                <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4 bg-stone-50/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                        Generated Output
                      </span>

                      {/* Output Live Stats */}
                      {generatedOutput && (
                        <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                          <span>{toBengaliNumber(outputStats.words)} শব্দ</span>
                          <span>•</span>
                          <span>~{toBengaliNumber(outputStats.readTimeMinutes)} মিনিট পড়ার সময়</span>
                        </div>
                      )}
                    </div>

                    {/* Result Content Box */}
                    <div className="min-h-[280px] p-4 rounded-2xl bg-white border border-stone-200 text-xs text-stone-800 font-serif-bn whitespace-pre-wrap leading-relaxed shadow-2xs overflow-y-auto max-h-[45vh]">
                      {isGenerating ? (
                        <div className="h-48 flex flex-col items-center justify-center space-y-3 text-stone-400">
                          <Wand2 className="w-7 h-7 text-purple-600 animate-pulse" />
                          <p className="text-xs font-semibold text-stone-600">
                            প্রম্পট প্রক্রিয়াকরণ ও কনটেন্ট জেনারেট হচ্ছে...
                          </p>
                        </div>
                      ) : generatedOutput ? (
                        generatedOutput
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center space-y-2 text-stone-400 italic">
                          <Sparkles className="w-6 h-6 text-stone-300" />
                          <p>বামের ফর্মে বিস্তারিত লিখে "Generate Content" বোতাম চাপুন</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar on Generated Output */}
                  {generatedOutput && (
                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyOutput()}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            copiedSuccess
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-800 hover:bg-stone-900 text-white'
                          }`}
                        >
                          {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSuccess ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSendingToCms}
                          onClick={handleSendToCmsDraft}
                          className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>সিএমএস ড্রাফট পাঠান</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateContent}
                        className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>পুনরায় তৈরি</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Client-Side Intelligence Fallback Generator
function generateTemplateContentLocally(templateId, topic, tone, audience, keywords, length, brandVoice) {
  const kwList = keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
  const kwText = kwList.length > 0 ? kwList.join(', ') : topic;

  switch (templateId) {
    case 'blog-post':
      return `## ${topic}

**ভূমিকা:**
সাম্প্রতিক সময়ে ${topic}-এর বিষয়টি পাঠক ও সচেতন মহলে বিশেষ আলোচনার কেন্দ্রবিন্দুতে পরিণত হয়েছে। তথ্যপ্রবাহ ও আধুনিকায়নের যুগে সঠিক পর্যালোচনা ছাড়া কোনো বিষয়ের গভীরতা উপলব্ধি করা কঠিন। এই প্রতিবেদনে আমরা বিষয়টির অন্তর্নিহিত দিকগুলো পুঙ্খানুপুঙ্খভাবে বিশ্লেষণ করব।

### মূল পর্যালোচনা ও প্রেক্ষিত:
১. **বাস্তব অভিজ্ঞতা ও প্রেক্ষাপট:** ${topic}-এর ক্ষেত্রে লক্ষ্য করলে দেখা যায়, তৃণমূল পর্যায় থেকে শুরু করে জাতীয় ও আন্তর্জাতিক পরিমণ্ডলে এর প্রত্যক্ষ প্রভাব পড়ছে। 
২. **গুরুত্বপূর্ণ নির্দেশক:** সংশ্লিষ্ট বিশেষজ্ঞদের মতে, বিষয়টিকে কেবল সাময়িক ঘটনা হিসেবে না দেখে এর সুদূরপ্রসারী সম্ভাবনা ও চ্যালেঞ্জগুলো বিবেচনায় নেওয়া আবশ্যক (${kwText})।
৩. **ভবিষ্যৎ রূপরেখা:** তরুণ প্রজন্ম ও ${audience}-এর জন্য এটি নতুন দৃষ্টিভঙ্গি ও সম্ভাবনার দুয়ার উন্মোচন করতে পারে।

> "সঠিক সময়ে সঠিক সিদ্ধান্ত এবং বস্তুনিষ্ঠ তথ্যই যে কোনো অগ্রযাত্রার মূল ভিত্তি।"

### সারসংক্ষেপ ও উপসংহার:
পরিশেষে বলা যায়, ${topic} সম্পর্কিত চলমান পরিস্থিতি আমাদের নতুন করে ভাবার সুযোগ করে দিচ্ছে। সঠিক পরিকল্পনা ও কার্যকর পদক্ষেপের মাধ্যমে কাঙ্ক্ষিত ইতিবাচক ফলাফল অর্জন করা সম্ভব।

${brandVoice.signature || '— দৈনিক বার্তা প্রবাহ ডেস্ক'}`;

    case 'social-post':
      return `🔥 ${topic} — এক নজরে জেনে নিন মূল তথ্য!

${topic} নিয়ে চারদিকে তুমুল আলোচনা চলছে। আপনার কী মতামত?

📌 প্রধান হাইলাইটস:
👉 বিস্তারিত তথ্য বিশ্লেষণ ও চলমান বাস্তবতা
👉 সংশ্লিষ্ট মহলের বক্তব্য ও প্রতিক্রিয়া
👉 ${kwText ? `মূল ফোকাস: ${kwText}` : 'সর্বশেষ নির্ভরযোগ্য আপডেট'}

কমেন্টে জানান আপনার মতামত। পোস্টটি শেয়ার করে অন্যদের জানার সুযোগ করে দিন! 💬👇

#${topic.replace(/\s+/g, '_')} #DailyPrabaho #BreakingNews #Trending`;

    case 'email-marketing':
      return `বিষয়: আজকের বিশেষ সম্পাদকীয় ব্রিফিং — ${topic}

প্রিয় পাঠক,
আসসালামু আলাইকুম। দৈনিক বার্তা প্রবাহের আজকের বিশেষ ডিজিটাল সংস্করণে আপনাকে স্বাগতম।

আজকের প্রধান শিরোনাম ও ফোকাস:
★ ${topic}

আমরা গভীরভাবে পর্যবেক্ষণ করেছি কীভাবে এই বিষয়টি আমাদের দৈনন্দিন জীবন ও সামগ্রিক প্রেক্ষাপটে প্রভাব বিস্তার করছে। বিশেষ করে ${audience}-এর জন্য এটি অত্যন্ত প্রাসঙ্গিক ও তাৎপর্যপূর্ণ।

মূল বিষয়গুলো সংক্ষেপে:
• ${kwText || topic} সম্পর্কিত নির্ভরযোগ্য তথ্য ও বিশ্লেষণ।
• বিশেষজ্ঞ মতামত এবং ভবিষ্যৎ গতিপথ।

বিস্তারিত পড়তে এবং সর্বশেষ সংবাদ পেতে আমাদের ওয়েবসাইট ভিজিট করুন।

আপনার দিনটি শুভ হোক।

বিনীত,
${brandVoice.name || 'দৈনিক বার্তা প্রবাহ এডিটর টিম'}
${brandVoice.signature}`;

    case 'ad-copy':
      return `【বিশেষ অফার ও ঘোষণা】 ${topic}!

আপনি কি নির্ভরযোগ্য ও মানসম্মত সেবা খুঁজছেন?
দৈনিক বার্তা প্রবাহ নিয়ে এলো আকর্ষণীয় সুযোগ!

✨ কেন আপনি এটি বেছে নেবেন?
✔ শতভাগ বিশ্বস্ত ও মানসম্পন্ন
✔ সময়োপযোগী ও আধুনিক সুবিধা
✔ ${kwText ? `বিশেষ আকর্ষণ: ${kwText}` : 'বিশেষ ছাড়ে দ্রুত সমাধান'}

👉 এখনই ভিজিট করুন অথবা ইনবক্সে যোগাযোগ করুন! সীমিত সময়ের জন্য অফারটি প্রযোজ্য।`;

    case 'video-script':
      return `[ভিডিও স্ক্রিপ্ট: ${topic}]
দৈর্ঘ্য: ৬০ সেকেন্ড | প্ল্যাটফর্ম: ইউটিউব শর্টস / ফেসবুক রিলস

[00:00 - 00:05] হুক (Hook & Intro):
(দৃশ্যে দ্রুত টেক্সট ও সাউন্ড এফেক্ট): "আপনি কি জানেন ${topic} নিয়ে আসলে কী ঘটছে? ৫টি সেকেন্ড সময় দিন, চমকে যাবেন!"

[00:06 - 00:25] মূল ঘটনা (Body Scene):
(ভয়েসওভার): "আজকের সবচেয়ে আলোচিত খবর হলো ${topic}। বিশেষজ্ঞরা বলছেন, এর পেছনের কারণগুলো অনেকেই এড়িয়ে যাচ্ছেন (${kwText})।"

[00:26 - 00:45] বিশ্লেষণ (Key Insight):
(স্ক্রিনে ইনফোগ্রাফিক্স): "বিশেষ করে ${audience}-এর কাছে এই পরিবর্তনটি অত্যন্ত তাৎপর্যপূর্ণ হতে চলেছে।"

[00:46 - 00:60] আউটরো ও সিটিএ (Call to Action):
(ভয়েসওভার): "আপনার কী মনে হয়? কমেন্টে লিখুন এবং নিয়মিত খবরের জন্য দৈনিক বার্তা প্রবাহ ফলো করুন!"`;

    case 'product-description':
      return `【${topic} — পূর্ণ বিবরণ ও কার্যকারিতা】

**সংক্ষিপ্ত সারসংক্ষেপ:**
${topic} হলো একটি আধুনিক, মানসম্মত এবং অত্যন্ত কার্যকরী সমাধান, যা বিশেষভাবে ${audience}-এর চাহিদা পূরণের জন্য প্রস্তুত করা হয়েছে।

**প্রধান বৈশিষ্ট্যসমূহ:**
• উচ্চ নির্ভরযোগ্যতা ও আকর্ষণীয় কার্যক্ষমতা।
• ব্যবহারবান্ধব ইন্টারফেস ও দীর্ঘস্থায়ী উপযোগিতা।
• কী-পয়েন্টস: ${kwText}।

**উপসংহার:**
আপনার দৈনন্দিন জীবনের চাহিদা পূরণে ${topic} একটি অপরিহার্য সংযোজন।`;

    case 'breaking-lead':
      return `【ব্রেকিং নিউজ বুলেটিন】 ${topic}

ঢাকা, দৈনিক বার্তা প্রবাহ:
রাজধানীসহ সারাদেশে ${topic} নিয়ে তাৎক্ষণিক তৎপরতা শুরু হয়েছে। সংশ্লিষ্ট সূত্র থেকে পাওয়া তথ্যে জানা যায়, পরিস্থিতি নিয়ন্ত্রণে প্রয়োজনীয় নির্দেশনা জারি করা হয়েছে।

জরুরি পয়েন্টসমূহ:
১. পরিস্থিতি সার্বক্ষণিকভাবে পর্যবেক্ষণ করা হচ্ছে।
২. সংশ্লিষ্ট কর্মকর্তারা বিষয়টি নিয়ে দ্রুত সভায় বসছেন (${kwText})।

সর্বশেষ খবর পেতে চোখ রাখুন দৈনিক বার্তা প্রবাহে।`;

    case 'seo-metadata':
      return `【এসইও মেটাডাটা ও কিওয়ার্ড সেট】
লক্ষ্যবস্তু: ${topic}

১. মেটা টাইটেল (SEO Meta Title):
${topic} - সর্বশেষ খবর ও বিস্তারিত আপডেট | দৈনিক বার্তা প্রবাহ

২. মেটা ডেসক্রিপশন (SEO Meta Description):
${topic} সম্পর্কে জানুন নির্ভরযোগ্য ও বিস্তারিত তথ্য। ${kwText} সহ সর্বশেষ সংবাদ ও বিশ্লেষণ পড়ুন দৈনিক বার্তা প্রবাহে।

৩. ফোকাস কিওয়ার্ডস (Target Keywords):
${kwText ? kwText.split(',').map(k => k.trim()).join(', ') : topic}, দৈনিক বার্তা প্রবাহ, বাংলাদেশ সংবাদ, সর্বশেষ খবর`;

    default:
      return `${topic} সম্পর্কিত কনটেন্ট সফলভাবে তৈরি হয়েছে। বিস্তারিত তথ্য যুক্ত করে চূড়ান্ত প্রকাশনা সম্পন্ন করুন।`;
  }
}

export default AdminAiContentGeneratorPage;

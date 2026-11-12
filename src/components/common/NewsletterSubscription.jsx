import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { subscribeNewsletter } from '../../services/newsletterService.js';
import { Mail, Check, AlertCircle, Loader2, Sparkles, Send } from 'lucide-react';
import { FAST_TRANSITION } from './MotionPrimitives.jsx';

export function NewsletterSubscription({
  variant = 'card', // 'card' | 'banner' | 'minimal'
  className = ''
}) {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('daily'); // 'daily' | 'weekly' | 'breaking'
  const [selectedTopics, setSelectedTopics] = useState(['politics', 'economy']);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const topicsList = [
    { id: 'politics', nameBn: 'রাজনীতি', nameEn: 'Politics' },
    { id: 'economy', nameBn: 'বাণিজ্য', nameEn: 'Business' },
    { id: 'tech', nameBn: 'প্রযুক্তি', nameEn: 'Tech' },
    { id: 'sports', nameBn: 'খেলাধুলা', nameEn: 'Sports' }
  ];

  const toggleTopic = (id) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter(t => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setFeedbackMessage(isBn ? 'একটি সঠিক ইমেইল ঠিকানা লিখুন।' : 'Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedbackMessage('');

    try {
      const res = await subscribeNewsletter({
        email,
        frequency,
        topics: selectedTopics
      });
      setStatus('success');
      setFeedbackMessage(isBn ? res.message : 'Thank you for subscribing to Daily Prabaho Newsletter!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setFeedbackMessage(err.message || (isBn ? 'সাবস্ক্রিপশনে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to subscribe. Please try again.'));
    }
  };

  // 1. Minimal Variant (Single row for Footer / Nav)
  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder={isBn ? 'আপনার ইমেইল ঠিকানা...' : 'Your email address...'}
            disabled={status === 'loading'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-rose-700 font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-2xs"
        >
          {status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span>{isBn ? 'সাবস্ক্রাইব' : 'Subscribe'}</span>
          )}
        </button>
      </form>
    );
  }

  // 2. Banner Variant (Full width horizontal banner)
  if (variant === 'banner') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg ${className}`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-700/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>{isBn ? 'দৈনিক নিউজলেটার' : 'Daily Newsletter'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-bn leading-snug">
              {isBn
                ? 'সকালের প্রধান খবর সরাসরি আপনার ইনবক্সে'
                : 'Get Curated Morning Briefings Delivered Daily'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 font-serif-bn max-w-xl">
              {isBn
                ? 'সারাদেশ ও বিশ্ব রাজনীতি, বাণিজ্য ও প্রযুক্তির সবচেয়ে গুরুত্বপূর্ণ খবরের সত্যনিষ্ঠ বিশ্লেষণ প্রতি সকাল ৭টায়।'
                : 'Start your morning informed with balanced investigative reporting and key developments.'}
            </p>
          </div>

          <div className="lg:col-span-5">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={FAST_TRANSITION}
                className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-500/80 text-emerald-200 text-xs space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>{isBn ? 'সাবস্ক্রিপশন সফল হয়েছে!' : 'Subscription Confirmed!'}</span>
                </div>
                <p className="text-xs leading-relaxed">{feedbackMessage}</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-[11px] underline text-emerald-300 hover:text-white cursor-pointer"
                >
                  {isBn ? 'আরেকটি ইমেইল যুক্ত করুন' : 'Add another email'}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder={isBn ? 'ইমেইল অ্যাড্রেস লিখুন...' : 'Enter your email...'}
                    disabled={status === 'loading'}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-800/90 border border-stone-600 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-md"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isBn ? 'যুক্ত হোন' : 'Join'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{feedbackMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-stone-400">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isBn ? 'কোনো স্প্যাম নয়। যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।' : 'No spam. Unsubscribe anytime in one click.'}</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Card Variant (Default for sidebars)
  return (
    <div className={`bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-5 shadow-md ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-rose-400">
        <Mail className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider font-sans">
          {isBn ? 'দৈনিক নিউজলেটার' : 'Daily Newsletter'}
        </span>
      </div>

      <h4 className="text-base font-bold font-serif-bn mb-1.5">
        {isBn ? 'সকালের প্রধান খবর সরাসরি আপনার ইমেইলে' : 'Morning Briefing in Your Inbox'}
      </h4>

      <p className="text-stone-300 text-xs mb-4 font-serif-bn leading-relaxed">
        {isBn
          ? 'প্রতিদিন সকাল ৭টায় এক নজরে সারাদিনের গুরুত্বপূর্ণ ঘটনা ও বিশ্লেষণ।'
          : 'Curated morning briefing of major national & global news.'}
      </p>

      {status === 'success' ? (
        <div className="p-3.5 rounded-lg bg-emerald-900/60 border border-emerald-500/80 text-emerald-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'সাবস্ক্রিপশন সম্পন্ন!' : 'Subscribed!'}</span>
          </div>
          <p className="text-[11px] leading-relaxed">{feedbackMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Topic Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              {isBn ? 'পছন্দের বিষয় নির্বাচন করুন:' : 'Preferred topics:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topicsList.map((t) => {
                const active = selectedTopics.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      active
                        ? 'bg-rose-700 text-white font-bold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {isBn ? t.nameBn : t.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email input + submit */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder={isBn ? 'ইমেইল লিখুন...' : 'Your email...'}
              disabled={status === 'loading'}
              required
              className="w-full px-3 py-2 text-xs rounded-lg bg-stone-800 border border-stone-700 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
            />
          </div>

          {status === 'error' && (
            <p className="text-[11px] text-rose-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{feedbackMessage}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {status === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isBn ? 'সাবস্ক্রাইব করুন' : 'Subscribe'}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default NewsletterSubscription;


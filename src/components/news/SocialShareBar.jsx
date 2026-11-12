import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { incrementShareCount } from '../../store/newsSlice.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle
} from 'lucide-react';

export function SocialShareBar({
  article,
  variant = 'inline', // 'inline' | 'compact' | 'floating'
  className = ''
}) {
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [copied, setCopied] = useState(false);

  const title = isBn ? article?.title : (article?.titleEn || article?.title);
  const excerpt = isBn ? article?.excerpt : (article?.excerptEn || article?.excerpt);
  const sharesCount = article?.shares || 0;
  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/news/${article?.slug || article?.id}`
    : '';

  const handleShareTriggered = (platform) => {
    if (article?.id) {
      dispatch(incrementShareCount(article.id));
    }
  };

  const handleFacebook = (e) => {
    e.stopPropagation();
    handleShareTriggered('facebook');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'width=600,height=500');
  };

  const handleTwitter = (e) => {
    e.stopPropagation();
    handleShareTriggered('twitter');
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`, '_blank', 'width=600,height=500');
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    handleShareTriggered('whatsapp');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' - ' + currentUrl)}`, '_blank');
  };

  const handleLinkedIn = (e) => {
    e.stopPropagation();
    handleShareTriggered('linkedin');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank', 'width=600,height=500');
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    handleShareTriggered('copy');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = (e) => {
    e.stopPropagation();
    handleShareTriggered('native');
    if (navigator.share) {
      navigator.share({
        title,
        text: excerpt,
        url: currentUrl
      }).catch(() => {});
    } else {
      handleCopy(e);
    }
  };

  // Compact Variant (Icon only buttons)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleFacebook}
          className="p-1.5 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-colors cursor-pointer"
          title="Share on Facebook"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleTwitter}
          className="p-1.5 rounded-full bg-stone-100 hover:bg-black text-stone-800 hover:text-white transition-colors cursor-pointer"
          title="Share on X"
          aria-label="Share on X"
        >
          <Twitter className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="p-1.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors cursor-pointer"
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          title="Copy Link"
          aria-label="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // Floating Vertical Sidebar Variant (for wide screens)
  if (variant === 'floating') {
    return (
      <aside aria-label="Social sharing" className={`flex flex-col items-center gap-2.5 p-2 bg-white border border-stone-200 rounded-2xl shadow-md ${className}`}>
        <span className="text-[10px] font-bold uppercase text-stone-400 font-sans">
          {isBn ? 'শেয়ার' : 'Share'}
        </span>
        <button
          type="button"
          onClick={handleFacebook}
          className="w-9 h-9 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
          title="Facebook"
        >
          <Facebook className="w-4 h-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleTwitter}
          className="w-9 h-9 rounded-xl bg-black hover:bg-stone-800 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
          title="Twitter / X"
        >
          <Twitter className="w-4 h-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-9 h-9 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
          title="WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleLinkedIn}
          className="w-9 h-9 rounded-xl bg-[#0A66C2] hover:bg-[#095196] text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
          title="LinkedIn"
        >
          <Linkedin className="w-4 h-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
          title={isBn ? 'লিংক কপি' : 'Copy link'}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
        </button>
      </aside>
    );
  }

  // Default Inline Full Bar Variant
  return (
    <div className={`p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-rose-700" />
        <span className="text-sm font-bold text-stone-900 font-serif-bn">
          {isBn ? 'সংবাদটি শেয়ার করুন:' : 'Share this story:'}
        </span>
        {sharesCount > 0 && (
          <span className="text-xs text-stone-500 font-serif-bn ml-1">
            ({isBn ? `${toBengaliNumber(sharesCount)} বার শেয়ার` : `${sharesCount} shares`})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleFacebook}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <Facebook className="w-4 h-4 fill-current" />
          <span>Facebook</span>
        </button>

        <button
          type="button"
          onClick={handleTwitter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <Twitter className="w-4 h-4 fill-current" />
          <span>X / Twitter</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleLinkedIn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#095196] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <Linkedin className="w-4 h-4 fill-current" />
          <span>LinkedIn</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-500" />
              <span>{isBn ? 'লিংক কপি' : 'Copy'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SocialShareBar;


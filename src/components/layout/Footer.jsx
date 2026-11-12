import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedCategory } from '../../store/newsSlice.js';
import { CATEGORIES } from '../../data/categories.js';
import { usePortalCategories, usePortalSettings } from '../../hooks/usePortalData.js';
import NewsletterSubscription from '../common/NewsletterSubscription.jsx';
import { ChevronUp, Mail, Phone, MapPin, ShieldCheck, Newspaper } from 'lucide-react';

export function Footer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { settings } = usePortalSettings();
  const { categories } = usePortalCategories();
  const footerCategories = categories.length > 0 ? categories : CATEGORIES;
  const isBn = language === 'bn';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const websiteName = isBn
    ? (settings?.websiteNameBn || settings?.portalNameBn || 'দৈনিক বার্তা প্রবাহ')
    : (settings?.websiteNameEn || settings?.portalNameEn || 'Daily Prabaho');

  const toEnDigits = (value = '') =>
    String(value).replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit));
  const hasBengaliText = (value = '') => /[\u0980-\u09FF]/.test(String(value));

  const tagline = settings?.tagline || (isBn ? 'ডিজিটাল নিউজ ও সম্পাদকীয় প্ল্যাটফর্ম' : 'Digital News & Editorial Platform');
  const rawAddress = settings?.publisherAddress || settings?.contactAddress || 'নিকুঞ্জ-২, খিলক্ষেত, ঢাকা, বাংলাদেশ।';
  const address = isBn
    ? rawAddress
    : (settings?.publisherAddressEn ||
      settings?.contactAddressEn ||
      (!hasBengaliText(rawAddress) ? rawAddress : 'Nikunja-2, Khilkhet, Dhaka, Bangladesh'));
  const rawPhone = settings?.phone || '+৮৮০ ২ ৯৮৭৬৫৪৩';
  const phone = isBn ? rawPhone : (settings?.phoneEn || toEnDigits(rawPhone));
  const rawHotline = settings?.hotline || '+৮৮০১৭০০০০০০০০';
  const hotline = isBn ? rawHotline : (settings?.hotlineEn || toEnDigits(rawHotline));
  const email = settings?.email || settings?.contactEmail || 'lutforrahmanseu@gmail.com';
  const rawPressRegNo = settings?.footerSettings?.pressRegNo || 'তথ্য মন্ত্রণালয় নিবন্ধন নং: ডিএইচ-১২৮৯/২০২৬';
  const pressRegNo = isBn
    ? rawPressRegNo
    : (settings?.footerSettings?.pressRegNoEn ||
      (!hasBengaliText(rawPressRegNo) ? rawPressRegNo : 'Ministry of Information Reg No: DH-1289/2026'));
  const rawEditor = settings?.editorName || 'মোঃ লুৎফর রহমান';
  const editor = isBn
    ? rawEditor
    : (settings?.editorNameEn ||
      (!hasBengaliText(rawEditor) ? rawEditor : 'Md. Lutfor Rahman'));
  const rawPublisher = settings?.publisherName || 'দৈনিক বার্তা প্রবাহ';
  const publisher = isBn
    ? rawPublisher
    : (settings?.publisherNameEn ||
      (!hasBengaliText(rawPublisher) ? rawPublisher : 'Daily Prabaho'));
  const copyright = isBn
    ? (settings?.footerSettings?.copyrightBn || `© ২০২৬ ${websiteName}। সর্বস্বত্ব সংরক্ষিত।`)
    : (settings?.footerSettings?.copyrightEn || `© 2026 ${websiteName}. All Rights Reserved.`);

  return (
    <footer className="bg-[#111827] text-stone-300 pt-12 pb-8 border-t border-stone-800 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top: Brand & Imprint Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-stone-800 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-bn tracking-tight">
              {websiteName}
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              {tagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold border border-stone-700 transition-colors"
            >
              <span>{isBn ? 'উপরে ফিরুন' : 'Back to Top'}</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Newsletter Subscription Banner */}
        <div className="pt-8">
          <NewsletterSubscription variant="banner" />
        </div>

        {/* Middle: Categorized Directory & Contact Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-10 border-b border-stone-800 text-xs">
          
          {/* Col 1: Categories */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 font-serif-bn">
              {isBn ? 'বিভাগসমূহ' : 'Sections'}
            </h3>
            <ul className="space-y-2">
              {footerCategories.slice(0, 6).map((cat) => (
                <li key={cat.id || cat.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setSelectedCategory(cat.slug));
                      navigate(`/category/${cat.slug}`);
                      scrollToTop();
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    {isBn ? cat.name : (cat.nameEn || cat.name)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: More Categories */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 font-serif-bn">
              {isBn ? 'অন্যান্য সেবা' : 'Other Features'}
            </h3>
            <ul className="space-y-2">
              {footerCategories.slice(6).map((cat) => (
                <li key={cat.id || cat.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setSelectedCategory(cat.slug));
                      navigate(`/category/${cat.slug}`);
                      scrollToTop();
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    {isBn ? cat.name : (cat.nameEn || cat.name)}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/epaper');
                    scrollToTop();
                  }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {isBn ? 'ডিজিটাল ই-পেপার' : 'Digital E-Paper'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/archive');
                    scrollToTop();
                  }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {isBn ? 'সংবাদ আর্কাইভ' : 'News Archive'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setSelectedCategory('saved'));
                    scrollToTop();
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  {isBn ? 'বুকমার্ক ও সংরক্ষিত সংবাদ' : 'Saved Articles'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/developers');
                    scrollToTop();
                  }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {isBn ? 'ডেভেলপার API ও সিন্ডিকেশন' : 'Developer API & Syndication'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Editorial Office & Contacts */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white mb-2 font-serif-bn">
              {isBn ? 'বার্তা ও বাণিজ্যিক কার্যালয়' : 'Editorial & Commercial Office'}
            </h3>
            <div className="flex items-start gap-2 text-stone-400 leading-relaxed">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                {/^(ঠিকানা|Address):/i.test(address.trim())
                  ? address
                  : `${isBn ? 'ঠিকানা' : 'Address'}: ${address}`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-stone-400">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{isBn ? 'ফোন' : 'Phone'}: {phone} | {isBn ? 'হটলাইন' : 'Hotline'}: {hotline}</span>
            </div>

            <div className="flex items-center gap-2 text-stone-400">
              <Mail className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{isBn ? 'ইমেইল' : 'Email'}: {email}</span>
            </div>

            <div className="flex items-center gap-2 text-stone-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{pressRegNo}</span>
            </div>
          </div>

          {/* Col 4: Newspaper Leadership */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 font-serif-bn">
              {isBn ? 'সম্পাদকমণ্ডলী' : 'Editorial Board'}
            </h3>
            <div className="space-y-1.5 text-stone-400">
              <p className="font-semibold text-stone-200">
                {editor}
              </p>
              <p className="text-[11px]">
                {publisher}
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-stone-500 block">
                  {isBn ? 'অনলাইন সংস্করণ' : 'Digital Edition'}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {isBn ? 'সংস্করণ ২.৯.০ (ফেজ ৯ সংস্করণ)' : 'v2.9.0 (Phase 9 Edition)'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
          <p>
            {copyright}
          </p>

          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-stone-300 transition-colors">
              {isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </a>
            <a href="#terms" className="hover:text-stone-300 transition-colors">
              {isBn ? 'ব্যবহারের শর্তাবলি' : 'Terms of Use'}
            </a>
            <a href="#ads" className="hover:text-stone-300 transition-colors">
              {isBn ? 'বিজ্ঞাপন' : 'Advertisement'}
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;

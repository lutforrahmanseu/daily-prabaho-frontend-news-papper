/**
 * Utilities for Bengali news typography and localization
 */

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts English digits to Bengali digits
 * @param {number|string} number 
 * @returns {string}
 */
export function toBengaliNumber(number) {
  if (number === null || number === undefined) return '';
  return String(number).replace(/[0-9]/g, (digit) => BENGALI_NUMERALS[Number(digit)]);
}

/**
 * Formats relative time in Bengali (e.g. "৫ মিনিট আগে", "২ ঘণ্টা আগে")
 * @param {string|Date} dateString 
 * @param {Date} [currentDate] 
 * @returns {string}
 */
export function formatBengaliRelativeTime(dateString, currentDate = new Date()) {
  if (!dateString) return 'এইমাত্র';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'এইমাত্র';
  const diffInSeconds = Math.floor((currentDate.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'এইমাত্র';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${toBengaliNumber(diffInMinutes)} মিনিট আগে`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${toBengaliNumber(diffInHours)} ঘণ্টা আগে`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${toBengaliNumber(diffInDays)} দিন আগে`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${toBengaliNumber(diffInMonths)} মাস আগে`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${toBengaliNumber(diffInYears)} বছর আগে`;
}

/**
 * Estimates reading time in Bengali
 * @param {string} text 
 * @returns {string}
 */
export function calculateReadingTime(text) {
  if (!text) return `১ মিনিট পড়ার সময়`;
  const plainText = String(text).replace(/<[^>]+>/g, ' ').trim();
  const words = plainText ? plainText.split(/\s+/).length : 1;
  const minutes = Math.max(1, Math.ceil(words / 160));
  return `${toBengaliNumber(minutes)} মিনিট পড়ার সময়`;
}

/**
 * Formats a full Bengali newspaper date string
 * e.g., "সোমবার, ১০ নভেম্বর ২০২৬"
 */
export function getBengaliNewspaperDate(date = new Date()) {
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const dayName = days[date.getDay()];
  const day = toBengaliNumber(date.getDate());
  const month = months[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());

  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Approximate Bengali Calendar (Bangabda) converter for newspaper masthead
 * e.g. "২৫ কার্তিক ১৪৩১"
 */
export function getBanglaCalendarDate(date = new Date()) {
  // Approximate conversion for display
  const banglaMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];
  
  // November corresponds roughly to Kartik (month index 6)
  const monthIdx = (date.getMonth() + 8) % 12;
  const day = toBengaliNumber(date.getDate());
  const year = toBengaliNumber(1431); // current Bangabda approximate
  return `${day} ${banglaMonths[monthIdx]} ${year} বঙ্গাব্দ`;
}

/**
 * Formats full date and time in Bengali: "১০ নভেম্বর ২০২৬, ০৯:১৫"
 */
export function formatBengaliFullDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const day = toBengaliNumber(date.getDate());
  const month = months[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = toBengaliNumber(`${hours}:${minutes}`);
  return `${day} ${month} ${year}, ${time}`;
}

import { test } from 'node:test';
import assert from 'node:assert';
import adminReducer, {
  addMedia,
  updateMedia,
  deleteMedia,
  addAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
  toggleAdStatus,
  recordAdImpression,
  recordAdClick,
  toggleNavMenuItemVisibility,
  updateNavMenuItem,
  updateSettings
} from '../store/adminSlice.js';

test('Media Library: Adds image with alt text, caption, credit and format', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const initialCount = state.media.length;

  const newImage = {
    id: 'med-test-01',
    type: 'image',
    title: 'পদ্মা রেল সংযোগে পরীক্ষামূলক ট্রেন',
    url: 'https://images.unsplash.com/photo-test.jpg',
    thumbnailUrl: 'https://images.unsplash.com/photo-test.jpg',
    altText: 'উড়ালসেতুতে লাল-সবুজ ট্রেন',
    caption: 'মাওয়া রেলওয়ে স্টেশনে ট্রেন যাত্রার দৃশ্য',
    credit: 'রফিকুল ইসলাম / বার্তা প্রবাহ',
    dimensions: '1920x1080',
    size: '1.4 MB',
    format: 'JPEG',
    category: 'infrastructure'
  };

  const nextState = adminReducer(state, addMedia(newImage));
  assert.strictEqual(nextState.media.length, initialCount + 1);
  assert.strictEqual(nextState.media[0].id, 'med-test-01');
  assert.strictEqual(nextState.media[0].altText, 'উড়ালসেতুতে লাল-সবুজ ট্রেন');
  assert.strictEqual(nextState.media[0].credit, 'রফিকুল ইসলাম / বার্তা প্রবাহ');
});

test('Media Library: Adds and manages video metadata', () => {
  const state = adminReducer(undefined, { type: 'unknown' });

  const newVideo = {
    id: 'med-test-video',
    type: 'video',
    title: 'মিরপুর টেস্টে টাইগারদের উল্লাস ভিডিও',
    url: 'https://cdn.dailyprabaho.com/video/test.mp4',
    thumbnailUrl: 'https://cdn.dailyprabaho.com/video/thumb.jpg',
    altText: 'টাইগারদের বাঁধভাঙা বিজয় উদযাপন ভিডিও',
    caption: 'মিরপুর টেস্ট জয়ের বিশেষ মুহূর্ত',
    credit: 'স্পোর্টস ভিডিও ডেস্ক',
    dimensions: '1080p Full HD',
    duration: '০৩:৪৫',
    size: '৪৫.২ MB',
    format: 'MP4',
    category: 'sports'
  };

  const nextState = adminReducer(state, addMedia(newVideo));
  const created = nextState.media.find(m => m.id === 'med-test-video');
  assert.ok(created);
  assert.strictEqual(created.type, 'video');
  assert.strictEqual(created.duration, '০৩:৪৫');
  assert.strictEqual(created.dimensions, '1080p Full HD');
  assert.strictEqual(created.format, 'MP4');
});

test('Media Library: Updates metadata and deletes media item', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const targetId = state.media[0].id;

  const updatedState = adminReducer(state, updateMedia({
    id: targetId,
    caption: 'হালনাগাদকৃত ক্যাপশন বিবরণ',
    altText: 'নতুন এসইও অল্ট টেক্সট'
  }));

  const item = updatedState.media.find(m => m.id === targetId);
  assert.strictEqual(item.caption, 'হালনাগাদকৃত ক্যাপশন বিবরণ');
  assert.strictEqual(item.altText, 'নতুন এসইও অল্ট টেক্সট');

  const afterDelete = adminReducer(updatedState, deleteMedia(targetId));
  assert.strictEqual(afterDelete.media.find(m => m.id === targetId), undefined);
});

test('Ad Management: Supports all 5 canonical ad placements', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const placements = state.ads.map(a => a.placement);

  assert.ok(placements.includes('homepage_top'));
  assert.ok(placements.includes('homepage_sidebar'));
  assert.ok(placements.includes('news_details_top'));
  assert.ok(placements.includes('news_details_middle'));
  assert.ok(placements.includes('category_page'));
});

test('Ad Management: Impression and click tracking with live CTR computation', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const targetAd = state.ads[0];

  const withImpression = adminReducer(state, recordAdImpression(targetAd.id));
  assert.strictEqual(withImpression.ads[0].impressions, targetAd.impressions + 1);

  const withClick = adminReducer(withImpression, recordAdClick(targetAd.id));
  assert.strictEqual(withClick.ads[0].clicks, targetAd.clicks + 1);
  const expectedCtr = ((withClick.ads[0].clicks / withClick.ads[0].impressions) * 100).toFixed(2);
  assert.strictEqual(withClick.ads[0].ctr, `${expectedCtr}%`);
});

test('Ad Management: Campaign creation, updating and status toggling', () => {
  const state = adminReducer(undefined, { type: 'unknown' });

  const newCampaign = {
    id: 'ad-test-01',
    title: 'দারাজ ১১.১১ সুপার সেল',
    advertiser: 'Daraz Bangladesh',
    contactPerson: 'কাজী আশিক',
    placement: 'homepage_top',
    status: 'active',
    startDate: '২০২৬-১১-০১',
    endDate: '২০২৬-১১-১৫',
    revenue: '৳ ১,০০,০০০'
  };

  const withAd = adminReducer(state, addAdCampaign(newCampaign));
  assert.strictEqual(withAd.ads[0].id, 'ad-test-01');

  // Toggle status
  const pausedState = adminReducer(withAd, toggleAdStatus('ad-test-01'));
  assert.strictEqual(pausedState.ads.find(a => a.id === 'ad-test-01').status, 'paused');

  // Update
  const updatedState = adminReducer(pausedState, updateAdCampaign({
    id: 'ad-test-01',
    revenue: '৳ ১,৫০,০০০'
  }));
  assert.strictEqual(updatedState.ads.find(a => a.id === 'ad-test-01').revenue, '৳ ১,৫০,০০০');

  // Delete
  const deletedState = adminReducer(updatedState, deleteAdCampaign('ad-test-01'));
  assert.strictEqual(deletedState.ads.find(a => a.id === 'ad-test-01'), undefined);
});

test('Website Settings: Manages website name, logos, contact info, social links and navigation menu', () => {
  const state = adminReducer(undefined, { type: 'unknown' });

  const newSettings = {
    websiteNameBn: 'দৈনিক বার্তা প্রবাহ ২৪',
    tagline: 'বস্তুনিষ্ঠ নির্ভীক সাংবাদিকতা',
    logo: '/images/new-logo.svg',
    favicon: '/images/new-fav.ico',
    phone: '+৮৮০ ১৭০০০০০০০০',
    socialLinks: {
      facebook: 'https://facebook.com/newdailyprabaho'
    },
    footerSettings: {
      copyrightBn: '© ২০২৬ বার্তা প্রবাহ সর্বস্বত্ব সংরক্ষিত'
    },
    languageSettings: {
      defaultLanguage: 'bn',
      numerals: 'bengali'
    }
  };

  const updatedState = adminReducer(state, updateSettings(newSettings));
  assert.strictEqual(updatedState.settings.websiteNameBn, 'দৈনিক বার্তা প্রবাহ ২৪');
  assert.strictEqual(updatedState.settings.tagline, 'বস্তুনিষ্ঠ নির্ভীক সাংবাদিকতা');
  assert.strictEqual(updatedState.settings.logo, '/images/new-logo.svg');
  assert.strictEqual(updatedState.settings.footerSettings.copyrightBn, '© ২০২৬ বার্তা প্রবাহ সর্বস্বত্ব সংরক্ষিত');
  assert.strictEqual(updatedState.settings.languageSettings.numerals, 'bengali');
});

test('Website Settings: Toggles navigation menu item visibility', () => {
  const state = adminReducer(undefined, { type: 'unknown' });
  const firstItem = state.settings.navigationMenu[0];
  const initialVisibility = firstItem.isVisible;

  const toggled = adminReducer(state, toggleNavMenuItemVisibility(firstItem.id));
  const target = toggled.settings.navigationMenu.find(n => n.id === firstItem.id);
  assert.strictEqual(target.isVisible, !initialVisibility);
});


import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BANGLADESH_GATEWAYS,
  CARD_BRANDS,
  FORBIDDEN_RAW_CARD_FIELDS,
  SUBSCRIPTION_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  APPROVAL_STATUS_META,
  CAMPAIGN_STATUS_META,
  AD_PLACEMENT_LABELS,
  findForbiddenCardFields,
  formatBdt,
  formatCtr,
  getGatewayMeta
} from './monetizationHelpers.js';
import { PHASE21_ROLE_PERMISSIONS, hasEffectivePermission } from './permissions.js';
import { normalizeArticle } from './apiNormalizer.js';

test('Phase 21 Bangladesh gateway configuration supports bKash, Nagad, and hosted card checkout', () => {
  const codes = BANGLADESH_GATEWAYS.map((g) => g.code);
  assert.deepEqual(codes, ['bkash', 'nagad', 'card']);
  assert.deepEqual(CARD_BRANDS, ['VISA', 'MASTERCARD', 'AMEX', 'NEXUS']);
  assert.equal(getGatewayMeta('bkash').channelType, 'mfs_wallet');
  assert.equal(getGatewayMeta('nagad').channelType, 'mfs_wallet');
  assert.equal(getGatewayMeta('card').channelType, 'hosted_card');
});

test('Phase 21 client safety guard detects any forbidden raw card fields deeply', () => {
  assert.ok(FORBIDDEN_RAW_CARD_FIELDS.includes('card_number'));
  assert.ok(FORBIDDEN_RAW_CARD_FIELDS.includes('cvv'));
  assert.ok(FORBIDDEN_RAW_CARD_FIELDS.includes('pan'));

  assert.deepEqual(
    findForbiddenCardFields({
      plan_slug: 'premium-monthly',
      gateway: 'card',
      card_brand: 'VISA',
      card_last4: '4242'
    }),
    []
  );

  const nestedHits = findForbiddenCardFields({
    plan_slug: 'premium-monthly',
    payment_meta: {
      card_number: '4111111111111111',
      cvv: '123',
      expiry_month: '12'
    }
  });
  assert.deepEqual(nestedHits.sort(), ['card_number', 'cvv', 'expiry_month']);
});

test('Phase 21 BDT formatting, CTR calculation, and status metadata dictionaries', () => {
  assert.equal(formatBdt(199, false), 'BDT 199');
  assert.equal(formatBdt(199, true), '৳১৯৯');
  assert.equal(formatCtr(1000, 25), '2.50%');
  assert.equal(formatCtr(0, 5), '0.00%');

  for (const key of ['active', 'pending_payment', 'cancelled', 'expired', 'past_due']) {
    assert.ok(SUBSCRIPTION_STATUS_META[key]?.labelBn);
  }
  for (const key of ['pending', 'initiated', 'verifying', 'succeeded', 'failed', 'refunded']) {
    assert.ok(PAYMENT_STATUS_META[key]?.labelBn);
  }
  for (const key of ['pending', 'approved', 'processed', 'rejected']) {
    assert.ok(REFUND_STATUS_META[key]?.labelBn);
  }
  for (const key of ['pending', 'approved', 'changes_requested', 'rejected']) {
    assert.ok(APPROVAL_STATUS_META[key]?.labelBn);
  }
  assert.ok(CAMPAIGN_STATUS_META.active);
  assert.ok(AD_PLACEMENT_LABELS.homepage_top);
});

test('Phase 21 RBAC matrix isolates monetization permissions appropriately across roles', () => {
  const mkAuth = (role) => ({ user: { id: 99, role } });

  assert.ok(PHASE21_ROLE_PERMISSIONS.ads_manager.includes('campaigns.manage'));
  assert.ok(PHASE21_ROLE_PERMISSIONS.ads_manager.includes('advertisers.manage'));
  assert.equal(hasEffectivePermission(mkAuth('super_admin'), {}, 'payments.refund'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'payments.refund'), true);
  assert.equal(hasEffectivePermission(mkAuth('editor_in_chief'), {}, 'sponsored.approve'), true);

  assert.equal(hasEffectivePermission(mkAuth('ads_manager'), {}, 'advertisers.manage'), true);
  assert.equal(hasEffectivePermission(mkAuth('ads_manager'), {}, 'campaigns.manage'), true);
  assert.equal(hasEffectivePermission(mkAuth('ads_manager'), {}, 'sponsored.manage'), true);
  assert.equal(hasEffectivePermission(mkAuth('ads_manager'), {}, 'payments.refund'), false);
  assert.equal(hasEffectivePermission(mkAuth('ads_manager'), {}, 'subscriptions.manage'), false);

  for (const role of ['reporter', 'photographer', 'seo_manager', 'moderator', 'reader']) {
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'subscriptions.manage'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'payments.view'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'campaigns.manage'), false);
    assert.equal(hasEffectivePermission(mkAuth(role), {}, 'sponsored.approve'), false);
  }
});

test('Phase 21 article normalizer preserves sponsored disclosure and premium tier metadata', () => {
  const normalized = normalizeArticle({
    id: 501,
    title: 'স্পনসরড প্রতিবেদন',
    is_premium: true,
    is_sponsored: true,
    sponsored_label: 'স্পনসরড কনটেন্ট',
    sponsor_disclosure: 'বিজ্ঞাপনদাতার সহযোগিতায় প্রকাশিত।',
    advertiser_id: 7,
    campaign_id: 12,
    sponsored_content: { cta_url: 'https://example.com', cta_label: 'দেখুন' }
  });

  assert.equal(normalized.isPremium, true);
  assert.equal(normalized.isSponsored, true);
  assert.equal(normalized.sponsoredLabel, 'স্পনসরড কনটেন্ট');
  assert.equal(normalized.sponsorDisclosure, 'বিজ্ঞাপনদাতার সহযোগিতায় প্রকাশিত।');
  assert.equal(normalized.advertiserId, 7);
  assert.equal(normalized.campaignId, 12);
  assert.equal(normalized.sponsoredContent?.cta_url, 'https://example.com');
});


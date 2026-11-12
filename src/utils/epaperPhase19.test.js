import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPAPER_EDITION_CODES,
  EPAPER_ACCESS_LEVELS,
  EPAPER_DOWNLOAD_POLICIES,
  BENGALI_MONTHS,
  formatPdfBytes,
  buildPdfFragmentUrl,
  normalizeEpaperEdition,
  normalizeEpaperPage,
  getAccessControlMessage,
  getDownloadPermissionMessage
} from './epaperHelpers.js';
import { hasEffectivePermission } from './permissions.js';

test('Phase 19: E-paper RBAC role permissions enforce view, manage, and publish boundaries', () => {
  const reporterState = {
    user: { id: 10, email: 'reporter@dailyprabaho.test', role: 'reporter' },
    roles: ['reporter'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(reporterState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(reporterState, {}, 'epaper.manage'), false);
  assert.equal(hasEffectivePermission(reporterState, {}, 'epaper.publish'), false);

  const photographerState = {
    user: { id: 11, email: 'photo@dailyprabaho.test', role: 'photographer' },
    roles: ['photographer'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(photographerState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(photographerState, {}, 'epaper.manage'), true);
  assert.equal(hasEffectivePermission(photographerState, {}, 'epaper.publish'), false);

  const newsEditorState = {
    user: { id: 12, email: 'editor@dailyprabaho.test', role: 'news_editor' },
    roles: ['news_editor'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(newsEditorState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(newsEditorState, {}, 'epaper.manage'), true);
  assert.equal(hasEffectivePermission(newsEditorState, {}, 'epaper.publish'), true);

  const editorInChiefState = {
    user: { id: 13, email: 'chief@dailyprabaho.test', role: 'editor_in_chief' },
    roles: ['editor_in_chief'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(editorInChiefState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(editorInChiefState, {}, 'epaper.manage'), true);
  assert.equal(hasEffectivePermission(editorInChiefState, {}, 'epaper.publish'), true);

  const seoState = {
    user: { id: 14, email: 'seo@dailyprabaho.test', role: 'seo_manager' },
    roles: ['seo_manager'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(seoState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(seoState, {}, 'epaper.manage'), false);

  const moderatorState = {
    user: { id: 15, email: 'mod@dailyprabaho.test', role: 'moderator' },
    roles: ['moderator'],
    permissions: []
  };
  assert.equal(hasEffectivePermission(moderatorState, {}, 'epaper.view'), true);
  assert.equal(hasEffectivePermission(moderatorState, {}, 'epaper.manage'), false);

  for (const blockedRole of ['ads_manager', 'reader']) {
    const blockedState = {
      user: { id: 16, email: `${blockedRole}@dailyprabaho.test`, role: blockedRole },
      roles: [blockedRole],
      permissions: []
    };
    assert.equal(hasEffectivePermission(blockedState, {}, 'epaper.view'), false);
    assert.equal(hasEffectivePermission(blockedState, {}, 'epaper.manage'), false);
    assert.equal(hasEffectivePermission(blockedState, {}, 'epaper.publish'), false);
  }
});

test('Phase 19: formatPdfBytes and buildPdfFragmentUrl clamp and format safely', () => {
  assert.equal(formatPdfBytes(0), '0 KB');
  assert.equal(formatPdfBytes(-50), '0 KB');
  assert.equal(formatPdfBytes(512), '512 B');
  assert.equal(formatPdfBytes(2048), '2.0 KB');
  assert.equal(formatPdfBytes(1024 * 1024 * 1.5), '1.50 MB');

  assert.equal(buildPdfFragmentUrl('', 3, 120), '');
  assert.equal(
    buildPdfFragmentUrl('blob:https://example.test/abc', 0, 25),
    'blob:https://example.test/abc#page=1&zoom=50&toolbar=0&navpanes=0'
  );
  assert.equal(
    buildPdfFragmentUrl('blob:https://example.test/abc', 4, 300),
    'blob:https://example.test/abc#page=4&zoom=200&toolbar=0&navpanes=0'
  );
  assert.equal(
    buildPdfFragmentUrl('blob:https://example.test/abc', 7, 115),
    'blob:https://example.test/abc#page=7&zoom=115&toolbar=0&navpanes=0'
  );
});

test('Phase 19: normalizeEpaperEdition and normalizeEpaperPage preserve access/download flags cleanly', () => {
  const normalized = normalizeEpaperEdition({
    id: 42,
    title: 'দৈনিক বার্তা প্রবাহ — জাতীয় সংস্করণ',
    publication_date: '2026-11-11',
    edition_code: 'national',
    status: 'published',
    access_level: 'subscriber',
    download_policy: 'registered',
    is_featured: 1,
    access_granted: false,
    can_download: false,
    lock_reason: 'subscription_required',
    has_pdf: true,
    pdf_size: 245760,
    pdf_page_count: 8,
    pages: [
      {
        id: 101,
        epaper_edition_id: 42,
        page_number: 1,
        section_name_bn: 'প্রথম পাতা',
        headline: 'জাতীয় সংলাপ',
        has_pdf: true,
        pdf_size: 12000
      }
    ]
  });

  assert.equal(normalized.id, 42);
  assert.equal(normalized.access_level, 'subscriber');
  assert.equal(normalized.download_policy, 'registered');
  assert.equal(normalized.is_featured, true);
  assert.equal(normalized.access_granted, false);
  assert.equal(normalized.can_download, false);
  assert.equal(normalized.lock_reason, 'subscription_required');
  assert.equal(normalized.pages_count, 1);
  assert.equal(normalized.pages.length, 1);
  assert.equal(normalized.pages[0].section_name_bn, 'প্রথম পাতা');
  assert.equal('pdf_path' in normalized, false);
  assert.equal('cover_path' in normalized, false);

  const defaultPage = normalizeEpaperPage({});
  assert.equal(defaultPage.page_number, 1);
  assert.equal(defaultPage.pdf_source_page, 1);
  assert.equal(defaultPage.section_name_bn, 'সাধারণ পাতা');
  assert.equal(defaultPage.section_name_en, 'General Page');
  assert.deepEqual(defaultPage.related_news_ids, []);
});

test('Phase 19: access control and download permission messages handle all states in Bn/En', () => {
  assert.match(getAccessControlMessage('login_required', true), /লগইন/);
  assert.match(getAccessControlMessage('login_required', false), /sign in/i);

  assert.match(getAccessControlMessage('subscription_required', true), /ই-পেপার প্লাস/);
  assert.match(getAccessControlMessage('login_and_subscription_required', false), /E-Paper Plus/);

  assert.match(getAccessControlMessage('unknown_reason', true), /সীমাবদ্ধ/);
  assert.match(getAccessControlMessage('unknown_reason', false), /restricted/i);

  assert.equal(getDownloadPermissionMessage({ can_download: true }, true, true), 'PDF ডাউনলোড');
  assert.equal(getDownloadPermissionMessage({ can_download: true }, false, false), 'Download PDF');
  assert.match(
    getDownloadPermissionMessage({ can_download: false, download_policy: 'disabled' }, true, true),
    /ডাউনলোড বন্ধ/
  );
  assert.match(
    getDownloadPermissionMessage({ can_download: false, download_policy: 'disabled' }, true, false),
    /View Only/
  );
  assert.match(
    getDownloadPermissionMessage({ can_download: false, download_policy: 'registered' }, false, true),
    /লগইন করুন/
  );
  assert.match(
    getDownloadPermissionMessage({ can_download: false, download_policy: 'registered' }, false, false),
    /Sign in to Download/
  );
  assert.match(
    getDownloadPermissionMessage({ can_download: false, download_policy: 'registered' }, true, false),
    /Download Restricted/
  );
});

test('Phase 19: metadata tables and BENGALI_MONTHS cover all 1..12 months cleanly', () => {
  assert.equal(BENGALI_MONTHS.length, 12);
  assert.deepEqual(
    BENGALI_MONTHS.map((m) => m.value),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  );
  for (const month of BENGALI_MONTHS) {
    assert.ok(month.nameBn.length > 0);
    assert.ok(month.nameEn.length > 0);
  }

  assert.ok(EPAPER_EDITION_CODES.some((e) => e.code === 'national'));
  assert.deepEqual(
    EPAPER_ACCESS_LEVELS.map((l) => l.id),
    ['public', 'registered', 'subscriber']
  );
  assert.deepEqual(
    EPAPER_DOWNLOAD_POLICIES.map((p) => p.id),
    ['disabled', 'registered', 'public']
  );
});


import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_DATE_PRESETS,
  TRAFFIC_SOURCE_LABELS,
  DEVICE_TYPE_LABELS,
  EXPERIMENT_TYPE_LABELS,
  FORMAT_DURATION_BN,
  computeVariantStatistics,
  canSendClientAnalyticsTelemetry,
  sanitizeExportCsvCell
} from './analyticsHelpers.js';
import { PHASE24_ROLE_PERMISSIONS, hasEffectivePermission } from './permissions.js';

describe('Phase 24 Advanced News Analytics & Experimentation Helpers', () => {
  it('enforces Phase 24 role-based analytics permissions accurately', () => {
    assert.deepEqual(PHASE24_ROLE_PERMISSIONS.editor_in_chief, [
      'analytics.view',
      'analytics.editorial.view',
      'analytics.revenue.view',
      'analytics.experiments.manage',
      'analytics.export'
    ]);

    // news_editor gets editorial + experiments + export, NOT revenue
    assert.equal(hasEffectivePermission({ user: { role: 'news_editor' } }, {}, 'analytics.editorial.view'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'news_editor' } }, {}, 'analytics.experiments.manage'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'news_editor' } }, {}, 'analytics.revenue.view'), false);

    // ads_manager gets revenue + export, NOT editorial or experiments management
    assert.equal(hasEffectivePermission({ user: { role: 'ads_manager' } }, {}, 'analytics.revenue.view'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'ads_manager' } }, {}, 'analytics.export'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'ads_manager' } }, {}, 'analytics.editorial.view'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'ads_manager' } }, {}, 'analytics.experiments.manage'), false);

    // reporter & reader have zero access
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'analytics.view'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reader' } }, {}, 'analytics.view'), false);
  });

  it('computes two-proportion Z-test statistical confidence and relative lift accurately', () => {
    const control = { impressions_count: 1000, clicks_count: 100 }; // 10%
    const winner = { impressions_count: 1000, clicks_count: 180 }; // 18% (+80% lift)
    const stats = computeVariantStatistics(control, winner);

    assert.equal(stats.liftPercent, 80);
    assert.ok(stats.confidencePercent >= 99.0);
    assert.equal(stats.isSignificant, true);

    // Small sample (< 20 impressions) never flags false significance
    const tiny = computeVariantStatistics({ impressions_count: 10, clicks_count: 1 }, { impressions_count: 10, clicks_count: 8 });
    assert.equal(tiny.confidencePercent, 0);
    assert.equal(tiny.isSignificant, false);
  });

  it('enforces client Do-Not-Track (DNT) and analytics consent opt-out strictly', () => {
    assert.equal(canSendClientAnalyticsTelemetry(false, {}, null), false);
    assert.equal(canSendClientAnalyticsTelemetry(true, { doNotTrack: '1' }, null), false);
    assert.equal(canSendClientAnalyticsTelemetry(true, { msDoNotTrack: '1' }, null), false);

    const mockStorage = {
      getItem: (key) => (key === 'newsflow_analytics_consent' ? 'false' : null)
    };
    assert.equal(canSendClientAnalyticsTelemetry(true, { doNotTrack: '0' }, mockStorage), false);

    const consentedStorage = {
      getItem: (key) => (key === 'newsflow_analytics_consent' ? 'true' : null)
    };
    assert.equal(canSendClientAnalyticsTelemetry(true, { doNotTrack: '0' }, consentedStorage), true);
  });

  it('neutralizes CSV spreadsheet formula injection vectors safely', () => {
    assert.equal(sanitizeExportCsvCell('=HYPERLINK("https://evil.test","click")'), `'=HYPERLINK("https://evil.test","click")`);
    assert.equal(sanitizeExportCsvCell('+cmd|/C calc!A0'), `'+cmd|/C calc!A0`);
    assert.equal(sanitizeExportCsvCell('-2+3+cmd'), `'-2+3+cmd`);
    assert.equal(sanitizeExportCsvCell('@SUM(A1:A2)'), `'@SUM(A1:A2)`);
    assert.equal(sanitizeExportCsvCell('মেট্রোরেল সময়সূচি'), 'মেট্রোরেল সময়সূচি');
  });

  it('exposes complete presets, taxonomies and Bengali duration formatting', () => {
    assert.equal(ANALYTICS_DATE_PRESETS.length, 6);
    assert.ok(TRAFFIC_SOURCE_LABELS.organic_search);
    assert.ok(DEVICE_TYPE_LABELS.mobile);
    assert.ok(EXPERIMENT_TYPE_LABELS.homepage_layout);
    assert.equal(FORMAT_DURATION_BN(145), '2 মি. 25 সে.');
    assert.equal(FORMAT_DURATION_BN(38), '38 সেকেন্ড');
  });
});


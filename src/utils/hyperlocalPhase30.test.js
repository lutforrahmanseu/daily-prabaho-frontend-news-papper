import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GEO_LEVEL_META,
  CORRESPONDENT_VERIFICATION_BADGES,
  REGIONAL_APPROVAL_BADGES,
  GAP_SEVERITY_STYLES,
  LOCAL_ALERT_FREQUENCIES,
  getArticlePrimaryGeo,
  filterGeoChildren,
  buildPrivacySafeLocalPreferencePayload,
  buildArticleGeoPayload
} from './hyperlocalHelpers.js';
import { hasEffectivePermission } from './permissions.js';

describe('Phase 30 Hyperlocal News Network Helpers & RBAC', () => {
  it('defines the 5-level Bangladesh hierarchy and taxonomy badges', () => {
    assert.deepEqual(Object.keys(GEO_LEVEL_META), ['division', 'district', 'upazila', 'union', 'ward']);
    assert.equal(GEO_LEVEL_META.division.order, 1);
    assert.equal(GEO_LEVEL_META.ward.order, 5);
    assert.ok(CORRESPONDENT_VERIFICATION_BADGES.verified);
    assert.ok(REGIONAL_APPROVAL_BADGES.pending_regional_review);
    assert.ok(GAP_SEVERITY_STYLES.critical);
    assert.equal(LOCAL_ALERT_FREQUENCIES.length, 4);
  });

  it('resolves clickable primary geo badge prioritizing Upazila > District > Division', () => {
    const upazilaArticle = {
      division: { id: 1, name_bn: 'সিলেট', name_en: 'Sylhet', slug: 'sylhet', geo_code: '60' },
      district: { id: 2, name_bn: 'সুনামগঞ্জ', name_en: 'Sunamganj', slug: 'sunamganj', geo_code: '6090' },
      upazila: { id: 3, name_bn: 'তাহিরপুর', name_en: 'Tahirpur', slug: 'tahirpur', geo_code: '609092' }
    };
    const geoBn = getArticlePrimaryGeo(upazilaArticle, true);
    assert.equal(geoBn.path, '/local/upazila/tahirpur');
    assert.equal(geoBn.districtPath, '/local/district/sunamganj');
    assert.equal(geoBn.label, 'তাহিরপুর, সুনামগঞ্জ');
    assert.equal(geoBn.geoCode, '609092');

    const divisionOnly = getArticlePrimaryGeo({ division: upazilaArticle.division }, false);
    assert.equal(divisionOnly.path, '/local/sylhet');
    assert.equal(divisionOnly.label, 'Sylhet');

    assert.equal(getArticlePrimaryGeo({}, true), null);
  });

  it('filters active child geo locations by parent ID cleanly', () => {
    const locations = [
      { id: 10, parent_id: 1, name_en: 'Dhaka', is_active: true },
      { id: 11, parent_id: 1, name_en: 'Inactive Town', is_active: false },
      { id: 12, parent_id: 2, name_en: 'Sylhet', is_active: true }
    ];
    const children = filterGeoChildren(locations, '1');
    assert.equal(children.length, 1);
    assert.equal(children[0].id, 10);
    assert.deepEqual(filterGeoChildren(locations, null), []);
  });

  it('builds privacy-safe manual reader preference payload with zero GPS coordinates', () => {
    const payload = buildPrivacySafeLocalPreferencePayload({
      divisionId: '3',
      districtId: '15',
      upazilaId: '42',
      localNotificationsEnabled: true,
      localNotificationFrequency: 'instant',
      latitude: 23.8103,
      longitude: 90.4125
    });

    assert.deepEqual(payload, {
      preferred_division_id: 3,
      preferred_district_id: 15,
      preferred_upazila_id: 42,
      preferred_union_id: null,
      preferred_ward_id: null,
      local_notifications_enabled: true,
      local_notification_frequency: 'instant',
      clear_location: false
    });
    assert.equal('latitude' in payload, false);
    assert.equal('longitude' in payload, false);

    const muted = buildPrivacySafeLocalPreferencePayload({
      divisionId: '3',
      localNotificationsEnabled: false,
      localNotificationFrequency: 'instant'
    });
    assert.equal(muted.local_notification_frequency, 'none');
  });

  it('builds clean deepest-level geo payload for CMS article submission', () => {
    const payload = buildArticleGeoPayload({
      divisionId: '1',
      districtId: '10',
      upazilaId: '100',
      unionId: '500',
      wardId: '',
      isHyperlocal: false
    });
    assert.deepEqual(payload, {
      geo_location_id: 500,
      division_id: 1,
      district_id: 10,
      upazila_id: 100,
      union_id: 500,
      ward_id: null,
      is_hyperlocal: true
    });
  });

  it('enforces Phase 30 hyperlocal RBAC permissions across roles', () => {
    assert.equal(hasEffectivePermission({ user: { role: 'editor_in_chief' } }, {}, 'hyperlocal.locations.manage'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'regional_editor' } }, {}, 'hyperlocal.regional.approve'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'regional_editor' } }, {}, 'hyperlocal.assignments.manage'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'regional_editor' } }, {}, 'hyperlocal.locations.manage'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'hyperlocal.view'), true);
    assert.equal(hasEffectivePermission({ user: { role: 'reporter' } }, {}, 'hyperlocal.regional.approve'), false);
    assert.equal(hasEffectivePermission({ user: { role: 'reader' } }, {}, 'hyperlocal.view'), false);
  });
});

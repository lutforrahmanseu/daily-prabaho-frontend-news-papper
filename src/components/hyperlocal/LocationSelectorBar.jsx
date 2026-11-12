import React, { useMemo } from 'react';
import { MapPin, ShieldCheck, Compass } from 'lucide-react';
import { useGetGeoLocationsQuery } from '../../store/api/hyperlocalApi.js';
import { filterGeoChildren } from '../../utils/hyperlocalHelpers.js';

/**
 * Privacy-first manual cascading Bangladesh location picker:
 * Division > District > Upazila [> Union > Ward]
 * Never calls navigator.geolocation or collects coordinates passively.
 */
export function LocationSelectorBar({
  value = {},
  onChange,
  includeDeepLevels = false,
  isBn = true,
  compact = false,
  showPrivacyNote = true,
  onClear = null
}) {
  const { data: divisions = [] } = useGetGeoLocationsQuery({ level: 'division' });
  const { data: districts = [] } = useGetGeoLocationsQuery(
    value.divisionId ? { level: 'district', division_id: value.divisionId } : { level: 'district' }
  );
  const { data: upazilas = [] } = useGetGeoLocationsQuery(
    value.districtId ? { level: 'upazila', district_id: value.districtId } : { level: 'upazila' },
    { skip: !value.districtId }
  );
  const { data: unions = [] } = useGetGeoLocationsQuery(
    value.upazilaId ? { level: 'union', upazila_id: value.upazilaId } : { level: 'union' },
    { skip: !includeDeepLevels || !value.upazilaId }
  );
  const { data: wards = [] } = useGetGeoLocationsQuery(
    value.unionId ? { level: 'ward', union_id: value.unionId } : { level: 'ward' },
    { skip: !includeDeepLevels || !value.unionId }
  );

  const filteredDistricts = useMemo(
    () => (value.divisionId ? filterGeoChildren(districts, value.divisionId) : districts),
    [districts, value.divisionId]
  );

  const handleField = (levelKey, rawVal) => {
    const val = rawVal ? String(rawVal) : '';
    const next = { ...value };

    if (levelKey === 'divisionId') {
      next.divisionId = val;
      next.districtId = '';
      next.upazilaId = '';
      next.unionId = '';
      next.wardId = '';
    } else if (levelKey === 'districtId') {
      const distObj = districts.find((d) => String(d.id) === val);
      next.divisionId = distObj?.division_id ? String(distObj.division_id) : next.divisionId || '';
      next.districtId = val;
      next.upazilaId = '';
      next.unionId = '';
      next.wardId = '';
    } else if (levelKey === 'upazilaId') {
      next.upazilaId = val;
      next.unionId = '';
      next.wardId = '';
    } else if (levelKey === 'unionId') {
      next.unionId = val;
      next.wardId = '';
    } else if (levelKey === 'wardId') {
      next.wardId = val;
    }

    onChange?.(next, {
      division: divisions.find((d) => String(d.id) === String(next.divisionId)) || null,
      district: districts.find((d) => String(d.id) === String(next.districtId)) || null,
      upazila: upazilas.find((u) => String(u.id) === String(next.upazilaId)) || null,
      union: unions.find((u) => String(u.id) === String(next.unionId)) || null,
      ward: wards.find((w) => String(w.id) === String(next.wardId)) || null
    });
  };

  return (
    <div className={`space-y-3 ${compact ? '' : 'bg-white border border-stone-200 rounded-2xl p-4'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
          <Compass className="w-4 h-4 text-rose-700" />
          <span>{isBn ? 'এলাকা নির্বাচন করুন (ম্যানুয়াল)' : 'Select Bangladesh Area (Manual)'}</span>
        </div>
        {showPrivacyNote && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? 'কোনো GPS বা স্বয়ংক্রিয় লোকেশন নেওয়া হয় না'
                : 'No passive GPS tracking — manual choice only'}
            </span>
          </span>
        )}
      </div>

      <div className={`grid gap-2.5 ${includeDeepLevels ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
            {isBn ? 'বিভাগ (Division)' : 'Division'}
          </label>
          <select
            value={value.divisionId || ''}
            onChange={(e) => handleField('divisionId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="">{isBn ? '-- সব বিভাগ --' : '-- All Divisions --'}</option>
            {divisions.map((div) => (
              <option key={div.id} value={String(div.id)}>
                {isBn ? div.name_bn : div.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
            {isBn ? 'জেলা (District)' : 'District'}
          </label>
          <select
            value={value.districtId || ''}
            onChange={(e) => handleField('districtId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="">{isBn ? '-- সব জেলা (৬৪ জেলা) --' : '-- All Districts (64) --'}</option>
            {filteredDistricts.map((dist) => (
              <option key={dist.id} value={String(dist.id)}>
                {isBn ? dist.name_bn : dist.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
            {isBn ? 'উপজেলা / থানা' : 'Upazila / Thana'}
          </label>
          <select
            value={value.upazilaId || ''}
            disabled={!value.districtId}
            onChange={(e) => handleField('upazilaId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="">
              {!value.districtId
                ? isBn
                  ? 'আগে জেলা নির্বাচন করুন'
                  : 'Select District first'
                : isBn
                  ? '-- সব উপজেলা --'
                  : '-- All Upazilas --'}
            </option>
            {upazilas.map((upz) => (
              <option key={upz.id} value={String(upz.id)}>
                {isBn ? upz.name_bn : upz.name_en}
              </option>
            ))}
          </select>
        </div>

        {includeDeepLevels && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                {isBn ? 'ইউনিয়ন / পৌরসভা' : 'Union / Pourashava'}
              </label>
              <select
                value={value.unionId || ''}
                disabled={!value.upazilaId}
                onChange={(e) => handleField('unionId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="">{isBn ? '-- ঐচ্ছিক --' : '-- Optional --'}</option>
                {unions.map((un) => (
                  <option key={un.id} value={String(un.id)}>
                    {isBn ? un.name_bn : un.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                {isBn ? 'ওয়ার্ড' : 'Ward'}
              </label>
              <select
                value={value.wardId || ''}
                disabled={!value.unionId}
                onChange={(e) => handleField('wardId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="">{isBn ? '-- ঐচ্ছিক --' : '-- Optional --'}</option>
                {wards.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {isBn ? w.name_bn : w.name_en}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {onClear && (value.divisionId || value.districtId || value.upazilaId) && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
          >
            <MapPin className="w-3 h-3" />
            <span>{isBn ? 'নির্বাচিত এলাকা রিসেট করুন' : 'Reset Selected Area'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationSelectorBar;


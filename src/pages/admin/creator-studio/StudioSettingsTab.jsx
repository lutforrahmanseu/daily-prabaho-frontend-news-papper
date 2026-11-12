import React, { useEffect, useState } from 'react';
import { Settings, Palette, Shield, Plug, Save, Plus, Trash2, CheckCircle2, Loader2, Edit3 } from 'lucide-react';
import {
  useGetCreatorStudioSettingsQuery,
  useUpdateCreatorStudioSettingsMutation,
  useTestCreatorConnectorMutation,
  useGetCreatorBrandTemplatesQuery,
  useSaveCreatorBrandTemplateMutation,
  useDeleteCreatorBrandTemplateMutation,
  useGetCreatorStudioPermissionsQuery,
  useUpdateCreatorRolePermissionsMutation,
} from '../../../store/api/creatorStudioApi.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

const EXPORT_FORMAT_OPTIONS = ['png', 'svg', 'mp4', 'webm', 'srt', 'vtt', 'mp3', 'wav'];
const CONNECTOR_KEYS = [
  { id: 'openai_tts', label: 'OpenAI (TTS & Whisper)' },
  { id: 'google_tts', label: 'Google Cloud TTS' },
  { id: 'custom_tts', label: 'Custom HTTPS TTS' },
  { id: 'youtube_shorts', label: 'YouTube Shorts API' },
  { id: 'facebook_reels', label: 'Facebook Reels Graph API' },
  { id: 'instagram_reels', label: 'Instagram Reels API' },
  { id: 'x_video', label: 'X (Twitter) Media API' },
  { id: 'tiktok', label: 'TikTok Content API' },
  { id: 'webhook', label: 'Signed Outbound Webhook' },
];

export default function StudioSettingsTab({ canManageSettings }) {
  const [subTab, setSubTab] = useState('pipeline');

  const { data: settingsData } = useGetCreatorStudioSettingsQuery();
  const { data: templates = [] } = useGetCreatorBrandTemplatesQuery();
  const { data: permissionsData } = useGetCreatorStudioPermissionsQuery(undefined, { skip: !canManageSettings });

  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateCreatorStudioSettingsMutation();
  const [testConnector, { isLoading: isTestingConnector }] = useTestCreatorConnectorMutation();
  const [saveTemplate, { isLoading: isSavingTemplate }] = useSaveCreatorBrandTemplateMutation();
  const [deleteTemplate] = useDeleteCreatorBrandTemplateMutation();
  const [updateRolePerms, { isLoading: isSavingPerms }] = useUpdateCreatorRolePermissionsMutation();

  // Pipeline Settings State
  const [form, setForm] = useState({
    studio_enabled: true,
    script_provider: 'local_safe',
    tts_provider: 'local_tts_preview',
    tts_default_voice_bn: 'bn-BD-NewsAnchor-F',
    tts_default_voice_en: 'en-US-Broadcast-M',
    stt_provider: 'local_cue_aligner',
    stt_default_language: 'bn',
    allow_external_tts: false,
    allow_external_stt: false,
    allow_external_publish: false,
    ffmpeg_enabled: false,
    require_script_approval_before_publish: true,
    require_explicit_external_auth: true,
    default_font_family: 'Noto Sans Bengali, Hind Siliguri, Inter, sans-serif',
    max_upload_mb: 250,
    allowed_export_formats: EXPORT_FORMAT_OPTIONS,
    integration_configs: {},
  });
  const [secretInputs, setSecretInputs] = useState({});
  const [connectorStatuses, setConnectorStatuses] = useState({});

  // Brand Template Editor State
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [tplForm, setTplForm] = useState({
    name: '',
    template_type: 'quote_card',
    aspect_ratio: '1:1',
    font_family: 'Inter, sans-serif',
    bn_font_family: 'Noto Sans Bengali, Hind Siliguri, sans-serif',
    primary_color: '#0F172A',
    secondary_color: '#B91C1C',
    accent_color: '#F59E0B',
    text_color: '#FFFFFF',
    watermark_position: 'top-right',
    watermark_opacity: 0.9,
    is_default: false,
    is_active: true,
  });

  // Permissions Draft Map
  const [rolePermsDraft, setRolePermsDraft] = useState({});

  useEffect(() => {
    const s = settingsData?.settings;
    if (s) {
      setForm({
        studio_enabled: !!s.studio_enabled,
        script_provider: s.script_provider || 'local_safe',
        tts_provider: s.tts_provider || 'local_tts_preview',
        tts_default_voice_bn: s.tts_default_voice_bn || 'bn-BD-NewsAnchor-F',
        tts_default_voice_en: s.tts_default_voice_en || 'en-US-Broadcast-M',
        stt_provider: s.stt_provider || 'local_cue_aligner',
        stt_default_language: s.stt_default_language || 'bn',
        allow_external_tts: !!s.allow_external_tts,
        allow_external_stt: !!s.allow_external_stt,
        allow_external_publish: !!s.allow_external_publish,
        ffmpeg_enabled: !!s.ffmpeg_enabled,
        require_script_approval_before_publish: s.require_script_approval_before_publish !== false,
        require_explicit_external_auth: s.require_explicit_external_auth !== false,
        default_font_family: s.default_font_family || 'Noto Sans Bengali, Hind Siliguri, Inter, sans-serif',
        max_upload_mb: s.max_upload_mb || 250,
        allowed_export_formats: Array.isArray(s.allowed_export_formats) ? s.allowed_export_formats : EXPORT_FORMAT_OPTIONS,
        integration_configs: s.integration_configs || {},
      });
    }
  }, [settingsData]);

  useEffect(() => {
    if (permissionsData?.roles) {
      const next = {};
      permissionsData.roles.forEach((r) => {
        next[r.id] = Array.isArray(r.permission_slugs) ? [...r.permission_slugs] : [];
      });
      setRolePermsDraft(next);
    }
  }, [permissionsData]);

  const toggleExportFormat = (fmt) => {
    setForm((prev) => ({
      ...prev,
      allowed_export_formats: prev.allowed_export_formats.includes(fmt)
        ? prev.allowed_export_formats.filter((x) => x !== fmt)
        : [...prev.allowed_export_formats, fmt],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const nonEmptySecrets = {};
      Object.entries(secretInputs).forEach(([k, v]) => {
        if (String(v || '').trim()) nonEmptySecrets[k] = String(v).trim();
      });
      await updateSettings({
        ...form,
        ...(Object.keys(nonEmptySecrets).length ? { secrets: nonEmptySecrets } : {}),
      }).unwrap();
      setSecretInputs({});
      sweetAlert.toast('ক্রিয়েটর স্টুডিও সেটিংস সংরক্ষিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('সেটিংস সংরক্ষণ ব্যর্থ', extractApiError(err));
    }
  };

  const handleTestConnector = async (providerId) => {
    try {
      const res = await testConnector(providerId).unwrap();
      setConnectorStatuses((prev) => ({ ...prev, [providerId]: res }));
      sweetAlert.toast(`${providerId}: ${res?.message || 'Checked'}`, res?.reachable ? 'success' : 'warning');
    } catch (err) {
      sweetAlert.error('কানেক্টর পরীক্ষা ব্যর্থ', extractApiError(err));
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      await saveTemplate({
        ...(editingTemplateId ? { id: editingTemplateId } : {}),
        ...tplForm,
      }).unwrap();
      setEditingTemplateId(null);
      setTplForm({
        name: '',
        template_type: 'quote_card',
        aspect_ratio: '1:1',
        font_family: 'Inter, sans-serif',
        bn_font_family: 'Noto Sans Bengali, Hind Siliguri, sans-serif',
        primary_color: '#0F172A',
        secondary_color: '#B91C1C',
        accent_color: '#F59E0B',
        text_color: '#FFFFFF',
        watermark_position: 'top-right',
        watermark_opacity: 0.9,
        is_default: false,
        is_active: true,
      });
      sweetAlert.toast('ব্র্যান্ড টেমপ্লেট সংরক্ষিত হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('টেমপ্লেট সংরক্ষণ ব্যর্থ', extractApiError(err));
    }
  };

  const handleEditTemplate = (tpl) => {
    setEditingTemplateId(tpl.id);
    setTplForm({
      name: tpl.name || '',
      template_type: tpl.template_type || 'quote_card',
      aspect_ratio: tpl.aspect_ratio || '1:1',
      font_family: tpl.font_family || 'Inter, sans-serif',
      bn_font_family: tpl.bn_font_family || 'Noto Sans Bengali, sans-serif',
      primary_color: tpl.primary_color || '#0F172A',
      secondary_color: tpl.secondary_color || '#B91C1C',
      accent_color: tpl.accent_color || '#F59E0B',
      text_color: tpl.text_color || '#FFFFFF',
      watermark_position: tpl.watermark_position || 'top-right',
      watermark_opacity: tpl.watermark_opacity ?? 0.9,
      is_default: !!tpl.is_default,
      is_active: tpl.is_active !== false,
    });
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await deleteTemplate(id).unwrap();
      sweetAlert.toast('টেমপ্লেট মুছে ফেলা হয়েছে', 'info');
    } catch (err) {
      sweetAlert.error('মুছে ফেলা ব্যর্থ', extractApiError(err));
    }
  };

  const toggleRolePermission = (roleId, slug) => {
    setRolePermsDraft((prev) => {
      const current = prev[roleId] || [];
      const next = current.includes(slug) ? current.filter((x) => x !== slug) : [...current, slug];
      return { ...prev, [roleId]: next };
    });
  };

  const handleSaveRolePermissions = async (roleId) => {
    try {
      await updateRolePerms({
        roleId,
        permission_slugs: rolePermsDraft[roleId] || [],
      }).unwrap();
      sweetAlert.toast('ভূমিকার ক্রিয়েটর স্টুডিও অনুমতি হালনাগাদ হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('অনুমতি সংরক্ষণ ব্যর্থ', extractApiError(err));
    }
  };

  const ttsCatalog = settingsData?.tts_catalog || {};
  const sttCatalog = settingsData?.stt_catalog || {};
  const maskedSecrets = settingsData?.masked_secrets || {};

  return (
    <div className="space-y-5">
      {!canManageSettings && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          আপনি শুধুমাত্র প্রিভিউ মোডে সেটিংস দেখতে পারছেন। পরিবর্তনের জন্য `creator_studio.settings.manage` অনুমতি প্রয়োজন।
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'pipeline', label: 'ফরম্যাট, TTS/STT ও ইন্টিগ্রেশন', icon: Plug },
          { id: 'templates', label: 'ব্র্যান্ড টেমপ্লেট, ফন্ট ও ওয়াটারমার্ক', icon: Palette },
          { id: 'rbac', label: 'ভূমিকা ও অনুমতি (RBAC)', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Subtab 1: Pipeline, Providers & Connectors */}
      {subTab === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" /> মিডিয়া পাইপলাইন ও প্রোভাইডার কনফিগারেশন
            </h4>
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                settingsData?.ffmpeg_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              FFmpeg সার্ভার বাইনারি: {settingsData?.ffmpeg_available ? 'উপলব্ধ' : 'অফলাইন (Built-In Safe Fallback সক্রিয়)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">স্ক্রিপ্ট ইঞ্জিন</label>
              <select
                value={form.script_provider}
                disabled={!canManageSettings}
                onChange={(e) => setForm({ ...form, script_provider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="local_safe">NewsFlow Safe Local Engine</option>
                <option value="ai_gateway">NewsFlow AI Gateway (Phase 20)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ডিফল্ট TTS প্রোভাইডার</label>
              <select
                value={form.tts_provider}
                disabled={!canManageSettings}
                onChange={(e) => setForm({ ...form, tts_provider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                {Object.entries(ttsCatalog).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label || key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ডিফল্ট STT (সাবটাইটেল)</label>
              <select
                value={form.stt_provider}
                disabled={!canManageSettings}
                onChange={(e) => setForm({ ...form, stt_provider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                {Object.entries(sttCatalog).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label || key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ডিফল্ট ফন্ট ফ্যামিলি</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={form.default_font_family}
                onChange={(e) => setForm({ ...form, default_font_family: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">সর্বোচ্চ আপলোড সীমা (MB)</label>
              <input
                type="number"
                min={5}
                max={2048}
                disabled={!canManageSettings}
                value={form.max_upload_mb}
                onChange={(e) => setForm({ ...form, max_upload_mb: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Governance Safety Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            {[
              { key: 'studio_enabled', label: 'Creator Studio সক্রিয়' },
              { key: 'require_script_approval_before_publish', label: 'প্রকাশের আগে স্ক্রিপ্ট অনুমোদন বাধ্যতামূলক' },
              { key: 'require_explicit_external_auth', label: 'বহিঃস্থ প্রকাশের জন্য স্পষ্ট সম্পাদকীয় অনুমোদন' },
              { key: 'allow_external_publish', label: 'বহিঃস্থ সোশ্যাল প্ল্যাটফর্ম প্রকাশনা অনুমোদিত' },
              { key: 'allow_external_tts', label: 'ক্লাউড TTS API অনুমতি' },
              { key: 'allow_external_stt', label: 'ক্লাউড STT / Whisper অনুমতি' },
              { key: 'ffmpeg_enabled', label: 'সার্ভার FFmpeg রেন্ডারিং সক্রিয়' },
            ].map((item) => (
              <label key={item.key} className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={!!form[item.key]}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                {item.label}
              </label>
            ))}
          </div>

          {/* Allowed Export Formats */}
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">অনুমোদিত এক্সপোর্ট ফরম্যাট</div>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMAT_OPTIONS.map((fmt) => {
                const active = form.allowed_export_formats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    type="button"
                    disabled={!canManageSettings}
                    onClick={() => toggleExportFormat(fmt)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    .{fmt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Encrypted Connectors & Masked Secrets */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              বহিঃস্থ কানেক্টর URL ও এনক্রিপ্টেড API কী (SSRF-সুরক্ষিত)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONNECTOR_KEYS.map((conn) => {
                const currentEndpoint = form.integration_configs?.[conn.id]?.endpoint_url || '';
                const masked = maskedSecrets[`${conn.id}_api_key`] || maskedSecrets[conn.id];
                const testState = connectorStatuses[conn.id];

                return (
                  <div key={conn.id} className="p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{conn.label}</span>
                      {canManageSettings && (
                        <button
                          type="button"
                          disabled={isTestingConnector}
                          onClick={() => handleTestConnector(conn.id)}
                          className="px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                        >
                          পরীক্ষা করুন
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      disabled={!canManageSettings}
                      value={currentEndpoint}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          integration_configs: {
                            ...prev.integration_configs,
                            [conn.id]: { ...(prev.integration_configs?.[conn.id] || {}), endpoint_url: e.target.value },
                          },
                        }))
                      }
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                    />
                    <input
                      type="password"
                      disabled={!canManageSettings}
                      value={secretInputs[`${conn.id}_api_key`] || ''}
                      onChange={(e) =>
                        setSecretInputs((prev) => ({ ...prev, [`${conn.id}_api_key`]: e.target.value }))
                      }
                      placeholder={masked ? `সংরক্ষিত কী: ${masked} (পরিবর্তনের জন্য লিখুন)` : 'API Key / Token লিখুন...'}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                    />
                    {testState && (
                      <div className={`text-[11px] ${testState.reachable ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {testState.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {canManageSettings && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                সেটিংস সংরক্ষণ করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Brand Templates */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              {editingTemplateId ? `টেমপ্লেট #${editingTemplateId} সম্পাদনা` : 'নতুন ব্র্যান্ড টেমপ্লেট তৈরি'}
            </h4>
            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">টেমপ্লেটের নাম</label>
                <input
                  type="text"
                  required
                  disabled={!canManageSettings}
                  value={tplForm.name}
                  onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                  placeholder="যেমন: Daily Prabaho Breaking Card"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">টেমপ্লেট ধরন</label>
                  <select
                    disabled={!canManageSettings}
                    value={tplForm.template_type}
                    onChange={(e) => setTplForm({ ...tplForm, template_type: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="quote_card">Quote Card</option>
                    <option value="vertical_video">Vertical Video</option>
                    <option value="thumbnail">Thumbnail</option>
                    <option value="story_card">Story Card</option>
                    <option value="caption_preset">Caption Preset</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">অনুপাত (Aspect Ratio)</label>
                  <select
                    disabled={!canManageSettings}
                    value={tplForm.aspect_ratio}
                    onChange={(e) => setTplForm({ ...tplForm, aspect_ratio: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                    <option value="9:16">9:16 (Reels / Shorts)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'primary_color', label: 'Primary' },
                  { key: 'secondary_color', label: 'Secondary' },
                  { key: 'accent_color', label: 'Accent' },
                  { key: 'text_color', label: 'Text' },
                ].map((c) => (
                  <div key={c.key}>
                    <label className="block font-semibold text-slate-600 mb-1">{c.label}</label>
                    <input
                      type="color"
                      disabled={!canManageSettings}
                      value={tplForm[c.key]}
                      onChange={(e) => setTplForm({ ...tplForm, [c.key]: e.target.value })}
                      className="w-full h-9 rounded border border-slate-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">বাংলা ফন্ট</label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={tplForm.bn_font_family}
                    onChange={(e) => setTplForm({ ...tplForm, bn_font_family: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">লোগো/ওয়াটারমার্ক অবস্থান</label>
                  <select
                    disabled={!canManageSettings}
                    value={tplForm.watermark_position}
                    onChange={(e) => setTplForm({ ...tplForm, watermark_position: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="center-bottom">Center Bottom</option>
                  </select>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={tplForm.is_default}
                  onChange={(e) => setTplForm({ ...tplForm, is_default: e.target.checked })}
                />
                ডিফল্ট টেমপ্লেট হিসেবে সেট করুন
              </label>

              {canManageSettings && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingTemplate}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    <Save className="w-3.5 h-3.5" /> {editingTemplateId ? 'আপডেট করুন' : 'টেমপ্লেট যোগ করুন'}
                  </button>
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => setEditingTemplateId(null)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600"
                    >
                      বাতিল
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3">সংরক্ষিত ব্র্যান্ড টেমপ্লেট ({templates.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{tpl.name}</div>
                      <div className="text-slate-500">
                        {tpl.template_type} • {tpl.aspect_ratio} ({tpl.width_px}x{tpl.height_px})
                      </div>
                    </div>
                    {tpl.is_default && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[tpl.primary_color, tpl.secondary_color, tpl.accent_color, tpl.text_color].map((col, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-slate-300"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                    <span className="text-[11px] text-slate-500 ml-1">{tpl.watermark_position}</span>
                  </div>
                  {canManageSettings && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(tpl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50"
                      >
                        <Edit3 className="w-3 h-3" /> সম্পাদনা
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" /> মুছুন
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Creator Studio RBAC Matrix */}
      {subTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3">ভূমিকা অনুযায়ী ক্রিয়েটর স্টুডিও অনুমতি</h4>
          {!canManageSettings ? (
            <p className="text-xs text-slate-500">এই সেকশনটি দেখার ও সম্পাদনার অনুমতি কেবলমাত্র অ্যাডমিনিস্ট্রেটরদের রয়েছে।</p>
          ) : !permissionsData?.roles?.length ? (
            <p className="text-xs text-slate-500">ভূমিকা ও অনুমতি লোড হচ্ছে...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">ভূমিকা (Role)</th>
                    {permissionsData.permissions.map((perm) => (
                      <th key={perm.id} className="py-2 px-2 text-center">
                        <div className="font-bold text-slate-700">{perm.slug.replace('creator_studio.', '')}</div>
                      </th>
                    ))}
                    <th className="py-2 px-3 text-right">সংরক্ষণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissionsData.roles.map((role) => (
                    <tr key={role.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{role.name}</td>
                      {permissionsData.permissions.map((perm) => {
                        const checked = (rolePermsDraft[role.id] || []).includes(perm.slug);
                        return (
                          <td key={perm.id} className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRolePermission(role.id, perm.slug)}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          disabled={isSavingPerms}
                          onClick={() => handleSaveRolePermissions(role.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                        >
                          <CheckCircle2 className="w-3 h-3" /> সেভ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


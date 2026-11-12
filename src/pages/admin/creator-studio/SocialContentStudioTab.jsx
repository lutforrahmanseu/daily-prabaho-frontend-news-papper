import React, { useEffect, useRef, useState } from 'react';
import { Palette, Sparkles, Download, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import {
  useGetCreatorBrandTemplatesQuery,
  useCreateCreatorSocialAssetMutation,
  useRenderCreatorSocialAssetMutation,
  useUploadCreatorRenderedAssetMutation,
  useApproveCreatorSocialAssetMutation,
} from '../../../store/api/creatorStudioApi.js';
import { ASSET_TYPE_OPTIONS, resolveCanvasGeometry } from '../../../utils/creatorStudioHelpers.js';
import { extractApiError } from '../../../utils/apiNormalizer.js';
import sweetAlert from '../../../utils/sweetAlert.js';

export default function SocialContentStudioTab({ project, canCreate, canApprove }) {
  const { data: templates = [] } = useGetCreatorBrandTemplatesQuery();
  const assets = project?.social_assets || [];

  const [assetType, setAssetType] = useState('quote_card');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [templateId, setTemplateId] = useState('');
  const [headline, setHeadline] = useState(project?.news?.title || project?.title || '');
  const [quoteText, setQuoteText] = useState(project?.news?.summary || '');
  const [captionText, setCaptionText] = useState('');
  const [hashtagsText, setHashtagsText] = useState('#DailyPrabaho #Bangladesh #NewsUpdate');
  const [attributionText, setAttributionText] = useState('ডেইলি প্রবাহ নিউজ ডেস্ক');

  const canvasRef = useRef(null);

  const [createAsset, { isLoading: isCreating }] = useCreateCreatorSocialAssetMutation();
  const [renderAsset, { isLoading: isRendering }] = useRenderCreatorSocialAssetMutation();
  const [uploadRendered, { isLoading: isUploadingCanvas }] = useUploadCreatorRenderedAssetMutation();
  const [approveAsset] = useApproveCreatorSocialAssetMutation();

  const selectedTemplate = templates.find((t) => String(t.id) === String(templateId)) || templates[0] || null;

  useEffect(() => {
    if (!templateId && templates.length) {
      const match = templates.find((t) => t.template_type === assetType) || templates[0];
      if (match) {
        setTemplateId(String(match.id));
        setAspectRatio(match.aspect_ratio);
      }
    }
  }, [templates.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const geom = resolveCanvasGeometry(aspectRatio);
    canvas.width = geom.width;
    canvas.height = geom.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const primary = selectedTemplate?.primary_color || '#0F172A';
    const secondary = selectedTemplate?.secondary_color || '#B91C1C';
    const accent = selectedTemplate?.accent_color || '#F59E0B';
    const textCol = selectedTemplate?.text_color || '#FFFFFF';

    const grad = ctx.createLinearGradient(0, 0, geom.width, geom.height);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, geom.width, geom.height);

    // Safe-zone guide for 9:16 Reels/Shorts
    if (aspectRatio === '9:16') {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(geom.pad, geom.safeTop, geom.width - geom.pad * 2, geom.height - geom.safeTop - geom.safeBottom);
      ctx.setLineDash([]);
    }

    // Pill badge
    ctx.fillStyle = accent;
    ctx.fillRect(geom.pad, geom.safeTop, 300, 48);
    ctx.fillStyle = primary;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(assetType.replace('_', ' ').toUpperCase(), geom.pad + 20, geom.safeTop + 32);

    // Wrap headline
    ctx.fillStyle = textCol;
    ctx.font = `bold ${aspectRatio === '16:9' ? 44 : 50}px "Noto Sans Bengali", sans-serif`;
    const words = String(headline || '').split(' ');
    let line = '';
    let y = Math.round(geom.height * 0.38);
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > geom.width - geom.pad * 2) {
        ctx.fillText(line, geom.pad, y);
        line = word;
        y += 64;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, geom.pad, y);
      y += 68;
    }

    // Quote text
    if (quoteText) {
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '28px "Noto Sans Bengali", sans-serif';
      const qWords = String(quoteText).slice(0, 180).split(' ');
      let qLine = '';
      for (const word of qWords) {
        const test = qLine ? `${qLine} ${word}` : word;
        if (ctx.measureText(test).width > geom.width - geom.pad * 2) {
          ctx.fillText(qLine, geom.pad, y);
          qLine = word;
          y += 40;
        } else {
          qLine = test;
        }
      }
      if (qLine) ctx.fillText(qLine, geom.pad, y);
    }

    // Attribution Footer
    ctx.fillStyle = accent;
    ctx.font = 'bold 26px "Noto Sans Bengali", sans-serif';
    ctx.fillText(attributionText || 'Daily Prabaho Studio', geom.pad, geom.height - 56);
  }, [aspectRatio, assetType, headline, quoteText, attributionText, selectedTemplate]);

  const handleCreateAsset = async () => {
    try {
      await createAsset({
        projectId: project.id,
        template_id: selectedTemplate?.id,
        asset_type: assetType,
        aspect_ratio: aspectRatio,
        export_format: assetType === 'vertical_video' ? 'mp4' : 'png',
        headline,
        quote_text: quoteText,
        caption_text: captionText || `${headline}\n\n${hashtagsText}`,
        hashtags: hashtagsText.split(/\s+/).filter(Boolean),
        attribution_text: attributionText,
        render_immediately: true,
      }).unwrap();
      sweetAlert.toast('সোশ্যাল কনটেন্ট অ্যাসেট তৈরি ও রেন্ডার হয়েছে', 'success');
    } catch (err) {
      sweetAlert.error('অ্যাসেট তৈরি ব্যর্থ', extractApiError(err));
    }
  };

  const handleUploadCanvasPng = async (asset) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const formData = new FormData();
        formData.append('file', blob, `creator-card-${asset.id}.png`);
        await uploadRendered({ projectId: project.id, assetId: asset.id, formData }).unwrap();
        sweetAlert.toast('হাই-রেজোলিউশন Canvas PNG আপলোড সম্পন্ন', 'success');
      } catch (err) {
        sweetAlert.error('PNG আপলোড ব্যর্থ', extractApiError(err));
      }
    }, 'image/png');
  };

  const handleLocalDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `creator-studio-${assetType}-${aspectRatio}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" /> কার্ড, থাম্বনেইল ও ভার্টিক্যাল ভিডিও (৯:১৬) বিল্ডার
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">কনটেন্ট ধরন</label>
              <select
                value={assetType}
                onChange={(e) => {
                  const next = e.target.value;
                  setAssetType(next);
                  const found = ASSET_TYPE_OPTIONS.find((o) => o.id === next);
                  if (found) setAspectRatio(found.defaultAspect);
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              >
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">অ্যাসপেক্ট রেশিও</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              >
                <option value="1:1">1:1 (Square Post)</option>
                <option value="4:5">4:5 (Instagram Portrait)</option>
                <option value="9:16">9:16 (Reels / Shorts / Story)</option>
                <option value="16:9">16:9 (YouTube Thumbnail)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ব্র্যান্ড টেমপ্লেট</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">কার্ড / থাম্বনেইল শিরোনাম</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">উদ্ধৃতি / সংক্ষিপ্ত টেক্সট</label>
            <textarea
              rows={2}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ক্রেডিট / অ্যাট্রিবিউশন</label>
              <input
                type="text"
                value={attributionText}
                onChange={(e) => setAttributionText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">হ্যাশট্যাগ</label>
              <input
                type="text"
                value={hashtagsText}
                onChange={(e) => setHashtagsText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">সোশ্যাল পোস্ট ক্যাপশন</label>
            <textarea
              rows={2}
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="পোস্টের ক্যাপশন লিখুন (খালি থাকলে শিরোনাম থেকে তৈরি হবে)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCreateAsset}
              disabled={!canCreate || isCreating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              অ্যাসেট তৈরি ও সংরক্ষণ করুন
            </button>
            <button
              type="button"
              onClick={handleLocalDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> PNG ডাউনলোড
            </button>
          </div>
        </div>

        {/* Live Canvas Brand Preview */}
        <div className="lg:col-span-5 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-300 mb-2 font-mono">
            LIVE BRAND PREVIEW ({aspectRatio}) {aspectRatio === '9:16' ? '· Reels Safe Zone Dashed' : ''}
          </span>
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[420px] rounded-lg shadow-xl border border-slate-700 object-contain"
          />
        </div>
      </div>

      {/* Rendered Assets Library */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">তৈরিকৃত সোশ্যাল ও ভিডিও অ্যাসেট ({assets.length})</h4>
        {assets.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">এখনো কোনো কার্ড বা ভার্টিক্যাল লেআউট তৈরি করা হয়নি।</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-indigo-700">
                    {asset.asset_type} · {asset.aspect_ratio}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-300 font-medium">
                    Render: {asset.render_status} ({asset.render_driver}) · {asset.approval_status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{asset.headline}</p>
                {asset.caption_text && <p className="text-xs text-slate-600 line-clamp-2">{asset.caption_text}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => renderAsset({ projectId: project.id, assetId: asset.id })}
                      disabled={isRendering}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold hover:bg-slate-100"
                    >
                      সার্ভার রেন্ডার
                    </button>
                  )}
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => handleUploadCanvasPng(asset)}
                      disabled={isUploadingCanvas}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> বর্তমান Canvas PNG সংযুক্ত
                    </button>
                  )}
                  {canApprove && asset.approval_status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => approveAsset({ projectId: project.id, assetId: asset.id })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


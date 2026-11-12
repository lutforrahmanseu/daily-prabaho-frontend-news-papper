import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { setEpaperModalOpen } from '../../store/uiSlice.js';
import { useGetPublicEpaperByDateQuery, useIssueEpaperAccessGrantMutation } from '../../store/api/epaperArchiveApi.js';
import { useProtectedBlobUrl } from '../../hooks/useProtectedBlobUrl.js';
import {
  buildPdfFragmentUrl,
  getAccessControlMessage,
  getDownloadPermissionMessage,
  resolveEpaperApiUrl
} from '../../utils/epaperHelpers.js';
import { Modal } from '../common/Modal.jsx';
import { getBengaliNewspaperDate, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  BookOpen
} from 'lucide-react';

export function EpaperModal() {
  const dispatch = useDispatch();
  const { epaperModalOpen, language } = useSelector((state) => state.ui);
  const { token: readerToken } = useSelector((state) => state.reader);
  const { token: adminToken } = useSelector((state) => state.auth);
  const effectiveToken = readerToken || adminToken || null;

  const { data: dateBundle, isLoading } = useGetPublicEpaperByDateQuery(
    {},
    { skip: !epaperModalOpen }
  );
  const [issueAccessGrant] = useIssueEpaperAccessGrantMutation();

  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  const isBn = language === 'bn';
  const edition = dateBundle?.selected || null;
  const pages = edition?.pages || [];
  const totalPages = Math.max(1, pages.length || edition?.pdf_page_count || 1);

  useEffect(() => {
    setActivePage(1);
  }, [edition?.id]);

  const currentPageData = pages.find((p) => p.page_number === activePage) || pages[0] || null;
  const streamTarget =
    epaperModalOpen && edition?.access_granted
      ? currentPageData?.has_own_pdf
        ? currentPageData.pdf_stream_url
        : edition.stream_url
      : null;

  const { blobUrl } = useProtectedBlobUrl(streamTarget, effectiveToken, !streamTarget);

  const handleDownload = async () => {
    if (!edition?.id || !edition?.can_download) return;
    try {
      const grant = await issueAccessGrant({ editionId: edition.id, purpose: 'download' }).unwrap();
      if (grant?.signed_url) {
        const a = document.createElement('a');
        a.href = resolveEpaperApiUrl(grant.signed_url);
        a.download = edition.pdf_original_name || `${edition.slug}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      // Quietly fallback to full reader link
    }
  };

  return (
    <Modal
      isOpen={epaperModalOpen}
      onClose={() => dispatch(setEpaperModalOpen(false))}
      title={isBn ? 'দৈনিক বার্তা প্রবাহ — আজকের ই-পেপার' : "Daily Prabaho — Today's E-Paper"}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Controls Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-white border border-stone-300 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-stone-800">
              {isBn
                ? `পৃষ্ঠা ${toBengaliNumber(activePage)} / ${toBengaliNumber(totalPages)}`
                : `Page ${activePage} of ${totalPages}`}
            </span>
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-white border border-stone-300 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1.5 rounded bg-white border border-stone-300 hover:bg-stone-50 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(160, z + 10))}
              className="p-1.5 rounded bg-white border border-stone-300 hover:bg-stone-50 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={!edition?.can_download}
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-700 disabled:bg-stone-300 text-white font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{getDownloadPermissionMessage(edition || {}, Boolean(effectiveToken), isBn)}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-stone-800 text-white hover:bg-stone-900 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <Link
              to="/epaper"
              onClick={() => dispatch(setEpaperModalOpen(false))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-rose-700 text-white hover:bg-rose-800 font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isBn ? 'পূর্ণাঙ্গ রিডার ও আর্কাইভ' : 'Full E-Paper Reader'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Viewer Body */}
        {isLoading ? (
          <div className="p-10 text-center text-sm text-stone-500">
            {isBn ? 'ই-পেপার লোড হচ্ছে...' : 'Loading E-paper...'}
          </div>
        ) : !edition ? (
          <div className="p-10 text-center text-sm text-stone-500 space-y-2">
            <p>{isBn ? 'বর্তমানে কোনো প্রকাশিত ই-পেপার সংখ্যা পাওয়া যায়নি।' : 'No published E-paper edition available.'}</p>
            <Link
              to="/epaper"
              onClick={() => dispatch(setEpaperModalOpen(false))}
              className="inline-block px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold"
            >
              {isBn ? 'আর্কাইভ দেখুন' : 'Browse Archive'}
            </Link>
          </div>
        ) : !edition.access_granted ? (
          <div className="p-10 text-center space-y-3 bg-amber-50 rounded-xl border border-amber-200">
            <Lock className="w-8 h-8 text-amber-700 mx-auto" />
            <p className="text-sm font-semibold text-stone-800">
              {getAccessControlMessage(edition.lock_reason, isBn)}
            </p>
            <Link
              to="/reader/login"
              onClick={() => dispatch(setEpaperModalOpen(false))}
              className="inline-block px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold"
            >
              {isBn ? 'পাঠক লগইন' : 'Reader Sign In'}
            </Link>
          </div>
        ) : blobUrl ? (
          <iframe
            src={buildPdfFragmentUrl(blobUrl, currentPageData?.pdf_source_page || activePage, zoomLevel)}
            title={edition.title}
            className="w-full h-[65vh] rounded-lg border border-stone-300 bg-white"
          />
        ) : (
          <div className="p-6 bg-[#faf8f5] rounded-lg border border-stone-300 space-y-4">
            <div className="text-center border-b-2 border-stone-900 pb-3">
              <p className="text-xs text-stone-500">
                {getBengaliNewspaperDate(new Date(edition.publication_date || new Date()))} · {edition.edition_name_bn}
              </p>
              <h2 className="text-2xl font-extrabold font-serif-bn text-stone-900 mt-1">
                {currentPageData?.headline || edition.title}
              </h2>
            </div>
            <p className="text-sm text-stone-700 font-serif-bn leading-relaxed">
              {currentPageData?.summary || currentPageData?.extracted_text || edition.summary}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default EpaperModal;

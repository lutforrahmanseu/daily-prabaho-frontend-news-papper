import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetPublicEpaperByDateQuery,
  useGetPublicEpaperEditionQuery,
  useGetPublicEpaperListQuery,
  useIssueEpaperAccessGrantMutation
} from '../../store/api/epaperArchiveApi.js';
import { useProtectedBlobUrl } from '../../hooks/useProtectedBlobUrl.js';
import {
  BENGALI_MONTHS,
  EPAPER_EDITION_CODES,
  buildPdfFragmentUrl,
  formatPdfBytes,
  getAccessControlMessage,
  getDownloadPermissionMessage,
  resolveEpaperApiUrl
} from '../../utils/epaperHelpers.js';
import { getBengaliNewspaperDate, toBengaliNumber } from '../../utils/bengaliFormatter.js';
import SEO from '../../components/common/SEO.jsx';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Archive,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  Newspaper,
  Printer,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export function EpaperReaderPage() {
  const { date: paramDate, slug: paramSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { language } = useSelector((state) => state.ui);
  const { token: readerToken } = useSelector((state) => state.reader);
  const { token: adminToken } = useSelector((state) => state.auth);
  const effectiveToken = readerToken || adminToken || null;
  const isBn = language === 'bn';

  const editionQueryCode = searchParams.get('edition') || '';
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [selectedDate, setSelectedDate] = useState(paramDate || '');
  const [activePageNumber, setActivePageNumber] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState('pdf'); // 'pdf' | 'accessible'
  const [highContrast, setHighContrast] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Historical E-paper Archive filters
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYear, setArchiveYear] = useState('');
  const [archiveMonth, setArchiveMonth] = useState('');
  const [archiveEditionCode, setArchiveEditionCode] = useState('all');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (paramDate) {
      setSelectedDate(paramDate);
    }
  }, [paramDate]);

  // 1. Load by edition slug OR by publication date
  const {
    data: slugEdition,
    isLoading: loadingSlug,
    isFetching: fetchingSlug
  } = useGetPublicEpaperEditionQuery(paramSlug, { skip: !paramSlug });

  const {
    data: dateBundle,
    isLoading: loadingDate,
    isFetching: fetchingDate
  } = useGetPublicEpaperByDateQuery(
    { date: selectedDate, edition_code: editionQueryCode },
    { skip: Boolean(paramSlug) }
  );

  // 2. Historical editions search list
  const { data: archiveList } = useGetPublicEpaperListQuery({
    search: archiveSearch.trim() || undefined,
    year: archiveYear || undefined,
    month: archiveMonth || undefined,
    edition_code: archiveEditionCode !== 'all' ? archiveEditionCode : undefined,
    per_page: 20
  });

  const [issueAccessGrant] = useIssueEpaperAccessGrantMutation();

  const edition = paramSlug ? slugEdition : dateBundle?.selected;
  const availableDateEditions = useMemo(() => {
    if (paramSlug && edition) return [edition];
    return dateBundle?.available_editions || [];
  }, [paramSlug, edition, dateBundle]);

  const facets = archiveList?.facets || dateBundle?.facets || { available_dates: [], years: [], editions: [] };
  const pages = edition?.pages || [];

  useEffect(() => {
    if (pages.length > 0 && activePageNumber > pages.length) {
      setActivePageNumber(1);
    }
  }, [pages.length, activePageNumber]);

  const activePage = useMemo(() => {
    if (!pages.length) return null;
    return pages.find((p) => p.page_number === activePageNumber) || pages[0];
  }, [pages, activePageNumber]);

  // Fetch protected PDF stream strictly when authorized & active
  const pdfTargetUrl =
    edition?.access_granted
      ? activePage?.has_own_pdf
        ? activePage.pdf_stream_url
        : edition.stream_url
      : null;

  const {
    blobUrl: pdfBlobUrl,
    loading: pdfLoading,
    error: pdfError
  } = useProtectedBlobUrl(pdfTargetUrl, effectiveToken, !pdfTargetUrl);

  // Fetch optional page preview image if uploaded
  const pagePreviewPath = edition?.access_granted && activePage?.has_preview ? activePage.preview_url : null;
  const { blobUrl: previewImageBlob } = useProtectedBlobUrl(pagePreviewPath, effectiveToken, !pagePreviewPath);

  const totalPages = Math.max(1, pages.length || edition?.pdf_page_count || 1);

  // Accessible keyboard navigation (ArrowLeft / ArrowRight / +/- zoom)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
      if (event.key === 'ArrowRight') {
        setActivePageNumber((p) => Math.min(totalPages, p + 1));
      } else if (event.key === 'ArrowLeft') {
        setActivePageNumber((p) => Math.max(1, p - 1));
      } else if (event.key === '+' || event.key === '=') {
        setZoomLevel((z) => Math.min(180, z + 10));
      } else if (event.key === '-') {
        setZoomLevel((z) => Math.max(60, z - 10));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [totalPages]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setActivePageNumber(1);
    if (paramSlug) {
      navigate(newDate ? `/epaper/${newDate}` : '/epaper');
    } else if (newDate) {
      navigate(`/epaper/${newDate}${editionQueryCode ? `?edition=${editionQueryCode}` : ''}`);
    }
  };

  const handleSwitchEditionCode = (code) => {
    setActivePageNumber(1);
    if (paramSlug) {
      const targetDate = edition?.publication_date || '';
      navigate(targetDate ? `/epaper/${targetDate}?edition=${code}` : `/epaper?edition=${code}`);
    } else {
      setSearchParams({ edition: code });
    }
  };

  const handleOpenSignedPdfTab = async () => {
    if (!edition?.id) return;
    try {
      const grant = await issueAccessGrant({
        editionId: edition.id,
        purpose: 'preview',
        page_id: activePage?.has_own_pdf ? activePage.id : null
      }).unwrap();
      if (grant?.signed_url) {
        const fullUrl = resolveEpaperApiUrl(grant.signed_url);
        const pageSuffix = activePage?.pdf_source_page ? `#page=${activePage.pdf_source_page}` : '';
        window.open(`${fullUrl}${pageSuffix}`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      sweetAlert.error(isBn ? 'নিরাপদ PDF লিংক তৈরি করা যায়নি' : 'Could not open protected PDF preview');
    }
  };

  const handleDownloadPdf = async () => {
    if (!edition?.id) return;
    if (!edition.can_download) {
      if (!effectiveToken && edition.download_policy === 'registered') {
        sweetAlert.info(isBn ? 'ডাউনলোডের জন্য পাঠক অ্যাকাউন্টে লগইন করুন' : 'Please sign in to download this PDF');
      } else {
        sweetAlert.warning(isBn ? 'এই সংস্করণের PDF ডাউনলোড অনুমোদিত নয়' : 'Download is restricted for this edition');
      }
      return;
    }

    setDownloading(true);
    try {
      const grant = await issueAccessGrant({
        editionId: edition.id,
        purpose: 'download'
      }).unwrap();

      if (grant?.signed_url) {
        const a = document.createElement('a');
        a.href = resolveEpaperApiUrl(grant.signed_url);
        a.download = edition.pdf_original_name || `${edition.slug || 'epaper'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        sweetAlert.success(isBn ? 'ই-পেপার PDF ডাউনলোড শুরু হয়েছে' : 'E-paper PDF download started');
      }
    } catch {
      sweetAlert.error(isBn ? 'PDF ডাউনলোড করা যায়নি' : 'Unable to download E-paper PDF');
    } finally {
      setDownloading(false);
    }
  };

  const isLoadingPage = loadingSlug || loadingDate || fetchingSlug || fetchingDate;
  const formattedPubDate = edition?.publication_date
    ? getBengaliNewspaperDate(new Date(edition.publication_date))
    : getBengaliNewspaperDate(new Date());

  return (
    <main
      id="epaper-reader-main"
      className={`min-h-screen py-6 transition-colors ${highContrast ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'}`}
    >
      <SEO
        title={isBn ? 'ডিজিটাল ই-পেপার পাঠক' : 'Digital E-Paper Reader'}
        description={
          isBn
            ? 'দৈনিক বার্তা প্রবাহের প্রতিদিনের ডিজিটাল ই-পেপার, সংস্করণ অনুযায়ী পাতা ও পুরোনো দিনের আর্কাইভ।'
            : 'Read Daily Prabaho daily digital E-paper editions, navigate pages, and browse date archives.'
        }
      />

      {/* Screen reader status live region */}
      <div className="sr-only" aria-live="polite">
        {edition && activePage
          ? `${edition.title}, ${isBn ? 'পৃষ্ঠা' : 'Page'} ${activePage.page_number}: ${activePage.section_name_bn}`
          : ''}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        {/* Top Masthead & Archive Filter Bar */}
        <section
          aria-label={isBn ? 'ই-পেপার নিয়ন্ত্রণ ও তারিখ নির্বাচন' : 'E-paper Controls and Date Selector'}
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs ${
            highContrast ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
                <Newspaper className="w-4 h-4" />
                <span>{isBn ? 'দৈনিক বার্তা প্রবাহ · ডিজিটাল ই-পেপার' : 'Daily Prabaho · Digital E-Paper'}</span>
                {edition?.pdf_metadata?.safety_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    {isBn ? 'সুরক্ষিত PDF' : 'Verified PDF'}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-serif-bn mt-1">
                {isBn ? edition?.title || 'ই-পেপার সংস্করণ' : edition?.title_en || edition?.title || 'E-Paper Reader'}
              </h1>
              <p className={`text-xs mt-1 ${highContrast ? 'text-stone-300' : 'text-stone-500'}`}>
                {formattedPubDate}
                {edition?.edition_name_bn ? ` · ${isBn ? edition.edition_name_bn : edition.edition_name_en}` : ''}
                {edition?.issue_number ? ` · ${edition.issue_number}` : ''}
                {edition?.pdf_size ? ` · ${formatPdfBytes(edition.pdf_size)}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Calendar className="w-4 h-4 text-rose-700" />
                <span className="sr-only">{isBn ? 'প্রকাশের তারিখ' : 'Publication date'}</span>
                <input
                  type="date"
                  value={selectedDate || edition?.publication_date || ''}
                  onChange={(e) => handleDateChange(e.target.value)}
                  aria-label={isBn ? 'ই-পেপার প্রকাশের তারিখ নির্বাচন করুন' : 'Select E-paper publication date'}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs font-semibold"
                />
              </label>

              <button
                type="button"
                onClick={() => setArchiveOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-rose-700" />
                <span>{isBn ? 'পুরোনো ই-পেপার আর্কাইভ' : 'Historical Editions'}</span>
              </button>

              <Link
                to={edition?.publication_date ? `/archive?date=${edition.publication_date}` : '/archive'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isBn ? 'ওই দিনের সংবাদ আর্কাইভ' : 'News Archive'}</span>
              </Link>
            </div>
          </div>

          {/* Regional Edition Switcher + Quick Date Pills */}
          <div className="mt-4 pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={isBn ? 'সংস্করণ নির্বাচন' : 'Select Edition'}>
              {availableDateEditions.map((ed) => {
                const active = edition?.id === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => handleSwitchEditionCode(ed.edition_code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-rose-700 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isBn ? ed.edition_name_bn : ed.edition_name_en}
                    {ed.access_level !== 'public' && ' 🔒'}
                  </button>
                );
              })}
            </div>

            {facets?.available_dates?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={highContrast ? 'text-stone-400 font-semibold' : 'text-stone-500 font-semibold'}>
                  {isBn ? 'সাম্প্রতিক সংখ্যা:' : 'Recent dates:'}
                </span>
                {facets.available_dates.slice(0, 5).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDateChange(d)}
                    className={`px-2 py-0.5 rounded border text-[11px] font-mono cursor-pointer ${
                      (selectedDate || edition?.publication_date) === d
                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Historical Editions Search Panel */}
        {archiveOpen && (
          <section
            aria-label={isBn ? 'ঐতিহাসিক ই-পেপার অনুসন্ধান' : 'Search Historical Editions'}
            className="rounded-2xl border border-stone-200 bg-white text-stone-900 p-4 sm:p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold font-serif-bn flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-700" />
                <span>{isBn ? 'পুরোনো ই-পেপার খুঁজুন (তারিখ, মাস, সংস্করণ বা শিরোনাম)' : 'Search Historical Editions'}</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setArchiveSearch('');
                  setArchiveYear('');
                  setArchiveMonth('');
                  setArchiveEditionCode('all');
                }}
                className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
              >
                {isBn ? 'রিসেট' : 'Reset'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="search"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder={isBn ? 'শিরোনাম বা পাতার বিষয় লিখুন...' : 'Search edition or PDF text...'}
                className="px-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
              <select
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
                aria-label={isBn ? 'বছর' : 'Year'}
                className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="">{isBn ? 'সব বছর' : 'All Years'}</option>
                {(facets?.years || []).map((y) => (
                  <option key={y.year} value={y.year}>
                    {isBn ? toBengaliNumber(y.year) : y.year} ({y.count})
                  </option>
                ))}
              </select>
              <select
                value={archiveMonth}
                onChange={(e) => setArchiveMonth(e.target.value)}
                aria-label={isBn ? 'মাস' : 'Month'}
                className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="">{isBn ? 'সব মাস' : 'All Months'}</option>
                {BENGALI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isBn ? m.nameBn : m.nameEn}
                  </option>
                ))}
              </select>
              <select
                value={archiveEditionCode}
                onChange={(e) => setArchiveEditionCode(e.target.value)}
                aria-label={isBn ? 'সংস্করণ' : 'Edition'}
                className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="all">{isBn ? 'সব সংস্করণ' : 'All Editions'}</option>
                {EPAPER_EDITION_CODES.map((ec) => (
                  <option key={ec.code} value={ec.code}>
                    {isBn ? ec.nameBn : ec.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {(archiveList?.items || []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setArchiveOpen(false);
                    setActivePageNumber(1);
                    navigate(`/epaper/edition/${item.slug}`);
                  }}
                  className="text-left p-3 rounded-xl border border-stone-200 hover:border-rose-400 hover:bg-rose-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                    <span>{item.publication_date}</span>
                    <span>{item.pages_count} পাতা</span>
                  </div>
                  <p className="text-xs font-bold text-stone-900 mt-1 line-clamp-2 font-serif-bn">
                    {isBn ? item.title : item.title_en}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                      {isBn ? item.edition_name_bn : item.edition_name_en}
                    </span>
                    {!item.access_granted && <span className="text-amber-700 font-bold">🔒 লকড</span>}
                  </div>
                </button>
              ))}
              {(!archiveList?.items || archiveList.items.length === 0) && (
                <p className="text-xs text-stone-500 col-span-full py-4 text-center">
                  {isBn ? 'এই ফিল্টারে কোনো ই-পেপার সংখ্যা পাওয়া যায়নি।' : 'No archived editions match these filters.'}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Loading / Empty / Access Lock States */}
        {isLoadingPage ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500 text-sm">
            {isBn ? 'ই-পেপার সংস্করণ লোড হচ্ছে...' : 'Loading E-paper edition...'}
          </div>
        ) : !edition ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center space-y-3">
            <Newspaper className="w-10 h-10 text-stone-400 mx-auto" />
            <h2 className="text-lg font-bold text-stone-800 font-serif-bn">
              {isBn ? 'এই তারিখে কোনো ই-পেপার প্রকাশিত হয়নি' : 'No E-Paper Found for This Date'}
            </h2>
            <p className="text-xs text-stone-500">
              {isBn
                ? 'অন্য তারিখ নির্বাচন করুন অথবা নিচের সর্বশেষ সংখ্যা দেখুন।'
                : 'Select another date or browse the latest available editions.'}
            </p>
            {facets?.available_dates?.[0] && (
              <button
                type="button"
                onClick={() => handleDateChange(facets.available_dates[0])}
                className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? `সর্বশেষ সংখ্যা (${facets.available_dates[0]})` : `Latest Edition (${facets.available_dates[0]})`}
              </button>
            )}
          </div>
        ) : !edition.access_granted ? (
          /* Strict Reader Access Control Notice */
          <section
            aria-label={isBn ? 'পাঠক প্রবেশাধিকার নিয়ন্ত্রণ' : 'Reader Access Control'}
            className="rounded-2xl border border-amber-200 bg-amber-50/80 text-stone-900 p-8 sm:p-10 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold font-serif-bn">
              {isBn ? 'সংরক্ষিত ই-পেপার সংস্করণ' : 'Protected E-Paper Edition'}
            </h2>
            <p className="text-sm text-stone-700 max-w-lg mx-auto">
              {getAccessControlMessage(edition.lock_reason, isBn)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!effectiveToken ? (
                <>
                  <Link
                    to={`/reader/login?next=${encodeURIComponent(window.location.pathname)}`}
                    className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                  >
                    {isBn ? 'পাঠক অ্যাকাউন্টে লগইন করুন' : 'Sign In to Read'}
                  </Link>
                  <Link
                    to="/reader/register"
                    className="px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold"
                  >
                    {isBn ? 'নতুন পাঠক নিবন্ধন' : 'Register Free Account'}
                  </Link>
                </>
              ) : (
                <Link
                  to="/reader/profile"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"
                >
                  {isBn ? 'সদস্যতা ও প্রোফাইল দেখুন' : 'View Subscription Status'}
                </Link>
              )}
            </div>
          </section>
        ) : (
          /* Authorized Accessible E-Paper Reader Workspace */
          <div className="space-y-4">
            {/* Reader Toolbar */}
            <div
              role="toolbar"
              aria-label={isBn ? 'পৃষ্ঠা ও জুম নিয়ন্ত্রণ' : 'Page and Zoom Controls'}
              className={`rounded-2xl border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 ${
                highContrast ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              }`}
            >
              {/* Page Previous / Indicator / Next */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePageNumber <= 1}
                  onClick={() => setActivePageNumber((p) => Math.max(1, p - 1))}
                  aria-label={isBn ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous Page'}
                  className="p-2 rounded-lg border border-stone-300 bg-white text-stone-800 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2">
                  {isBn
                    ? `পৃষ্ঠা ${toBengaliNumber(activePageNumber)} / ${toBengaliNumber(totalPages)}`
                    : `Page ${activePageNumber} of ${totalPages}`}
                </span>
                <button
                  type="button"
                  disabled={activePageNumber >= totalPages}
                  onClick={() => setActivePageNumber((p) => Math.min(totalPages, p + 1))}
                  aria-label={isBn ? 'পরবর্তী পৃষ্ঠা' : 'Next Page'}
                  className="p-2 rounded-lg border border-stone-300 bg-white text-stone-800 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Mode & Accessibility Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg bg-stone-100 p-0.5 border border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('pdf')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      viewMode === 'pdf' ? 'bg-rose-700 text-white' : 'text-stone-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isBn ? 'PDF প্রিভিউ' : 'PDF Preview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('accessible')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      viewMode === 'accessible' ? 'bg-rose-700 text-white' : 'text-stone-700'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সহজ পাঠ মোড' : 'Accessible Text'}</span>
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="inline-flex items-center gap-1 bg-stone-100 rounded-lg px-1.5 py-1 border border-stone-200 text-stone-800">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                    aria-label={isBn ? 'জুম কমান' : 'Zoom out'}
                    className="p-1 hover:bg-white rounded cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold px-1">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(180, z + 10))}
                    aria-label={isBn ? 'জুম বাড়ান' : 'Zoom in'}
                    className="p-1 hover:bg-white rounded cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setHighContrast((h) => !h)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold cursor-pointer"
                >
                  {highContrast ? (isBn ? 'স্বাভাবিক মোড' : 'Light Mode') : (isBn ? 'হাই কন্ট্রাস্ট' : 'High Contrast')}
                </button>

                {edition.has_pdf && (
                  <button
                    type="button"
                    onClick={handleOpenSignedPdfTab}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isBn ? 'নতুন ট্যাবে PDF' : 'Open PDF Tab'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
                </button>

                <button
                  type="button"
                  disabled={downloading || !edition.has_pdf}
                  onClick={handleDownloadPdf}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    edition.can_download
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {!edition.can_download && <Lock className="w-3.5 h-3.5" />}
                  {edition.can_download && <Download className="w-3.5 h-3.5" />}
                  <span>
                    {downloading
                      ? isBn
                        ? 'প্রস্তুত হচ্ছে...'
                        : 'Downloading...'
                      : getDownloadPermissionMessage(edition, Boolean(effectiveToken), isBn)}
                  </span>
                </button>
              </div>
            </div>

            {/* Reader Workspace: Left Page Index Sidebar + Main Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Page Navigator Sidebar */}
              <aside
                aria-label={isBn ? 'পৃষ্ঠা তালিকা' : 'E-paper Page List'}
                className={`lg:col-span-3 rounded-2xl border p-3.5 space-y-2 ${
                  highContrast ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                }`}
              >
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 px-1">
                  {isBn ? `সকল পাতা (${toBengaliNumber(totalPages)})` : `All Pages (${totalPages})`}
                </h2>
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[70vh] pb-1">
                  {pages.length > 0 ? (
                    pages.map((p) => {
                      const isActive = p.page_number === activePage?.page_number;
                      return (
                        <button
                          key={p.id || p.page_number}
                          type="button"
                          onClick={() => setActivePageNumber(p.page_number)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`min-w-[170px] lg:min-w-0 w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                              : highContrast
                                ? 'bg-stone-800 border-stone-700 text-stone-100 hover:border-rose-500'
                                : 'bg-stone-50 border-stone-200 text-stone-800 hover:border-rose-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>
                              {isBn ? `পৃষ্ঠা ${toBengaliNumber(p.page_number)}` : `Page ${p.page_number}`}
                            </span>
                            <span className="opacity-80">{isBn ? p.section_name_bn : p.section_name_en}</span>
                          </div>
                          {p.headline && (
                            <p className={`text-xs mt-1 line-clamp-2 font-serif-bn ${isActive ? 'text-rose-50' : 'opacity-80'}`}>
                              {p.headline}
                            </p>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setActivePageNumber(num)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                          activePageNumber === num ? 'bg-rose-700 text-white' : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {isBn ? `পৃষ্ঠা ${toBengaliNumber(num)}` : `Page ${num}`}
                      </button>
                    ))
                  )}
                </div>
              </aside>

              {/* Main Accessible Reader Canvas */}
              <section
                aria-label={isBn ? 'ই-পেপার প্রদর্শনী' : 'E-paper Document Viewport'}
                className={`lg:col-span-9 rounded-2xl border overflow-hidden ${
                  highContrast ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                }`}
              >
                {/* Active Page Metadata Banner */}
                <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2 ${
                  highContrast ? 'border-stone-700 bg-stone-800/70' : 'border-stone-200 bg-stone-50'
                }`}>
                  <div>
                    <span className="text-[11px] font-bold text-rose-700 uppercase">
                      {isBn
                        ? `পৃষ্ঠা ${toBengaliNumber(activePageNumber)} · ${activePage?.section_name_bn || 'সংস্করণ'}`
                        : `Page ${activePageNumber} · ${activePage?.section_name_en || 'Edition'}`}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold font-serif-bn">
                      {activePage?.headline || edition.title}
                    </h2>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {isBn ? 'কীবোর্ড: ← / → পাতা পরিবর্তন' : 'Keyboard: ← / → Turn Pages'}
                  </span>
                </div>

                {/* View Mode Content */}
                {viewMode === 'pdf' && edition.has_pdf ? (
                  <div className="p-3 sm:p-4 bg-stone-200/70 space-y-4">
                    {previewImageBlob && (
                      <div className="bg-white rounded-xl p-2 border border-stone-300 shadow-xs">
                        <img
                          src={previewImageBlob}
                          alt={activePage?.headline || `Page ${activePageNumber}`}
                          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                          className="w-full max-h-[75vh] object-contain mx-auto transition-transform"
                        />
                      </div>
                    )}

                    {pdfLoading ? (
                      <div className="h-[520px] flex items-center justify-center text-sm text-stone-600 bg-white rounded-xl">
                        {isBn ? 'নিরাপদ স্টোরেজ থেকে PDF প্রিভিউ লোড হচ্ছে...' : 'Loading protected PDF preview...'}
                      </div>
                    ) : pdfBlobUrl ? (
                      <iframe
                        key={`${edition.id}-${activePageNumber}-${zoomLevel}`}
                        src={buildPdfFragmentUrl(pdfBlobUrl, activePage?.pdf_source_page || activePageNumber, zoomLevel)}
                        title={`${edition.title} - ${isBn ? 'পৃষ্ঠা' : 'Page'} ${activePageNumber}`}
                        className="w-full h-[78vh] min-h-[560px] rounded-xl border border-stone-300 bg-white shadow-sm"
                      />
                    ) : (
                      <div className="p-8 text-center bg-white rounded-xl text-sm text-stone-600 space-y-2">
                        <FileText className="w-8 h-8 text-stone-400 mx-auto" />
                        <p>
                          {pdfError
                            ? isBn
                              ? 'PDF প্রিভিউ প্রদর্শনে অনুমোদন বা ত্রুটি ঘটেছে।'
                              : 'Unable to display protected PDF preview.'
                            : isBn
                              ? 'PDF প্রদর্শনের জন্য প্রস্তুত নয়। সহজ পাঠ মোড ব্যবহার করুন।'
                              : 'PDF stream unavailable; switch to Accessible Text mode.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Accessible Broadsheet Text & Story Links View */
                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="border-b-2 border-stone-900 pb-4 text-center">
                      <p className="text-xs font-bold text-rose-700">
                        {formattedPubDate} · {isBn ? edition.edition_name_bn : edition.edition_name_en}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold font-serif-bn mt-1">
                        {activePage?.headline || edition.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        {isBn ? activePage?.section_name_bn : activePage?.section_name_en}
                      </p>
                    </div>

                    {previewImageBlob && (
                      <img
                        src={previewImageBlob}
                        alt={activePage?.headline || `Page ${activePageNumber}`}
                        className="w-full max-h-[520px] object-contain rounded-xl border border-stone-200 bg-stone-50"
                      />
                    )}

                    {activePage?.summary && (
                      <p className="text-base leading-relaxed font-serif-bn">
                        {activePage.summary}
                      </p>
                    )}

                    {activePage?.extracted_text && (
                      <div className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                        highContrast ? 'bg-stone-800 border-stone-700 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}>
                        <span className="font-bold text-[11px] uppercase tracking-wider text-rose-700 block mb-1">
                          {isBn ? 'PDF থেকে সংগৃহীত মূল পাঠ্য' : 'Extracted Print Edition Text'}
                        </span>
                        <p>{activePage.extracted_text}</p>
                      </div>
                    )}

                    {activePage?.related_news_ids?.length > 0 && (
                      <div className="pt-3 border-t border-stone-200/70">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                          {isBn ? 'এই পাতার সাথে সম্পর্কিত অনলাইন প্রতিবেদন' : 'Related Online Reports'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activePage.related_news_ids.map((newsId) => (
                            <Link
                              key={newsId}
                              to={`/news/${newsId}`}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200"
                            >
                              {isBn ? `প্রতিবেদন #${toBengaliNumber(newsId)} পড়ুন` : `Read Article #${newsId}`}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default EpaperReaderPage;


import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle, Award, Calendar, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import SEO from '../../components/common/SEO.jsx';
import { useVerifyEventCertificateQuery } from '../../store/api/eventsApi.js';
import { formatBengaliFullDateTime } from '../../utils/bengaliFormatter.js';

export function CertificateVerifyPage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const [inputCode, setInputCode] = useState(urlCode || '');
  const [activeCode, setActiveCode] = useState((urlCode || '').trim().toUpperCase());

  useEffect(() => {
    if (urlCode) {
      const normalized = urlCode.trim().toUpperCase();
      setInputCode(normalized);
      setActiveCode(normalized);
    }
  }, [urlCode]);

  const { data: result, isFetching, isError } = useVerifyEventCertificateQuery(activeCode, {
    skip: !activeCode
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();
    if (!cleaned) return;
    setActiveCode(cleaned);
    navigate(`/certificates/verify/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <SEO
        title={isBn ? 'সনদপত্র যাচাই কেন্দ্র' : 'Certificate Verification'}
        description="Verify official Daily Prabaho event and competition certificates."
      />

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif-bn">
              {isBn ? 'অফিশিয়াল সনদ যাচাই কেন্দ্র' : 'Official Certificate Verification'}
            </h1>
            <p className="text-xs text-stone-500">
              {isBn
                ? 'দৈনিক বার্তা প্রবাহের ইভেন্ট ও প্রতিযোগিতার সনদ কোড (যেমন CERT-202611-WIN01) লিখে সত্যতা যাচাই করুন।'
                : 'Enter a certificate verification code (e.g. CERT-202611-WIN01) to validate its authenticity.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="CERT-202611-WIN01"
            className="flex-1 px-4 py-2.5 text-sm font-mono uppercase rounded-xl border border-stone-300 focus:outline-rose-700"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold"
          >
            <Search className="w-4 h-4" />
            <span>{isFetching ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...') : isBn ? 'যাচাই করুন' : 'Verify'}</span>
          </button>
        </form>

        {activeCode && isError && !isFetching && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">
                {isBn ? 'এই কোডে কোনো সনদ পাওয়া যায়নি।' : 'No certificate found matching this code.'}
              </p>
              <p className="mt-1">
                {isBn ? 'দয়া করে সনদ কোডটি সঠিকভাবে পরীক্ষা করুন।' : 'Please double-check the verification code.'}
              </p>
            </div>
          </div>
        )}

        {result && !isError && (
          <div
            className={`border rounded-2xl p-6 space-y-4 ${
              result.is_valid
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-red-50/70 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {result.is_valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                )}
                <span className={`text-sm font-black ${result.is_valid ? 'text-emerald-900' : 'text-red-900'}`}>
                  {result.is_valid
                    ? isBn
                      ? 'বৈধ ও অনুমোদিত সনদ'
                      : 'Verified & Valid Certificate'
                    : isBn
                    ? 'বাতিলকৃত সনদ (Revoked)'
                    : 'Revoked Certificate'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white border border-stone-200 text-stone-800">
                {result.certificate_code}
              </span>
            </div>

            {result.is_revoked && result.revoked_reason && (
              <p className="text-xs font-semibold text-red-800 bg-white/80 p-3 rounded-lg border border-red-200">
                {isBn ? 'বাতিলের কারণ:' : 'Revocation reason:'} {result.revoked_reason}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl p-4 border border-stone-200/80 text-xs">
              <div>
                <p className="text-stone-500 font-semibold">{isBn ? 'প্রাপকের নাম' : 'Recipient'}</p>
                <p className="text-base font-black text-stone-900 mt-0.5">{result.recipient_display_name}</p>
              </div>
              <div>
                <p className="text-stone-500 font-semibold">{isBn ? 'অর্জন / স্বীকৃতি' : 'Achievement'}</p>
                <p className="text-sm font-bold text-stone-900 mt-0.5">{result.achievement_title}</p>
              </div>
              <div>
                <p className="text-stone-500 font-semibold">{isBn ? 'ইভেন্ট ও আয়োজক' : 'Event & Organizer'}</p>
                {result.event ? (
                  <Link to={`/events/${result.event.slug}`} className="text-rose-700 font-bold hover:underline block mt-0.5">
                    {result.event.title}
                  </Link>
                ) : (
                  <span>—</span>
                )}
                {result.event?.organizer_name && (
                  <p className="text-stone-500 mt-0.5">{result.event.organizer_name}</p>
                )}
              </div>
              <div>
                <p className="text-stone-500 font-semibold">{isBn ? 'প্রদানের তারিখ' : 'Issued Date'}</p>
                <p className="font-semibold text-stone-800 mt-0.5 inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {result.issued_at ? formatBengaliFullDateTime(result.issued_at) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500">
        <Link to="/events" className="hover:text-rose-700 font-semibold inline-flex items-center gap-1">
          <Award className="w-4 h-4" />
          <span>{isBn ? 'ইভেন্ট ও প্রতিযোগিতা কেন্দ্রে ফিরুন' : 'Back to Events & Projects Hub'}</span>
        </Link>
      </div>
    </div>
  );
}

export default CertificateVerifyPage;


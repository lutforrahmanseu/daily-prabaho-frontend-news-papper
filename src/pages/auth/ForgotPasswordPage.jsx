import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backendRequestPasswordReset } from '../../services/authRbacBackend.js';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('reporter@dailyprabaho.com');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetData, setResetData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = backendRequestPasswordReset(email);
      if (res.success) {
        setResetData({
          email,
          token: res.resetToken,
          message: res.message
        });
      } else {
        setErrorMessage(res.error || 'পাসওয়ার্ড রিসেট অনুরোধ ব্যর্থ হয়েছে।');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-rose-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Lockup */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center text-white font-bold font-serif-bn text-xl shadow-lg">
              প্র
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-bn tracking-tight">
              দৈনিক বার্তা প্রবাহ
            </h1>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-stone-400 font-mono">
              Password Recovery • সিকিউরিটি ভেরিফিকেশন
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          
          {!resetData ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-stone-700/60 border border-stone-600/60 flex items-center justify-center text-rose-400 mb-4">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold font-serif-bn text-white">
                  পাসওয়ার্ড ভুলে গেছেন?
                </h2>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  আপনার নিবন্ধিত প্রাতিষ্ঠানিক ইমেইল দিন। আমরা পাসওয়ার্ড রিসেট করার জন্য একটি সুরক্ষিত টোকেন লিংক পাঠাব।
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-stone-300 mb-1.5">
                    অফিসিয়াল ইমেইল ঠিকানা
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reporter@dailyprabaho.com"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 active:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-rose-500 shadow-lg shadow-rose-950/50 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      টোকেন তৈরি করা হচ্ছে...
                    </>
                  ) : (
                    <>
                      রিসেট টোকেন পাঠান
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif-bn text-white">
                  রিসেট টোকেন তৈরি হয়েছে!
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  ইমেইল: <span className="font-mono text-emerald-300 font-bold">{resetData.email}</span>
                </p>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  নিরাপত্তা নির্দেশিকা অনুযায়ী রিসেট টোকেনটির মেয়াদ ১ ঘণ্টার জন্য বৈধ।
                </p>
              </div>

              {/* Simulated Token display */}
              <div className="p-3 bg-stone-900/90 border border-stone-700 rounded-xl text-left">
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                  <span>জেনারেটেড সিকিউরিটি টোকেন:</span>
                  <span className="text-[10px] text-amber-400 font-mono">Simulated</span>
                </div>
                <div className="font-mono text-xs text-rose-300 break-all bg-black/40 p-2 rounded border border-stone-800 select-all">
                  {resetData.token}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/reset-password?token=${encodeURIComponent(resetData.token)}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  নতুন পাসওয়ার্ড সেট করুন (Proceed to Reset)
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setResetData(null)}
                  className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  অন্য ইমেইলে পুনরায় অনুরোধ করুন
                </button>
              </div>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-stone-700/70 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              লগইন পেজে ফিরে যান
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ForgotPasswordPage;


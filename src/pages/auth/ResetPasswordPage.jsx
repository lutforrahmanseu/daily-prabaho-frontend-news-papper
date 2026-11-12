import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { backendResetPassword } from '../../services/authRbacBackend.js';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize token from URL if present
  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'কোনো পাসওয়ার্ড নেই', color: 'bg-stone-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'খুব দুর্বল (Weak)', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'মাঝারি (Fair)', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'শক্তিশালী (Good)', color: 'bg-emerald-500' };
      case 4:
        return { score: 4, label: 'অত্যন্ত শক্তিশালী (Strong)', color: 'bg-teal-400' };
      default:
        return { score: 0, label: 'খুব দুর্বল', color: 'bg-rose-600' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('পাসওয়ার্ড রিসেট টোকেন আবশ্যক।');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = backendResetPassword(token.trim(), newPassword, confirmPassword);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
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
              Create New Password • নতুন ক্রেডেনশিয়াল
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-stone-700/60 border border-stone-600/60 flex items-center justify-center text-rose-400 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold font-serif-bn text-white">
                  নতুন পাসওয়ার্ড তৈরি করুন
                </h2>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  আপনার অ্যাকাউন্টের নিরাপত্তার জন্য একটি শক্তিশালী ও গোপনীয় পাসওয়ার্ড নির্বাচন করুন।
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Reset Token Input */}
                <div>
                  <label htmlFor="token" className="block text-xs font-semibold text-stone-300 mb-1.5">
                    রিসেট সিকিউরিটি টোকেন
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      id="token"
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="reset-xxx-xxx"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPass" className="block text-xs font-semibold text-stone-300 mb-1.5">
                    নতুন পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="newPass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর..."
                      className="block w-full pl-9 pr-10 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 transition-all duration-300 ${
                              strength.score >= step ? strength.color : 'bg-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-stone-400">শক্তি:</span>
                        <span className="font-mono text-stone-300 font-semibold">{strength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPass" className="block text-xs font-semibold text-stone-300 mb-1.5">
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="confirmPass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 active:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-rose-500 shadow-lg shadow-rose-950/50 transition-all disabled:opacity-60 cursor-pointer pt-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      পাসওয়ার্ড হালনাগাদ হচ্ছে...
                    </>
                  ) : (
                    <>
                      পাসওয়ার্ড পরিবর্তন ও সংরক্ষণ করুন
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
                  পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  আপনার নতুন পাসওয়ার্ড সক্রিয় করা হয়েছে। এবার আপনার নতুন পাসওয়ার্ড ব্যবহার করে কন্ট্রোল রুমে লগইন করুন।
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
                >
                  সরাসরি লগইন পেজে যান
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Back to Login */}
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

export default ResetPasswordPage;


import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentRole, setCurrentUser, addAuditLog } from '../../store/adminSlice.js';
import { setCredentials } from '../../store/authSlice.js';
import { useLoginMutation } from '../../store/api/authApi.js';
import { ROLES_DEFINITION, INITIAL_AUTH_USERS } from '../../services/authRbacBackend.js';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loginApi, { isLoading: isApiLoading }] = useLoginMutation();

  const [email, setEmail] = useState('superadmin@dailyprabaho.com');
  const [password, setPassword] = useState('prabaho@2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 8 Demo accounts matching the 8 roles
  const demoAccounts = INITIAL_AUTH_USERS.map((usr) => {
    const roleDef = ROLES_DEFINITION[usr.role] || {};
    return {
      role: usr.role,
      roleBn: roleDef.nameBn,
      roleEn: roleDef.nameEn,
      name: usr.name,
      email: usr.email,
      department: usr.department,
      permsCount: roleDef.permissions?.length || 0,
      badgeColor: roleDef.badgeColor
    };
  });

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('prabaho@2026');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('ইমেইল এবং পাসওয়ার্ড উভয় ক্ষেত্র পূরণ করুন।');
      return;
    }

    try {
      const res = await loginApi({ email, password }).unwrap();

      if (!res?.user) {
        setErrorMessage(res?.message || 'লগইন ব্যর্থ হয়েছে।');
        return;
      }

      // Synchronize with Redux Auth and Admin states
      dispatch(setCredentials({ user: res.user, token: res.token }));
      dispatch(setCurrentRole(res.user.role));
      dispatch(setCurrentUser(res.user));
      dispatch(addAuditLog({
        user: res.user.name,
        role: res.user.roleName || ROLES_DEFINITION[res.user.role]?.nameBn || res.user.role,
        action: 'সিস্টেম লগইন (Successful Login)',
        target: 'Admin CMS Portal'
      }));

      setSuccessMessage('লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');

      const fromPath = location.state?.from?.pathname || '/admin/dashboard';
      setTimeout(() => {
        navigate(fromPath, { replace: true });
      }, 500);
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে।');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-rose-900 selection:text-white">
      
      {/* Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center text-white font-bold font-serif-bn text-xl shadow-lg">
              প্র
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-bn tracking-tight">
              দৈনিক বার্তা প্রবাহ
            </h1>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-stone-400 font-mono">
              Editorial CMS & RBAC Control Room • প্রাতিষ্ঠানিক প্রবেশদ্বার
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between pb-4 border-b border-stone-700/80">
            <div>
              <h2 className="text-xl font-bold font-serif-bn text-white">
                কন্ট্রোল রুমে প্রবেশ
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                নিরাপদ ও নির্ভরযোগ্য সম্পাদকীয় ব্যবস্থাপনাতন্ত্র
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-stone-700/70 border border-stone-600 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-stone-300 mb-1">
                প্রাতিষ্ঠানিক ইমেইল (Official Email)
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
                  placeholder="editor@dailyprabaho.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-stone-300">
                  পাসওয়ার্ড (Password)
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-medium"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-700 text-rose-600 focus:ring-rose-500 bg-stone-900 w-3.5 h-3.5"
                />
                <span className="text-xs text-stone-400">এই ডিভাইসে লগইন তথ্য মনে রাখুন</span>
              </label>
              <span className="text-[10px] text-stone-500 font-mono">ডিফল্ট পাসওয়ার্ড: prabaho@2026</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isApiLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 active:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-rose-500 shadow-lg shadow-rose-950/50 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {isApiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  যাচাই করা হচ্ছে...
                </>
              ) : (
                <>
                  নিরাপদ লগইন সম্পন্ন করুন
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher - All 8 Roles */}
          <div className="mt-8 pt-6 border-t border-stone-700/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs font-bold text-stone-300">
                  দ্রুত টেস্ট অ্যাকাউন্ট নির্বাচন (সকল ৮টি রোল)
                </p>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                ১-ক্লিক অটো-ফিল
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-stone-900/60 border-stone-700/60 hover:bg-stone-900 hover:border-stone-600'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold block truncate ${isSelected ? 'text-rose-300' : 'text-stone-200'}`}>
                        {acc.roleBn}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono block truncate">
                        {acc.roleEn}
                      </span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-mono mt-1 font-bold">
                      {acc.permsCount}/১৬ অনুমতি
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Back to Public Portal */}
          <div className="mt-6 pt-5 border-t border-stone-700/70 flex items-center justify-between text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              মূল সংবাদপত্রে ফিরে যান
            </Link>
            <span className="text-[11px] text-stone-500 font-mono">
              v2.8.0 • RBAC Engine
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminLoginPage;

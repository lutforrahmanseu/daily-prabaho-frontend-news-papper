import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  setReaderCredentials,
  selectIsReaderAuthenticated
} from '../../store/readerSlice.js';
import {
  useReaderLoginMutation,
  useReaderRegisterMutation
} from '../../store/api/readerApi.js';
import SEO from '../../components/common/SEO.jsx';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';

export function ReaderAuthPage({ defaultMode = 'login' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const [mode, setMode] = useState(defaultMode);

  const [loginMutation, { isLoading: isLoggingIn }] = useReaderLoginMutation();
  const [registerMutation, { isLoading: isRegistering }] = useReaderRegisterMutation();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (isReaderAuth) {
    const dest = location.state?.from?.pathname || '/reader/profile';
    return <Navigate to={dest} replace />;
  }

  const busy = isLoggingIn || isRegistering;
  const redirectTarget = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const payload = await loginMutation({
        email: email.trim(),
        password,
        device_name: typeof navigator !== 'undefined' ? navigator.platform || 'reader-web' : 'reader-web'
      }).unwrap();
      dispatch(setReaderCredentials(payload));
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const firstErr =
        err?.data?.errors && Object.values(err.data.errors).flat()[0];
      setErrorMessage(
        firstErr || err?.data?.message || (isBn ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' : 'Invalid credentials.')
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!acceptTerms || !acceptPrivacy) {
      setErrorMessage(
        isBn
          ? 'নিবন্ধনের জন্য ব্যবহারের শর্তাবলি ও গোপনীয়তা নীতিমালায় সম্মতি দেওয়া আবশ্যক।'
          : 'You must accept Terms of Service and Privacy Policy to register.'
      );
      return;
    }

    try {
      const payload = await registerMutation({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        accept_terms: acceptTerms,
        accept_privacy: acceptPrivacy,
        newsletter_enabled: newsletterEnabled,
        preferred_language: language || 'bn',
        location: userLocation.trim() || null,
        device_name: typeof navigator !== 'undefined' ? navigator.platform || 'reader-web' : 'reader-web'
      }).unwrap();
      dispatch(setReaderCredentials(payload));
      navigate('/reader/profile?tab=follows', { replace: true });
    } catch (err) {
      const firstErr =
        err?.data?.errors && Object.values(err.data.errors).flat()[0];
      setErrorMessage(
        firstErr || err?.data?.message || (isBn ? 'নিবন্ধন সম্পন্ন করা যায়নি।' : 'Registration failed.')
      );
    }
  };

  const fillDemoReader = () => {
    setMode('login');
    setEmail('reader@dailyprabaho.test');
    setPassword('ReaderPass123!');
    setErrorMessage('');
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10">
      <SEO
        title={mode === 'login' ? (isBn ? 'পাঠক লগইন' : 'Reader Sign In') : (isBn ? 'পাঠক নিবন্ধন' : 'Reader Registration')}
      />

      <div className="bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white p-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-700/40 border border-rose-400/30 text-rose-200 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'দৈনিক বার্তা প্রবাহ • পাঠক মঞ্চ' : 'Daily Prabaho • Reader Account'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-serif-bn">
            {mode === 'login'
              ? isBn
                ? 'আপনার পাঠক অ্যাকাউন্টে প্রবেশ করুন'
                : 'Sign In to Your Reader Account'
              : isBn
              ? 'নতুন পাঠক অ্যাকাউন্ট তৈরি করুন'
              : 'Create Your Personal Reader Account'}
          </h1>
          <p className="text-xs text-stone-300">
            {isBn
              ? 'পছন্দের বিভাগ অনুসরণ, বুকমার্ক সংরক্ষণ এবং পূর্ণ প্রাইভেসি নিয়ন্ত্রণের জন্য।'
              : 'Follow topics & authors, sync bookmarks, and manage your privacy controls.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-rose-700 text-rose-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isBn ? 'লগইন করুন' : 'Sign In'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-rose-700 text-rose-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isBn ? 'নতুন নিবন্ধন' : 'Register'}</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <span>{busy ? (isBn ? 'যাচাই হচ্ছে...' : 'Signing in...') : isBn ? 'প্রবেশ করুন' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2 text-[11px]">
                <div>
                  <p className="font-bold text-stone-800">{isBn ? 'ডেমো পাঠক অ্যাকাউন্ট:' : 'Demo Reader Account:'}</p>
                  <p className="text-stone-500">reader@dailyprabaho.test</p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoReader}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black text-white font-semibold cursor-pointer"
                >
                  {isBn ? 'অটো-পূরণ' : 'Fill Demo'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'পূর্ণ নাম' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isBn ? 'যেমন: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isBn ? 'পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'Password (min 8 chars)'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'শহর / অবস্থান (ঐচ্ছিক)' : 'Location (Optional)'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder={isBn ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-rose-700"
                  />
                </div>
              </div>

              {/* Mandatory Privacy & Consent Controls */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{isBn ? 'প্রাইভেসি ও সম্মতি নিয়ন্ত্রণ' : 'Privacy & User Consent'}</span>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'আমি দৈনিক বার্তা প্রবাহ-এর ব্যবহারের শর্তাবলি পড়েছি ও সম্মত হচ্ছি *'
                      : 'I agree to the Terms of Service *'}
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'আমি গোপনীয়তা নীতিমালা ও ব্যক্তিগত ডেটা প্রক্রিয়াকরণে সম্মতি দিচ্ছি (যেকোনো সময় ডেটা এক্সপোর্ট ও অ্যাকাউন্ট মুছে ফেলা যাবে) *'
                      : 'I consent to the Privacy Policy (with full right to export or delete my data anytime) *'}
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-stone-600">
                  <input
                    type="checkbox"
                    checked={newsletterEnabled}
                    onChange={(e) => setNewsletterEnabled(e.target.checked)}
                    className="mt-0.5 accent-rose-700"
                  />
                  <span>
                    {isBn
                      ? 'দৈনিক নির্বাচিত সংবাদের ইমেইল নিউজলেটার পেতে চাই (ঐচ্ছিক)'
                      : 'Receive curated daily email newsletter (Optional)'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {busy
                    ? isBn
                      ? 'অ্যাকাউন্ট তৈরি হচ্ছে...'
                      : 'Creating Account...'
                    : isBn
                    ? 'নিবন্ধন সম্পন্ন করুন'
                    : 'Complete Registration'}
                </span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-stone-100 text-center">
            <Link to="/" className="text-xs text-stone-500 hover:text-rose-700">
              {isBn ? '← প্রচ্ছদ পাতায় ফিরে যান' : '← Back to Front Page'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReaderAuthPage;


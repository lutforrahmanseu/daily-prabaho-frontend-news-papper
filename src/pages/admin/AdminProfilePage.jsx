import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/authSlice.js';
import { setCurrentUser } from '../../store/adminSlice.js';
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation
} from '../../store/api/authApi.js';
import { PERMISSIONS, PERMISSION_METADATA, backendHasPermission } from '../../services/authRbacBackend.js';
import { getEffectiveRole, getRoleDisplayMeta } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Lock,
  Layers,
  Camera
} from 'lucide-react';
import sweetAlert from '../../utils/sweetAlert.js';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export function AdminProfilePage() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const { data: meData } = useGetMeQuery(undefined, { skip: !authState?.token });
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPass }] = useChangePasswordMutation();

  const liveUser = meData || authState?.user || adminState?.currentUser || {};
  const effectiveRole = getEffectiveRole({ ...authState, user: liveUser }, adminState);
  const roleObj = getRoleDisplayMeta(effectiveRole, liveUser?.roleName);

  // Form State: Profile Details
  const [name, setName] = useState(liveUser?.name || '');
  const [department, setDepartment] = useState(liveUser?.designation || liveUser?.department || '');
  const [phone, setPhone] = useState(liveUser?.phone || '');
  const [bio, setBio] = useState(liveUser?.bio || '');
  const [avatar, setAvatar] = useState(liveUser?.avatar_url || liveUser?.avatar || FALLBACK_AVATAR);

  useEffect(() => {
    if (!liveUser?.id) return;
    setName(liveUser.name || '');
    setDepartment(liveUser.designation || liveUser.department || '');
    setPhone(liveUser.phone || '');
    setBio(liveUser.bio || '');
    setAvatar(liveUser.avatar_url || liveUser.avatar || FALLBACK_AVATAR);
  }, [
    liveUser?.id,
    liveUser?.name,
    liveUser?.designation,
    liveUser?.department,
    liveUser?.phone,
    liveUser?.bio,
    liveUser?.avatar_url,
    liveUser?.avatar
  ]);

  // Form State: Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status & Notifications
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Active tab inside settings
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'permissions'

  // Calculate granted permissions from live user or role matrix
  const grantedPermissions = useMemo(() => {
    if (effectiveRole === 'super_admin') return [...PERMISSIONS];
    if (Array.isArray(liveUser?.permissions)) return liveUser.permissions;
    if (Array.isArray(authState?.permissions) && authState.permissions.length > 0) {
      return authState.permissions;
    }
    return PERMISSIONS.filter((p) => backendHasPermission({ role: effectiveRole }, p));
  }, [effectiveRole, liveUser?.permissions, authState?.permissions]);

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    return PERMISSIONS.reduce((acc, permKey) => {
      const meta = PERMISSION_METADATA[permKey];
      const mod = meta.module || 'Other';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push({
        key: permKey,
        ...meta,
        granted: grantedPermissions.includes(permKey)
      });
      return acc;
    }, {});
  }, [grantedPermissions]);

  // Handle Profile Update via Laravel API
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        designation: department.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatar.trim() || null
      }).unwrap();

      dispatch(setCredentials({ user: updatedUser }));
      dispatch(setCurrentUser(updatedUser));
      await sweetAlert.success('প্রোফাইল হালনাগাদ হয়েছে!', 'প্রোফাইল তথ্য সফলভাবে হালনাগাদ ও সংরক্ষিত হয়েছে।');
    } catch (err) {
      await sweetAlert.error('হালনাগাদ ব্যর্থ হয়েছে', extractApiError(err, 'প্রোফাইল তথ্য সংরক্ষণ করা যায়নি।'));
    }
  };

  // Handle Password Change via Laravel API
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('সকল পাসওয়ার্ড ক্ষেত্র পূরণ করুন।');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
      return;
    }

    try {
      const res = await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      }).unwrap();

      const successMsg = res?.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।';
      setPassSuccess(successMsg);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await sweetAlert.success('পাসওয়ার্ড পরিবর্তিত হয়েছে!', 'নতুন পাসওয়ার্ড সফলভাবে সেট করা হয়েছে।');
    } catch (err) {
      const errMsg = extractApiError(err, 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
      setPassError(errMsg);
      await sweetAlert.error('পরিবর্তন ব্যর্থ হয়েছে', errMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">

      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl border border-stone-800 shadow-md p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={avatar || FALLBACK_AVATAR}
              alt={liveUser.name || 'Profile'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/10 shadow-xl"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-stone-900 flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-bn tracking-tight">
                {liveUser.name || name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleObj.badgeColor}`}>
                {roleObj.nameBn}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 font-mono">
              {liveUser.email} {department ? `• ${department}` : ''}
            </p>

            {bio && (
              <p className="text-xs text-stone-400 max-w-2xl leading-relaxed pt-1">
                {bio}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3 text-xs text-stone-400 font-mono">
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>সক্রিয় অনুমতি: <strong className="text-white">{grantedPermissions.length}/{PERMISSIONS.length}</strong></span>
              </div>
              {phone && (
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>স্ট্যাটাস: {liveUser.status === 'suspended' ? 'স্থগিত' : 'সক্রিয় (Active)'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <User className="w-4 h-4" />
          প্রোফাইল তথ্য ও বায়ো
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'password'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          পাসওয়ার্ড পরিবর্তন (Change Password)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          আমার অনুমতি ও ক্ষমতা ({grantedPermissions.length})
        </button>
      </div>

      {/* TAB 1: Edit Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
            <div>
              <h2 className="text-lg font-bold font-serif-bn text-stone-900">
                ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য হালনাগাদ
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                আপনার নাম, ছবি, পদবি ও যোগাযোগের তথ্য পরিবর্তন করুন
              </p>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">
              আইডি: {liveUser.id || '—'}
            </span>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  পূর্ণ নাম (Full Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  প্রাতিষ্ঠানিক ইমেইল (লগইন ইউজারনেম)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={liveUser.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-mono cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">ইমেইল পরিবর্তন কেবল সুপার অ্যাডমিনের অনুমতি সাপেক্ষে সম্ভব</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  বিভাগ ও দায়িত্ব (Designation)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ফোন নম্বর (Official Phone)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  প্রোফাইল ছবির লিংক (Avatar Image URL)
                </label>
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Camera className="h-4 w-4" />
                    </div>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                  <img
                    src={avatar || FALLBACK_AVATAR}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  সংক্ষিপ্ত পরিচয় ও বায়োগ্রাফি (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    তথ্য সংরক্ষণ করুন
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Change Password Form */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs max-w-2xl">
          <div className="pb-5 border-b border-stone-100 mb-6">
            <h2 className="text-lg font-bold font-serif-bn text-stone-900">
              পাসওয়ার্ড পরিবর্তন (Security & Password)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড সংরক্ষণ করুন
            </p>
          </div>

          {passError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                বর্তমান পাসওয়ার্ড (Current Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                নতুন পাসওয়ার্ড (New Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৮ অক্ষর..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                নতুন পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPass}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isChangingPass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    পাসওয়ার্ড আপডেট করুন
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Permissions Matrix Viewer */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-serif-bn text-stone-900">
                ভূমিকা অনুযায়ী নির্ধারিত অনুমতি (Role-Based Access Control)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                আপনার বর্তমান ভূমিকা <span className="font-bold text-stone-800 font-mono">[{roleObj.nameEn}]</span> এর জন্য অনুমোদিত ও সীমাবদ্ধ ক্ষমতার তালিকা
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                {grantedPermissions.length} / {PERMISSIONS.length} অনুমোদিত
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(permissionsByModule).map(([modName, perms]) => (
              <div
                key={modName}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rose-700" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 font-mono">
                        {modName} মডিউল
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {perms.filter((p) => p.granted).length}/{perms.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {perms.map((p) => (
                      <div
                        key={p.key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          p.granted
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-stone-50/70 border-stone-200 text-stone-400 opacity-70'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-bold ${p.granted ? 'text-stone-900' : 'text-stone-500'}`}>
                            {p.labelBn}
                          </p>
                          <p className="text-[10px] font-mono text-stone-500">
                            {p.key}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.granted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {p.granted ? 'অনুমোদিত' : 'সীমিত'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfilePage;

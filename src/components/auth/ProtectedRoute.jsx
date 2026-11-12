import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert, ArrowLeft, Home, UserCheck, ShieldCheck } from 'lucide-react';
import { PERMISSION_METADATA } from '../../services/authRbacBackend.js';
import { getEffectiveRole, getRoleDisplayMeta, hasEffectivePermission } from '../../utils/permissions.js';
import { isReaderOnlySession } from '../../utils/readerHelpers.js';

/**
 * Route guard component for admin area.
 * Validates real Sanctum authentication and granular RBAC permissions.
 * Strictly blocks reader-only accounts from accessing /admin/*.
 */
export function ProtectedRoute({ children, requiredPermission = null }) {
  const location = useLocation();
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  const authUser = authState?.user;
  const isAuthenticated = Boolean(authState?.isAuthenticated && authState?.token && authUser?.email);

  // 1. Real Sanctum authentication check
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Strictly block reader-only accounts from Admin CMS
  if (isReaderOnlySession(authState?.roles)) {
    return <Navigate to="/reader/profile" replace />;
  }

  // 2. Permission check (if specified)
  if (requiredPermission) {
    const hasPermission = hasEffectivePermission(authState, adminState, requiredPermission);

    if (!hasPermission) {
      const effectiveRole = getEffectiveRole(authState, adminState);
      const primaryPerm = Array.isArray(requiredPermission) ? requiredPermission[0] : requiredPermission;
      const permMeta = PERMISSION_METADATA[primaryPerm] || {
        labelBn: Array.isArray(requiredPermission) ? requiredPermission.join(' / ') : requiredPermission,
        labelEn: Array.isArray(requiredPermission) ? requiredPermission.join(' / ') : requiredPermission,
        module: 'System'
      };

      const roleObj = getRoleDisplayMeta(effectiveRole, authUser?.roleName);

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-lg text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                HTTP 403 • FORBIDDEN
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-bn text-stone-900 mt-2">
                অননুমোদিত প্রবেশাধিকার
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                আপনার বর্তমান ভূমিকার জন্য এই মডিউলে প্রবেশের পর্যাপ্ত অনুমতি নেই।
              </p>
            </div>

            {/* Context Details */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">আপনার ভূমিকা:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${roleObj.badgeColor}`}>
                  {roleObj.nameBn}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">প্রয়োজনীয় অনুমতি:</span>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                  {Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">অনুমতির বিবরণ:</span>
                <span className="font-medium text-stone-800">
                  {permMeta.labelBn} ({permMeta.module})
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                to="/admin/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
              >
                <Home className="w-4 h-4" />
                ড্যাশবোর্ডে ফিরে যান
              </Link>
              <Link
                to="/admin/profile"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                আমার অনুমতি দেখুন
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;


import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useUpdateRolePermissionsMutation
} from '../../store/api/roleApi.js';
import {
  PERMISSIONS,
  PERMISSION_METADATA,
  ROLES_DEFINITION
} from '../../services/authRbacBackend.js';
import { getRoleDisplayMeta, hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import {
  Check,
  X,
  Lock,
  RotateCcw,
  Layers,
  ShieldAlert,
  Info,
  Loader2
} from 'lucide-react';
import sweetAlert from '../../utils/sweetAlert.js';

export function AdminRolesPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canManageRoles = hasEffectivePermission(authState, adminState, 'role.manage');

  const { data: apiRoles, isLoading: isRolesLoading, isError, error } = useGetRolesQuery();
  const { data: apiPermissions, isLoading: isPermsLoading } = useGetPermissionsQuery();
  const [updateRolePermissions, { isLoading: isUpdatingRole }] = useUpdateRolePermissionsMutation();

  const [actionBlockedError, setActionBlockedError] = useState('');
  const [togglingKey, setTogglingKey] = useState(null);

  const rolesList = useMemo(() => {
    const raw = Array.isArray(apiRoles) ? apiRoles : (apiRoles?.items || []);
    return raw.map((r) => {
      const meta = getRoleDisplayMeta(r.slug, r.name);
      const perms = Array.isArray(r.permissions)
        ? r.permissions.map((p) => (typeof p === 'string' ? p : p?.slug)).filter(Boolean)
        : [];
      return {
        ...r,
        id: r.id,
        slug: r.slug,
        nameBn: meta.nameBn || r.name,
        nameEn: meta.nameEn || r.name,
        badgeColor: meta.badgeColor || 'bg-stone-100 text-stone-800 border-stone-200',
        description: r.description || meta.description || '',
        permissions: perms
      };
    });
  }, [apiRoles]);

  const permissionModules = useMemo(() => {
    if (apiPermissions && typeof apiPermissions === 'object' && !Array.isArray(apiPermissions)) {
      const grouped = {};
      Object.entries(apiPermissions).forEach(([moduleKey, items]) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const sampleSlug = items[0]?.slug;
        const modLabel = PERMISSION_METADATA[sampleSlug]?.module || moduleKey;
        grouped[modLabel] = items.map((p) => ({
          slug: p.slug,
          labelBn: PERMISSION_METADATA[p.slug]?.labelBn || p.name,
          labelEn: PERMISSION_METADATA[p.slug]?.labelEn || p.name
        }));
      });
      if (Object.keys(grouped).length > 0) return grouped;
    }

    return PERMISSIONS.reduce((acc, permKey) => {
      const meta = PERMISSION_METADATA[permKey] || { module: 'General', labelBn: permKey, labelEn: permKey };
      const mod = meta.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push({
        slug: permKey,
        labelBn: meta.labelBn,
        labelEn: meta.labelEn
      });
      return acc;
    }, {});
  }, [apiPermissions]);

  const totalPermissionsCount = useMemo(
    () => Object.values(permissionModules).reduce((sum, items) => sum + items.length, 0),
    [permissionModules]
  );

  // Handle Toggle Permission via Laravel API
  const handleToggle = async (roleObj, permItem) => {
    setActionBlockedError('');
    const permSlug = permItem.slug;

    if (roleObj.slug === 'super_admin') {
      setActionBlockedError('সুপার অ্যাডমিনের পূর্ণাঙ্গ এক্সেস অপরিবর্তনীয় ও সুরক্ষিত (Immutable Root)');
      return;
    }

    if (!canManageRoles) {
      const msg = 'আপনার ভূমিকা ও অনুমতি পরিবর্তনের অধিকার নেই (403 Forbidden)।';
      setActionBlockedError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    const currentPerms = roleObj.permissions || [];
    const nextPerms = currentPerms.includes(permSlug)
      ? currentPerms.filter((p) => p !== permSlug)
      : [...currentPerms, permSlug];

    const key = `${roleObj.id}:${permSlug}`;
    setTogglingKey(key);

    try {
      await updateRolePermissions({ id: roleObj.id, permissions: nextPerms }).unwrap();
      await sweetAlert.success(
        'অনুমতি হালনাগাদ হয়েছে!',
        `"${roleObj.nameBn}" এর জন্য "${permItem.labelBn}" অনুমতি হালনাগাদ করা হয়েছে।`
      );
    } catch (err) {
      const msg = extractApiError(err, 'অনুমতি হালনাগাদ করা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('হালনাগাদ ব্যর্থ হয়েছে', msg);
    } finally {
      setTogglingKey(null);
    }
  };

  // Reset non-super-admin DB roles back to default matrix
  const handleResetDefaults = async () => {
    setActionBlockedError('');
    if (!canManageRoles) {
      const msg = 'পারমিশন রিসেট করার অনুমতি আপনার নেই।';
      setActionBlockedError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    const { isConfirmed } = await sweetAlert.confirm({
      title: 'ডিফল্ট পারমিশনে ফিরিয়ে আনবেন?',
      text: 'সকল ভূমিকার অনুমতি ডিফল্ট কনফিগারেশনে ফিরিয়ে আনা হবে।',
      icon: 'warning',
      confirmButtonText: 'হ্যাঁ, রিসেট করুন',
      confirmVariant: 'warning'
    });
    if (!isConfirmed) {
      return;
    }

    try {
      const targets = rolesList.filter(
        (r) => r.slug !== 'super_admin' && Array.isArray(ROLES_DEFINITION[r.slug]?.permissions)
      );
      await Promise.all(
        targets.map((r) =>
          updateRolePermissions({
            id: r.id,
            permissions: ROLES_DEFINITION[r.slug].permissions
          }).unwrap()
        )
      );
      await sweetAlert.success(
        'রিসেট সম্পন্ন!',
        'সকল রোলের পারমিশন সফলভাবে ডিফল্ট অবস্থায় রিসেট হয়েছে।'
      );
    } catch (err) {
      const msg = extractApiError(err, 'ডিফল্ট রিসেট সম্পন্ন করা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('রিসেট ব্যর্থ হয়েছে', msg);
    }
  };

  if (isRolesLoading || isPermsLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-rose-700 mx-auto mb-2" />
        <p className="text-xs font-semibold">ভূমিকা ও অনুমতি ম্যাট্রিক্স লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(actionBlockedError || isError) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">
              {actionBlockedError || extractApiError(error, 'রোল ডেটা লোড করা যায়নি।')}
            </span>
          </div>
          {actionBlockedError && (
            <button
              type="button"
              onClick={() => setActionBlockedError('')}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            ভূমিকা ও অনুমতি ম্যাট্রিক্স (RBAC Engine)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            সম্পাদকীয় ও প্রযুক্তিগত ভূমিকা এবং গ্র্যানুলার পারমিশন কন্ট্রোল (লাইভ ডাটাবেস সিঙ্কড)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canManageRoles || isUpdatingRole}
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>ডিফল্ট রিসেট</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold font-mono">
            {rolesList.length}টি ভূমিকা • {totalPermissionsCount}টি অনুমতি
          </span>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {rolesList.map((r) => {
          const permsCount = r.permissions.length;
          return (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                r.slug === 'super_admin' ? 'border-rose-300 ring-1 ring-rose-100' : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                    {r.nameEn}
                  </span>
                  {r.slug === 'super_admin' && (
                    <Lock className="w-3.5 h-3.5 text-rose-600" title="রুট পারমিশন লকড" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-stone-900 font-serif-bn">{r.nameBn}</h3>
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">অনুমতি বরাদ্দ:</span>
                <span className="font-bold text-rose-700">
                  {permsCount} / {totalPermissionsCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive RBAC Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-700" />
            <h3 className="font-bold text-sm text-stone-900 font-serif-bn">
              সম্পূর্ণ পারমিশন ম্যাট্রিক্স (Full Access Matrix)
            </h3>
          </div>
          <p className="text-[11px] text-stone-500">
            পরিবর্তন করতে চেকবক্সে ক্লিক করুন (সুপার অ্যাডমিন অপরিবর্তনীয়)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/90 border-b border-stone-200 text-stone-800 font-bold text-[11px]">
                <th className="py-3 px-4 min-w-[200px] border-r border-stone-200 sticky left-0 bg-stone-100 z-10">
                  মডিউল ও অনুমতি ({totalPermissionsCount} Permissions)
                </th>
                {rolesList.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center min-w-[105px]">
                    <div className="font-bold font-serif-bn text-stone-900 text-xs">
                      {r.nameBn}
                    </div>
                    <div className="text-[9px] font-mono font-normal text-stone-500">
                      {r.nameEn}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {Object.entries(permissionModules).map(([moduleName, permItems]) => (
                <React.Fragment key={moduleName}>
                  <tr className="bg-stone-50/90 font-bold font-mono text-[11px] text-stone-700 border-t border-b border-stone-200">
                    <td colSpan={rolesList.length + 1} className="py-2 px-4 sticky left-0 bg-stone-50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <span>{moduleName} মডিউল ({permItems.length}টি অনুমতি)</span>
                    </td>
                  </tr>

                  {permItems.map((permItem) => (
                    <tr key={permItem.slug} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 border-r border-stone-100 sticky left-0 bg-white z-10 shadow-xs">
                        <p className="font-bold text-stone-900 text-xs font-serif-bn">
                          {permItem.labelBn}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1 py-0.2 rounded">
                            {permItem.slug}
                          </code>
                          <span className="text-[10px] text-stone-400 font-mono">
                            • {permItem.labelEn}
                          </span>
                        </div>
                      </td>

                      {rolesList.map((r) => {
                        const isGranted = r.permissions.includes(permItem.slug);
                        const isSuperAdmin = r.slug === 'super_admin';
                        const isBusy = togglingKey === `${r.id}:${permItem.slug}`;

                        return (
                          <td key={r.id} className="py-3 px-3 text-center align-middle">
                            <button
                              type="button"
                              disabled={isSuperAdmin || !canManageRoles || isBusy}
                              onClick={() => handleToggle(r, permItem)}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                isSuperAdmin
                                  ? 'bg-rose-700 text-white cursor-not-allowed opacity-90'
                                  : isGranted
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 cursor-pointer disabled:opacity-50'
                              }`}
                              title={
                                isSuperAdmin
                                  ? 'সুপার অ্যাডমিনের জন্য সুরক্ষিত'
                                  : isGranted
                                  ? `${r.nameBn} থেকে প্রত্যাহার করতে ক্লিক করুন`
                                  : `${r.nameBn} কে অনুমতি দিতে ক্লিক করুন`
                              }
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isSuperAdmin ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : isGranted ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <X className="w-3.5 h-3.5 stroke-[2]" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0" />
            <span>লারাভেল ব্যাকএন্ড স্বাধীনভাবে প্রতিটি এপিআই কলে এই অনুমতিসমূহ ভ্যালিডেট করে।</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> অনুমোদিত
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-stone-200 inline-block" /> নিষিদ্ধ
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-700 inline-block" /> লকড (Root)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRolesPage;

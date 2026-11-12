import React from 'react';
import { useSelector } from 'react-redux';
import { hasEffectivePermission } from '../../utils/permissions.js';

/**
 * PermissionGate: Conditionally renders UI elements based on Sanctum user permissions.
 * Useful for hiding or disabling action buttons (e.g. Delete, Publish, Add).
 */
export function PermissionGate({ permission, children, fallback = null }) {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);

  if (!authState?.user && !adminState?.currentUser) return fallback;

  if (hasEffectivePermission(authState, adminState, permission)) {
    return children;
  }

  return fallback;
}

export default PermissionGate;

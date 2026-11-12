import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation
} from '../../store/api/userApi.js';
import { useGetRolesQuery } from '../../store/api/roleApi.js';
import { ROLES_DEFINITION } from '../../services/authRbacBackend.js';
import { getEffectiveRole, getRoleDisplayMeta, hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import {
  Plus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import Table from '../../components/Table.jsx';

export function AdminUsersPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const currentAuthUser = authState?.user || adminState?.currentUser;
  const effectiveRole = getEffectiveRole(authState, adminState);
  const canManageUsers = hasEffectivePermission(authState, adminState, 'user.manage');

  const { data: usersResponse, isLoading, isFetching, isError, error } = useGetUsersQuery({ per_page: 100 });
  const { data: apiRoles } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [toggleUserStatus] = useToggleUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const userList = useMemo(
    () => usersResponse?.items || usersResponse?.data || (Array.isArray(usersResponse) ? usersResponse : []),
    [usersResponse]
  );

  const roleOptions = useMemo(() => {
    const rawRoles = Array.isArray(apiRoles) ? apiRoles : (apiRoles?.items || []);
    if (rawRoles.length > 0) {
      return rawRoles.map((r) => {
        const meta = getRoleDisplayMeta(r.slug, r.name);
        return {
          id: r.slug,
          slug: r.slug,
          nameBn: meta.nameBn || r.name,
          nameEn: meta.nameEn || r.name,
          badgeColor: meta.badgeColor || 'bg-stone-100 text-stone-700 border-stone-200'
        };
      });
    }
    return Object.values(ROLES_DEFINITION).map((r) => ({
      ...r,
      slug: r.id
    }));
  }, [apiRoles]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('prabaho@2026');
  const [role, setRole] = useState('reporter');
  const [department, setDepartment] = useState('সাধারণ বার্তা বিভাগ');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');

  // Feedback state
  const [actionBlockedError, setActionBlockedError] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);

  const isSaving = isCreating || isUpdating;

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return userList.filter((u) => {
      const matchesSearch =
        !query ||
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.designation || u.department || '').toLowerCase().includes(query);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [userList, searchQuery, roleFilter, statusFilter]);

  const openCreateModal = () => {
    if (!canManageUsers) {
      const msg = 'নতুন স্টাফ অ্যাকাউন্ট তৈরির অনুমতি আপনার নেই।';
      setActionBlockedError(msg);
      sweetAlert.error('অনুমতি নেই', msg);
      return;
    }
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('prabaho@2026');
    setRole('reporter');
    setDepartment('সাধারণ বার্তা বিভাগ');
    setPhone('');
    setStatus('active');
    setShowModal(true);
  };

  const openEditModal = (targetUser) => {
    if (!canManageUsers) {
      const msg = 'ব্যবহারকারীর তথ্য সম্পাদনার অনুমতি আপনার নেই।';
      setActionBlockedError(msg);
      sweetAlert.error('অনুমতি নেই', msg);
      return;
    }
    setEditingUser(targetUser);
    setName(targetUser.name || '');
    setEmail(targetUser.email || '');
    setPassword('');
    setRole(targetUser.role || 'reporter');
    setDepartment(targetUser.designation || targetUser.department || '');
    setPhone(targetUser.phone || '');
    setStatus(targetUser.status || 'active');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  // Handle Create / Update User via Laravel API
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setActionBlockedError('');

    if (!canManageUsers) {
      const msg = editingUser
        ? 'ব্যবহারকারী হালনাগাদ করার অনুমতি আপনার নেই।'
        : 'আপনার নতুন ব্যবহারকারী যুক্ত করার অনুমতি নেই।';
      setActionBlockedError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    if (!name.trim() || !email.trim()) {
      await sweetAlert.warning('তথ্য অসম্পূর্ণ', 'নাম এবং বৈধ অফিসিয়াল ইমেইল প্রদান করুন।');
      return;
    }

    if (!editingUser && password.length < 8) {
      await sweetAlert.warning('পাসওয়ার্ড ছোট', 'নতুন অ্যাকাউন্টের জন্য অন্তত ৮ অক্ষরের পাসওয়ার্ড দিন।');
      return;
    }

    if (editingUser && password && password.length < 8) {
      await sweetAlert.warning('পাসওয়ার্ড ছোট', 'নতুন পাসওয়ার্ড দিলে তা অন্তত ৮ অক্ষরের হতে হবে।');
      return;
    }

    try {
      if (editingUser) {
        const isSelfSuperAdmin = editingUser.id === currentAuthUser?.id && effectiveRole === 'super_admin';
        const payload = {
          id: editingUser.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          designation: department.trim() || null,
          status,
          ...(!isSelfSuperAdmin && role ? { roles: [role] } : {}),
          ...(password.trim() ? { password: password.trim() } : {})
        };
        await updateUser(payload).unwrap();
        closeModal();
        await sweetAlert.success(
          'অ্যাকাউন্ট হালনাগাদ হয়েছে!',
          `"${payload.name}"-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে।`
        );
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || null,
          designation: department.trim() || null,
          status: 'active',
          roles: [role]
        }).unwrap();

        closeModal();
        await sweetAlert.success(
          'ব্যবহারকারী তৈরি হয়েছে!',
          `ব্যবহারকারী "${name.trim()}" সফলভাবে যুক্ত হয়েছেন।`
        );
      }
    } catch (err) {
      const msg = extractApiError(err, editingUser ? 'ব্যবহারকারী হালনাগাদ করা যায়নি।' : 'ব্যবহারকারী তৈরি করা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('সংরক্ষণ ব্যর্থ হয়েছে', msg);
    }
  };

  // Handle Status Toggle via Laravel API
  const handleToggleStatus = async (targetUser) => {
    setActionBlockedError('');

    if (!canManageUsers) {
      const msg = 'ব্যবহারকারীর স্ট্যাটাস পরিবর্তনের অনুমতি আপনার নেই।';
      setActionBlockedError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const { isConfirmed } = await sweetAlert.confirm({
      title: nextStatus === 'suspended' ? 'অ্যাকাউন্ট স্থগিত করবেন?' : 'অ্যাকাউন্ট সক্রিয় করবেন?',
      text: `"${targetUser.name}"-এর অবস্থা ${nextStatus === 'suspended' ? 'স্থগিত (Suspended)' : 'সক্রিয় (Active)'} করতে চান?`,
      icon: nextStatus === 'suspended' ? 'warning' : 'question',
      confirmButtonText: nextStatus === 'suspended' ? 'হ্যাঁ, স্থগিত করুন' : 'হ্যাঁ, সক্রিয় করুন',
      confirmVariant: nextStatus === 'suspended' ? 'warning' : 'success'
    });
    if (!isConfirmed) return;

    setBusyUserId(targetUser.id);
    try {
      await toggleUserStatus({ id: targetUser.id, status: nextStatus }).unwrap();
      await sweetAlert.success(
        'স্ট্যাটাস পরিবর্তিত হয়েছে!',
        `"${targetUser.name}" এখন ${nextStatus === 'active' ? 'সক্রিয়' : 'স্থগিত'} অবস্থায় আছেন।`
      );
    } catch (err) {
      const msg = extractApiError(err, 'স্ট্যাটাস পরিবর্তন করা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('পরিবর্তন ব্যর্থ হয়েছে', msg);
    } finally {
      setBusyUserId(null);
    }
  };

  // Handle Role Change via Laravel API
  const handleChangeRole = async (targetUser, newRole) => {
    setActionBlockedError('');

    if (!canManageUsers) {
      const msg = 'ভূমিকা পরিবর্তনের অনুমতি আপনার নেই।';
      setActionBlockedError(msg);
      await sweetAlert.error('অনুমতি নেই', msg);
      return;
    }

    setBusyUserId(targetUser.id);
    try {
      await updateUser({ id: targetUser.id, roles: [newRole] }).unwrap();
      await sweetAlert.success('ভূমিকা হালনাগাদ হয়েছে!', `"${targetUser.name}"-এর ভূমিকা সফলভাবে পরিবর্তিত হয়েছে।`);
    } catch (err) {
      const msg = extractApiError(err, 'ভূমিকা হালনাগাদ করা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('হালনাগাদ ব্যর্থ হয়েছে', msg);
    } finally {
      setBusyUserId(null);
    }
  };

  // Handle Delete User via Laravel API
  const handleDeleteUser = async (targetUser) => {
    setActionBlockedError('');
    if (!canManageUsers) return;

    const { isConfirmed } = await sweetAlert.confirmDelete(
      targetUser.name,
      `আপনি কি "${targetUser.name}" অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?`
    );
    if (!isConfirmed) return;

    setBusyUserId(targetUser.id);
    try {
      await deleteUser(targetUser.id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', `"${targetUser.name}" সফলভাবে মুছে ফেলা হয়েছে।`);
    } catch (err) {
      const msg = extractApiError(err, 'ব্যবহারকারী মুছে ফেলা যায়নি।');
      setActionBlockedError(msg);
      await sweetAlert.error('মুছে ফেলা যায়নি', msg);
    } finally {
      setBusyUserId(null);
    }
  };

  // Table Columns
  const columns = [
    {
      header: 'ইউজার তথ্য',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt={row.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
          />
          <div>
            <p className="font-bold text-stone-900 text-xs">{row.name}</p>
            <p className="text-[11px] text-stone-500 font-mono">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'বিভাগ ও দপ্তর',
      accessor: 'department',
      render: (row) => (
        <span className="text-xs text-stone-700 font-medium">
          {row.designation || row.department || '—'}
        </span>
      )
    },
    {
      header: 'নির্ধারিত ভূমিকা (Role)',
      accessor: 'role',
      render: (row) => {
        const roleDef = getRoleDisplayMeta(row.role, row.roleName);
        const isSelfOrLocked = row.id === currentAuthUser?.id && effectiveRole === 'super_admin';

        if (!canManageUsers || isSelfOrLocked) {
          return (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${roleDef.badgeColor}`}>
              <Shield className="w-3 h-3" />
              <span>{roleDef.nameBn}</span>
            </span>
          );
        }

        return (
          <select
            value={row.role}
            disabled={busyUserId === row.id}
            onChange={(e) => handleChangeRole(row, e.target.value)}
            className="text-[11px] font-bold px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-800 cursor-pointer focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50"
          >
            {roleOptions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.nameBn}
              </option>
            ))}
          </select>
        );
      }
    },
    {
      header: 'সর্বশেষ লগইন',
      accessor: 'lastLogin',
      render: (row) => (
        <span className="text-xs text-stone-500 font-mono">
          {row.lastLogin ? formatBengaliRelativeTime(row.lastLogin) : 'কখনো লগইন করেনি'}
        </span>
      )
    },
    {
      header: 'স্ট্যাটাস',
      accessor: 'status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          <span>{row.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}</span>
        </span>
      )
    },
    {
      header: 'অ্যাকশন',
      align: 'right',
      render: (row) => {
        const isSelf = currentAuthUser?.id && row.id === currentAuthUser.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {canManageUsers && (
              <button
                type="button"
                disabled={busyUserId === row.id}
                onClick={() => openEditModal(row)}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
                title="তথ্য সম্পাদনা করুন"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={!canManageUsers || isSelf || busyUserId === row.id}
              onClick={() => handleToggleStatus(row)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                row.status === 'active'
                  ? 'border-stone-200 text-stone-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {row.status === 'active' ? 'স্থগিত করুন' : 'সক্রিয় করুন'}
            </button>
            {canManageUsers && !isSelf && row.role !== 'super_admin' && (
              <button
                type="button"
                disabled={busyUserId === row.id}
                onClick={() => handleDeleteUser(row)}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-40"
                title="অ্যাকাউন্ট মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {(actionBlockedError || isError) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">
              {actionBlockedError || extractApiError(error, 'ব্যবহারকারী তালিকা লোড করা যায়নি।')}
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
            ব্যবহারকারী ও স্টাফ অ্যাকাউন্টস (User Management)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            সকল সম্পাদকীয় ও প্রশাসনিক ভূমিকার কর্মকর্তা এবং তাদের এক্সেস নিয়ন্ত্রণ
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন স্টাফ যোগ করুন</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ইমেইল বা পদবি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none"
          >
            <option value="all">সকল ভূমিকা (All Roles)</option>
            {roleOptions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.nameBn} ({r.nameEn})
              </option>
            ))}
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none"
        >
          <option value="all">সকল অবস্থা</option>
          <option value="active">সক্রিয় (Active)</option>
          <option value="suspended">স্থগিত (Suspended)</option>
        </select>
      </div>

      {/* Table */}
      <Table columns={columns} data={filteredUsers} isLoading={isLoading || isFetching} />

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  {editingUser ? 'কর্মকর্তার তথ্য সম্পাদনা' : 'নতুন কর্মকর্তা অ্যাকাউন্ট তৈরি'}
                </h3>
                <p className="text-[11px] text-stone-500">অনুমোদিত ভূমিকা ও এক্সেস লেভেল নির্ধারণ করুন</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পুরো নাম (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: ড. নাজমুল হুদা"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    অফিসিয়াল ইমেইল *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@dailyprabaho.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {editingUser ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'প্রাথমিক পাসওয়ার্ড (ন্যূনতম ৮ অক্ষর) *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    minLength={editingUser && !password ? undefined : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'পরিবর্তন না করলে ফাঁকা রাখুন' : 'কমপক্ষে ৮ অক্ষর'}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    সিস্টেম ভূমিকা (Role)
                  </label>
                  <select
                    value={role}
                    disabled={editingUser && editingUser.id === currentAuthUser?.id && effectiveRole === 'super_admin'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বিভাগ ও দায়িত্ব (Designation)
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="যেমন: আন্তর্জাতিক সংবাদ ডেস্ক"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {editingUser && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      স্ট্যাটাস (Status)
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="active">সক্রিয় (Active)</option>
                      <option value="suspended">স্থগিত (Suspended)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingUser ? 'তথ্য হালনাগাদ করুন' : 'ব্যবহারকারী তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;

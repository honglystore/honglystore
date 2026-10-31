import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  User,
  Mail,
  Phone,
  Edit2,
  Lock,
  Unlock,
  Check,
  RefreshCw,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { User as UserType, Role, Permission, RoleName } from '../types/index.js';

export const UsersRolesPage: React.FC = () => {
  const { showToast, triggerGlobalRefresh } = useStore();
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // User modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Cashier' as RoleName,
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rData] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(uList);
      setRoles(rData.roles);
      setPermissions(rData.permissions);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Cashier',
      phone: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (u: UserType) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        showToast(`User account "${formData.name}" updated`, 'success');
      } else {
        if (!formData.password) {
          showToast('Password is required for new users', 'error');
          setSaving(false);
          return;
        }
        await api.createUser(formData);
        showToast(`Staff member "${formData.name}" registered`, 'success');
      }
      setModalOpen(false);
      loadData();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) {
      showToast('You cannot deactivate your own current active session.', 'error');
      return;
    }

    try {
      const res = await api.toggleUserStatus(targetUser.id);
      showToast(
        `User "${targetUser.name}" account is now ${res.status.toUpperCase()}`,
        res.status === 'active' ? 'success' : 'info'
      );
      loadData();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleTogglePermission = async (role: Role, permCode: string) => {
    if (!isSuperAdmin) {
      showToast('Only Super Admin can reconfigure permission matrices.', 'error');
      return;
    }

    const currentPerms = [...role.permissions];
    const index = currentPerms.indexOf(permCode);
    if (index > -1) {
      currentPerms.splice(index, 1);
    } else {
      currentPerms.push(permCode);
    }

    try {
      await api.updateRole(role.id, { permissions: currentPerms });
      showToast(`Updated permissions for role "${role.name}"`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role permissions', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Role-Based Access Control (RBAC) & Staff
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage store employees, assigned roles, security credentials, and granular permission matrices.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Staff Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'matrix'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>RBAC Permissions Matrix ({roles.length} Roles)</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Phone Contact</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-purple-500/40 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {u.name} {u.id === currentUser?.id && '(You)'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.phone || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.status === 'active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'active' ? 'Deactivate user' : 'Reactivate user'}
                            >
                              {u.status === 'active' ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Granular Permissions Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Click checkboxes to dynamically adjust access rights per security role.
              </p>
            </div>
            {isSuperAdmin ? (
              <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-lg">
                Super Admin Edit Mode Active
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">View Only (Requires Super Admin)</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Permission Module & Description</th>
                  {roles.map(r => (
                    <th key={r.id} className="py-3 px-4 text-center">
                      <span className="block font-bold">{r.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {permissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {perm.module}: {perm.action}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{perm.code}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                    </td>

                    {roles.map(role => {
                      const hasPerm =
                        role.name === 'Super Admin' || role.permissions.includes(perm.code);
                      const isLocked = role.name === 'Super Admin' || !isSuperAdmin;

                      return (
                        <td key={role.id} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={hasPerm}
                            onChange={() => handleTogglePermission(role, perm.code)}
                            className="w-4 h-4 rounded-sm text-purple-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingUser ? 'Edit Staff Account' : 'Register New Staff User'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@nexusstore.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {editingUser ? 'Change Password (Leave blank to keep)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Security Role *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="Super Admin">Super Admin (All permissions)</option>
                  <option value="Admin">Admin (Store manager)</option>
                  <option value="Manager">Manager (Floor & reports)</option>
                  <option value="Cashier">Cashier (POS register only)</option>
                  <option value="Inventory Staff">Inventory Staff (Warehouse only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) ..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

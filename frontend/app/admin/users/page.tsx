'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usersApi, departmentsApi, classesApi, clubsApi } from '@/lib/services';
import { User, Department, Class, Club } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type RoleFilter = '' | 'admin' | 'dept_coordinator' | 'requester' | 'faculty';

const ROLES = ['admin', 'dept_coordinator', 'requester', 'faculty'] as const;

const roleColor: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  dept_coordinator: 'bg-blue-100 text-blue-800',
  requester: 'bg-green-100 text-green-800',
  faculty: 'bg-orange-100 text-orange-800',
};

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  dept_coordinator: 'Dept Coordinator',
  requester: 'Requester',
  faculty: 'Faculty',
};

const EMPTY_FORM = {
  username: '', password: '', full_name: '', email: '', phone: '',
  role: 'requester' as string, dept_id: '',
  requester_type: 'class' as string, class_id: '', club_id: '',
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, loading, router]);

  const fetchUsers = () => {
    usersApi.getAll(roleFilter || undefined)
      .then((res) => setUsers(res.data ?? []))
      .catch(() => toast.error('Failed to load users'));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      departmentsApi.getAll().then((res) => setDepartments(res.data ?? [])).catch(() => {});
    }
  }, [user, roleFilter]);

  useEffect(() => {
    if (form.dept_id && form.role === 'requester') {
      const deptId = parseInt(form.dept_id);
      if (form.requester_type === 'class') {
        classesApi.getByDept(deptId)
          .then((res) => setClasses(res.data ?? []))
          .catch(() => toast.error('Failed to load classes'));
        setClubs([]);
      } else if (form.requester_type === 'club') {
        clubsApi.getAll(deptId)
          .then((res) => setClubs(res.data ?? []))
          .catch(() => toast.error('Failed to load clubs'));
        setClasses([]);
      }
    } else {
      setClasses([]);
      setClubs([]);
    }
  }, [form.dept_id, form.role, form.requester_type]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', {
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role: form.role,
        dept_id: form.dept_id ? parseInt(form.dept_id) : undefined,
        requester_type: form.role === 'requester' ? form.requester_type : undefined,
        class_id: (form.role === 'requester' && form.requester_type === 'class' && form.class_id) ? parseInt(form.class_id) : undefined,
        club_id: (form.role === 'requester' && form.requester_type === 'club' && form.club_id) ? parseInt(form.club_id) : undefined,
      });
      toast.success(`User "${form.username}" created successfully!`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!confirm(`Deactivate user "${u.full_name}"? They will lose login access.`)) return;
    try {
      await usersApi.deactivate(u.user_id);
      toast.success(`${u.full_name} deactivated`);
      fetchUsers();
    } catch { toast.error('Failed to deactivate'); }
  };

  const handleReactivate = async (u: User) => {
    try {
      await api.patch(`/users/${u.user_id}/reactivate`);
      toast.success(`${u.full_name} reactivated`);
      fetchUsers();
    } catch { toast.error('Failed to reactivate'); }
  };

  const openPasswordModal = (u: User) => {
    setPwdUser(u);
    setPwdNew('');
    setPwdConfirm('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdUser) return;
    if (pwdNew.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      await usersApi.changePassword(pwdUser.user_id, pwdNew);
      toast.success(`Password updated for ${pwdUser.full_name}`);
      setPwdUser(null);
      setPwdNew('');
      setPwdConfirm('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(msg || 'Failed to update password');
    } finally {
      setPwdSaving(false);
    }
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const needsDept = ['dept_coordinator', 'requester', 'faculty'].includes(form.role);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-blue-200 text-sm">{users.length} users total</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add User'}
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 relative">

        {/* Change password modal */}
        {pwdUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
            <form
              onSubmit={handlePasswordSubmit}
              className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">Set new password</h2>
              <p className="text-sm text-gray-600 mb-4">
                User: <span className="font-medium text-gray-800">{pwdUser.full_name}</span>{' '}
                <span className="text-gray-400">(@{pwdUser.username})</span>
              </p>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={pwdConfirm}
                    onChange={(e) => setPwdConfirm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPwdUser(null)}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {pwdSaving ? 'Saving…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create User Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create New User</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input required type="text" placeholder="e.g. john_doe"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input required type="password" placeholder="min 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required type="text" placeholder="e.g. John Doe"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
              </div>
              {needsDept && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department {form.role === 'requester' ? '*' : ''}
                  </label>
                  <select 
                    required={form.role === 'requester'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" placeholder="+91 98765 43210"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              {form.role === 'requester' && (
                <>
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Requester Entity Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
                        <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          value={form.requester_type} onChange={(e) => setForm({ ...form, requester_type: e.target.value, class_id: '', club_id: '' })}>
                          <option value="class">Class</option>
                          <option value="club">Club</option>
                        </select>
                      </div>

                      {form.requester_type === 'class' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
                          <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            disabled={!form.dept_id}
                            value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                            <option value="">{form.dept_id ? 'Select a class' : 'Select department first'}</option>
                            {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.year})</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Club *</label>
                          <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            disabled={!form.dept_id}
                            value={form.club_id} onChange={(e) => setForm({ ...form, club_id: e.target.value })}>
                            <option value="">{form.dept_id ? 'Select a club' : 'Select department first'}</option>
                            {clubs.map((c) => <option key={c.club_id} value={c.club_id}>{c.club_name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text" placeholder="Search by name, username, email..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:ring-2 focus:ring-blue-500"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email / Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No users found.</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.user_id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{u.full_name}</p>
                    <p className="text-gray-400 text-xs">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    <p>{u.email ?? '—'}</p>
                    {u.phone && <p className="text-xs">{u.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openPasswordModal(u)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Password
                      </button>
                      {u.user_id !== user?.user_id && (
                        u.is_active ? (
                          <button type="button" onClick={() => handleDeactivate(u)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleReactivate(u)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors">
                            Reactivate
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

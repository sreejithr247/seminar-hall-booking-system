'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/services';
import { User } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  const fetchUsers = () => {
    usersApi.getAll(roleFilter || undefined)
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user, roleFilter]);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user? They will lose access.')) return;
    try {
      await usersApi.deactivate(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    dept_coordinator: 'bg-blue-100 text-blue-800',
    requester: 'bg-green-100 text-green-800',
    faculty: 'bg-orange-100 text-orange-800',
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Users</h1>
        <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by role:</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="dept_coordinator">Dept Coordinator</option>
            <option value="requester">Requester</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.user_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{u.full_name}</p>
                <p className="text-sm text-gray-500">@{u.username} {u.email && `• ${u.email}`}</p>
                <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[u.role]}`}>{u.role}</span>
              </div>
              {u.user_id !== user?.user_id && (
                <button onClick={() => handleDeactivate(u.user_id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Deactivate</button>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-center text-gray-500 py-8">No users found.</p>}
        </div>
      </div>
    </div>
  );
}

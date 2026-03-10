'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clubsApi, departmentsApi } from '@/lib/services';
import { Club, Department } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminClubsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ club_name: '', description: '', dept_id: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, loading, router]);

  const fetchClubs = () => {
    clubsApi.getAll()
      .then((res) => setClubs(res.data ?? []))
      .catch(() => toast.error('Failed to load clubs'));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchClubs();
      departmentsApi.getAll().then((res) => setDepartments(res.data ?? [])).catch(() => {});
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clubsApi.create({
        club_name: form.club_name,
        dept_id: form.dept_id ? parseInt(form.dept_id) : undefined,
        description: form.description || undefined,
      });
      toast.success(`Club "${form.club_name}" created!`);
      setShowForm(false);
      setForm({ club_name: '', description: '', dept_id: '' });
      fetchClubs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create club');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club: Club) => {
    if (!confirm(`Delete club "${club.club_name}"? This cannot be undone.`)) return;
    try {
      await clubsApi.delete(club.club_id);
      toast.success(`Club "${club.club_name}" deleted`);
      setClubs((prev) => prev.filter((c) => c.club_id !== club.club_id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete club');
    }
  };

  const getDeptName = (id?: number | null) =>
    id ? (departments.find((d) => d.dept_id === id)?.dept_name ?? '—') : 'No Department';

  const filtered = clubs.filter((c) =>
    c.club_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Manage Clubs</h1>
          <p className="text-blue-200 text-sm">{clubs.length} clubs registered</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowForm(!showForm); setForm({ club_name: '', description: '', dept_id: '' }); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add Club'}
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Create Club Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Club</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                <input required type="text" placeholder="e.g. Photography Club"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.club_name} onChange={(e) => setForm({ ...form, club_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} placeholder="Brief description of the club..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create Club'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="mb-4">
          <input type="text" placeholder="Search clubs by name or description..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Clubs Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏛️</p>
            <p className="text-lg font-medium">No clubs found</p>
            <p className="text-sm mt-1">Click &quot;+ Add Club&quot; to create one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((club) => (
              <div key={club.club_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="font-semibold text-gray-800 truncate">{club.club_name}</h3>
                  <p className="text-xs text-blue-600 mt-0.5">{getDeptName(club.dept_id)}</p>
                  {club.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{club.description}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(club)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

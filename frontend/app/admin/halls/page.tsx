'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { hallsApi } from '@/lib/services';
import { Hall } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminHallsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hall_name: '', capacity: '', location: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  const fetchHalls = () => {
    hallsApi.getAll()
      .then((res) => setHalls(res.data ?? []))
      .catch(() => toast.error('Failed to load halls'))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchHalls();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hallsApi.create({ hall_name: form.hall_name, capacity: parseInt(form.capacity), location: form.location || undefined, facilities: {} });
      toast.success('Hall created!');
      setShowForm(false);
      setForm({ hall_name: '', capacity: '', location: '' });
      fetchHalls();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create hall');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this hall?')) return;
    try {
      await hallsApi.delete(id);
      toast.success('Hall deactivated');
      fetchHalls();
    } catch {
      toast.error('Failed to deactivate hall');
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Halls</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">+ Add Hall</button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
            <h2 className="font-bold text-gray-800">Add New Hall</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hall Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.hall_name} onChange={(e) => setForm({ ...form, hall_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input required type="number" min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Hall'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {halls.map((h) => (
            <div key={h.hall_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{h.hall_name}</h3>
                <p className="text-sm text-gray-500">Capacity: {h.capacity}</p>
                {h.location && <p className="text-sm text-gray-500">Location: {h.location}</p>}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {h.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {h.is_active && (
                <button onClick={() => handleDeactivate(h.hall_id)} className="text-red-500 hover:text-red-700 text-sm">Deactivate</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

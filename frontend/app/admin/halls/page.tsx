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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    hall_name: '', 
    capacity: '', 
    location: '',
    facilities: [] as string[]
  });
  const [newFacility, setNewFacility] = useState('');
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

  const resetForm = () => {
    setForm({ 
      hall_name: '', 
      capacity: '', 
      location: '',
      facilities: []
    });
    setNewFacility('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (h: Hall) => {
    // Convert facilities object keys to array
    const facilityList = Object.keys(h.facilities || {}).filter(k => h.facilities[k]);
    
    setForm({
      hall_name: h.hall_name,
      capacity: h.capacity.toString(),
      location: h.location || '',
      facilities: facilityList
    });
    setEditingId(h.hall_id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddFacility = () => {
    if (!newFacility.trim()) return;
    if (form.facilities.includes(newFacility.trim())) {
      toast.error('Facility already added');
      return;
    }
    setForm({
      ...form,
      facilities: [...form.facilities, newFacility.trim()]
    });
    setNewFacility('');
  };

  const handleRemoveFacility = (index: number) => {
    const newList = [...form.facilities];
    newList.splice(index, 1);
    setForm({ ...form, facilities: newList });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert array back to map for backend
      const facilitiesMap = Object.fromEntries(
        form.facilities.map(f => [f, true])
      );

      const data = { 
        hall_name: form.hall_name, 
        capacity: parseInt(form.capacity), 
        location: form.location || undefined, 
        facilities: facilitiesMap 
      };

      if (editingId) {
        await hallsApi.update(editingId, { ...data, is_active: true });
        toast.success('Hall updated!');
      } else {
        await hallsApi.create(data);
        toast.success('Hall created!');
      }
      resetForm();
      fetchHalls();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save hall');
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
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
            {showForm && !editingId ? 'Close Form' : '+ Add Hall'}
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
            <h2 className="font-bold text-gray-800">{editingId ? 'Edit Hall' : 'Add New Hall'}</h2>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="e.g. WiFi, AC, PA System" 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                />
                <button 
                  type="button" 
                  onClick={handleAddFacility}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-bold"
                >
                  +
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {form.facilities.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700 uppercase">{f}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFacility(idx)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {form.facilities.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">No facilities added yet.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving...' : (editingId ? 'Update Hall' : 'Save Hall')}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {halls.map((h) => (
            <div key={h.hall_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{h.hall_name}</h3>
                  <p className="text-sm text-gray-500">Capacity: {h.capacity}</p>
                  {h.location && <p className="text-sm text-gray-500">Location: {h.location}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {h.is_active && (
                    <>
                      <button onClick={() => handleEdit(h)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDeactivate(h.hall_id)} className="text-red-500 hover:text-red-700 text-sm">Deactivate</button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-left">
                <div className="flex flex-wrap gap-1 mb-3">
                  {Object.entries(h.facilities || {}).map(([f, v]) => v && (
                    <span key={f} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider font-semibold">
                      {f}
                    </span>
                  ))}
                  {(!h.facilities || Object.keys(h.facilities).filter(k => h.facilities[k]).length === 0) && (
                    <span className="text-[10px] text-gray-400 italic">No facilities listed</span>
                  )}
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {h.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => router.push(`/halls/${h.hall_id}/calendar`)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    Calendar →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

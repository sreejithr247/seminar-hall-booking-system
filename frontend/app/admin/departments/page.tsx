'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { departmentsApi } from '@/lib/services';
import { Department } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dept_name: '', dept_code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  const fetchDepts = () => {
    departmentsApi.getAll()
      .then((res) => setDepartments(res.data))
      .catch(() => toast.error('Failed to load departments'));
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchDepts();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await departmentsApi.create(form.dept_name, form.dept_code);
      toast.success('Department created!');
      setShowForm(false);
      setForm({ dept_name: '', dept_code: '' });
      fetchDepts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this department? This may affect existing users.')) return;
    try {
      await departmentsApi.delete(id);
      toast.success('Department deleted');
      fetchDepts();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Departments</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">+ Add Department</button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
            <h2 className="font-bold text-gray-800">Add New Department</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.dept_name} onChange={(e) => setForm({ ...form, dept_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dept Code</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.dept_code} onChange={(e) => setForm({ ...form, dept_code: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.dept_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{d.dept_name}</p>
                {d.dept_code && <p className="text-sm text-gray-500">Code: {d.dept_code}</p>}
              </div>
              <button onClick={() => handleDelete(d.dept_id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
            </div>
          ))}
          {departments.length === 0 && <p className="text-center text-gray-500 py-8">No departments found.</p>}
        </div>
      </div>
    </div>
  );
}

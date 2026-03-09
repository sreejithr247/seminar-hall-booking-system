'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { classesApi, departmentsApi } from '@/lib/services';
import { Class, Department } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminClassesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_name: '', year: '', dept_id: '' });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      departmentsApi.getAll()
        .then((res) => {
          const depts = res.data ?? [];
          setDepartments(depts);
          if (depts.length > 0) setSelectedDept(String(depts[0].dept_id));
        })
        .catch(() => toast.error('Failed to load departments'));
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDept) return;
    setFetching(true);
    classesApi.getByDept(parseInt(selectedDept))
      .then((res) => setClasses(res.data ?? []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setFetching(false));
  }, [selectedDept]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dept_id) {
      toast.error('Please select a department');
      return;
    }
    setSaving(true);
    try {
      await classesApi.create({
        class_name: form.class_name,
        dept_id: parseInt(form.dept_id),
        year: form.year,
      });
      toast.success(`Class "${form.class_name}" created!`);
      setShowForm(false);
      setForm({ class_name: '', year: '', dept_id: selectedDept });
      // Refresh if same dept
      if (form.dept_id === selectedDept) {
        classesApi.getByDept(parseInt(selectedDept)).then((r) => setClasses(r.data ?? []));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls: Class) => {
    if (!confirm(`Delete class "${cls.class_name}"? This cannot be undone.`)) return;
    try {
      await classesApi.delete(cls.class_id);
      toast.success(`Class "${cls.class_name}" deleted`);
      setClasses((prev) => prev.filter((c) => c.class_id !== cls.class_id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete class');
    }
  };

  const getDeptName = (id: number) =>
    departments.find((d) => d.dept_id === id)?.dept_name ?? '—';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Manage Classes</h1>
          <p className="text-blue-200 text-sm">{classes.length} classes in selected department</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowForm(!showForm); setForm({ class_name: '', year: '', dept_id: selectedDept }); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add Class'}
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Create Class Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Class</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input required type="text" placeholder="e.g. BCA 6th Sem"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year / Batch</label>
                <input type="text" placeholder="e.g. 3rd Year"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create Class'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Department Filter */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Filter by Department:</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            {departments.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
          </select>
        </div>

        {/* Classes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Class Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Year / Batch</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classes.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No classes found for this department.</td></tr>
                )}
                {classes.map((cls) => (
                  <tr key={cls.class_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{cls.class_name}</td>
                    <td className="px-4 py-3 text-gray-500">{getDeptName(cls.dept_id)}</td>
                    <td className="px-4 py-3 text-gray-500">{cls.year ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(cls)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { reportsApi } from '@/lib/services';
import { HallUsageReport, DepartmentUsageReport } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hallReport, setHallReport] = useState<HallUsageReport[]>([]);
  const [deptReport, setDeptReport] = useState<DepartmentUsageReport[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([reportsApi.hallUsage(), reportsApi.deptUsage()])
        .then(([hallRes, deptRes]) => {
          setHallReport(hallRes.data);
          setDeptReport(deptRes.data);
        })
        .catch(() => toast.error('Failed to load reports'))
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Reports</h1>
        <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
        {/* Hall Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏛️ Hall Usage</h2>
          {hallReport.length === 0 ? <p className="text-gray-500 text-sm">No data yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Hall</th><th className="pb-2 text-right">Bookings</th></tr></thead>
              <tbody>
                {hallReport.map((r) => (
                  <tr key={r.hall_id} className="border-b last:border-0">
                    <td className="py-2">{r.hall_name}</td>
                    <td className="py-2 text-right font-semibold text-blue-700">{r.total_bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Department Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏢 Department Usage</h2>
          {deptReport.length === 0 ? <p className="text-gray-500 text-sm">No data yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Department</th><th className="pb-2 text-right">Requests</th></tr></thead>
              <tbody>
                {deptReport.map((r) => (
                  <tr key={r.dept_id} className="border-b last:border-0">
                    <td className="py-2">{r.dept_name}</td>
                    <td className="py-2 text-right font-semibold text-blue-700">{r.total_requests}</td>
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { requestsApi } from '@/lib/services';
import { Request } from '@/lib/types';
import { toast } from 'sonner';

export default function MyRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'requester') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'requester') {
      requestsApi.getMy()
        .then((res) => setRequests(res.data))
        .catch(() => toast.error('Failed to load requests'))
        .finally(() => setFetching(false));
    }
  }, [user]);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    forwarded: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    amended: 'bg-purple-100 text-purple-800',
  };

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Booking Requests</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push('/requester/request-new')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            + New Request
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No requests yet.</p>
            <button onClick={() => router.push('/requester/request-new')} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Make Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.request_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{req.event_title}</h3>
                    <p className="text-sm text-gray-500">{req.event_date} &bull; {req.start_time} – {req.end_time}</p>
                    {req.purpose && <p className="text-sm text-gray-600 mt-1">Purpose: {req.purpose}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs font-medium">
                    <span className={`px-2 py-1 rounded-full ${statusColor[req.dept_status]}`}>Dept: {req.dept_status}</span>
                    <span className={`px-2 py-1 rounded-full ${statusColor[req.admin_status]}`}>Admin: {req.admin_status}</span>
                  </div>
                </div>
                {(req.dept_remarks || req.admin_remarks) && (
                  <div className="mt-3 border-t pt-3 text-sm text-gray-500 space-y-1">
                    {req.dept_remarks && <p>Dept remarks: {req.dept_remarks}</p>}
                    {req.admin_remarks && <p>Admin remarks: {req.admin_remarks}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

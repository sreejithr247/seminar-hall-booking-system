'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { requestsApi } from '@/lib/services';
import { Request } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPendingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [fetching, setFetching] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  const fetchRequests = () => {
    requestsApi.getAdminPending()
      .then((res) => setRequests(res.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchRequests();
  }, [user]);

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    const remarks = window.prompt(`Enter remarks for ${action} (optional):`) ?? undefined;
    setReviewing(id);
    try {
      await requestsApi.adminReview(id, { action, remarks });
      toast.success(`Request ${action === 'approve' ? 'approved and booking confirmed' : 'rejected'}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed — possible time slot conflict');
    } finally {
      setReviewing(null);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin — Pending Requests</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push('/admin/bookings')} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm">View Bookings</button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><p className="text-lg">No forwarded requests awaiting admin approval.</p></div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.request_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{req.event_title}</h3>
                    <p className="text-sm text-gray-500">{formatDate(req.event_date)} &bull; {formatTime(req.start_time)} – {formatTime(req.end_time)}</p>
                    {req.purpose && <p className="text-sm text-gray-600 mt-1">Purpose: {req.purpose}</p>}
                    {req.expected_attendees && <p className="text-sm text-gray-600">Attendees: {req.expected_attendees}</p>}
                    {req.dept_remarks && <p className="text-xs text-blue-600 mt-1">Dept remarks: {req.dept_remarks}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={reviewing === req.request_id}
                      onClick={() => handleReview(req.request_id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      disabled={reviewing === req.request_id}
                      onClick={() => handleReview(req.request_id, 'reject')}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

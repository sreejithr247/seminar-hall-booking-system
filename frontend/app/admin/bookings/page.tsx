'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi } from '@/lib/services';
import { Booking } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  const fetchBookings = () => {
    bookingsApi.getAll()
      .then((res) => setBookings(res.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchBookings();
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingsApi.cancel(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const statusColor: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-gray-100 text-gray-700',
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">All Bookings</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push('/admin/reports')} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm">Reports</button>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><p>No bookings yet.</p></div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.booking_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{b.event_title}</h3>
                  <p className="text-sm text-gray-500">{b.event_date} &bull; {b.start_time} – {b.end_time}</p>
                  <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${statusColor[b.status]}`}>{b.status}</span>
                </div>
                {b.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(b.booking_id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

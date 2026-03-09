'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { hallsApi, requestsApi } from '@/lib/services';
import { Hall } from '@/lib/types';
import { toast } from 'sonner';

export default function NewRequestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hall_id: 0,
    event_title: '',
    event_description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    expected_attendees: '',
    purpose: '',
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'requester') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    hallsApi.getAll().then((res) => setHalls(res.data)).catch(() => toast.error('Failed to load halls'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hall_id) { toast.error('Please select a hall'); return; }

    setSubmitting(true);
    try {
      await requestsApi.create({
        hall_id: form.hall_id,
        event_title: form.event_title,
        event_description: form.event_description || undefined,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : undefined,
        purpose: form.purpose || undefined,
      });
      toast.success('Request submitted successfully!');
      router.push('/requester/my-requests');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">New Booking Request</h1>
        <button onClick={() => router.push('/dashboard')} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Dashboard</button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seminar Hall *</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.hall_id}
              onChange={(e) => setForm({ ...form, hall_id: parseInt(e.target.value) })}
            >
              <option value={0}>Select a hall...</option>
              {halls.map((h) => (
                <option key={h.hall_id} value={h.hall_id}>{h.hall_name} (Capacity: {h.capacity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.event_title} onChange={(e) => setForm({ ...form, event_title: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
            <input required type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input required type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input required type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Attendees</label>
            <input type="number" min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.expected_attendees} onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.event_description} onChange={(e) => setForm({ ...form, event_description: e.target.value })} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '@/lib/api';
import { Booking, Hall } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);

export default function HallCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.id as string;
  const [hall, setHall] = useState<Hall | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<View>('day');

  useEffect(() => {
    fetchHall();
  }, [hallId]);

  useEffect(() => {
    fetchBookings();
  }, [hallId, selectedDate]);

  const fetchHall = async () => {
    if (!hallId) return;
    try {
      const response = await api.get(`/halls/${hallId}`);
      setHall(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch hall details');
    }
  };

  const fetchBookings = async () => {
    if (!hallId) return;
    try {
      // Fetch for the whole month surrounding selectedDate to be safe regardless of view
      const startOfMonth = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
      
      const response = await api.get(`/availability?start_date=${startOfMonth}&end_date=${endOfMonth}&hall_id=${hallId}`);
      setBookings(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const events = (bookings || []).map((booking) => {
    const datePart = booking.event_date.split('T')[0];
    return {
      title: booking.event_title,
      start: moment(`${datePart} ${booking.start_time}`).toDate(),
      end: moment(`${datePart} ${booking.end_time}`).toDate(),
      resource: booking,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              {hall?.hall_name || 'Hall Calendar'}
            </h1>
            {hall && (
              <p className="text-gray-600 mt-1">
                Capacity: {hall.capacity} | {hall.location}
              </p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={moment(selectedDate).format('YYYY-MM-DD')}
            onChange={(e) => setSelectedDate(moment(e.target.value).toDate())}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={(newView) => setView(newView)}
            views={['day', 'week', 'month']}
            date={selectedDate}
            onNavigate={(date) => setSelectedDate(date)}
          />
        </div>

        {(bookings || []).length > 0 && view === 'day' && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Bookings for {selectedDate.toLocaleDateString()}</h2>
            <div className="space-y-2">
              {(bookings || []).filter(b => b.event_date.split('T')[0] === moment(selectedDate).format('YYYY-MM-DD')).map((booking) => (
                <div key={booking.booking_id} className="p-3 bg-blue-50 rounded">
                  <p className="font-semibold">{booking.event_title}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


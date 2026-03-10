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

  useEffect(() => {
    fetchHall();
    fetchBookings();
  }, [hallId, selectedDate]);

  const fetchHall = async () => {
    try {
      const response = await api.get(`/halls/${hallId}`);
      setHall(response.data);
    } catch (error) {
      toast.error('Failed to fetch hall details');
    }
  };

  const fetchBookings = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(`/availability?date=${dateStr}`);
      const hallBookings = response.data.find((slot: any) => slot.hall_id === parseInt(hallId));
      setBookings(hallBookings?.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const events = bookings.map((booking) => ({
    title: booking.event_title,
    start: new Date(`${booking.event_date}T${booking.start_time}`),
    end: new Date(`${booking.event_date}T${booking.end_time}`),
    resource: booking,
  }));

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
          <Link
            href="/halls"
            className="text-blue-600 hover:underline"
          >
            ← Back to Halls
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
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
            defaultView="day"
            views={['day', 'week', 'month']}
            date={selectedDate}
            onNavigate={(date) => setSelectedDate(date)}
          />
        </div>

        {bookings.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Bookings for {selectedDate.toLocaleDateString()}</h2>
            <div className="space-y-2">
              {bookings.map((booking) => (
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


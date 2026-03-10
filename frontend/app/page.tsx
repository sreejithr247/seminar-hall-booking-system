'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AvailabilitySlot } from '@/lib/types';
import { toast } from 'sonner';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/availability?date=${selectedDate}`);
      setAvailability(response.data);
    } catch (error) {
      toast.error('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            Seminar Hall Booking System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Book seminar halls for your classes and events
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/halls"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Halls
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Availability Checker */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Check Availability</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={fetchAvailability}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Check'}
            </button>
          </div>

          {availability.length > 0 && (
            <div className="space-y-2">
              {availability.map((slot) => (
                <div key={slot.hall_id} className="p-3 bg-blue-50 rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{slot.hall_name}</p>
                    <p className="text-sm text-gray-600">
                      {(slot.bookings ?? []).length} booking(s) on this date
                    </p>
                  </div>
                  <Link
                    href={`/halls/${slot.hall_id}/calendar`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    View Calendar →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              View Availability
            </h3>
            <p className="text-gray-600">
              Check real-time availability of all seminar halls without logging in
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Easy Booking
            </h3>
            <p className="text-gray-600">
              Request bookings for your class or club events with a simple form
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Approval Workflow
            </h3>
            <p className="text-gray-600">
              Two-level approval system ensures proper management of hall bookings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

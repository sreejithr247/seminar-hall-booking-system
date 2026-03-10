'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Hall } from '@/lib/types';
import { toast } from 'sonner';

export default function HallsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await api.get('/halls');
      setHalls(response.data);
    } catch (error) {
      toast.error('Failed to fetch halls');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Seminar Halls</h1>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halls.map((hall) => (
            <div
              key={hall.hall_id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-blue-900 mb-2">
                {hall.hall_name}
              </h2>
              <p className="text-gray-600 mb-4">
                <strong>Capacity:</strong> {hall.capacity} people
              </p>
              {hall.location && (
                <p className="text-gray-600 mb-2">
                  <strong>Location:</strong> {hall.location}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-4">
                {Object.entries(hall.facilities || {}).map(([f, v]) => v && (
                  <span key={f} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                    {f.replace('_', ' ')}
                  </span>
                ))}
              </div>
              <Link
                href={`/halls/${hall.hall_id}/calendar`}
                className="text-blue-600 hover:underline inline-block font-medium"
              >
                View Availability →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AvailabilitySlot } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Availability state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const fetchAvailability = async () => {
    setChecking(true);
    try {
      const response = await api.get(`/availability?date=${selectedDate}`);
      setAvailability(response.data);
    } catch (error) {
      toast.error('Failed to fetch availability');
    } finally {
      setChecking(false);
    }
  };

  // Always show spinner while loading — never redirect prematurely
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const commonLinks = [
    { label: '🏛️ View Halls', href: '/halls' },
  ];

  const roleLinks: Record<string, { label: string; href: string }[]> = {
    admin: [
      { label: '📋 Pending Requests', href: '/admin/pending' },
      { label: '📅 All Bookings', href: '/admin/bookings' },
      { label: '🏛️ Manage Halls', href: '/admin/halls' },
      { label: '🏢 Manage Departments', href: '/admin/departments' },
      { label: '🎓 Manage Classes', href: '/admin/classes' },
      { label: '🏅 Manage Clubs', href: '/admin/clubs' },
      { label: '👥 Manage Users', href: '/admin/users' },
      { label: '📊 Reports', href: '/admin/reports' },
    ],
    dept_coordinator: [
      { label: '📋 Pending Requests', href: '/coordinator/pending' },
      { label: '🎓 Manage Classes', href: '/coordinator/classes' },
      { label: '👩‍🏫 View Faculty', href: '/coordinator/faculty' },
    ],
    requester: [
      { label: '➕ New Request', href: '/requester/request-new' },
      { label: '📋 My Requests', href: '/requester/my-requests' },
    ],
    faculty: [],
  };

  const links = [...commonLinks, ...(roleLinks[user.role] ?? [])];

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    dept_coordinator: 'Department Coordinator',
    requester: 'Requester',
    faculty: 'Faculty',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Seminar Hall Booking System</h1>
          <p className="text-blue-200 text-sm">{roleLabel[user.role]}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">Welcome, {user.full_name}</span>
          <button
            onClick={logout}
            className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>

        <div className="space-y-8">
          {/* Main Links - 3 columns on desktop for better spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <p className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {link.label}
                </p>
              </a>
            ))}
          </div>

          {/* Availability Checker - Full Width Row */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>📅</span> Check Hall Availability
            </h3>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
              <button
                onClick={fetchAvailability}
                disabled={checking}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-bold whitespace-nowrap"
              >
                {checking ? 'Checking...' : 'Check Availability'}
              </button>
            </div>

            {availability.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {availability.map((slot) => (
                  <div key={slot.hall_id} className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-blue-900">{slot.hall_name}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        {(slot.bookings ?? []).length} booking(s) scheduled
                      </p>
                    </div>
                    <Link
                      href={`/halls/${slot.hall_id}/calendar`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold uppercase tracking-widest text-right mt-auto"
                    >
                      View Calendar →
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            {availability.length === 0 && !checking && (
              <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Pick a date above to see which halls are booked or free.
              </p>
            )}
          </div>

          {/* User Profile Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-50">Your Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Full Name</span>
                <span className="text-gray-800 font-semibold">{user.full_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Username</span>
                <span className="text-gray-800 font-semibold">{user.username}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Email Address</span>
                <span className="text-gray-800 font-semibold">{user.email ?? 'Not provided'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Account Role</span>
                <span className="text-blue-700 font-bold">{roleLabel[user.role]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

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
    faculty: [
      { label: '🏛️ View Halls', href: '/halls' },
    ],
  };

  const links = roleLinks[user.role] ?? [];

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

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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

        {/* Quick info */}
        <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Profile</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div><span className="font-medium">Name:</span> {user.full_name}</div>
            <div><span className="font-medium">Username:</span> {user.username}</div>
            <div><span className="font-medium">Email:</span> {user.email ?? '—'}</div>
            <div><span className="font-medium">Role:</span> {roleLabel[user.role]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

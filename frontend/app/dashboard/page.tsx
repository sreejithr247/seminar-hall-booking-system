'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AvailabilitySlot } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { authApi } from '@/lib/services';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Availability state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [checking, setChecking] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

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

  const handleOwnPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdNew.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      toast.error('New passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      await authApi.changeOwnPassword(pwdCurrent, pwdNew);
      toast.success('Password updated. Use it on your next login.');
      setPwdOpen(false);
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Could not update password');
    } finally {
      setPwdSaving(false);
    }
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    dept_coordinator: 'Department Coordinator',
    requester: 'Requester',
    faculty: 'Faculty',
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <form
            onSubmit={handleOwnPasswordSubmit}
            className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">Change your password</h2>
            <p className="text-sm text-gray-600 mb-4">Enter your current password, then choose a new one.</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPwdOpen(false);
                  setPwdCurrent('');
                  setPwdNew('');
                  setPwdConfirm('');
                }}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pwdSaving}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {pwdSaving ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      )}

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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Your Profile</h3>
              <button
                type="button"
                onClick={() => {
                  setPwdOpen(true);
                  setPwdCurrent('');
                  setPwdNew('');
                  setPwdConfirm('');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Change password
              </button>
            </div>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            Seminar Hall Booking
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className={`hover:text-blue-200 ${pathname === '/' ? 'underline' : ''}`}
            >
              Home
            </Link>
            <Link
              href="/halls"
              className={`hover:text-blue-200 ${pathname === '/halls' ? 'underline' : ''}`}
            >
              Halls
            </Link>
            <Link
              href="/dashboard"
              className={`hover:text-blue-200 ${pathname === '/dashboard' ? 'underline' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-600"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


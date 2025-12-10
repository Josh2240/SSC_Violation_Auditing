'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'bi-house' },
    { href: '/violations', label: 'Violations', icon: 'bi-file-earmark-text' },
    { href: '/students', label: 'Students', icon: 'bi-people' },
  ];

  if (user.role === 'admin' || user.role === 'staff') {
    navItems.push({ href: '/audit-logs', label: 'Audit Logs', icon: 'bi-clock-history' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image
                src="/images/552358563_780630158154517_6126058971160016074_n.jpg"
                alt="Supreme Student Council Logo"
                width={36}
                height={36}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-base font-bold text-gray-800 leading-tight">PCLU Violation System</h1>
                <p className="text-xs text-gray-500">Supreme Student Council</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-xs font-bold text-gray-800">PCLU</h1>
              </div>
            </div>
            
            <div className="hidden sm:flex sm:space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-2 lg:px-3 py-1 border-b-2 text-xs lg:text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`bi ${item.icon} hidden lg:inline mr-1 lg:mr-2`}></i>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-700">{user.full_name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 rounded">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md text-sm transition-colors touch-target"
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
              >
                <i className="bi bi-list text-lg"></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`bi ${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
              <div className="px-3 py-2 border-t border-gray-200 mt-2">
                <p className="text-xs text-gray-500">{user.full_name}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}


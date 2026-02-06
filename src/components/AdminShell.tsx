'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, LayoutDashboard, Video, Image, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/videos', label: 'Videos', icon: Video },
    { href: '/admin/videos/bulk-movie', label: 'Bulk Movie', icon: Video },
    { href: '/admin/videos/bulk-bollywood', label: 'Bulk Bollywood', icon: Video },
    { href: '/admin/videos/bulk-moviebox', label: 'MovieBox', icon: Video },
    { href: '/admin/videos/bulk-dailymotion', label: 'Bulk Dailymotion', icon: Video },
    { href: '/admin/carousel', label: 'Carousel', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex overflow-x-hidden">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-800 border border-white/10 text-white"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={clsx(
          'w-64 bg-surface-800 border-r border-white/10 flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <Film className="w-8 h-8 text-red-500" />
            <span className="font-bold text-lg text-white">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-red-600/20 text-red-400' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="block text-center text-gray-400 hover:text-white text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-14 md:pt-8 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Sparkles, Calendar, Shuffle, Newspaper, Clapperboard, Tv } from 'lucide-react';
import { useUI } from '@/store/ui';
import { clsx } from 'clsx';

const BLOG_URL = 'https://www.blogger.com';

const items = [
  { href: '/?type=movie', label: 'Movies', icon: Film },
  { href: '/?type=series', label: 'Series', icon: Clapperboard },
  { href: '/?type=drama', label: 'Dramas', icon: Tv },
  { href: '/?type=anime', label: 'Anime', icon: Clapperboard },
  { href: '/?type=manga', label: 'Manga', icon: Film },
  { href: BLOG_URL, label: 'News', icon: Newspaper, external: true },
  { href: '/?type=trailer', label: 'Trailer', icon: Film },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUI();

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-surface-800 border-r border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-bold text-lg">Menu</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    !item.external &&
                    (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('?')[0]));
                  if (item.external) {
                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                            'hover:bg-white/10 text-gray-300 hover:text-white'
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                          isActive
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'hover:bg-white/10 text-gray-300 hover:text-white'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, X, User, LogOut, Film } from 'lucide-react';
import { useUI } from '@/store/ui';
import { clsx } from 'clsx';

const BLOG_URL = 'https://blogger.com';

export function Navbar() {
  const { data: session, status } = useSession();
  const { toggleSidebar } = useUI();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; thumbnailUrl: string; category: string; type: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounce, setDebounce] = useState<NodeJS.Timeout | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounce) clearTimeout(debounce);
    const t = setTimeout(() => fetchSuggestions(query), 300);
    setDebounce(t);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-black/95 backdrop-blur-md py-2' : 'bg-transparent py-4'
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Film className="w-8 h-8 text-red-500" />
            <span className="font-bold text-xl hidden sm:inline text-white">Complet</span>
          </Link>
        </div>

        <div className="flex-1 max-w-xl mx-4 relative hidden md:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                setSearchOpen(false);
                setShowSuggestions(false);
                router.push(`/results?q=${encodeURIComponent(query)}`);
              }
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <input
              type="search"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white/5 transition-all"
            />
          </form>
          <AnimatePresence>
            {showSuggestions && (query || suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden max-h-[500px] overflow-y-auto z-[100] backdrop-blur-xl"
              >
                {suggestions.length === 0 && query ? (
                  <div className="p-4 flex items-center gap-3 text-gray-500 italic">
                    <Search className="w-4 h-4" />
                    <span>Search for "{query}"</span>
                  </div>
                ) : (
                  <div className="py-2">
                    {suggestions.map((v) => (
                      <Link
                        key={v.id}
                        href={`/watch/${v.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all group"
                      >
                        <div className="w-12 h-8 rounded bg-white/5 overflow-hidden flex-shrink-0">
                          <img
                            src={v.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm font-medium text-gray-200 group-hover:text-white">{v.title}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{v.category || v.type}</span>
                        </div>
                      </Link>
                    ))}
                    {query && (
                      <button
                        onClick={() => router.push(`/results?q=${encodeURIComponent(query)}`)}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-white/5 border-t border-white/5 flex items-center gap-2"
                      >
                        <Search className="w-3 h-3" /> View all results
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            aria-label="Search"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          {status === 'loading' ? (
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
          ) : session?.user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                aria-label="Account"
                aria-expanded={profileOpen}
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-1 py-1 w-48 bg-surface-700 rounded-lg shadow-xl border border-white/10 z-50"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 block"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-red-400 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-black/50 backdrop-blur-xl border-b border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                setSearchOpen(false);
                setShowSuggestions(false);
                router.push(`/results?q=${encodeURIComponent(query)}`);
              }
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </form>
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-[#1a1a1a] rounded-xl overflow-hidden max-h-80 overflow-y-auto border border-white/10 shadow-2xl"
              >
                {suggestions.map((v) => (
                  <Link
                    key={v.id}
                    href={`/watch/${v.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                  >
                    <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-white/5">
                      <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm text-gray-200">{v.title}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{v.category || v.type}</span>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setShowSuggestions(false);
                    router.push(`/results?q=${encodeURIComponent(query)}`);
                  }}
                  className="w-full p-3 text-center text-xs font-bold text-red-500 bg-white/5"
                >
                  View all results
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.nav>
  );
}

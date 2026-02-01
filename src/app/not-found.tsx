import Link from 'next/link';
import { Film, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900 px-4">
      <Film className="w-20 h-20 text-red-500/50 mb-6" />
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 mb-8 text-center">This page could not be found.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
      >
        <Home className="w-5 h-5" /> Back to home
      </Link>
    </div>
  );
}

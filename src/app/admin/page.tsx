import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Video, Image, TrendingUp } from 'lucide-react';

export default async function AdminDashboardPage() {
  const [videoCount, carouselCount, byCategory] = await Promise.all([
    prisma.video.count(),
    prisma.carouselSlide.count(),
    prisma.video.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-white">{videoCount}</span>
          </div>
          <p className="text-gray-400">Total videos</p>
          <Link href="/admin/videos" className="mt-3 text-red-500 hover:underline text-sm">
            Manage videos →
          </Link>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Image className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-white">{carouselCount}</span>
          </div>
          <p className="text-gray-400">Carousel slides (max 10)</p>
          <Link href="/admin/carousel" className="mt-3 text-red-500 hover:underline text-sm">
            Manage carousel →
          </Link>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-white">{byCategory.length}</span>
          </div>
          <p className="text-gray-400">Categories in use</p>
        </div>
      </div>
      <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Videos by category</h2>
        <ul className="space-y-2">
          {byCategory.map((c) => (
            <li key={c.category} className="flex justify-between text-gray-300">
              <span className="capitalize">{c.category}</span>
              <span className="font-medium text-white">{c._count.id}</span>
            </li>
          ))}
          {byCategory.length === 0 && (
            <li className="text-gray-500">No videos yet. Add videos from the Videos page.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

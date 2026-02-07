import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { VideoList } from './VideoList';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminMovieboxImporter from '@/components/AdminMovieboxImporter';

export default async function AdminVideosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    redirect('/auth/login?callbackUrl=/admin/videos');
  }
  const videos = await (prisma.video as any).findMany({
    where: {
      parentId: null, // Only show parent videos, not child episodes
    },
    orderBy: { createdAt: 'desc' },
    include: { subtitles: true },
  }) as any;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Videos</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/admin/videos/bulk"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5"
          >
            <Plus className="w-5 h-5 text-blue-500" /> Bulk Anime
          </Link>
          <Link
            href="/admin/videos/bulk-movie"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5"
          >
            <Plus className="w-5 h-5 text-red-500" /> Bulk Movie
          </Link>
          <Link
            href="/admin/videos/bulk-bollywood"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5"
          >
            <Plus className="w-5 h-5 text-orange-500" /> Bulk Bollywood
          </Link>
          <Link
            href="/admin/videos/bulk-moviebox"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5"
          >
            <Plus className="w-5 h-5 text-purple-500" /> MovieBox
          </Link>
          <Link
            href="/admin/videos/search-import"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5"
          >
            <Plus className="w-5 h-5 text-cyan-500" /> Search & Import
          </Link>
          <Link
            href="/admin/videos/new"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Add Video
          </Link>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Quick Import</h2>
        <AdminMovieboxImporter />
      </div>
      <VideoList videos={videos} />
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { VideoList } from './VideoList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

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
    <div className="w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Videos</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/admin/videos/bulk"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 text-blue-500" /> <span className="hidden sm:inline">Bulk Anime</span>
          </Link>
          <Link
            href="/admin/videos/bulk-movie"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">Bulk Movie</span>
          </Link>
          <Link
            href="/admin/videos/bulk-bollywood"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 text-orange-500" /> <span className="hidden sm:inline">Bulk Bollywood</span>
          </Link>
          <Link
            href="/admin/videos/bulk-hindi-dub"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 text-green-500" /> <span className="hidden sm:inline">Hindi Dubbed</span>
          </Link>
          <Link
            href="/admin/videos/bulk-moviebox"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-white/5 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 text-purple-500" /> <span className="hidden sm:inline">MovieBox</span>
          </Link>
          <Link
            href="/admin/videos/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Video</span>
          </Link>
        </div>
      </div>
      <VideoList videos={videos} />
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  type: string;
  createdAt: Date;
}

export function VideoList({ videos }: { videos: Video[] }) {
  const router = useRouter();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Video deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (videos.length === 0) {
    return (
      <div className="bg-surface-800 rounded-xl border border-white/10 p-12 text-center text-gray-400">
        No videos yet. Add your first video.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {videos.map((v) => (
        <div
          key={v.id}
          className="flex items-center gap-4 bg-surface-800 rounded-xl border border-white/10 p-4"
        >
          <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-surface-700 min-w-[6rem] min-h-[3.5rem]">
            <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover" sizes="96px" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{v.title}</h3>
            <p className="text-sm text-gray-400 capitalize">{v.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/videos/${v.id}`}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              aria-label="Edit"
            >
              <Pencil className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(v.id, v.title)}
              className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

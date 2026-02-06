'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, List, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  type: string;
  createdAt: Date;
  parentId?: string | null;
}

export function VideoList({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [parentSeriesId, setParentSeriesId] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [loading, setLoading] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMakeList = async () => {
    if (!parentSeriesId || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: parentSeriesId,
          episodeIds: selectedIds,
          seasonNumber
        })
      });

      if (!res.ok) throw new Error('Failed to update series');

      toast.success(`Succesfully added ${selectedIds.length} episodes`);
      setSelectedIds([]);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
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
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-10 bg-blue-600 p-4 rounded-xl flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 text-white">
            <span className="font-bold">{selectedIds.length} Selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-white/70 hover:text-white"
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <List className="w-4 h-4" /> Make List (Group as Episodes)
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {videos.map((v) => (
          <div
            key={v.id}
            className={clsx(
              "flex items-center gap-4 bg-surface-800 rounded-xl border border-white/10 p-4 transition-all group",
              selectedIds.includes(v.id) ? "ring-2 ring-blue-500 border-transparent bg-blue-500/5" : "hover:border-white/20"
            )}
          >
            <div className="relative group cursor-pointer" onClick={() => toggleSelect(v.id)}>
              <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-surface-700 min-w-[6rem] min-h-[3.5rem]">
                <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover" sizes="96px" />
                <div className={clsx(
                  "absolute inset-0 flex items-center justify-center transition-opacity",
                  selectedIds.includes(v.id) ? "bg-blue-500/60 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"
                )}>
                  <Check className="text-white w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{v.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="capitalize">{v.type}</span>
                {v.parentId && (
                  <>
                    <span>•</span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <List className="w-3 h-3" /> Part of Series
                    </span>
                  </>
                )}
              </div>
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

      {/* Make List Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <List className="text-blue-500" /> Create Episode List
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                <X />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-400 text-sm">
                Select the main project (Drama/Series) and add these {selectedIds.length} videos as episodes.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Parent Series</label>
                  <select
                    value={parentSeriesId}
                    onChange={(e) => setParentSeriesId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">-- Select Series --</option>
                    {videos.filter(v => (v.type === 'series' || v.type === 'drama' || v.type === 'anime') && !selectedIds.includes(v.id)).map(v => (
                      <option key={v.id} value={v.id} className="bg-zinc-900">{v.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Season Number</label>
                  <input
                    type="number"
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeList}
                  disabled={loading || !parentSeriesId}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                  Confirm & List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

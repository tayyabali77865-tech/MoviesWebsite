'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { UploadField } from '@/components/UploadField';

const MAX_SLIDES = 10;

interface Slide {
  id: string;
  imageUrl: string;
  title: string | null;
  order: number;
}

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ imageUrl: '', title: '' });
  const [editForm, setEditForm] = useState({ imageUrl: '', title: '' });

  const fetchSlides = async () => {
    const res = await fetch('/api/carousel');
    const data = await res.json();
    setSlides(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchSlides().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.imageUrl.trim()) {
      toast.error('Image URL required');
      return;
    }
    if (slides.length >= MAX_SLIDES) {
      toast.error(`Maximum ${MAX_SLIDES} carousel images`);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: addForm.imageUrl.trim(), title: addForm.title.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      toast.success('Slide added');
      setAddForm({ imageUrl: '', title: '' });
      await fetchSlides();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.imageUrl.trim()) {
      toast.error('Image URL required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/carousel/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: editForm.imageUrl.trim(), title: editForm.title.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Slide updated');
      setEditingId(null);
      await fetchSlides();
    } catch {
      toast.error('Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this carousel image?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/carousel/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Slide removed');
      setEditingId(null);
      await fetchSlides();
    } catch {
      toast.error('Failed to remove');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (s: Slide) => {
    setEditingId(s.id);
    setEditForm({ imageUrl: s.imageUrl, title: s.title || '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Carousel</h1>
      <p className="text-gray-400 mb-8">
        Add, remove, or replace homepage carousel images (max {MAX_SLIDES}).
      </p>

      {slides.length < MAX_SLIDES && (
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-surface-800 rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add slide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Image URL *</label>
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="url"
                  value={addForm.imageUrl}
                  onChange={(e) => setAddForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] bg-surface-700 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <UploadField type="image" onUrl={(url) => setAddForm((f) => ({ ...f, imageUrl: url }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title (optional)</label>
              <input
                type="text"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Slide title"
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((s) => (
          <div
            key={s.id}
            className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="relative aspect-video bg-surface-700">
              <Image
                src={s.imageUrl}
                alt={s.title || 'Slide'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="url"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="Image URL"
                      className="flex-1 min-w-0 bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <UploadField type="image" onUrl={(url) => setEditForm((f) => ({ ...f, imageUrl: url }))} />
                  </div>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Title"
                    className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(s.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-white truncate mb-3">{s.title || 'Untitled'}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      aria-label="Replace"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {slides.length === 0 && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-12 text-center text-gray-400">
          No carousel images. Add one above.
        </div>
      )}
    </div>
  );
}

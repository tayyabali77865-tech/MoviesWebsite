'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { UploadField } from '@/components/UploadField';

const TYPES = ['movie', 'anime', 'manga', 'trailer'];
const SECTIONS = ['new', 'trending', 'upcoming', 'random'];

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  tmdbId: string | null;
  malId: string | null;
  anilistId: string | null;
  type: string;
  section: string;
  url360: string | null;
  url480: string | null;
  url720: string | null;
  url1080: string | null;
  defaultSpeed: number;
  autoplay: boolean;
  subtitles: { id: string; language: string; url: string }[];
}

export default function EditVideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    tmdbId: '',
    malId: '',
    anilistId: '',
    type: 'movie',
    section: 'new',
    url360: '',
    url480: '',
    url720: '',
    url1080: '',
    defaultSpeed: 1,
    autoplay: false,
    subtitles: [] as { language: string; url: string }[],
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/videos/${id}`)
      .then((res) => res.json())
      .then((v: Video) => {
        setForm({
          title: v.title,
          description: v.description || '',
          thumbnailUrl: v.thumbnailUrl,
          tmdbId: v.tmdbId || '',
          malId: v.malId || '',
          anilistId: v.anilistId || '',
          type: v.type || 'movie',
          section: v.section || 'new',
          url360: v.url360 || '',
          url480: v.url480 || '',
          url720: v.url720 || '',
          url1080: v.url1080 || '',
          defaultSpeed: v.defaultSpeed,
          autoplay: v.autoplay,
          subtitles: v.subtitles.map((s) => ({ language: s.language, url: s.url })),
        });
      })
      .catch(() => router.replace('/admin/videos'))
      .finally(() => setFetching(false));
  }, [id, router]);

  const addSubtitle = () => {
    setForm((f) => ({ ...f, subtitles: [...f.subtitles, { language: '', url: '' }] }));
  };

  const updateSubtitle = (i: number, field: 'language' | 'url', value: string) => {
    setForm((f) => ({
      ...f,
      subtitles: f.subtitles.map((s, j) => (j === i ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSubtitle = (i: number) => {
    setForm((f) => ({ ...f, subtitles: f.subtitles.filter((_, j) => j !== i) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.thumbnailUrl.trim()) {
      toast.error('Title and thumbnail URL required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          thumbnailUrl: form.thumbnailUrl.trim(),
          tmdbId: form.tmdbId || undefined,
          malId: form.malId || undefined,
          anilistId: form.anilistId || undefined,
          type: form.type,
          section: form.section,
          url360: form.url360.trim() || undefined,
          url480: form.url480.trim() || undefined,
          url720: form.url720.trim() || undefined,
          url1080: form.url1080.trim() || undefined,
          defaultSpeed: form.defaultSpeed,
          autoplay: form.autoplay,
          subtitles: form.subtitles.filter((s) => s.language && s.url).map((s) => ({ language: s.language, url: s.url })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      toast.success('Video updated');
      router.push('/admin/videos');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/videos"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to videos
      </Link>
      <h1 className="text-3xl font-bold text-white mb-8">Edit video</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">TMDB ID</label>
            <input
              type="text"
              value={form.tmdbId}
              onChange={(e) => setForm((f) => ({ ...f, tmdbId: e.target.value }))}
              placeholder="e.g. 123456"
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">MAL ID</label>
            <input
              type="text"
              value={form.malId}
              onChange={(e) => setForm((f) => ({ ...f, malId: e.target.value }))}
              placeholder="e.g. 5114"
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">AniList ID</label>
            <input
              type="text"
              value={form.anilistId}
              onChange={(e) => setForm((f) => ({ ...f, anilistId: e.target.value }))}
              placeholder="e.g. 11061"
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thumbnail URL *</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              className="flex-1 min-w-[200px] bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <UploadField type="image" onUrl={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Section</label>
          <select
            value={form.section}
            onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
            className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(['360', '480', '720', '1080'] as const).map((res) => (
            <div key={res}>
              <label className="block text-sm text-gray-400 mb-1">{res}p URL</label>
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="url"
                  value={form[`url${res}` as 'url360' | 'url480' | 'url720' | 'url1080']}
                  onChange={(e) => setForm((f) => ({ ...f, [`url${res}`]: e.target.value }))}
                  className="flex-1 min-w-0 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <UploadField
                  type="video"
                  onUrl={(url) => setForm((f) => ({ ...f, [`url${res}`]: url }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default speed</label>
            <select
              value={form.defaultSpeed}
              onChange={(e) => setForm((f) => ({ ...f, defaultSpeed: parseFloat(e.target.value) }))}
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoplay}
                onChange={(e) => setForm((f) => ({ ...f, autoplay: e.target.checked }))}
                className="rounded border-white/20 bg-surface-800 text-red-500 focus:ring-red-500"
              />
              <span className="text-gray-300">Autoplay</span>
            </label>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-400">Subtitles</label>
            <button type="button" onClick={addSubtitle} className="text-sm text-red-500 hover:underline">
              + Add subtitle
            </button>
          </div>
          {form.subtitles.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Language"
                value={s.language}
                onChange={(e) => updateSubtitle(i, 'language', e.target.value)}
                className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="url"
                placeholder="VTT URL"
                value={s.url}
                onChange={(e) => updateSubtitle(i, 'url', e.target.value)}
                className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
              <button type="button" onClick={() => removeSubtitle(i)} className="px-3 text-red-400 hover:bg-red-500/20 rounded-lg">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Save changes
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { UploadField } from '@/components/UploadField';

const TYPES = ['movie', 'anime', 'manga', 'trailer'];
const SECTIONS = ['new', 'trending', 'upcoming', 'random'];

export default function NewVideoPage() {
  const router = useRouter();
  const [searchSource, setSearchSource] = useState<'tmdb' | 'rapidapi' | 'bollywood'>('tmdb');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
    hlsUrl: '',
    defaultSpeed: 1,
    autoplay: false,
    subtitles: [] as { language: string; url: string }[],
    audioTracks: [] as { language: string; url: string }[],
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]); // Clear previous results
    try {
      if (searchSource === 'tmdb') {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'TMDB Search Failed');
        if (data.results) {
          setSearchResults(data.results.map((m: any) => ({
            ...m,
            source: 'tmdb',
            uniqueId: m.id
          })));
        }
      } else if (searchSource === 'bollywood') {
        const res = await fetch(`/api/admin/bollywood/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Bollywood Search Failed');
        if (data.results) {
          setSearchResults(data.results.map((m: any) => ({
            ...m,
            source: 'tmdb', // Use tmdb logic for results
            uniqueId: m.id
          })));
        }
      } else {
        const res = await fetch(`/api/rapidapi/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'RapidAPI Search Failed');

        const results = data.results || [];
        if (results.length === 0) {
          toast('No results found', { icon: 'ℹ️' });
        }

        setSearchResults(results.map((m: any) => ({
          title: m.titleText?.text || 'Unknown Title',
          description: m.plot?.plotText?.plainText || '',
          poster_path: m.primaryImage?.url || null,
          id: m.id,
          uniqueId: m.id,
          release_date: m.releaseDate ? `${m.releaseDate.year}-${m.releaseDate.month || '01'}-${m.releaseDate.day || '01'}` : null,
          source: 'rapidapi'
        })));
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : `Failed to search ${searchSource === 'tmdb' ? 'TMDB' : 'RapidAPI'}`);
    } finally {
      setSearching(false);
    }
  };

  const selectMovie = (movie: any) => {
    setForm(f => ({
      ...f,
      title: movie.title,
      description: movie.description || movie.overview, // RapidAPI uses description (normalized), TMDB uses overview
      thumbnailUrl: movie.source === 'tmdb'
        ? (movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : f.thumbnailUrl)
        : (movie.poster_path || f.thumbnailUrl),
      tmdbId: movie.source === 'tmdb' ? movie.id.toString() : f.tmdbId, // Only set TMDB ID if source is TMDB
      type: 'movie',
      section: 'new'
    }));
    setSearchResults([]);
    setSearchQuery('');
    toast.success('Movie details applied');
  };

  const addSubtitle = () => {
    setForm((f) => ({
      ...f,
      subtitles: [...f.subtitles, { language: '', url: '' }],
    }));
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

  const addAudioTrack = () => {
    setForm((f) => ({
      ...f,
      audioTracks: [...f.audioTracks, { language: '', url: '' }],
    }));
  };

  const updateAudioTrack = (i: number, field: 'language' | 'url', value: string) => {
    setForm((f) => ({
      ...f,
      audioTracks: f.audioTracks.map((a, j) => (j === i ? { ...a, [field]: value } : a)),
    }));
  };

  const removeAudioTrack = (i: number) => {
    setForm((f) => ({ ...f, audioTracks: f.audioTracks.filter((_, j) => j !== i) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.thumbnailUrl.trim()) {
      toast.error('Title and thumbnail URL required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
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
          hlsUrl: form.hlsUrl.trim() || undefined,
          defaultSpeed: form.defaultSpeed,
          autoplay: form.autoplay,
          subtitles: form.subtitles.filter((s) => s.language && s.url).map((s) => ({ language: s.language, url: s.url })),
          audioTracks: form.audioTracks.filter((a) => a.language && a.url).map((a) => ({ language: a.language, url: a.url })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      toast.success('Video added');
      router.push('/admin/videos');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/videos"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to videos
      </Link>
      <h1 className="text-3xl font-bold text-white mb-8">Add video</h1>

      {/* Search Section */}
      <div className="mb-8 p-6 bg-surface-800/50 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-red-500" />
            Auto-fill from {searchSource === 'tmdb' ? 'TMDB' : 'RapidAPI'}
          </h2>
          <div className="flex bg-surface-900 rounded-lg p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSearchSource('tmdb');
                setSearchResults([]);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${searchSource === 'tmdb' ? 'bg-surface-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
            >
              TMDB
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchSource('bollywood');
                setSearchResults([]);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${searchSource === 'bollywood' ? 'bg-surface-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
            >
              Bollywood
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchSource('rapidapi');
                setSearchResults([]);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${searchSource === 'rapidapi' ? 'bg-surface-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
            >
              RapidAPI
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={searchSource === 'tmdb' ? "Search TMDB..." : "Search MoviesDatabase..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {searchResults.map((movie) => (
              <button
                key={movie.uniqueId}
                onClick={() => selectMovie(movie)}
                className="text-left bg-surface-900 hover:bg-surface-800 border border-white/10 p-2 rounded-lg transition-colors group"
              >
                <div className="aspect-[2/3] relative mb-2 rounded overflow-hidden">
                  {movie.poster_path ? (
                    <img
                      src={movie.source === 'tmdb' ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : movie.poster_path}
                      alt={movie.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                  )}
                </div>
                <div className="font-medium text-white text-sm truncate">{movie.title}</div>
                <div className="text-xs text-gray-500">{movie.release_date?.split('-')[0]}</div>
              </button>
            ))}
          </div>
        )}
      </div>
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
            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
              AniList ID
              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">Required for Hindi Dub</span>
            </label>
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
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">HLS Stream URL (M3U8)</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="url"
              value={form.hlsUrl}
              onChange={(e) => setForm((f) => ({ ...f, hlsUrl: e.target.value }))}
              className="flex-1 min-w-0 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Highly recommended for optimization"
            />
            <UploadField
              type="video"
              onUrl={(url) => setForm((f) => ({ ...f, hlsUrl: url }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
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

        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm text-gray-400">Audio Tracks (Multi-Language)</label>
            <button
              type="button"
              onClick={addAudioTrack}
              className="text-sm text-red-500 hover:underline"
            >
              + Add audio track
            </button>
          </div>
          {form.audioTracks.map((a, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Language (e.g. Hindi)"
                value={a.language}
                onChange={(e) => updateAudioTrack(i, 'language', e.target.value)}
                className="w-1/3 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
              />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Audio URL"
                    value={a.url}
                    onChange={(e) => updateAudioTrack(i, 'url', e.target.value)}
                    className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <UploadField
                    type="video"
                    onUrl={(url) => updateAudioTrack(i, 'url', url)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAudioTrack(i)}
                className="mt-3 px-3 text-red-400 hover:bg-red-500/20 rounded-lg text-sm h-10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm text-gray-400">Subtitles</label>
            <button
              type="button"
              onClick={addSubtitle}
              className="text-sm text-red-500 hover:underline"
            >
              + Add subtitle
            </button>
          </div>
          {form.subtitles.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Language (e.g. English)"
                value={s.language}
                onChange={(e) => updateSubtitle(i, 'language', e.target.value)}
                className="w-1/3 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
              />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="VTT URL"
                    value={s.url}
                    onChange={(e) => updateSubtitle(i, 'url', e.target.value)}
                    className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <UploadField
                    type="image"
                    onUrl={(url) => updateSubtitle(i, 'url', url)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSubtitle(i)}
                className="mt-3 px-3 text-red-400 hover:bg-red-500/20 rounded-lg text-sm h-10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-6 border-t border-white/5 pt-6">
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
          <div className="flex items-end mb-3">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Adding video...' : 'Add video'}
        </button>
      </form>
    </div>
  );
}

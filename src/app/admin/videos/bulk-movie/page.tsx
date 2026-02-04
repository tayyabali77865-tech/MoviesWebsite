'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Search, Plus, Loader2, Check, Film, Tv, Settings, Languages, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface TMDBResult {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    overview: string;
    media_type: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
}

export default function BulkMovieImport() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'movie' | 'tv' | 'multi'>('multi');
    const [targetType, setTargetType] = useState<'movie' | 'series' | 'drama' | 'anime'>('movie');
    const [targetSection, setTargetSection] = useState<'new' | 'trending' | 'upcoming' | 'random'>('new');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<TMDBResult[]>([]);
    const [selected, setSelected] = useState<TMDBResult[]>([]);
    const [loading, setLoading] = useState(false);

    const [commonHlsUrl, setCommonHlsUrl] = useState('');
    const [commonAudioTracks, setCommonAudioTracks] = useState<{ language: string; url: string }[]>([]);

    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=${searchType}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            setResults(data.results || []);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelect = (movie: TMDBResult) => {
        setSelected(prev =>
            prev.find(m => m.id === movie.id)
                ? prev.filter(m => m.id !== movie.id)
                : [...prev, movie]
        );
    };

    const handleImport = async () => {
        if (selected.length === 0) return;
        setLoading(true);
        try {
            const videos = selected.map(m => ({
                title: m.title || m.name || 'Unknown',
                description: m.overview,
                thumbnailUrl: m.poster_path ? `https://image.tmdb.org/t/p/w780${m.poster_path}` : '',
                tmdbId: m.id.toString(),
                type: targetType === 'movie' && (m.media_type === 'tv' || searchType === 'tv') ? 'series' : targetType,
                section: targetSection,
                hlsUrl: commonHlsUrl.trim() || undefined,
                audioTracks: commonAudioTracks.filter(a => a.language && a.url),
            }));

            const res = await fetch('/api/admin/videos/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Import failed');
            }

            toast.success(`Successfully imported ${selected.length} videos`);
            router.push('/admin/videos');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setLoading(false);
        }
    };

    const addAudioTrack = () => setCommonAudioTracks([...commonAudioTracks, { language: '', url: '' }]);
    const updateAudioTrack = (index: number, field: 'language' | 'url', value: string) => {
        const newTracks = [...commonAudioTracks];
        newTracks[index] = { ...newTracks[index], [field]: value };
        setCommonAudioTracks(newTracks);
    };
    const removeAudioTrack = (index: number) => setCommonAudioTracks(commonAudioTracks.filter((_, i) => i !== index));

    return (
        <>
            <Sidebar />
            <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Film className="text-red-500" /> Bulk Movie Import
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm">Search TMDB and import multiple movies or TV shows at once.</p>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={loading || selected.length === 0}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Import {selected.length} Selected
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Search & Results */}
                        <div className="lg:col-span-2 space-y-6">
                            <form onSubmit={handleSearch} className="flex gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search movies or TV shows..."
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                                    />
                                </div>
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as any)}
                                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                >
                                    <option value="multi" className="bg-zinc-900">All</option>
                                    <option value="movie" className="bg-zinc-900">Movies</option>
                                    <option value="tv" className="bg-zinc-900">TV Shows</option>
                                </select>
                                <button type="submit" className="hidden">Search</button>
                            </form>

                            {searching ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
                                    <p className="text-gray-400 font-medium">Querying TMDB database...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {results.map((res) => {
                                        const isSelected = selected.find(m => m.id === res.id);
                                        const title = res.title || res.name;
                                        const date = res.release_date || res.first_air_date;
                                        const year = date ? date.split('-')[0] : 'N/A';

                                        return (
                                            <div
                                                key={res.id}
                                                onClick={() => toggleSelect(res)}
                                                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95 ${isSelected ? 'border-red-500 ring-4 ring-red-500/20' : 'border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="aspect-[2/3] relative">
                                                    {res.poster_path ? (
                                                        <img src={`https://image.tmdb.org/t/p/w342${res.poster_path}`} alt={title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                            <Film className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded uppercase text-gray-300">
                                                                {res.media_type || (searchType === 'multi' ? '???' : searchType)}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-gray-400">{year}</span>
                                                        </div>
                                                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{title}</h3>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in-50">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-gray-400 font-medium">Start searching to find movies and shows.</p>
                                </div>
                            )}
                        </div>

                        {/* Configuration */}
                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-red-500" />
                                    Common Settings
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Import As Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'Movie', value: 'movie' },
                                                { label: 'Web Series', value: 'series' },
                                                { label: 'Drama', value: 'drama' },
                                                { label: 'Anime', value: 'anime' }
                                            ].map(t => (
                                                <button
                                                    key={t.value}
                                                    onClick={() => setTargetType(t.value as any)}
                                                    className={clsx(
                                                        "py-2 px-3 border rounded-lg text-xs font-medium transition-all capitalize",
                                                        targetType === t.value
                                                            ? "bg-red-600 border-red-500 text-white"
                                                            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Section</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['new', 'trending', 'upcoming', 'random'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setTargetSection(s as any)}
                                                    className={clsx(
                                                        "py-2 px-3 border rounded-lg text-xs font-medium transition-all capitalize",
                                                        targetSection === s
                                                            ? "bg-red-600 border-red-500 text-white"
                                                            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">HLS URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={commonHlsUrl}
                                            onChange={(e) => setCommonHlsUrl(e.target.value)}
                                            placeholder="m3u8 URL to apply to all selected"
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">If left blank, the player will use external embed servers (VidSrc, etc.) automatically based on TMDB ID.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shared Audio Tracks</label>
                                            <button
                                                type="button"
                                                onClick={addAudioTrack}
                                                className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded-md hover:bg-red-500/20 transition-all font-bold flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add Track
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {commonAudioTracks.map((track, idx) => (
                                                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2 relative group-item">
                                                    <div className="flex items-center gap-2">
                                                        <Languages className="w-4 h-4 text-gray-500" />
                                                        <input
                                                            type="text"
                                                            value={track.language}
                                                            onChange={(e) => updateAudioTrack(idx, 'language', e.target.value)}
                                                            placeholder="Language (e.g. Hindi)"
                                                            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removeAudioTrack(idx)}
                                                            className="text-gray-600 hover:text-red-500 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4 rotate-45" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={track.url}
                                                        onChange={(e) => updateAudioTrack(idx, 'url', e.target.value)}
                                                        placeholder="Audio URL (.mp3)"
                                                        className="w-full bg-transparent text-[10px] text-gray-400 focus:outline-none border-t border-white/5 pt-2"
                                                    />
                                                </div>
                                            ))}
                                            {commonAudioTracks.length === 0 && (
                                                <p className="text-[10px] text-zinc-600 italic">No shared audio tracks defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm text-gray-400 font-medium">Selected:</span>
                                            <span className="text-xl font-bold text-white">{selected.length}</span>
                                        </div>
                                        <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                            <div className="flex items-center gap-3 text-red-500 mb-2">
                                                <Check className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Auto-Linking</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">Selected titles will be automatically linked to the 5+ embed servers provided in the player.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

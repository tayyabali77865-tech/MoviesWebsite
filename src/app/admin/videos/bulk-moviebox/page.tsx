'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Search, Plus, Loader2, Check, Film, Settings, Languages, Music, Tv } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface MovieBoxResult {
    id: string;
    title: string;
    poster_path: string | null;
    overview: string;
    type: string;
    release_year?: string;
}

export default function BulkMovieBoxImport() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('movie'); // movie, tv, anime, manga, documentry
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<MovieBoxResult[]>([]);
    const [selected, setSelected] = useState<MovieBoxResult[]>([]);
    const [loading, setLoading] = useState(false);

    const [commonHlsUrl, setCommonHlsUrl] = useState('');
    const [targetSection, setTargetSection] = useState('new');
    const [commonAudioTracks, setCommonAudioTracks] = useState<{ language: string; url: string }[]>([]);

    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            // Updated Endpoint: internally uses MovieBox now
            const res = await fetch(`/api/admin/moviebox/search?query=${encodeURIComponent(query)}&type=${searchType}`);
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

    const toggleSelect = (item: MovieBoxResult) => {
        setSelected(prev =>
            prev.find(m => m.id === item.id)
                ? prev.filter(m => m.id !== item.id)
                : [...prev, item]
        );
    };

    const handleImport = async () => {
        if (selected.length === 0) return;
        setLoading(true);
        try {
            const videos = selected.map(m => ({
                title: m.title || 'Unknown',
                description: m.overview,
                thumbnailUrl: m.poster_path || '',
                netflixId: m.id, // Storing MovieBox ID in netflixId field for now
                type: m.type === 'series' || m.type === 'tv' ? 'series' :
                    m.type === 'anime' ? 'anime' :
                        m.type === 'drama' ? 'drama' : 'movie', // Default to movie, but respect API return
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

            toast.success(`Successfully imported ${selected.length} titles`);
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
                                <Tv className="text-red-600" /> MovieBox Import
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm">Search and import movies from MovieBox API.</p>
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
                            <form onSubmit={handleSearch} className="space-y-4">
                                {/* Category Tabs */}
                                <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                                    {['movie', 'tv', 'anime', 'manga', 'documentary'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setSearchType(t)}
                                            className={clsx(
                                                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                                searchType === t
                                                    ? "bg-red-600 text-white shadow-lg"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {t === 'tv' ? 'Series' : t}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder={`Search ${searchType}... (e.g. Avengers, One Piece)`}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                                        />
                                    </div>
                                    <button type="submit" className="hidden">Search</button>
                                </div>
                            </form>

                            {searching ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                                    <p className="text-gray-400 font-medium">Querying MovieBox database...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {results.map((res) => {
                                        const isSelected = selected.find(m => m.id === res.id);
                                        const year = res.release_year || 'N/A';

                                        return (
                                            <div
                                                key={res.id}
                                                onClick={() => toggleSelect(res)}
                                                className={clsx(
                                                    "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95",
                                                    isSelected ? "border-red-600 ring-4 ring-red-600/20" : "border-white/10 hover:border-white/30"
                                                )}
                                            >
                                                <div className="aspect-[2/3] relative">
                                                    {res.poster_path ? (
                                                        <img src={res.poster_path} alt={res.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                            <Tv className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded uppercase text-gray-300">
                                                                MOVIEBOX
                                                            </span>
                                                            <span className="text-[10px] font-medium text-gray-400">{year}</span>
                                                        </div>
                                                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{res.title}</h3>
                                                        <span className="text-[10px] text-gray-400 uppercase mt-1">{res.type}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in-50">
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
                                    <p className="text-gray-400 font-medium">Start searching to find movies.</p>
                                </div>
                            )}
                        </div>

                        {/* Configuration */}
                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-red-600" />
                                    Common Settings
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Section</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['new', 'trending', 'upcoming', 'random'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setTargetSection(s)}
                                                    className={clsx(
                                                        "py-2 px-3 border rounded-lg text-xs font-medium capitalize transition-all",
                                                        targetSection === s
                                                            ? "bg-red-600/10 border-red-600 text-red-600"
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
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">If left blank, the player will use external embed servers based on TMDB/Netflix data.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shared Audio Tracks</label>
                                            <button
                                                type="button"
                                                onClick={addAudioTrack}
                                                className="text-[10px] bg-red-600/10 text-red-600 px-2 py-1 rounded-md hover:bg-red-600/20 transition-all font-bold flex items-center gap-1"
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

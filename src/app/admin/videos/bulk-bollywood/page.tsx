'use client';

import { useState } from 'react';
import { Search, Plus, Loader2, Check, Film, Settings, Languages, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface BollywoodResult {
    id: number;
    title: string;
    poster_path: string | null;
    overview: string;
    release_date?: string;
}

export default function BulkBollywoodImport() {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<BollywoodResult[]>([]);
    const [selected, setSelected] = useState<BollywoodResult[]>([]);
    const [loading, setLoading] = useState(false);

    const [commonHlsUrl, setCommonHlsUrl] = useState('');
    const [commonAudioTracks, setCommonAudioTracks] = useState<{ language: string; url: string }[]>([
        { language: 'Hindi', url: '' }
    ]);

    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`/api/admin/bollywood/search?query=${encodeURIComponent(query)}`);
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

    const toggleSelect = (movie: BollywoodResult) => {
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
                title: m.title || 'Unknown',
                description: m.overview,
                thumbnailUrl: m.poster_path ? `https://image.tmdb.org/t/p/w780${m.poster_path}` : '',
                tmdbId: m.id.toString(),
                type: 'movie',
                section: 'new',
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

            toast.success(`Successfully imported ${selected.length} Bollywood movies`);
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
        <div className="space-y-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Film className="text-orange-500" /> Bulk Bollywood Import
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">Search and import Bollywood movies from TMDB (Hindi Filtered).</p>
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={loading || selected.length === 0}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20"
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
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search Bollywood movies (e.g. Pathaan, Jawan)..."
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>
                            <button type="submit" className="hidden">Search</button>
                        </form>

                        {searching ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                                <p className="text-gray-400 font-medium">Querying Bollywood database...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {results.map((res) => {
                                    const isSelected = selected.find(m => m.id === res.id);
                                    const year = res.release_date ? res.release_date.split('-')[0] : 'N/A';

                                    return (
                                        <div
                                            key={res.id}
                                            onClick={() => toggleSelect(res)}
                                            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95 ${isSelected ? 'border-orange-500 ring-4 ring-orange-500/20' : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="aspect-[2/3] relative">
                                                {res.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w342${res.poster_path}`} alt={res.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                        <Film className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded uppercase text-gray-300">
                                                            BOLLYWOOD
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400">{year}</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{res.title}</h3>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in-50">
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
                                <p className="text-gray-400 font-medium">Start searching to find Bollywood movies.</p>
                            </div>
                        )}
                    </div>

                    {/* Configuration */}
                    <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-orange-500" />
                                Common Settings
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Section</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['new', 'trending', 'upcoming', 'random'].map(s => (
                                            <button key={s} className="py-2 px-3 bg-white/5 border border-white/5 rounded-lg text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white capitalize transition-all">
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
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">If left blank, the player will use external embed servers (VidSrc, etc.) automatically based on TMDB ID.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shared Audio Tracks</label>
                                        <button
                                            type="button"
                                            onClick={addAudioTrack}
                                            className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all font-bold flex items-center gap-1"
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
                                                        className="text-gray-600 hover:text-orange-500 transition-colors"
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
                                    <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10">
                                        <div className="flex items-center gap-3 text-orange-500 mb-2">
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
        </div>
    );
}

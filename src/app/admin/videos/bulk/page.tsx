'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Search, Plus, Loader2, Check, ExternalLink, Music, Languages, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnimeResult {
    id: string; // MAL ID
    name: string;
    image: string;
    description?: string;
}

export default function BulkAnimeImport() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<AnimeResult[]>([]);
    const [selected, setSelected] = useState<AnimeResult[]>([]);
    const [audioTracks, setAudioTracks] = useState<{ language: string; url: string }[]>([]);
    const [hlsUrl, setHlsUrl] = useState('');
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`/api/admin/anime/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.error) {
                alert(`Search Error: ${data.error}`);
                return;
            }

            let finalResults = [];
            if (Array.isArray(data)) {
                finalResults = data;
            } else if (data.data && Array.isArray(data.data)) {
                finalResults = data.data;
            } else if (data.results && Array.isArray(data.results)) {
                finalResults = data.results;
            }

            // Map common API fields to our internal format
            const mapped = finalResults.map((item: any) => ({
                id: item.id || item.mal_id?.toString() || '',
                name: item.title || item.name || item.title_english || item.name || 'Unknown Title',
                image: item.thumbnail || item.image || item.thumb || item.image_url || item.image || '/placeholder.png',
                description: item.body || item.description || item.synopsis || item.description || '',
            }));

            setResults(mapped);
        } catch (error) {
            console.error('Search error:', error);
            alert('An error occurred while searching. Please check your connection and try again.');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelect = (anime: AnimeResult) => {
        setSelected(prev =>
            prev.find(a => a.name === anime.name)
                ? prev.filter(a => a.name !== anime.name)
                : [...prev, anime]
        );
    };

    const handleBulkImport = async () => {
        if (selected.length === 0) return;
        setLoading(true);
        try {
            const videos = selected.map(anime => ({
                title: anime.name,
                description: anime.description,
                thumbnailUrl: anime.image,
                malId: anime.id,
                type: 'anime',
                section: 'new',
                hlsUrl: hlsUrl.trim() || null,
                audioTracks: audioTracks.filter(a => a.language && a.url),
            }));

            const res = await fetch('/api/admin/videos/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos }),
            });

            if (res.ok) {
                router.push('/admin/videos');
            } else {
                const data = await res.json();
                alert(`Bulk import failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Import error');
        } finally {
            setLoading(false);
        }
    };

    const addAudioTrack = () => setAudioTracks([...audioTracks, { language: '', url: '' }]);
    const updateAudioTrack = (index: number, field: 'language' | 'url', value: string) => {
        const newTracks = [...audioTracks];
        newTracks[index][field] = value;
        setAudioTracks(newTracks);
    };

    return (
        <>
            <Navbar />
            <Sidebar />
            <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Bulk Anime Import</h1>
                            <p className="text-gray-400 mt-1">Search and import multiple anime series at once.</p>
                        </div>
                        <button
                            onClick={handleBulkImport}
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
                            <form onSubmit={handleSearch} className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search anime (e.g., One Piece, Naruto)..."
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                                />
                                <button type="submit" className="hidden">Search</button>
                            </form>

                            {searching ? (
                                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                    <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
                                    <p className="text-gray-400">Searching anime databases...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {results.map((anime, idx) => {
                                        const isSelected = selected.find(a => a.name === anime.name);
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => toggleSelect(anime)}
                                                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-red-500 ring-4 ring-red-500/20' : 'border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="aspect-[2/3] relative">
                                                    <img src={anime.image} alt={anime.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                                                        <h3 className="text-sm font-bold text-white line-clamp-2">{anime.name}</h3>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">No results found. Try another search.</p>
                                </div>
                            )}
                        </div>

                        {/* Common Configuration */}
                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 sticky top-24">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-red-500" />
                                    Import Settings
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">HLS URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={hlsUrl}
                                            onChange={(e) => setHlsUrl(e.target.value)}
                                            placeholder="m3u8 URL to apply to all"
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">If blank, you'll need to add URLs manually later.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-400">Common Audio Tracks</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const tracks = [
                                                            { language: 'Hindi', url: 'PROMPTED' },
                                                            { language: 'English', url: 'PROMPTED' }
                                                        ];
                                                        setAudioTracks([...audioTracks, ...tracks]);
                                                    }}
                                                    className="text-[10px] bg-blue-600/20 text-blue-500 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors font-bold"
                                                >
                                                    + Dual Audio
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const tracks = [
                                                            { language: 'Hindi', url: 'https://hindiapi.org/audio/dub.mp3' }
                                                        ];
                                                        setAudioTracks([...audioTracks, ...tracks]);
                                                    }}
                                                    className="text-[10px] bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded hover:bg-yellow-600/30 transition-colors font-bold"
                                                >
                                                    + Hindi Dub
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={addAudioTrack}
                                                    className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1"
                                                >
                                                    <Music className="w-3 h-3" /> Add Track
                                                </button>
                                            </div>
                                        </div>

                                        {audioTracks.length === 0 && (
                                            <p className="text-xs text-gray-500 italic">No shared audio tracks added.</p>
                                        )}

                                        {audioTracks.map((track, idx) => (
                                            <div key={idx} className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Languages className="w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={track.language}
                                                        onChange={(e) => updateAudioTrack(idx, 'language', e.target.value)}
                                                        placeholder="e.g. Hindi, English"
                                                        className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={track.url}
                                                    onChange={(e) => updateAudioTrack(idx, 'url', e.target.value)}
                                                    placeholder="Audio URL (.mp3, .m4a)"
                                                    className="w-full bg-transparent text-[10px] text-gray-400 focus:outline-none border-t border-white/5 pt-2"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Queue size:</span>
                                            <span className="text-white font-bold">{selected.length} items</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-4">
                                            <span className="text-gray-400">Category:</span>
                                            <span className="text-red-500 font-bold uppercase tracking-wider text-xs">Anime</span>
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

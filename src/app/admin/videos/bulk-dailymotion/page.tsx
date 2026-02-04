'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Search, Plus, Loader2, Check, Video, Settings, Languages, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface DailymotionVideo {
    id: string; // xid
    title: string;
    thumbnail: string | null;
    created_time?: number;
    duration?: number;
}

export default function BulkDailymotionImport() {
    const [channelName, setChannelName] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<DailymotionVideo[]>([]);
    const [selected, setSelected] = useState<DailymotionVideo[]>([]);
    const [loading, setLoading] = useState(false);

    // Common Settings
    const [targetSection, setTargetSection] = useState('new');
    const [seasonOffset, setSeasonOffset] = useState(1);
    const [episodeOffset, setEpisodeOffset] = useState(1);
    const [isDramaMode, setIsDramaMode] = useState(true); // Default to Drama as per user request
    const [commonAudioTracks, setCommonAudioTracks] = useState<{ language: string; url: string }[]>([]);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const router = useRouter();

    const fetchVideos = async (query: string, pageNum: number) => {
        const res = await fetch(`/api/admin/dailymotion/channel?channel=${encodeURIComponent(query)}&page=${pageNum}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        return data;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;
        setSearching(true);
        setResults([]);
        setPage(1);
        setHasMore(true);
        try {
            const data = await fetchVideos(channelName, 1);
            setResults(data.videos || []);
            setHasMore(data.hasMore);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleLoadMore = async () => {
        if (!hasMore || searching) return;
        const nextPage = page + 1;
        setSearching(true);
        try {
            const data = await fetchVideos(channelName, nextPage);
            setResults(prev => [...prev, ...(data.videos || [])]);
            setPage(nextPage);
            setHasMore(data.hasMore);
        } catch (error) {
            toast.error("Failed to load more videos");
        } finally {
            setSearching(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'channel' | 'video' | 'playlist'>('channel');
    const [videoUrl, setVideoUrl] = useState('');
    const [playlistUrl, setPlaylistUrl] = useState('');

    const handleFetchPlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playlistUrl.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`/api/admin/dailymotion/playlist?url=${encodeURIComponent(playlistUrl)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fetch failed');

            if (data.videos && Array.isArray(data.videos)) {
                const mapped = data.videos.map((v: any) => ({
                    id: v.id,
                    title: v.title,
                    thumbnail: v.thumbnail,
                    duration: v.duration,
                    created_time: Date.now() / 1000
                }));
                setResults(mapped);
                toast.success(`Found ${mapped.length} videos`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Fetch failed');
        } finally {
            setSearching(false);
        }
    };

    const handleFetchVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl.trim()) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`/api/admin/dailymotion/video?url=${encodeURIComponent(videoUrl)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fetch failed');

            if (data.video) {
                setResults([{
                    id: data.video.id,
                    title: data.video.title,
                    thumbnail: data.video.thumbnail,
                    duration: data.video.duration,
                    created_time: Date.now() / 1000 // Mock time or parse if available
                }]);
                // Auto-select it for convenience
                setSelected([{
                    id: data.video.id,
                    title: data.video.title,
                    thumbnail: data.video.thumbnail,
                    duration: data.video.duration
                }]);
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Fetch failed');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelect = (item: DailymotionVideo) => {
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
            // Sort selected videos by creation time (assuming order matters for episodes) or keep selection order?
            // Usually Dailymotion returns newest first, so we might want to reverse if we want ep 1 to be the oldest.
            // For now, let's respect selection order or default list order.

            const videos = selected.map((m, index) => {
                const isDrama = isDramaMode;

                return {
                    title: m.title,
                    description: `Imported from Dailymotion Channel: ${channelName}`,
                    thumbnailUrl: m.thumbnail || '',
                    url720: `https://www.dailymotion.com/video/${m.id}`, // Store as 720p source for now
                    // Logic for Drama: Sequence episodes
                    type: isDrama ? 'series' : 'movie',
                    section: targetSection,
                    season: isDrama ? seasonOffset : undefined,
                    episode: isDrama ? episodeOffset + index : undefined,

                    audioTracks: commonAudioTracks.filter(a => a.language && a.url),
                };
            });

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
                                <Video className="text-blue-500" /> Dailymotion Channel Import
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm">Import videos from Dailymotion channels. Ideal for bulk drama upload.</p>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={loading || selected.length === 0}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Import {selected.length} Selected
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Search & Results */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tabs */}
                            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                                <button
                                    onClick={() => { setActiveTab('channel'); setResults([]); setPage(1); }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        activeTab === 'channel' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Channel Import
                                </button>
                                <button
                                    onClick={() => { setActiveTab('playlist'); setResults([]); }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        activeTab === 'playlist' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Playlist Import
                                </button>
                                <button
                                    onClick={() => { setActiveTab('video'); setResults([]); }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        activeTab === 'video' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Single Video
                                </button>
                            </div>

                            {activeTab === 'channel' ? (
                                <form onSubmit={handleSearch} className="flex gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={channelName}
                                            onChange={(e) => setChannelName(e.target.value)}
                                            placeholder="Enter Channel Name (e.g. kicker-de)..."
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <button type="submit" className="hidden">Search</button>
                                </form>
                            ) : activeTab === 'playlist' ? (
                                <form onSubmit={handleFetchPlaylist} className="flex gap-4">
                                    <div className="relative flex-1 group">
                                        <List className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={playlistUrl}
                                            onChange={(e) => setPlaylistUrl(e.target.value)}
                                            placeholder="Paste Dailymotion Playlist URL..."
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={searching || !playlistUrl}
                                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold transition-all"
                                    >
                                        Import List
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleFetchVideo} className="flex gap-4">
                                    <div className="relative flex-1 group">
                                        <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder="Paste Dailymotion Video URL..."
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={searching || !videoUrl}
                                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold transition-all"
                                    >
                                        Fetch
                                    </button>
                                </form>
                            )}

                            {searching ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                                    <p className="text-gray-400 font-medium">Fetching channel videos...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {results.map((res) => {
                                        const isSelected = selected.find(m => m.id === res.id);
                                        return (
                                            <div
                                                key={res.id}
                                                onClick={() => toggleSelect(res)}
                                                className={clsx(
                                                    "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95",
                                                    isSelected ? "border-blue-600 ring-4 ring-blue-600/20" : "border-white/10 hover:border-white/30"
                                                )}
                                            >
                                                <div className="aspect-video relative">
                                                    {res.thumbnail ? (
                                                        <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                            <Video className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                                                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{res.title}</h3>
                                                        {res.duration && (
                                                            <span className="text-[10px] text-gray-300 mt-1">
                                                                {Math.floor(res.duration / 60)}:{String(res.duration % 60).padStart(2, '0')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in-50">
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
                                    <p className="text-gray-400 font-medium">Enter a channel name to listing videos.</p>
                                </div>
                            )}

                            {/* Load More Button */}
                            {results.length > 0 && hasMore && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={searching}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {searching ? 'Loading...' : 'Load More Videos'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Configuration */}
                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-blue-600" />
                                    Import Settings
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
                                                            ? "bg-blue-600/10 border-blue-600 text-blue-600"
                                                            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isDramaMode}
                                                onChange={(e) => setIsDramaMode(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-600 bg-gray-700"
                                            />
                                            <span className="text-sm font-medium text-white">Import as Drama/Series</span>
                                        </label>
                                    </div>

                                    {isDramaMode && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Season No.</label>
                                                <input
                                                    type="number"
                                                    value={seasonOffset}
                                                    onChange={(e) => setSeasonOffset(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Ep No.</label>
                                                <input
                                                    type="number"
                                                    value={episodeOffset}
                                                    onChange={(e) => setEpisodeOffset(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shared Audio Tracks</label>
                                            <button
                                                type="button"
                                                onClick={addAudioTrack}
                                                className="text-[10px] bg-blue-600/10 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-600/20 transition-all font-bold flex items-center gap-1"
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
                                                            placeholder="Language"
                                                            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removeAudioTrack(idx)}
                                                            className="text-gray-600 hover:text-blue-500 transition-colors"
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

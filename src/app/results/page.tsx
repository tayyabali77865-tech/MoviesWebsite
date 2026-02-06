'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Loader2, Search, Play, Calendar, Tag, Tv, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface VideoResult {
    id: string;
    title: string;
    thumbnailUrl: string;
    description: string | null;
    type: string;
    createdAt: string;
    category?: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>;
    // Split by multiple words to highlight each match
    const words = query.split(/\s+/).filter(w => w.length > 0);
    const pattern = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
        <>
            {parts.map((part, i) =>
                words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
                    <span key={i} className="text-red-500 font-bold">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('type') || 'all';

    const [results, setResults] = useState<VideoResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) return;
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => setResults(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [query]);

    const filteredResults = filter === 'all'
        ? results
        : results.filter(r => (r.type || '').toLowerCase() === filter.toLowerCase());

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p>Please enter a search query</p>
            </div>
        );
    }

    const filters = [
        { label: 'All', value: 'all' },
        { label: 'Movies', value: 'movie' },
        { label: 'Web Series', value: 'series' },
        { label: 'Anime', value: 'anime' },
        { label: 'Dramas', value: 'drama' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            {/* Search Header & Pills */}
            <div className="sticky top-16 z-30 bg-black pt-4 pb-6 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-medium text-gray-400">
                        Results for "<span className="text-white">{query}</span>"
                    </h1>
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-gray-500 font-bold uppercase tracking-wider">
                        {filteredResults.length} FOUND
                    </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('type', f.value);
                                router.push(`/results?${params.toString()}`);
                            }}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border",
                                filter === f.value
                                    ? "bg-white text-black border-white shadow-lg"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
                    <p className="text-sm font-medium animate-pulse">Scanning database...</p>
                </div>
            ) : filteredResults.length > 0 ? (
                <div className="space-y-8 mt-6">
                    {filteredResults.map((video: any) => (
                        <Link
                            key={video.id}
                            href={`/watch/${video.id}`}
                            className="flex flex-col md:flex-row gap-6 group cursor-pointer"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video w-full md:w-[360px] flex-shrink-0 bg-zinc-900 rounded-2xl overflow-hidden ring-1 ring-white/5 shadow-2xl">
                                <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                        <Play className="w-6 h-6 fill-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-tighter border border-white/10">
                                    {video.seasonNumber && video.episodeNumber ? `S${video.seasonNumber}:E${video.episodeNumber}` : video.type}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-3 py-1">
                                <h2 className="text-xl md:text-2xl font-black group-hover:text-red-500 transition-colors line-clamp-2 leading-tight">
                                    <Highlight text={video.title} query={query} />
                                </h2>

                                <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(video.createdAt).getFullYear()}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                    <span className="flex items-center gap-1.5 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">
                                        {video.category || video.type}
                                    </span>
                                    {video.tmdbId && (
                                        <>
                                            <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                            <span className="text-red-500 tracking-tighter underline underline-offset-4 decoration-red-500/30">TMDB SOURCE</span>
                                        </>
                                    )}
                                </div>

                                <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                    {video.description || 'No detailed overview available for this title.'}
                                </p>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full border-2 border-black bg-red-600 flex items-center justify-center text-[10px] font-bold">HD</div>
                                        <div className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">CC</div>
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Available in Full Resolution</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Try different keywords or check your spelling. You can also browse our trending section.
                    </p>
                    <Link
                        href="/"
                        className="inline-block mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                    >
                        Back to Home
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function ResultsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <Sidebar />
            <main className="pt-24 min-h-screen">
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
                    </div>
                }>
                    <ResultsContent />
                </Suspense>
            </main>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Film, Calendar, Star, Loader2, Check, AlertCircle, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface HindiDubbedMovie {
  id: string | number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_year?: string;
  type: string;
  hindiDubbed: boolean;
  tmdbId: string | number;
  popularity: number;
  vote_average: number;
}

interface ImportOptions {
  hindiAudioUrl?: string;
  subtitle?: boolean;
  englishAudio?: boolean;
}

export default function BulkHindiDubbedPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HindiDubbedMovie[]>([]);
  const [selected, setSelected] = useState<HindiDubbedMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    hindiAudioUrl: '',
    subtitle: true,
    englishAudio: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const router = useRouter();

  const searchHindiDubbed = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    try {
      const url = `/api/admin/hindi-dub/search?query=${encodeURIComponent(query)}&type=movie`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Convert poster paths to full URLs for display
      const resultsWithUrls = (data.results || []).map((movie: HindiDubbedMovie) => ({
        ...movie,
        poster_path: movie.poster_path 
          ? (movie.poster_path.startsWith('http') 
              ? movie.poster_path 
              : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
          : null
      }));

      setResults(resultsWithUrls);
      if (resultsWithUrls.length === 0) {
        toast.info('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHindiDubbed();
  };

  const toggleSelect = (movie: HindiDubbedMovie) => {
    setSelected(prev =>
      prev.find(m => m.id === movie.id)
        ? prev.filter(m => m.id !== movie.id)
        : [...prev, movie]
    );
  };

  const handleImport = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one movie');
      return;
    }

    setLoading(true);
    try {
      const videos = selected.map(movie => ({
        title: movie.title,
        description: movie.overview,
        thumbnailUrl: movie.poster_path || '',
        tmdbId: String(movie.tmdbId),
        type: 'movie',
        section: 'hindi-dubbed',
        isHindiDubbed: true,
        audioLanguage: 'hi', // Primary audio is Hindi
        hlsUrl: importOptions.hindiAudioUrl || undefined,
        hindiDubHlsUrl: importOptions.hindiAudioUrl || undefined,
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

      toast.success(`Successfully imported ${selected.length} Hindi dubbed movie(s)`);
      setSelected([]);
      setQuery('');
      setResults([]);
      router.refresh();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const formatYear = (yearStr?: string) => {
    return yearStr || 'N/A';
  };

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Globe className="text-red-600 w-8 h-8" /> Hindi Dubbed Hollywood Movies
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Import and manage Hollywood movies dubbed in Hindi</p>
          </div>
          <button
            onClick={handleImport}
            disabled={loading || selected.length === 0}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Import {selected.length} Selected
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Hollywood movies (e.g., Avengers, Spider-Man)..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold transition-all"
                >
                  {searching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Info Alert */}
              <div className="flex gap-3 p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">💡 How it works:</p>
                  <ul className="text-xs space-y-1 opacity-90">
                    <li>• Search for Hollywood movies available in Hindi</li>
                    <li>• Select movies and provide Hindi dubbed HLS/stream URLs (optional)</li>
                    <li>• Videos are saved with Hindi as primary audio language</li>
                    <li>• Display with "🇮🇳 Hindi Dubbed" badge in frontend</li>
                  </ul>
                </div>
              </div>
            </form>

            {/* Results */}
            {searching ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                <p className="text-gray-400 font-medium">Searching TMDB database...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="text-sm text-gray-400">Found {results.length} result(s)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((movie) => {
                    const isSelected = selected.find(m => m.id === movie.id);
                    const year = formatYear(movie.release_year);

                    return (
                      <div
                        key={movie.id}
                        onClick={() => toggleSelect(movie)}
                        className={clsx(
                          "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95",
                          isSelected ? 'border-red-600 ring-4 ring-red-600/20' : 'border-white/10 hover:border-white/30'
                        )}
                      >
                        <div className="aspect-[2/3] relative">
                          {movie.poster_path ? (
                            <img
                              src={movie.poster_path}
                              alt={movie.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                              <Film className="w-12 h-12" />
                            </div>
                          )}

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold bg-red-600 px-1.5 py-0.5 rounded uppercase text-white">
                                🇮🇳 Hindi
                              </span>
                              <span className="text-[10px] font-medium text-gray-300">{year}</span>
                              {movie.vote_average > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-[10px] font-medium text-yellow-500">
                                    {movie.vote_average.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                              {movie.title}
                            </h3>
                          </div>

                          {/* Selection Checkbox */}
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
              </>
            ) : query && !searching ? (
              <div className="text-center py-16 text-gray-400">
                <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No results found</p>
                <p className="text-sm opacity-75">Try searching for a different movie title</p>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Search for Hollywood movies</p>
                <p className="text-sm opacity-75">Enter a movie title to start importing Hindi dubbed versions</p>
              </div>
            )}
          </div>

          {/* Sidebar - Import Options */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Selected Count */}
              <div className="p-4 bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-600/30 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">Selected Movies</p>
                <p className="text-3xl font-bold text-red-500">{selected.length}</p>
                {selected.length > 0 && (
                  <div className="mt-4 space-y-2 text-xs">
                    {selected.slice(0, 3).map((movie) => (
                      <p key={movie.id} className="text-gray-300 truncate">
                        ✓ {movie.title}
                      </p>
                    ))}
                    {selected.length > 3 && (
                      <p className="text-gray-400">+ {selected.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Import Options
                </h3>

                {/* Hindi Dubbed HLS URL */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                    Hindi HLS URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/hindi-audio.m3u8"
                    value={importOptions.hindiAudioUrl || ''}
                    onChange={(e) =>
                      setImportOptions(prev => ({
                        ...prev,
                        hindiAudioUrl: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Provide separate HLS stream with Hindi audio. Leave empty for now.
                  </p>
                </div>

                {/* Show Advanced Options */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full text-xs font-semibold text-red-500 hover:text-red-400 py-2 transition-colors"
                >
                  {showAdvanced ? '▼' : '▶'} Advanced Options
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importOptions.subtitle}
                        onChange={(e) =>
                          setImportOptions(prev => ({
                            ...prev,
                            subtitle: e.target.checked
                          }))
                        }
                        className="w-4 h-4 rounded bg-red-600"
                      />
                      <span className="text-sm text-gray-300">Add English subtitles</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importOptions.englishAudio}
                        onChange={(e) =>
                          setImportOptions(prev => ({
                            ...prev,
                            englishAudio: e.target.checked
                          }))
                        }
                        className="w-4 h-4 rounded bg-red-600"
                      />
                      <span className="text-sm text-gray-300">Keep original English audio</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Features Info */}
              <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-xl">
                <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Features</h4>
                <ul className="text-xs text-green-200/80 space-y-1">
                  <li>• Real TMDB data & posters</li>
                  <li>• Hindi audio language flag</li>
                  <li>• Dedicated section display</li>
                  <li>• Proper language badges</li>
                  <li>• Audio track support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

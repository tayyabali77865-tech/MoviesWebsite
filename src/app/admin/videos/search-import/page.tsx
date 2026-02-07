'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Film, Calendar, Star, Clock, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
  status_message?: string; // For error responses
  status_code?: number; // For error responses
}

const TMDB_API_KEY = '3fd2be2f0c70a2a598f084ddfb2348fd'; // Public TMDB API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default function SearchImportPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [selected, setSelected] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetSection, setTargetSection] = useState('new');
  const [commonHlsUrl, setCommonHlsUrl] = useState('');

  const router = useRouter();

  const searchMovies = async (page: number = 1) => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const endpoint = searchType === 'movie' ? 'search/movie' : 'search/tv';
      const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
      
      const res = await fetch(url);
      const data: TMDBResponse = await res.json();
      
      if (!res.ok) {
        console.error('TMDB API Error:', data);
        if (data.status_message) {
          throw new Error(`TMDB API: ${data.status_message}`);
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      setResults(data.results || []);
      setTotalPages(data.total_pages || 1);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('Search error details:', error);
      let errorMessage = 'Search failed';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - please check browser console';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid API key';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests - please wait';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await searchMovies(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchMovies(page);
  };

  const toggleSelect = (movie: TMDBMovie) => {
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
      const videos = selected.map(movie => ({
        title: movie.title || movie.original_title,
        description: movie.overview,
        thumbnailUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        tmdbId: movie.id.toString(),
        type: searchType === 'movie' ? 'movie' : 'series',
        section: targetSection,
        hlsUrl: commonHlsUrl.trim() || undefined,
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

      toast.success(`Successfully imported ${selected.length} ${searchType === 'movie' ? 'movies' : 'series'}`);
      router.push('/admin/videos');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear() || 'N/A';
  };

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Search className="text-red-600" /> Search & Import
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Search movies and TV shows from TMDB and import them to your website.</p>
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
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Type Tabs */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                {[
                  { value: 'movie', label: 'Movies' },
                  { value: 'tv', label: 'TV Shows' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSearchType(type.value as 'movie' | 'tv')}
                    className={clsx(
                      "px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                      searchType === type.value
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {type.label}
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
                    placeholder={`Search ${searchType === 'movie' ? 'movies' : 'TV shows'}...`}
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
            </form>

            {searching ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                <p className="text-gray-400 font-medium">Searching TMDB...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((movie) => {
                    const isSelected = selected.find(m => m.id === movie.id);
                    const year = formatDate(movie.release_date);

                    return (
                      <div
                        key={movie.id}
                        onClick={() => toggleSelect(movie)}
                        className={clsx(
                          "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-95",
                          isSelected ? "border-red-600 ring-4 ring-red-600/20" : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <div className="aspect-[2/3] relative">
                          {movie.poster_path ? (
                            <img 
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                              alt={movie.title} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                              <Film className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded uppercase text-gray-300">
                                TMDB
                              </span>
                              <span className="text-[10px] font-medium text-gray-400">{year}</span>
                              {movie.vote_average > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-[10px] font-medium text-yellow-500">{movie.vote_average.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                              {movie.title || movie.original_title}
                            </h3>
                            <span className="text-[10px] text-gray-400 uppercase mt-1">{searchType}</span>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : query ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Enter a search term to find movies and TV shows.</p>
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Film className="w-5 h-5 text-red-600" />
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
                  <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">If provided, this HLS URL will override the default embed servers.</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400 font-medium">Selected:</span>
                    <span className="text-xl font-bold text-white">{selected.length}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    <p>• TMDB ID will be stored for metadata</p>
                    <p>• Poster images will be used as thumbnails</p>
                    <p>• Embed servers will be used for playback</p>
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

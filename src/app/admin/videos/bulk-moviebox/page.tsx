'use client';

import { useState, useEffect } from 'react';
import { Plus, Link, Film, Play, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface MovieLink {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  description: string;
}

export default function BulkMovieBoxImport() {
  const [links, setLinks] = useState<MovieLink[]>([{ id: '1', title: '', url: '', thumbnailUrl: '', description: '' }]);
  const [loading, setLoading] = useState(false);
  const [targetSection, setTargetSection] = useState('new');
  const [commonHlsUrl, setCommonHlsUrl] = useState('');
  const router = useRouter();

  const addLink = () => {
    const newId = (links.length + 1).toString();
    setLinks([...links, { id: newId, title: '', url: '', thumbnailUrl: '', description: '' }]);
  };

  const updateLink = (id: string, field: 'title' | 'url' | 'thumbnailUrl' | 'description', value: string) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (id: string) => {
    if (links.length > 1) {
      setLinks(links.filter(link => link.id !== id));
    }
  };

  const extractVideoInfo = (url: string) => {
    // Extract video ID and title from various video platforms
    let videoId = '';
    let platform = '';
    let embedUrl = '';
    let title = '';
    let thumbnail = '';
    let description = '';

    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
      platform = 'YouTube';
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      // YouTube oEmbed API for metadata
      title = `YouTube Video ${videoId}`;
      thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      description = `Video from YouTube with ID: ${videoId}`;
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      platform = 'YouTube';
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      title = `YouTube Video ${videoId}`;
      thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      description = `Video from YouTube with ID: ${videoId}`;
    } else if (url.includes('dailymotion.com/video/')) {
      videoId = url.split('/video/')[1]?.split('?')[0] || '';
      platform = 'Dailymotion';
      embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      title = `Dailymotion Video ${videoId}`;
      thumbnail = `https://www.dailymotion.com/thumbnail/video/${videoId}`;
      description = `Video from Dailymotion with ID: ${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
      platform = 'Vimeo';
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
      title = `Vimeo Video ${videoId}`;
      thumbnail = `https://vumbnail.com/${videoId}.jpg`;
      description = `Video from Vimeo with ID: ${videoId}`;
    } else if (url.includes('moviebox') || url.includes('movibox') || url.includes('movie-box') || url.includes('movie_box') || 
               url.includes('mb.') || url.includes('mov-box') || url.includes('moviebox.com') || url.includes('moviebox.org')) {
      // For MovieBox links, we'll use them directly as iframe sources
      platform = 'MovieBox';
      embedUrl = url;
      // Extract video ID from various MovieBox URL patterns
      const urlMatch = url.match(/(?:moviebox|movibox|movie-box|movie_box|mb\.)\/(?:watch|video|play|embed)\/?([a-zA-Z0-9_-]+)/);
      videoId = urlMatch ? urlMatch[1] : url.split('/').pop() || 'moviebox-video';
      title = 'MovieBox Video';
      thumbnail = '';
      description = 'Video from MovieBox platform';
    } else if (url.includes('embed') || url.includes('iframe')) {
      // Generic embed URLs
      platform = 'Embed';
      embedUrl = url;
      videoId = url.split('/').pop() || 'embed-video';
      title = 'Embedded Video';
      thumbnail = '';
      description = 'Embedded video content';
    }

    return { videoId, platform, embedUrl, title, thumbnail, description };
  };

  const fetchVideoMetadata = async (url: string, linkId: string) => {
    const { videoId, platform, title, thumbnail, description } = extractVideoInfo(url);
    
    // Auto-fill basic info for all platforms
    updateLink(linkId, 'title', title);
    updateLink(linkId, 'thumbnailUrl', thumbnail);
    updateLink(linkId, 'description', description);
    
    // Try to fetch better metadata for YouTube
    if (platform === 'YouTube' && videoId) {
      try {
        // Fetch YouTube video metadata using oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          updateLink(linkId, 'title', data.title || title);
          updateLink(linkId, 'thumbnailUrl', data.thumbnail_url || thumbnail);
          updateLink(linkId, 'description', data.author_name || description);
        }
      } catch (error) {
        console.log('Could not fetch YouTube metadata:', error);
        // Keep the basic info that was already set
      }
    }
    
    // Try to fetch Dailymotion metadata
    if (platform === 'Dailymotion' && videoId) {
      try {
        // Dailymotion API for video info
        const apiUrl = `https://www.dailymotion.com/services/video/${videoId}?fields=title,description,thumbnail_url`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          updateLink(linkId, 'title', data.title || title);
          updateLink(linkId, 'thumbnailUrl', data.thumbnail_url || thumbnail);
          updateLink(linkId, 'description', data.description || description);
        }
      } catch (error) {
        console.log('Could not fetch Dailymotion metadata:', error);
        // Keep the basic info that was already set
      }
    }
    
    // Try to fetch MovieBox metadata
    if (platform === 'MovieBox' && videoId) {
      try {
        // For MovieBox, we can try to extract title from URL or use a generic approach
        const urlParts = url.split('/');
        const possibleTitle = urlParts.find(part => part.includes('-') || part.length > 10);
        if (possibleTitle) {
          const formattedTitle = possibleTitle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          updateLink(linkId, 'title', formattedTitle);
        }
        // Try to generate a thumbnail URL based on common patterns
        if (videoId && videoId !== 'moviebox-video') {
          updateLink(linkId, 'thumbnailUrl', `https://img.moviebox.com/thumbnails/${videoId}.jpg`);
        }
      } catch (error) {
        console.log('Could not fetch MovieBox metadata:', error);
        // Keep the basic info that was already set
      }
    }
  };

  const handleImport = async () => {
    const validLinks = links.filter(link => link.url.trim() && link.title.trim());
    
    if (validLinks.length === 0) {
      toast.error('Please add at least one valid movie with title and URL');
      return;
    }

    setLoading(true);
    try {
      const videos = validLinks.map(link => {
        const { platform, embedUrl } = extractVideoInfo(link.url);
        
        return {
          title: link.title,
          description: link.description || `Imported from ${platform}`,
          thumbnailUrl: link.thumbnailUrl || '',
          // Store the embed URL in a field that can be used by the player
          movieboxUrl: embedUrl,
          type: 'movie',
          section: targetSection,
          hlsUrl: commonHlsUrl.trim() || undefined,
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

      toast.success(`Successfully imported ${validLinks.length} movies`);
      router.push('/admin/videos');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Film className="text-red-600" /> MovieBox Link Import
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Import movies by simply pasting video links. Supports YouTube, Dailymotion, Vimeo, and direct video links.</p>
          </div>
          <button
            onClick={handleImport}
            disabled={loading || links.filter(l => l.url.trim() && l.title.trim()).length === 0}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Import {links.filter(l => l.url.trim() && l.title.trim()).length} Movies
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Links Input */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Link className="w-5 h-5 text-red-600" />
                  Video Links
                </h2>
                <button
                  onClick={addLink}
                  className="px-4 py-2 bg-red-600/10 text-red-600 rounded-lg hover:bg-red-600/20 transition-all font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>

              <div className="space-y-4">
                {links.map((link, index) => (
                  <div key={link.id} className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-600">Movie #{index + 1}</span>
                      {links.length > 1 && (
                        <button
                          onClick={() => removeLink(link.id)}
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Movie Title *</label>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                        placeholder="Enter movie title..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Video URL *</label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          updateLink(link.id, 'url', e.target.value);
                          // Auto-fill metadata when URL is pasted/changed
                          if (e.target.value) {
                            fetchVideoMetadata(e.target.value, link.id);
                          }
                        }}
                        onBlur={(e) => {
                          // Also fetch on blur in case user typed slowly
                          if (e.target.value) {
                            fetchVideoMetadata(e.target.value, link.id);
                          }
                        }}
                        placeholder="https://youtube.com/watch?v=... or https://dailymotion.com/video/..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                      {link.url && (
                        <div className="mt-2 flex items-center gap-2">
                          {(() => {
                            const { platform } = extractVideoInfo(link.url);
                            return platform ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-500">Detected: {platform}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs text-yellow-500">Will use as direct video link</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thumbnail URL (Optional)</label>
                      <input
                        type="url"
                        value={link.thumbnailUrl}
                        onChange={(e) => updateLink(link.id, 'thumbnailUrl', e.target.value)}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                      <textarea
                        value={link.description}
                        onChange={(e) => updateLink(link.id, 'description', e.target.value)}
                        placeholder="Enter video description..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 sticky top-24 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Play className="w-5 h-5 text-red-600" />
                Settings
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
                    placeholder="m3u8 URL to apply to all movies"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">If provided, this HLS URL will override the video links.</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400 font-medium">Ready to Import:</span>
                    <span className="text-xl font-bold text-white">
                      {links.filter(l => l.url.trim() && l.title.trim()).length}
                    </span>
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

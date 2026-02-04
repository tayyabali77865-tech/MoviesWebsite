// Deployment Trigger v3: Enhanced Drama Support and Hindi Server Priority
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize2,
  Settings,
  X,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Languages,
  Music,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Subtitle {
  id: string;
  language: string;
  url: string;
}

interface AudioTrack {
  id: string;
  language: string;
  url: string;
}

interface CustomVideoPlayerProps {
  videoId: string;
  title: string;
  sources: { '360'?: string; '480'?: string; '720'?: string; '1080'?: string };
  hlsUrl?: string | null;
  subtitles: Subtitle[];
  audioTracks?: AudioTrack[];
  defaultSpeed?: number;
  autoplay?: boolean;
  onClose?: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
  tmdbId?: string;
  malId?: string;
  anilistId?: string;
  netflixId?: string;
  season?: number;
  episode?: number;
  type?: string;
}

const RESOLUTIONS = [
  { label: '360p', key: '360' as const },
  { label: '480p', key: '480' as const },
  { label: '720p', key: '720' as const },
  { label: '1080p', key: '1080' as const },
];

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function CustomVideoPlayer({
  videoId,
  title,
  sources,
  hlsUrl,
  subtitles,
  audioTracks = [],
  defaultSpeed = 1,
  autoplay = false,
  onClose,
  minimized = false,
  onMinimize,
  tmdbId,
  malId,
  anilistId,
  netflixId,
  season = 1,
  episode = 1,
  type = 'movie',
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const [resolution, setResolution] = useState<keyof typeof sources | 'auto'>('auto');
  const [subtitleOn, setSubtitleOn] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState<string | null>(null);
  const [currentAudioLang, setCurrentAudioLang] = useState<string>('Default');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'main' | 'quality' | 'speed' | 'audio' | 'subtitles'>('main');
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentServer, setCurrentServer] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);

  const currentSrc = hlsUrl || sources[resolution === 'auto' ? '720' : resolution] || sources['720'] || sources['480'] || sources['360'] || sources['1080'];
  const isDailymotion = currentSrc && currentSrc.includes('dailymotion.com');

  // Reset iframe loading when server changes
  useEffect(() => {
    if (!currentSrc && (tmdbId || malId || netflixId || anilistId)) {
      setIframeLoading(true);
      // Set a timeout to hide loading after 10 seconds (increased from 5 for slower mirrors)
      const timer = setTimeout(() => setIframeLoading(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [currentServer, currentSrc, tmdbId, malId, netflixId, anilistId]);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) video.play().catch(() => { });
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl || '';
    }
  }, [hlsUrl, autoplay]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => { });
      if (audioRef.current && (audioTracks?.length || 0) > 0) audioRef.current.play().catch(() => { });
      setPlaying(true);
    } else {
      v.pause();
      if (audioRef.current) audioRef.current.pause();
      setPlaying(false);
    }
  }, [audioTracks]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const el = e.currentTarget;
    if (!v || !el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const newTime = x * v.duration;
    v.currentTime = newTime;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    const newTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
    v.currentTime = newTime;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current as any;
    if (!el) return;

    if (!document.fullscreenElement) {
      const requestMethod = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(el).then(() => setFullscreen(true)).catch((err: any) => {
          console.error("Fullscreen error:", err);
        });
      }
    } else {
      const exitMethod = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document).then(() => setFullscreen(false)).catch(() => { });
      }
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimeout) clearTimeout(hideTimeout);
    const t = setTimeout(() => setShowControls(false), 3000);
    setHideTimeout(t);
  }, [hideTimeout]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const targetVolume = muted ? 0 : volume;
    if (currentAudioLang === 'Default') {
      v.volume = targetVolume;
    } else {
      v.volume = 0;
      if (audioRef.current) audioRef.current.volume = targetVolume;
    }
  }, [volume, muted, currentAudioLang]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      // Sync audio if it drifts
      if (audioRef.current && Math.abs(audioRef.current.currentTime - v.currentTime) > 0.2) {
        audioRef.current.currentTime = v.currentTime;
      }
    };
    const onDurationChange = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('durationchange', onDurationChange);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);

    // Session Timer for Mirrors (since we can't get duration/time from iframe)
    let sessionInterval: NodeJS.Timeout;
    if (!currentSrc) {
      sessionInterval = setInterval(() => {
        if (playing) setCurrentTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('durationchange', onDurationChange);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, [currentSrc]);

  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAudioChange = (lang: string) => {
    setCurrentAudioLang(lang);
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;

    if (lang === 'Default') {
      if (a) a.pause();
      v.muted = false;
    } else {
      v.muted = true;
      if (a) {
        a.currentTime = v.currentTime;
        if (!v.paused) a.play().catch(() => { });
      }
    }
  };




  // Simplify to single unified Dual Audio API
  const getEmbedServers = () => {
    const servers = [];
    const isTv = type === 'tv' || type === 'series' || type === 'drama' || type === 'anime';

    // 1. VidSrc XYZ (Native Hindi Support) - Highest priority for user's request
    let xyzUrl = '';
    if (tmdbId) {
      xyzUrl = isTv
        ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    } else if (netflixId) {
      xyzUrl = isTv
        ? `https://vidsrc.xyz/embed/tv?netflix=${netflixId}&s=${season}&e=${episode}`
        : `https://vidsrc.xyz/embed/movie?netflix=${netflixId}`;
    } else if (malId) {
      xyzUrl = `https://vidsrc.xyz/embed/anime/${malId}/${episode}`;
    }

    if (xyzUrl) {
      servers.push({
        name: 'Server 1 (Hindi Dub)',
        url: `${xyzUrl}${xyzUrl.includes('?') ? '&' : '?'}ds_lang=hi`
      });
      servers.push({
        name: 'Server 2 (Global HD)',
        url: xyzUrl
      });
    }

    // 2. VidSrc.to (Very Stable & Clean)
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`;
      servers.push({ name: 'Server 3 (Cloud VIP)', url });
    }

    // 3. VidSrc.me (Excellent fallback)
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&s=${season}&e=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      servers.push({ name: 'Server 4 (Legacy)', url });
    }

    // 5. VidSrc.in (Hindi Fallback)
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.in/embed/movie/${tmdbId}`;
      servers.push({ name: 'Server 5 (Global Mirror)', url });
    }

    // 4. VidSrc.pro (Usually cleaner)
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.pro/embed/movie/${tmdbId}`;
      servers.push({ name: 'Server 4 (VIP)', url });
    }

    // 5. Anime / VidJoy
    if (malId || anilistId) {
      const id = anilistId || malId;
      servers.push({
        name: 'Anime Server',
        url: `https://vidsrc.icu/embed/anime/${id}/${episode}/1`
      });
    }

    // 7. Dedicated Netflix/Legacy Fallbacks
    if (netflixId) {
      servers.push({
        name: 'Mirror 6 (Netflix Stream)',
        url: isTv
          ? `https://vidsrc.me/embed/tv?netflix=${netflixId}&s=${season}&e=${episode}`
          : `https://vidsrc.me/embed/movie?netflix=${netflixId}`
      });
      // Also add vidsrc.xyz for netflix just in case
      servers.push({
        name: 'Mirror 7 (Netflix Alt)',
        url: isTv
          ? `https://vidsrc.xyz/embed/tv?netflix=${netflixId}&s=${season}&e=${episode}`
          : `https://vidsrc.xyz/embed/movie?netflix=${netflixId}`
      });
    } else if (tmdbId) {
      servers.push({
        name: 'Legacy Server',
        url: isTv
          ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&s=${season}&e=${episode}`
          : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
      });
    }

    return servers;
  };

  const embedServers = getEmbedServers();
  const embedUrl = embedServers[currentServer]?.url || (malId ? `https://vidsrc.xyz/embed/anime?mal_id=${malId}` : '');

  // Main render
  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none overflow-hidden text-white"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {minimized && onMinimize ? (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-4 right-4 z-[100] w-72 rounded-lg overflow-hidden shadow-2xl bg-black border border-white/20"
          >
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                src={!hlsUrl ? currentSrc : undefined}
                className="w-full h-full object-cover"
                onClick={togglePlay}
                playsInline
                crossOrigin="anonymous"
                controls={false}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
                >
                  {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                </button>
              </div>
              <button
                type="button"
                onClick={onMinimize}
                className="absolute top-2 right-2 p-1 rounded bg-black/50 hover:bg-black/70 text-white"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            <p className="p-2 text-xs truncate text-white bg-zinc-900">{title}</p>
          </motion.div>
        ) : (
          <>
            {/* Background Media Container */}
            <div className="absolute inset-0 w-full h-full">
              {currentSrc && !currentSrc.includes('dailymotion.com') ? (
                <video
                  src={!hlsUrl ? currentSrc || undefined : undefined}
                  className="w-full h-full object-contain"
                  onClick={togglePlay}
                  playsInline
                  crossOrigin="anonymous"
                  controls={false}
                >
                  {subtitleOn && subtitleLang && subtitles && subtitles.length > 0 && (
                    <track
                      kind="subtitles"
                      src={subtitles.find((s) => s.language === subtitleLang)?.url}
                      srcLang={subtitleLang}
                      label={subtitleLang}
                      default
                    />
                  )}
                </video>
              ) : currentSrc && currentSrc.includes('dailymotion.com') ? (
                <div className="relative w-full h-full bg-black">
                  <iframe
                    src={`https://www.dailymotion.com/embed/video/${currentSrc.split('/video/')[1]?.split('?')[0]}?autoplay=${playing ? 1 : 0}&queue-enable=0&ui-logo=0`}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (tmdbId || malId || netflixId || anilistId) ? (
                <div className="relative w-full h-full bg-black">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-[40]">
                      <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                      <p className="text-sm font-medium text-gray-400">Fetching {type} from secure server...</p>
                      <p className="text-[10px] text-gray-500 mt-2">Server response might take 2-5 seconds</p>
                    </div>
                  )}
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 relative z-[30]"
                    referrerPolicy="origin"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    onLoad={() => setIframeLoading(false)}
                  />
                  {/* Note for Hindi/Multi-lang */}
                  {!currentSrc && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600/90 backdrop-blur-md rounded-full border border-red-500/50 text-[10px] text-white font-bold z-50 shadow-xl animate-bounce-slow">
                      💡 <b>Hindi User?</b> Check the player's internal "Settings" (⚙️) to select Hindi audio if available on this mirror.
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
                  <div className="text-center p-4">
                    <p className="text-xl font-bold text-red-500 mb-2">No Video Source</p>
                    <p className="text-gray-400">This video does not have any playable URLs or identifiers.</p>
                    {onClose && (
                      <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                      >
                        Close Player
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* External Audio Track */}
            {currentAudioLang !== 'Default' && (
              <audio
                ref={audioRef}
                src={audioTracks.find(a => a.language === currentAudioLang)?.url}
                crossOrigin="anonymous"
              />
            )}

            {/* Mirror Switcher for Embeds (Only show if no direct source) */}
            {!currentSrc && (tmdbId || malId || netflixId || anilistId) && (
              <div className={clsx(
                "absolute top-20 left-4 flex flex-wrap gap-2 z-[60] transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                {embedServers.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentServer(idx)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg backdrop-blur-md border",
                      currentServer === idx
                        ? "bg-red-600 border-red-500 text-white scale-105"
                        : "bg-black/50 border-white/10 text-gray-400 hover:bg-black/70 hover:text-white"
                    )}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            )}

            {/* Persistent Time Display for Mirrors (Laptop View Requirement) */}
            {!currentSrc && !showControls && (
              <div className="absolute top-4 right-4 z-[60] px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/80 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>ELAPSED: {formatTime(currentTime)}</span>
              </div>
            )}

            {/* Control Overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx(
                    "absolute inset-0 flex flex-col z-50 transition-all duration-300",
                    isDailymotion ? "pointer-events-none" : "",
                    currentSrc && !isDailymotion ? "bg-gradient-to-t from-black/95 via-transparent to-black/70" : "bg-transparent"
                  )}
                >
                  {/* Top Bar */}
                  <div className={clsx("flex items-center justify-between p-4", isDailymotion && "pointer-events-auto bg-gradient-to-b from-black/80 to-transparent")}>
                    {onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    )}
                    <div className="flex-1 mx-4 text-center">
                      <h1 className="text-lg font-semibold truncate group flex items-center justify-center gap-2">
                        {title}
                        {!currentSrc && <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded flex items-center gap-1 uppercase tracking-tighter"><ExternalLink className="w-3 h-3" /> External Provider</span>}
                      </h1>
                      {hlsUrl && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">HLS Optimized</span>}
                    </div>
                    {onMinimize && (
                      <button
                        type="button"
                        onClick={onMinimize}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Minimize2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>

                  {/* Middle Section (Playback Control) - Only show for direct sources */}
                  {currentSrc && !isDailymotion && (
                    <div className="flex-1 flex items-center justify-center">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/5 transition-colors"
                      >
                        {playing ? <Pause className="w-10 h-10 fill-white" /> : <Play className="w-10 h-10 ml-2 fill-white" />}
                      </motion.button>
                    </div>
                  )}
                  {!currentSrc && <div className="flex-1 pointer-events-none" />}

                  {/* Bottom Controls */}
                  {/* Bottom Controls */}
                  <div className={clsx("p-4 space-y-4", isDailymotion && "hidden")}>
                    {/* Progress Bar - Only for direct sources */}
                    {currentSrc && (
                      <div
                        className="h-2 bg-white/20 rounded-full cursor-pointer group relative"
                        onClick={seek}
                      >
                        <div
                          className="h-full bg-red-600 rounded-full transition-all group-hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full scale-100 transition-transform shadow-lg"
                          style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', marginLeft: '-8px' }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {currentSrc && (
                          <>
                            <button
                              type="button"
                              onClick={() => skip(-10)}
                              className="p-1 hover:text-red-500 transition-colors"
                              title="Skip back 10s"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="p-1 hover:text-red-500 transition-colors"
                            >
                              {playing ? <Pause className="w-6 h-6 fill-currentColor" /> : <Play className="w-6 h-6 fill-currentColor" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => skip(10)}
                              className="p-1 hover:text-red-500 transition-colors"
                              title="Skip forward 10s"
                            >
                              <RotateCw className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 group/vol">
                              <button
                                type="button"
                                onClick={toggleMute}
                                className="p-1 hover:text-red-500 transition-colors"
                              >
                                {muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={muted ? 0 : volume}
                                onChange={(e) => {
                                  setVolume(parseFloat(e.target.value));
                                  setMuted(false);
                                }}
                                className="w-0 group-hover/vol:w-20 transition-all accent-red-600 h-1"
                              />
                            </div>

                            <span className="text-sm font-medium tabular-nums text-white/90">
                              {formatTime(currentTime)}
                              {duration > 0 && (
                                <>
                                  <span className="text-white/40 mx-1">/</span>
                                  {formatTime(duration)}
                                </>
                              )}
                              {!currentSrc && <span className="ml-2 text-[10px] text-gray-500 font-normal uppercase tracking-tighter">(Session Time)</span>}
                            </span>
                          </>
                        )}
                        {!currentSrc && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="p-1 hover:text-red-500 transition-colors"
                            >
                              {playing ? <Pause className="w-6 h-6 fill-currentColor" /> : <Play className="w-6 h-6 fill-currentColor" />}
                            </button>
                            <span className="text-sm font-medium tabular-nums text-white/90">
                              {formatTime(currentTime)}
                              <span className="ml-2 text-[10px] text-gray-500 font-normal uppercase tracking-tighter">(Elapsed)</span>
                            </span>
                            <span className="text-[10px] text-white/40 italic flex items-center gap-2">
                              Use mirror player for seeking.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSettings(!showSettings);
                              setSettingsTab('main');
                            }}
                            className={clsx(
                              "p-2 rounded-lg transition-colors flex items-center gap-1",
                              showSettings ? "bg-red-600 text-white" : "hover:bg-white/10"
                            )}
                          >
                            <Settings className={clsx("w-5 h-5", showSettings && "animate-spin-slow")} />
                          </button>

                          <AnimatePresence>
                            {showSettings && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-4 w-64 bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-2xl z-[70]"
                              >
                                {settingsTab === 'main' && (
                                  <div className="py-2">
                                    {currentSrc && (
                                      <button
                                        onClick={() => setSettingsTab('quality')}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Settings className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">Quality</span>
                                        </div>
                                        <span className="text-xs text-red-500 font-medium">
                                          {hlsUrl ? 'Auto (HLS)' : (resolution === 'auto' ? 'Auto' : `${resolution}p`)}
                                        </span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setSettingsTab('audio')}
                                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Music className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">Audio Track</span>
                                      </div>
                                      <span className="text-xs text-red-500 font-medium">{currentAudioLang}</span>
                                    </button>

                                    {currentSrc && subtitles.length > 0 && (
                                      <button
                                        onClick={() => setSettingsTab('subtitles')}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Languages className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">Subtitles</span>
                                        </div>
                                        <span className="text-xs text-red-500 font-medium">
                                          {subtitleOn ? subtitleLang : 'Off'}
                                        </span>
                                      </button>
                                    )}

                                    {currentSrc && (
                                      <button
                                        onClick={() => setSettingsTab('speed')}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Play className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">Speed</span>
                                        </div>
                                        <span className="text-xs text-red-500 font-medium">{speed}x</span>
                                      </button>
                                    )}

                                    {!currentSrc && (
                                      <div className="px-4 py-2 text-[10px] text-gray-500 bg-white/5 mt-2">
                                        Note: Mirror mode features are limited compared to Native HLS.
                                      </div>
                                    )}
                                  </div>
                                )}

                                {settingsTab === 'audio' && (
                                  <div className="py-2">
                                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                      <button onClick={() => setSettingsTab('main')} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                                      <span className="text-xs font-bold uppercase text-gray-500">Audio Selection</span>
                                    </div>
                                    <button
                                      onClick={() => { handleAudioChange('Default'); setShowSettings(false); }}
                                      className={clsx("w-full px-4 py-3 text-left text-sm hover:bg-white/5", currentAudioLang === 'Default' && "text-red-500 bg-red-500/5")}
                                    >
                                      Default (Internal)
                                    </button>
                                    {audioTracks.map((a) => (
                                      <button
                                        key={a.id}
                                        onClick={() => {
                                          if (a.url !== '#') {
                                            handleAudioChange(a.language);
                                            setShowSettings(false);
                                          }
                                        }}
                                        className={clsx(
                                          "w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center justify-between",
                                          currentAudioLang === a.language && "text-red-500 bg-red-500/5",
                                          a.url === '#' && "opacity-60 cursor-default"
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>{a.language}</span>
                                          {a.language.toLowerCase().includes('hindi') && <span className="text-[10px] bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-tighter">Dubbed</span>}
                                        </div>
                                        {a.url === '#' && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">In Player</span>}
                                      </button>
                                    ))}
                                    {!currentSrc && audioTracks.length > 0 && (
                                      <div className="px-4 py-2 text-[10px] text-red-400 italic">
                                        * Mirror audio may not perfectly sync with external tracks.
                                      </div>
                                    )}
                                  </div>
                                )}

                                {settingsTab === 'subtitles' && (
                                  <div className="py-2">
                                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                      <button onClick={() => setSettingsTab('main')} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                                      <span className="text-xs font-bold uppercase text-gray-500">Subtitles</span>
                                    </div>
                                    <button
                                      onClick={() => { setSubtitleOn(false); setShowSettings(false); }}
                                      className={clsx("w-full px-4 py-3 text-left text-sm hover:bg-white/5", !subtitleOn && "text-red-500 bg-red-500/5")}
                                    >
                                      Off
                                    </button>
                                    {subtitles.map((s) => (
                                      <button
                                        key={s.id}
                                        onClick={() => { setSubtitleLang(s.language); setSubtitleOn(true); setShowSettings(false); }}
                                        className={clsx("w-full px-4 py-3 text-left text-sm hover:bg-white/5", (subtitleOn && subtitleLang === s.language) && "text-red-500 bg-red-500/5")}
                                      >
                                        {s.language}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {settingsTab === 'quality' && (
                                  <div className="py-2">
                                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                      <button onClick={() => setSettingsTab('main')} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                                      <span className="text-xs font-bold uppercase text-gray-500">Quality</span>
                                    </div>
                                    {hlsUrl ? (
                                      <div className="px-4 py-4 text-xs text-gray-400 italic text-center">
                                        Quality is automatically managed by HLS for the best experience.
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => { setResolution('auto'); setShowSettings(false); }}
                                          className={clsx("w-full px-4 py-3 text-left text-sm hover:bg-white/5", resolution === 'auto' && "text-red-500 bg-red-500/5")}
                                        >
                                          Auto
                                        </button>
                                        {RESOLUTIONS.filter(r => sources[r.key]).map((r) => (
                                          <button
                                            key={r.key}
                                            onClick={() => { setResolution(r.key); setShowSettings(false); }}
                                            className={clsx("w-full px-4 py-3 text-left text-sm hover:bg-white/5", resolution === r.key && "text-red-500 bg-red-500/5")}
                                          >
                                            {r.label}
                                          </button>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                )}

                                {settingsTab === 'speed' && (
                                  <div className="py-2">
                                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                      <button onClick={() => setSettingsTab('main')} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                                      <span className="text-xs font-bold uppercase text-gray-500">Playback Speed</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 p-2">
                                      {SPEEDS.map((s) => (
                                        <button
                                          key={s}
                                          onClick={() => { setSpeed(s); setShowSettings(false); }}
                                          className={clsx(
                                            "px-3 py-2 text-sm rounded-lg transition-colors",
                                            speed === s ? "bg-red-600 text-white" : "hover:bg-white/5"
                                          )}
                                        >
                                          {s}x
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {fullscreen ? <Minimize2 className="w-6 h-6 text-red-500" /> : <Maximize className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div >

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </>
  );
}

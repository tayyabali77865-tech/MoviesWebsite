// Deployment Trigger v3: Enhanced Drama Support and Hindi Server Priority
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import {
  Maximize,
  Minimize2,
  X,
  Smartphone,
  Loader2,
  Settings,
  Languages,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [currentServer, setCurrentServer] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentSeason, setCurrentSeason] = useState(season);
  const [currentEpisode, setCurrentEpisode] = useState(episode);

  const currentSrc = hlsUrl || sources['720'] || sources['480'] || sources['360'] || sources['1080'];
  const isDailymotion = currentSrc && currentSrc.includes('dailymotion.com');

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      if (isMobileDevice && !window.matchMedia("(orientation: landscape)").matches) {
        setShowRotatePrompt(true);
      } else {
        setShowRotatePrompt(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Reset iframe loading when server changes
  useEffect(() => {
    if (!currentSrc && (tmdbId || malId || netflixId || anilistId)) {
      setIframeLoading(true);
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
      video.src = hlsUrl || '';
    }
  }, [hlsUrl, autoplay]);

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

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDurationChange = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('durationchange', onDurationChange);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);

    // Session Timer for Mirrors
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
  }, [currentSrc, playing]);

  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Enhanced server list with VidSrc focus for better Hindi support
  const getEmbedServers = () => {
    const servers = [];
    const isTv = type === 'tv' || type === 'series' || type === 'drama' || type === 'anime';

    // VidSrc XYZ with enhanced Hindi parameters - Primary servers
    let xyzUrl = '';
    if (tmdbId) {
      xyzUrl = isTv
        ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${currentSeason}/${currentEpisode}`
        : `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    } else if (netflixId) {
      xyzUrl = isTv
        ? `https://vidsrc.xyz/embed/tv?netflix=${netflixId}&s=${currentSeason}&e=${currentEpisode}`
        : `https://vidsrc.xyz/embed/movie?netflix=${netflixId}`;
    } else if (malId) {
      xyzUrl = `https://vidsrc.xyz/embed/anime/${malId}/${currentEpisode}`;
    }

    if (xyzUrl) {
      // Enhanced Hindi parameters for better Hindi audio
      const hindiParams = '?ds_lang=hi&lang=hi&subs=hi&audio=hi&cc=hi';
      const englishParams = '?ds_lang=en&lang=en&subs=en&audio=en&cc=en';
  
      let langParams = hindiParams;
  
      servers.push({
        name: 'VidSrc (Hindi Dub)',
        url: `${xyzUrl}${langParams}`
      });
  
      // Add alternative Hindi server with different parameters
      servers.push({
        name: 'VidSrc (Hindi Alt)',
        url: `${xyzUrl}?hindi=1&dub=hi&audio=hi&lang=hi&ds_lang=hi&subs=hi`
      });
      servers.push({
        name: 'VidSrc (Hindi Pro)',
        url: `${xyzUrl}?ds_lang=hi&hindi=1&dub=hi&audio=hi&cc=hi`
      });
  
      servers.push({
        name: 'VidSrc (Global HD)',
        url: xyzUrl
      });
    }

    // VidSrc.to with enhanced Hindi support
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${currentSeason}/${currentEpisode}?lang=en&dub=en`
        : `https://vidsrc.to/embed/movie/${tmdbId}?lang=en&dub=en`;
      servers.push({ name: 'VidSrc.to (English)', url });
    }

    // VidSrc.me with enhanced Hindi support
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&s=${currentSeason}&e=${currentEpisode}&lang=en&dub=en`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&lang=en&dub=en`;
      servers.push({ name: 'VidSrc.me (English)', url });
    }

    // VidSrc.me with enhanced Hindi support
    if (tmdbId) {
      const url = isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&s=${currentSeason}&e=${currentEpisode}&lang=en&dub=en`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&lang=en&dub=en`;
      servers.push({ name: 'VidSrc.me (English)', url });
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&lang=${selectedLanguage}&dub=${selectedLanguage === 'hi' ? 'hi' : 'en'}`;
      servers.push({ name: `VidSrc.me (${selectedLanguage.toUpperCase()})`, url });
    }

    return servers;
  };

  const embedServers = getEmbedServers();
  const embedUrl = embedServers[currentServer]?.url || '';

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none overflow-hidden text-white"
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
                playsInline
                crossOrigin="anonymous"
                controls={true}
              />
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
                  ref={videoRef}
                  src={!hlsUrl ? currentSrc || undefined : undefined}
                  className="w-full h-full object-contain"
                  playsInline
                  crossOrigin="anonymous"
                  controls={true}
                  autoPlay={autoplay}
                >
                  {subtitles.map((subtitle) => (
                    <track
                      key={subtitle.id}
                      kind="subtitles"
                      src={subtitle.url}
                      srcLang={subtitle.language}
                      label={subtitle.language}
                    />
                  ))}
                </video>
              ) : currentSrc && currentSrc.includes('dailymotion.com') ? (
                <div className="relative w-full h-full bg-black">
                  <iframe
                    src={`https://www.dailymotion.com/embed/video/${currentSrc.split('/video/')[1]?.split('?')[0]}?autoplay=${autoplay ? 1 : 0}&queue-enable=0&ui-logo=0`}
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

            {/* Mobile Rotate Prompt */}
            <AnimatePresence>
              {showRotatePrompt && isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                >
                  <div className="text-center p-8 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                    <Smartphone className="w-16 h-16 mx-auto mb-4 text-white animate-pulse" />
                    <h3 className="text-xl font-bold text-white mb-2">Rotate Your Device</h3>
                    <p className="text-gray-300 text-sm">For the best viewing experience, please rotate your device to landscape mode.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Server Switcher for Embeds */}
            {!currentSrc && (tmdbId || malId || netflixId || anilistId) && (
              <div className="absolute top-32 left-4 flex flex-wrap gap-2 z-[60]">
                {embedServers.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentServer(idx);
                      setIframeLoading(true);
                    }}
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

            {/* Top Controls - Fullscreen on Right Side Only */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-50">
              <div className="flex items-center justify-between">
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
                  <h1 className="text-lg font-semibold truncate text-white">{title}</h1>
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

            {/* Enhanced Hindi Language Note for Embeds */}
            {!currentSrc && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-md rounded-full border border-red-500/50 text-[11px] text-white font-bold z-50 shadow-xl animate-pulse">
                🎬 <b>{selectedLanguage === 'hi' ? 'हिंदी' : selectedLanguage.toUpperCase()} Audio</b> - If still English, use player settings (⚙️) to select {selectedLanguage === 'hi' ? 'हिंदी' : selectedLanguage.toUpperCase()} audio track
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
</div>
</>

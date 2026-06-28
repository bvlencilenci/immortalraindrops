'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
import Hls from 'hls.js';
import { Track } from '../types';


interface TileProps extends Track {
  isAdmin?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  archiveVariant?: boolean;
  archiveDisplayIndex?: number;
}

const Tile = (props: TileProps) => {
  const {
    id,
    title,
    artist,
    genre,
    media_type,
    tile_index,
    tile_id,
    audio_ext,
    image_ext,
    isAdmin,
    onDelete,
    onEdit,
    vote_count,
    release_date,
    duration,
    compact,
    archiveVariant,
    archiveDisplayIndex
  } = props;

  const {
    playTrack,
    currentlyPlayingId,
    isPlaying,
    togglePlay,
    setActiveFullscreenVideo,
    activeFullscreenUrl,
  } = useAudioStore();

  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

  // 3. R2 Asset Assembly (Convention Based)
  const extAudio = audio_ext || 'wav';
  const extImage = image_ext || 'jpg';

  // Strict R2 Routing (User Requested)
  const isSubmissionTile = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tile_id);
  const audioUrl = isSubmissionTile
    ? `${r2BaseUrl}/submissions/${tile_id}/audio.${extAudio}`
    : `${r2BaseUrl}/${tile_id}/audio.${extAudio}`;
  let imageUrl = isSubmissionTile
    ? `${r2BaseUrl}/submissions/${tile_id}/image.${extImage}`
    : `${r2BaseUrl}/${tile_id}/visual.${extImage}`;

  const isVideo = media_type === 'video';

  // TEST OVERRIDE FOR HLS
  if (tile_id === 'hls-test-bunny') {
    imageUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  }

  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isNearlySquare, setIsNearlySquare] = useState(false);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<Hls | null>(null);
  const bgHlsRef = useRef<Hls | null>(null);

  // HLS.js Initialization & Source Management
  useEffect(() => {
    if (!isActive) return;

    const isHls = imageUrl.includes('.m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        if (videoRef.current) {
          const hls = new Hls();
          hls.loadSource(imageUrl);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
        }
        if (bgVideoRef.current) {
          const bgHls = new Hls();
          bgHls.loadSource(imageUrl);
          bgHls.attachMedia(bgVideoRef.current);
          bgHlsRef.current = bgHls;
        }
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        // Native support (Safari)
        if (videoRef.current) videoRef.current.src = imageUrl;
        if (bgVideoRef.current) bgVideoRef.current.src = imageUrl;
      }
    } else {
      // Standard MP4/Video handling
      if (videoRef.current) videoRef.current.src = imageUrl;
      if (bgVideoRef.current) bgVideoRef.current.src = imageUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (bgHlsRef.current) bgHlsRef.current.destroy();
      if (videoRef.current) videoRef.current.removeAttribute('src');
      if (bgVideoRef.current) bgVideoRef.current.removeAttribute('src');
      hlsRef.current = null;
      bgHlsRef.current = null;
    };
  }, [isActive, imageUrl]);

  const tileRef = useRef<HTMLDivElement>(null);
  const wasAutoPausedRef = useRef(false);

  // Smart Auto-Pause/Resume on Scroll
  useEffect(() => {
    if (!tileRef.current || !isActive) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isPlayingNow = useAudioStore.getState().isPlaying;

        // Leaving Viewport
        if (!entry.isIntersecting) {
          if (isPlayingNow) {
            togglePlay();
            wasAutoPausedRef.current = true;
          }
        }
        // Entering Viewport
        else {
          if (wasAutoPausedRef.current && !isPlayingNow) {
            togglePlay();
            wasAutoPausedRef.current = false;
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(tileRef.current);

    return () => {
      observer.disconnect();
      // Don't reset ref here immediately to handle quick re-mounts if any, 
      // but usually safe to reset or keep. Let's keep strict for this session.
    };
  }, [isActive, togglePlay]);

  // Handle Play/Interaction
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    if (isActive) {
      togglePlay();
      // Also toggle video if present
      if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
      }
      if (bgVideoRef.current) {
        if (isPlaying) bgVideoRef.current.pause();
        else bgVideoRef.current.play();
      }
    } else {
      playTrack(id, audioUrl, title, artist, media_type);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. If NOT currently playing this track, start it in the global store!
    if (!isActive) {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      playTrack(id, audioUrl, title, artist, media_type);
    }

    // 2. Open Fullscreen Overlay with current time (resume point)
    const time = videoRef.current ? videoRef.current.currentTime : 0;
    setActiveFullscreenVideo(imageUrl, time);
  };

  const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    let ratio = 1;
    const target = e.currentTarget;
    if (target instanceof HTMLVideoElement && target.videoWidth) {
      ratio = target.videoWidth / target.videoHeight;
    } else if (target instanceof HTMLImageElement && target.naturalWidth) {
      ratio = target.naturalWidth / target.naturalHeight;
    }
    setAspectRatio(ratio);
    // Threshold: 0.95 to 1.05 is "close enough" to square to force fill
    setIsNearlySquare(ratio > 0.95 && ratio < 1.05);
  };

  // Sync Video with Global Playing State & Volume
  const isPlayingStore = useAudioStore(state => state.isPlaying);
  const volume = useAudioStore(state => state.volume);
  const globalSeek = useAudioStore(state => state.seek);

  useEffect(() => {
    const vids = [videoRef.current, bgVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    if (isActive && vids.length > 0) {
      vids.forEach(v => {
        v.volume = volume;
        if (isPlayingStore) v.play().catch(() => { });
        else v.pause();
      });
    }
    if (!isActive && vids.length > 0) {
      vids.forEach(v => v.pause());
    }
  }, [isActive, isPlayingStore, volume]);

  // Sync Video Duration & Progress to Store
  useEffect(() => {
    if (!isActive || !videoRef.current || !isVideo || !!activeFullscreenUrl) return;

    const video = videoRef.current;
    let frameId: number;

    const syncToStore = () => {
      if (!video) return;
      // We use the store's updater logic but for video
      useAudioStore.setState({
        duration: video.duration || 0,
        seek: video.currentTime || 0
      });
      frameId = requestAnimationFrame(syncToStore);
    };

    if (isPlayingStore) {
      frameId = requestAnimationFrame(syncToStore);
    }

    return () => cancelAnimationFrame(frameId);
  }, [isActive, isPlayingStore, isVideo, activeFullscreenUrl]);

  // Handle Seeking from External UI (Header)
  useEffect(() => {
    if (!isActive || !videoRef.current || !isVideo) return;

    // Only sync IF the difference is significant (prevents feedback loops)
    const diff = Math.abs(videoRef.current.currentTime - globalSeek);
    if (diff > 0.5) {
      videoRef.current.currentTime = globalSeek;
      if (bgVideoRef.current) bgVideoRef.current.currentTime = globalSeek;
    }
  }, [globalSeek, isActive, isVideo]);

  // Visualizer Effect (Butterchurn)
  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      // PERF: Disable visualizer on mobile screens to save battery/resources
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;

      if (!isActive || !canvasRef.current || !isPlaying) return;

      try {
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        const ctx = Howler.ctx;
        if (!ctx) return;

        const { analyser, howl } = useAudioStore.getState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (howl as any)?._sounds?.[0];

        if (sound && sound._node && !sound._visualizerConnected) {
          const audioNode = sound._node;
          if (!audioNode.crossOrigin) audioNode.crossOrigin = "anonymous";
          try {
            const sourceNode = ctx.createMediaElementSource(audioNode);
            const analyserNode = ctx.createAnalyser();
            sourceNode.connect(analyserNode);
            analyserNode.connect(ctx.destination);
            sound._visualizerConnected = true;
            sound._analyser = analyserNode;
          } catch (e) {
            if (!sound._analyser) { /* ignore */ }
          }
        }

        const finalAnalyser = (sound && sound._analyser) ? sound._analyser : analyser;

        if (finalAnalyser) {
          const canvas = canvasRef.current;
          const { width, height } = canvas.parentElement?.getBoundingClientRect() || { width: 300, height: 300 };

          const visualizer = butterchurn.createVisualizer(ctx, canvas, { width, height });
          visualizer.connectAudio(finalAnalyser);

          const presets = butterchurnPresets.getPresets();
          const presetKeys = Object.keys(presets);
          const randomPreset = presets[presetKeys[Math.floor(Math.random() * presetKeys.length)]];
          visualizer.loadPreset(randomPreset, 0.0);

          visualizerRef.current = visualizer;

          const loop = () => {
            if (visualizerRef.current) {
              visualizerRef.current.render();
              animationFrameId = requestAnimationFrame(loop);
            }
          };
          loop();
        }
      } catch (e) {
        console.error("Visualizer Init Failed", e);
      }
    };

    if (isActive && isPlaying) {
      setTimeout(initVisualizer, 200);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      visualizerRef.current = null;
    };
  }, [isActive, isPlaying]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (visualizerRef.current && canvasRef.current) {
        const { width, height } = canvasRef.current.parentElement?.getBoundingClientRect() || { width: 0, height: 0 };
        if (width > 0 && height > 0) {
          visualizerRef.current.setRendererSize(width, height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (archiveVariant) {
    const displayIndex = String(archiveDisplayIndex ?? tile_index ?? 0).padStart(2, '0');
    const displayYear = release_date ? new Date(release_date).getFullYear() : null;

    return (
      <div
        ref={tileRef}
        onClick={handleInteraction}
        className={`group relative grid w-full cursor-pointer select-none grid-cols-[44px_1fr_72px] items-center border-b border-white/[0.07] px-3 py-3 transition-colors duration-100 md:grid-cols-[64px_82px_1fr_92px_92px_86px] md:px-4 md:py-3.5 ${
          isActive ? 'bg-lime-300/[0.08]' : 'bg-black/[0.12] hover:bg-white/[0.04]'
        }`}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                rgba(255,255,255,0.16) 0px,
                rgba(255,255,255,0.16) 1px,
                transparent 1px,
                transparent 6px
              )
            `,
          }}
        />

        <span className="relative z-10 text-[10px] font-mono tracking-widest text-lime-300/55 tabular-nums">
          {displayIndex}
        </span>

        <div className="relative z-10 hidden h-12 w-12 overflow-hidden border border-white/10 bg-black/35 md:flex">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover grayscale contrast-125 opacity-80 transition-opacity duration-150 group-hover:opacity-100"
            crossOrigin="anonymous"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-lime-300/[0.03] mix-blend-screen" />
        </div>

        <div className="relative z-10 min-w-0 pr-3">
          <div className="flex items-center gap-2">
            {isActive && isPlayingStore && (
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse bg-red-500" />
            )}
            <span className="truncate text-[15px] font-bold leading-tight text-[#fffbea]/95 md:text-[16px]">
              {title || 'UNKNOWN TRACK'}
            </span>
          </div>
          <div className="mt-1 truncate text-[12px] leading-tight text-lime-300/75">
            {artist || 'UNKNOWN ARTIST'}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.18em] text-[#ECEEDF]/38 md:hidden">
            <span>{displayYear || '----'}</span>
            <span>{duration || '--:--'}</span>
          </div>
        </div>

        <div className="relative z-10 hidden text-[10px] uppercase tracking-[0.18em] text-[#ECEEDF]/42 md:block">
          {displayYear || '----'}
        </div>

        <div className="relative z-10 hidden text-[10px] uppercase tracking-[0.18em] text-[#ECEEDF]/42 md:block">
          {duration || '--:--'}
        </div>

        <div className="relative z-10 flex items-center justify-end gap-2">
          <span className={`border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
            isActive && isPlayingStore ? 'bg-red-500/15 text-red-300' : 'bg-black/25 text-[#ECEEDF]/70 group-hover:text-lime-300'
          }`}>
            {isActive && isPlayingStore ? 'PAUSE' : 'PLAY'}
          </span>
        </div>

        {isAdmin && (
          <div className="relative z-20 col-span-3 mt-3 flex gap-2 border-t border-white/[0.06] pt-3 md:col-span-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="border border-[#ECEEDF]/20 bg-black/35 px-2.5 py-1 text-[9px] font-mono text-[#ECEEDF] transition-colors duration-100 hover:bg-[#ECEEDF]/15"
            >
              EDIT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`DELETE TRACK ${title}?`)) {
                  onDelete?.();
                }
              }}
              className="border border-red-500/20 bg-red-950/35 px-2.5 py-1 text-[9px] font-mono text-red-300 transition-colors duration-100 hover:bg-red-900"
            >
              REMOVE
            </button>
          </div>
        )}
      </div>
    );
  }


  return (
    <div
      ref={tileRef}
      onClick={handleInteraction}
      className={`w-full flex items-center justify-between border-b border-[#ECEEDF]/10 py-3 px-2 md:px-4 transition-colors duration-100 cursor-pointer select-none ${
        isActive ? 'bg-[#ECEEDF]/5' : 'bg-black hover:bg-[#ECEEDF]/5'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Track Index */}
        <span className="text-[10px] text-[#ECEEDF]/35 font-bold tracking-widest w-6 shrink-0 select-none">
          {((tile_index || 0) + 1).toString().padStart(2, '0')}
        </span>

        {/* Thumbnail */}
        <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} bg-black/40 border border-[#ECEEDF]/10 flex-shrink-0 rounded-sm overflow-hidden flex items-center justify-center relative`}>
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover grayscale"
            crossOrigin="anonymous"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Play/Pause state symbol */}
        {isActive && isPlayingStore && (
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
        )}

        {/* Artist & Title */}
        <div className={`flex flex-col ${compact ? '' : 'md:flex-row md:items-baseline md:gap-3'} min-w-0`}>
          <span className={`font-bold text-xs ${compact ? '' : 'md:text-sm'} text-[#ECEEDF] uppercase tracking-wider truncate`}>
            {artist || 'UNKNOWN ARTIST'}
          </span>
          <span className="font-light text-xs text-[#ECEEDF]/60 lowercase tracking-wider truncate">
            {title || 'UNKNOWN TRACK'}
          </span>
        </div>
      </div>

      <div className={`${compact ? 'hidden' : 'flex'} items-center gap-6 flex-shrink-0`}>
        {/* Genre / Date / Duration */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-[#ECEEDF]/40 tracking-wider">
          {genre && <span className="border border-[#ECEEDF]/15 px-1.5 py-0.5 uppercase text-[9px]">{genre}</span>}
          {release_date && <span>{new Date(release_date).getFullYear()}</span>}
          {duration && <span>{duration}</span>}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-2 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="bg-[#ECEEDF]/10 hover:bg-[#ECEEDF]/20 text-[#ECEEDF] text-[9px] font-mono px-2.5 py-1 rounded-sm border border-[#ECEEDF]/20 transition-colors duration-100 cursor-pointer"
            >
              EDIT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`DELETE TRACK ${title}?`)) {
                  onDelete?.();
                }
              }}
              className="bg-red-950/40 hover:bg-red-900 text-red-300 text-[9px] font-mono px-2.5 py-1 rounded-sm border border-red-500/20 transition-colors duration-100 cursor-pointer"
            >
              REMOVE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tile;

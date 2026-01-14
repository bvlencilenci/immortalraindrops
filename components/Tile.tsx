'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
import Hls from 'hls.js';
import { Track } from '../types';
import VoteButtons from './VoteButtons';

interface TileProps extends Track {
  isAdmin?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
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
    vote_count
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
  let audioUrl = `${r2BaseUrl}/${tile_id}/audio.${extAudio}`;
  let imageUrl = `${r2BaseUrl}/${tile_id}/visual.${extImage}`;

  const isVideo = media_type === 'video';

  // TEST OVERRIDE FOR HLS
  if (tile_id === 'hls-test-bunny') {
    imageUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  }

  // console.log('Tile constructed:', { tile_id, audioUrl, imageUrl });

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

  const handleMediaLoad = (e: any) => {
    let ratio = 1;
    if (e.target.videoWidth) {
      ratio = e.target.videoWidth / e.target.videoHeight;
    } else if (e.target.naturalWidth) {
      ratio = e.target.naturalWidth / e.target.naturalHeight;
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


  return (
    <div
      ref={tileRef}
      onClick={handleInteraction}
      className="relative w-full aspect-square overflow-hidden group border-r last:border-r-0 cursor-pointer bg-black"
    >
      {/* 1. Visual Base: Video, Canvas, or Image */}
      {isVideo ? (
        // Video Handling
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {/* Background Layer (Only shown if NOT nearly square) */}
          {!isNearlySquare && (
            <video
              ref={bgVideoRef}
              src={imageUrl}
              className="absolute inset-0 w-full h-full object-cover z-0 blur-2xl opacity-40 scale-110"
              loop
              muted
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              autoPlay={isActive && isPlayingStore}
            />
          )}
          {/* Foreground Layer */}
          <video
            ref={videoRef}
            src={imageUrl}
            onLoadedMetadata={handleMediaLoad}
            className={`relative z-10 w-full h-full ${isNearlySquare ? 'object-cover' : 'object-contain'}`}
            loop
            muted={!isActive || !!activeFullscreenUrl}
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            autoPlay={isActive && isPlayingStore}
          />
        </div>
      ) : (
        // Image / Visualizer Handling
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {/* Background Blur (Only if NOT nearly square) */}
          {!isNearlySquare && (
            <img
              src={imageUrl}
              className="absolute inset-0 w-full h-full object-cover z-0 blur-2xl opacity-40 scale-110"
              alt=""
              crossOrigin="anonymous"
              aria-hidden="true"
            />
          )}

          {isActive && isPlayingStore ? (
            <canvas
              ref={canvasRef}
              className="relative z-10 w-full h-full object-cover hidden md:block" // Visualizer always fills
            />
          ) : (
            <img
              src={imageUrl}
              onLoad={handleMediaLoad}
              className={`relative z-10 w-full h-full ${isNearlySquare ? 'object-cover' : 'object-contain'}`}
              alt={title}
              crossOrigin="anonymous"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}

      {/* 2. Text Protection & Hover Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      {/* FULLSCREEN BUTTON (Video Only) */}
      {isVideo && (
        <button
          onClick={handleFullscreen}
          className="absolute bottom-6 right-6 z-50 p-2 rounded-sm invisible group-hover:visible opacity-0 group-hover/grid:opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto duration-0 group-hover:duration-300 transition-all ease-in-out flex items-center justify-center text-white bg-transparent group-hover:bg-white/10 group-hover:backdrop-blur-md group-hover:border group-hover:border-white/20 group-hover:shadow-xl group-hover:shadow-black/50"
        >
          <img src="/fullscreen.svg" className="w-[32px] h-[32px] invert opacity-90" alt="Fullscreen" />
        </button>
      )}

      {/* 3. Metadata */}
      <div className="absolute top-[24px] left-[12px] md:top-[32px] md:left-[20px] flex flex-col z-20 pointer-events-none">
        <span className="text-[15px] font-mono text-[#ECEEDF] lowercase leading-none tracking-normal">
          {artist || '—'}
        </span>
        <span className="text-[20px] md:text-[28px] uppercase leading-none tracking-tighter mt-1 text-[#ECEEDF]">
          {title || '—'}
        </span>
      </div>

      {/* 5. VOTING CONTROLS */}
      <div className="absolute bottom-3 right-3 z-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        {/* <VoteButtons trackId={tile_id} initialCount={vote_count || 0} /> */}
      </div>

      {isAdmin && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="bg-[#ECEEDF]/10 hover:bg-[#ECEEDF]/20 text-[#ECEEDF] text-[10px] font-mono px-3 py-1 rounded-sm backdrop-blur-md transition-all border border-[#ECEEDF]/20"
          >
            [ EDIT ]
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`DELETE TILE ${tile_id}? This is permanent.`)) {
                onDelete?.();
              }
            }}
            className="bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-mono px-3 py-1 rounded-sm backdrop-blur-md transition-all border border-red-400/50"
          >
            [ REMOVE ]
          </button>
        </div>
      )}
    </div>
  );
};

export default Tile;

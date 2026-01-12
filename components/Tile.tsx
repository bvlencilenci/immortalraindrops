'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
import { Track } from '../types';

interface TileProps extends Track {
  // Add any extra props if needed, otherwise this is just Track
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
    image_ext
  } = props;
  const {
    playTrack,
    currentlyPlayingId,
    isPlaying,
    togglePlay,
  } = useAudioStore();

  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

  // 3. R2 Asset Assembly (Convention Based)
  const extAudio = audio_ext || 'wav';
  const extImage = image_ext || 'jpg';

  // Strict R2 Routing (User Requested)
  const audioUrl = `${r2BaseUrl}/${tile_id}/audio.${extAudio}`;
  const imageUrl = `${r2BaseUrl}/${tile_id}/visual.${extImage}`;

  console.log('Tile constructed:', { tile_id, audioUrl, imageUrl });

  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

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
    } else {
      playTrack(id, audioUrl, title, artist);
    }
  };

  // Sync Video with Global Playing State
  useEffect(() => {
    if (isActive && videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => { });
      else videoRef.current.pause();
    }
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive, isPlaying]);

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

  const isVideo = media_type === 'video';

  return (
    <div
      onClick={handleInteraction}
      className="relative w-full aspect-square overflow-hidden group border-r last:border-r-0 cursor-pointer bg-black"
    >
      {/* 1. Visual Base: Video, Canvas, or Image */}
      <div className="absolute inset-0 z-0 transition-all duration-500 w-full h-full">
        {isActive && isPlaying ? (
          <>
            {isVideo ? (
              // 4. Media Handling: Video
              <video
                ref={videoRef}
                src={imageUrl}
                className="absolute inset-0 w-full h-full object-cover z-0 hidden md:block" // Hidden on mobile for perf
                loop
                muted // Audio governed by global store
                playsInline
                crossOrigin="anonymous" // 5. Fix CORS
              />
            ) : (
              // Audio Visualizer
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover z-0 hidden md:block" // Hidden on mobile for perf
              />
            )}
          </>
        ) : (
          <img
            src={imageUrl}
            className="absolute inset-0 w-full h-full object-cover z-0"
            alt={title}
            crossOrigin="anonymous" // 5. Fix CORS for images too
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* 2. Text Protection & Hover Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      {/* 3. Metadata */}
      {/* 3. Metadata */}
      <div className="absolute top-[24px] left-[12px] md:top-[32px] md:left-[20px] flex flex-col z-20 pointer-events-none">
        <span className="text-[15px] font-mono text-[#ECEEDF] lowercase leading-none tracking-normal">
          {artist || '—'}
        </span>
        <span className="text-[20px] md:text-[28px] uppercase leading-none tracking-tighter mt-1 text-[#ECEEDF]">
          {title || '—'}
        </span>
      </div>
    </div>
  );
};

export default Tile;

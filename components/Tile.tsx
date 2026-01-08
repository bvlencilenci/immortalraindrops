'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Image from 'next/image';
import { Howler } from 'howler';

interface TileProps {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverImage?: string;
}

const Tile = ({ id, title, artist, url, coverImage }: TileProps) => {
  const {
    playTrack,
    currentlyPlayingId,
    isPlaying,
    togglePlay,
    restartTrack,
    skipTrack,
    seek,
    duration,
    seekTo,
    volume,
    adjustVolume,
    isBuffering
  } = useAudioStore();

  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Handle Play/Interaction
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation? Wait, the tile itself is the clickable area.

    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    if (isActive) {
      togglePlay();
    } else {
      playTrack(id, url, title, artist);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.min(Math.max(0, clickX / rect.width), 1);
    seekTo(percent * duration);
  };

  // ... Visualizer Effect (unchanged) ...
  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      // Visualizer logic needs to run if isActive, regardless of playing state technically to keep it alive?
      // But standard Howler analyser data might stop if paused.
      // Keeping existing logic for now.
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
          audioNode.crossOrigin = "anonymous";
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

  const progressPercent = (duration > 0 && isActive) ? (seek / duration) * 100 : 0;

  return (
    <div
      onClick={handleInteraction}
      className={`
        group relative aspect-square w-full
        bg-[#0a0a0a]
        cursor-pointer overflow-hidden
        outline-none border-none shadow-none
        ${isActive ? 'z-20' : 'z-0'}
      `}
    >
      {isActive ? (
        <>
          {/* Visualizer Layer (z-0) - Persistent */}
          <div className="absolute inset-0 z-0 w-full h-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Explicit Metadata Overlay for Active Tile (Hover-Off) */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference pl-6 transition-opacity duration-300 opacity-100 group-hover:opacity-0">
            <div className="space-y-1">
              <p className="font-mono text-xs text-neutral-400 lowercase tracking-widest">
                {artist}
              </p>
              <p className="font-mono text-sm font-bold text-neutral-300 uppercase tracking-tighter line-clamp-2">
                {title}
              </p>
            </div>
          </div>

          {/* In-Tile HUD (z-20) - Hidden by default, Show on Hover */}
          <div className={`
                absolute bottom-0 left-0 w-full h-[15%] min-h-[56px] z-20
                bg-[#050505cc] backdrop-blur-md
                border-t border-[#222]
                flex flex-col
                transition-opacity duration-300
                opacity-0 group-hover:opacity-100
            `}>
            {/* 1. Filling Seek Bar (Relative Container) */}
            <div
              className="relative w-full h-1 bg-white/10 cursor-pointer group/seek"
              onClick={handleSeek}
            >
              <div className="absolute top-[-4px] bottom-[-4px] w-full bg-transparent z-30" />
              {/* Filling Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-linear pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 2. Main Controls Row */}
            <div className="flex items-center justify-between h-full px-2 pt-1 pb-1">
              {/* Metadata */}
              <div className="flex flex-col w-2/5 overflow-hidden leading-none justify-center pl-4">
                <span className="font-mono text-[10px] text-white font-bold uppercase tracking-widest truncate">
                  {title}
                </span>
                <span className="font-mono text-[8px] text-[#888] lowercase truncate">
                  {artist}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); restartTrack(); }}
                  className="hud-btn w-6 h-6 text-sm flex items-center justify-center"
                  title="Restart"
                >
                  ⟲
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className={`hud-btn w-6 h-6 text-sm flex items-center justify-center ${isBuffering ? 'animate-pulse text-green-500' : ''}`}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isBuffering ? '●' : (isPlaying ? '||' : '▶')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipTrack(); }}
                  className="hud-btn w-6 h-6 text-sm flex items-center justify-center"
                  title="Skip"
                >
                  →
                </button>
              </div>

              {/* Vertical Volume - Keeping it as requested */}
              <div className="h-full w-6 flex items-center justify-center relative">
                <div className="absolute w-[40px] h-[10px] -rotate-90 origin-center flex items-center justify-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="retro-range"
                    style={{ transform: 'scaleX(0.8)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {coverImage && (
            <div className="absolute inset-0 z-0 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
            </div>
          )}

          {/* Metadata Overlay (Inactive) */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference pl-6">
            <div className="space-y-1">
              <p className="font-mono text-xs text-neutral-400 lowercase tracking-widest group-hover:text-white transition-colors">
                {artist}
              </p>
              <p className="font-mono text-sm font-bold text-neutral-300 uppercase tracking-tighter group-hover:text-green-500 transition-colors line-clamp-2">
                {title}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tile;

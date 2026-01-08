'use client';

import { useEffect, useRef, useState } from 'react';
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
    skipBack,
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
    e.stopPropagation();

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

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    const v = isActive ? volume : 1.0;
    if (v === 0) return "/speaker-simple-slash.svg";
    if (v < 0.3) return "/speaker-simple-low.svg";
    if (v < 0.7) return "/speaker-simple-none.svg";
    return "/speaker-simple-high.svg";
  };

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

          {/* Metadata Overlay (Artist Top, Title Bottom when NOT Hovering) */}
          <div className={`absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference pb-8 transition-opacity duration-300 ${isPlaying ? 'group-hover:opacity-0' : ''}`}>
            <div className="flex flex-col leading-tight pl-1">
              <span className="font-mono text-[10px] md:text-sm text-neutral-400 lowercase tracking-widest truncate">
                {artist}
              </span>
              <span className="font-mono text-[12px] md:text-lg font-bold text-neutral-300 uppercase tracking-tighter truncate">
                {title}
              </span>
            </div>
          </div>

          {/* In-Tile HUD (z-20) - Restricted to top ~12% Hardware HUD */}
          <div className={`
                absolute top-0 left-0 w-full h-[15%] min-h-[58px] z-20
                bg-[#050505cc] backdrop-blur-md
                border-b border-white/10
                flex items-center justify-between px-1 relative
                transition-opacity duration-300
                opacity-0 ${isPlaying ? 'group-hover:opacity-100' : ''}
                hud-wrapper
            `}>
            {/* 1. Tactical Seeker: 2px solid white bar at top-0 */}
            <div
              className="absolute top-0 left-0 w-full h-[2px] bg-white/5 cursor-pointer group/seek z-30"
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white pointer-events-auto"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Timer Indented 4px from Right, on seeker path */}
              <div className="absolute top-[4px] right-1">
                <span className="font-mono text-[8px] text-white/40 tabular-nums uppercase pr-0.5">
                  {formatTime(seek)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Content Row: Metadata (Left) | Controls (Center) | Volume (Right Expanding) */}
            <div className="w-full flex items-center justify-between px-3 mt-2">
              {/* Left: Metadata with 4px indent */}
              <div className="flex flex-col min-w-0 leading-tight flex-1">
                <span className="font-mono text-[10px] md:text-xs font-bold text-white uppercase tracking-widest truncate">
                  {title}
                </span>
                <span className="font-mono text-[8px] md:text-[10px] text-neutral-400 lowercase truncate">
                  {artist}
                </span>
              </div>

              {/* Center: Playback Group */}
              <div className="flex items-center gap-4 justify-center flex-1">
                <button
                  onClick={(e) => { e.stopPropagation(); skipBack(); }}
                  className="mechanical-btn w-8 h-8 flex items-center justify-center"
                  title="Back"
                >
                  <img src="/skip-back.svg" alt="Back" className="w-3.5 h-3.5 invert opacity-70" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="mechanical-btn w-9 h-9 flex items-center justify-center"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <img
                    src={isPlaying ? "/pause.svg" : "/play.svg"}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="w-4 h-4 invert opacity-80"
                  />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipTrack(); }}
                  className="mechanical-btn w-8 h-8 flex items-center justify-center"
                  title="Forward"
                >
                  <img src="/skip-forward.svg" alt="Forward" className="w-3.5 h-3.5 invert opacity-70" />
                </button>
              </div>

              {/* Right: Volume Expanding Cluster */}
              <div className="flex items-center flex-1 justify-end group/tile-vol">
                <div className="flex items-center gap-2">
                  <img src={getVolumeIcon()} alt="Vol" className="w-3 h-3 invert opacity-60" />
                  <div className="w-0 group-hover/tile-vol:w-16 overflow-hidden transition-all duration-300 ease-out">
                    <div
                      className="ml-2 h-[2px] w-12 bg-white/10 relative cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = x / rect.width;
                        adjustVolume(percent);
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 h-full bg-white"
                        style={{ width: `${volume * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 w-1 h-1 bg-white -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ left: `${volume * 100}%` }}
                      />
                    </div>
                  </div>
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

          {/* Metadata Overlay (Artist Top, Title Bottom) */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference">
            <div className="flex flex-col leading-tight pl-1">
              <span className="font-mono text-[10px] md:text-sm text-neutral-400 lowercase tracking-widest group-hover:text-white transition-colors truncate">
                {artist}
              </span>
              <span className="font-mono text-[12px] md:text-lg font-bold text-neutral-300 uppercase tracking-tighter group-hover:text-green-500 transition-colors truncate">
                {title}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tile;

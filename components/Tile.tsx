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

  // Function logic for image path generation
  const getImagePath = (trackTitle: string, cover?: string) => {
    if (cover) return cover;
    const sanitized = trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `/images/${sanitized}_pic.jpg`;
  };

  const imagePath = getImagePath(title, coverImage);
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

  // Handle window resize to sync visualizer dimensions
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
      onClick={handleInteraction}
      className="relative w-full aspect-square overflow-hidden group border-r last:border-r-0 cursor-pointer bg-black"
    >
      {/* 1. Visual Base (Milkdrop or Cover) */}
      <div className="absolute inset-0 z-0 transition-all duration-500 w-full h-full">
        {isActive && isPlaying ? (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block object-cover z-0"
          />
        ) : (
          <img
            src={imagePath}
            className="absolute inset-0 w-full h-full object-cover z-0"
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* 2. Text Protection & Hover Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      {/* 3. Metadata & Safe-Area Offset */}
      <div className="absolute top-[12px] left-[12px] md:top-[20px] md:left-[20px] flex flex-col z-20 pointer-events-none">
        <span className="text-[15px] font-mono text-neutral-300 lowercase leading-none tracking-normal">
          {artist}
        </span>
        <span className="text-[24px] md:text-[32px] font-bold uppercase leading-none tracking-tighter mt-2 text-white">
          {title}
        </span>
      </div>
    </div>
  );
};

export default Tile;

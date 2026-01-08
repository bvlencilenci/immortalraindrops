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
    restartTrack
  } = useAudioStore();

  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Handle Play/Interaction
  const handleInteraction = (e?: React.MouseEvent) => {
    // Ensure Audio Context is unlocked
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    if (isActive) {
      // If already active, maybe toggle play? 
      // But strict generic interaction usually implies "Select"
      // We let the HUD handle specific controls.
    } else {
      playTrack(id, url, title, artist);
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      if (!isActive || !canvasRef.current || !isPlaying) return;

      try {
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        const ctx = Howler.ctx;
        if (!ctx) return;

        // Visualizer wiring...
        const { analyser, howl } = useAudioStore.getState();
        let sourceNode: MediaElementAudioSourceNode | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (howl as any)?._sounds?.[0];

        if (sound && sound._node && !sound._visualizerConnected) {
          const audioNode = sound._node;
          audioNode.crossOrigin = "anonymous";
          try {
            sourceNode = ctx.createMediaElementSource(audioNode);
            const analyserNode = ctx.createAnalyser();
            sourceNode.connect(analyserNode);
            analyserNode.connect(ctx.destination);
            sound._visualizerConnected = true;
            sound._analyser = analyserNode;
          } catch (e) {
            if (!sound._analyser) console.warn("Visualizer connect warn", e);
          }
        }

        const finalAnalyser = (sound && sound._analyser) ? sound._analyser : analyser;

        if (finalAnalyser) {
          const canvas = canvasRef.current;
          const { width, height } = canvas.parentElement?.getBoundingClientRect() || { width: 300, height: 300 };

          const visualizer = butterchurn.createVisualizer(ctx, canvas, {
            width,
            height
          });

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
      {/* 
         LAYOUT LOGIC:
         1. Always: Borderless.
         2. Inactive: Cover Image + Metadata Overlay (Old style).
         3. Active: Full Canvas + HUD.
      */}

      {isActive ? (
        <>
          {/* Visualizer Layer (z-0) */}
          <div className="absolute inset-0 z-0 w-full h-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />
          </div>

          {/* In-Tile HUD (z-10) */}
          <div className={`
                absolute bottom-0 left-0 w-full h-[15%] min-h-[48px] z-10
                bg-black/60 backdrop-blur-md
                flex items-center justify-between px-3
                border-t border-white/40
                ${isPlaying ? 'animate-pulse-border' : ''}
            `}>
            {/* Metadata */}
            <div className="flex flex-col w-2/3 overflow-hidden">
              <span className="font-mono text-[10px] text-green-400 uppercase truncate">
                {artist}
              </span>
              <span className="font-mono text-xs text-white font-bold uppercase truncate">
                {title}
              </span>
            </div>

            {/* Micro Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); restartTrack(); }}
                className="text-neutral-400 hover:text-white text-[10px]"
                title="Restart"
              >
                [R]
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="text-white hover:text-green-500 font-bold"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? '[ || ]' : '[ > ]'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Cover Image Background */}
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
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference">
            <div className="space-y-1">
              <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest group-hover:text-white transition-colors">
                {artist}
              </p>
              <p className="font-mono text-sm font-bold text-neutral-300 group-hover:text-green-500 transition-colors line-clamp-2">
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

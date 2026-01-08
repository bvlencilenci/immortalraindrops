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
  const { playTrack, currentlyPlayingId, isPlaying } = useAudioStore();
  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      if (!isActive || !canvasRef.current || !isPlaying) return;

      try {
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        const ctx = Howler.ctx;
        if (!ctx) return;

        // Assuming store sets up analyser or we mock it.
        // If we rely on useAudioStore.analyser:
        const { analyser, howl } = useAudioStore.getState();

        // Ensure connection logic (similar to previous step)
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
            if (!sound._analyser) console.warn("Visualizer connect error", e);
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
              // Resize capability?
              // visualizer.setCanvasSize(width, height) if resized.
              // For now, fixed on init.
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
      onClick={() => playTrack(id, url, title, artist)}
      className={`
        group relative aspect-square w-full
        border-r border-b border-[#222] bg-[#0a0a0a]
        cursor-pointer overflow-hidden
        transition-colors duration-100 ease-linear
        ${isActive ? 'bg-black' : 'hover:bg-[#111] hover:border-white/20'}
        rounded-none
      `}
    >
      {/* 
         LAYOUT LOGIC:
         1. Active: Full Canvas visualizer. No text, no image.
         2. Inactive: Cover Image (dimmed) + Metadata Overlay.
      */}

      {isActive ? (
        <div className="absolute inset-0 z-10 w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />
        </div>
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

          {/* Metadata Overlay (Only when inactive) */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 pointer-events-none mix-blend-difference">
            <div className="space-y-1">
              <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest group-hover:text-white transition-colors">
                - {artist}
              </p>
              <p className="font-mono text-sm font-bold text-neutral-300 group-hover:text-green-500 transition-colors line-clamp-2">
                - {title}
              </p>
            </div>
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-[#222] group-hover:border-white/20 transition-colors" />
        </>
      )}
    </div>
  );
};

export default Tile;

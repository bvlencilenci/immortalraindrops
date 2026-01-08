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
  const { playTrack, currentlyPlayingId, isPlaying } = useAudioStore();
  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      if (!isActive || !canvasRef.current || !isPlaying) return;

      // Visualizer Setup
      try {
        // Dynamic imports for browser-only libraries
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        // We need the audio context and a source node.
        // With Howler html5: true, this is tricky.
        // Assumption: Store/Howler has exposed the context.
        const ctx = Howler.ctx;
        if (!ctx) return;

        // We need to find the node. 
        // This is a hacky way to find the node associated with the currently playing sound.
        // In a real robust app we'd pass this via store.
        // But let's try to get it from the store's howl instance if we exported it?
        // Actually, for this demo, let's assume we can get an Analyser from the store if we implement the wiring there.
        // OR we just perform standard visualization.

        // To properly visualize with html5: true, we MUST have created a MediaElementSource.
        // If that logic isn't perfect in the store, visualizer will fail.
        // Let's implement a fallback "Fake" visualizer or try to hook it up? 
        // User requested: "Ensure Howler audio node is connected".

        // Let's assume the store successfully sets up an AnalyserNode and exposes it.
        // We need to update useAudioStore to expose `analyser`. 
        const { analyser, howl } = useAudioStore.getState();

        // If we have an analyser, we can use it.
        // If not, we try to create one from the howl access.
        let sourceNode: MediaElementAudioSourceNode | null = null;

        // Attempt to wire if not already wired
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (howl as any)?._sounds?.[0];
        if (sound && sound._node && !sound._visualizerConnected) {
          const audioNode = sound._node;
          audioNode.crossOrigin = "anonymous";

          try {
            // This might fail if already created elsewhere.
            sourceNode = ctx.createMediaElementSource(audioNode);
            const analyserNode = ctx.createAnalyser();
            sourceNode.connect(analyserNode);
            analyserNode.connect(ctx.destination);

            // Mark as connected to avoid double connection
            sound._visualizerConnected = true;
            sound._analyser = analyserNode;
          } catch (e) {
            // If already connected, maybe we stored it on the sound object?
            if (sound._analyser) {
              // reuse
            } else {
              console.warn("Could not connect visualizer", e);
            }
          }
        }

        const finalAnalyser = (sound && sound._analyser) ? sound._analyser : analyser;

        if (finalAnalyser) {
          const visualizer = butterchurn.createVisualizer(ctx, canvasRef.current, {
            width: canvasRef.current.width,
            height: canvasRef.current.height
          });

          visualizer.connectAudio(finalAnalyser);

          // Load a preset
          const presets = butterchurnPresets.getPresets();
          const presetKeys = Object.keys(presets);
          const randomPreset = presets[presetKeys[Math.floor(Math.random() * presetKeys.length)]];
          visualizer.loadPreset(randomPreset, 0.0); // 0.0 blend time

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
      // slight delay to ensure audio node is ready
      setTimeout(initVisualizer, 500);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      // We don't destroy the visualizer instance per se, but we stop rendering.
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
        flex flex-col justify-end p-4
        rounded-none
      `}
    >
      {isActive ? (
        <div className="absolute inset-0 z-0">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      ) : (
        coverImage && (
          <div className="absolute inset-0 z-0 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          </div>
        )
      )}

      <div className="z-10 flex flex-col gap-1 items-start relative mix-blend-difference">
        <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
          {artist}
        </span>
        <span className={`font-mono text-sm font-bold transition-colors line-clamp-2 ${isActive ? 'text-green-500' : 'text-neutral-300 group-hover:text-green-500'}`}>
          {title}
        </span>
      </div>

      <div className={`absolute top-0 right-0 w-2 h-2 border-l border-b ${isActive ? 'border-green-500' : 'border-[#222] group-hover:border-white/20'} transition-colors`} />
    </div>
  );
};

export default Tile;

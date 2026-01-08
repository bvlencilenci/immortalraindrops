'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebampStore } from '../store/useWebampStore';
import Image from 'next/image';

interface TileProps {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverImage?: string;
}

const Tile = ({ id, title, artist, url, coverImage }: TileProps) => {
  const { playTrack, currentlyPlayingId, webamp } = useWebampStore();
  const isPlaying = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isPlaying && webamp && canvasRef.current) {
      // Attempt to hijack the visualizer or render to this canvas.
      // Unfortunately, Webamp 1.4.2+ (standard) does not easily export `renderVisualizerTo` publicly in the type definition, 
      // but it is often available on the instance or via the underlying Butterchurn.

      // If the method exists (unchecked cast):
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (webamp as any).renderVisualizerTo === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (webamp as any).renderVisualizerTo(canvasRef.current);
      } else {
        // Fallback: If we can't render the visualizer, we might just show an "Active" state.
        // Or we could try to instantiate a new Butterchurn visualizer if we had access to the audio context.
        // For now, let's assume we can't easily do it without the API and just log.
        console.log("Webamp instance does not support renderVisualizerTo. Visualizer might not appear.");
      }
    }
  }, [isPlaying, webamp]);

  return (
    <div
      onClick={() => playTrack(id, url, title, artist)}
      className={`
        group relative aspect-square w-full
        border-r border-b border-[#222] bg-[#0a0a0a]
        cursor-pointer overflow-hidden
        transition-colors duration-100 ease-linear
        ${isPlaying ? 'bg-black' : 'hover:bg-[#111] hover:border-white/20'}
        flex flex-col justify-end p-4
        rounded-none
      `}
    >
      {isPlaying ? (
        <div className="absolute inset-0 z-0">
          <canvas ref={canvasRef} className="w-full h-full object-cover opacity-50" />

          {/* Fallback Pulse if Canvas is empty (visualizer fail protection) */}
          <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none mix-blend-overlay" />
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
        <span className={`font-mono text-sm font-bold transition-colors line-clamp-2 ${isPlaying ? 'text-green-500' : 'text-neutral-300 group-hover:text-green-500'}`}>
          {title}
        </span>
      </div>

      {/* Brutalist corner accent */}
      <div className={`absolute top-0 right-0 w-2 h-2 border-l border-b ${isPlaying ? 'border-green-500' : 'border-[#222] group-hover:border-white/20'} transition-colors`} />
    </div>
  );
};

export default Tile;

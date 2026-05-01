'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Tile from './Tile';
import { Track } from '../types';

export function HomeLivePanel({ isLive, streamTitle }: { isLive: boolean, streamTitle: string }) {
  return (
    <Link href="/live" className="w-full h-full relative group overflow-hidden outline-none block bg-black">
      {/* The Tile Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      <div className="relative z-20 w-full h-full p-8 md:p-12 pl-12 md:pl-20 flex flex-col justify-center">
        <div className="flex flex-col gap-4">
          {isLive && (
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] md:text-[12px] tracking-[0.3em] font-bold opacity-50 uppercase">
                TRANSMITTING
              </span>
            </div>
          )}
          <h3 className="text-xl md:text-3xl font-bold tracking-[0.05em] uppercase leading-[0.9] max-w-md">
            {isLive ? streamTitle : 'OFFLINE'}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function HomeArchivePanel({ recentTracks }: { recentTracks: Track[] }) {
  return (
    <Link href="/archive" className="w-full h-full relative group/panel overflow-hidden bg-black flex flex-col outline-none">
      {/* Background blurred tiles */}
      <div className="absolute inset-0 w-full h-full flex flex-col blur-[4px] opacity-65 group-hover/panel:blur-none group-hover/panel:opacity-100 transition-all duration-500 overflow-y-auto custom-scrollbar pointer-events-none">
        {recentTracks.map((track) => (
          <div className="w-full flex-shrink-0" key={track.id}>
            <Tile {...track} />
          </div>
        ))}
      </div>

      {/* The Tile Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover/panel:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />
    </Link>
  );
}

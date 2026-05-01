'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Tile from './Tile';
import { Track } from '../types';

export function HomeLivePanel({ isLive, streamTitle }: { isLive: boolean, streamTitle: string }) {
  const pathname = usePathname();
  const isActive = pathname === '/live';

  return (
    <Link href="/live" className="w-full h-full relative group overflow-hidden outline-none block bg-black">
      {/* The Tile Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      <div className="relative z-20 w-full h-full p-8 md:p-12 flex flex-col justify-center">
        <div className="absolute top-8 left-8 text-[10px] md:text-[11px] tracking-[0.5em] uppercase flex items-center drop-shadow-md">
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>[</span>
          <span className={`mx-2 ${isActive ? 'text-white' : 'text-[#ECEEDF]/70 group-hover:text-white'} transition-colors duration-200`}>LIVE</span>
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>]</span>
        </div>
        
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
            {isLive ? streamTitle : '—'}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function HomeArchivePanel({ recentTracks }: { recentTracks: Track[] }) {
  const pathname = usePathname();
  const isActive = pathname === '/archive';

  return (
    <div className="w-full h-full relative group/panel overflow-hidden bg-black flex flex-col">
      {/* Background blurred tiles */}
      <div className="absolute inset-0 w-full h-full flex flex-col blur-[4px] opacity-65 group-hover/panel:blur-none group-hover/panel:opacity-100 transition-all duration-500 overflow-y-auto custom-scrollbar">
        {recentTracks.map((track) => (
          <div className="w-full flex-shrink-0" key={track.id}>
            <Tile {...track} />
          </div>
        ))}
      </div>

      {/* The ARCHIVE Label - acts as navigation */}
      <Link 
        href="/archive"
        className="absolute top-8 left-8 z-50 text-[10px] md:text-[11px] tracking-[0.5em] uppercase flex items-center group/link cursor-pointer drop-shadow-md"
      >
        <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover/link:font-bold group-hover/link:text-white'} transition-all duration-200`}>[</span>
        <span className={`mx-2 ${isActive ? 'text-white' : 'text-[#ECEEDF]/70 group-hover/link:text-white'} transition-colors duration-200`}>ARCHIVE</span>
        <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover/link:font-bold group-hover/link:text-white'} transition-all duration-200`}>]</span>
      </Link>
    </div>
  );
}

'use client';

import Tile from './Tile';
import type { Track } from '../types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrackHistoryItem } from './ui/TrackHistoryItem';

interface HomeNowPlayingPanelProps {
  isLive: boolean;
  streamTitle: string;
  playbackHistory: { artist: string; title: string }[];
}

export function HomeNowPlayingPanel({ isLive, streamTitle, playbackHistory }: HomeNowPlayingPanelProps) {
  let displayArtist = '';
  let displayTitle = '';

  if (streamTitle && streamTitle !== 'OFFLINE' && streamTitle !== 'STANDBY' && streamTitle !== 'CONNECTING...') {
    const parts = streamTitle.split(/ - | — /);
    displayArtist = parts[0]?.trim();
    displayTitle = parts.slice(1).join(' - ')?.trim() || parts[0]?.trim();
  }

  const isOffline = !streamTitle || streamTitle === 'OFFLINE' || streamTitle === 'STANDBY';

  return (
    <div className="w-full h-full relative flex flex-col overflow-y-auto custom-scrollbar">
      {/* Now Playing block at the top */}
      <div className="flex flex-col shrink-0">
        <span className="text-[8px] tracking-[0.3em] text-[#ECEEDF]/25 uppercase mb-3">NOW PLAYING</span>
        {!isOffline ? (
          <>
            <span className="text-sm font-bold uppercase text-[#ECEEDF]/90 tracking-[0.08em] truncate">
              {displayArtist}
            </span>
            <span className="text-xs font-light text-[#ECEEDF]/50 tracking-[0.06em] truncate mt-1">
              {displayTitle}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest">
            NO SIGNAL
          </span>
        )}
      </div>

      {/* Thin rule */}
      <div className="border-t border-[#ECEEDF]/10 w-full mt-6 mb-6 shrink-0" />

      {/* Last Played list */}
      <div className="flex flex-col mb-8 min-h-0">
        <span className="text-[8px] tracking-[0.3em] text-[#ECEEDF]/25 uppercase mb-3">LAST PLAYED</span>
        {playbackHistory && playbackHistory.length > 0 ? (
          <div className="flex flex-col gap-2 min-w-0">
            {playbackHistory.slice(0, 50).map((track, i) => (
              <div key={i} className="flex flex-row items-baseline gap-3 min-w-0 overflow-hidden">
                <span className="text-[8px] text-[#ECEEDF]/15 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#ECEEDF]/70 truncate shrink-0 max-w-[50%]">
                  {track.artist}
                </span>
                <span className="text-[10px] font-light text-[#ECEEDF]/35 truncate">
                  {track.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest">
            NO HISTORY
          </span>
        )}
      </div>

      {/* Bottom CTA pinned with mt-auto */}
      <Link href="/live" className="mt-auto w-max text-[9px] tracking-[0.2em] uppercase text-[#ECEEDF]/30 hover:text-[#ECEEDF]/60 transition-colors shrink-0">
        → ENTER STATION
      </Link>
    </div>
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

import React from 'react';
import { TrackCover } from './TrackCover';

export interface Track {
  artist: string;
  title: string;
}

export interface TrackHistoryItemProps {
  track: Track;
  audioUrl?: string;
  className?: string;
  index?: number;
}

export function TrackHistoryItem({
  track,
  audioUrl,
  className = '',
  index
}: TrackHistoryItemProps) {
  const trackKey = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
  
  return (
    <div 
      className={`flex items-center gap-3 w-32 shrink-0 md:w-auto md:shrink py-1.5 md:py-2 px-2 winamp-track-inset group cursor-pointer transition-all duration-300 ease-out hover:bg-[#6DBF82]/15 ${className}`} 
      data-testid="track-history-item"
    >
      {index !== undefined && (
        <span className="hidden md:inline-block text-[14px] text-[#4A9E63] group-hover:text-[#6DBF82] font-normal tracking-widest w-5 shrink-0 select-none font-vt323 transition-colors duration-300">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      )}
      <TrackCover audioUrl={audioUrl} trackKey={trackKey} />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="hidden md:block text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/90 group-hover:text-white truncate select-all font-playfair transition-colors duration-300">
          {track.title}
        </span>
        <span className="text-[10px] font-light uppercase tracking-wider text-[#6DBF82]/70 group-hover:text-[#6DBF82] truncate select-all font-playfair transition-colors duration-300">
          {track.artist}
        </span>
      </div>
    </div>
  );
}

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
    <div className={`flex items-center gap-3 w-32 shrink-0 md:w-auto md:shrink py-0 md:py-2 border-b-0 md:border-b border-[#ECEEDF]/5 last:border-b-0 ${className}`} data-testid="track-history-item">
      {index !== undefined && (
        <span className="hidden md:inline-block text-[10px] text-[#4A9E63] font-normal tracking-widest w-5 shrink-0 select-none">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      )}
      <TrackCover audioUrl={audioUrl} trackKey={trackKey} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="hidden md:block text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/90 truncate select-all">
          {track.title}
        </span>
        <span className="text-[10px] font-light uppercase tracking-wider text-[#6DBF82] truncate select-all">
          {track.artist}
        </span>
      </div>
    </div>
  );
}

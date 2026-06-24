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
    <div className={`flex items-center gap-3 py-2 border-b border-[#ECEEDF]/5 last:border-b-0 ${className}`} data-testid="track-history-item">
      {index !== undefined && (
        <span className="text-[10px] text-[#ECEEDF]/20 font-normal tracking-widest w-5 shrink-0 select-none">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      )}
      <TrackCover audioUrl={audioUrl} trackKey={trackKey} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/90 truncate select-all">
          {track.artist}
        </span>
        <span className="text-[10px] font-light lowercase tracking-wider text-[#ECEEDF]/45 truncate select-all">
          {track.title}
        </span>
      </div>
    </div>
  );
}

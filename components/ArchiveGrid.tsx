'use client';

import { useEffect } from 'react';
import Tile from './Tile';
import { useAudioStore } from '../store/useAudioStore';
import { Track } from '../types';

interface ArchiveGridProps {
  tracks: Track[];
  isAdmin?: boolean;
  onDelete?: (tileId: string, index: number, audioExt: string, imageExt: string) => void;
  onEdit?: (track: Track) => void;
  compact?: boolean;
}

const ArchiveGrid = ({ tracks, isAdmin, onDelete, onEdit, compact }: ArchiveGridProps) => {
  const setPlaylist = useAudioStore((state) => state.setPlaylist);

  useEffect(() => {
    setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  return (
    <div className="flex-1 w-full flex flex-col pt-4 pb-32 max-w-7xl mx-auto px-4 md:px-8">
      {tracks.map((track) => (
        <Tile
          key={track.id}
          id={track.id}
          title={track.title}
          artist={track.artist}
          tile_index={track.tile_index}
          media_type={track.media_type}
          tile_id={track.tile_id}
          audio_ext={track.audio_ext}
          image_ext={track.image_ext}
          isAdmin={isAdmin}
          onDelete={() => onDelete?.(track.tile_id, track.tile_index, track.audio_ext || 'wav', track.image_ext || 'jpg')}
          onEdit={() => onEdit?.(track)}
          genre={track.genre}
          release_date={track.release_date}
          duration={track.duration}
          created_at={track.created_at || new Date().toISOString()}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default ArchiveGrid;

'use client';

import { useEffect } from 'react';
import Tile from './Tile';
import { useAudioStore } from '../store/useAudioStore';
import { Track } from '../types';

interface ArchiveGridProps {
  tracks: Track[];
}

const ArchiveGrid = ({ tracks }: ArchiveGridProps) => {
  const setPlaylist = useAudioStore((state) => state.setPlaylist);

  useEffect(() => {
    setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  return (
    <div className="flex-1 w-full grid grid-cols-2 gap-0 pb-32">
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
          release_date={track.release_date}
          genre={track.genre || null}
          duration={track.duration || null}
          created_at={track.created_at || new Date().toISOString()} // Fallback for strict type satisfaction
        />
      ))}
    </div>
  );
};

export default ArchiveGrid;



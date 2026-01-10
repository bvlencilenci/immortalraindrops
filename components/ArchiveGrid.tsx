'use client';

import { useEffect } from 'react';
import Tile from './Tile';
import { useAudioStore, Track } from '../store/useAudioStore';

interface ArchiveGridProps {
  tracks: Track[];
}

const ArchiveGrid = ({ tracks }: ArchiveGridProps) => {
  const setPlaylist = useAudioStore((state) => state.setPlaylist);

  useEffect(() => {
    setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  return (
    <div className="flex-1 w-full grid grid-cols-2 gap-0">
      {tracks.map((track) => (
        <Tile
          key={track.id}
          id={track.id}
          title={track.title}
          artist={track.artist}
          tile_index={track.tileIndex || 0}
          media_type={track.media_type || 'song'}
          audio_key={track.audio_key}
          image_key={track.image_key}
          r2_key={track.r2_key}
          url={track.url || ''}
          coverImage={track.coverImage}
          genre={track.genre}
        />
      ))}
    </div>
  );
};

export default ArchiveGrid;



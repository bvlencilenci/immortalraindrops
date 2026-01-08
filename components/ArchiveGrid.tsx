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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full min-h-screen m-0 p-0 pt-[60px] gap-0">
      {tracks.map((track) => (
        <Tile
          key={track.id}
          id={track.id}
          title={track.title}
          artist={track.artist}
          url={track.url}
          coverImage={track.coverImage}
        />
      ))}
    </div>
  );
};

export default ArchiveGrid;



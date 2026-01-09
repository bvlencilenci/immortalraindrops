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
    <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full gap-0 p-0 m-0">
      {tracks.slice(0, 2).map((track, index) => (
        <div key={track.id} className={index === 1 ? 'hidden md:block h-full w-full' : 'h-full w-full'}>
          <Tile
            id={track.id}
            title={track.title}
            artist={track.artist}
            url={track.url}
            coverImage={track.coverImage}
          />
        </div>
      ))}
    </div>
  );
};

export default ArchiveGrid;



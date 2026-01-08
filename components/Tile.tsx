'use client';

import { useWebampStore } from '../store/useWebampStore';

interface TileProps {
  id: string;
  title: string;
  artist: string;
  url: string;
}

const Tile = ({ title, artist, url }: TileProps) => {
  const playTrack = useWebampStore((state) => state.playTrack);

  return (
    <div
      onClick={() => playTrack(url, title, artist)}
      className="
        group relative aspect-square w-full
        border-r border-b border-[#222] bg-[#0a0a0a]
        cursor-pointer overflow-hidden
        transition-colors duration-100 ease-linear
        hover:bg-[#111] hover:border-white/20
        flex flex-col justify-end p-4
        rounded-none
      "
    >
      {/* Active/Playing indicator could go here */}

      <div className="z-10 flex flex-col gap-1 items-start">
        <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
          {artist}
        </span>
        <span className="font-mono text-sm text-neutral-300 font-bold group-hover:text-green-500 transition-colors line-clamp-2">
          {title}
        </span>
      </div>

      {/* Brutalist corner accent */}
      <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-[#222] group-hover:border-white/20 transition-colors" />
    </div>
  );
};

export default Tile;

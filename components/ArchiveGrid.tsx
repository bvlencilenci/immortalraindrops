'use client';

import { useEffect, useMemo, useState } from 'react';
import Tile from './Tile';
import { useAudioStore } from '../store/useAudioStore';
import { Track } from '../types';

interface ArchiveGridProps {
  tracks: Track[];
  isAdmin?: boolean;
  onDelete?: (tileId: string, index: number, audioExt: string, imageExt: string) => void;
  onEdit?: (track: Track) => void;
  compact?: boolean;
  variant?: 'default' | 'archive';
}

const ArchiveGrid = ({ tracks, isAdmin, onDelete, onEdit, compact, variant = 'default' }: ArchiveGridProps) => {
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('ALL');

  useEffect(() => {
    setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  const genres = useMemo(
    () => Array.from(new Set(tracks.map((track) => track.genre).filter(Boolean))).sort(),
    [tracks]
  );

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tracks.filter((track) => {
      const matchesGenre = genre === 'ALL' || track.genre === genre;
      const haystack = `${track.title || ''} ${track.artist || ''} ${track.genre || ''}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesGenre && matchesQuery;
    });
  }, [tracks, query, genre]);

  if (variant !== 'archive') {
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
  }

  return (
    <div className="mx-auto -mt-32 flex h-full w-full max-w-6xl flex-col gap-2 font-mono md:gap-3">
      <section className="relative shrink-0 overflow-hidden border border-white/10 bg-black/35 p-3 backdrop-blur-md md:p-4">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                rgba(255,255,255,0.08) 0px,
                rgba(255,255,255,0.08) 1px,
                transparent 1px,
                transparent 5px
              )
            `,
          }}
        />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="max-w-3xl">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.38em] text-lime-300">
              ARCHIVE / IMMORTAL RAINDROPS
            </div>
            <h1 className="text-[2.35rem] font-bold uppercase leading-none tracking-normal text-[#fffbea] md:text-[3rem]">
              ORIGINAL MUSIC CATALOG
            </h1>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[#ECEEDF]/62 md:text-sm">
              Whatever we&apos;ve been making recently and don&apos;t cringe sharing
            </p>
          </div>
        </div>
      </section>

      <section className="shrink-0 border border-white/10 bg-black/25 p-2.5 backdrop-blur-md md:p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase tracking-[0.28em] text-[#ECEEDF]/45">
              SEARCH TITLE / ARTIST / GENRE
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="TYPE TO FILTER THE ARCHIVE"
              className="w-full border border-white/10 bg-black/35 px-3 py-2 text-[12px] uppercase tracking-[0.12em] text-[#ECEEDF] outline-none backdrop-blur-[2px] placeholder:text-[#ECEEDF]/25 focus:border-lime-300/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase tracking-[0.28em] text-[#ECEEDF]/45">
              GENRE FILTER
            </label>
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className="w-full border border-white/10 bg-black/35 px-3 py-2 text-[12px] uppercase tracking-[0.12em] text-[#ECEEDF] outline-none backdrop-blur-[2px] focus:border-lime-300/50"
            >
              <option value="ALL">ALL GENRES</option>
              {genres.map((item) => (
                <option key={item || 'UNKNOWN'} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2 text-[10px] uppercase tracking-[0.22em] text-[#ECEEDF]/45">
          <span>{filteredTracks.length} TRACKS AVAILABLE</span>
          <span>{genre === 'ALL' ? 'UNFILTERED' : genre}</span>
        </div>
      </section>

      <section className="flex h-[330px] flex-none flex-col overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md md:h-[320px]">
        <div className="grid shrink-0 grid-cols-[44px_1fr_72px] border-b border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.24em] text-[#ECEEDF]/35 md:grid-cols-[64px_82px_1fr_240px_86px] md:px-4">
          <span>No.</span>
          <span className="hidden md:block">Visual</span>
          <span>Track</span>
          <span className="hidden md:block">Metadata</span>
          <span className="text-right">Play</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {filteredTracks.map((track) => (
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
              archiveVariant
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArchiveGrid;

'use client';

import { useAudioStore } from '../store/useAudioStore';

const AudioBar = () => {
  const {
    currentlyPlayingId,
    trackTitle,
    trackArtist,
    isPlaying,
    togglePlay,
    skipTrack,
    restartTrack,
    adjustVolume,
    volume,
    seek,
    duration
  } = useAudioStore();

  if (!currentlyPlayingId) return null;

  const progressPercent = duration > 0 ? (seek / duration) * 100 : 0;
  const volPercent = volume * 100;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[48px] bg-[#050505] border-t border-[#222] z-[40] flex items-center justify-between px-4 font-mono text-xs select-none">
      {/* LEFT: Metadata (Migrated from Tile) */}
      <div className="flex items-center gap-4 w-1/3 overflow-hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-white font-bold uppercase truncate">
            {trackTitle}
          </span>
          <span className="text-neutral-500 uppercase truncate">
            {trackArtist}
          </span>
        </div>
      </div>

      {/* CENTER: Transport Controls */}
      <div className="flex items-center justify-center w-1/3 gap-4">
        <button
          onClick={restartTrack}
          className="hover:text-white text-neutral-500 transition-colors uppercase"
        >
          [RESTART]
        </button>
        <button
          onClick={togglePlay}
          className="hover:text-green-500 text-white font-bold transition-colors uppercase min-w-[60px] text-center"
        >
          [{isPlaying ? 'PAUSE' : 'PLAY'}]
        </button>
        <button
          onClick={skipTrack}
          className="hover:text-white text-neutral-500 transition-colors uppercase"
        >
          [SKIP]
        </button>
      </div>

      {/* RIGHT: Volume & Progress */}
      <div className="flex items-center justify-end w-1/3 gap-6">
        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => adjustVolume(volume - 0.1)} className="hover:text-white text-neutral-500">
            [-]
          </button>
          <span className="text-neutral-300 w-[40px] text-center">
            VOL {Math.round(volPercent)}%
          </span>
          <button onClick={() => adjustVolume(volume + 0.1)} className="hover:text-white text-neutral-500">
            [+]
          </button>
        </div>

        {/* Progress Bar (Visual only) */}
        <div className="w-[100px] h-[1px] bg-[#222] relative hidden sm:block">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioBar;

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
          <span className="text-white font-bold uppercase tracking-tighter truncate">
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
          className="hud-btn px-2 py-1 uppercase"
        >
          RESTART
        </button>
        <button
          onClick={togglePlay}
          className="hud-btn px-4 py-1 uppercase font-bold"
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={skipTrack}
          className="hud-btn px-2 py-1 uppercase"
        >
          SKIP
        </button>
      </div>

      {/* RIGHT: Volume & Progress */}
      <div className="flex items-center justify-end w-1/3 gap-6">
        {/* Volume Controls */}
        <div className="flex items-center gap-2 w-[100px]">
          <span className="text-neutral-500 text-[10px]">VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => adjustVolume(parseFloat(e.target.value))}
            className="retro-range"
          />
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

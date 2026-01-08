'use client';

import { useAudioStore } from '../store/useAudioStore';

const AudioBar = () => {
  const {
    currentlyPlayingId,
    trackTitle,
    isPlaying,
    togglePlay,
    seek,
    duration
  } = useAudioStore();

  if (!currentlyPlayingId) return null;

  const progressPercent = duration > 0 ? (seek / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[48px] bg-[#050505] border-t border-[#222] z-50 flex items-center justify-between px-4 font-mono text-xs select-none">
      {/* LEFT: Track Info */}
      <div className="flex items-center gap-4 w-1/3 overflow-hidden">
        <span className="text-neutral-500 uppercase">
          {currentlyPlayingId}
        </span>
        <span className="text-white uppercase truncate">
          {trackTitle}
        </span>
      </div>

      {/* CENTER: Play Controls */}
      <div className="flex items-center justify-center w-1/3">
        <button
          onClick={togglePlay}
          className="hover:text-green-500 hover:bg-[#111] px-2 py-1 transition-colors uppercase"
        >
          [{isPlaying ? 'STOP' : 'PLAY'}]
        </button>
      </div>

      {/* RIGHT: Progress */}
      <div className="flex items-center justify-end w-1/3 gap-4">
        <div className="w-full max-w-[200px] h-[1px] bg-[#222] relative">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-neutral-500 min-w-[40px] text-right">
          {Math.floor(seek)}/{Math.floor(duration)}s
        </span>
      </div>
    </div>
  );
};

export default AudioBar;

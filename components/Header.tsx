'use client';

import { useAudioStore } from '../store/useAudioStore';

const Header = () => {
  const {
    trackTitle,
    trackArtist,
    isPlaying,
    togglePlay,
    skipTrack,
    skipBack,
    seek,
    duration,
    volume,
    adjustVolume,
    currentlyPlayingId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seekTo
  } = useAudioStore();

  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;
  const isPlayerActive = !!currentlyPlayingId;

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return "/speaker-simple-slash.svg";
    if (volume <= 0.3) return "/speaker-simple-low.svg";
    if (volume <= 0.7) return "/speaker-simple-none.svg";
    return "/speaker-simple-high.svg";
  };

  return (
    <header className="relative w-full h-20 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 md:px-6 border-b border-white/10 text-white overflow-hidden flex-shrink-0">
      {/* Zone 1: Left - Identity & Meta */}
      <div className="flex flex-col justify-center min-w-0 z-10">
        <h1 className="font-mono text-[16px] font-bold uppercase tracking-[0.2em] leading-none truncate">
          Immortal Raindrops
        </h1>
        {isPlayerActive && (
          <div className="flex items-center gap-2 mt-2 overflow-hidden">
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none truncate shrink-0">
              {trackArtist}
            </span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full shrink-0" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest leading-none truncate">
              {trackTitle}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-auto">
        {isPlayerActive && (
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="group flex items-center justify-center transition-all duration-200"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-6 h-6 invert opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="group flex items-center justify-center bg-white/5 hover:bg-white/10 w-12 h-12 rounded-full transition-all duration-200 border border-white/10"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-5 h-5 invert opacity-80 group-hover:opacity-100"
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipTrack(); }}
              className="group flex items-center justify-center transition-all duration-200"
              title="Skip"
            >
              <img src="/skip-forward.svg" alt="Skip" className="w-6 h-6 invert opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: Right - Volume & Future Nav */}
      <div className="flex-1 flex justify-end items-center gap-8 z-10">
        {isPlayerActive && (
          <div className="flex items-center gap-6 h-full">
            {/* Timer */}
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums whitespace-nowrap">
              {formatTime(seek)} / {formatTime(duration)}
            </span>

            {/* Volume Control Wrapper */}
            <div className="relative group py-2">
              <button
                className="flex items-center justify-center transition-all duration-200 relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustVolume(volume > 0 ? 0 : 0.5);
                }}
              >
                <img
                  src={getVolumeIcon()}
                  alt="Volume"
                  className="w-5 h-5 invert opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </button>

              {/* Thought-Bubble Volume Slider */}
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="bg-white p-3 rounded-xl shadow-xl flex items-center justify-center min-w-[120px] relative">
                  {/* Triangle Pointer */}
                  <div className="absolute -top-1 right-3 w-3 h-3 bg-white rotate-45" />

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      adjustVolume(parseFloat(e.target.value));
                    }}
                    className="w-24 h-1 bg-black/20 appearance-none cursor-pointer fader-thumb accent-black"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Reserved area for future nav */}
        <div className="w-6 h-6 flex items-center justify-center opacity-0 pointer-events-none" />
      </div>

      {/* 1px Master Seeker Line at Bottom (Full Width) */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px] cursor-pointer group/seeker z-[60]"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          useAudioStore.getState().seekTo(percent * duration);
        }}
      >
        <div className="absolute inset-0 bg-white/5" />
        <div
          className="h-full bg-white transition-[width] duration-300 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Seeker Handle (Only visible on hover) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[10px] bg-white opacity-0 group-hover/seeker:opacity-100 transition-opacity shadow-[0_0_10px_white]" />
        </div>
      </div>
    </header>
  );
};

export default Header;

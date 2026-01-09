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
    <header className="relative w-full h-20 z-50 bg-black/80 backdrop-blur-md grid grid-cols-[1fr_auto_1fr] items-center px-[20px] border-b border-white/10 text-white overflow-hidden flex-shrink-0">
      {/* Zone 1: Left - Identity & Meta */}
      <div className="flex flex-col justify-center min-w-0">
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

      {/* Zone 2: Center - True Viewport Player */}
      <div className="flex flex-col items-center justify-center pointer-events-auto">
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
      <div className="flex justify-end items-center gap-8">
        {isPlayerActive && (
          <div className="flex items-center gap-6">
            {/* Timer */}
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums whitespace-nowrap">
              {formatTime(seek)} / {formatTime(duration)}
            </span>

            {/* Volume Control */}
            <div className="relative flex items-center group/volume h-20">
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
                  className="w-5 h-5 invert opacity-60 group-hover/volume:opacity-100 transition-opacity"
                />
              </button>

              {/* Slider - Appearing on hover without shifting layout */}
              <div className="absolute right-full mr-4 opacity-0 scale-x-0 group-hover/volume:opacity-100 group-hover/volume:scale-x-100 transition-all duration-300 origin-right flex items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
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
                  className="w-24 h-1 bg-white/20 appearance-none cursor-pointer fader-thumb accent-white hover:accent-neutral-200"
                />
              </div>
            </div>
          </div>
        )}
        {/* Reserved area for future nav */}
        <div className="w-10 h-10 flex items-center justify-center opacity-0 pointer-events-none">
          {/* Placeholder for future buttons */}
        </div>
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

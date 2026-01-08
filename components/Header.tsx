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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seekTo
  } = useAudioStore();

  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return "/speaker-simple-slash.svg";
    if (volume < 0.3) return "/speaker-simple-low.svg";
    if (volume < 0.7) return "/speaker-simple-none.svg";
    return "/speaker-simple-high.svg";
  };

  return (
    <header className="fixed top-0 left-0 w-full h-[60px] z-[100] border-b border-[#222] bg-[#050505cc] backdrop-blur-md flex items-center relative overflow-hidden">
      {/* 1. Branding (Left aligned) */}
      <div className="pl-6 z-20">
        <h1 className="font-mono text-xs text-[#444] uppercase tracking-[0.3em]">
          Immortal Raindrops
        </h1>
      </div>

      {/* 2. Absolute Centered Controls */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); skipBack(); }}
            className="mechanical-btn w-10 h-10 flex items-center justify-center"
            title="Previous / Restart"
          >
            <img src="/skip-back.svg" alt="Back" className="w-5 h-5 invert opacity-80" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="mechanical-btn w-12 h-12 flex items-center justify-center"
            title={isPlaying ? "Pause" : "Play"}
          >
            <img
              src={isPlaying ? "/pause.svg" : "/play.svg"}
              alt={isPlaying ? "Pause" : "Play"}
              className="w-6 h-6 invert opacity-80"
            />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); skipTrack(); }}
            className="mechanical-btn w-10 h-10 flex items-center justify-center"
            title="Skip"
          >
            <img src="/skip-forward.svg" alt="Skip" className="w-5 h-5 invert opacity-80" />
          </button>
        </div>

        {/* Static Volume: Icon + Fader on the right */}
        <div className="flex items-center gap-3 ml-2 pr-4 border-r border-white/10">
          <img src={getVolumeIcon()} alt="Vol" className="w-4 h-4 invert opacity-60" />
          <div
            className="h-[2px] w-24 bg-white/20 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              adjustVolume(percent);
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-white"
              style={{ width: `${volume * 100}%` }}
            />
            <div
              className="absolute top-1/2 w-1.5 h-1.5 bg-white -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              style={{ left: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Metadata & Timer (Right side) */}
      <div className="flex-1 flex items-center justify-end pr-1 z-20 overflow-hidden">
        <div className="flex flex-col items-end pr-4 max-w-[200px] overflow-hidden">
          {trackTitle ? (
            <>
              <span className="font-mono text-[10px] md:text-xs text-neutral-400 lowercase truncate leading-tight pl-1">
                - {trackArtist}
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest truncate leading-tight pl-1">
                {trackTitle}
              </span>
            </>
          ) : (
            <span className="font-mono text-[9px] md:text-xs text-white/10 uppercase tabular-nums">
              READY_STATE_01
            </span>
          )}
        </div>
      </div>

      {/* Precision Timer: Absolute Far Right Gap 4px */}
      <div className="absolute right-1 bottom-1 z-30 pointer-events-none pr-1">
        <span className="font-mono text-[9px] md:text-xs text-white/40 tabular-nums text-right block w-[80px]">
          {formatTime(seek)} / {formatTime(duration)}
        </span>
      </div>

      {/* Master Seeker: 1px line at the bottom edge */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px] cursor-pointer group/seeker z-10"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          seekTo(percent * duration);
        }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div
          className="h-full bg-white pointer-events-auto relative"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

export default Header;

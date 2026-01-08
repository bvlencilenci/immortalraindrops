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
    if (volume <= 0.3) return "/speaker-simple-low.svg";
    if (volume <= 0.7) return "/speaker-simple-none.svg";
    return "/speaker-simple-high.svg";
  };

  return (
    <header className="fixed top-0 left-0 w-full h-[64px] z-[100] border-b border-[#222] bg-[#050505cc] backdrop-blur-md flex items-center justify-between px-1 relative overflow-hidden">
      {/* 1. Identity & Metadata (Left Group with 4px Padding) */}
      <div className="flex items-center z-20 overflow-hidden pl-1 h-full">
        <h1 className="font-mono text-xs text-white uppercase tracking-[0.3em] whitespace-nowrap mr-8">
          Immortal Raindrops
        </h1>
        <div className="flex flex-col min-w-0 border-l border-white/10 pl-6 py-1 scrolling-metadata-mask overflow-hidden max-w-[400px]">
          {trackTitle ? (
            <div className="animate-marquee whitespace-nowrap flex flex-col justify-center h-full">
              <div className="flex items-center">
                <span className="font-mono text-[9px] md:text-[10px] text-neutral-400 lowercase leading-none">
                  {trackArtist}
                </span>
                <span className="mx-8 text-white/10 opacity-0">•</span>
                <span className="font-mono text-[9px] md:text-[10px] text-neutral-400 lowercase leading-none">
                  {trackArtist}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest leading-none">
                  {trackTitle}
                </span>
                <span className="mx-8 text-white/10 opacity-0">•</span>
                <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest leading-none">
                  {trackTitle}
                </span>
              </div>
            </div>
          ) : (
            <span className="font-mono text-[9px] md:text-xs text-white/10 uppercase tabular-nums">
              READY_STATE_01
            </span>
          )}
        </div>
      </div>

      {/* 2. Console (Right Group) */}
      <div className="flex items-center gap-6 z-20 pr-1 h-full">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); skipBack(); }}
            className="mechanical-btn w-9 h-9 flex items-center justify-center border-none"
            title="Previous / Restart"
          >
            <img src="/skip-back.svg" alt="Back" className="w-4 h-4 invert opacity-80" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="mechanical-btn w-11 h-11 flex items-center justify-center border-none"
            title={isPlaying ? "Pause" : "Play"}
          >
            <img
              src={isPlaying ? "/pause.svg" : "/play.svg"}
              alt={isPlaying ? "Pause" : "Play"}
              className="w-5 h-5 invert opacity-80"
            />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); skipTrack(); }}
            className="mechanical-btn w-9 h-9 flex items-center justify-center border-none"
            title="Skip"
          >
            <img src="/skip-forward.svg" alt="Skip" className="w-4 h-4 invert opacity-80" />
          </button>
        </div>

        {/* Dynamic Under-Icon Volume */}
        <div className="relative group/vol-under flex flex-col items-center justify-center w-12 h-full">
          <img src={getVolumeIcon()} alt="Vol" className="w-4 h-4 invert opacity-60 cursor-pointer" />
          <div className="absolute top-[48px] w-0 group-hover/vol-under:w-16 overflow-hidden transition-all duration-300 ease-out flex items-center justify-center">
            <div
              className="h-[1px] w-14 bg-white/20 relative cursor-pointer"
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

        {/* Precision Timer (Right Edge Gap 4px) */}
        <div className="min-w-[100px] text-right flex items-center pr-1 h-full">
          <span className="font-mono text-[10px] md:text-xs text-white/40 tabular-nums uppercase tracking-[0.2em] whitespace-nowrap">
            {formatTime(seek)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Persistence Layer: Bottom Seeker 1px */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px] cursor-pointer group/seeker z-10"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          seekTo(percent * duration);
        }}
      >
        <div className="absolute inset-0 bg-white/5" />
        <div
          className="h-full bg-white relative"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

export default Header;

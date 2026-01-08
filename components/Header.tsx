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
        <h1 className="font-mono text-xs text-white uppercase tracking-[0.3em] whitespace-nowrap mr-32">
          Immortal Raindrops
        </h1>
        <div className="flex flex-col min-w-0 pl-0 py-1 overflow-hidden max-w-[400px]">
          {trackTitle ? (
            <div className="flex flex-col justify-center h-full">
              <span className="font-mono text-[9px] md:text-[10px] text-neutral-400 lowercase leading-none truncate">
                {trackArtist}
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest leading-none mt-1 truncate">
                {trackTitle}
              </span>
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
        {/* Playback Controls (Transparent, White Icons) */}
        <div className="flex items-center gap-1 bg-transparent border-none">
          <button
            onClick={(e) => { e.stopPropagation(); skipBack(); }}
            className="w-8 h-8 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
            title="Previous / Restart"
          >
            <img src="/skip-back.svg" alt="Back" className="w-4 h-4 invert opacity-80" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-10 h-10 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
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
            className="w-8 h-8 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
            title="Skip"
          >
            <img src="/skip-forward.svg" alt="Skip" className="w-4 h-4 invert opacity-80" />
          </button>
        </div>

        {/* Console Seeker Path (Fixed Height) */}
        <div className="flex items-center group relative h-full">
          {/* Volume Group (Under-Icon Fader) */}
          <div className="relative flex items-center h-full group/volume ml-2">
            <button
              className="w-8 h-8 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity relative z-10"
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            >

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

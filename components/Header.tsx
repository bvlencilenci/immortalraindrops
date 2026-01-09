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
    <header className="sticky top-0 left-0 w-full h-20 z-50 bg-[#050505cc] backdrop-blur-md flex items-center justify-between px-1 border-b border-white/10 text-white overflow-hidden flex-shrink-0">
      {/* 1. Identity & Metadata Group */}
      <div className="flex items-center z-20 overflow-hidden pl-1 h-full gap-8">
        <h1 className="font-mono text-[15px] font-bold uppercase tracking-tighter leading-none pl-1">
          Immortal Raindrops
        </h1>

        {isPlayerActive && (
          <div className="flex flex-col py-1 overflow-hidden max-w-[450px] h-full justify-center">
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none truncate pl-1">
              {trackArtist}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest leading-none mt-1 truncate pl-1">
              {trackTitle}
            </span>
          </div>
        )}
      </div>

      {/* 2. Hardware Console Group (Conditional Visibility) */}
      {isPlayerActive && (
        <div className="flex items-center gap-4 z-20 pr-1 h-full">
          {/* Playback Controls */}
          <div className="flex items-center gap-1 bg-transparent border-none h-full">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="w-10 h-10 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-[1.2em] h-[1.2em] invert opacity-80" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-12 h-12 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-[1.2em] h-[1.2em] invert opacity-80"
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipTrack(); }}
              className="w-10 h-10 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity"
              title="Skip"
            >
              <img src="/skip-forward.svg" alt="Skip" className="w-[1.2em] h-[1.2em] invert opacity-80" />
            </button>
          </div>

          {/* Volume & Timer */}
          <div className="flex items-center gap-3 h-full">
            <div className="relative flex items-center h-full group/volume">
              <button
                className="w-8 h-8 flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustVolume(volume > 0 ? 0 : 0.5);
                }}
              >
                <img
                  src={getVolumeIcon()}
                  alt="Volume"
                  className="w-[1.2em] h-[1.2em] invert opacity-80"
                />
              </button>

              <div className="absolute top-[calc(50%+14px)] left-1/2 -translate-x-1/2 w-0 group-hover/volume:w-24 h-[1px] bg-white transition-all duration-300 pointer-events-none opacity-0 group-hover/volume:opacity-100 overflow-hidden flex items-center">
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
                  className="w-full h-full bg-transparent appearance-none cursor-pointer fader-thumb pointer-events-auto"
                />
              </div>
            </div>

            <div className="min-w-[80px] text-right flex items-center pr-1 h-full">
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums whitespace-nowrap">
                {formatTime(seek)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1px Master Seeker Line at Bottom (Full Width) */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px] cursor-pointer group/seeker z-30"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          useAudioStore.getState().seekTo(percent * duration);
        }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div
          className="h-full bg-white relative"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

export default Header;

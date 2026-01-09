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
    <header className="relative w-full h-20 z-50 bg-black/80 backdrop-blur-md flex items-center px-[20px] border-b border-white/10 text-white overflow-hidden flex-shrink-0">
      {/* Zone 1: Left-Anchored Identity */}
      <div className="flex flex-col z-10">
        <h1 className="font-mono text-[16px] font-bold uppercase tracking-[0.2em] leading-none">
          Immortal Raindrops
        </h1>
        {isPlayerActive && (
          <div className="flex flex-col mt-2">
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none truncate">
              {trackArtist}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest leading-none mt-1 truncate">
              {trackTitle}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      {isPlayerActive && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          {/* Transport Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity p-2"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-[1.4em] h-[1.4em] invert opacity-80" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity p-2"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-[1.4em] h-[1.4em] invert opacity-80"
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipTrack(); }}
              className="flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity p-2"
              title="Skip"
            >
              <img src="/skip-forward.svg" alt="Skip" className="w-[1.4em] h-[1.4em] invert opacity-80" />
            </button>
          </div>

          {/* Player Seeker/Metadata Line */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center justify-center border-none bg-transparent hover:opacity-50 transition-opacity relative p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustVolume(volume > 0 ? 0 : 0.5);
                }}
              >
                <img
                  src={getVolumeIcon()}
                  alt="Volume"
                  className="w-[1.4em] h-[1.4em] invert opacity-80"
                />
              </button>
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums whitespace-nowrap">
                {formatTime(seek)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Zone 3: Right Navigation Space */}
      <div className="flex-1" />

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

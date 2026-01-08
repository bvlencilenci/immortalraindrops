'use client';

import { useAudioStore } from '../store/useAudioStore';

const Header = () => {
  const {
    trackTitle,
    trackArtist,
    seek,
    duration,
    volume,
    adjustVolume,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seekTo
  } = useAudioStore();

  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;

  return (
    <header className="fixed top-0 left-0 w-full h-[60px] z-[100] border-b border-[#222] bg-[#050505cc] backdrop-blur-md flex">
      {/* 1. Branding Section (Left 75%) */}
      <div className="flex-1 flex items-center pl-6 border-r border-[#222]">
        <h1 className="font-mono text-xs text-[#444] uppercase tracking-[0.3em]">
          Immortal Raindrops // Archive_Node_01
        </h1>
      </div>

      {/* 2. Master Player Section (Right 25%) */}
      <div className="w-1/4 h-full relative flex items-center overflow-hidden">
        {/* Metadata: artist (lower) - TITLE (UPPER) */}
        <div className="flex flex-col h-full justify-center pl-6 pr-16 overflow-hidden">
          {trackTitle ? (
            <>
              <span className="font-mono text-[10px] text-neutral-400 lowercase truncate leading-none mb-1">
                - {trackArtist || 'unknown'}
              </span>
              <span className="font-mono text-xs font-bold text-white uppercase tracking-widest truncate leading-none">
                {trackTitle}
              </span>
            </>
          ) : (
            <span className="font-mono text-xs text-[#444] uppercase tracking-widest">
              Standby_
            </span>
          )}
        </div>

        {/* Universal Volume: Needle Slider at far right (6% margin) */}
        <div
          className="header-volume-container h-10 w-[1px] bg-white/20 absolute right-[6%] top-1/2 -translate-y-1/2 transform rotate-0"
          style={{ width: '40px', right: '6%', transform: 'translateY(-50%) rotate(-90deg)' }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => adjustVolume(parseFloat(e.target.value))}
            className="header-needle-range w-full h-full cursor-pointer"
          />
        </div>
      </div>

      {/* Master Seeker: 1px line at the bottom edge */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 cursor-pointer group/seeker h-2 flex items-end"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          seekTo(percent * duration);
        }}
      >
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10" />
        <div
          className="h-[1px] bg-white transition-all duration-100 ease-linear pointer-events-none relative"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

export default Header;

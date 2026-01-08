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
      <div className="w-3/4 flex items-center pl-6 border-r border-[#222]">
        <h1 className="font-mono text-xs text-[#444] uppercase tracking-[0.3em]">
          Immortal Raindrops
        </h1>
      </div>

      {/* 2. Master Player Section (Right 25%) */}
      <div className="w-1/4 h-full relative flex items-center overflow-hidden">
        {/* Metadata: artist (lower) - TITLE (UPPER) with pl-6 */}
        <div className="flex flex-col h-full justify-center pl-6 pr-16 overflow-hidden">
          {trackTitle ? (
            <>
              <span className="font-mono text-[10px] text-neutral-400 lowercase truncate leading-none mb-1">
                - {trackArtist}
              </span>
              <span className="font-mono text-xs font-bold text-white uppercase tracking-widest truncate leading-none">
                {trackTitle}
              </span>
            </>
          ) : null}
        </div>

        {/* Universal Volume: Needle Slider at far right (6% margin) */}
        <div
          className="relative h-10 w-[20px] ml-auto mr-[6%] flex items-center justify-center cursor-pointer group/volume"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const percent = 1 - (y / rect.height);
            adjustVolume(percent);
          }}
        >
          {/* Track: 1px vertical line */}
          <div className="absolute h-full w-[1px] bg-white/30" />
          {/* Needle: 4px white square */}
          <div
            className="absolute w-1 h-1 bg-white shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none"
            style={{ bottom: `${volume * 100}%`, transform: 'translateY(50%)' }}
          />
        </div>
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
          className="h-full bg-white transition-all duration-100 ease-linear pointer-events-auto relative"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

export default Header;

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
    <header className="fixed top-0 right-0 w-full md:w-1/2 lg:w-1/4 h-16 z-50 pointer-events-none">
      {/* 
                Master Player Container 
                - Top Right fixed position (controlled by parent `right-0 w...`)
                - 80% transparency + blur
             */}
      <div className="w-full h-full bg-[#050505cc] backdrop-blur-md border-b border-l border-[#222] pointer-events-auto relative flex items-center shadow-lg">

        {/* Metadata: Left aligned relative to this block */}
        <div className="flex flex-col flex-1 overflow-hidden pl-4 pr-20"> {/* pr-20 to clear volume area */}
          {trackTitle ? (
            <div className="font-mono text-xs md:text-sm leading-tight truncate">
              <span className="text-[#888] lowercase mr-2">- {trackArtist || 'unknown'}</span>
              <span className="text-white font-bold uppercase tracking-widest">{trackTitle}</span>
            </div>
          ) : (
            <div className="font-mono text-xs text-[#444] uppercase tracking-widest pl-4">
              Immortal Raindrops
            </div>
          )}
        </div>

        {/* Volume Fader: Precision Placement */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
          style={{ right: '6%', width: '60px', transform: 'translateY(-50%) rotate(-90deg)' }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => adjustVolume(parseFloat(e.target.value))}
            className="retro-range w-full"
          />
        </div>

        {/* Filling Seeker Bar (Bottom edge) */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

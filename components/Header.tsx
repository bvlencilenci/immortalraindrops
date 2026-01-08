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
    <header className="fixed top-0 right-0 w-full md:w-1/2 h-16 z-50 pointer-events-none">
      {/* Background container - allows clicks through on empty space if needed, 
                 but for player controls we need events. 
                 Using a constrained width container for the actual player part?
                 The request says "Fixed at the top-right quarter". 
                 Let's make the background extend but keep it subtle or just the player elements?
                 "Fixed at the top-right quarter of the screen" implies it might not be full width?
                 "w-full md:w-1/2" covers right half on desktop.
             */}

      <div className="w-full h-full bg-black/80 backdrop-blur-md border-b border-[#222] pointer-events-auto relative flex items-center justify-between px-6">

        {/* Metadata */}
        <div className="flex flex-col flex-1 overflow-hidden mr-8">
          {trackTitle ? (
            <div className="font-mono text-sm leading-tight truncate">
              <span className="text-[#888] lowercase mr-2">- {trackArtist || 'unknown'}</span>
              <span className="text-white font-bold uppercase tracking-widest">{trackTitle}</span>
            </div>
          ) : (
            <div className="font-mono text-xs text-[#444] uppercase tracking-widest">
              Immortal Raindrops
            </div>
          )}
        </div>

        {/* Volume Fader - Horizontal for Header */}
        <div className="w-24 md:w-32 flex items-center mr-[5%]">
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

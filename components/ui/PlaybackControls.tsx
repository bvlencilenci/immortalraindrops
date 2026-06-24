import React from 'react';

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause?: (e: React.MouseEvent) => void;
  onSkipBack?: (e: React.MouseEvent) => void;
  onSkipForward?: (e: React.MouseEvent) => void;
  isRadioStream?: boolean;
  className?: string;
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  isRadioStream = false,
  className = ''
}: PlaybackControlsProps) {
  return (
    <div className={`flex items-center justify-center gap-3 z-50 ${className}`} data-testid="playback-controls">
      {!isRadioStream && (
        <button
          onClick={(e) => {
            if (!onSkipBack) return;
            onSkipBack(e);
          }}
          className="flex items-center justify-center whitespace-nowrap transition-all duration-100 opacity-70 hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
          title="Previous / Restart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-9 h-9" fill="#ECEEDF">
            <path d="M199.81,34a16,16,0,0,0-16.24.43L64,109.23V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0V146.77l119.57,74.78A15.95,15.95,0,0,0,208,208.12V47.88A15.86,15.86,0,0,0,199.81,34ZM192,208,64.16,128,192,48.07Z" />
          </svg>
        </button>
      )}

      <div>
        <button
          onClick={(e) => onPlayPause?.(e)}
          className="opacity-90 hover:opacity-100 transition-all duration-100 flex items-center justify-center whitespace-nowrap cursor-pointer hover:scale-110 active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          <img
            src={isPlaying ? "/pause.svg" : "/play.svg"}
            alt={isPlaying ? "Pause" : "Play"}
            className="w-10 h-10 invert"
          />
        </button>
      </div>

      {!isRadioStream && (
        <button
          onClick={(e) => {
            if (!onSkipForward) return;
            onSkipForward(e);
          }}
          className="flex items-center justify-center whitespace-nowrap transition-all duration-100 opacity-70 hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
          title="Skip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-9 h-9" fill="#ECEEDF">
            <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

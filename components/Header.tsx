'use client';

import { useState, useRef, useEffect } from 'react';
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

  const isPlayerActive = !!currentlyPlayingId;
  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return "/speaker-simple-slash.svg"; // Mute (0%)
    if (volume <= 0.33) return "/speaker-simple-none.svg"; // Low/No wave (1-33%)
    if (volume <= 0.66) return "/speaker-simple-low.svg"; // Medium waves (34-66%)
    return "/speaker-simple-high.svg"; // High/Full waves (67-100%)
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 w-full flex items-center justify-between px-[4%] bg-black z-50">
      {/* Zone 1: Left - Identity & Meta */}
      <div className="flex items-baseline gap-3 z-10 shrink-0">
        {/* Column 1: Station Identity */}
        <div className="flex flex-col justify-center">
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">IMMORTAL</span>
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">RAINDROPS</span>
        </div>

        {/* Column 2: Metadata Block */}
        {isPlayerActive && (
          <div className="flex flex-col justify-center border-l border-white/20 pl-6 max-w-[150px] md:max-w-[250px]">
            <span className="font-mono text-[16px] text-neutral-500 lowercase leading-tight truncate">
              {trackArtist}
            </span>
            <span className="font-mono text-[16px] text-white uppercase font-bold leading-tight truncate">
              {trackTitle}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        {isPlayerActive && (
          <div className="flex items-center gap-8">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-6 h-6 invert" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="flex items-center justify-center bg-white/5 w-11 h-11 rounded-full transition-all duration-200 border border-white/10 hover:bg-white/10 hover:scale-110"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-8 h-8 invert translate-x-[1px]"
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipTrack(); }}
              className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110"
              title="Skip"
            >
              <img src="/skip-forward.svg" alt="Skip" className="w-6 h-6 invert" />
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: Right - Utility Stack (Volume & Time) */}
      <div className="flex-1 flex justify-end items-center z-10 shrink-0">
        {isPlayerActive && (
          <div className="flex flex-col items-end gap-1">
            {/* Row 1: Volume Utility (Solid Fill) */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustVolume(volume > 0 ? 0 : 0.5);
                }}
              >
                <img
                  src={getVolumeIcon()}
                  alt="Volume"
                  className="w-4 h-4 invert opacity-70"
                />
              </button>
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
                className="w-[110px] h-[3px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white outline-none"
                style={{
                  background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`
                }}
              />
            </div>

            {/* Row 2: Metadata Timestamp */}
            <span className="font-mono text-[12px] text-white/70 tracking-widest leading-none tabular-nums">
              {formatTime(seek)} / {formatTime(duration)}
            </span>
          </div>
        )}
      </div>


    </header>
  );
};

export default Header;

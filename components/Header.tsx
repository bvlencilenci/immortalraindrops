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
    <header className="relative w-full h-20 z-50 bg-[#0a0a0a] border-b border-white/20 backdrop-blur-md flex items-center px-4 md:px-8 text-white overflow-hidden flex-shrink-0">
      {/* Zone 1: Left - Identity & Meta */}
      <div className="flex items-baseline gap-3 z-10 shrink-0 ml-8">
        {/* Column 1: Station Identity */}
        <div className="flex flex-col justify-center">
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">IMMORTAL</span>
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">RAINDROPS</span>
        </div>

        {/* Column 2: Metadata Block */}
        <div className="flex flex-col justify-center border-l border-white/20 pl-6 max-w-[150px] md:max-w-[250px]">
          <span className="font-mono text-[16px] text-neutral-500 lowercase leading-tight truncate">
            {isPlayerActive ? trackArtist : "broadcast"}
          </span>
          <span className="font-mono text-[16px] text-white uppercase font-bold leading-tight truncate">
            {isPlayerActive ? trackTitle : "standby"}
          </span>
        </div>
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-auto w-full max-w-[200px] md:max-w-[300px]">
        {isPlayerActive && (
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-6 h-6 invert" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="flex items-center justify-center bg-white/5 w-12 h-12 rounded-full transition-all duration-200 border border-white/10 hover:bg-white/10 hover:scale-105"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-5 h-5 invert"
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

      {/* Zone 3: Right - Volume & Time */}
      <div className="flex-1 flex justify-end items-center gap-6 z-10 shrink-0">
        <div className="flex items-center gap-6">
          {/* Timestamp */}
          <span className="font-mono text-[14px] text-white tracking-widest leading-none tabular-nums">
            {isPlayerActive ? `${formatTime(seek)} / ${formatTime(duration)}` : "--:-- / --:--"}
          </span>

          {isPlayerActive && (
            <div className="flex items-center gap-4">
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
                className="w-[110px] h-[3px] bg-white/30 rounded-full appearance-none accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              />
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
                  className="w-5 h-5 invert opacity-100"
                />
              </button>
            </div>
          )}
        </div>
        {/* Reserved area for future nav */}
        <div className="w-6 h-6 flex items-center justify-center opacity-0 pointer-events-none" />
      </div>

      {/* Bottom Zone: Expanding Progress Bar Console */}
      <div className="absolute bottom-0 left-0 w-full h-[16px] group/scrubber cursor-pointer z-50">
        {/* Background Track (Expands on Hover) */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/30 group-hover/scrubber:h-[8px] transition-all duration-200 ease-in-out z-10" />

        {/* Progress Fill (Expands on Hover) */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-white group-hover/scrubber:h-[8px] transition-all duration-200 ease-in-out z-20 pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Hover-Only Thumb (The Ball) */}
        <div
          className="absolute bottom-[4px] -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/scrubber:opacity-100 transition-opacity duration-200 z-30 pointer-events-none"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Functional Invisible Input */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={seek}
          disabled={!isPlayerActive}
          onChange={(e) => {
            e.stopPropagation();
            useAudioStore.getState().seekTo(parseFloat(e.target.value));
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
        />
      </div>
    </header>
  );
};

export default Header;

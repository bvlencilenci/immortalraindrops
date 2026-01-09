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
    <header className="relative w-full h-20 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 md:px-6 border-b border-white/10 text-white overflow-hidden flex-shrink-0">
      {/* Zone 1: Left - Identity & Meta */}
      <div className="flex items-center gap-6 z-10">
        {/* Column 1: Station Identity */}
        <div className="flex flex-col justify-center">
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">IMMORTAL</span>
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">RAINDROPS</span>
        </div>

        {/* Column 2: Metadata Block */}
        {isPlayerActive && (
          <div className="flex flex-col justify-center border-l border-white/20 pl-6">
            <span className="font-mono text-[15px] text-neutral-500 lowercase leading-none truncate">
              {trackArtist}
            </span>
            <span className="font-mono text-[15px] text-white uppercase font-bold leading-none mt-1 truncate">
              {trackTitle}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-auto w-full max-w-[300px]">
        {isPlayerActive && (
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); skipBack(); }}
              className="flex items-center justify-center transition-all duration-200"
              title="Previous / Restart"
            >
              <img src="/skip-back.svg" alt="Back" className="w-6 h-6 invert opacity-100 transition-opacity" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="flex items-center justify-center bg-white/5 hover:bg-white/10 w-12 h-12 rounded-full transition-all duration-200 border border-white/10"
              title={isPlaying ? "Pause" : "Play"}
            >
              <img
                src={isPlaying ? "/pause.svg" : "/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                className="w-5 h-5 invert opacity-100"
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipTrack(); }}
              className="flex items-center justify-center transition-all duration-200"
              title="Skip"
            >
              <img src="/skip-forward.svg" alt="Skip" className="w-6 h-6 invert opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: Right - Volume & Timer (Timers moved bottom) */}
      <div className="flex-1 flex justify-end items-center gap-6 z-10">
        {isPlayerActive && (
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
                className="w-5 h-5 invert opacity-100"
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
              className="w-[100px] h-[2px] bg-white/20 accent-white appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
        )}
        {/* Reserved area for future nav */}
        <div className="w-6 h-6 flex items-center justify-center opacity-0 pointer-events-none" />
      </div>

      {/* Bottom Zone: Timestamps (positioned above bar) */}
      {isPlayerActive && (
        <>
          <div className="absolute bottom-2 left-4 md:left-6 z-10">
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums">
              {formatTime(seek)}
            </span>
          </div>
          <div className="absolute bottom-2 right-4 md:right-6 z-10">
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={seek}
            onChange={(e) => {
              e.stopPropagation();
              useAudioStore.getState().seekTo(parseFloat(e.target.value));
            }}
            className="absolute bottom-0 left-0 w-full h-[2px] bg-white/20 appearance-none cursor-pointer z-[60] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </>
      )}
    </header>
  );
};

export default Header;

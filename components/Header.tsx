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
    if (isNaN(time) || time === 0) return "00:00";
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
      <div className="flex items-center gap-8 z-10 shrink-0">
        {/* Column 1: Station Identity */}
        <div className="flex flex-col justify-center">
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">IMMORTAL</span>
          <span className="font-mono text-[18px] font-bold tracking-widest leading-none">RAINDROPS</span>
        </div>

        {/* Column 2: Metadata Block (Persistent) */}
        <div className="flex flex-col justify-center border-l border-white/20 pl-6 max-w-[150px] md:max-w-[250px]">
          <span className="font-mono text-[15px] text-neutral-500 lowercase leading-none truncate">
            {isPlayerActive ? trackArtist : "broadcast"}
          </span>
          <span className="font-mono text-[15px] text-white uppercase font-bold leading-none mt-1 truncate">
            {isPlayerActive ? trackTitle : "standby"}
          </span>
        </div>
      </div>

      {/* Zone 2: True Viewport Center (The Player) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-auto w-full max-w-[200px] md:max-w-[300px]">
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => { e.stopPropagation(); skipBack(); }}
            disabled={!isPlayerActive}
            className={`flex items-center justify-center transition-all duration-200 ${!isPlayerActive ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-110'}`}
            title="Previous / Restart"
          >
            <img src="/skip-back.svg" alt="Back" className="w-6 h-6 invert" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            disabled={!isPlayerActive}
            className={`flex items-center justify-center bg-white/5 w-12 h-12 rounded-full transition-all duration-200 border border-white/10 ${!isPlayerActive ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:bg-white/10 hover:scale-105'}`}
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
            disabled={!isPlayerActive}
            className={`flex items-center justify-center transition-all duration-200 ${!isPlayerActive ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-110'}`}
            title="Skip"
          >
            <img src="/skip-forward.svg" alt="Skip" className="w-6 h-6 invert" />
          </button>
        </div>
      </div>

      {/* Zone 3: Right - Volume (Persistent) */}
      <div className="flex-1 flex justify-end items-center gap-6 z-10 shrink-0">
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
            className="w-[80px] md:w-[120px] h-[2px] bg-white/20 accent-white appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
        {/* Reserved area for future nav */}
        <div className="w-6 h-6 flex items-center justify-center opacity-0 pointer-events-none" />
      </div>

      {/* Bottom Zone: Timestamps & Progressive Seeker (Persistent) */}
      <div className="absolute bottom-3 left-4 md:left-8 z-10 pointer-events-none">
        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums">
          {formatTime(seek)}
        </span>
      </div>
      <div className="absolute bottom-3 right-4 md:right-8 z-10 pointer-events-none">
        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none tabular-nums">
          / {formatTime(duration)}
        </span>
      </div>

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
        className={`absolute bottom-0 left-0 w-full h-[3px] appearance-none z-[60] bg-white/10
        ${!isPlayerActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:h-[4px] transition-all'}
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
        [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0`}
      />
    </header>
  );
};

export default Header;

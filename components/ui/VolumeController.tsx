import React, { useRef } from 'react';

export interface VolumeControllerProps {
  volume: number;
  onVolumeChange?: (volume: number) => void;
  seek: number;
  duration: number;
  isRadioStream?: boolean;
  className?: string;
}

export function VolumeController({
  volume,
  onVolumeChange,
  seek,
  duration,
  isRadioStream = false,
  className = ''
}: VolumeControllerProps) {
  const prevVolumeRef = useRef(0.5);

  const getVolumeIcon = () => {
    if (volume === 0) return "/speaker-simple-slash.svg";
    if (volume <= 0.33) return "/speaker-simple-none.svg";
    if (volume <= 0.66) return "/speaker-simple-low.svg";
    return "/speaker-simple-high.svg";
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (volume > 0) {
      prevVolumeRef.current = volume;
      onVolumeChange?.(0);
    } else {
      onVolumeChange?.(prevVolumeRef.current || 0.5);
    }
  };

  return (
    <div className={`flex flex-row items-center gap-2 shrink-0 ${className}`} data-testid="volume-controller">
      <button
        className="flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
        onClick={handleMuteToggle}
        title={volume === 0 ? "Unmute" : "Mute"}
      >
        <img
          src={getVolumeIcon()}
          alt="Volume"
          className="w-[22px] h-[22px] invert opacity-80"
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
          onVolumeChange?.(parseFloat(e.target.value));
        }}
        className="w-[100px] h-[3px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:bg-[#ECEEDF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-none outline-none opacity-80 hover:opacity-100 transition-opacity self-center"
        style={{
          background: `linear-gradient(to right, #ECEEDF ${volume * 100}%, rgba(236,238,223,0.1) ${volume * 100}%)`
        }}
      />
      {!isRadioStream && (
        <span className="font-mono text-[9px] text-[#ECEEDF]/30 tracking-[0.05em] leading-none tabular-nums whitespace-nowrap select-none">
          {`${formatTime(seek)} / ${formatTime(duration)}`}
        </span>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useAudioStore } from '../store/useAudioStore';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
}

const CustomVideoPlayer = ({ src, poster, startTime = 0 }: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const {
    isPlaying: isPlayingStore,
    togglePlay: togglePlayStored,
    seek: globalSeek,
    seekTo: seekToStored,
    duration: globalDuration,
    volume,
  } = useAudioStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = src.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0 && video.currentTime === 0) {
          video.currentTime = startTime;
        }
        if (isPlayingStore) {
          video.play().catch(() => { });
        }
      });
    } else {
      // Native playback (MP4, MOV, or Safari HLS)
      video.src = src;

      const onMetadata = () => {
        if (startTime > 0 && video.currentTime === 0) {
          video.currentTime = startTime;
        }
        if (isPlayingStore) {
          video.play().catch(() => { });
        }
      };

      video.addEventListener('loadedmetadata', onMetadata);
      // If metadata already loaded
      if (video.readyState >= 1) onMetadata();

      return () => video.removeEventListener('loadedmetadata', onMetadata);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Sync Video properties TO Store
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    let frameId: number;

    const syncToStore = () => {
      if (!video) return;

      const newDuration = video.duration;
      const updates: any = { seek: video.currentTime || 0 };

      // Only sync duration if it's a valid number
      if (newDuration && !isNaN(newDuration) && isFinite(newDuration)) {
        updates.duration = newDuration;
      }

      useAudioStore.setState(updates);
      frameId = requestAnimationFrame(syncToStore);
    };

    if (isPlayingStore) {
      frameId = requestAnimationFrame(syncToStore);
    } else {
      // One last sync
      const updates: any = { seek: video.currentTime || 0 };
      if (video.duration && !isNaN(video.duration)) {
        updates.duration = video.duration;
      }
      useAudioStore.setState(updates);
    }

    return () => cancelAnimationFrame(frameId);
  }, [isPlayingStore]);

  // Sync FROM Store (Seeking)
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const diff = Math.abs(video.currentTime - globalSeek);
    if (diff > 1.0) { // Slight tolerance
      video.currentTime = globalSeek;
    }
  }, [globalSeek]);

  // Sync FROM Store (Volume/Playback)
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.volume = volume;
    if (isPlayingStore) {
      if (video.paused) video.play().catch(() => { });
    } else {
      if (!video.paused) video.pause();
    }
  }, [isPlayingStore, volume]);

  const togglePlay = () => {
    togglePlayStored();
  };

  const skip = (amount: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + amount));
      seekToStored(newTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekToStored(time);
  };

  return (
    <div className="relative group bg-black w-full h-full">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        controls={false}
        autoPlay
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
      />

      {/* Custom Control Bar */}
      <div className="absolute bottom-0 left-0 w-full p-6 pb-12 flex items-center gap-8 bg-gradient-to-t from-black via-black/40 to-transparent backdrop-blur-[2px] translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">
        {/* 1. Playback Controls */}
        <div className="flex items-center gap-5 shrink-0">
          <button onClick={() => skip(-10)} className="text-[#ECEEDF] hover:opacity-100 transition-opacity opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-8 h-8" fill="currentColor">
              <path d="M199.81,34a16,16,0,0,0-16.24.43L64,109.23V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0V146.77l119.57,74.78A15.95,15.95,0,0,0,208,208.12V47.88A15.86,15.86,0,0,0,199.81,34ZM192,208,64.16,128,192,48.07Z" />
            </svg>
          </button>
          <button onClick={togglePlay} className="text-[#ECEEDF] hover:opacity-100 transition-opacity opacity-90">
            {isPlayingStore ? (
              <img src="/pause.svg" alt="Pause" className="w-10 h-10 invert" />
            ) : (
              <img src="/play.svg" alt="Play" className="w-10 h-10 invert" />
            )}
          </button>
          <button onClick={() => skip(10)} className="text-[#ECEEDF] hover:opacity-100 transition-opacity opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-8 h-8" fill="currentColor">
              <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
            </svg>
          </button>
        </div>

        {/* 2. Standardized Seeker (Matches Header Volume Style) */}
        <div className="flex-1 flex items-center h-full">
          <input
            type="range"
            min="0"
            max={globalDuration || 100}
            step="0.1"
            value={globalSeek}
            onChange={handleSeek}
            className="w-full h-[2px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:bg-[#ECEEDF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-none outline-none opacity-80 hover:opacity-100 transition-opacity"
            style={{
              background: `linear-gradient(to right, #ECEEDF ${(globalSeek / (globalDuration || 1)) * 100}%, rgba(236,238,223,0.1) ${(globalSeek / (globalDuration || 1)) * 100}%)`
            }}
          />
        </div>

        {/* 3. Timestamp */}
        <div className="font-mono text-[14px] text-[#ECEEDF] tracking-widest tabular-nums shrink-0 opacity-80">
          {formatTime(globalSeek)} / {formatTime(globalDuration)}
        </div>
      </div>
      {/* Persistent Bottom Line Seeker (Visible when controls hidden) */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5 z-30 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300">
        <div
          className="h-full bg-[#ECEEDF] shadow-[0_0_10px_rgba(236,238,223,0.3)]"
          style={{ width: `${(globalSeek / (globalDuration || 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};


export default CustomVideoPlayer;

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';

interface TileProps {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverImage?: string;
  genre?: string;
  r2_key?: string;
  media_type?: string;
  tile_index?: number;
  release_date?: string;
  audio_key?: string;
  image_key?: string;
}

const Tile = ({ id, title, artist, url, coverImage, audio_key, image_key, genre, media_type, r2_key }: TileProps) => {
  const {
    playTrack,
    currentlyPlayingId,
    isPlaying,
    togglePlay,
    seekTo,
    duration,
    seek,
    volume,
  } = useAudioStore();

  // Construct absolute URLs from keys
  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
  // Check for R2 keys FIRST (new schema), then fallback to direct props (legacy/fallback)
  const audioUrl = audio_key ? `${r2BaseUrl}/${audio_key}` : (url || '');
  const imageUrl = image_key ? `${r2BaseUrl}/${image_key}` : (coverImage || '/images/placeholder.jpg');

  const isActive = currentlyPlayingId === id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visualizerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Handle Play/Interaction
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    if (isActive) {
      togglePlay();
      // Also toggle video if present
      if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
      }
    } else {
      playTrack(id, audioUrl, title, artist);
      // Video autoplay handled by side effect of isActive
    }
  };

  // Sync Video with Global Playing State
  useEffect(() => {
    if (isActive && videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => { });
      else videoRef.current.pause();
    }
    // If not active, video is hidden/unmounted so pause is implicit or should be enforced
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive, isPlaying]);

  // Visualizer Effect (Butterchurn)
  // Logic remains largely same but ensures we connect to the MAIN audio source (Howler)
  useEffect(() => {
    let animationFrameId: number;

    const initVisualizer = async () => {
      // If we are playing a video, we STILL want the visualizer to work if we want that overlay effect.
      // The visualizer taps into the global Howler audio node.
      // If media_type is video, we assume the audio is ALSO playing via Howler for consistency (visualizer source), roughly synced? 
      // OR, does the video usually completely replace the visualizer? 
      // The user prompt says: "If media_type is 'video', render a <video> tag... but ensure the audio track is still routed to the Butterchurn analyser."
      // This implies the audio might be coming from the VIDEO element? Or parallel?
      // "If media_type is 'song' or 'dj set', initialize the useAudioStore... If 'video', render a <video> tag... but ensure the audio track is still routed..."
      // This usually implies utilizing the Video as the source. 
      // HOWEVER, useAudioStore is built around Howler. 
      // To keep it simple: We will Play the Audio via Howler (so we get visualizer data easily) and MUTE the video element, essentially using the video just as a "moving cover image".

      if (!isActive || !canvasRef.current || !isPlaying) return;

      try {
        const butterchurn = (await import('butterchurn')).default;
        const butterchurnPresets = (await import('butterchurn-presets')).default;

        const ctx = Howler.ctx;
        if (!ctx) return;

        const { analyser, howl } = useAudioStore.getState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (howl as any)?._sounds?.[0];

        if (sound && sound._node && !sound._visualizerConnected) {
          const audioNode = sound._node;
          if (!audioNode.crossOrigin) audioNode.crossOrigin = "anonymous";
          try {
            const sourceNode = ctx.createMediaElementSource(audioNode);
            const analyserNode = ctx.createAnalyser();
            sourceNode.connect(analyserNode);
            analyserNode.connect(ctx.destination);
            sound._visualizerConnected = true;
            sound._analyser = analyserNode;
          } catch (e) {
            if (!sound._analyser) { /* ignore */ }
          }
        }

        const finalAnalyser = (sound && sound._analyser) ? sound._analyser : analyser;

        if (finalAnalyser) {
          const canvas = canvasRef.current;
          const { width, height } = canvas.parentElement?.getBoundingClientRect() || { width: 300, height: 300 };

          const visualizer = butterchurn.createVisualizer(ctx, canvas, { width, height });
          visualizer.connectAudio(finalAnalyser);

          const presets = butterchurnPresets.getPresets();
          const presetKeys = Object.keys(presets);
          const randomPreset = presets[presetKeys[Math.floor(Math.random() * presetKeys.length)]];
          visualizer.loadPreset(randomPreset, 0.0);

          visualizerRef.current = visualizer;

          const loop = () => {
            if (visualizerRef.current) {
              visualizerRef.current.render();
              animationFrameId = requestAnimationFrame(loop);
            }
          };
          loop();
        }
      } catch (e) {
        console.error("Visualizer Init Failed", e);
      }
    };

    if (isActive && isPlaying) {
      setTimeout(initVisualizer, 200);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      visualizerRef.current = null;
    };
  }, [isActive, isPlaying]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (visualizerRef.current && canvasRef.current) {
        const { width, height } = canvasRef.current.parentElement?.getBoundingClientRect() || { width: 0, height: 0 };
        if (width > 0 && height > 0) {
          visualizerRef.current.setRendererSize(width, height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isVideo = media_type === 'video';

  return (
    <div
      onClick={handleInteraction}
      className="relative w-full aspect-square overflow-hidden group border-r last:border-r-0 cursor-pointer bg-black"
    >
      {/* 1. Visual Base: Video, Canvas, or Image */}
      <div className="absolute inset-0 z-0 transition-all duration-500 w-full h-full">
        {isActive && isPlaying ? (
          <>
            {isVideo ? (
              // Video Layer: Muted because Main Audio is provided by Howler/AudioStore
              <video
                ref={videoRef}
                src={imageUrl}
                className="absolute inset-0 w-full h-full object-cover z-0"
                loop
                muted // Important: Audio handled by global player for consistency/visualization
                playsInline
                crossOrigin="anonymous"
              />
            ) : (
              // Milkdrop visualizer layer for audio-only tracks
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block object-cover z-0"
              />
            )}

            {/* Overlay Visualizer: If we want visualizer ON TOP of video? 
                Usually for video we might not want the visualizer canvas blocking it. 
                Logic above hides canvas if isVideo is true. 
            */}
          </>
        ) : (
          <img
            src={imageUrl}
            className="absolute inset-0 w-full h-full object-cover z-0"
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* 2. Text Protection & Hover Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />

      {/* 3. Metadata & Safe-Area Offset */}
      <div className="absolute top-[24px] left-[12px] md:top-[32px] md:left-[20px] flex flex-col z-20 pointer-events-none">
        <span className="text-[15px] font-mono text-neutral-300 lowercase leading-none tracking-normal">
          {artist}
        </span>
        <span className="text-[24px] md:text-[32px] font-bold uppercase leading-none tracking-tighter mt-2 text-[#ECEEDF]">
          {title}
        </span>
      </div>
    </div>
  );
};

export default Tile;

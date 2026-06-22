'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentlyPlayingId, isPlaying, volume } = useAudioStore();

  const streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || '';

  // Synchronize playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    const isRadioActive = currentlyPlayingId === 'radio-stream';

    if (isRadioActive && isPlaying) {
      // Set source if not set, or refresh to get real-time live chunk (prevent buffer lag)
      if (!audio.src || audio.src !== streamUrl) {
        audio.src = streamUrl;
      }
      audio.play().catch((err) => {
        console.error('Radio playback blocked/failed:', err);
      });
    } else {
      audio.pause();
      // Clear src to stop connection buffer when paused
      audio.src = '';
    }
  }, [currentlyPlayingId, isPlaying, streamUrl]);

  // Synchronize volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  if (!streamUrl) {
    return null;
  }

  return (
    <audio
      ref={audioRef}
      style={{ display: 'none' }}
      crossOrigin="anonymous"
    />
  );
}

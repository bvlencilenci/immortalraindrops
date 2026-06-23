'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentlyPlayingId, isPlaying, volume } = useAudioStore();

  let streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || '';
  if (!streamUrl || streamUrl.endsWith('/live')) {
    streamUrl = 'https://immortal-radio.fly.dev/radio';
  }

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
      
      // Force reload to sync with live stream and avoid buffer lag
      audio.load();

      // Force resume context to ensure Web Audio routing works and visualizer gets data
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch((err) => console.warn('Failed to resume AudioContext:', err));
      }

      audio.play().then(() => {
        // Expose source node for Butterchurn visualizer
        const ctx = Howler.ctx;
        if (ctx && !(audio as any)._sourceNode) {
          try {
            const sourceNode = ctx.createMediaElementSource(audio);
            sourceNode.connect(ctx.destination);
            (audio as any)._sourceNode = sourceNode;
            useAudioStore.setState({ radioAudioNode: sourceNode });
          } catch (e) {
            console.warn('Error connecting radio audio to Web Audio:', e);
          }
        }
      }).catch((err) => {
        console.error('Radio playback blocked/failed:', err);
      });
    } else {
      audio.pause();
      // Instead of clearing src which breaks the Web Audio routing, we just pause the audio.
      // We rely on audio.load() when starting play to flush the buffer.
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

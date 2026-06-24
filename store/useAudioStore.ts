import { create } from 'zustand';
import { Howl, Howler } from 'howler';
import Hls from 'hls.js';
import { Track } from '../types';

interface AudioStore {
  currentlyPlayingId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  streamTitle: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  duration: number;
  seek: number;
  volume: number;
  playlist: Track[];

  hasEntered: boolean;
  enterApp: () => Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  howl: Howl | null;
  hls: Hls | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyser: AnalyserNode | null;
  radioAudioNode: MediaElementAudioSourceNode | null;

  setPlaylist: (tracks: Track[]) => void;
  playTrack: (id: string, url: string, title: string, artist: string, mediaType?: string) => Promise<void>;
  togglePlay: () => void;
  restartTrack: () => void;
  skipTrack: () => void;
  previousTrack: () => void;
  skipBack: () => void;
  adjustVolume: (vol: number) => void;
  isLive: boolean;
  playLiveStream: (url: string) => Promise<void>;
  updateSeek: () => void;
  seekTo: (time: number) => void;
  setLiveState: (isLive: boolean, title?: string) => void;
  activeFullscreenUrl: string | null;
  activeFullscreenStartTime: number;
  setActiveFullscreenVideo: (url: string | null, startTime?: number) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentlyPlayingId: null,
  trackTitle: null,
  trackArtist: null,
  streamTitle: null,
  isPlaying: false,
  isLive: false,
  isBuffering: false,
  duration: 0,
  seek: 0,
  volume: 1.0,
  playlist: [],
  howl: null,
  hls: null,
  analyser: null,
  radioAudioNode: null,

  hasEntered: false,
  activeFullscreenUrl: null,
  activeFullscreenStartTime: 0,
  setActiveFullscreenVideo: (url, startTime = 0) => set({
    activeFullscreenUrl: url,
    activeFullscreenStartTime: startTime,
    seek: startTime
  }),

  enterApp: async () => {
    // Force Howler to initialize its AudioContext
    if (!Howler.ctx) {
      try {
        // eslint-disable-next-line no-new
        new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
          preload: true
        });
      } catch (e) {
        console.warn('Failed to force Howler init:', e);
      }
    }

    if (Howler.ctx) {
      await Howler.ctx.resume();
    }
    set({ hasEntered: true });
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playTrack: async (id, url, title, artist, mediaType = 'song') => {
    // 0. FORCE RESUME CONTEXT (The Magic Key)
    if (Howler.ctx) {
      await Howler.ctx.resume();
    }

    const { howl, hls, volume } = get();

    // Stop and unload previous Howl
    if (howl) {
      howl.stop();
      howl.unload();
    }

    // Stop and destroy previous HLS
    if (hls) {
      hls.destroy();
      set({ hls: null });
    }

    // IF VIDEO: We don't use Howler for the primary stream
    if (mediaType === 'video') {
      const { activeFullscreenUrl, playlist } = get();

      // Update fullscreen URL if already in fullscreen
      if (activeFullscreenUrl) {
        const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
        const vExt = playlist.find(t => t.id === id)?.image_ext || 'jpg';
        const newVideoUrl = `${r2BaseUrl}/${playlist.find(t => t.id === id)?.tile_id}/visual.${vExt}`;
        set({ activeFullscreenUrl: newVideoUrl });
      }

      set({
        currentlyPlayingId: id,
        trackTitle: title,
        trackArtist: artist,
        howl: null,
        isPlaying: true,
        isBuffering: false,
        isLive: false,
        seek: 0,
        duration: 0
      });
      return;
    }

    // Determine format from URL to prevent guessing behavior
    const fileExt = url.split('.').pop()?.toLowerCase() || 'mp3';

    const cacheBustedUrl = `${url}?t=${Date.now()}`;
    const newHowl = new Howl({
      src: [cacheBustedUrl],
      html5: true, // ENABLE STREAMING: Browser handles chunked buffering (Range requests)
      preload: false, // CRITICAL: Defer load to inject CORS attribute
      format: [fileExt],
      xhr: {
        withCredentials: false
      },
      volume: volume,
      onplay: () => {
        set({ isPlaying: true, isBuffering: false, duration: newHowl.duration() });
        requestAnimationFrame(get().updateSeek);

        // Visualizer Connection
        const ctx = Howler.ctx;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (newHowl as any)._sounds[0];

        if (sound && sound._node && ctx) {
          const audioNode = sound._node;
          let analyser = get().analyser;

          // Initialize Analyser if needed
          if (!analyser) {
            analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            set({ analyser });
          }

          // Connect if not already connected
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (analyser && !(sound as any)._visualizerConnected) {
            try {
              // Ensure crossOrigin is preserved/set (redundant safety check)
              if (audioNode instanceof HTMLMediaElement && !audioNode.crossOrigin) {
                audioNode.crossOrigin = "anonymous";
              }

              if (audioNode instanceof HTMLMediaElement) {
                const source = ctx.createMediaElementSource(audioNode);
                source.connect(analyser);
                analyser.connect(ctx.destination); // Required for MediaElementSource
              } else {
                audioNode.connect(analyser); // Fallback for Web Audio (shouldn't hit with html5:true)
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sound as any)._visualizerConnected = true;
            } catch (e) {
              console.warn("Visualizer connection error:", e);
            }
          }
        }
      },
      onend: () => {
        set({ isPlaying: false, seek: 0, isBuffering: false });
        get().skipTrack();
      },
      onpause: () => {
        set({ isPlaying: false, isBuffering: false });
      },
      onstop: () => {
        set({ isPlaying: false, seek: 0, isBuffering: false });
      },
      onload: () => {
        set({ duration: newHowl.duration(), isBuffering: false });
      },
      onloaderror: (id, err) => {
        console.error("Howl Load Error", id, err);
        set({ isBuffering: false });
      },
      onplayerror: (id, err) => {
        console.error("Howl Play Error", id, err);
        set({ isBuffering: false });
        // Unlock audio context again just in case
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
      }
    });

    // CRITICAL FIX: Inject CORS attribute BEFORE loading to support Visualizer + Streaming
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sound = (newHowl as any)._sounds[0];
    if (sound && sound._node && sound._node instanceof HTMLMediaElement) {
      sound._node.crossOrigin = 'anonymous';
    }

    // Now start the load/play chain
    newHowl.play();

    set({
      currentlyPlayingId: id,
      trackTitle: title,
      trackArtist: artist,
      howl: newHowl,
      analyser: get().analyser, // Persist existing analyser or null
      isLive: false // Reset live flag for normal tracks
    });

    newHowl.play();
  },

  playLiveStream: async (url) => {
    // Force Howler to initialize its AudioContext
    if (!Howler.ctx) {
      try {
        // eslint-disable-next-line no-new
        new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
          preload: true
        });
      } catch (e) {
        console.warn('Failed to force Howler init in playLiveStream:', e);
      }
    }

    if (Howler.ctx) {
      await Howler.ctx.resume();
    }

    const { howl, hls } = get();

    // Cleanup previous
    if (howl) {
      howl.stop();
      howl.unload();
    }
    if (hls) {
      hls.destroy();
      set({ hls: null });
    }

    set({
      currentlyPlayingId: 'radio-stream',
      howl: null,
      analyser: null,
      isLive: true,
      isPlaying: true,
      isBuffering: false
    });
  },

  togglePlay: () => {
    const { howl, isPlaying } = get();
    if (howl) {
      if (isPlaying) {
        howl.pause();
      } else {
        howl.play();
      }
    } else {
      // For Videos or HLS without Howl
      set({ isPlaying: !isPlaying });
    }
  },

  restartTrack: () => {
    const { howl } = get();
    if (howl) {
      howl.seek(0);
    }
  },

  skipTrack: () => {
    const { playlist, currentlyPlayingId, playTrack } = get();
    if (!playlist.length || !currentlyPlayingId) return;

    const currentIndex = playlist.findIndex(t => t.id === currentlyPlayingId);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
    const ext = nextTrack.audio_ext || 'wav';
    const audioUrl = `${r2BaseUrl}/${nextTrack.tile_id}/audio.${ext}`;

    playTrack(nextTrack.id, audioUrl, nextTrack.title, nextTrack.artist, nextTrack.media_type);
  },

  previousTrack: () => {
    const { playlist, currentlyPlayingId, playTrack } = get();
    if (!playlist.length || !currentlyPlayingId) return;

    const currentIndex = playlist.findIndex(t => t.id === currentlyPlayingId);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const prevTrack = playlist[prevIndex];
    const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
    const ext = prevTrack.audio_ext || 'wav';
    const audioUrl = `${r2BaseUrl}/${prevTrack.tile_id}/audio.${ext}`;

    playTrack(prevTrack.id, audioUrl, prevTrack.title, prevTrack.artist, prevTrack.media_type);
  },

  skipBack: () => {
    const { howl, seek, previousTrack } = get();
    if (!howl) return;

    if (seek < 2) {
      howl.seek(0);
      set({ seek: 0 });
    } else {
      previousTrack();
    }
  },

  adjustVolume: (vol) => {
    const { howl } = get();
    // Clamp 0 to 1
    const newVol = Math.max(0, Math.min(1, vol));

    set({ volume: newVol });
    if (howl) {
      howl.volume(newVol);
    }
  },

  updateSeek: () => {
    const { howl, isPlaying } = get();
    if (howl && isPlaying) {
      set({ seek: howl.seek() as number });
      requestAnimationFrame(get().updateSeek);
    }
  },

  seekTo: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
    }
    set({ seek: time });
  },

  setLiveState: (isLive: boolean, title?: string) => {
    set({ isLive });
    if (title) {
      set({ streamTitle: title });
    }
  }
}));

if (typeof window !== 'undefined') {
  (window as any).useAudioStore = useAudioStore;
}


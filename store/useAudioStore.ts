import { create } from 'zustand';
import { Howl, Howler } from 'howler';
import Hls from 'hls.js';
import { Track } from '../types';

interface AudioStore {
  currentlyPlayingId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
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

  setPlaylist: (tracks: Track[]) => void;
  playTrack: (id: string, url: string, title: string, artist: string) => Promise<void>;
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
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentlyPlayingId: null,
  trackTitle: null,
  trackArtist: null,
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

  hasEntered: false,

  enterApp: async () => {
    if (Howler.ctx) {
      await Howler.ctx.resume();
    }
    set({ hasEntered: true });
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playTrack: async (id, url, title, artist) => {
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

    // Determine format from URL to prevent guessing behavior
    const fileExt = url.split('.').pop()?.toLowerCase() || 'mp3';

    const newHowl = new Howl({
      src: [url],
      html5: true,
      preload: true, // Force full preload/buffer for instant start
      format: [fileExt], // Explicitly match the file extension
      xhr: {
        withCredentials: false // Crucial for Archive.org / R2 CORS
      },
      volume: volume,
      onplay: () => {
        set({ isPlaying: true, isBuffering: false, duration: newHowl.duration() });
        requestAnimationFrame(get().updateSeek);

        // Visualizer Connection & Partial Content Support
        const ctx = Howler.ctx;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (newHowl as any)._sounds[0];

        if (sound && sound._node) {
          const audioNode = sound._node;
          // 1. Force CORS immediately
          audioNode.crossOrigin = "anonymous";

          // 2. Delayed Analyzer Setup (Wait for stream to be active)
          let analyser = get().analyser;
          if (!analyser && ctx) {
            analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            set({ analyser });
          }

          // 3. Connect Visualizer Immediately
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (analyser && !(sound as any)._visualizerConnected) {
            try {
              const source = ctx.createMediaElementSource(audioNode);
              source.connect(analyser);

              // 4. CRITICAL: Sink to Destination (Speakers)
              // Without this, audio goes to analyser but never reaches output.
              analyser.connect(ctx.destination);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sound as any)._visualizerConnected = true;
            } catch (e) {
              console.warn("Visualizer connection error or already connected:", e);
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
    if (Howler.ctx) {
      await Howler.ctx.resume();
    }

    const { howl, hls, volume } = get();

    // Cleanup previous
    if (howl) {
      howl.stop();
      howl.unload();
    }
    if (hls) {
      hls.destroy();
    }

    // --- HLS.JS SUPPORT (Chrome, Firefox, etc.) ---
    if (Hls.isSupported()) {
      const hlsInstance = new Hls({
        debug: true, // Enable debugging to see HLS logs in console
        xhrSetup: (xhr, url) => {
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        }
      });

      // Create a hidden audio element
      const audio = document.createElement('audio');
      audio.id = 'hls-audio-stream';
      audio.crossOrigin = 'anonymous'; // Essential for Visualizer & CORS
      // audio.style.display = 'none'; // Optional, elements created this way are hidden by default unless appended

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(audio);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.volume = volume;
        audio.play().catch(e => console.error("HLS Play Error:", e));

        set({ isPlaying: true, isBuffering: false });

        // Visualizer Wiring
        const ctx = Howler.ctx;
        if (ctx) {
          // Avoid double connection if node already exists? 
          // Ideally we need to manage the node. For now, try/catch.
          try {
            const source = ctx.createMediaElementSource(audio);

            let analyser = get().analyser;
            if (!analyser) {
              analyser = ctx.createAnalyser();
              analyser.fftSize = 256;
              set({ analyser });
            }

            // Connect
            source.connect(analyser);
            analyser.connect(ctx.destination);
          } catch (e) {
            console.warn("Visualizer HLS connect warn:", e);
          }
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS Network Error", data);
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS Media Error", data);
              hlsInstance.recoverMediaError();
              break;
            default:
              hlsInstance.destroy();
              break;
          }
        }
      });

      set({
        currentlyPlayingId: 'live-stream',
        trackTitle: 'LIVE DJ SET',
        trackArtist: 'IMMORTAL RAINDROPS',
        howl: null, // We are not using Howl for HLS here
        hls: hlsInstance,
        analyser: get().analyser,
        isLive: true
      });

    }
    // --- NATIVE HLS SUPPORT (Safari) ---
    else if (document.createElement('audio').canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback to Howl (which uses HTML5 Audio) or direct Audio element
      // Since Howl manages audio nicely, try that first, but headers might fail.
      // Safari usually handles ngrok fine without headers if it's the stream content.

      const newHowl = new Howl({
        src: [url],
        html5: true,
        format: ['m3u8'],
        volume: volume,
        onplay: () => {
          set({ isPlaying: true, isBuffering: false });

          // Visualizer
          const ctx = Howler.ctx;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sound = (newHowl as any)._sounds[0];
          if (sound && sound._node) {
            const audioNode = sound._node;
            audioNode.crossOrigin = "anonymous";

            let analyser = get().analyser;
            if (!analyser && ctx) {
              analyser = ctx.createAnalyser();
              analyser.fftSize = 256;
              set({ analyser });
            }

            if (analyser) {
              try {
                const source = ctx.createMediaElementSource(audioNode);
                source.connect(analyser);
                analyser.connect(ctx.destination);
              } catch (e) { console.warn(e); }
            }
          }
        },
        onend: () => set({ isPlaying: false }),
        // ... other handlers similar to playTrack
      });

      set({
        currentlyPlayingId: 'live-stream',
        trackTitle: 'LIVE DJ SET',
        trackArtist: 'IMMORTAL RAINDROPS',
        howl: newHowl,
        hls: null,
        analyser: get().analyser,
        isLive: true
      });
      newHowl.play();
    }
    else {
      console.error("HLS not supported");
    }
  },

  togglePlay: () => {
    const { howl, isPlaying } = get();
    if (howl) {
      if (isPlaying) {
        howl.pause();
      } else {
        howl.play();
      }
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

    playTrack(nextTrack.id, audioUrl, nextTrack.title, nextTrack.artist);
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

    playTrack(prevTrack.id, audioUrl, prevTrack.title, prevTrack.artist);
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
      set({ seek: time });
    }
  },

  setLiveState: (isLive: boolean, title?: string) => {
    set({ isLive });
    if (isLive && title) {
      set({ trackTitle: title });
    }
  }
}));

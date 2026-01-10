import { create } from 'zustand';
import { Howl, Howler } from 'howler';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  howl: Howl | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyser: AnalyserNode | null;

  setPlaylist: (tracks: Track[]) => void;
  playTrack: (id: string, url: string, title: string, artist: string) => void;
  togglePlay: () => void;
  restartTrack: () => void;
  skipTrack: () => void;
  previousTrack: () => void;
  skipBack: () => void;
  adjustVolume: (vol: number) => void;
  updateSeek: () => void;
  seekTo: (time: number) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentlyPlayingId: null,
  trackTitle: null,
  trackArtist: null,
  isPlaying: false,
  isBuffering: false,
  duration: 0,
  seek: 0,
  volume: 1.0,
  playlist: [],
  howl: null,
  analyser: null,

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playTrack: (id, url, title, artist) => {
    const { howl, volume } = get();

    // Stop and unload previous
    if (howl) {
      howl.stop();
      howl.unload();
    }

    // Explicitly resume Context if suspended (Autoplay policy)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    // Determine format from URL to prevent guessing behavior
    const fileExt = url.split('.').pop()?.toLowerCase() || 'mp3';

    const newHowl = new Howl({
      src: [url],
      html5: true,
      preload: 'metadata', // Required for R2 byte-range requests to support seeking without downloading the whole file
      pool: 1, // Minimize resource usage
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
      analyser: get().analyser // Persist existing analyser or null
    });

    newHowl.play();
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
  }
}));

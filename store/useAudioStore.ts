import { create } from 'zustand';
import { Howl, Howler } from 'howler';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverImage?: string;
}

interface AudioStore {
  currentlyPlayingId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  isPlaying: boolean;
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
  adjustVolume: (vol: number) => void;
  updateSeek: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentlyPlayingId: null,
  trackTitle: null,
  trackArtist: null,
  isPlaying: false,
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

    // Setup Analyser if not exists
    let analyser = get().analyser;
    if (!analyser && typeof window !== 'undefined') {
      const ctx = Howler.ctx;
      if (ctx) {
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
      }
    }

    const newHowl = new Howl({
      src: [url],
      html5: true,
      format: ['mp3'],
      volume: volume,
      onplay: () => {
        set({ isPlaying: true, duration: newHowl.duration() });
        requestAnimationFrame(get().updateSeek);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sound = (newHowl as any)._sounds[0];
        if (sound && sound._node && Howler.ctx) {
          const audioNode = sound._node;
          audioNode.crossOrigin = "anonymous";
          if (analyser) {
            // Try to connect if not already connected?
            // With html5: true, we can't easily connect to the global analyser 
            // without createMediaElementSource, which we handle in the Tile or 
            // accept the limitation. The store exposes `analyser` for the Tile to usage.
          }
        }
      },
      onend: () => {
        set({ isPlaying: false, seek: 0 });
        get().skipTrack(); // Auto-play next
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onstop: () => {
        set({ isPlaying: false, seek: 0 });
      },
      onload: () => {
        set({ duration: newHowl.duration() });
      }
    });

    set({
      currentlyPlayingId: id,
      trackTitle: title,
      trackArtist: artist,
      howl: newHowl,
      analyser: analyser
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

    playTrack(nextTrack.id, nextTrack.url, nextTrack.title, nextTrack.artist);
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
  }
}));

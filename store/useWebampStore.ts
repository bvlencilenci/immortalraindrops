import { create } from 'zustand';

interface WebampStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webamp: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWebamp: (webamp: any) => void;
  playTrack: (url: string, title?: string, artist?: string) => void;
}

export const useWebampStore = create<WebampStore>((set, get) => ({
  webamp: null,
  setWebamp: (w) => set({ webamp: w }),
  playTrack: (url, title = 'Unknown', artist = 'Unknown') => {
    const { webamp } = get();
    if (webamp) {
      // Clear existing tracks and play the new one immediatey
      webamp.setTracksToPlay([
        {
          metaData: { title, artist },
          url: url,
        },
      ]);
      // Attempt to start playback (might be blocked by browser policy without interaction, 
      // but clicking a tile counts as interaction)
      webamp.play();
    }
  },
}));

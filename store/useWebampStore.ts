import { create } from 'zustand';

interface WebampStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webamp: any | null;
  currentlyPlayingId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWebamp: (webamp: any) => void;
  playTrack: (id: string, url: string, title?: string, artist?: string) => void;
}

export const useWebampStore = create<WebampStore>((set, get) => ({
  webamp: null,
  currentlyPlayingId: null,
  setWebamp: (w) => set({ webamp: w }),
  playTrack: (id, url, title = 'Unknown', artist = 'Unknown') => {
    const { webamp } = get();
    if (webamp) {
      // Set current ID state first to trigger UI changes
      set({ currentlyPlayingId: id });

      // Clear existing tracks and play the new one immediately
      webamp.setTracksToPlay([
        {
          metaData: { title, artist },
          url: url,
        },
      ]);

      webamp.play();
    }
  },
}));

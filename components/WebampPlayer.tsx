'use client';

import { useEffect, useRef } from 'react';
import { useWebampStore } from '../store/useWebampStore';

const WebampPlayer = () => {
  const setWebamp = useWebampStore((state) => state.setWebamp);
  const webampRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return;

    const initWebamp = async () => {
      try {
        const Webamp = (await import('webamp')).default;
        if (!Webamp.browserIsSupported()) {
          console.error("Webamp not supported");
          return;
        }

        const webamp = new Webamp({
          initialTracks: [],
          availableSkins: [
            { url: "https://archive.org/download/winampskins_v2/base-2.91.wsz", name: "Base v2.91" }
          ],
        });

        // Set the webamp instance in store
        setWebamp(webamp);

        // Render to the specific container or body
        // We render to a container to control positioning if needed, 
        // but Webamp handles its own absolute positioning usually.
        // However, user requested "Persistent Winamp window in a fixed position".
        // We can render it into a fixed div.
        if (webampRef.current) {
          webamp.renderWhenReady(webampRef.current);
        }

        initialized.current = true;
      } catch (err) {
        console.error("Failed to load Webamp", err);
      }
    };

    initWebamp();

    return () => {
      // Cleanup if needed, though usually we want it to persist for the session.
      // If we unmount, we destroy.
      // const { webamp } = useWebampStore.getState();
      // if(webamp) webamp.dispose();
    };
  }, [setWebamp]);

  return (
    <div
      id="webamp-container"
      ref={webampRef}
      className="fixed bottom-5 right-5 z-50 pointer-events-auto"
      style={{
        // Ensure it doesn't block clicks on the grid unless interacting with the player
        // But Webamp elements are interactive.
        // The container needs high z-index.
      }}
    />
  );
};

export default WebampPlayer;

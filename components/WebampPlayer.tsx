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
          handleTrackDropEvent: (e) => {
            // Disable drag and drop to keep it clean
            e.preventDefault();
            return null;
          }
        });

        // Set the webamp instance in store
        setWebamp(webamp);

        if (webampRef.current) {
          webamp.renderWhenReady(webampRef.current);
        }

        initialized.current = true;
      } catch (err) {
        console.error("Failed to load Webamp", err);
      }
    };

    initWebamp();

    // Cleanup currently omitted for persistence
  }, [setWebamp]);

  return (
    <div
      id="webamp-container"
      ref={webampRef}
      className="fixed bottom-0 left-0 w-full h-[20vh] min-h-[160px] bg-black border-t border-[#222] z-50 pointer-events-auto"
      style={{
        // Force the webamp main window to be relative or absolute within this dock
        // Note: Webamp attempts to position itself absolutely on the screen. 
        // We might need deep selectors or configuration to force it.
        // But simply having a container helps. The tricky part is Webamp's window manager.
        // For a true "Dock", we often rely on CSS overrides in globals.css or here.
      }}
    />
  );
};

export default WebampPlayer;

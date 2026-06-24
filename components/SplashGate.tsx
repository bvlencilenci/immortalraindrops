'use client';

import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
// Using a separate SplashScreen component is fine, or we can inline the style here.
// Let's reuse the logic from the previous SplashScreen but make it a "Gate".
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SplashGate = () => {
  const hasEntered = useAudioStore((state) => state.hasEntered);
  const enterApp = useAudioStore((state) => state.enterApp);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const playLiveStream = useAudioStore((state) => state.playLiveStream);
  const currentlyPlayingId = useAudioStore((state) => state.currentlyPlayingId);
  const isPlaying = useAudioStore((state) => state.isPlaying);

  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissedOnLive, setDismissedOnLive] = useState(false);
  const tracksRef = useRef<any[]>([]); // Ref to access tracks inside interval closure

  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger Refs to ensure actions run exactly once
  const didPlayFirst = useRef(false);
  const didPlaySecond = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Restore entered state from sessionStorage (survives SPA nav, resets on hard refresh/new tab)
    // Use setState directly — NOT enterApp() — because there's no user gesture here.
    // AudioContext resume only happens in the real click flow below.
    const alreadyEntered = sessionStorage.getItem('immortal_entered') === '1';
    if (alreadyEntered && !hasEntered) {
      useAudioStore.setState({ hasEntered: true });
    }
    // Fetch tracks immediately on mount
    import('../app/actions').then(({ getTracks }) => {
      getTracks().then((data) => {
        tracksRef.current = data;
      });
    });
  }, []);

  // Reset dismissed state when navigating away from /live
  useEffect(() => {
    if (pathname !== '/live') {
      setDismissedOnLive(false);
    }
  }, [pathname]);

  const isRadioPlaying = currentlyPlayingId === 'radio-stream' && isPlaying;
  const showSplash = !hasEntered || (pathname === '/live' && !dismissedOnLive && !isRadioPlaying);

  if (!mounted) return null; // Avoid hydration mismatch
  if (!showSplash) return null;

  const handleEnter = async () => {
    setIsWarming(true);
    setProgress(0);
    didPlayFirst.current = false;
    didPlaySecond.current = false;
    
    // Force Howler to initialize its AudioContext
    if (!Howler.ctx) {
      try {
        // eslint-disable-next-line no-new
        new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
          preload: true
        });
      } catch (e) {
        console.warn('Failed to force Howler init in handleEnter:', e);
      }
    }

    // CRITICAL: Must be called synchronously within the onClick handler to bypass browser autoplay policies
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }

    const startTime = Date.now();
    const duration = 3500; // 3.5s total target for dual-track sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let p = (elapsed / duration) * 100;
      if (p > 100) p = 100;
      setProgress(p);

      // --- PHASE 2: 30% -> First Trigger (Wake up R2 connection) ---
      if (p >= 30 && !didPlayFirst.current) {
        didPlayFirst.current = true;
        const currentTracks = tracksRef.current;
        if (currentTracks.length > 0) {
          setPlaylist(currentTracks);
          // Auto-play disabled for broadcast testing
        }
      }

      // --- PHASE 3: 70% -> Second Trigger (Confirm Warm & Active Entry Track) ---
      if (p >= 70 && !didPlaySecond.current) {
        didPlaySecond.current = true;
        const streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || '';
        if (streamUrl) {
          playLiveStream(streamUrl);
        }
      }

      if (p >= 100) {
        clearInterval(interval);
        // Small delay to let user see 100%
        setTimeout(() => {
          sessionStorage.setItem('immortal_entered', '1');
          enterApp();
          if (pathname === '/live') {
            setDismissedOnLive(true);
          }
          setIsWarming(false);
          setProgress(0);
        }, 200);
      }
    }, 16);
  };

  return (
    <div
      onClick={!isWarming ? handleEnter : undefined}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black gap-8"
    >
      {!isWarming ? (
        <button
          className="text-[#ECEEDF] text-[32px] md:text-[48px] font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity"
        >
          CLICK TO ENTER
        </button>
      ) : (
        <div className="w-[200px] h-[2px] bg-[#ECEEDF]/20 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[#ECEEDF] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SplashGate;

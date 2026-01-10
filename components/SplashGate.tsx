'use client';

import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
// Using a separate SplashScreen component is fine, or we can inline the style here.
// Let's reuse the logic from the previous SplashScreen but make it a "Gate".
import { useEffect, useState, useRef } from 'react';

const SplashGate = () => {
  const hasEntered = useAudioStore((state) => state.hasEntered);
  const enterApp = useAudioStore((state) => state.enterApp);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const playTrack = useAudioStore((state) => state.playTrack);
  const [mounted, setMounted] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]); // Keep state for rendering if needed, but use Ref for logic
  const tracksRef = useRef<any[]>([]); // Ref to access tracks inside interval closure

  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger Refs to ensure actions run exactly once
  const didResume = useRef(false);
  const didPlayFirst = useRef(false);
  const didPlaySecond = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Fetch tracks immediately on mount
    import('../app/actions').then(({ getTracks }) => {
      getTracks().then((data) => {
        setTracks(data);
        tracksRef.current = data;
      });
    });
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch
  if (hasEntered) return null;

  const handleEnter = async () => {
    setIsWarming(true);
    const startTime = Date.now();
    const duration = 3500; // 3.5s total target for dual-track sequence
    const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let p = (elapsed / duration) * 100;
      if (p > 100) p = 100;
      setProgress(p);

      // --- PHASE 1: 0-20% -> Resume Audio Context & Ensure Fetch ---
      if (p >= 10 && !didResume.current) {
        didResume.current = true;
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
      }

      // --- PHASE 2: 30% -> First Trigger (Wake up R2 connection) ---
      if (p >= 30 && !didPlayFirst.current) {
        didPlayFirst.current = true;
        const currentTracks = tracksRef.current;
        if (currentTracks.length > 0) {
          // Pick a random track
          const randomTrack = currentTracks[Math.floor(Math.random() * currentTracks.length)];
          setPlaylist(currentTracks);

          const ext = randomTrack.audio_ext || 'wav';
          const audioUrl = `${r2BaseUrl}/${randomTrack.tile_id}/audio.${ext}`;
          playTrack(randomTrack.id, audioUrl, randomTrack.title, randomTrack.artist);
        }
      }

      // --- PHASE 3: 70% -> Second Trigger (Confirm Warm & Active Entry Track) ---
      if (p >= 70 && !didPlaySecond.current) {
        didPlaySecond.current = true;
        const currentTracks = tracksRef.current;
        if (currentTracks.length > 1) { // Need at least pool to pick from
          // Pick a NEW random track
          let randomTrack = currentTracks[Math.floor(Math.random() * currentTracks.length)];

          // Optional: Try to ensure it's different? (Simple retry once)
          // We rely on random chance is fine, but nice to change it up.

          const ext = randomTrack.audio_ext || 'wav';
          const audioUrl = `${r2BaseUrl}/${randomTrack.tile_id}/audio.${ext}`;
          playTrack(randomTrack.id, audioUrl, randomTrack.title, randomTrack.artist);
        }
      }

      if (p >= 100) {
        clearInterval(interval);
        // Small delay to let user see 100%
        setTimeout(() => {
          enterApp();
        }, 200);
      }
    }, 16);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black gap-8">
      {!isWarming ? (
        <button
          onClick={handleEnter}
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

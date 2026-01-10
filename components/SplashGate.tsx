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
  const didPick = useRef(false);
  const didPlay = useRef(false);
  const randomTrackRef = useRef<any>(null);

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
    const duration = 2500; // 2.5s total target

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let p = (elapsed / duration) * 100;
      if (p > 100) p = 100;
      setProgress(p);

      // --- PHASE 1: 10% -> Resume Audio Context ---
      if (p >= 10 && !didResume.current) {
        didResume.current = true;
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
      }

      // --- PHASE 2: 40% -> Pick Random Track ---
      if (p >= 40 && !didPick.current) {
        didPick.current = true;
        const currentTracks = tracksRef.current;
        if (currentTracks.length > 0) {
          const randomTrack = currentTracks[Math.floor(Math.random() * currentTracks.length)];
          randomTrackRef.current = randomTrack;
          // Pre-set playlist here so UI might update or prepare
          setPlaylist(currentTracks);
        }
      }

      // --- PHASE 3: 50% -> Play Track ---
      if (p >= 50 && !didPlay.current) {
        didPlay.current = true;
        const track = randomTrackRef.current;
        if (track) {
          const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
          const ext = track.audio_ext || 'wav';
          const audioUrl = `${r2BaseUrl}/${track.tile_id}/audio.${ext}`;
          // Trigger play - fire and forget inside interval
          playTrack(track.id, audioUrl, track.title, track.artist);
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

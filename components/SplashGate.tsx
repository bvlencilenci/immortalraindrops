'use client';

import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
// Using a separate SplashScreen component is fine, or we can inline the style here.
// Let's reuse the logic from the previous SplashScreen but make it a "Gate".
import { useEffect, useState } from 'react';

const SplashGate = () => {
  const hasEntered = useAudioStore((state) => state.hasEntered);
  const enterApp = useAudioStore((state) => state.enterApp);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const playTrack = useAudioStore((state) => state.playTrack);
  const [mounted, setMounted] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Fetch tracks in background so they are ready
    import('../app/actions').then(({ getTracks }) => {
      getTracks().then((data) => {
        setTracks(data);
      });
    });
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch
  if (hasEntered) return null;

  const handleEnter = async () => {
    setIsWarming(true);

    // Phase 1: 0 -> 30% (Resume & Fetch)
    // We animate progress manually or via an interval, but let's just use simple steps for now with smooth CSS transition?
    // User requested "Animate it from 0% to 100% over 2-3 seconds".
    // Let's us a simple interval that checks milestones.

    // Start filling
    const startTime = Date.now();
    const duration = 2500; // 2.5s total target

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let p = (elapsed / duration) * 100;
      if (p > 100) p = 100;
      setProgress(p);

      if (p >= 100) {
        clearInterval(interval);
      }
    }, 16);

    // EXECUTE LOGIC PARALLEL TO ANIMATION

    // 1. Resume Audio Context
    if (Howler.ctx) {
      await Howler.ctx.resume();
    }

    // 2. Fetch Tracks (if not already fetched, but we might have them from useEffect? 
    // User says "fetch the track list from Supabase" in Phase 1. 
    // Let's re-fetch or use the ones we have, but to be safe and strictly follow "fetch", we can ensure we have them.)
    let currentTracks = tracks;
    if (currentTracks.length === 0) {
      const { getTracks } = await import('../app/actions');
      currentTracks = await getTracks();
      setTracks(currentTracks);
    }

    // Check if we need to hold for Phase 1 (30%)? 
    // The animation is continuous 0-100 over 2.5s. 
    // We just need to ensure the tasks *complete* before we actually finish.
    // But usually fetch+resume is fast.

    // 3. Play Random Track
    if (currentTracks.length > 0) {
      setPlaylist(currentTracks);
      const randomTrack = currentTracks[Math.floor(Math.random() * currentTracks.length)];
      const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
      const ext = randomTrack.audio_ext || 'wav';
      const audioUrl = `${r2BaseUrl}/${randomTrack.tile_id}/audio.${ext}`;

      await playTrack(randomTrack.id, audioUrl, randomTrack.title, randomTrack.artist);
    }

    // Wait for animation to finish if logic was faster
    // We can just wait for a promise that resolves when progress hits 100
    // But simple way: ensure we wait at least the duration.
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);

    setTimeout(() => {
      enterApp(); // Finalize
    }, remaining);
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

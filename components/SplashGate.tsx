'use client';

import { useAudioStore } from '../store/useAudioStore';
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
    await enterApp();

    // Set playlist and play random track if available
    if (tracks.length > 0) {
      setPlaylist(tracks);
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

      const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';
      const ext = randomTrack.audio_ext || 'wav';
      const audioUrl = `${r2BaseUrl}/${randomTrack.tile_id}/audio.${ext}`;

      playTrack(randomTrack.id, audioUrl, randomTrack.title, randomTrack.artist);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <button
        onClick={handleEnter}
        className="text-[#ECEEDF] text-[32px] md:text-[48px] font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity"
      >
        CLICK TO ENTER
      </button>
    </div>
  );
};

export default SplashGate;

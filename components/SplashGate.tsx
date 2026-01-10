'use client';

import { useAudioStore } from '../store/useAudioStore';
// Using a separate SplashScreen component is fine, or we can inline the style here.
// Let's reuse the logic from the previous SplashScreen but make it a "Gate".
import { useEffect, useState } from 'react';

const SplashGate = () => {
  const hasEntered = useAudioStore((state) => state.hasEntered);
  const enterApp = useAudioStore((state) => state.enterApp);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch
  if (hasEntered) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <button
        onClick={() => enterApp()}
        className="text-[#ECEEDF] text-[32px] md:text-[48px] font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity"
      >
        CLICK TO ENTER
      </button>
    </div>
  );
};

export default SplashGate;

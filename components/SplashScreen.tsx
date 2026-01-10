'use client';

import { useAudioStore } from '../store/useAudioStore';

const SplashScreen = () => {
  const enterApp = useAudioStore((state) => state.enterApp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <button
        onClick={() => enterApp()}
        className="text-[#ECEEDF] text-[32px] md:text-[48px] font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity"
      >
        Click to Enter
      </button>
    </div>
  );
};

export default SplashScreen;

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  radioSkipTrack,
  radioSkipFeatured,
  radioSkipNormal,
  radioGetStatus,
  radioGetNowPlaying,
} from '@/app/godmode/actions';

export default function BroadcastControls() {
  const [status, setStatus] = useState<string>('CONNECTING...');
  const [nowPlaying, setNowPlaying] = useState<string>('—');
  const [isSkipping, setIsSkipping] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Flash feedback for 2 seconds
  const flashAction = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 2000);
  };

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // Poll status every 10 seconds
  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, npRes] = await Promise.all([
        radioGetStatus(),
        radioGetNowPlaying(),
      ]);

      if (statusRes.success && statusRes.result) {
        // Parse "mode=LIVE" or "mode=PLAYLIST"
        const mode = statusRes.result.replace('mode=', '').trim();
        setStatus(mode);
      } else {
        setStatus('OFFLINE');
      }

      if (npRes.success && npRes.result) {
        setNowPlaying(npRes.result.trim());
      }
    } catch {
      setStatus('ERROR');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleSkip = async (type: 'main' | 'featured' | 'normal') => {
    setIsSkipping(true);
    setError(null);

    let res;
    switch (type) {
      case 'main':
        res = await radioSkipTrack();
        break;
      case 'featured':
        res = await radioSkipFeatured();
        break;
      case 'normal':
        res = await radioSkipNormal();
        break;
    }

    if (res.success) {
      flashAction(`SKIPPED ${type.toUpperCase()}`);
      // Refresh status after skip
      setTimeout(fetchStatus, 1000);
    } else {
      flashError(res.error || 'Skip failed');
    }

    setIsSkipping(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-4xl font-mono">

      {/* STATUS HUD */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 relative overflow-hidden group hover:border-[#ECEEDF]/20 transition-colors">
        {/* Subtle scan line effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(236,238,223,0.015)_2px,rgba(236,238,223,0.015)_4px)] pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6">
            TRANSMISSION STATUS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Indicator */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">ENGINE MODE</span>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  status === 'LIVE' 
                    ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]' 
                    : status === 'PLAYLIST' 
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                      : 'bg-[#ECEEDF]/20'
                }`} />
                <span className={`text-xl font-bold tracking-tight ${
                  status === 'LIVE' ? 'text-red-500' : 'text-[#ECEEDF]'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Now Playing */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">NOW PLAYING</span>
              <span className="text-sm text-[#ECEEDF] truncate max-w-[300px]">
                {nowPlaying}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SKIP CONTROLS */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 group hover:border-[#ECEEDF]/20 transition-colors">
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
          TRACK CONTROL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Skip Main Radio */}
          <button
            onClick={() => handleSkip('main')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/20 bg-black/40 text-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] hover:shadow-[0_0_20px_rgba(236,238,223,0.2)] active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP TRACK</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-4 h-4 fill-current">
              <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
            </svg>
          </button>

          {/* Skip Featured Source */}
          <button
            onClick={() => handleSkip('featured')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/10 bg-black/40 text-[#ECEEDF]/60 hover:bg-[#ECEEDF]/10 hover:text-[#ECEEDF] hover:border-[#ECEEDF]/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP FEATURED</span>
            <span className="text-[8px] opacity-50">▶▶</span>
          </button>

          {/* Skip Normal Source */}
          <button
            onClick={() => handleSkip('normal')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/10 bg-black/40 text-[#ECEEDF]/60 hover:bg-[#ECEEDF]/10 hover:text-[#ECEEDF] hover:border-[#ECEEDF]/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP NORMAL</span>
            <span className="text-[8px] opacity-50">▶▶</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {lastAction && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#ECEEDF] text-black font-mono text-[10px] uppercase tracking-[0.3em] px-6 py-3 shadow-[0_0_30px_rgba(236,238,223,0.3)] animate-pulse">
          ✓ {lastAction}
        </div>
      )}

      {/* ERROR TOAST */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-red-400/50">
          ✗ {error}
        </div>
      )}
    </div>
  );
}

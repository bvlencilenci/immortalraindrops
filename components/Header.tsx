'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const {
    trackTitle,
    trackArtist,
    isPlaying,
    togglePlay,
    skipTrack,
    skipBack,
    seek,
    duration,
    volume,
    adjustVolume,
    currentlyPlayingId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seekTo
  } = useAudioStore();

  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prevVolumeRef = useRef(1.0);

  useEffect(() => {
    // 1. Initial Fetch of Live State
    const fetchSettings = async () => {
      const { supabase } = await import('../lib/supabase'); // Dynamic import to avoid SSR issues if used there
      const { data } = await supabase
        .from('site_settings')
        .select('is_live, stream_title')
        .eq('id', 1)
        .single();

      if (data) {
        useAudioStore.getState().setLiveState(data.is_live, data.stream_title);
      }
    };

    fetchSettings();

    // 2. Realtime Listener
    const setupListener = async () => {
      const { supabase } = await import('../lib/supabase');
      const channel = supabase
        .channel('site_settings_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'site_settings',
            filter: 'id=eq.1'
          },
          (payload) => {
            const newData = payload.new as { is_live: boolean; stream_title: string };
            useAudioStore.getState().setLiveState(newData.is_live, newData.stream_title);

            // Optional: If going live, pause any archive playback so user can switch? 
            // Or let them stay on archive until they click LIVE. 
            // User requested: "Store Sync: When is_live becomes true, trigger a 'pause' on the useAudioStore"
            if (newData.is_live) {
              useAudioStore.getState().howl?.pause();
              // Note: We don't force them to /live, but we pause archive so they notice.
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = setupListener();

    // 3. Keep existing scroll/key handlers
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      /* existing handler logic */
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.key === 'm' || e.key === 'M') {
        if (useAudioStore.getState().volume > 0) {
          prevVolumeRef.current = useAudioStore.getState().volume;
          adjustVolume(0);
        } else {
          adjustVolume(prevVolumeRef.current || 0.5);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [togglePlay, adjustVolume]);

  // Hide header on root landing page
  if (pathname === '/') return null;

  const isPlayerActive = !!currentlyPlayingId;
  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return "/speaker-simple-slash.svg"; // Mute (0%)
    if (volume <= 0.33) return "/speaker-simple-none.svg"; // Low/No wave (1-33%)
    if (volume <= 0.66) return "/speaker-simple-low.svg"; // Medium waves (34-66%)
    return "/speaker-simple-high.svg"; // High/Full waves (67-100%)
  };

  return (
    <header className={`sticky top-0 left-0 right-0 w-full h-[10vh] min-h-[60px] z-50 transition-all duration-300 ease-in-out ${isScrolled
      ? "bg-[#ECEEDF]/5 backdrop-blur-xl border-b border-[#ECEEDF]/10 bg-gradient-to-b from-[#ECEEDF]/10 to-transparent"
      : "bg-[#0F0E0E]"
      }`}>

      {/* Constraints Wrapper (Max Width: 1400px) */}
      <div className="w-full h-full max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between md:grid md:grid-cols-3 relative">

        {/* --- MOBILE NAV GRID (Visible < md) --- */}
        {/* --- MOBILE FLOATING TACTILE TAB (< lg) --- */}
        {/* Fixed top-center pill */}
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] lg:hidden w-auto">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full h-12 px-6 flex items-center justify-between gap-6 shadow-2xl min-w-[300px]">
            {/* Left: LIVE */}
            <Link href="/live" className={`font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 ${pathname === '/live' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
              [ LIVE ]
            </Link>

            {/* Center: LOGO (Text) */}
            <Link href="/" className="flex flex-col items-center justify-center group leading-none">
              <span className="font-mono font-bold text-[10px] text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
                IMMORTAL
              </span>
              <span className="font-mono font-bold text-[10px] text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
                RAINDROPS
              </span>
            </Link>

            {/* Right: ARCHIVE */}
            <Link href="/archive" className={`font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 ${pathname === '/archive' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
              [ ARCHIVE ]
            </Link>
          </div>
        </nav>

        {/* --- DESKTOP LAYOUT (Hidden < md) --- */}

        {/* BLOCK 1: Left - Station Identity & Meta (Desktop) */}
        <div className="hidden md:flex justify-self-start items-center z-10 shrink-0">

          {/* Title - Hidden on Mobile if Player is Active to save space, or kept small? 
              User request: "Center-align track metadata" on mobile. 
              Let's hide the Title on mobile if player is active to focus on Metadata. 
          */}
          <div
            className={`flex items-center gap-4 relative cursor-pointer group pr-6 ${isPlayerActive ? 'hidden md:flex' : 'flex'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex flex-col text-[#ECEEDF]">
              <span
                className="font-mono font-bold tracking-tighter leading-none whitespace-nowrap"
                style={{ fontSize: 'clamp(1rem, 2.5vh, 2rem)' }} // Fluid Typography
              >
                IMMORTAL
              </span>
              <span
                className="font-mono font-bold tracking-tighter leading-none whitespace-nowrap"
                style={{ fontSize: 'clamp(1rem, 2.5vh, 2rem)' }}
              >
                RAINDROPS
              </span>
            </div>

            {/* Inactive State Hint (Vertical Lines) */}
            <div className={`flex gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-30'}`}>
              <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
              <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
              <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
            </div>

            {/* Horizontal Slide Navigation - Desktop Only */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  key="nav-links"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden md:flex items-center gap-x-6 lg:gap-x-12 overflow-hidden whitespace-nowrap pl-6" // Added lg:gap-12
                >
                  <Link href="/" className="text-[#ECEEDF] text-[13px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">HOME</Link>
                  <Link href="/archive" className="text-[#ECEEDF] text-[13px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">ARCHIVE</Link>
                  <Link href="/live" className="text-[#ECEEDF] text-[13px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">LIVE</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Metadata (Left aligned next to title) */}
          {isPlayerActive && (
            <motion.div
              className="hidden md:flex flex-col justify-center border-l border-[#ECEEDF]/20 pl-6 max-w-[20vw] md:max-w-[15vw]"
              initial={{ marginLeft: "1rem" }}
              animate={{ marginLeft: isHovered ? "2rem" : "1rem" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {useAudioStore.getState().isLive ? (
                <>
                  <span className="font-mono text-[2vh] text-[#FF0000] lowercase leading-tight truncate animate-pulse">
                    ● live
                  </span>
                  <span className="font-mono text-[2vh] text-[#ECEEDF] uppercase font-bold leading-tight truncate">
                    DJ SET
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[2vh] text-[#ECEEDF] lowercase leading-tight truncate">
                    {trackArtist || 'Unknown Artist'}
                  </span>
                  <span className="font-mono text-[2vh] text-[#ECEEDF] uppercase font-bold leading-tight truncate">
                    {trackTitle || 'Unknown Track'}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* BLOCK 2: Center - Playback Controls */}
        <div className="hidden md:flex col-span-3 md:col-span-1 justify-self-center z-20 pointer-events-auto w-full md:w-auto flex-col items-center justify-center">
          {isPlayerActive && (
            <div className="flex flex-col items-center">
              {/* Mobile Metadata (Centered) */}
              <div className="flex md:hidden flex-col items-center mb-2">
                <span className="text-xs font-mono text-neutral-400 lowercase tracking-widest">{useAudioStore.getState().isLive ? '● live' : trackArtist}</span>
                <span className="text-sm font-bold text-[#ECEEDF] uppercase tracking-wider">{useAudioStore.getState().isLive ? 'DJ SET' : trackTitle}</span>
              </div>

              <div className="flex items-center gap-8 md:gap-[2vw]">
                <button
                  onClick={(e) => { e.stopPropagation(); skipBack(); }}
                  className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110 active:scale-95"
                  title="Previous / Restart"
                >
                  <img src="/skip-back.svg" alt="Back" className="w-[3vh] h-[3vh] min-w-[24px] min-h-[24px] invert opacity-80" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="flex items-center justify-center bg-[#ECEEDF]/5 w-[7vh] h-[7vh] min-w-[50px] min-h-[50px] rounded-full transition-all duration-200 border border-[#ECEEDF]/10 hover:bg-[#ECEEDF]/10 hover:scale-110 active:scale-95"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <img
                    src={isPlaying ? "/pause.svg" : "/play.svg"}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="w-[3.5vh] h-[3.5vh] min-w-[20px] min-h-[20px] invert translate-x-[1px]"
                  />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipTrack(); }}
                  className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110 active:scale-95"
                  title="Skip"
                >
                  <img src="/skip-forward.svg" alt="Skip" className="w-[3vh] h-[3vh] min-w-[24px] min-h-[24px] invert opacity-80" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BLOCK 3: Right - Utility Stack (Desktop Only for Volume) */}
        <div className="hidden md:flex justify-self-end flex-1 justify-end items-center z-10 shrink-0">
          {isPlayerActive && (
            <div className="flex flex-col items-end gap-[0.5vh]">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustVolume(volume > 0 ? 0 : 0.5);
                  }}
                >
                  <img
                    src={getVolumeIcon()}
                    alt="Volume"
                    className="w-[2vh] h-[2vh] invert opacity-80"
                  />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    adjustVolume(parseFloat(e.target.value));
                  }}
                  className="w-[10vw] max-w-[120px] min-w-[80px] h-[2px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:bg-[#ECEEDF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-none outline-none opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(to right, #ECEEDF ${volume * 100}%, rgba(236,238,223,0.1) ${volume * 100}%)`
                  }}
                />
              </div>
              <span className="font-mono text-[1.5vh] text-[#ECEEDF]/60 tracking-widest leading-none tabular-nums">
                {formatTime(seek)} / {formatTime(duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BLOCK 4: Full-Width Scrubber (Outside Padded Wrapper) - Desktop Only */}
      {/* BLOCK 4: Full-Width Scrubber (Outside Padded Wrapper) - Desktop Only */}
      {isPlayerActive && (
        <div className="hidden md:flex absolute bottom-0 left-0 right-0 w-full h-[12px] hover:h-[24px] overflow-visible items-end z-[60] group/scrubber transition-all duration-200 ease-out">

          {/* Interaction Layer (Invisible Input - Massive Hitbox) */}
          {/* absolute -bottom-6 means it extends 24px below the header, and top-0 extends full height of container */}
          {/* We actually want the hitbox to be roughly 48px centered on the line. 
               The container is positioned at bottom-0. 
               Let's make the container itself the hit area trigger, but the input needs to capture events. */}
          <div className="absolute bottom-[-18px] left-0 w-full h-[48px] z-50">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={seek}
              onChange={(e) => {
                e.stopPropagation();
                seekTo(parseFloat(e.target.value));
              }}
              className="w-full h-full opacity-0 cursor-pointer focus-visible:outline-none"
              aria-label="Playback position"
            />
          </div>

          {/* Visual Track Layer (Pointer Events None) */}
          {/* Positioned at bottom of header */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ECEEDF]/20 group-hover/scrubber:h-[6px] transition-all duration-200 ease-out pointer-events-none">
            {/* Progress Fill */}
            <div
              className="h-full bg-[#ECEEDF] relative transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Thumb (Right Edge of Progress) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 group-hover/scrubber:w-4 group-hover/scrubber:h-4 bg-[#ECEEDF] rounded-full shadow-[0_0_10px_rgba(236,238,223,0.5)] transition-all duration-200 ease-out translate-x-1/2" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

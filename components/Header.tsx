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
    hasEntered,
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

  // Hide header on root landing page OR if SplashGate is active (!hasEntered)
  if (pathname === '/' || !hasEntered) return null;

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
    <>
      {/* --- MOBILE NAV SHIELD (Solid Black Background) --- */}
      <div className="fixed top-0 left-0 w-full h-[90px] bg-black z-40 lg:hidden pointer-events-none" />

      {/* --- MOBILE SCROLL-MORPHING HEADER (< lg) --- */}
      <motion.nav
        className="fixed z-50 lg:hidden flex justify-center items-center overflow-hidden"
        initial={{ top: 0, width: "100%", borderRadius: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
        animate={{
          top: isScrolled ? 24 : 0,
          width: isScrolled ? "min(90%, 460px)" : "100%",
          borderRadius: isScrolled ? 9999 : 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          border: isScrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
          boxShadow: isScrolled ? "0 4px 0 0 rgba(0,0,0,1)" : "none",
          backdropFilter: "blur(12px)",
          left: isScrolled ? "50%" : "0%",
          x: isScrolled ? "-50%" : "0%",
          height: 62, // +10% larger (approx)
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        layout
      >
        <div className="w-full h-full px-8 flex items-center justify-center gap-6">
          {/* Left: LIVE */}
          <Link href="/live" className={`shrink-0 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 ${pathname === '/live' ? 'text-white' : 'text-[#ECEEDF] hover:text-white'}`}>
            [ LIVE ]
          </Link>

          {/* Center: LOGO (Text) */}
          <Link
            href="/"
            className="ml-12 shrink-0 flex flex-col items-center justify-center group leading-none"
          >
            <span className="font-mono text-sm text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
              IMMORTAL
            </span>
            <span className="font-mono text-sm text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
              RAINDROPS
            </span>
          </Link>

          {/* Right: ARCHIVE */}
          <Link href="/archive" className={`shrink-0 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 ${pathname === '/archive' ? 'text-white' : 'text-[#ECEEDF] hover:text-white'}`}>
            [ ARCHIVE ]
          </Link>
        </div>
      </motion.nav>

      {/* --- DESKTOP HEADER (Visible >= lg) --- */}
      <header className={`hidden lg:block fixed top-0 left-0 right-0 w-full h-[10vh] min-h-[60px] z-50 transition-all duration-300 ease-in-out backdrop-blur-md ${isScrolled
        ? "bg-[#ECEEDF]/5 border-b border-[#ECEEDF]/10 bg-gradient-to-b from-[#ECEEDF]/10 to-transparent"
        : "bg-[#0F0E0E]"
        }`}>

        {/* Content Wrapper */}
        <div className="relative w-full h-full max-w-[1400px] mx-auto px-8 flex items-center justify-between">

          {/* LEFT ZONE - Station Identity & Metadata (HORIZONTAL layout) */}
          <div className="flex items-center gap-6">

            {/* Logo & Nav Group */}
            <div
              className="flex items-center gap-6 group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Station Name */}
              <Link href="/" className="flex flex-col font-mono tracking-widest whitespace-nowrap cursor-pointer group">
                <span className="text-[#ECEEDF] text-sm leading-none opacity-90 group-hover:opacity-100 transition-opacity">IMMORTAL</span>
                <span className="text-[#ECEEDF] text-sm leading-none opacity-90 group-hover:opacity-100 transition-opacity">RAINDROPS</span>
              </Link>

              {/* Nav Decorator & Links */}
              <div className="flex items-center gap-4">
                <div className={`flex gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-30'}`}>
                  <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
                  <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
                  <div className="w-[1px] h-[2vh] bg-[#ECEEDF] font-thin"></div>
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      key="nav-links"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-x-6 overflow-hidden whitespace-nowrap"
                    >
                      <Link href="/archive" className="text-[#ECEEDF] text-[13px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">ARCHIVE</Link>
                      <Link href="/live" className="text-[#ECEEDF] text-[13px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">LIVE</Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Metadata - NEXT to station name, with separator */}
            {isPlayerActive && (
              <div className="flex flex-col justify-center border-l border-[#ECEEDF]/30 pl-4 font-mono">
                {useAudioStore.getState().isLive ? (
                  <>
                    <span className="text-[#FF0000] text-xs whitespace-nowrap animate-pulse lowercase">● live</span>
                    <span className="text-[#ECEEDF] text-sm whitespace-nowrap uppercase font-bold">DJ SET</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#ECEEDF]/70 text-xs whitespace-nowrap lowercase">{trackArtist || 'Unknown Artist'}</span>
                    <span className="text-[#ECEEDF] text-sm whitespace-nowrap uppercase font-bold">{trackTitle || 'Unknown Track'}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CENTER - Playback controls (Absolute Center) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            {isPlayerActive && (
              <div className="flex items-center gap-[2vw]">
                <button onClick={(e) => { e.stopPropagation(); skipBack(); }} className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110 active:scale-95" title="Previous">
                  <img src="/skip-back.svg" alt="Back" className="w-[3vh] h-[3vh] min-w-[24px] min-h-[24px] invert opacity-80" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="flex items-center justify-center bg-[#ECEEDF]/5 w-[7vh] h-[7vh] min-w-[50px] min-h-[50px] rounded-full transition-all duration-200 border border-[#ECEEDF]/10 hover:bg-[#ECEEDF]/10 hover:scale-110 active:scale-95" title="Play/Pause">
                  <img src={isPlaying ? "/pause.svg" : "/play.svg"} alt="Play/Pause" className="w-[3.5vh] h-[3.5vh] min-w-[20px] min-h-[20px] invert translate-x-[1px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); skipTrack(); }} className="flex items-center justify-center transition-all duration-200 opacity-100 hover:scale-110 active:scale-95" title="Skip">
                  <img src="/skip-forward.svg" alt="Skip" className="w-[3vh] h-[3vh] min-w-[24px] min-h-[24px] invert opacity-80" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT ZONE - Volume & Timestamp */}
          <div className="flex flex-col items-end gap-1">
            {isPlayerActive && (
              <>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); adjustVolume(volume > 0 ? 0 : 0.5); }} className="flex items-center justify-center">
                    <img src={getVolumeIcon()} alt="Volume" className="w-[2vh] h-[2vh] invert opacity-80" />
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => { e.stopPropagation(); adjustVolume(parseFloat(e.target.value)); }}
                    className="w-[10vw] max-w-[120px] min-w-[80px] h-[2px] appearance-none cursor-pointer bg-[#ECEEDF]/20 opacity-80 hover:opacity-100"
                    style={{ background: `linear-gradient(to right, #ECEEDF ${volume * 100}%, rgba(236,238,223,0.1) ${volume * 100}%)` }}
                  />
                </div>
                <span className="w-[10vw] max-w-[120px] min-w-[80px] text-center font-mono text-[1.5vh] text-[#ECEEDF]/60 tracking-widest leading-none tabular-nums truncate">
                  {formatTime(seek)} / {formatTime(duration)}
                </span>
              </>
            )}
          </div>

        </div>

        {/* Progress bar - OUTSIDE the padded wrapper, full width */}
        {isPlayerActive && (
          <div className="hidden md:flex absolute bottom-0 left-0 right-0 w-full h-[12px] hover:h-[24px] overflow-visible items-end z-[60] group/scrubber transition-all duration-200 ease-out">

            {/* Interaction Layer (Invisible Input - Massive Hitbox) */}
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
                className="w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Visual Track Layer (Pointer Events None) */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] group-hover/scrubber:h-[6px] transition-all duration-200">
              {/* Background */}
              <div className="absolute top-0 left-0 w-full h-full bg-[#ECEEDF]/10" />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-[#FF0000] relative"
                style={{ width: `${(seek / (duration || 1)) * 100}%` }}
              >
                {/* Thumb */}
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#ECEEDF] rounded-full opacity-0 group-hover/scrubber:opacity-100 transition-opacity duration-200 shadow-[0_0_10px_rgba(236,238,223,0.5)]" />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

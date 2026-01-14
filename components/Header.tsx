'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isGodmode, setIsGodmode] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, is_godmode')
        .eq('id', userId)
        .single();

      if (data) {
        setUsername(data.username);
        setIsGodmode(data.is_godmode || false);
      }
    };

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUsername(null);
        setIsGodmode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      {/* --- MOBILE DYNAMIC ISLAND HEADER (< lg) --- */}
      <motion.nav
        layout
        className="sticky top-0 z-[100] lg:hidden flex items-center justify-between overflow-hidden self-center whitespace-nowrap"
        initial={{
          top: 0,
          width: "100%",
          maxWidth: "100%",
          borderRadius: 0,
          backgroundColor: "#0F0E0E",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "1rem 1rem",
          gap: "0.5rem"
        }}
        animate={{
          top: isScrolled ? 12 : 0,
          width: isScrolled ? "auto" : "100%",
          maxWidth: isScrolled ? "calc(100% - 32px)" : "100%",
          borderRadius: isScrolled ? 100 : 0,
          backgroundColor: isScrolled ? "rgba(0,0,0,0.6)" : "#0F0E0E",
          border: isScrolled ? "1px solid rgba(255,255,255,0.1)" : "none",
          borderBottom: isScrolled ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "none",
          backdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "none",
          padding: isScrolled ? "0.75rem 1rem" : "1.25rem 1rem",
          gap: isScrolled ? "0.5rem" : "0.5rem"
        }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Left: LIVE */}
        <Link href="/live" className="shrink-0 flex justify-center items-center font-mono text-[11px] xs:text-xs uppercase tracking-widest transition-colors duration-200 border border-transparent px-3 py-3 rounded-xl text-[#ECEEDF] hover:text-white">
          <span className={`${pathname === '/live' ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>[</span>
          <span className={`mx-2 ${pathname === '/live' ? 'text-white' : ''} transition-colors duration-200`}>LIVE</span>
          <span className={`${pathname === '/live' ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>]</span>
        </Link>

        {/* Center: LOGO */}
        <Link
          href="/"
          className="shrink-0 flex flex-col items-center justify-center group leading-none mx-1 gap-0.5"
        >
          <span className="font-mono text-[13px] xs:text-sm font-bold text-[#ECEEDF] uppercase tracking-tighter">
            IMMORTAL
          </span>
          <span className="font-mono text-[13px] xs:text-sm font-bold text-[#ECEEDF] uppercase tracking-tighter">
            RAINDROPS
          </span>
        </Link>

        {/* Right: ARCHIVE */}
        <Link href="/archive" className="shrink-0 flex justify-center items-center font-mono text-[11px] xs:text-xs uppercase tracking-widest transition-colors duration-200 border border-transparent px-3 py-3 rounded-xl text-[#ECEEDF] hover:text-white">
          <span className={`${pathname === '/archive' ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>[</span>
          <span className={`mx-2 ${pathname === '/archive' ? 'text-white' : ''} transition-colors duration-200`}>ARCHIVE</span>
          <span className={`${pathname === '/archive' ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>]</span>
        </Link>
      </motion.nav>

      {/* --- DESKTOP HEADER (Visible >= lg) --- */}
      <header className={`hidden lg:flex sticky top-0 z-[100] w-full h-[11.1vh] px-[4vw] transition-all duration-300 ease-in-out backdrop-blur-md ${isScrolled
        ? "bg-black/40 border-b border-[#ECEEDF]/10"
        : "bg-black"
        }`}>

        {/* Side Elements (Flex) */}
        <div className="w-full h-full flex items-center justify-between">

          {/* BLOCK 1: Left - Station Identity */}
          <div
            className="flex items-center justify-start min-w-0 gap-8 overflow-hidden z-30"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Center: LOGO (Text) */}
            <Link
              href="/"
              className="shrink-0 flex flex-col items-start justify-center group leading-none whitespace-nowrap font-mono"
            >
              <span className="font-mono text-base text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                IMMORTAL
              </span>
              <span className="font-mono text-base text-[#ECEEDF] uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                RAINDROPS
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className={`flex gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-30'}`}>
                <div className="w-[1px] h-5 bg-[#ECEEDF] font-thin"></div>
                <div className="w-[1px] h-5 bg-[#ECEEDF] font-thin"></div>
                <div className="w-[1px] h-5 bg-[#ECEEDF] font-thin"></div>
              </div>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="nav-links"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-x-6 overflow-hidden whitespace-nowrap pl-2"
                  >
                    <Link href="/archive" className="text-[#ECEEDF] text-[15px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">ARCHIVE</Link>
                    <Link href="/live" className="text-[#ECEEDF] text-[15px] tracking-[0.3em] font-mono hover:text-white transition-colors bg-transparent uppercase">LIVE</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isPlayerActive && (
              <div className="flex flex-col justify-center border-l border-[#ECEEDF]/20 pl-6 max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden">
                {pathname === '/upload' ? (
                  <span className="font-mono text-[15px] text-[#ECEEDF] uppercase font-bold leading-tight truncate tracking-widest whitespace-nowrap">
                    UPLOAD MODE
                  </span>
                ) : useAudioStore.getState().isLive ? (
                  <>
                    <span className="font-mono text-[15px] text-[#FF0000] lowercase leading-tight truncate animate-pulse whitespace-nowrap">
                      ● live
                    </span>
                    <span className="font-mono text-[15px] text-[#ECEEDF] uppercase font-bold leading-tight truncate whitespace-nowrap">
                      DJ SET
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[15px] text-[#ECEEDF] lowercase leading-tight truncate whitespace-nowrap">
                      {trackArtist || 'Unknown Artist'}
                    </span>
                    <span className="font-mono text-[15px] text-[#ECEEDF] uppercase font-bold leading-tight truncate whitespace-nowrap">
                      {trackTitle || 'Unknown Track'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* BLOCK 3: Right - Volume Controls */}
          <div className="flex items-center justify-end z-40 gap-8">

            {/* AUTH BUTTON (Desktop) */}
            <div className="relative">
              {!user ? (
                <Link
                  href="/login"
                  className="hidden md:flex items-center justify-center font-mono text-[15px] text-[#ECEEDF] tracking-[0.2em] hover:text-white transition-colors uppercase whitespace-nowrap"
                >
                  [ SIGN_IN ]
                </Link>
              ) : (
                <>
                  {isGodmode && (
                    <Link
                      href="/godmode"
                      className="hidden md:flex items-center justify-center font-mono text-[15px] text-red-500 tracking-[0.2em] hover:text-red-400 transition-colors uppercase whitespace-nowrap mr-6"
                    >
                      [ GODMODE ]
                    </Link>
                  )}

                  <Link
                    href="/account"
                    className="hidden md:flex items-center justify-center font-mono text-[15px] text-[#ECEEDF] tracking-[0.2em] hover:text-white transition-colors uppercase whitespace-nowrap"
                  >
                    [ {username ? username.toUpperCase() : (user?.email?.split('@')[0].toUpperCase().slice(0, 8) || 'USER')} ]
                  </Link>
                </>
              )}
            </div>

            {/* VOLUME CONTROLS */}
            {isPlayerActive && (
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
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
                      className="w-5 h-5 invert opacity-80"
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
                    className="w-[120px] h-[2px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:bg-[#ECEEDF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-none outline-none opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(to right, #ECEEDF ${volume * 100}%, rgba(236,238,223,0.1) ${volume * 100}%)`
                    }}
                  />
                </div>
                {/* Time Display */}
                <span className="w-[120px] text-center font-mono text-[12px] text-[#ECEEDF]/60 tracking-widest leading-none tabular-nums truncate">
                  {formatTime(seek)} / {formatTime(duration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* BLOCK 2: Center - Player Buttons (Absolute Center Pivot) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-50">
          {isPlayerActive && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); skipBack(); }}
                className="absolute right-full mr-[15rem] hover:opacity-50 transition-opacity flex items-center justify-center whitespace-nowrap"
                title="Previous / Restart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-8 h-8" fill="#ECEEDF">
                  <path d="M199.81,34a16,16,0,0,0-16.24.43L64,109.23V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0V146.77l119.57,74.78A15.95,15.95,0,0,0,208,208.12V47.88A15.86,15.86,0,0,0,199.81,34ZM192,208,64.16,128,192,48.07Z" />
                </svg>
              </button>
              <div className="relative"> {/* Pivot Point */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="hover:opacity-50 transition-opacity flex items-center justify-center whitespace-nowrap"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <img
                    src={isPlaying ? "/pause.svg" : "/play.svg"}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="w-10 h-10 invert"
                  />
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); skipTrack(); }}
                className="absolute left-full ml-[15rem] hover:opacity-50 transition-opacity flex items-center justify-center whitespace-nowrap"
                title="Skip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-8 h-8" fill="#ECEEDF">
                  <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* BLOCK 4: Full-Width Scrubber (Outside Padded Wrapper) - Desktop Only */}
        {
          isPlayerActive && (
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
                  className="w-full h-full cursor-pointer focus-visible:outline-none appearance-none"
                  aria-label="Playback position"
                  style={{
                    accentColor: 'transparent',
                    background: 'transparent',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    opacity: 0
                  }}
                />
              </div>

              {/* Visual Track Layer (Pointer Events None) */}
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
          )
        }
      </header>
    </>
  );
};

export default Header;

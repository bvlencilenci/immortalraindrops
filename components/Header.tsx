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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile Menu State
  const prevVolumeRef = useRef(1.0);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isGodmode, setIsGodmode] = useState(false);
  const [siteTitle, setSiteTitle] = useState('IMMORTAL RAINDROPS');

  useEffect(() => {
    // Close menu on route change
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
// ... lines 42-184
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
        {/* Left: LOGO */}
        <Link
          href="/"
          className="shrink-0 flex items-center group leading-none gap-2"
        >
          <div className="flex flex-col items-start">
            <span className="font-mono text-[11px] xs:text-[12px] font-bold text-[#ECEEDF] uppercase tracking-tighter leading-[0.9]">
              IMMORTAL
            </span>
            <span className="font-mono text-[11px] xs:text-[12px] font-bold text-[#ECEEDF] uppercase tracking-tighter leading-[0.9]">
              RAINDROPS
            </span>
          </div>
        </Link>

        {/* Center: NAV DOTS or Indicators (Optional) */}
        {!isScrolled && (
          <div className="flex items-center gap-4">
            <Link href="/live" className={`font-mono text-[10px] uppercase tracking-widest ${pathname === '/live' ? 'text-white font-bold' : 'text-[#ECEEDF]/50'}`}>[ LIVE ]</Link>
            <Link href="/archive" className={`font-mono text-[10px] uppercase tracking-widest ${pathname === '/archive' ? 'text-white font-bold' : 'text-[#ECEEDF]/50'}`}>[ ARCHIVE ]</Link>
          </div>
        )}

        {/* Right: HAMBURGER */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none z-[110]"
          aria-label="Toggle Menu"
        >
          <motion.span
            animate={isMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            className="w-6 h-[1.5px] bg-[#ECEEDF]"
          />
          <motion.span
            animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-6 h-[1.5px] bg-[#ECEEDF]"
          />
          <motion.span
            animate={isMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            className="w-6 h-[1.5px] bg-[#ECEEDF]"
          />
        </button>
      </motion.nav>

      {/* --- MOBILE NAVIGATION DRAWER --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[105] bg-black/95 backdrop-blur-xl lg:hidden flex flex-col p-12 pt-32"
          >
            <div className="flex flex-col gap-8">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-mono text-[#ECEEDF] uppercase tracking-tighter font-bold border-b border-[#ECEEDF]/10 pb-4">HOME</Link>
              <Link href="/archive" onClick={() => setIsMenuOpen(false)} className="text-4xl font-mono text-[#ECEEDF] uppercase tracking-tighter font-bold border-b border-[#ECEEDF]/10 pb-4">ARCHIVE</Link>
              <Link href="/live" onClick={() => setIsMenuOpen(false)} className="text-4xl font-mono text-[#ECEEDF] uppercase tracking-tighter font-bold border-b border-[#ECEEDF]/10 pb-4 flex items-center gap-4">
                LIVE <span className="text-red-500 animate-pulse text-xl">●</span>
              </Link>

              {user ? (
                <>
                  <Link href="/account" onClick={() => setIsMenuOpen(false)} className="text-2xl font-mono text-[#ECEEDF]/70 uppercase tracking-widest pt-4">ACCOUNT</Link>
                  {isGodmode && (
                    <Link href="/godmode" onClick={() => setIsMenuOpen(false)} className="text-2xl font-mono text-red-500 uppercase tracking-widest font-bold">GODMODE</Link>
                  )}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = '/';
                    }}
                    className="text-left text-xl font-mono text-red-900/40 uppercase tracking-widest mt-8"
                  >
                    [ LOGOUT ]
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-2xl font-mono text-[#ECEEDF]/70 uppercase tracking-widest pt-4">[ SIGN IN ]</Link>
              )}
            </div>

            {/* Visual Decor */}
            <div className="absolute bottom-12 left-12 flex flex-col gap-2 opacity-20 pointer-events-none font-mono text-[10px] tracking-[0.5em] uppercase">
              <span>SYSTEM_v2.0.4</span>
              <span>EST_04_2026</span>
              <span>IMMORTAL_RAINDROPS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE MINI PLAYER (Sticky Bottom) --- */}
      <AnimatePresence>
        {isPlayerActive && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden bg-black/80 backdrop-blur-xl border-t border-[#ECEEDF]/10 px-6 py-4 pb-8 flex flex-col gap-3"
          >
            {/* Scrubber */}
            <div className="w-full h-[2px] bg-[#ECEEDF]/10 relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#ECEEDF]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[#ECEEDF]/40 uppercase tracking-widest truncate">{trackArtist || 'Unknown Artist'}</span>
                <span className="font-mono text-xs text-[#ECEEDF] uppercase font-bold tracking-tighter truncate leading-none">{trackTitle || 'Unknown Track'}</span>
              </div>

              <div className="flex items-center gap-6 pl-4">
                <button onClick={(e) => { e.stopPropagation(); skipBack(); }} className="active:scale-95 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6" fill="#ECEEDF">
                    <path d="M199.81,34a16,16,0,0,0-16.24.43L64,109.23V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0V146.77l119.57,74.78A15.95,15.95,0,0,0,208,208.12V47.88A15.86,15.86,0,0,0,199.81,34ZM192,208,64.16,128,192,48.07Z" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-12 h-12 flex items-center justify-center bg-[#ECEEDF] rounded-full active:scale-90 transition-transform">
                  <img
                    src={isPlaying ? "/pause.svg" : "/play.svg"}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="w-6 h-6 invert"
                  />
                </button>
                <button onClick={(e) => { e.stopPropagation(); skipTrack(); }} className="active:scale-95 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6" fill="#ECEEDF">
                    <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP HEADER (Visible >= lg) --- */}
      <header className={`hidden lg:flex sticky top-0 z-[100] w-full h-[11.1vh] px-[4vw] transition-all duration-300 ease-in-out backdrop-blur-md ${isScrolled
        ? "bg-black/40 border-b border-[#ECEEDF]/10"
        : "bg-black"
        }`}>

        {/* Side Elements (Flex) */}
        <div className="w-full h-full flex items-center justify-between">

          {/* BLOCK 1: Left - Station Identity */}
          <div
            className="flex items-center justify-start shrink-0 gap-8 z-30"
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
              <div className="flex flex-col justify-center border-l border-[#ECEEDF]/20 pl-6 max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden min-w-0">
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

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { NavigationLink } from './ui/NavigationLink';
import { PlaybackControls } from './ui/PlaybackControls';
import { VolumeController } from './ui/VolumeController';

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
    streamTitle,
    isLive,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seekTo,
    playLiveStream
  } = useAudioStore();

  let displayArtist = '';
  let displayTitle = '';
  let showHeaderMetadata = false;

  if (currentlyPlayingId === 'radio-stream') {
    if (streamTitle && streamTitle !== 'OFFLINE' && streamTitle !== 'STANDBY' && streamTitle !== 'CONNECTING...') {
      const parts = streamTitle.split(/ - | — /);
      displayArtist = parts[0]?.trim();
      displayTitle = parts.slice(1).join(' - ')?.trim() || parts[0]?.trim();
      showHeaderMetadata = true;
    }
  } else if (currentlyPlayingId) {
    displayArtist = trackArtist || 'Unknown Artist';
    displayTitle = trackTitle || 'Unknown Track';
    showHeaderMetadata = true;
  } else {
    if (streamTitle && streamTitle !== 'OFFLINE' && streamTitle !== 'STANDBY' && streamTitle !== 'CONNECTING...') {
      const parts = streamTitle.split(/ - | — /);
      displayArtist = parts[0]?.trim();
      displayTitle = parts.slice(1).join(' - ')?.trim() || parts[0]?.trim();
      showHeaderMetadata = true;
    }
  }

  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const prevVolumeRef = useRef(1.0);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isGodmode, setIsGodmode] = useState(false);
  const [siteTitle, setSiteTitle] = useState('IMMORTAL RAINDROPS');
  const [broadcastMode, setBroadcastMode] = useState<'automated' | 'live'>('automated');

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
    // 1. Initial Fetch of Live State & System Settings
    const fetchSettings = async () => {
      const { supabase } = await import('../lib/supabase');
      // Live State
      const { data: liveData } = await supabase
        .from('system_settings')
        .select('is_live, stream_title, broadcast_mode')
        .eq('id', 1)
        .single();

      if (liveData) {
        useAudioStore.getState().setLiveState(liveData.is_live, liveData.stream_title);
        setBroadcastMode((liveData.broadcast_mode || 'automated') as 'automated' | 'live');
      }

      // System Settings (Title)
      const { data: systemData } = await supabase
        .from('system_settings')
        .select('site_title')
        .eq('id', 1)
        .single();

      if (systemData?.site_title) {
        setSiteTitle(systemData.site_title);
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
            table: 'system_settings',
            filter: 'id=eq.1'
          },
          (payload) => {
            const newData = payload.new as { is_live: boolean; stream_title: string; broadcast_mode?: string };
            useAudioStore.getState().setLiveState(newData.is_live, newData.stream_title);
            if (newData.broadcast_mode) {
              setBroadcastMode(newData.broadcast_mode as 'automated' | 'live');
            }

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

  // Hide header if SplashGate is active (!hasEntered)
  if (!hasEntered) return null;

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
        className="sticky top-0 z-[100] lg:hidden flex items-center justify-between overflow-hidden self-center whitespace-nowrap header-grain"
        initial={{
          top: 0,
          width: "100%",
          maxWidth: "100%",
          borderRadius: 0,
          backgroundColor: "#0A0A08",
          border: "none",
          borderBottom: currentlyPlayingId === 'radio-stream' ? "none" : "1px solid rgba(255,255,255,0.1)",
          padding: "1.25rem 1rem",
          gap: "0.5rem"
        }}
        animate={{
          top: isScrolled ? 12 : 0,
          width: isScrolled ? "auto" : "100%",
          maxWidth: isScrolled ? "calc(100% - 32px)" : "100%",
          borderRadius: isScrolled ? 100 : 0,
          backgroundColor: isScrolled ? "rgba(0,0,0,0.6)" : "#0A0A08",
          border: isScrolled ? "1px solid rgba(255,255,255,0.1)" : "none",
          borderBottom: isScrolled || currentlyPlayingId === 'radio-stream' ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "none",
          backdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "none",
          padding: isScrolled ? "0.75rem 1rem" : "1.25rem 1rem",
          gap: isScrolled ? "0.5rem" : "0.5rem"
        }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Left: LIVE */}
        <NavigationLink
          label="LIVE"
          href="/live"
          isActive={pathname === '/live'}
          isLive={isLive || broadcastMode === 'automated'}
        />

        {/* Center: LOGO */}
        <Link
          href="/"
          className="shrink-0 flex items-center justify-center mx-1"
        >
          <img
            src="/logo.png"
            alt="Immortal Raindrops"
            width={52}
            height={52}
            className="h-10 w-auto logo-breathe"
            style={{ height: '52px', width: 'auto', filter: 'invert(1)', mixBlendMode: 'screen', transform: 'translateY(-2px)' }}
          />
        </Link>

        {/* Right: ARCHIVE */}
        <NavigationLink
          label="ARCHIVE"
          href="/archive"
          isActive={pathname === '/archive'}
        />
      </motion.nav>

      {/* --- DESKTOP HEADER (Visible >= lg) --- */}
      <header className={`hidden lg:flex sticky top-0 z-[100] w-full h-16 px-6 transition-all duration-300 ease-in-out backdrop-blur-md header-grain ${
        currentlyPlayingId === 'radio-stream' ? '' : 'border-b border-[#6DBF82]/15'
      } ${isScrolled
        ? "bg-[#0A0A08]/60"
        : "bg-[#0A0A08]"
        }`}>

        {/* Side Elements (Flex) */}
        <div className="w-full h-full flex items-center justify-between">

          {/* BLOCK 1: Left - Station Identity */}
          <div className="flex items-center justify-start shrink-0 gap-4 z-30 group/left">
            {/* Playback Controls (now on Left) */}
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={(e) => {
                e.stopPropagation();
                if (!isPlayerActive) {
                  const streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || '';
                  if (streamUrl) {
                    playLiveStream(streamUrl);
                  }
                } else {
                  togglePlay();
                }
              }}
              onSkipBack={(e) => { e.stopPropagation(); skipBack(); }}
              onSkipForward={(e) => { e.stopPropagation(); skipTrack(); }}
              isRadioStream={!isPlayerActive || currentlyPlayingId === 'radio-stream'}
              className="shrink-0 flex items-center justify-center"
            />

            {/* Navigation links (Desktop) that reveal on hover */}
            <div className="flex items-center">
              <div
                className="flex items-center gap-x-6 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out max-w-0 opacity-0 group-hover/left:max-w-[340px] group-hover/left:opacity-100 group-hover/left:pr-4"
              >
                <Link href="/archive" className="text-[#ECEEDF] text-sm tracking-[0.1em] font-sans hover:text-white transition-colors bg-transparent uppercase">ARCHIVE</Link>
                {/* Only show LIVE nav link if radio is NOT currently playing */}
                {currentlyPlayingId !== 'radio-stream' && !isLive && (
                  <Link href="/live" className="flex items-center gap-1.5 text-[#ECEEDF] text-sm tracking-[0.1em] font-sans hover:text-white transition-colors bg-transparent uppercase">
                    LIVE
                  </Link>
                )}
              </div>
            </div>

            {/* Divider and Station Info / Track Metadata */}
            {(currentlyPlayingId === 'radio-stream' || isLive || showHeaderMetadata) && (
              pathname === '/submit' ? (
                <div className="flex items-center max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden min-w-0">
                  <span className="font-sans text-sm text-[#ECEEDF] uppercase font-bold leading-none tracking-[0.25em] whitespace-nowrap">
                    SUBMISSION MODE
                  </span>
                </div>
              ) : (currentlyPlayingId === 'radio-stream' || (!currentlyPlayingId && isLive)) ? (
                <div className="flex flex-row items-center gap-4 max-w-[300px] lg:max-w-[450px] whitespace-nowrap overflow-hidden min-w-0">
                  <Link href="/live" className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-red-500 tracking-[0.08em] uppercase leading-none shrink-0 hover:text-red-400 transition-colors">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </Link>
                  <div className="flex flex-col justify-center gap-0 min-w-0">
                    <span className="font-sans text-base text-[#ECEEDF]/90 uppercase font-bold leading-tight tracking-[0.08em] truncate whitespace-nowrap">
                      {displayTitle || 'IMMORTAL RAINDROPS RADIO'}
                    </span>
                    {displayArtist && (
                      <span className="font-sans text-sm text-[#6DBF82] uppercase leading-tight tracking-[0.06em] truncate whitespace-nowrap">
                        {displayArtist}
                      </span>
                    )}
                  </div>
                </div>
              ) : showHeaderMetadata ? (
                <div className="flex flex-col justify-center gap-0 max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden min-w-0">
                  <span className="font-sans text-base text-[#ECEEDF]/90 uppercase font-bold leading-tight tracking-[0.08em] truncate whitespace-nowrap">
                    {displayTitle}
                  </span>
                  <span className="font-sans text-sm text-[#6DBF82] uppercase leading-tight tracking-[0.06em] truncate whitespace-nowrap">
                    {displayArtist}
                  </span>
                </div>
              ) : null
            )}
          </div>

          {/* BLOCK 3: Right - Volume Controls */}
          <div className="flex flex-row items-center justify-end z-40 gap-6 h-full">


             {/* SUBMIT BUTTON (Desktop) */}
            <div className="relative self-center flex items-center">
              <Link
                href="/submit"
                className="hidden md:flex items-center justify-center font-sans text-sm text-[#6DBF82] tracking-[0.1em] hover:text-white transition-colors uppercase whitespace-nowrap self-center"
              >
                SUBMIT
              </Link>
            </div>

            {/* VOLUME CONTROLS */}
            {isPlayerActive && (
              <VolumeController
                volume={volume}
                onVolumeChange={adjustVolume}
                seek={seek}
                duration={duration}
                isRadioStream={currentlyPlayingId === 'radio-stream'}
                className="self-center"
              />
            )}
          </div>
        </div>

        {/* BLOCK 2: Center - Logo (Absolute Center Pivot) */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 shrink-0 flex items-center justify-center"
        >
          <img
            src="/logo.png"
            alt="Immortal Raindrops"
            width={52}
            height={52}
            className="h-12 w-auto logo-breathe"
            style={{ height: '52px', width: 'auto', filter: 'invert(1)', mixBlendMode: 'screen', transform: 'translateY(-2px)' }}
          />
        </Link>

        {/* BLOCK 4: Full-Width Scrubber/Border Line (Outside Padded Wrapper) - Desktop Only */}
        {isPlayerActive && currentlyPlayingId !== 'radio-stream' && (
          /* Archive mode: Interactive scrubber */
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
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6DBF82]/15 group-hover/scrubber:h-[6px] transition-all duration-200 ease-out pointer-events-none">
              {/* Progress Fill */}
              <div
                className="h-full bg-[#6DBF82] relative transition-all duration-200 ease-out"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Thumb (Right Edge of Progress) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 group-hover/scrubber:w-4 group-hover/scrubber:h-4 bg-[#6DBF82] rounded-full shadow-[0_0_10px_rgba(109,191,130,0.5)] transition-all duration-200 ease-out translate-x-1/2" />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

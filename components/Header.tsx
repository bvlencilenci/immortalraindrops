'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { PlaybackControls } from './ui/PlaybackControls';
import { VolumeController } from './ui/VolumeController';

type PlaybackHistoryItem = {
  artist?: string | null;
  title?: string | null;
};

type HeaderSystemSettings = {
  is_live: boolean | null;
  stream_title: string | null;
  broadcast_mode?: string | null;
  site_title?: string | null;
  playback_history?: PlaybackHistoryItem[] | null;
};

const getHeaderStreamTitle = (settings: HeaderSystemSettings) => {
  return settings.stream_title || 'OFFLINE';
};

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
  const prevVolumeRef = useRef(1.0);
  const wasLiveRef = useRef(false);

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
    const applySettings = (settings: HeaderSystemSettings) => {
      const nextIsLive = !!settings.is_live;
      const nextStreamTitle = getHeaderStreamTitle(settings);

      const audioState = useAudioStore.getState();
      if (!audioState.currentlyPlayingId || audioState.currentlyPlayingId === 'radio-stream') {
        audioState.setLiveState(nextIsLive, nextStreamTitle);
      } else {
        useAudioStore.setState({ streamTitle: nextStreamTitle });
      }
      wasLiveRef.current = nextIsLive;

      if (settings.broadcast_mode) {
        setBroadcastMode(settings.broadcast_mode as 'automated' | 'live');
      }

      if (settings.site_title) {
        setSiteTitle(settings.site_title);
      }
    };

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('is_live, stream_title, playback_history, broadcast_mode, site_title')
        .eq('id', 1)
        .single();

      if (data) applySettings(data as HeaderSystemSettings);
    };

    fetchSettings();

    // 2. Realtime Listener
    const setupListener = async () => {
      const channel = supabase
        .channel('header_system_settings_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'system_settings',
            filter: 'id=eq.1'
          },
          (payload) => {
            const newData = payload.new as HeaderSystemSettings;
            const wasLive = wasLiveRef.current;
            applySettings(newData);

            // Optional: If going live, pause any archive playback so user can switch? 
            // Or let them stay on archive until they click LIVE. 
            // User requested: "Store Sync: When is_live becomes true, trigger a 'pause' on the useAudioStore"
            if (!wasLive && newData.is_live) {
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
    const settingsPoll = window.setInterval(fetchSettings, 8000);

    // 3. Keep existing key handlers
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearInterval(settingsPoll);
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [togglePlay, adjustVolume]);

  // Hide header if SplashGate is active (!hasEntered)
  if (!hasEntered) return null;

  const isPlayerActive = !!currentlyPlayingId;
  const progressPercent = (duration > 0) ? (seek / duration) * 100 : 0;
  const mobileActionHref = pathname === '/archive' ? '/submit' : '/archive';
  const mobileActionLabel = pathname === '/archive' ? 'SUBMIT' : 'ARCHIVE';
  const mobileTitle = displayTitle || (isLive ? 'IMMORTAL RAINDROPS RADIO' : 'OFFLINE');
  const mobileArtist = displayArtist || (isLive ? 'LIVE SIGNAL' : 'NO SIGNAL');

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
      {/* --- MOBILE HEADER (< lg) --- */}
      <nav
        className="fixed left-0 right-0 top-0 z-[100] grid h-[calc(4.25rem+env(safe-area-inset-top))] grid-cols-[44px_minmax(0,1fr)_78px] items-center gap-3 overflow-hidden whitespace-nowrap border-b border-white/10 bg-transparent px-3 pt-[env(safe-area-inset-top)] header-grain lg:hidden"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(7px)',
            WebkitBackdropFilter: 'blur(7px)',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.26) 62%, rgba(0,0,0,0.04) 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                rgba(255,255,255,0.045) 0px,
                rgba(255,255,255,0.045) 1px,
                transparent 1px,
                transparent 5px
              )
            `,
          }}
        />

        <Link
          href="/"
          className="relative z-10 flex h-11 min-w-0 shrink-0 items-center justify-start"
        >
          <img
            src="/logo.png"
            alt="Immortal Raindrops"
            width={52}
            height={52}
            className="h-10 w-auto logo-breathe"
            style={{ height: '42px', width: 'auto', filter: 'invert(1)', mixBlendMode: 'screen' }}
          />
        </Link>

        <Link
          href="/live"
          className="relative z-10 flex min-w-0 flex-col justify-center overflow-hidden"
        >
          <div className="flex min-w-0 items-center gap-2">
            {(isLive || broadcastMode === 'automated') && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-pulse" />
            )}
            <span className="shrink-0 font-playfair text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-red-400">
              LIVE
            </span>
            <span className="min-w-0 truncate font-playfair text-[13px] font-bold uppercase leading-tight tracking-[0.08em] text-[#ECEEDF]/92">
              {mobileTitle}
            </span>
          </div>
          <span className="mt-1 min-w-0 truncate font-playfair text-[11px] uppercase leading-tight tracking-[0.06em] text-lime-300/80">
            {mobileArtist}
          </span>
        </Link>

        <Link
          href={mobileActionHref}
          className="relative z-10 min-w-0 truncate text-right font-playfair text-[11px] font-bold uppercase tracking-[0.12em] text-lime-300/85"
        >
          {mobileActionLabel}
        </Link>
      </nav>

      {/* --- DESKTOP HEADER (Visible >= lg) --- */}
      <header
        className="hidden lg:flex fixed top-0 left-0 right-0 z-[100] w-full h-20 min-h-[76px] px-6 py-4 transition-all duration-300 ease-in-out header-grain relative overflow-hidden bg-transparent border-b border-white/10"
      >

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(9px)',
            WebkitBackdropFilter: 'blur(9px)',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.04) 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                rgba(255,255,255,0.045) 0px,
                rgba(255,255,255,0.045) 1px,
                transparent 1px,
                transparent 5px
              )
            `,
          }}
        />

        {/* Side Elements (Flex) */}
        <div className="relative z-10 w-full h-full flex items-center justify-between">

          {/* BLOCK 1: Left - Station Identity */}
          <div className="relative z-10 flex items-center justify-start shrink-0 gap-4 group/left bg-transparent px-3 h-12 rounded-none shadow-none">
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
                <Link href="/archive" className="text-[#ECEEDF] text-sm tracking-[0.1em] font-playfair hover:text-white transition-colors bg-transparent uppercase">ARCHIVE</Link>
                {/* Only show LIVE nav link if radio is NOT currently playing */}
                {currentlyPlayingId !== 'radio-stream' && !isLive && (
                  <Link href="/live" className="flex items-center gap-1.5 text-[#ECEEDF] text-sm tracking-[0.1em] font-playfair hover:text-white transition-colors bg-transparent uppercase">
                    LIVE
                  </Link>
                )}
              </div>
            </div>

            {/* Divider and Station Info / Track Metadata */}
            {(currentlyPlayingId === 'radio-stream' || isLive || showHeaderMetadata) && (
              pathname === '/submit' ? (
                <div className="flex items-center max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden min-w-0">
                  <span className="font-playfair text-sm text-[#ECEEDF] uppercase font-bold leading-none tracking-[0.25em] whitespace-nowrap">
                    SUBMISSION MODE
                  </span>
                </div>
              ) : (currentlyPlayingId === 'radio-stream' || (!currentlyPlayingId && isLive)) ? (
                <div className="flex flex-row items-center gap-4 max-w-[300px] lg:max-w-[450px] whitespace-nowrap overflow-hidden min-w-0">
                  <Link href="/live" className="flex items-center gap-1.5 font-playfair text-[11px] font-bold text-red-500 tracking-[0.08em] uppercase leading-none shrink-0 hover:text-red-400 transition-colors">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </Link>
                  <div className="flex flex-col justify-center gap-0 min-w-0">
                    <span className="font-playfair text-base text-[#ECEEDF]/90 uppercase font-bold leading-tight tracking-[0.08em] truncate whitespace-nowrap">
                      {displayTitle || 'IMMORTAL RAINDROPS RADIO'}
                    </span>
                    {displayArtist && (
                      <span className="font-playfair text-sm text-lime-300 uppercase leading-tight tracking-[0.06em] truncate whitespace-nowrap">
                        {displayArtist}
                      </span>
                    )}
                  </div>
                </div>
              ) : showHeaderMetadata ? (
                <div className="flex flex-col justify-center gap-0 max-w-[250px] lg:max-w-[400px] whitespace-nowrap overflow-hidden min-w-0">
                  <span className="font-playfair text-base text-[#ECEEDF]/90 uppercase font-bold leading-tight tracking-[0.08em] truncate whitespace-nowrap">
                    {displayTitle}
                  </span>
                  <span className="font-playfair text-sm text-lime-300 uppercase leading-tight tracking-[0.06em] truncate whitespace-nowrap">
                    {displayArtist}
                  </span>
                </div>
              ) : null
            )}
          </div>

          {/* BLOCK 3: Right - Volume Controls */}
          <div className="relative z-10 flex flex-row items-center justify-end gap-6 h-12 bg-transparent px-3 rounded-none shadow-none">


             {/* SUBMIT BUTTON (Desktop) */}
            <div className="relative self-center flex h-9 items-center">
              <Link
                href="/submit"
                className="hidden md:flex h-full items-center justify-center font-playfair text-[20px] leading-none text-lime-300 tracking-[0.14em] hover:text-white transition-colors uppercase whitespace-nowrap"
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shrink-0 flex h-[64px] items-center justify-center bg-black/[0.04] backdrop-blur-[3px] px-6 rounded-none shadow-none"
        >
          <img
            src="/logo.png"
            alt="Immortal Raindrops"
            width={52}
            height={52}
            className="h-14 w-auto logo-breathe"
            style={{ height: '58px', width: 'auto', filter: 'invert(1)', mixBlendMode: 'screen', transform: 'translateY(-2px)' }}
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

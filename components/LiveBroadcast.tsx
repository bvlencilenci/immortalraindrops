'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { supabase } from '../lib/supabase';
import LiveVisualizer from './LiveVisualizer';
import { type NewsPostItem } from './NewsEntry';
import { TrackHistoryItem } from './ui/TrackHistoryItem';
import { Footer } from './ui/Footer';

interface PlaybackHistoryItem {
  title: string;
  artist: string;
}

interface LiveBroadcastProps {
  initialIsLive: boolean;
  initialTitle: string;
  initialBroadcastMode: string;
  initialDjName: string;
  initialShowTitle: string;
  initialDjLocation: string;
  initialDjDescription: string;
  initialPlaybackHistory: PlaybackHistoryItem[];
  newsPosts?: NewsPostItem[];
  trackAudioMap?: Record<string, string>;
}



export default function LiveBroadcast({
  initialIsLive,
  initialTitle,
  initialBroadcastMode,
  initialDjName,
  initialShowTitle,
  initialDjLocation,
  initialDjDescription,
  initialPlaybackHistory,
  newsPosts = [],
  trackAudioMap = {},
}: LiveBroadcastProps) {
  const [isLive, setIsLive] = useState(initialIsLive);
  const [nowPlayingTitle, setNowPlayingTitle] = useState(initialTitle);
  const [broadcastMode, setBroadcastMode] = useState<'automated' | 'live'>(
    (initialBroadcastMode || 'automated') as 'automated' | 'live'
  );
  const [djName, setDjName] = useState(initialDjName);
  const [showTitle, setShowTitle] = useState(initialShowTitle);
  const [djLocation, setDjLocation] = useState(initialDjLocation);
  const [djDescription, setDjDescription] = useState(initialDjDescription);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistoryItem[]>(
    initialPlaybackHistory || []
  );

  // Dynamic statistics states for footer
  const [listenerCount, setListenerCount] = useState(0);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  const [maxTracksFit, setMaxTracksFit] = useState(7);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  const [showNews, setShowNews] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const container = historyContainerRef.current;
    if (!container) return;

    const calculateFit = () => {
      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) return;

      const itemHeight = 57; // 40px cover + 16px padding + 1px border
      const gap = 16; // gap-4 is 16px
      const count = Math.floor((containerHeight + gap) / (itemHeight + gap));
      setMaxTracksFit(Math.max(1, count));
    };

    calculateFit();

    const resizeObserver = new ResizeObserver(() => {
      calculateFit();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const { currentlyPlayingId, isPlaying } = useAudioStore();

  const isRadioPlaying = currentlyPlayingId === 'radio-stream' && isPlaying;

  // Real-time listener for database updates on system settings (singleton row id=1)
  useEffect(() => {
    const channel = supabase
      .channel('live_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'id=eq.1'
        },
        (payload) => {
          const newData = payload.new as {
            is_live: boolean;
            now_playing_title?: string;
            stream_title?: string;
            broadcast_mode?: string;
            dj_name?: string;
            show_title?: string;
            dj_location?: string;
            dj_description?: string;
            playback_history?: PlaybackHistoryItem[];
          };
          console.log("RAW API RESPONSE (REALTIME)", newData);
          setIsLive(newData.is_live);
          setNowPlayingTitle(newData.now_playing_title || newData.stream_title || 'OFFLINE');
          setBroadcastMode((newData.broadcast_mode || 'automated') as 'automated' | 'live');
          setDjName(newData.dj_name || '');
          setShowTitle(newData.show_title || '');
          setDjLocation(newData.dj_location || '');
          setDjDescription(newData.dj_description || '');
          setPlaybackHistory(newData.playback_history || []);
          console.log("HISTORY", newData.playback_history || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Footer statistics effects (listeners & uptime) & Metadata Polling Fallback
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/radio/stats');
        if (res.ok) {
          const data = await res.json();
          setListenerCount(data.listeners || 0);
          setUptimeSeconds(data.uptime || 0);

          // Fallback metadata update if Postgres realtime didn't fire or is disabled
          if (data.active && data.title) {
            const formattedTitle = data.artist ? `${data.artist} - ${data.title}` : data.title;
            setNowPlayingTitle(prev => {
              if (prev !== formattedTitle && broadcastMode !== 'live') {
                // Prepend to local playbackHistory so "Last Played" updates instantly on the client
                if (data.artist && data.title) {
                  setPlaybackHistory(oldHistory => {
                    const isDup = oldHistory[0] &&
                      oldHistory[0].artist.toLowerCase() === data.artist.toLowerCase() &&
                      oldHistory[0].title.toLowerCase() === data.title.toLowerCase();
                    if (!isDup) {
                      return [{ artist: data.artist, title: data.title }, ...oldHistory].slice(0, 7);
                    }
                    return oldHistory;
                  });
                }
                return formattedTitle;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching stream stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll stats every 5 seconds for snappy updates

    return () => clearInterval(interval);
  }, [broadcastMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds(prev => (prev > 0 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse artist and title for display
  const getDisplayTrackInfo = () => {
    if (!nowPlayingTitle) {
      return { artist: 'UNKNOWN ARTIST', title: 'UNKNOWN TRACK' };
    }

    const clean = nowPlayingTitle.trim();
    const upper = clean.toUpperCase();

    if (
      !clean ||
      ['OFFLINE', 'STANDBY', 'CONNECTING...', 'IMMORTAL RAINDROPS', 'IMMORTAL RAINDROPS RADIO', 'PLAYLIST ROTATION', 'CURATED PLAYLIST', 'AUTOMATED BROADCAST'].includes(upper)
    ) {
      return { artist: 'UNKNOWN ARTIST', title: 'UNKNOWN TRACK' };
    }

    const parts = clean.split(/ - | — /);
    if (parts.length < 2) {
      return { artist: 'UNKNOWN ARTIST', title: 'UNKNOWN TRACK' };
    }

    const artist = parts[0]?.trim() || 'UNKNOWN ARTIST';
    const title = parts.slice(1).join(' - ')?.trim() || 'UNKNOWN TRACK';

    return { artist, title };
  };

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { artist: currentArtist, title: currentTitle } = getDisplayTrackInfo();

  // Show live indicator when DJ is connected OR when playing automated curated playlist
  const showLiveIndicator = isLive || broadcastMode === 'automated';

  return (
    <>
      {isMobile ? (
        /* MOBILE LAYOUT (Club Monitor) */
        <div className="flex flex-col w-full h-[100dvh] max-h-[100dvh] bg-[#0A0A08] overflow-hidden relative select-none">
          {/* 1. TOP BAR */}
          <div className="h-10 w-full flex items-center justify-end px-4 shrink-0">
            <div className="text-[10px] tracking-[0.15em] text-[#ECEEDF]/30 uppercase font-sans">
              LISTENERS: {listenerCount}
            </div>
          </div>

          {/* 2. VISUALIZER */}
          <div className="flex-1 min-h-0 relative overflow-hidden w-full bg-black flex items-center justify-center">
            <LiveVisualizer />
          </div>

          {/* 3. NOW PLAYING BLOCK */}
          <div className="w-full px-5 py-6 flex flex-col gap-1 border-t border-[#6DBF82]/15 bg-[#0A0A08] shrink-0">
            <span className="text-[9px] tracking-[0.25em] text-[#6DBF82]/50 uppercase mb-1 font-sans font-normal">
              NOW PLAYING
            </span>
            <div className="text-3xl font-bold tracking-tight text-white leading-none font-narrow break-words">
              {broadcastMode === 'live' ? (showTitle || 'NIGHT TRANSMISSION') : currentTitle}
            </div>
            <span className="text-[11px] tracking-[0.25em] text-[#ECEEDF]/40 uppercase mt-1 font-narrow font-light truncate">
              {broadcastMode === 'live' ? (djName || 'VOID OPERATOR') : currentArtist}
            </span>
            <span className="text-[9px] tracking-[0.15em] text-[#ECEEDF]/20 uppercase mt-3 font-mono">
              UPTIME: {formatUptime(uptimeSeconds)}
            </span>
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT */
        <div className="relative w-full flex-1 flex flex-col items-stretch justify-between min-h-0 bg-[#0A0A08] grain overflow-hidden">
          {/* Main columns container */}
          <div className="w-full flex-1 flex flex-col md:flex-row items-stretch z-10 backdrop-blur-[4px] bg-transparent min-h-0 overflow-hidden">

            {/* LEFT COLUMN: HISTORY */}
            <div className="glass-panel-left-wrap w-full md:w-64 shrink-0 flex flex-col order-2 md:order-none">
              <div className="glass-panel-left w-full h-20 md:h-full backdrop-blur-md bg-[#ECEEDF]/[0.02] px-4 py-3 md:p-8 flex flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-hidden gap-4 md:gap-3 relative scrollbar-none">
                <h2 className="hidden md:block text-[8px] tracking-[0.08em] font-normal text-[#6DBF82]/70 uppercase pb-2 mb-3 whitespace-nowrap">
                  HISTORY
                </h2>
                <div ref={historyContainerRef} className="flex flex-row md:flex-col gap-4 flex-1 md:min-h-0 overflow-x-auto md:overflow-hidden pr-1 scrollbar-none">
                  {playbackHistory.length === 0 ? (
                    <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                      NO HISTORY RECORDED
                    </div>
                  ) : (
                    playbackHistory.slice(0, isMobile ? 10 : maxTracksFit).map((track, i) => {
                      const trackKey = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
                      const audioUrl = trackAudioMap[trackKey];

                      return (
                        <TrackHistoryItem
                          key={i}
                          track={track}
                          audioUrl={audioUrl}
                          index={i}
                        />
                      );
                    })
                  )}
                </div>
                <div className="hidden md:block absolute inset-y-0 right-0 w-16 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, transparent, rgba(10,10,8,0.85))' }} />
              </div>
            </div>

            {/* CENTER COLUMN: MAIN BROADCAST STATION */}
            <div className="glass-center-panel w-full h-[55vh] md:h-auto md:flex-1 bg-black p-6 md:p-8 flex flex-col items-center justify-between gap-12 text-center md:min-h-[420px] relative overflow-hidden select-none order-1 md:order-none">
              <div className="hidden md:block absolute inset-y-0 left-0 w-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, rgba(10,10,8,0.7), transparent)' }} />
              <div className="hidden md:block absolute inset-y-0 right-0 w-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, rgba(10,10,8,0.7), transparent)' }} />
              {/* generative waves visualizer constrained to center column */}
              <div className="absolute inset-0 opacity-100 z-0 pointer-events-none">
                <LiveVisualizer />
              </div>
              {/* Mobile bottom-third shadow gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0 md:hidden" />

              {/* Now Playing visual display pinned to the bottom left */}
              <div className="absolute bottom-4 left-4 z-10 md:relative md:bottom-auto md:left-auto w-[calc(100%-2rem)] md:w-full flex flex-col items-start justify-end min-h-fit max-w-xl md:mt-auto md:pb-2 self-start">
                {broadcastMode === 'live' ? (
                  <div className={`flex flex-col gap-2 w-full items-start pt-4 px-2 text-left ${
                    currentlyPlayingId === 'radio-stream' ? '' : 'border-t border-[#ECEEDF]/15'
                  }`}>
                    <span className="text-[7px] tracking-[0.08em] text-[#ECEEDF]/20 uppercase select-none mb-2">LIVE TRANSMISSION // DJ</span>
                    <span className="text-2xl md:text-3xl font-black tracking-tight text-white truncate block leading-none w-full font-narrow">
                      {showTitle || 'NIGHT TRANSMISSION'}
                    </span>
                    <span className="text-[11px] tracking-[0.3em] text-[#ECEEDF]/40 font-light mt-1 mix-blend-normal uppercase truncate block leading-none w-full font-narrow">
                      {djName || 'VOID OPERATOR'}
                    </span>
                    {djLocation && (
                      <div className="text-left mt-1">
                        <span className="text-[8px] tracking-[0.25em] text-[#ECEEDF]/25 uppercase select-none">LOCATION: </span>
                        <span className="text-[9px] tracking-[0.15em] uppercase text-[#ECEEDF]/60 truncate">
                          {djLocation}
                        </span>
                      </div>
                    )}
                    {djDescription && (
                      <p className="text-[9px] text-[#ECEEDF]/40 tracking-wider uppercase leading-relaxed mt-1 break-words text-left w-full truncate">
                        {djDescription}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col items-start text-left gap-1.5 w-full pt-4 px-2 ${
                    currentlyPlayingId === 'radio-stream' ? '' : 'border-t border-[#ECEEDF]/15'
                  }`}>
                    <div className="text-[7px] tracking-[0.08em] text-[#6DBF82]/60 uppercase select-none mb-2">
                      <strong className="font-bold">NOW PLAYING:</strong> <span className="font-normal">AUTOMATED BROADCAST</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black tracking-tight text-white text-left truncate w-full leading-none font-narrow">
                      {currentTitle}
                    </div>
                    <div className="text-[11px] tracking-[0.3em] text-[#ECEEDF]/40 font-light mt-1 mix-blend-normal uppercase text-left truncate w-full leading-none font-narrow">
                      {currentArtist}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: NEWS */}
            <div className="glass-panel-right-wrap w-full md:w-64 shrink-0 flex flex-col order-3 md:order-none">
              <div className="glass-panel-right w-full h-auto md:h-full backdrop-blur-md bg-[#ECEEDF]/[0.02] p-0 md:p-8 flex flex-col gap-0 md:gap-3 relative overflow-hidden">
                <h2 className="hidden md:block text-[8px] tracking-[0.08em] font-normal text-[#6DBF82]/70 uppercase pb-2 mb-3 whitespace-nowrap">
                  NEWS
                </h2>
                <button
                  onClick={() => setShowNews(!showNews)}
                  className="flex md:hidden items-center justify-between text-[#6DBF82] text-xs tracking-widest uppercase border-b border-[#6DBF82]/20 w-full py-3 px-4 cursor-pointer focus:outline-none"
                >
                  <span>DISPATCHES</span>
                  <span>{showNews ? '▲' : '▼'}</span>
                </button>
                <div className={`${showNews ? 'flex' : 'hidden'} md:flex flex-col gap-4 max-h-[300px] md:max-h-[420px] overflow-y-auto p-4 md:p-0 pr-2 custom-scrollbar`}>
                  {newsPosts.length === 0 ? (
                    <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                      NO UPDATES ATM
                    </div>
                  ) : (
                    newsPosts.map((post) => (
                      <div key={post.id} className="flex flex-col gap-1.5 border-b border-[#ECEEDF]/5 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 text-[9px] tracking-wider text-[#ECEEDF]/25 uppercase">
                          <span>
                            {new Date(post.published_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span>•</span>
                          <span>[{post.type}]</span>
                        </div>
                        <h3 className="text-[11px] md:text-xs font-700 uppercase tracking-wider text-[#ECEEDF]/85 hover:text-white leading-tight transition-colors duration-100">
                          <a href={`/news/${post.slug}`} className="hover:underline">
                            {post.title}
                          </a>
                        </h3>
                        {post.excerpt && (
                          <p className="text-[10px] text-[#ECEEDF]/45 leading-relaxed font-sans font-light normal-case mt-0.5 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="hidden md:block absolute inset-y-0 left-0 w-16 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, transparent, rgba(10,10,8,0.85))' }} />
              </div>
            </div>

          </div>

          {/* FOOTER STATUS BAR */}
          <Footer
            listenerCount={listenerCount}
            uptimeSeconds={uptimeSeconds}
            hideBorder={currentlyPlayingId === 'radio-stream'}
          />
        </div>
      )}
    </>
  );
}
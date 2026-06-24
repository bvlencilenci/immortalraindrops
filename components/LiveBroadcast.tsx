'use client';

import { useState, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { supabase } from '../lib/supabase';
import LiveVisualizer from './LiveVisualizer';
import { type NewsPostItem } from './NewsEntry';
import { StatusBadge } from './ui/StatusBadge';
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
                      return [{ artist: data.artist, title: data.title }, ...oldHistory].slice(0, 5);
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
<<<<<<< HEAD
    <div className="relative w-full flex-1 flex flex-col items-center justify-between min-h-0 bg-black overflow-hidden font-mono">
      {/* generative waves visualizer */}
      <LiveVisualizer />

      {/* Main columns container - centered with padding */}
      <div className="w-full max-w-full flex flex-col md:flex-row gap-2 md:gap-4 items-stretch z-10 my-auto border-y border-[#ECEEDF]/15 py-4 md:py-8 px-6 sm:px-8 md:px-12 lg:px-16 backdrop-blur-[4px] bg-black/[0.35]">
        
        {/* LEFT COLUMN: LAST PLAYED */}
        <div className="w-full md:flex-1 min-w-0 bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-4 md:pb-0 md:pr-6 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[9px] md:text-[10px] lg:text-[11px] tracking-[0.15em] font-bold text-[#ECEEDF]/80 uppercase border-b border-[#ECEEDF]/10 pb-2 mb-1 whitespace-nowrap">
            LAST PLAYED
=======
    <div className="relative w-full flex-1 flex flex-col items-center justify-between min-h-0 bg-[#0A0A08] border border-[#ECEEDF]/10 grain overflow-hidden px-2 md:px-4 py-8">

      {/* Main columns container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-stretch z-10 my-auto border border-[#ECEEDF]/8 backdrop-blur-[4px] bg-black/20 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: HISTORY */}
        <div className="w-full md:w-64 shrink-0 backdrop-blur-md bg-[#ECEEDF]/[0.02] p-6 md:p-8 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[8px] tracking-[0.08em] font-normal text-[#ECEEDF]/20 uppercase border-b border-[#ECEEDF]/15 mb-3 whitespace-nowrap">
            HISTORY
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
          </h2>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[180px] md:max-h-[420px] pr-1 custom-scrollbar">
            {playbackHistory.length === 0 ? (
              <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO HISTORY RECORDED
              </div>
            ) : (
              playbackHistory.slice(0, 10).map((track, i) => {
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
        </div>

        {/* CENTER COLUMN: MAIN BROADCAST STATION */}
<<<<<<< HEAD
        <div className="w-full md:flex-[3] min-w-0 bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 md:px-8 flex flex-col items-center justify-start text-center">
          
          {/* Status Badge */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                showLiveIndicator 
                  ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : 'bg-[#ECEEDF]/20'
              }`} />
              <span className={`text-[10px] md:text-[11px] lg:text-[12px] tracking-[0.3em] font-bold uppercase ${
                showLiveIndicator ? 'text-red-500' : 'text-[#ECEEDF]/30'
              }`}>
                {showLiveIndicator ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            
            <div className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/45 uppercase mt-1">
              STATUS
            </div>
            <div className="text-xs md:text-sm lg:text-base font-bold tracking-widest uppercase border border-[#ECEEDF]/20 px-6 py-2.5 bg-white/[0.01]">
              {broadcastMode === 'live' ? 'LIVE DJ SET' : 'AUTOMATED BROADCAST'}
            </div>
=======
        <div className="w-full flex-1 bg-transparent p-6 md:p-8 flex flex-col items-center justify-between gap-12 text-center min-h-[320px] md:min-h-[420px] relative overflow-hidden select-none">
          {/* generative waves visualizer constrained to center column */}
          <div className="absolute inset-0 opacity-40 z-0 pointer-events-none">
            <LiveVisualizer />
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
          </div>

          {/* Status Badge */}
          <StatusBadge
            isLive={isLive}
            broadcastMode={broadcastMode}
            className="relative z-10"
          />

<<<<<<< HEAD
          {/* Now Playing visual display - pushed much lower */}
          <div className="w-full flex flex-col items-center justify-center min-h-fit max-w-2xl z-10 pb-8 mt-20">
=======
          {/* Now Playing visual display pinned to the bottom */}
          <div className="w-full flex flex-col items-center justify-center min-h-fit max-w-xl z-10 mt-auto pb-2 relative z-10">
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
            {broadcastMode === 'live' ? (
              <div className="flex flex-col gap-2 w-full items-center border-t border-[#ECEEDF]/15 pt-4">
                <span className="text-[7px] tracking-[0.08em] text-[#ECEEDF]/20 uppercase select-none mb-2">LIVE TRANSMISSION // DJ</span>
                <span className="text-2xl md:text-3xl font-black tracking-tight text-white truncate block px-2 leading-none w-full font-narrow">
                  {showTitle || 'NIGHT TRANSMISSION'}
                </span>
                <span className="text-[11px] tracking-[0.3em] text-[#ECEEDF]/40 font-light mt-1 mix-blend-normal uppercase truncate block px-2 leading-none w-full font-narrow">
                  {djName || 'VOID OPERATOR'}
                </span>
                {djLocation && (
                  <div className="text-center mt-1">
                    <span className="text-[8px] tracking-[0.25em] text-[#ECEEDF]/25 uppercase select-none">LOCATION: </span>
                    <span className="text-[9px] tracking-[0.15em] uppercase text-[#ECEEDF]/60 truncate px-1">
                      {djLocation}
                    </span>
                  </div>
                )}
                {djDescription && (
                  <p className="text-[9px] text-[#ECEEDF]/40 tracking-wider uppercase leading-relaxed mt-1 px-4 break-words text-center w-full truncate">
                    {djDescription}
                  </p>
                )}
              </div>
            ) : (
<<<<<<< HEAD
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <span className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/45 uppercase">NOW PLAYING</span>
                <div className="text-sm md:text-lg tracking-[0.15em] uppercase text-[#ECEEDF]/60 px-2 mt-1 text-center break-words w-full">
                  {currentArtist}
                </div>
                <div className="text-xl md:text-3xl font-black tracking-widest uppercase text-[#ECEEDF] px-2 mt-1.5 text-center break-words w-full">
=======
              <div className="flex flex-col items-center text-center gap-1.5 w-full border-t border-[#ECEEDF]/15 pt-4">
                <span className="text-[7px] tracking-[0.08em] text-[#ECEEDF]/20 uppercase select-none mb-2">NOW PLAYING</span>
                <div className="text-2xl md:text-3xl font-black tracking-tight text-white px-2 text-center truncate w-full leading-none font-narrow">
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
                  {currentTitle}
                </div>
                <div className="text-[11px] tracking-[0.3em] text-[#ECEEDF]/40 font-light mt-1 mix-blend-normal uppercase text-center truncate w-full leading-none font-narrow">
                  {currentArtist}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: NEWS */}
<<<<<<< HEAD
        <div className="w-full md:flex-1 min-w-0 bg-transparent pb-0 md:pl-6 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[9px] md:text-[10px] lg:text-[11px] tracking-[0.15em] font-bold text-[#ECEEDF]/80 uppercase border-b border-[#ECEEDF]/10 pb-2 mb-1 whitespace-nowrap">
=======
        <div className="w-full md:w-64 shrink-0 backdrop-blur-md bg-[#ECEEDF]/[0.02] p-6 md:p-8 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[8px] tracking-[0.08em] font-normal text-[#ECEEDF]/20 uppercase border-b border-[#ECEEDF]/15 mb-3 whitespace-nowrap">
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
            NEWS
          </h2>
          <div className="flex flex-col gap-4 max-h-[180px] md:max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {newsPosts.length === 0 ? (
              <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO DISPATCHES RECORDED
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
        </div>

      </div>

      {/* FOOTER STATUS BAR */}
<<<<<<< HEAD
      <div className="w-full max-w-full mt-6 border-t border-[#ECEEDF]/10 pt-3 px-6 sm:px-8 md:px-12 flex flex-row flex-wrap justify-between items-center gap-y-2 gap-x-4 text-[8px] md:text-[9px] tracking-[0.2em] text-[#ECEEDF]/40 uppercase">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>LISTENERS: {listenerCount}</span>
          <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>EST. 2026</span>
          <span>LONDON, UK</span>
        </div>
      </div>
=======
      <Footer
        listenerCount={listenerCount}
        uptimeSeconds={uptimeSeconds}
      />
>>>>>>> f749f32 (Design pass V3 — editorial redesign live, header, homepage)
    </div>
  );
}

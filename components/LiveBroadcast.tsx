'use client';

import { useState, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { supabase } from '../lib/supabase';
import LiveVisualizer from './LiveVisualizer';
import { type NewsPostItem } from './NewsEntry';

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
  trackImageMap?: Record<string, string>;
}

interface TrackCoverProps {
  coverUrl?: string;
  trackKey: string;
}

function TrackCover({ coverUrl, trackKey }: TrackCoverProps) {
  const [src, setSrc] = useState(coverUrl || '/logo.png');
  const [isFallback, setIsFallback] = useState(!coverUrl);

  useEffect(() => {
    setSrc(coverUrl || '/logo.png');
    setIsFallback(!coverUrl);
  }, [coverUrl]);

  return (
    <img
      src={src}
      alt=""
      className="w-10 h-10 border border-[#ECEEDF]/15 bg-black/40 flex-shrink-0"
      style={{
        objectFit: isFallback ? 'contain' : 'cover',
        filter: isFallback ? 'invert(1)' : 'none',
        mixBlendMode: isFallback ? 'screen' : 'normal',
        padding: isFallback ? '4px' : '0px'
      }}
      crossOrigin="anonymous"
      onError={() => {
        if (!isFallback) {
          setSrc('/logo.png');
          setIsFallback(true);
        }
      }}
    />
  );
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
  trackImageMap = {},
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-between min-h-0 bg-black overflow-hidden px-2 md:px-4 py-8 font-mono">
      {/* generative waves visualizer */}
      <LiveVisualizer />

      {/* Main columns container */}
      <div className="w-full max-w-full flex flex-col md:flex-row gap-2 md:gap-4 items-stretch z-10 my-auto border-y border-[#ECEEDF]/15 py-4 md:py-8 px-3 sm:px-4 md:px-8 backdrop-blur-[4px] bg-black/20 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: LAST PLAYED */}
        <div className="w-full md:w-1/5 flex-shrink-0 min-w-0 bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-4 md:pb-0 px-2 sm:px-0 md:pr-4 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[8px] md:text-[9px] lg:text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-2 mb-1">
            LAST PLAYED
          </h2>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[160px] md:max-h-[350px] pr-1 custom-scrollbar">
            {playbackHistory.length === 0 ? (
              <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO HISTORY RECORDED
              </div>
            ) : (
              playbackHistory.slice(0, 5).map((track, i) => {
                const trackKey = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
                const coverUrl = trackImageMap[trackKey];

                return (
                  <div key={i} className="flex items-center gap-3 py-1 border-b border-[#ECEEDF]/5 last:border-b-0 last:pb-0">
                    <TrackCover coverUrl={coverUrl} trackKey={trackKey} />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/85 truncate">
                        {track.artist}
                      </span>
                      <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#ECEEDF]/50 truncate">
                        {track.title}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: MAIN BROADCAST STATION */}
        <div className="w-full md:w-3/5 flex-shrink-0 min-w-0 bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-4 md:pb-0 px-2 sm:px-0 md:px-4 flex flex-col items-center justify-center text-center gap-6 md:gap-12 min-h-fit relative overflow-hidden select-none">
          
          <div className="flex flex-col items-center gap-4 md:gap-8 w-full z-10">
            {/* Status Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  showLiveIndicator 
                    ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                    : 'bg-[#ECEEDF]/20'
                }`} />
                <span className={`text-[8px] md:text-[9px] lg:text-[10px] tracking-[0.3em] font-bold uppercase ${
                  showLiveIndicator ? 'text-red-500' : 'text-[#ECEEDF]/30'
                }`}>
                  {showLiveIndicator ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              
              <div className="text-[8px] tracking-widest text-[#ECEEDF]/30 uppercase mt-1">
                STATUS
              </div>
              <div className="text-[9px] md:text-[11px] font-bold tracking-widest uppercase border border-[#ECEEDF]/15 px-3 py-1 bg-white/[0.01]">
                {broadcastMode === 'live' ? 'LIVE DJ SET' : 'AUTOMATED BROADCAST'}
              </div>
            </div>

            {/* Now Playing visual display */}
            <div className="w-full flex flex-col items-center justify-center min-h-fit flex-1 max-w-xl">
              {broadcastMode === 'live' ? (
                <div className="flex flex-col gap-3 w-full">
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">DJ</span>
                    <span className="text-lg md:text-3xl font-extrabold tracking-widest uppercase text-red-500 truncate block px-2">
                      {djName || 'VOID OPERATOR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">NOW BROADCASTING</span>
                    <span className="text-xs md:text-base font-bold tracking-wider uppercase text-[#ECEEDF]/85 truncate block px-2">
                      {showTitle || 'NIGHT TRANSMISSION'}
                    </span>
                  </div>
                  {djLocation && (
                    <div>
                      <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">LOCATION</span>
                      <span className="text-[9px] md:text-[10px] tracking-widest uppercase text-[#ECEEDF]/60 truncate block px-2">
                        {djLocation}
                      </span>
                    </div>
                  )}
                  {djDescription && (
                    <p className="text-[8px] md:text-[9px] text-[#ECEEDF]/40 tracking-wider uppercase leading-relaxed border-t border-[#ECEEDF]/10 pt-2 mt-1 px-4 break-words">
                      {djDescription}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3 w-full">
                  <span className="text-[8px] md:text-[9px] tracking-[0.3em] text-[#ECEEDF]/30 uppercase font-bold">NOW PLAYING</span>
                  <div className="text-xl md:text-3xl font-black tracking-widest uppercase text-[#ECEEDF] px-2 mt-1 text-center break-words w-full">
                    {currentArtist}
                  </div>
                  <div className="text-sm md:text-lg tracking-[0.15em] uppercase text-[#ECEEDF]/60 px-2 mt-0.5 text-center break-words w-full">
                    {currentTitle}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NEWS DISPATCH */}
        <div className="w-full md:w-1/5 flex-shrink-0 min-w-0 bg-transparent pb-0 px-2 sm:px-0 md:pl-4 flex flex-col gap-3 relative overflow-hidden">
          <h2 className="text-[8px] md:text-[9px] lg:text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-2 mb-1">
            NEWS DISPATCH
          </h2>
          <div className="flex flex-col gap-4 max-h-[180px] md:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {newsPosts.length === 0 ? (
              <div className="text-[8px] md:text-[9px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO DISPATCHES RECORDED
              </div>
            ) : (
              newsPosts.map((post) => (
                <div key={post.id} className="flex flex-col gap-1.5 border-b border-[#ECEEDF]/5 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 text-[7px] md:text-[8px] tracking-wider text-[#ECEEDF]/45 uppercase">
                    <span>
                      {new Date(post.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span className="text-[#ECEEDF]/60">[{post.type}]</span>
                  </div>
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider hover:text-white leading-tight">
                    <a href={`/news/${post.slug}`} className="hover:underline">
                      {post.title}
                    </a>
                  </h3>
                  {post.excerpt && (
                    <p className="text-[9px] md:text-[10px] tracking-wider leading-relaxed text-[#ECEEDF]/50 normal-case first-letter:uppercase line-clamp-2">
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
      <div className="w-full max-w-full mt-6 border-t border-[#ECEEDF]/10 pt-3 flex flex-row flex-wrap justify-between items-center gap-y-2 gap-x-4 text-[8px] md:text-[9px] tracking-[0.2em] text-[#ECEEDF]/40 uppercase select-none z-10 px-4 md:px-8 backdrop-blur-[2px] bg-black/5">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>LISTENERS: {listenerCount}</span>
          <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
        </div>
        <div className="font-bold text-[#ECEEDF]/65 text-center w-full sm:w-auto my-1 sm:my-0">
          {broadcastMode === 'live' ? 'LIVE DJ BROADCAST' : 'CURATED PLAYLIST'}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>EST. 2026</span>
          <span>LONDON, UK</span>
        </div>
      </div>
    </div>
  );
}

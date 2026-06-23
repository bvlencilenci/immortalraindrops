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
  const [upcomingQueue, setUpcomingQueue] = useState<{ artist: string; title: string }[]>([]);

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

  // Footer statistics effects (listeners & uptime)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/radio/stats');
        if (res.ok) {
          const data = await res.json();
          setListenerCount(data.listeners || 0);
          setUptimeSeconds(data.uptime || 0);
        }
      } catch (err) {
        console.error('Error fetching stream stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll stats every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds(prev => (prev > 0 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch upcoming queue when now playing title changes
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('/api/radio/queue');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.queue) {
            setUpcomingQueue(data.queue.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Error fetching upcoming queue:', err);
      }
    };

    fetchUpcoming();
  }, [nowPlayingTitle]);

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

      {/* Main columns grid */}
      <div className="w-full max-w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch z-10 my-auto border-y border-[#ECEEDF]/15 py-10 md:py-12">
        
        {/* LEFT COLUMN: LAST PLAYED */}
        <div className="bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-8 md:pb-0 pr-0 md:pr-10 flex flex-col gap-6 relative overflow-hidden">
          <h2 className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-3 mb-2">
            LAST PLAYED
          </h2>
          <div className="flex flex-col gap-5">
            {playbackHistory.length === 0 ? (
              <div className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO HISTORY RECORDED
              </div>
            ) : (
              playbackHistory.slice(0, 5).map((track, i) => {
                const trackKey = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
                const coverUrl = trackImageMap[trackKey];

                return (
                  <div key={i} className="flex items-center gap-4 py-1 border-b border-[#ECEEDF]/5 last:border-b-0 last:pb-0">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="w-12 h-12 object-cover border border-[#ECEEDF]/15 bg-black/40 flex-shrink-0"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/[0.03] border border-[#ECEEDF]/10 flex items-center justify-center text-[9px] text-[#ECEEDF]/30 flex-shrink-0 select-none">
                        [TRK]
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/85 truncate">
                        {track.artist}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[#ECEEDF]/50 truncate">
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
        <div className="bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-8 md:pb-0 pr-0 md:pr-10 flex flex-col items-center justify-center text-center gap-16 min-h-[400px] relative overflow-hidden select-none">
          
          <div className="flex flex-col items-center gap-8 w-full z-10">
            {/* Station Branding */}
            <div className="flex flex-col items-center font-bold text-center select-none uppercase mb-2 tracking-[0.4em] text-[#ECEEDF]/45">
              <span className="text-xl md:text-2xl leading-[1.3]">I M M O R T A L</span>
              <span className="text-xl md:text-2xl leading-[1.3]">R A I N D R O P S</span>
              <span className="text-xl md:text-2xl leading-[1.3]">R A D I O</span>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  showLiveIndicator 
                    ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                    : 'bg-[#ECEEDF]/20'
                }`} />
                <span className={`text-[10px] tracking-[0.3em] font-bold uppercase ${
                  showLiveIndicator ? 'text-red-500' : 'text-[#ECEEDF]/30'
                }`}>
                  {showLiveIndicator ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              
              <div className="text-[8px] tracking-widest text-[#ECEEDF]/30 uppercase mt-2">
                STATUS
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase border border-[#ECEEDF]/15 px-3 py-1 bg-white/[0.01]">
                {broadcastMode === 'live' ? 'LIVE DJ SET' : 'AUTOMATED BROADCAST'}
              </div>
            </div>

            {/* Now Playing visual display */}
            <div className="w-full flex flex-col items-center justify-center min-h-[180px] max-w-sm">
              {broadcastMode === 'live' ? (
                <div className="flex flex-col gap-4 w-full">
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">DJ</span>
                    <span className="text-2xl md:text-4xl font-extrabold tracking-widest uppercase text-red-500 truncate block px-2">
                      {djName || 'VOID OPERATOR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">NOW BROADCASTING</span>
                    <span className="text-sm md:text-lg font-bold tracking-wider uppercase text-[#ECEEDF]/85 truncate block px-2">
                      {showTitle || 'NIGHT TRANSMISSION'}
                    </span>
                  </div>
                  {djLocation && (
                    <div>
                      <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">LOCATION</span>
                      <span className="text-[10px] tracking-widest uppercase text-[#ECEEDF]/60 truncate block px-2">
                        {djLocation}
                      </span>
                    </div>
                  )}
                  {djDescription && (
                    <p className="text-[9px] text-[#ECEEDF]/40 tracking-wider uppercase leading-relaxed border-t border-[#ECEEDF]/10 pt-3 mt-1 px-4 break-words">
                      {djDescription}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3 w-full">
                  <span className="text-[9px] tracking-[0.3em] text-[#ECEEDF]/30 uppercase font-bold">NOW PLAYING</span>
                  <div className="text-4xl md:text-6xl font-black tracking-widest uppercase text-[#ECEEDF] truncate max-w-full px-2 mt-2">
                    {currentArtist}
                  </div>
                  <div className="text-lg md:text-2xl tracking-[0.15em] uppercase text-[#ECEEDF]/60 truncate max-w-full px-2 mt-1">
                    {currentTitle}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING */}
        <div className="bg-transparent pb-0 pr-0 flex flex-col gap-6 relative overflow-hidden">
          <h2 className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-3 mb-2">
            UPCOMING
          </h2>
          <div className="flex flex-col gap-5">
            {upcomingQueue.length === 0 ? (
              <div className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO UPCOMING QUEUE
              </div>
            ) : (
              upcomingQueue.map((track, i) => {
                const trackKey = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
                const coverUrl = trackImageMap[trackKey];
                const indexStr = (i + 1).toString().padStart(2, '0');

                return (
                  <div key={i} className="flex items-center gap-4 py-1 border-b border-[#ECEEDF]/5 last:border-b-0 last:pb-0">
                    <span className="text-[11px] font-bold font-mono text-[#ECEEDF]/40 shrink-0">
                      {indexStr}
                    </span>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="w-12 h-12 object-cover border border-[#ECEEDF]/15 bg-black/40 flex-shrink-0"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/[0.03] border border-[#ECEEDF]/10 flex items-center justify-center text-[9px] text-[#ECEEDF]/30 flex-shrink-0 select-none">
                        [TRK]
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/85 truncate">
                        {track.artist}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[#ECEEDF]/50 truncate">
                        {track.title}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* FOOTER STATUS BAR */}
      <div className="w-full max-w-full mt-8 border-t border-[#ECEEDF]/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] tracking-[0.2em] text-[#ECEEDF]/40 uppercase select-none z-10 px-2 md:px-4">
        <div className="flex gap-6">
          <span>LISTENERS: {listenerCount}</span>
          <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
        </div>
        <div className="font-bold text-[#ECEEDF]/65">
          {broadcastMode === 'live' ? 'LIVE DJ BROADCAST' : 'CURATED PLAYLIST'}
        </div>
        <div className="flex gap-6">
          <span>EST. 2026</span>
          <span>LONDON, UK</span>
        </div>
      </div>
    </div>
  );
}

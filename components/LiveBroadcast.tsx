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
  const [listenerCount, setListenerCount] = useState(128);
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

  // Footer statistics effects (listeners & uptime)
  useEffect(() => {
    const interval = setInterval(() => {
      setListenerCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // Fluctuation of -2 to +2
        const next = prev + delta;
        return next > 0 ? next : 10;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Start uptime at a realistic seed (e.g. 3 hours, 17 minutes, 42 seconds)
    const initialSeconds = 3 * 3600 + 17 * 60 + 42;
    setUptimeSeconds(initialSeconds);

    const interval = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse artist and title for display
  const getDisplayTrackInfo = () => {
    if (!nowPlayingTitle || ['OFFLINE', 'STANDBY', 'CONNECTING...'].includes(nowPlayingTitle.toUpperCase())) {
      return { artist: 'STANDBY', title: '' };
    }
    const parts = nowPlayingTitle.split(/ - | — /);
    const artist = parts[0]?.trim() || 'Unknown Artist';
    const title = parts[1]?.trim() || parts[0]?.trim() || 'Unknown Title';
    const current = { artist, title };
    console.log("CURRENT TRACK", current);
    return current;
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-between min-h-0 bg-black overflow-hidden px-4 md:px-8 py-8 font-mono">
      {/* generative waves visualizer */}
      <LiveVisualizer />

      {/* Main columns grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch z-10 my-auto">
        
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
        <div className="bg-transparent border-b md:border-b-0 md:border-r border-[#ECEEDF]/10 pb-8 md:pb-0 pr-0 md:pr-10 flex flex-col items-center justify-center text-center gap-10 min-h-[400px] relative overflow-hidden select-none">
          
          <div className="flex flex-col items-center gap-8 w-full z-10">
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
            <div className="w-full py-8 flex flex-col items-center justify-center min-h-[180px] max-w-sm mt-4">
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
                <div className="flex flex-col items-center text-center gap-2.5 w-full">
                  <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase">NOW PLAYING</span>
                  <div className="text-3xl md:text-5xl font-extrabold tracking-widest uppercase text-[#ECEEDF] truncate max-w-full px-2">
                    {currentArtist}
                  </div>
                  {currentTitle && (
                    <div className="text-sm md:text-lg tracking-widest uppercase text-[#ECEEDF]/60 truncate max-w-full px-2 mt-1">
                      {currentTitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NEWS DISPATCH */}
        <div className="bg-transparent pb-0 pr-0 flex flex-col gap-6 relative overflow-hidden">
          <h2 className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-3 mb-2">
            NEWS DISPATCH
          </h2>
          <div className="flex flex-col gap-5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {newsPosts.length === 0 ? (
              <div className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest py-4">
                NO DISPATCHES RECORDED
              </div>
            ) : (
              newsPosts.map((post) => (
                <div key={post.id} className="flex flex-col gap-2 border-b border-[#ECEEDF]/5 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 text-[8px] tracking-wider text-[#ECEEDF]/45 uppercase">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider hover:text-white leading-tight">
                    <a href={`/news/${post.slug}`} className="hover:underline">
                      {post.title}
                    </a>
                  </h3>
                  {post.excerpt && (
                    <p className="text-[10px] tracking-wider leading-relaxed text-[#ECEEDF]/50 normal-case first-letter:uppercase line-clamp-2">
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
      <div className="w-full max-w-6xl mt-8 border-t border-[#ECEEDF]/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] tracking-[0.2em] text-[#ECEEDF]/40 uppercase select-none z-10">
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

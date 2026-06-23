'use client';

import { useState, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { supabase } from '../lib/supabase';
import LiveVisualizer from './LiveVisualizer';

interface PlaybackHistoryItem {
  title: string;
  artist: string;
}

interface UpcomingTrack {
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

  const [upcomingTracks, setUpcomingTracks] = useState<{ artist: string; title: string }[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/radio/queue');
        const data = await res.json();
        if (data?.success && Array.isArray(data.queue)) {
          setUpcomingTracks(data.queue);
        } else {
          setUpcomingTracks([]);
        }
      } catch (err) {
        console.error('Error fetching queue:', err);
        setUpcomingTracks([]);
      }
    };
    fetchQueue();
    // Poll the queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
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

  const { artist: currentArtist, title: currentTitle } = getDisplayTrackInfo();

  // Show live indicator when DJ is connected OR when playing automated curated playlist
  const showLiveIndicator = isLive || broadcastMode === 'automated';
  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-0 bg-black overflow-hidden px-4 md:px-8 py-8 font-mono">
      <LiveVisualizer />

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch z-10">
        
        {/* LEFT COLUMN: LAST PLAYED */}
        <div className="bg-black/40 backdrop-blur-[2px] border border-[#ECEEDF]/10 p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(236,238,223,0.005)_4px,rgba(236,238,223,0.005)_8px)] pointer-events-none" />
          <div className="z-10 flex flex-col gap-8">
            <h2 className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-3">
              LAST PLAYED
            </h2>
            <div className="flex flex-col gap-6">
              {playbackHistory.length === 0 ? (
                <div className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest">
                  NO HISTORY RECORDED
                </div>
              ) : (
                playbackHistory.slice(0, 5).map((track, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/85 truncate">
                      {track.artist}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[#ECEEDF]/50 truncate">
                      {track.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: MAIN BROADCAST STATION */}
        <div className="bg-black/40 backdrop-blur-[2px] border border-[#ECEEDF]/10 p-8 md:p-10 flex flex-col items-center justify-center text-center gap-10 min-h-[500px] relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(236,238,223,0.005)_4px,rgba(236,238,223,0.005)_8px)] pointer-events-none" />
          
          <div className="flex flex-col items-center gap-8 max-w-sm w-full z-10">
            {/* Station Identity */}
            <h2 className="text-[10px] tracking-[0.5em] text-[#ECEEDF]/40 uppercase font-bold">
              IMMORTAL RAINDROPS RADIO
            </h2>

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
              
              <div className="text-[9px] tracking-widest text-[#ECEEDF]/30 uppercase mt-2">
                STATUS
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase border border-[#ECEEDF]/15 px-3 py-1 bg-white/[0.01]">
                {broadcastMode === 'live' ? 'LIVE DJ SET' : 'CURATED PLAYLIST'}
              </div>
            </div>

            {/* Main Playout Frame */}
            <div className="w-full py-8 border-y border-[#ECEEDF]/15 flex flex-col items-center justify-center min-h-[180px] max-w-xs">
              {broadcastMode === 'live' ? (
                <div className="flex flex-col gap-4 w-full">
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">DJ</span>
                    <span className="text-lg font-bold tracking-widest uppercase text-red-500 truncate block px-2">
                      {djName || 'VOID OPERATOR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase block mb-1">NOW BROADCASTING</span>
                    <span className="text-xs font-bold tracking-wider uppercase text-[#ECEEDF]/85 truncate block px-2">
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
                <div className="flex flex-col gap-3 w-full">
                  <span className="text-[8px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase">NOW PLAYING</span>
                  <div className="text-sm font-bold tracking-widest uppercase text-[#ECEEDF] truncate px-2">
                    {currentArtist}
                  </div>
                  {currentTitle && (
                    <div className="text-[11px] tracking-wider uppercase text-[#ECEEDF]/60 truncate px-2">
                      {currentTitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING */}
        <div className="bg-black/40 backdrop-blur-[2px] border border-[#ECEEDF]/10 p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(236,238,223,0.005)_4px,rgba(236,238,223,0.005)_8px)] pointer-events-none" />
          <div className="z-10 flex flex-col gap-8">
            <h2 className="text-[10px] tracking-[0.3em] font-bold text-[#ECEEDF]/40 uppercase border-b border-[#ECEEDF]/10 pb-3">
              UPCOMING
            </h2>
            <div className="flex flex-col gap-6">
              {upcomingTracks.length === 0 ? (
                <div className="text-[10px] text-[#ECEEDF]/20 uppercase tracking-widest">
                  QUEUE UNAVAILABLE
                </div>
              ) : (
                upcomingTracks.slice(0, 5).map((track, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]/85 truncate">
                      {track.artist}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[#ECEEDF]/50 truncate">
                      {track.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

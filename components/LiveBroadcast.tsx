'use client';

import { useState, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { supabase } from '../lib/supabase';

interface LiveBroadcastProps {
  initialIsLive: boolean;
  initialTitle: string;
}

export default function LiveBroadcast({ initialIsLive, initialTitle }: LiveBroadcastProps) {
  const [isLive, setIsLive] = useState(initialIsLive);
  const [nowPlayingTitle, setNowPlayingTitle] = useState(initialTitle);
  const { currentlyPlayingId, isPlaying, playLiveStream, togglePlay } = useAudioStore();

  const isRadioPlaying = currentlyPlayingId === 'radio-stream' && isPlaying;

  // Real-time listener for system settings changes
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
          const newData = payload.new as { is_live: boolean; now_playing_title?: string; stream_title?: string };
          setIsLive(newData.is_live);
          setNowPlayingTitle(newData.now_playing_title || newData.stream_title || 'OFFLINE');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePlayToggle = () => {
    if (currentlyPlayingId === 'radio-stream') {
      togglePlay();
    } else {
      const streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || '';
      playLiveStream(streamUrl);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-black text-[#ECEEDF] font-mono p-8 select-none">
      <div className="max-w-2xl w-full border border-[#ECEEDF]/20 p-8 md:p-12 bg-white/[0.01] flex flex-col items-center relative overflow-hidden">
        
        {/* Background visualizer/decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ECEEDF]/5 via-transparent to-transparent pointer-events-none" />

        {/* Live / Offline Status Badge */}
        <div className="flex items-center gap-3 mb-8 z-10">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'bg-[#ECEEDF]/30'}`} />
          <span className="text-[12px] tracking-[0.4em] font-bold uppercase">
            {isLive ? 'TRANSMITTING' : 'OFFLINE'}
          </span>
        </div>

        {/* Main Station Name */}
        <h2 className="text-sm tracking-[0.6em] text-[#ECEEDF]/50 uppercase mb-4 text-center z-10">
          IMMORTAL RAINDROPS RADIO
        </h2>

        {/* Now Playing Block */}
        <div className="w-full min-h-[120px] flex flex-col items-center justify-center border-y border-[#ECEEDF]/10 py-8 my-6 text-center z-10">
          <span className="text-[10px] tracking-[0.3em] text-[#ECEEDF]/40 uppercase mb-2">NOW PLAYING</span>
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight max-w-lg leading-tight truncate px-4">
            {isRadioPlaying ? (isLive ? nowPlayingTitle : 'PLAYLIST ROTATION') : 'STANDBY'}
          </h1>
        </div>

        {/* Player Action Button */}
        <button
          onClick={handlePlayToggle}
          className="group relative px-10 py-5 bg-[#ECEEDF] text-black font-bold text-sm tracking-[0.2em] uppercase hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 z-10 shadow-lg shadow-black/20"
        >
          {isRadioPlaying ? '[ PAUSE BROADCAST ]' : '[ TUNE IN ]'}
        </button>

        {/* Visual Waveform Effect when playing */}
        {isRadioPlaying && (
          <div className="flex items-end justify-center gap-1.5 h-12 mt-12 z-10">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#ECEEDF] animate-wave"
                style={{
                  height: '100%',
                  animationDuration: `${0.8 + (i % 4) * 0.15}s`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { height: 4px; opacity: 0.3; }
          50% { height: 48px; opacity: 1; }
        }
        .animate-wave {
          animation-name: wave;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
}

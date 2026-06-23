'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  radioSkipTrack,
  radioSkipFeatured,
  radioSkipNormal,
  radioGetStatus,
  radioGetNowPlaying,
  radioSubmitFeaturedQueue,
  radioGetFeaturedQueue,
  updateBroadcastSettings,
} from '@/app/godmode/actions';
import { supabase } from '@/lib/supabase';

interface QueuedTrack {
  url: string;
  title: string;
  artist: string;
  addedAt: number;
}

export default function BroadcastControls() {
  const [status, setStatus] = useState<string>('CONNECTING...');
  const [nowPlaying, setNowPlaying] = useState<string>('—');
  const [isSkipping, setIsSkipping] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Broadcast Mode & DJ settings state
  const [broadcastMode, setBroadcastMode] = useState<'automated' | 'live'>('automated');
  const [djName, setDjName] = useState('');
  const [showTitle, setShowTitle] = useState('');
  const [djLocation, setDjLocation] = useState('');
  const [djDescription, setDjDescription] = useState('');
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  // Queue state
  const [queue, setQueue] = useState<QueuedTrack[]>([]);
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputArtist, setInputArtist] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flash feedback for 2 seconds
  const flashAction = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 2000);
  };

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // Poll status
  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, npRes] = await Promise.all([
        radioGetStatus(),
        radioGetNowPlaying(),
      ]);

      if (statusRes.success && statusRes.result) {
        // Parse "mode=LIVE" or "mode=PLAYLIST"
        const mode = statusRes.result.replace('mode=', '').trim();
        setStatus(mode);
      } else {
        setStatus('OFFLINE');
      }

      if (npRes.success && npRes.result) {
        setNowPlaying(npRes.result.trim());
      }
    } catch {
      setStatus('ERROR');
    }
  }, []);

  // Poll queue state
  const fetchQueue = useCallback(async () => {
    try {
      const res = await radioGetFeaturedQueue();
      if (res.success && res.queue) {
        setQueue(res.queue);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchQueue();
    const interval = setInterval(() => {
      fetchStatus();
      fetchQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchQueue]);

  // Load initial broadcast settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('broadcast_mode, dj_name, show_title, dj_location, dj_description')
          .eq('id', 1)
          .single();
        
        if (error) throw error;
        if (data) {
          setBroadcastMode((data.broadcast_mode || 'automated') as 'automated' | 'live');
          setDjName(data.dj_name || '');
          setShowTitle(data.show_title || '');
          setDjLocation(data.dj_location || '');
          setDjDescription(data.dj_description || '');
        }
      } catch (err: any) {
        console.error('Failed to load initial broadcast settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSaveBroadcastSettings = async (modeOverride?: 'automated' | 'live') => {
    setIsUpdatingMode(true);
    setError(null);

    const activeMode = modeOverride || broadcastMode;

    try {
      const res = await updateBroadcastSettings({
        broadcast_mode: activeMode,
        dj_name: djName,
        show_title: showTitle,
        dj_location: djLocation,
        dj_description: djDescription,
      });

      if (res.success) {
        flashAction('BROADCAST CONFIG SAVED');
      } else {
        flashError(res.error || 'Failed to update broadcast configuration');
      }
    } catch (err: any) {
      flashError(err.message || 'Error saving settings');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleSkip = async (type: 'main' | 'featured' | 'normal') => {
    setIsSkipping(true);
    setError(null);

    let res;
    switch (type) {
      case 'main':
        res = await radioSkipTrack();
        break;
      case 'featured':
        res = await radioSkipFeatured();
        break;
      case 'normal':
        res = await radioSkipNormal();
        break;
    }

    if (res.success) {
      flashAction(`SKIPPED ${type.toUpperCase()}`);
      // Refresh status after skip
      setTimeout(fetchStatus, 1000);
    } else {
      flashError(res.error || 'Skip failed');
    }

    setIsSkipping(false);
  };

  const handleSubmitQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    setIsSubmitting(true);
    setError(null);

    // Optimistic update
    const tempTrack: QueuedTrack = {
      url: inputUrl,
      title: inputTitle || 'Unknown Title',
      artist: inputArtist || 'Unknown Artist',
      addedAt: Date.now(),
    };
    setQueue((prev) => [...prev, tempTrack]);

    const res = await radioSubmitFeaturedQueue({
      url: inputUrl,
      title: inputTitle,
      artist: inputArtist,
    });

    if (res.success) {
      flashAction('SUBMITTED TO FEATURED QUEUE');
      setInputUrl('');
      setInputTitle('');
      setInputArtist('');
      if (res.queue) setQueue(res.queue);
    } else {
      flashError(res.error || 'Submission failed');
      // Rollback optimistic update
      fetchQueue();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-4xl font-mono">

      {/* STATUS HUD */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 relative overflow-hidden group hover:border-[#ECEEDF]/20 transition-colors">
        {/* Subtle scan line effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(236,238,223,0.015)_2px,rgba(236,238,223,0.015)_4px)] pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6">
            TRANSMISSION STATUS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Indicator */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">ENGINE MODE</span>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  status === 'LIVE' 
                    ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]' 
                    : status === 'PLAYLIST' 
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                      : 'bg-[#ECEEDF]/20'
                }`} />
                <span className={`text-xl font-bold tracking-tight ${
                  status === 'LIVE' ? 'text-red-500' : 'text-[#ECEEDF]'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Now Playing */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">NOW PLAYING</span>
              <span className="text-sm text-[#ECEEDF] truncate max-w-[300px]">
                {nowPlaying}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRACK CONTROLS */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 group hover:border-[#ECEEDF]/20 transition-colors">
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
          TRACK CONTROL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Skip Main Radio */}
          <button
            onClick={() => handleSkip('main')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/20 bg-black/40 text-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] hover:shadow-[0_0_20px_rgba(236,238,223,0.2)] active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP TRACK</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-4 h-4 fill-current">
              <path d="M200,32a8,8,0,0,0-8,8v69.23L72.43,34.45A15.95,15.95,0,0,0,48,47.88V208.12a16,16,0,0,0,24.43,13.43L192,146.77V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32ZM64,207.93V48.05l127.84,80Z" />
            </svg>
          </button>

          {/* Skip Featured Source */}
          <button
            onClick={() => handleSkip('featured')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/10 bg-black/40 text-[#ECEEDF]/60 hover:bg-[#ECEEDF]/10 hover:text-[#ECEEDF] hover:border-[#ECEEDF]/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP FEATURED</span>
            <span className="text-[8px] opacity-50">▶▶</span>
          </button>

          {/* Skip Normal Source */}
          <button
            onClick={() => handleSkip('normal')}
            disabled={isSkipping}
            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/10 bg-black/40 text-[#ECEEDF]/60 hover:bg-[#ECEEDF]/10 hover:text-[#ECEEDF] hover:border-[#ECEEDF]/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>SKIP NORMAL</span>
            <span className="text-[8px] opacity-50">▶▶</span>
          </button>
        </div>
      </div>

      {/* BROADCAST CONFIGURATION */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 group hover:border-[#ECEEDF]/20 transition-colors">
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
          BROADCAST MODE & CONFIG
        </h3>

        {/* Mode Toggles */}
        <div className="flex flex-col gap-4 mb-6">
          <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">SELECT BROADCAST MODE</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 text-xs uppercase tracking-wider cursor-pointer select-none">
              <input
                type="radio"
                name="broadcast_mode"
                value="automated"
                checked={broadcastMode === 'automated'}
                onChange={() => {
                  setBroadcastMode('automated');
                  handleSaveBroadcastSettings('automated');
                }}
                disabled={isUpdatingMode}
                className="accent-[#ECEEDF] cursor-pointer"
              />
              <span>AUTOMATED RADIO</span>
            </label>
            <label className="flex items-center gap-3 text-xs uppercase tracking-wider cursor-pointer select-none">
              <input
                type="radio"
                name="broadcast_mode"
                value="live"
                checked={broadcastMode === 'live'}
                onChange={() => {
                  setBroadcastMode('live');
                  handleSaveBroadcastSettings('live');
                }}
                disabled={isUpdatingMode}
                className="accent-[#ECEEDF] cursor-pointer"
              />
              <span>LIVE DJ BROADCAST</span>
            </label>
          </div>
        </div>

        {/* Live DJ Details form */}
        {broadcastMode === 'live' && (
          <div className="border border-[#ECEEDF]/10 bg-black/40 p-5 flex flex-col gap-4">
            <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold block mb-1">
              LIVE DJ SET DETAILS (AUTO-SAVES ON UNFOCUS / BLUR)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">DJ NAME</label>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  onBlur={() => handleSaveBroadcastSettings()}
                  placeholder="VOID ANGEL"
                  className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">SHOW TITLE</label>
                <input
                  type="text"
                  value={showTitle}
                  onChange={(e) => setShowTitle(e.target.value)}
                  onBlur={() => handleSaveBroadcastSettings()}
                  placeholder="NIGHT TRANSMISSION 004"
                  className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">LOCATION</label>
                <input
                  type="text"
                  value={djLocation}
                  onChange={(e) => setDjLocation(e.target.value)}
                  onBlur={() => handleSaveBroadcastSettings()}
                  placeholder="LONDON"
                  className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">DESCRIPTION</label>
              <textarea
                value={djDescription}
                onChange={(e) => setDjDescription(e.target.value)}
                onBlur={() => handleSaveBroadcastSettings()}
                placeholder="2 HOURS OF DUB TECHNO"
                rows={3}
                className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* DJ BROADCAST */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 group hover:border-[#ECEEDF]/20 transition-colors">
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
          DJ BROADCAST
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Live Source Indicator */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">LIVE SOURCE</span>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                status === 'LIVE'
                  ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : 'bg-[#ECEEDF]/15'
              }`} />
              <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-tight ${
                  status === 'LIVE' ? 'text-red-400' : 'text-[#ECEEDF]/40'
                }`}>
                  {status === 'LIVE' ? 'DJ LIVE — OVERRIDING PLAYLIST' : 'NO LIVE SOURCE'}
                </span>
                <span className="text-[9px] text-[#ECEEDF]/25 mt-0.5 uppercase tracking-widest">
                  {status === 'LIVE' ? 'Harbor connected on port 8005' : 'Automated playlist active'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Mirror */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">ENGINE MODE</span>
            <span className={`text-sm font-bold tracking-tight ${
              status === 'LIVE' ? 'text-red-400' : status === 'OFFLINE' ? 'text-[#ECEEDF]/20' : 'text-[#ECEEDF]/70'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Instruction Block */}
        <div className="border border-[#ECEEDF]/10 bg-black/40 p-4">
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#ECEEDF]/30 block mb-3">HOW TO GO LIVE</span>
          <ol className="flex flex-col gap-2">
            {[
              { n: '1', text: 'Run ./dj-connect.sh from the project root' },
              { n: '2', text: 'Wait for "Tunnel active on 127.0.0.1:8005"' },
              { n: '3', text: 'Open BUTT → Server: 127.0.0.1:8005, Mount: /live' },
              { n: '4', text: 'Hit Connect — playlist overrides automatically' },
              { n: '5', text: 'Disconnect in BUTT, then Ctrl+C in terminal to end' },
            ].map(({ n, text }) => (
              <li key={n} className="flex gap-3 text-[10px] text-[#ECEEDF]/40">
                <span className="text-[#ECEEDF]/20 font-bold w-3 shrink-0">{n}.</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <p className="text-[9px] text-[#ECEEDF]/20 mt-3 border-t border-[#ECEEDF]/5 pt-3">
            See <span className="text-[#ECEEDF]/40">docs/dj-setup.md</span> for full BUTT config reference.
          </p>
        </div>
      </div>

      {/* FEATURED QUEUE INGESTION */}
      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] p-6 group hover:border-[#ECEEDF]/20 transition-colors">
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
          SUBMIT TO FEATURED QUEUE (LIVE INGESTION)
        </h3>

        <form onSubmit={handleSubmitQueue} className="flex flex-col gap-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">TRACK URL (MP3/WAV)</label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://pub-*.r2.dev/track.mp3"
                required
                className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF] focus:ring-1 focus:ring-[#ECEEDF]/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">TRACK TITLE</label>
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Transmission 01"
                className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF] focus:ring-1 focus:ring-[#ECEEDF]/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40">ARTIST</label>
              <input
                type="text"
                value={inputArtist}
                onChange={(e) => setInputArtist(e.target.value)}
                placeholder="Unknown Operator"
                className="w-full bg-black/40 border border-[#ECEEDF]/20 px-3 py-2 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF] focus:ring-1 focus:ring-[#ECEEDF]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !inputUrl}
            className="w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold border border-[#ECEEDF]/20 bg-black/40 text-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'QUEUEING...' : 'ADD TO FEATURED ROTATION'}
          </button>
        </form>

        {/* LIVE QUEUE DISPLAY */}
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 mb-3 block">CURRENT FEATURED QUEUE</span>
          {queue.length === 0 ? (
            <div className="text-[10px] text-[#ECEEDF]/30 border border-[#ECEEDF]/5 p-4 text-center">
              QUEUE IS EMPTY — AUTOMATED ROTATION ACTIVE
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto border border-[#ECEEDF]/10 p-3 bg-black/20">
              {queue.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] border-b border-[#ECEEDF]/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-1 truncate max-w-[80%]">
                    <span className="text-[#ECEEDF] font-bold truncate">
                      {idx + 1}. {item.artist} — {item.title}
                    </span>
                    <span className="text-[#ECEEDF]/30 truncate text-[9px]">
                      {item.url}
                    </span>
                  </div>
                  <span className="text-[8px] text-[#ECEEDF]/40 shrink-0 font-mono">
                    {new Date(item.addedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {lastAction && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#ECEEDF] text-black font-mono text-[10px] uppercase tracking-[0.3em] px-6 py-3 shadow-[0_0_30px_rgba(236,238,223,0.3)] animate-pulse">
          ✓ {lastAction}
        </div>
      )}

      {/* ERROR TOAST */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-red-400/50">
          ✗ {error}
        </div>
      )}
    </div>
  );
}

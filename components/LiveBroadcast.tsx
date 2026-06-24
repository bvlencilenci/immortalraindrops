'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import LiveVisualizer from './LiveVisualizer';
import { Footer } from './ui/Footer';

interface PlaybackHistoryItem {
  title: string;
  artist: string;
}

interface NewsPost {
  id: string | number;
  type?: string;
  title: string;
}

interface LiveSettingsPayload {
  stream_title?: string;
  playback_history?: PlaybackHistoryItem[];
}

interface LiveBroadcastProps {
  initialIsLive?: boolean;
  initialTitle: string;
  initialBroadcastMode: string;
  initialDjName: string;
  initialShowTitle: string;
  initialDjLocation?: string;
  initialDjDescription?: string;
  initialPlaybackHistory: PlaybackHistoryItem[];
  listenerCount?: number;
  uptimeSeconds?: number;
  newsPosts?: NewsPost[];
  trackAudioMap?: Record<string, string>;
}

const normalizeTrackKey = (track?: Partial<PlaybackHistoryItem>) =>
  `${track?.artist || ''}::${track?.title || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();

const dedupeHistory = (items: PlaybackHistoryItem[] = []) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normalizeTrackKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const railTextShadow = '0 1px 4px rgba(0,0,0,0.98), 0 0 14px rgba(0,0,0,0.86)';

export default function LiveBroadcast({
  initialTitle,
  initialBroadcastMode,
  initialDjName,
  initialShowTitle,
  initialPlaybackHistory,
  listenerCount = 0,
  uptimeSeconds = 0,
  newsPosts = [],
}: LiveBroadcastProps) {

  const [nowPlayingTitle, setNowPlayingTitle] = useState(initialTitle);
  const [playbackHistory, setPlaybackHistory] =
    useState<PlaybackHistoryItem[]>(() => dedupeHistory(initialPlaybackHistory || []));
  const [maxHistory, setMaxHistory] = useState(8);
  const [maxNews, setMaxNews] = useState(7);
  const historyRailRef = useRef<HTMLDivElement>(null);
  const newsRailRef = useRef<HTMLDivElement>(null);

  const [broadcastMode] = useState<'automated' | 'live'>(
    initialBroadcastMode === 'live' ? 'live' : 'automated'
  );

  const [djName] = useState(initialDjName);
  const [showTitle] = useState(initialShowTitle);

  const visibleHistory = useMemo(
    () => dedupeHistory(playbackHistory).slice(0, maxHistory),
    [playbackHistory, maxHistory]
  );
  const visibleNews = useMemo(
    () => newsPosts.slice(0, maxNews),
    [newsPosts, maxNews]
  );

  const parse = () => {
    const p = nowPlayingTitle?.split(/ - | — /);
    if (!p || p.length < 2) return { artist: 'UNKNOWN', title: 'UNKNOWN' };
    return { artist: p[0], title: p.slice(1).join(' - ') };
  };

  const { artist, title } = parse();

  useEffect(() => {
    const updateRailCounts = () => {
      const historyHeight = historyRailRef.current?.getBoundingClientRect().height || 0;
      const newsHeight = newsRailRef.current?.getBoundingClientRect().height || 0;

      if (historyHeight) {
        setMaxHistory(Math.max(3, Math.floor((historyHeight - 190) / 64)));
      }

      if (newsHeight) {
        setMaxNews(Math.max(3, Math.floor((newsHeight - 186) / 66)));
      }
    };

    const observer = new ResizeObserver(updateRailCounts);
    if (historyRailRef.current) observer.observe(historyRailRef.current);
    if (newsRailRef.current) observer.observe(newsRailRef.current);

    updateRailCounts();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const applySettings = (settings: LiveSettingsPayload | null) => {
      if (!settings) return;

      if (typeof settings.stream_title === 'string') {
        setNowPlayingTitle(settings.stream_title);
      }

      if (Array.isArray(settings.playback_history)) {
        setPlaybackHistory(dedupeHistory(settings.playback_history));
      }
    };

    const channel = supabase
      .channel('live-broadcast-system-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'id=eq.1',
        },
        (payload) => applySettings(payload.new)
      )
      .subscribe();

    const interval = window.setInterval(async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('stream_title, playback_history')
        .eq('id', 1)
        .single();

      applySettings(data);
    }, 12000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white">

      <div className="absolute inset-0 opacity-90 scale-110">
        <LiveVisualizer />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          maskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 46%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0.62) 76%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 46%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0.62) 76%, black 100%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          maskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 34%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.48) 72%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 34%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.48) 72%, transparent 100%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 0%, transparent 44%, rgba(0,0,0,0.1) 58%, rgba(0,0,0,0.42) 82%, rgba(0,0,0,0.72) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 18%, transparent 76%, rgba(0,0,0,0.24) 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 z-20 mix-blend-overlay opacity-[0.16] pointer-events-none"
        style={{
          backgroundImage: `
            repeating-radial-gradient(
              circle at 18% 24%,
              rgba(255,255,255,0.18) 0px,
              rgba(255,255,255,0.18) 1px,
              transparent 1px,
              transparent 4px
            ),
            repeating-radial-gradient(
              circle at 72% 64%,
              rgba(0,0,0,0.2) 0px,
              rgba(0,0,0,0.2) 1px,
              transparent 1px,
              transparent 5px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 1px,
              transparent 1px,
              transparent 3px
            )
          `,
          backgroundSize: '17px 17px, 23px 23px, 100% 3px',
        }}
      />

      <div className="relative z-10 flex h-full">

        {/* ================= HISTORY (SYSTEM PANEL) ================= */}
        <div
          ref={historyRailRef}
          className="w-72 relative flex flex-col overflow-visible"
        >

          <div
            className="hidden"
            style={{
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              maskImage: 'radial-gradient(circle at 20% 48%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.1) 62%, transparent 82%)',
              WebkitMaskImage: 'radial-gradient(circle at 20% 48%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.1) 62%, transparent 82%)',
            }}
          />

          <div
            className="hidden"
            style={{
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              maskImage: 'radial-gradient(circle at 24% 38%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.06) 66%, transparent 84%)',
              WebkitMaskImage: 'radial-gradient(circle at 24% 38%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.06) 66%, transparent 84%)',
            }}
          />

          <div
            className="hidden"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 18% 46%,
                  rgba(0,0,0,0.28) 0%,
                  rgba(0,0,0,0.16) 38%,
                  rgba(190,255,46,0.035) 58%,
                  transparent 82%
                ),
                linear-gradient(
                  to bottom,
                  rgba(255,255,255,0.04) 0px,
                  transparent 92px,
                  transparent calc(100% - 96px),
                  rgba(0,0,0,0.22) 100%
                )
              `,
              maskImage: 'radial-gradient(circle at 18% 48%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 42%, rgba(0,0,0,0.1) 68%, transparent 86%)',
              WebkitMaskImage: 'radial-gradient(circle at 18% 48%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 42%, rgba(0,0,0,0.1) 68%, transparent 86%)',
            }}
          />

          {/* STRUCTURAL SCAN LAYER (NOT GRAIN) */}
          <div className="hidden"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  to bottom,
                  rgba(255,255,255,0.07) 0px,
                  rgba(255,255,255,0.07) 1px,
                  transparent 1px,
                  transparent 7px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(190,255,46,0.045) 0px,
                  rgba(190,255,46,0.045) 1px,
                  transparent 1px,
                  transparent 18px
                )
              `,
              opacity: 0.14,
              maskImage: 'radial-gradient(ellipse 118% 92% at 0% 50%, black 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.18) 72%, transparent 96%)',
              WebkitMaskImage: 'radial-gradient(ellipse 118% 92% at 0% 50%, black 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.18) 72%, transparent 96%)',
            }}
          />

          <div
            className="absolute -inset-y-16 -left-[280px] w-[760px] bg-black/[0.08] pointer-events-none"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maskImage: 'radial-gradient(circle at 38% 46%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.06) 78%, transparent 96%)',
              WebkitMaskImage: 'radial-gradient(circle at 38% 46%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.06) 78%, transparent 96%)',
            }}
          />

          <div
            className="relative z-10 px-6 pt-[32px] pb-7 flex flex-col h-full"
            style={{
              textShadow: railTextShadow,
              maskImage: 'radial-gradient(circle at 4% 44%, black 0%, black 58%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.18) 90%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle at 4% 44%, black 0%, black 58%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.18) 90%, transparent 100%)',
            }}
          >

            <div className="text-[10px] font-semibold tracking-[0.34em] text-[#7dffb2]/78 mb-8 pb-4 border-b border-white/[0.07]">
              HISTORY ARCHIVE
            </div>

            <div className="flex flex-col gap-0">

              {visibleHistory.map((t, i) => (
                <div
                  key={`${normalizeTrackKey(t)}-${i}`}
                  className="relative flex gap-3.5 leading-tight py-4 border-b border-white/[0.04] last:border-b-0"
                  style={{ opacity: Math.max(0.5, 1 - i * 0.06) }}
                >

                  <div className="w-5 pt-[3px] text-[10px] font-mono text-[#f5ff63]/46 tracking-wider shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  <div className="min-w-0">

                    {/* TITLE (ANCHOR) */}
                    <div className="text-[15px] font-bold text-[#fffbea]/95 leading-snug">
                      {t.title}
                    </div>

                    {/* ARTIST (SECONDARY WEIGHT) */}
                    <div className="text-[12px] text-[#7dffb2]/72 mt-1 tracking-normal leading-snug">
                      {t.artist}
                    </div>

                  </div>

                </div>
              ))}

            </div>
          </div>
        </div>

        {/* ================= CENTER ================= */}
        <div className="flex-1 flex items-end justify-start p-10">

          <div className="w-[560px] h-[255px] p-8 bg-black/40 backdrop-blur-md border border-white/10 flex flex-col justify-center">

            <div className="text-[14px] tracking-[0.4em] text-lime-300">
              LIVE SIGNAL
            </div>

            <div className="text-5xl font-bold mt-3 leading-[0.95] line-clamp-2 overflow-hidden">
              {broadcastMode === 'live' ? showTitle : title}
            </div>

            <div className="text-xl opacity-80 mt-3 text-lime-300 truncate">
              {broadcastMode === 'live' ? djName : artist}
            </div>

          </div>
        </div>

        {/* ================= NEWS (SYSTEM FEED) ================= */}
        <div
          ref={newsRailRef}
          className="w-64 relative flex flex-col overflow-visible"
        >

          <div
            className="hidden"
            style={{
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              maskImage: 'radial-gradient(circle at 80% 48%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.1) 62%, transparent 82%)',
              WebkitMaskImage: 'radial-gradient(circle at 80% 48%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.1) 62%, transparent 82%)',
            }}
          />

          <div
            className="hidden"
            style={{
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              maskImage: 'radial-gradient(circle at 76% 38%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.06) 66%, transparent 84%)',
              WebkitMaskImage: 'radial-gradient(circle at 76% 38%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.06) 66%, transparent 84%)',
            }}
          />

          <div
            className="hidden"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 82% 46%,
                  rgba(0,0,0,0.28) 0%,
                  rgba(0,0,0,0.16) 38%,
                  rgba(103,232,249,0.035) 58%,
                  transparent 82%
                ),
                linear-gradient(
                  to bottom,
                  rgba(255,255,255,0.035) 0px,
                  transparent 90px,
                  transparent calc(100% - 96px),
                  rgba(0,0,0,0.22) 100%
                )
              `,
              maskImage: 'radial-gradient(circle at 82% 48%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 42%, rgba(0,0,0,0.1) 68%, transparent 86%)',
              WebkitMaskImage: 'radial-gradient(circle at 82% 48%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 42%, rgba(0,0,0,0.1) 68%, transparent 86%)',
            }}
          />

          {/* DIFFERENT DIRECTIONAL SCAN (VARIATION) */}
          <div className="hidden"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(255,255,255,0.06) 0px,
                  rgba(255,255,255,0.06) 1px,
                  transparent 1px,
                  transparent 9px
                ),
                repeating-linear-gradient(
                  to bottom,
                  rgba(103,232,249,0.045) 0px,
                  rgba(103,232,249,0.045) 1px,
                  transparent 1px,
                  transparent 16px
                )
              `,
              opacity: 0.14,
              maskImage: 'radial-gradient(ellipse 118% 92% at 100% 50%, black 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.18) 72%, transparent 96%)',
              WebkitMaskImage: 'radial-gradient(ellipse 118% 92% at 100% 50%, black 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.18) 72%, transparent 96%)',
            }}
          />

          <div
            className="absolute -inset-y-16 -left-[280px] w-[760px] bg-black/[0.08] pointer-events-none"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maskImage: 'radial-gradient(circle at 62% 46%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.06) 78%, transparent 96%)',
              WebkitMaskImage: 'radial-gradient(circle at 62% 46%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.06) 78%, transparent 96%)',
            }}
          />

          <div
            className="relative z-10 px-5 pt-[32px] pb-7 flex flex-col h-full"
            style={{
              textShadow: railTextShadow,
              maskImage: 'radial-gradient(circle at 96% 44%, black 0%, black 58%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.18) 90%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle at 96% 44%, black 0%, black 58%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.18) 90%, transparent 100%)',
            }}
          >

            <div className="text-[10px] font-semibold tracking-[0.34em] text-cyan-100/68 mb-8 pb-4 border-b border-white/[0.07]">
              NEWS SIGNAL
            </div>

            <div className="flex flex-col gap-0">

              {visibleNews.map((n, i) => (
                <div
                  key={n.id}
                  className="leading-tight py-4 border-b border-white/[0.04] last:border-b-0"
                  style={{ opacity: Math.max(0.5, 1 - i * 0.06) }}
                >

                  <div className="text-[10px] font-medium text-cyan-100/62 uppercase tracking-[0.22em]">
                    {n.type}
                  </div>

                  <div className="text-[15px] font-bold text-[#fffbea]/95 mt-1.5 leading-snug">
                    {n.title}
                  </div>

                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      <Footer listenerCount={listenerCount} uptimeSeconds={uptimeSeconds} />
    </div>
  );
}

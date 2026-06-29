import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import LiveVisualizer from '@/components/LiveVisualizer';

export const revalidate = 0;

const roster = [
  {
    name: 'p/rpose',
    role: 'PRODUCER, DJ',
    location: 'LONDON',
  },
  {
    name: 'joshan',
    role: 'PRODUCER, ENGINEER',
    location: 'LONDON',
  },
  {
    name: 'Oran',
    role: 'PRODUCER, DJ',
    location: 'LONDON',
  },
];

type HomepageNewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: 'draft' | 'published';
  pinned: boolean | null;
  published_at: string | null;
  created_at: string | null;
};

const formatNewsDate = (value?: string | null) => {
  if (!value) return 'UNSCHEDULED';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
};

const parseStreamTitle = (streamTitle?: string | null) => {
  if (!streamTitle || streamTitle === 'OFFLINE' || streamTitle === 'STANDBY' || streamTitle === 'CONNECTING...') {
    return { artist: '', title: '' };
  }

  const parts = streamTitle.split(/ - | — /);
  return {
    artist: parts[0]?.trim() || '',
    title: parts.slice(1).join(' - ')?.trim() || parts[0]?.trim() || '',
  };
};

export default async function Home() {
  const supabase = await createClient();

  // Preserve existing homepage data fetching.
  const [newsRes, settingsRes, tracksRes] = await Promise.all([
    supabase
      .from('news_posts')
      .select('id, title, slug, excerpt, content, status, pinned, published_at, created_at')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('system_settings')
      .select('is_live, stream_title, site_title, playback_history, homepage_instagram_image_url, homepage_instagram_image_alt')
      .eq('id', 1)
      .single(),
    supabase
      .from('tracks')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(10),
  ]);

  const news = (newsRes.data as HomepageNewsPost[]) || [];
  const settings = settingsRes.data || {
    is_live: false,
    stream_title: 'OFFLINE',
    site_title: 'Immortal Raindrops',
    playback_history: [],
    homepage_instagram_image_url: null,
    homepage_instagram_image_alt: null,
  };
  const recentTracks = tracksRes.data || [];
  const playbackHistory = Array.isArray(settings.playback_history) ? settings.playback_history : [];
  const nowPlaying = parseStreamTitle(settings.stream_title);
  const isOffline = !nowPlaying.artist && !nowPlaying.title;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: settings.site_title || 'Immortal Raindrops',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://immortalraindrops.art',
    track: recentTracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: track.artist,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style>
        {`
          .home-unstable-panel::before,
          .home-unstable-panel::after {
            content: '';
            position: absolute;
            pointer-events: none;
            inset: 0;
            opacity: 0.55;
            transition: opacity 700ms ease, transform 700ms ease;
          }

          .home-unstable-panel::before {
            transform: translate(1px, -1px);
            background:
              linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.06)) 0 18px / 34px 1px no-repeat,
              linear-gradient(to right, rgba(255,255,255,0.045), rgba(255,255,255,0.045)) calc(100% - 58px) calc(100% - 22px) / 58px 1px no-repeat,
              linear-gradient(to bottom, rgba(125,255,178,0.055), rgba(125,255,178,0.055)) 18px 0 / 1px 46px no-repeat,
              linear-gradient(to bottom, rgba(255,255,255,0.045), rgba(255,255,255,0.045)) calc(100% - 17px) 38px / 1px 62px no-repeat;
          }

          .home-unstable-panel::after {
            transform: translate(-1px, 1px);
            background:
              linear-gradient(to right, rgba(125,255,178,0.045), rgba(125,255,178,0.045)) 12px calc(100% - 18px) / 72px 1px no-repeat,
              linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.04)) calc(100% - 44px) calc(100% - 70px) / 1px 52px no-repeat,
              linear-gradient(to right, rgba(255,255,255,0.035), rgba(255,255,255,0.035)) 44px 42% / 46px 1px no-repeat;
          }

          .home-unstable-panel:hover::before,
          .home-unstable-panel:hover::after {
            opacity: 0.34;
            transform: translate(0, 0);
          }

          .home-glass-region,
          .home-local-grain,
          .home-interrupted-scanlines {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          .home-glass-region {
            opacity: 0.16;
            transition: opacity 700ms ease;
          }

          .home-glass-region-a {
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            clip-path: inset(0 42% 64% 0);
          }

          .home-glass-region-b {
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            clip-path: inset(58% 0 0 28%);
          }

          .home-glass-region-c {
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            clip-path: inset(0 0 70% 36%);
          }

          .home-glass-region-d {
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            clip-path: inset(46% 54% 0 0);
          }

          .home-unstable-panel:hover .home-glass-region {
            opacity: 0.08;
          }

          .home-local-grain {
            opacity: 0.045;
            mix-blend-mode: overlay;
            background-image:
              radial-gradient(circle at 20% 18%, rgba(255,255,255,0.32) 0 1px, transparent 1px),
              radial-gradient(circle at 72% 64%, rgba(0,0,0,0.4) 0 1px, transparent 1px);
            background-size: 13px 13px, 17px 17px;
          }

          .home-interrupted-scanlines {
            opacity: 0.11;
            background:
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 7px,
                rgba(255,255,255,0.16) 7px,
                rgba(255,255,255,0.16) 8px,
                transparent 8px,
                transparent 12px
              ),
              linear-gradient(to right, transparent 0 16%, rgba(0,0,0,0.8) 16% 22%, transparent 22% 57%, rgba(0,0,0,0.74) 57% 64%, transparent 64% 100%);
            mask-image:
              linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%),
              repeating-linear-gradient(to bottom, black 0 13px, transparent 13px 17px);
            -webkit-mask-image:
              linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%),
              repeating-linear-gradient(to bottom, black 0 13px, transparent 13px 17px);
            mask-composite: intersect;
            -webkit-mask-composite: source-in;
          }

          .home-interrupted-scanlines-right {
            opacity: 0.095;
            background-position: 0 2px, 0 0;
          }

          .home-drift-slow {
            animation: home-panel-drift-a 18s ease-in-out infinite;
          }

          .home-drift-reverse {
            animation: home-panel-drift-b 21s ease-in-out infinite;
          }

          .home-unstable-panel:hover .home-drift-slow,
          .home-unstable-panel:hover .home-drift-reverse {
            animation-play-state: paused;
          }

          @keyframes home-panel-drift-a {
            0%, 100% { transform: translate(0, 0); }
            45% { transform: translate(0.8px, -0.6px); }
            72% { transform: translate(-0.4px, 0.7px); }
          }

          @keyframes home-panel-drift-b {
            0%, 100% { transform: translate(0, 0); }
            38% { transform: translate(-0.7px, 0.5px); }
            76% { transform: translate(0.5px, -0.8px); }
          }
        `}
      </style>

      <main className="relative min-h-dvh w-full overflow-y-auto overflow-x-hidden bg-black text-[#ECEEDF] font-mono lg:overflow-hidden">
        <div className="fixed inset-0 z-0 opacity-85 scale-110 pointer-events-none">
          <LiveVisualizer />
        </div>

        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 44%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0.62) 80%, black 100%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 44%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0.62) 80%, black 100%)',
          }}
        />

        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 46%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.78) 100%),
              repeating-linear-gradient(
                to bottom,
                rgba(255,255,255,0.045) 0px,
                rgba(255,255,255,0.045) 1px,
                transparent 1px,
                transparent 4px
              )
            `,
          }}
        />

        <div className="relative z-10 flex min-h-dvh flex-col gap-4 overflow-visible px-3 pb-10 pt-[calc(5.75rem+env(safe-area-inset-top))] md:px-6 md:pb-12 md:pt-[calc(6.25rem+env(safe-area-inset-top))] lg:-mt-16 lg:grid lg:h-dvh lg:grid-cols-[260px_minmax(0,880px)_240px] lg:items-center lg:justify-center lg:gap-6 lg:overflow-hidden lg:px-10 lg:pb-14 lg:pt-[7rem]">
          <aside className="order-3 lg:order-none home-unstable-panel group/home-panel relative shrink-0 overflow-hidden border border-white/[0.055] bg-black/22 p-5 backdrop-blur-md transition-colors duration-500 hover:bg-black/28 lg:h-[calc(100dvh-13rem)]">
            <div className="home-glass-region home-glass-region-a" />
            <div className="home-glass-region home-glass-region-b" />
            <div className="home-local-grain" />
            <div className="home-interrupted-scanlines" />
            <svg className="home-drift-slow absolute -inset-x-3 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+24px)] pointer-events-none transition-transform duration-700 group-hover/home-panel:translate-x-0 group-hover/home-panel:translate-y-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 8 0 H 100 M 0 10 V 100 M 0 100 H 76 M 76 100 V 88 H 100" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M 0 22 H 14 V 0 M 86 0 V 12 H 100 M 64 100 H 100" fill="none" stroke="rgba(125,255,178,0.16)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg className="home-drift-reverse absolute -inset-x-2 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+16px)] pointer-events-none opacity-70 transition-transform duration-700 group-hover/home-panel:translate-x-0 group-hover/home-panel:translate-y-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 4 2 H 46 M 58 2 H 98 M 2 18 V 54 M 2 66 V 98 M 14 98 H 52 M 70 98 H 96" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M 1 30 H 11 M 89 14 H 99 M 78 87 H 99" fill="none" stroke="rgba(125,255,178,0.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.1]"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    rgba(255,255,255,0.08) 0px,
                    rgba(255,255,255,0.08) 1px,
                    transparent 1px,
                    transparent 5px
                  )
                `,
              }}
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-7 border-b border-white/[0.07] pb-4">
                <div className="text-[13px] font-bold uppercase tracking-[0.3em] text-[#7dffb2]/88">
                  NOW PLAYING
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]">

                  <span className={settings.is_live ? 'text-red-400' : 'text-[#ECEEDF]/45'}>
                    {settings.is_live ? 'CURATED PLAYLIST' : 'AUTOMATED / STANDBY'}
                  </span>
                </div>
              </div>

              {!isOffline ? (
                <div className="mb-8">
                  <div className="text-[17px] font-bold leading-tight text-[#fffbea]/95">
                    {nowPlaying.title}
                  </div>
                  <div className="mt-2 text-[13px] leading-tight text-lime-300/75">
                    {nowPlaying.artist}
                  </div>
                </div>
              ) : (
                <div className="mb-8 text-[11px] uppercase tracking-[0.24em] text-[#ECEEDF]/30">
                  NO SIGNAL
                </div>
              )}

              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ECEEDF]/40">
                RECENTLY ADDED
              </div>
              <div className="flex min-h-0 flex-col overflow-hidden">
                {recentTracks.slice(0, 5).map((track, index) => (
                  <Link
                    key={track.id}
                    href="/archive"
                    className="border-b border-white/[0.05] py-3 last:border-b-0"
                    style={{ opacity: Math.max(0.5, 1 - index * 0.08) }}
                  >
                    <div className="text-[10px] text-lime-300/45">{String(index + 1).padStart(2, '0')}</div>
                    <div className="mt-1 truncate text-[13px] font-bold text-[#fffbea]/90">{track.title}</div>
                    <div className="mt-1 truncate text-[11px] text-lime-300/62">{track.artist}</div>
                  </Link>
                ))}
              </div>

              {playbackHistory.length > 0 && (
                <>
                  <div className="mb-4 mt-8 border-t border-white/[0.07] pt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ECEEDF]/40">
                    LAST PLAYED
                  </div>
                  <div className="flex flex-col">
                    {playbackHistory.slice(0, 4).map((track, index) => (
                      <div
                        key={`${track.artist}-${track.title}-${index}`}
                        className="border-b border-white/[0.05] py-3 last:border-b-0"
                        style={{ opacity: Math.max(0.5, 0.92 - index * 0.08) }}
                      >
                        <div className="text-[10px] text-lime-300/45">{String(index + 1).padStart(2, '0')}</div>
                        <div className="mt-1 truncate text-[12px] font-bold text-[#fffbea]/86">{track.title}</div>
                        <div className="mt-1 truncate text-[11px] text-lime-300/58">{track.artist}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>

          <section className="order-1 lg:order-none relative min-h-[520px] flex-1 overflow-hidden border border-white/[0.07] bg-black/36 backdrop-blur-md lg:h-[calc(100dvh-13rem)] lg:min-h-0">
            <svg className="absolute -inset-x-2 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+16px)] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 4 0 H 42 M 56 0 H 100 M 100 0 V 28 M 100 72 V 100 M 100 100 H 78 M 22 100 H 0 M 0 100 V 64 M 0 36 V 0" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M 3 7 H 18 M 82 93 H 97" fill="none" stroke="rgba(125,255,178,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.11]"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    rgba(255,255,255,0.08) 0px,
                    rgba(255,255,255,0.08) 1px,
                    transparent 1px,
                    transparent 5px
                  )
                `,
              }}
            />

            <div className="relative z-10 flex min-h-[520px] flex-col px-5 py-6 md:px-8 md:py-8 lg:h-full lg:min-h-0">
              <div className="shrink-0 border-b border-white/[0.08] pb-7">
                <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.38em] text-lime-300">
                  IMMORTAL RAINDROPS
                </div>
                <h1 className="max-w-3xl text-4xl font-bold uppercase leading-[0.95] text-[#fffbea] md:text-6xl lg:text-6xl">
                  Worldwide radio and creative collective based in London.
                </h1>
                <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-[#ECEEDF]/65 md:text-base">
                  Pls fw us its 3:29 am in the heatwave and im writing this bs
                </p>
              </div>

              <div className="mt-6 grid min-h-0 flex-1 gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
                <section className="flex min-h-[320px] flex-col overflow-hidden border border-white/[0.08] bg-black/18 lg:min-h-0">
                  <div className="shrink-0 border-b border-white/[0.08] px-4 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-lime-300/85">
                      LATEST NEWS
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4">
                    {newsRes.error ? (
                      <div className="py-8 text-[11px] uppercase tracking-[0.22em] text-red-300/70">
                        NEWS SIGNAL UNAVAILABLE.
                      </div>
                    ) : news.length === 0 ? (
                      <div className="py-8 text-[11px] uppercase tracking-[0.22em] text-[#ECEEDF]/36">
                        NO PUBLISHED NEWS POSTS.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {news.map((post, index) => (
                          <article key={post.id} className="border-b border-white/[0.08] py-5 last:border-b-0">
                            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-[#ECEEDF]/35">
                              <span className="text-lime-300/55">{String(index + 1).padStart(2, '0')}</span>
                              {post.pinned && <span className="text-lime-300/75">PINNED</span>}
                              <span>{formatNewsDate(post.published_at || post.created_at)}</span>
                            </div>
                            <h2 className="mt-3 text-xl font-bold leading-tight text-[#fffbea]/92">
                              <Link href={`/news/${post.slug}`} className="hover:text-lime-200">
                                {post.title}
                              </Link>
                            </h2>
                            {post.excerpt && (
                              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#ECEEDF]/58">
                                {post.excerpt}
                              </p>
                            )}
                            <Link
                              href={`/news/${post.slug}`}
                              className="mt-4 inline-block border border-white/[0.12] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300/72 hover:border-lime-300/40 hover:text-lime-200"
                            >
                              READ SIGNAL
                            </Link>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <aside className="flex min-h-[280px] flex-col border border-white/[0.08] bg-black/20 md:min-h-0">
                  <div className="border-b border-white/[0.08] px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-[#ECEEDF]/38">
                    @theimmortalraindrops
                  </div>
                  {settings.homepage_instagram_image_url ? (
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-black/40">
                      <img
                        src={settings.homepage_instagram_image_url}
                        alt={settings.homepage_instagram_image_alt || 'Immortal Raindrops homepage image'}
                        className="h-full min-h-[240px] w-full object-cover grayscale contrast-110 md:min-h-0"
                      />
                      <div className="absolute inset-0 pointer-events-none bg-black/10" />
                    </div>
                  ) : (
                    <div className="flex min-h-[240px] flex-1 items-center justify-center px-5 text-center text-[10px] uppercase tracking-[0.22em] text-[#ECEEDF]/35">
                      NO HOMEPAGE IMAGE SELECTED.
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </section>

          <aside className="order-2 lg:order-none home-unstable-panel group/home-panel relative shrink-0 overflow-hidden border border-white/[0.055] bg-black/22 p-5 backdrop-blur-md transition-colors duration-500 hover:bg-black/28 lg:h-[calc(100dvh-13rem)]">
            <div className="home-glass-region home-glass-region-c" />
            <div className="home-glass-region home-glass-region-d" />
            <div className="home-local-grain" />
            <div className="home-interrupted-scanlines home-interrupted-scanlines-right" />
            <svg className="home-drift-reverse absolute -inset-x-4 -inset-y-3 h-[calc(100%+24px)] w-[calc(100%+32px)] pointer-events-none transition-transform duration-700 group-hover/home-panel:translate-x-0 group-hover/home-panel:translate-y-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0 0 H 68 M 82 0 H 100 M 100 0 V 100 M 100 100 H 24 M 24 100 V 86 H 0 M 0 74 V 0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M 0 12 H 18 M 18 12 V 0 M 100 20 H 88 V 38 M 52 100 H 70 V 92 H 100" fill="none" stroke="rgba(125,255,178,0.15)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg className="home-drift-slow absolute -inset-x-2 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+16px)] pointer-events-none opacity-70 transition-transform duration-700 group-hover/home-panel:translate-x-0 group-hover/home-panel:translate-y-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0 3 H 28 M 42 3 H 100 M 97 0 V 36 M 97 50 V 100 M 0 96 H 36 M 48 96 H 88" fill="none" stroke="rgba(255,255,255,0.052)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M 0 80 H 16 V 92 M 86 0 V 10 H 100 M 72 99 H 100" fill="none" stroke="rgba(125,255,178,0.085)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.1]"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    rgba(255,255,255,0.08) 0px,
                    rgba(255,255,255,0.08) 1px,
                    transparent 1px,
                    transparent 5px
                  )
                `,
              }}
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-7 border-b border-white/[0.07] pb-4 text-[13px] font-bold uppercase tracking-[0.3em] text-[#7dffb2]/78">
                ROSTER
              </div>

              <div className="flex flex-col">
                {roster.map((member, index) => (
                  <div
                    key={member.name}
                    className="border-b border-white/[0.06] py-4 last:border-b-0"
                    style={{ opacity: Math.max(0.58, 1 - index * 0.08) }}
                  >
                    <div className="text-[10px] text-lime-300/45">{String(index + 1).padStart(2, '0')}</div>
                    <div className="mt-2 text-[15px] font-bold leading-tight text-[#fffbea]/92">{member.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#ECEEDF]/48">{member.role}</div>
                    <div className="mt-2 text-[11px] text-lime-300/68">{member.location}</div>
                  </div>
                ))}
              </div>

              <Link href="/submit" className="mt-auto block border-t border-white/[0.07] pt-5 text-[10px] uppercase tracking-[0.24em] text-[#ECEEDF]/42 hover:text-lime-300">
                SUBMISSIONS OPEN
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

import type { Meta, StoryObj } from '@storybook/react';
import { HomeNowPlayingPanel } from './HomeSidePanels';
import ArchiveGrid from './ArchiveGrid';
import { NewsEntry, type NewsPostItem } from './NewsEntry';
import { Track } from '../types';

interface HomePagePreviewProps {
  isLive: boolean;
  streamTitle: string;
  siteTitle: string;
  playbackHistory: { artist: string; title: string }[];
  recentTracks: Track[];
  news: NewsPostItem[];
}

function HomePagePreview({ isLive, streamTitle, siteTitle, playbackHistory, recentTracks, news }: HomePagePreviewProps) {
  return (
    <main className="w-full h-[calc(100vh-4rem)] flex flex-row bg-[#0A0A08] text-[#ECEEDF] overflow-hidden font-mono">
      {/* Mobile Ident Only */}
      <div className="flex md:hidden w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center gap-6 px-4 max-w-md select-none">
          <div className="shrink-0 flex items-center justify-center mb-2">
            <img
              src="/logo.png"
              alt="Immortal Raindrops"
              width={711}
              height={1024}
              className="h-28 w-auto opacity-90 transition-opacity"
              style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
            />
          </div>

          <h1 className="text-xl font-bold tracking-[0.3em] uppercase text-white">
            {siteTitle || 'IMMORTAL RAINDROPS'}
          </h1>

          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#EF4444] animate-pulse' : 'bg-[#ECEEDF]/25'}`} />
            <span className="text-[10px] tracking-[0.25em] font-bold text-[#ECEEDF]/60 uppercase">
              {isLive ? 'TRANSMITTING' : 'OFFLINE'}
            </span>
          </div>

          <a
            href="/live"
            className="mt-8 border border-[#ECEEDF]/30 hover:border-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black font-mono text-[11px] font-bold tracking-[0.3em] px-8 py-3 transition-colors uppercase"
          >
            [ ENTER_STATION ]
          </a>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row w-full h-full items-stretch">
        {/* Left column — Playback History (static) */}
        <div className="w-64 shrink-0 bg-[#ECEEDF]/[0.02] flex flex-col overflow-hidden">
          <HomeNowPlayingPanel isLive={isLive} streamTitle={streamTitle} playbackHistory={playbackHistory} />
        </div>

        {/* Center column — News feed (scrollable) */}
        <div className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-hidden">
          {/* Below masthead: news feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {news.length > 0 ? (
              news.map((post) => (
                <NewsEntry key={post.id} item={post} />
              ))
            ) : (
              <div className="font-mono text-[#ECEEDF] text-[12px] uppercase tracking-[0.3em] opacity-50 text-center py-12 mt-10">
                NO UPDATES ATM LOL
              </div>
            )}
          </div>
        </div>

        {/* Right column — Archive Preview (static) */}
        <a href="/archive" className="w-72 shrink-0 bg-[#ECEEDF]/[0.02] flex flex-col overflow-hidden group">
          <div className="text-[8px] tracking-[0.3em] text-[#ECEEDF]/25 uppercase px-4 py-4 shrink-0">
            ARCHIVE
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {recentTracks.map((track, index) => (
              <div key={track.id} className="flex flex-col px-4 py-3 border-b border-[#ECEEDF]/5 group-hover:bg-[#ECEEDF]/[0.02] hover:bg-[#ECEEDF]/[0.04] transition-colors">
                <span className="text-[9px] text-[#ECEEDF]/20 mb-0.5">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold uppercase text-[#ECEEDF]/80 truncate">{track.artist}</span>
                <span className="text-[9px] font-light text-[#ECEEDF]/40 truncate">{track.title}</span>
              </div>
            ))}
          </div>
        </a>
      </div>
    </main>
  );
}

const meta = {
  title: 'Pages/HomePage',
  component: HomePagePreview,
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    )
  ],
} satisfies Meta<typeof HomePagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNews: NewsPostItem[] = [
  {
    id: '1',
    title: 'NEW BROADCAST SYSTEM ONLINE',
    slug: 'new-broadcast-system',
    excerpt: 'The automated transmission grid has been updated to v2.0. Expect uninterrupted rain loops and a deeper dive into the archive.',
    body: '',
    type: 'news',
    cover_image: null,
    featured: true,
    published_at: '2024-05-12T10:00:00Z',
  },
  {
    id: '2',
    title: 'A CONVERSATION WITH BURIAL',
    slug: 'conversation-with-burial',
    excerpt: 'Revisiting the seminal tracks that shaped the Immortal Raindrops soundscape. An editorial dive into the echoes of South London.',
    body: '',
    type: 'editorial',
    cover_image: null,
    featured: false,
    published_at: '2024-04-28T14:30:00Z',
  },
  {
    id: '3',
    title: 'GUEST MIX: FOUR TET',
    slug: 'guest-mix-four-tet',
    excerpt: 'An exclusive 2-hour journey curated by Four Tet. Rhythmic textures and ambient interludes for the late night transmission.',
    body: '',
    type: 'event',
    cover_image: null,
    featured: false,
    published_at: '2024-04-15T20:00:00Z',
  },
  {
    id: '4',
    title: 'ARCHIVE EXPANSION: AMBIENT WORKS',
    slug: 'archive-expansion-ambient',
    excerpt: 'Over 500 new tracks have been added to the public archive, focusing heavily on early 90s IDM and experimental ambient textures.',
    body: '',
    type: 'release',
    cover_image: null,
    featured: false,
    published_at: '2024-03-30T09:15:00Z',
  },
  {
    id: '5',
    title: 'TRANSMISSION INTERRUPTIONS EXPLAINED',
    slug: 'transmission-interruptions',
    excerpt: 'Details regarding the recent signal degradation and our steps to reinforce the broadcast infrastructure.',
    body: '',
    type: 'news',
    cover_image: null,
    featured: false,
    published_at: '2024-03-10T11:45:00Z',
  }
];

// Offline state
export const Offline: Story = {
  args: {
    isLive: false,
    streamTitle: 'OFFLINE',
    siteTitle: 'IMMORTAL RAINDROPS',
    playbackHistory: [],
    recentTracks: [],
    news: mockNews,
  }
}

// Live transmitting state
export const Live: Story = {
  args: {
    isLive: true,
    streamTitle: 'Burial - Archangel',
    siteTitle: 'IMMORTAL RAINDROPS',
    playbackHistory: [
      { artist: 'Burial', title: 'Archangel' },
      { artist: 'Four Tet', title: 'She Just Likes to Fight' },
      { artist: 'Floating Points', title: 'LesAlpx' },
      { artist: 'Objekt', title: 'Needle & Thread' },
      { artist: 'Actress', title: 'Hubble' },
    ],
    recentTracks: [
      { id: '1', title: 'Archangel', artist: 'Burial', tile_id: 'tile-1', audio_ext: 'mp3' }
    ] as any,
    news: mockNews,
  }
}

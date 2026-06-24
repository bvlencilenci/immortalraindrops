import type { Meta, StoryObj } from '@storybook/react';
import LiveBroadcast from './LiveBroadcast';
import { useAudioStore } from '../store/useAudioStore';
import React, { useEffect } from 'react';

// Decorator to seed useAudioStore state
const withAudioState = (state: any) => {
  return (Story: any) => {
    useEffect(() => {
      const originalState = { ...useAudioStore.getState() };
      useAudioStore.setState(state);
      return () => {
        useAudioStore.setState(originalState);
      };
    }, []);
    
    return <Story />;
  };
};

const meta = {
  title: 'Layout/LiveBroadcast',
  component: LiveBroadcast,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof LiveBroadcast>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNews = [
  {
    id: 'news-1',
    title: 'DISPATCH_FROM_THE_CELL_09',
    slug: 'dispatch-from-the-cell-09',
    excerpt: 'Broadcast towers are now transmitting at full resonance capacity. Expect analog oscillations.',
    body: '...',
    type: 'news' as const,
    cover_image: null,
    featured: false,
    published_at: '2026-06-23T10:00:00Z',
  },
  {
    id: 'news-2',
    title: 'NEW_RELEASE_RAIN_03_OUT_NOW',
    slug: 'new-release-rain-03-out-now',
    excerpt: 'Deep frequency hums and magnetic loop loops from our London base.',
    body: '...',
    type: 'release' as const,
    cover_image: null,
    featured: true,
    published_at: '2026-06-22T14:00:00Z',
  },
  {
    id: 'news-3',
    title: 'EDITORIAL_WAVE_OSCILLATION_SYSTEMS',
    slug: 'editorial-wave-oscillation-systems',
    excerpt: 'Exploring early computer music and microtonal sequencing archives.',
    body: '...',
    type: 'editorial' as const,
    cover_image: null,
    featured: false,
    published_at: '2026-06-21T09:30:00Z',
  },
];

const mockHistory10 = [
  { artist: 'Autechre', title: 'Crystalline Waves' },
  { artist: 'Aphex Twin', title: 'Selected Ambient Works Vol II' },
  { artist: 'Biosphere', title: 'Poika' },
  { artist: 'Gas', title: 'Pop 4' },
  { artist: 'Global Communication', title: '14:31' },
  { artist: 'Boards of Canada', title: 'Roygbiv' },
  { artist: 'Oneohtrix Point Never', title: 'Replica' },
  { artist: 'Tim Hecker', title: 'Ravedeath, 1972' },
  { artist: 'William Basinski', title: 'The Disintegration Loops' },
  { artist: 'Squarepusher', title: 'Beep Street' },
];

export const LiveBroadcast_Default: Story = {
  args: {
    initialIsLive: true,
    initialTitle: 'Burial - Archangel',
    initialBroadcastMode: 'automated',
    initialDjName: '',
    initialShowTitle: '',
    initialDjLocation: '',
    initialDjDescription: '',
    initialPlaybackHistory: [
      { artist: 'Burial', title: 'Archangel' },
      { artist: 'Four Tet', title: 'She Just Likes to Fight' },
      { artist: 'Floating Points', title: 'LesAlpx' },
      { artist: 'Objekt', title: 'Needle & Thread' },
      { artist: 'Actress', title: 'Hubble' },
      { artist: 'Andy Stott', title: 'Numb' },
    ],
    newsPosts: mockNews,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: 'radio-stream',
      isPlaying: true,
      isLive: true,
      streamTitle: 'Burial - Archangel',
    }),
  ],
};

export const LiveBroadcast_LiveDJ: Story = {
  args: {
    initialIsLive: true,
    initialTitle: 'DJ VOIDWALKER - DEEP DRIFT HOUR',
    initialBroadcastMode: 'live',
    initialDjName: 'DJ VOIDWALKER',
    initialShowTitle: 'DEEP DRIFT HOUR',
    initialDjLocation: 'LONDON, UK',
    initialDjDescription: 'SECTOR-9 EXPERIMENTAL TRANSMISSIONS.',
    initialPlaybackHistory: mockHistory10,
    newsPosts: mockNews,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: 'radio-stream',
      isPlaying: true,
      isLive: true,
      streamTitle: 'DJ VOIDWALKER - DEEP DRIFT HOUR',
    }),
  ],
};

export const LiveBroadcast_Automated: Story = {
  args: {
    initialIsLive: false,
    initialTitle: 'APHEX TWIN - DRUKQS',
    initialBroadcastMode: 'automated',
    initialDjName: '',
    initialShowTitle: '',
    initialDjLocation: '',
    initialDjDescription: '',
    initialPlaybackHistory: mockHistory10,
    newsPosts: mockNews,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: 'radio-stream',
      isPlaying: true,
      isLive: false,
      streamTitle: 'APHEX TWIN - DRUKQS',
    }),
  ],
};

export const LiveBroadcast_NoNews: Story = {
  args: {
    initialIsLive: false,
    initialTitle: 'APHEX TWIN - DRUKQS',
    initialBroadcastMode: 'automated',
    initialDjName: '',
    initialShowTitle: '',
    initialDjLocation: '',
    initialDjDescription: '',
    initialPlaybackHistory: mockHistory10,
    newsPosts: [],
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: 'radio-stream',
      isPlaying: true,
      isLive: false,
      streamTitle: 'APHEX TWIN - DRUKQS',
    }),
  ],
};

export const LiveBroadcast_Mobile: Story = {
  ...LiveBroadcast_LiveDJ,
  parameters: {
    viewport: {
      defaultViewport: 'mobile375',
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import ArchiveGrid from './ArchiveGrid';
import { useAudioStore } from '../store/useAudioStore';
import React, { useEffect } from 'react';
import { Track } from '../types';

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
  title: 'Layout/ArchiveGrid',
  component: ArchiveGrid,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ArchiveGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'vordhosbn',
    artist: 'aphex twin',
    genre: 'idm',
    media_type: 'song',
    tile_index: 0,
    tile_id: 'vordhosbn',
    audio_ext: 'mp3',
    image_ext: 'jpg',
    release_date: '2001-10-22',
    duration: '04:42',
    created_at: '2026-06-23T00:00:00.000Z',
  },
  {
    id: 'track-2',
    title: 'archangel',
    artist: 'burial',
    genre: 'dubstep',
    media_type: 'song',
    tile_index: 1,
    tile_id: 'archangel',
    audio_ext: 'mp3',
    image_ext: 'png',
    release_date: '2007-11-05',
    duration: '03:58',
    created_at: '2026-06-23T00:00:00.000Z',
  },
  {
    id: 'track-3',
    title: 'gonk steady one',
    artist: 'autechre',
    genre: 'experimental',
    media_type: 'song',
    tile_index: 2,
    tile_id: 'gonk-steady-one',
    audio_ext: 'wav',
    image_ext: 'jpg',
    release_date: '2018-04-05',
    duration: '07:11',
    created_at: '2026-06-23T00:00:00.000Z',
  },
  {
    id: 'track-4',
    title: 'chrome country',
    artist: 'oneohtrix point never',
    genre: 'ambient',
    media_type: 'song',
    tile_index: 3,
    tile_id: 'chrome-country',
    audio_ext: 'mp3',
    image_ext: 'jpg',
    release_date: '2013-10-01',
    duration: '05:05',
    created_at: '2026-06-23T00:00:00.000Z',
  }
];

export const Default: Story = {
  args: {
    tracks: mockTracks,
    isAdmin: false,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: null,
      isPlaying: false,
    }),
  ],
};

export const PlayingTrack: Story = {
  args: {
    tracks: mockTracks,
    isAdmin: false,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: 'track-2',
      isPlaying: true,
    }),
  ],
};

export const AdminView: Story = {
  args: {
    tracks: mockTracks,
    isAdmin: true,
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: null,
      isPlaying: false,
    }),
  ],
};

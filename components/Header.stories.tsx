import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';
import { useAudioStore } from '../store/useAudioStore';
import React, { useEffect } from 'react';

// Decorator to seed useAudioStore state
const withAudioState = (state: any) => {
  return (Story: any) => {
    useEffect(() => {
      // Save current state to restore later
      const originalState = { ...useAudioStore.getState() };
      
      // Update with mock state
      useAudioStore.setState(state);
      
      return () => {
        useAudioStore.setState(originalState);
      };
    }, []);
    
    return (
      <div className="w-full bg-[#000000] min-h-[150px]">
        <Story />
      </div>
    );
  };
};

const meta = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    withAudioState({
      currentlyPlayingId: null,
      trackTitle: null,
      trackArtist: null,
      streamTitle: null,
      isPlaying: false,
      isLive: false,
      hasEntered: true,
    }),
  ],
};

export const RadioPlaying: Story = {
  decorators: [
    withAudioState({
      currentlyPlayingId: 'radio-stream',
      trackTitle: null,
      trackArtist: null,
      streamTitle: 'Aphex Twin - Drukqs Live Session',
      isPlaying: true,
      isLive: true,
      hasEntered: true,
    }),
  ],
};

export const ArchivePlaying: Story = {
  decorators: [
    withAudioState({
      currentlyPlayingId: 'track-456',
      trackTitle: 'Selected Ambient Works 85-92',
      trackArtist: 'Aphex Twin',
      isPlaying: true,
      isLive: false,
      seek: 184,
      duration: 432,
      volume: 0.8,
      hasEntered: true,
    }),
  ],
};

export const SubmissionMode: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/submit',
      },
    },
  },
  decorators: [
    withAudioState({
      currentlyPlayingId: null,
      trackTitle: null,
      trackArtist: null,
      streamTitle: null,
      isPlaying: false,
      isLive: false,
      hasEntered: true,
    }),
  ],
};

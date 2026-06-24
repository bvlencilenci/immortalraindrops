import type { Meta, StoryObj } from '@storybook/react';
import { PlaybackControls } from './PlaybackControls';

const meta = {
  title: 'Radio/PlaybackControls',
  component: PlaybackControls,
  tags: ['autodocs'],
  argTypes: {
    isPlaying: { control: 'boolean' },
    isRadioStream: { control: 'boolean' },
    onPlayPause: { action: 'playPauseClicked' },
    onSkipBack: { action: 'skipBackClicked' },
    onSkipForward: { action: 'skipForwardClicked' },
  },
} satisfies Meta<typeof PlaybackControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  args: {
    isPlaying: true,
    isRadioStream: false,
  },
};

export const Paused: Story = {
  args: {
    isPlaying: false,
    isRadioStream: false,
  },
};

export const RadioStreamMode: Story = {
  args: {
    isPlaying: true,
    isRadioStream: true,
  },
};

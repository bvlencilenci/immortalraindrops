import type { Meta, StoryObj } from '@storybook/react';
import { TrackHistoryItem } from './TrackHistoryItem';

const meta = {
  title: 'Radio/TrackHistoryItem',
  component: TrackHistoryItem,
  tags: ['autodocs'],
  argTypes: {
    audioUrl: { control: 'text' },
  },
} satisfies Meta<typeof TrackHistoryItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    track: {
      artist: 'Autechre',
      title: 'Crystalline Waves',
    },
    audioUrl: 'https://www.w3schools.com/html/horse.mp3', // Mock endpoint to force cover loading or fallback
  },
};

export const NoCover: Story = {
  args: {
    track: {
      artist: 'Aphex Twin',
      title: 'Selected Ambient Works Volume II',
    },
  },
};

export const LongText: Story = {
  args: {
    track: {
      artist: 'Some Extremely Long Artist Name That Might Break The Layout If Not Handled Properly By Text Truncation',
      title: 'An Equally Long Track Title That Goes On And On And On And On And On And On And On And On And On And On',
    },
  },
};

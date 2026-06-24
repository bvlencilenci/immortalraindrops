import type { Meta, StoryObj } from '@storybook/react';
import { VolumeController } from './VolumeController';

const meta = {
  title: 'Radio/VolumeController',
  component: VolumeController,
  tags: ['autodocs'],
  argTypes: {
    volume: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
    },
    seek: { control: 'number' },
    duration: { control: 'number' },
    isRadioStream: { control: 'boolean' },
    onVolumeChange: { action: 'volumeChanged' },
  },
} satisfies Meta<typeof VolumeController>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    volume: 0.75,
    seek: 125,
    duration: 360,
    isRadioStream: false,
  },
};

export const Muted: Story = {
  args: {
    volume: 0,
    seek: 125,
    duration: 360,
    isRadioStream: false,
  },
};

export const RadioStreamMode: Story = {
  args: {
    volume: 0.5,
    seek: 0,
    duration: 0,
    isRadioStream: true,
  },
};

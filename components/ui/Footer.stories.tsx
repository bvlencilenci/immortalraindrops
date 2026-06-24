import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';

const meta = {
  title: 'Layout/Footer',
  component: Footer,
  tags: ['autodocs'],
  argTypes: {
    listenerCount: { control: 'number' },
    uptimeSeconds: { control: 'number' },
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    listenerCount: 42,
    uptimeSeconds: 7200 + 180 + 45, // 2h 3m 45s
  },
};

export const LargeListeners: Story = {
  args: {
    listenerCount: 1337,
    uptimeSeconds: 86400 * 3 + 3600 * 4 + 120, // 3d 4h 2m
  },
};

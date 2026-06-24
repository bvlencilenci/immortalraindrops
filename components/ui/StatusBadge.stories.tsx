import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Radio/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    isLive: { control: 'boolean' },
    broadcastMode: {
      control: 'select',
      options: ['automated', 'live'],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveDJ: Story = {
  args: {
    isLive: true,
    broadcastMode: 'live',
  },
};

export const Automated: Story = {
  args: {
    isLive: false,
    broadcastMode: 'automated',
  },
};

export const Offline: Story = {
  args: {
    isLive: false,
    broadcastMode: 'live', // shows live dj set but live indicator offline
  },
};

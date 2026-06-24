import type { Meta, StoryObj } from '@storybook/react';
import { NewsCard } from './NewsCard';

const meta = {
  title: 'Content/NewsCard',
  component: NewsCard,
  tags: ['autodocs'],
} satisfies Meta<typeof NewsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseItem = {
  id: 'dispatch-01',
  title: 'RAIN_NETWORK_TRANSMISSIONS_ONLINE',
  slug: 'rain-network-transmissions-online',
  excerpt: 'The digital audio gateway is now open. Broadcasting electronic experiments, drone waves, ambient recordings, and live performances direct from the server cell.',
  body: 'Full body content here...',
  type: 'news' as const,
  cover_image: null,
  featured: false,
  published_at: '2026-06-23T12:00:00Z',
};

export const Default: Story = {
  args: {
    item: baseItem,
  },
};

export const WithCoverImage: Story = {
  args: {
    item: {
      ...baseItem,
      id: 'dispatch-02',
      title: 'ANALOG_DRIFT_SESSION_08',
      slug: 'analog-drift-session-08',
      type: 'release',
      // We can use a nice public placeholder or generated image from staticDirs
      cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    },
  },
};

export const NoExcerpt: Story = {
  args: {
    item: {
      ...baseItem,
      id: 'dispatch-03',
      title: 'SYSTEM_MAINTENANCE_COMPLETED',
      slug: 'system-maintenance-completed',
      excerpt: null,
    },
  },
};

export const Featured: Story = {
  args: {
    item: {
      ...baseItem,
      id: 'dispatch-04',
      title: 'IMMORTAL_RAINDROPS_FESTIVAL_2026',
      slug: 'immortal-raindrops-festival-2026',
      type: 'event',
      featured: true,
      cover_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
    },
  },
};

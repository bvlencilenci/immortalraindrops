import type { Meta, StoryObj } from '@storybook/react';
import { NavigationLink } from './NavigationLink';

const meta = {
  title: 'Utility/NavigationLink',
  component: NavigationLink,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: 'boolean' },
    isLive: { control: 'boolean' },
  },
} satisfies Meta<typeof NavigationLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'ARCHIVE',
    href: '/archive',
    isActive: false,
    isLive: false,
  },
};

export const Active: Story = {
  args: {
    label: 'ARCHIVE',
    href: '/archive',
    isActive: true,
    isLive: false,
  },
};

export const Live: Story = {
  args: {
    label: 'LIVE',
    href: '/',
    isActive: false,
    isLive: true,
  },
};

export const LiveActive: Story = {
  args: {
    label: 'LIVE',
    href: '/',
    isActive: true,
    isLive: true,
  },
};

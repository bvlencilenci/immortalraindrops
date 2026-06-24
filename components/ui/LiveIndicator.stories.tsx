import type { Meta, StoryObj } from '@storybook/react';
import { LiveIndicator } from './LiveIndicator';

const meta = {
  title: 'Utility/LiveIndicator',
  component: LiveIndicator,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    hasShadow: { control: 'boolean' },
  },
} satisfies Meta<typeof LiveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    isActive: true,
    size: 'sm',
    hasShadow: false,
  },
};

export const Inactive: Story = {
  args: {
    isActive: false,
    size: 'sm',
    hasShadow: false,
  },
};

export const ShadowActive: Story = {
  args: {
    isActive: true,
    size: 'md',
    hasShadow: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-[#ECEEDF]/40 font-mono">SM (1.5)</span>
        <LiveIndicator isActive={true} size="sm" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-[#ECEEDF]/40 font-mono">MD (2.0)</span>
        <LiveIndicator isActive={true} size="md" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-[#ECEEDF]/40 font-mono">LG (3.5)</span>
        <LiveIndicator isActive={true} size="lg" />
      </div>
    </div>
  ),
};

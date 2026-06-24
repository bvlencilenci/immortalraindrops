import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Utility/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'ghost', 'bracket'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  args: {
    label: 'READ_DISPATCH',
    variant: 'outline',
  },
};

export const Bracket: Story = {
  args: {
    label: '[ SUBMIT ]',
    variant: 'bracket',
  },
};

export const Ghost: Story = {
  args: {
    label: 'ARCHIVE',
    variant: 'ghost',
    href: '/archive',
  },
};

export const Disabled: Story = {
  args: {
    label: 'READ_DISPATCH',
    disabled: true,
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { HomeNowPlayingPanel, HomeArchivePanel } from './HomeSidePanels';

const meta = {
  title: 'Components/HomeSidePanels',
  component: HomeNowPlayingPanel,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HomeNowPlayingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NowPlayingActive: Story = {
  args: {
    isLive: true,
    streamTitle: 'Burial - Archangel',
    playbackHistory: [
      { artist: 'Burial', title: 'Archangel' },
      { artist: 'Four Tet', title: 'She Just Likes to Fight' },
      { artist: 'Floating Points', title: 'LesAlpx' },
      { artist: 'Objekt', title: 'Needle & Thread' },
      { artist: 'Actress', title: 'Hubble' },
    ],
  },
  render: (args) => (
    <div className="w-[300px] h-[600px] bg-black text-white font-mono">
      <HomeNowPlayingPanel {...args} />
    </div>
  ),
};

export const NowPlayingOffline: Story = {
  args: {
    isLive: false,
    streamTitle: 'OFFLINE',
    playbackHistory: [],
  },
  render: (args) => (
    <div className="w-[300px] h-[600px] bg-black text-white font-mono">
      <HomeNowPlayingPanel {...args} />
    </div>
  ),
};

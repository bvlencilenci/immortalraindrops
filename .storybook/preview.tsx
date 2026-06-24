import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    viewport: {
      viewports: {
        mobile320: {
          name: 'Mobile (320px)',
          styles: { width: '320px', height: '568px' },
        },
        mobile375: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '667px' },
        },
        tablet768: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
        },
        desktop1024: {
          name: 'Desktop (1024px)',
          styles: { width: '1024px', height: '768px' },
        },
        desktop1440: {
          name: 'Desktop (1440px)',
          styles: { width: '1440px', height: '900px' },
        },
        desktop1920: {
          name: 'Desktop (1920px)',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;
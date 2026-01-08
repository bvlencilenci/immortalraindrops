import type { Metadata } from 'next';
import './globals.css';
import WebampPlayer from '../components/WebampPlayer';

export const metadata: Metadata = {
  title: 'Immortal Raindrops',
  description: 'Cyber-Brutalist Ambient Archive',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
        <WebampPlayer />
      </body>
    </html>
  );
}

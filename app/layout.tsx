import type { Metadata } from 'next';
import './globals.css';
import AudioBar from '../components/AudioBar';

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
        <AudioBar />
      </body>
    </html>
  );
}

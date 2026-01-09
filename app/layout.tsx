import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';

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
      <body className="antialiased min-h-screen bg-black overflow-x-hidden">
        <div className="min-h-screen bg-black relative">
          <div className="scanline pointer-events-none" />
          <div className="grain pointer-events-none" />
          <Header />
          <div className="w-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

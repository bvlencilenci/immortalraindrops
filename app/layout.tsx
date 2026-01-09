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
      <body className="antialiased h-screen w-screen bg-black overflow-hidden">
        <div className="flex flex-col h-full w-full overflow-hidden relative">
          <div className="scanline pointer-events-none" />
          <div className="grain pointer-events-none" />
          <Header />
          <div className="flex-1 w-full overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

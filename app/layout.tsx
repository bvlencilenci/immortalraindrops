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
        <div className="h-screen w-screen overflow-hidden grid grid-rows-[20vh_1fr] bg-black relative">
          <div className="scanline pointer-events-none" />
          <div className="grain pointer-events-none" />
          <Header />
          <div className="w-full h-full overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

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
      <body className="antialiased min-h-screen flex flex-col bg-black selection:bg-white selection:text-black">
        <div className="flex-1 w-full flex flex-col bg-black relative">
          <div className="scanline pointer-events-none" />
          <div className="grain pointer-events-none" />
          <Header />
          <div className="flex-1 w-full pt-20">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

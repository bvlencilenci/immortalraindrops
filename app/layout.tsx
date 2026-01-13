import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import SplashGate from '../components/SplashGate';

export const metadata: Metadata = {
  title: 'Immortal Raindrops',
  description: 'IMMORTAL RAINDROPS WORLDWIDE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-black selection:bg-[#ECEEDF] selection:text-black">
        <SplashGate />
        <div className="flex-1 w-full flex flex-col bg-black relative">
          <Header />
          <div className="flex-1 w-full flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

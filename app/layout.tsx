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
      <body className="antialiased min-h-screen flex flex-col bg-black selection:bg-[#ECEEDF] selection:text-black">
        <div className="flex-1 w-full flex flex-col bg-black relative">
          <div className="relative z-50 w-full h-20 bg-[#0F0E0E]">
            <Header />
          </div>
          <div className="flex-1 w-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

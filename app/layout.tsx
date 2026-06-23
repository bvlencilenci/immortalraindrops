import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import SplashGate from '../components/SplashGate';
import RadioPlayer from '../components/RadioPlayer';
import { createClient } from '@/lib/supabase-server';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('system_settings').select('site_title, meta_description, keywords').eq('id', 1).single();

  return {
    title: data?.site_title || 'Immortal Raindrops',
    description: data?.meta_description || 'IMMORTAL RAINDROPS WORLDWIDE',
    keywords: data?.keywords ? data.keywords.split(',') : ['art', 'music', 'visuals'],
    icons: {
      icon: '/logo-tab.png',
      shortcut: '/logo-tab.png',
      apple: '/logo-tab.png',
    },
    openGraph: {
      title: data?.site_title || 'Immortal Raindrops',
      description: data?.meta_description || 'IMMORTAL RAINDROPS WORLDWIDE',
      images: ['/default-share.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data?.site_title || 'Immortal Raindrops',
      description: data?.meta_description || 'IMMORTAL RAINDROPS WORLDWIDE',
      images: ['/default-share.jpg'],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('system_settings').select('footer_text, maintenance_mode').eq('id', 1).single();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-black selection:bg-[#ECEEDF] selection:text-black">
        <SplashGate />
        <div className="flex-1 w-full flex flex-col bg-black relative">
          <RadioPlayer />
          <Header />
          <div className="flex-1 w-full flex flex-col">
            {children}
          </div>

          {/* Dynamic Footer */}
          <footer className="w-full py-8 text-center text-[#ECEEDF]/20 font-mono text-[10px] uppercase tracking-widest pointer-events-none mix-blend-plus-lighter">
            {settings?.footer_text || '© 2026 IMMORTAL RAINDROPS'}
          </footer>
        </div>
      </body>
    </html>
  );
}

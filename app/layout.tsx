import type { Metadata } from 'next';
import type { Viewport } from 'next';
import './globals.css';
import Header from '../components/Header';
import SplashGate from '../components/SplashGate';
import RadioPlayer from '../components/RadioPlayer';
import { createClient } from '@/lib/supabase-server';
import { Archivo, Archivo_Narrow } from 'next/font/google';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-archivo',
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-archivo-narrow',
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('site_title, meta_description, keywords')
    .eq('id', 1)
    .single();

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

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('system_settings')
    .select('footer_text, maintenance_mode')
    .eq('id', 1)
    .single();

  return (
    <html lang="en" className={`${archivo.variable} ${archivoNarrow.variable}`}>
      <body className="antialiased min-h-dvh flex flex-col bg-black selection:bg-[#ECEEDF] selection:text-black overflow-hidden">
        <SplashGate />

        <div className="flex-1 w-full flex flex-col bg-black relative min-h-0 overflow-hidden">
          <RadioPlayer />
          <Header />

          <div className="flex-1 w-full flex flex-col min-h-0 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
            {children}
          </div>


        </div>
        <div className="scanline" />
      </body>
    </html>
  );
}

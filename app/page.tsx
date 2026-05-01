import { createClient } from '@/lib/supabase-server';
import { NewsFeed } from '@/components/NewsFeed';
import { NewsItem } from '@/components/NewsEntry';
import { HomeLivePanel, HomeArchivePanel } from '@/components/HomeSidePanels';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  
  // Parallel fetch for homepage data
  const [newsRes, settingsRes, tracksRes] = await Promise.all([
    supabase
      .from('news')
      .select('*')
      .eq('visible', true)
      .order('published_at', { ascending: false })
      .limit(20),
    supabase
      .from('site_settings')
      .select('is_live, stream_title')
      .eq('id', 1)
      .single(),
    supabase
      .from('tracks')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(3)
  ]);

  const news = (newsRes.data as NewsItem[]) || [];
  const settings = settingsRes.data || { is_live: false, stream_title: 'OFFLINE' };
  const recentTracks = tracksRes.data || [];

  return (
    <main className="w-full h-[calc(100vh-11.1vh)] flex flex-row overflow-hidden bg-black text-[#ECEEDF] font-mono">
      {/* Left Panel: Live Preview (20%) */}
      <section className="w-[20%] h-full border-r border-[#ECEEDF]/20">
        <HomeLivePanel 
          isLive={settings.is_live} 
          streamTitle={settings.stream_title} 
        />
      </section>

      {/* Center Panel: News Feed (60%) */}
      <section className="w-[60%] h-full overflow-y-auto custom-scrollbar">
        <NewsFeed posts={news} />
      </section>

      {/* Right Panel: Archive Preview (20%) */}
      <section className="w-[20%] h-full border-l border-[#ECEEDF]/20">
        <HomeArchivePanel 
          recentTracks={recentTracks} 
        />
      </section>
    </main>
  );
}

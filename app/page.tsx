import { createClient } from '@/lib/supabase-server';
import { HomeNowPlayingPanel } from '@/components/HomeSidePanels';
import ArchiveGrid from '@/components/ArchiveGrid';
import { type NewsPostItem } from '@/components/NewsEntry';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  
  // Parallel fetch for homepage data
  const [newsRes, settingsRes, tracksRes] = await Promise.all([
    supabase
      .from('news_posts')
      .select('*')
      .eq('published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(20),
    supabase
      .from('system_settings')
      .select('is_live, stream_title, site_title, playback_history')
      .eq('id', 1)
      .single(),
    supabase
      .from('tracks')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(10)
  ]);

  const news = (newsRes.data as NewsPostItem[]) || [];
  const settings = settingsRes.data || { is_live: false, stream_title: 'OFFLINE', site_title: 'Immortal Raindrops', playback_history: [] };
  const recentTracks = tracksRes.data || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: settings.site_title || 'Immortal Raindrops',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://immortalraindrops.art',
    track: recentTracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: track.artist,
      },
    })),
  };

  const renderNewsFeed = () => (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
      {news.length > 0 ? (
        news.map((post) => {
          const date = new Date(post.published_at);
          const formattedDate = date.toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric'
          }).toUpperCase();
          
          return (
            <div key={post.id} className="flex flex-col border-b border-[#ECEEDF]/8 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
              <span className="text-[8px] text-[#ECEEDF]/25 tracking-[0.08em] uppercase mb-1">
                DISPATCH // {formattedDate}
              </span>
              <span className="text-sm font-bold text-[#ECEEDF]/85 tracking-[0.05em] uppercase leading-tight">
                {post.title}
              </span>
              {post.excerpt && (
                <span className="text-[11px] text-[#ECEEDF]/40 font-light normal-case leading-relaxed mt-1">
                  {post.excerpt}
                </span>
              )}
            </div>
          );
        })
      ) : (
        <div className="font-mono text-[#ECEEDF] text-[12px] uppercase tracking-[0.3em] opacity-50 text-center py-12 mt-10">
          NO UPDATES ATM LOL
        </div>
      )}
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="w-full h-[calc(100vh-4rem)] flex flex-row bg-[#0A0A08] text-[#ECEEDF] overflow-hidden font-mono">
        
        {/* Mobile Layout */}
        <div className="flex md:hidden w-full flex-col overflow-y-auto px-4 py-6">
          {renderNewsFeed()}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row w-full h-full items-stretch">
          
          {/* Left column — Playback History (static) */}
          <div className="w-64 shrink-0 bg-[#ECEEDF]/[0.02] flex flex-col px-6 py-8 gap-4 overflow-hidden">
            <HomeNowPlayingPanel isLive={settings.is_live} streamTitle={settings.stream_title} playbackHistory={settings.playback_history} />
          </div>

          {/* Center column — News feed (scrollable) */}
          <div className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-hidden">
            {renderNewsFeed()}
          </div>

          {/* Right column — Archive Preview (static) */}
          <a href="/archive" className="w-72 shrink-0 bg-[#ECEEDF]/[0.02] flex flex-col overflow-hidden group">
            <div className="text-[8px] tracking-[0.3em] text-[#ECEEDF]/25 uppercase px-6 py-6 shrink-0">
              ARCHIVE
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {recentTracks.map((track, index) => (
                <div key={track.id} className="flex flex-col px-6 py-3 border-b border-[#ECEEDF]/5 group-hover:bg-[#ECEEDF]/[0.02] hover:bg-[#ECEEDF]/[0.04] transition-colors">
                  <span className="text-[9px] text-[#ECEEDF]/20 mb-0.5">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold uppercase text-[#ECEEDF]/80 truncate">{track.artist}</span>
                  <span className="text-[9px] font-light text-[#ECEEDF]/40 truncate">{track.title}</span>
                </div>
              ))}
            </div>
          </a>
          
        </div>

      </main>
    </>
  );
}

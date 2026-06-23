import { createClient } from '@/lib/supabase-server';
import LiveBroadcast from '@/components/LiveBroadcast';

export const revalidate = 0;

export default async function Live() {
  const supabase = await createClient();
  
  const [settingsRes, newsRes, tracksRes] = await Promise.all([
    supabase
      .from('system_settings')
      .select('is_live, stream_title, broadcast_mode, dj_name, show_title, dj_location, dj_description, playback_history')
      .eq('id', 1)
      .single(),
    supabase
      .from('news_posts')
      .select('*')
      .eq('published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(10),
    supabase
      .from('tracks')
      .select('title, artist, tile_id, image_ext')
  ]);

  const settings = settingsRes.data;
  const isLive = settings?.is_live || false;
  const streamTitle = settings?.stream_title || 'OFFLINE';
  const broadcastMode = settings?.broadcast_mode || 'automated';
  const djName = settings?.dj_name || '';
  const showTitle = settings?.show_title || '';
  const djLocation = settings?.dj_location || '';
  const djDescription = settings?.dj_description || '';
  const playbackHistory = settings?.playback_history || [];

  const newsPosts = newsRes.data || [];
  const tracks = tracksRes.data || [];

  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 
    (process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}` : 'https://archive.org/download');

  const trackImageMap: Record<string, string> = {};
  tracks.forEach((t) => {
    const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`;
    const ext = t.image_ext || 'jpg';
    trackImageMap[key] = `${r2BaseUrl}/${t.tile_id}/visual.${ext}`;
  });

  return (
    <main className="flex-1 w-full flex flex-col bg-black min-h-0 live-broadcast-page">
      <LiveBroadcast
        initialIsLive={isLive}
        initialTitle={streamTitle}
        initialBroadcastMode={broadcastMode}
        initialDjName={djName}
        initialShowTitle={showTitle}
        initialDjLocation={djLocation}
        initialDjDescription={djDescription}
        initialPlaybackHistory={playbackHistory}
        newsPosts={newsPosts}
        trackImageMap={trackImageMap}
      />
    </main>
  );
}

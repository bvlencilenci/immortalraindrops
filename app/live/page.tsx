import { createClient } from '@/lib/supabase-server';
import LiveBroadcast from '@/components/LiveBroadcast';

export const revalidate = 0;

export default async function Live() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('system_settings')
    .select('is_live, stream_title, broadcast_mode, dj_name, show_title, dj_location, dj_description, playback_history')
    .eq('id', 1)
    .single();

  const isLive = settings?.is_live || false;
  const streamTitle = settings?.stream_title || 'OFFLINE';
  const broadcastMode = settings?.broadcast_mode || 'automated';
  const djName = settings?.dj_name || '';
  const showTitle = settings?.show_title || '';
  const djLocation = settings?.dj_location || '';
  const djDescription = settings?.dj_description || '';
  const playbackHistory = settings?.playback_history || [];

  return (
    <main className="flex-1 w-full flex flex-col bg-black min-h-0">
      <LiveBroadcast
        initialIsLive={isLive}
        initialTitle={streamTitle}
        initialBroadcastMode={broadcastMode}
        initialDjName={djName}
        initialShowTitle={showTitle}
        initialDjLocation={djLocation}
        initialDjDescription={djDescription}
        initialPlaybackHistory={playbackHistory}
      />
    </main>
  );
}

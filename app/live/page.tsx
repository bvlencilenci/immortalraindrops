import { createClient } from '@/lib/supabase-server';
import LiveBroadcast from '@/components/LiveBroadcast';

export const revalidate = 0;

export default async function Live() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('system_settings')
    .select('is_live, stream_title')
    .eq('id', 1)
    .single();

  const isLive = settings?.is_live || false;
  const streamTitle = settings?.stream_title || 'OFFLINE';

  return (
    <main className="flex-1 w-full flex flex-col bg-black min-h-0 items-center justify-center">
      <LiveBroadcast initialIsLive={isLive} initialTitle={streamTitle} />
    </main>
  );
}

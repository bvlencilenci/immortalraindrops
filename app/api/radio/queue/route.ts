import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { featuredQueue } from '@/lib/featuredQueue';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0; // Disable cache to ensure real-time queue representation

export async function GET() {
  try {
    if (featuredQueue.length > 0) {
      const formattedQueue = featuredQueue.map((t) => ({
        artist: t.artist,
        title: t.title,
      }));
      return NextResponse.json({ success: true, queue: formattedQueue });
    }

    // Otherwise retrieve random pool of active tracks from database to simulate automated scheduling
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('artist_name, title')
      .eq('active', true)
      .limit(30);

    if (error) throw error;

    let formattedQueue = (data || []).map((t) => ({
      artist: t.artist_name || 'Unknown Artist',
      title: t.title || 'Unknown Title',
    }));

    // Shuffle and pick 5
    formattedQueue = formattedQueue
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    return NextResponse.json({ success: true, queue: formattedQueue });
  } catch (err: any) {
    console.error('[API_QUEUE] Fetch queue error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

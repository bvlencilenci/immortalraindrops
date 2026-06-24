import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Client with service role key to bypass RLS for updating settings
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const headerSecret = req.headers.get('X-Webhook-Secret');
    const systemSecret = process.env.LIVE_STATUS_WEBHOOK_SECRET;

    if (!systemSecret || headerSecret !== systemSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Webhook Secret' }, { status: 401 });
    }

    const body = await req.json();
    const isLive = typeof body.is_live === 'boolean' ? body.is_live : (body.is_live === 'true');
    const streamTitle = body.stream_display || body.stream_title || '';
    const artistField = body.stream_artist || '';
    const titleField = body.stream_title || '';

    if (typeof isLive !== 'boolean' || typeof streamTitle !== 'string') {
      return NextResponse.json({ error: 'Bad Request: Invalid payload fields' }, { status: 400 });
    }

    // Parse stream title for history tracking
    let playbackHistoryUpdate = null;

    const upperTitle = streamTitle.toUpperCase();
    const isStationTitle = ['OFFLINE', 'STANDBY', 'PLAYLIST ROTATION', 'CONNECTING...', 'IMMORTAL RAINDROPS', 'IMMORTAL RAINDROPS RADIO', 'CURATED PLAYLIST', 'AUTOMATED BROADCAST'].includes(upperTitle);

    if (
      isLive &&
      streamTitle &&
      !isStationTitle &&
      streamTitle.includes(' - ')
    ) {
      let artist = artistField.trim();
      let title = titleField.trim();

      if (!artist || !title) {
        const parts = streamTitle.split(/ - | — /);
        artist = parts[0]?.trim() || 'Unknown Artist';
        title = parts[1]?.trim() || parts[0]?.trim() || 'Unknown Title';
      }

      // Get current history to append to
      const { data: currentSettings } = await supabase
        .from('system_settings')
        .select('playback_history')
        .eq('id', 1)
        .single();

      let history = currentSettings?.playback_history || [];
      if (!Array.isArray(history)) history = [];

      const lastTrack = history[0] as { artist?: string; title?: string } | undefined;
      const isDuplicate = lastTrack && 
        lastTrack.artist?.toLowerCase() === artist.toLowerCase() && 
        lastTrack.title?.toLowerCase() === title.toLowerCase();

      if (!isDuplicate) {
        history = [{ artist, title }, ...history].slice(0, 7);
        playbackHistoryUpdate = history;
      }
    }

    const updateFields: any = {
      is_live: isLive,
      stream_title: streamTitle,
      updated_at: new Date().toISOString()
    };

    if (playbackHistoryUpdate) {
      updateFields.playback_history = playbackHistoryUpdate;
    }

    // Perform targeted column update on singleton row (id = 1) in system_settings
    const { error } = await supabase
      .from('system_settings')
      .update(updateFields)
      .eq('id', 1);

    if (error) {
      console.error('Supabase Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
  }
}

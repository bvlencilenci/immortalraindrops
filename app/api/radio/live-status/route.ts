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

    const { is_live, stream_title } = await req.json();

    if (typeof is_live !== 'boolean' || typeof stream_title !== 'string') {
      return NextResponse.json({ error: 'Bad Request: Invalid payload fields' }, { status: 400 });
    }

    // Perform targeted column update on singleton row (id = 1) in system_settings
    const { error } = await supabase
      .from('system_settings')
      .update({
        is_live,
        now_playing_title: stream_title,
        updated_at: new Date().toISOString()
      })
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

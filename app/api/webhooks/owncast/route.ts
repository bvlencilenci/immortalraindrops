import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Warning: Using process.env directly here. Ensure SUPABASE_URL and SERVICE_KEY are set in env.local
// For client-side we use Anon key, for webhooks/admin we need Service Role (or appropriate RLS-bypass) key.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, eventData } = body;

    let isLive = false;
    let title = "Immortal Raindrops Radio";

    // Owncast Event Types: https://owncast.online/docs/webhooks/
    switch (type) {
      case 'STREAM_STARTED':
        isLive = true;
        title = eventData?.title || "LIVE DJ SET";
        break;
      case 'STREAM_STOPPED':
        isLive = false;
        break;
      case 'STREAM_TITLE_UPDATED':
        isLive = true;
        title = eventData?.title || "LIVE DJ SET";
        break;
      default:
        // Ignore other events for now
        return NextResponse.json({ message: 'Event ignored' });
    }

    // Assuming we use row with ID 1 for global site settings
    const { error } = await supabase
      .from('site_settings')
      .update({ is_live: isLive, stream_title: title, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      console.error("Supabase Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
  }
}

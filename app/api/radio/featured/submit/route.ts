import { NextResponse } from 'next/server';
import { addToQueue, featuredQueue } from '@/lib/featuredQueue';

const WEBHOOK_SECRET = process.env.LIVE_STATUS_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const headerSecret = req.headers.get('X-Admin-Secret');
    if (!WEBHOOK_SECRET || headerSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, title, artist } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing track URL' }, { status: 400 });
    }

    addToQueue({
      url,
      title: title || 'Unknown Title',
      artist: artist || 'Unknown Artist',
    });

    console.log(`[FEATURED_QUEUE] Added track: ${artist} - ${title} (${url})`);

    return NextResponse.json({ success: true, queue: featuredQueue });
  } catch (err: any) {
    console.error('[FEATURED_QUEUE] Submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

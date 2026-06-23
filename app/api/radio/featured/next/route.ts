import { NextResponse } from 'next/server';
import { getNextFromQueue } from '@/lib/featuredQueue';

const WEBHOOK_SECRET = process.env.LIVE_STATUS_WEBHOOK_SECRET;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');
    const headerSecret = req.headers.get('X-Admin-Secret');

    if (!WEBHOOK_SECRET || (querySecret !== WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const nextTrack = getNextFromQueue();
    if (!nextTrack) {
      return new Response('', { status: 204 }); // No Content
    }

    console.log(`[FEATURED_QUEUE] Consuming track: ${nextTrack.artist} - ${nextTrack.title}`);
    
    // Return URL as raw plain text so Liquidsoap can read it directly
    return new Response(nextTrack.url, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err: any) {
    console.error('[FEATURED_QUEUE] Fetch next error:', err);
    return new Response(err.message, { status: 500 });
  }
}

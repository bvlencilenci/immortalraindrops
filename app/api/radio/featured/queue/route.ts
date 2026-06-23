import { NextResponse } from 'next/server';
import { featuredQueue } from '@/lib/featuredQueue';

const WEBHOOK_SECRET = process.env.LIVE_STATUS_WEBHOOK_SECRET;

export async function GET(req: Request) {
  try {
    const headerSecret = req.headers.get('X-Admin-Secret');
    if (!WEBHOOK_SECRET || headerSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true, queue: featuredQueue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

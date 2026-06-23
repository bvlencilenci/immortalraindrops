import { NextResponse } from 'next/server';

export const revalidate = 0; // Disable cache for real-time stats

export async function GET() {
  try {
    const res = await fetch('https://immortal-radio.fly.dev/status-json.xsl', {
      next: { revalidate: 0 },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ listeners: 0, uptime: 0, active: false });
    }

    const data = await res.json();
    
    // Find the primary mount point statistics
    const source = data?.sources?.find((s: any) => s.mount === '/radio');
    if (!source) {
      return NextResponse.json({ listeners: 0, uptime: 0, active: false });
    }

    return NextResponse.json({
      listeners: source.listeners || 0,
      uptime: source.connected || 0,
      active: true,
      title: source.title || '',
      artist: source.artist || ''
    });
  } catch (error) {
    console.error('Failed to fetch radio stats:', error);
    return NextResponse.json({ listeners: 0, uptime: 0, active: false });
  }
}

import { NextResponse } from 'next/server';

const RADIO_HOST = process.env.RADIO_COMMAND_HOST || 'https://immortal-radio.fly.dev';
const WEBHOOK_SECRET = process.env.LIVE_STATUS_WEBHOOK_SECRET;

/**
 * POST /api/radio/command
 * 
 * Proxies Liquidsoap telnet commands through the radio server's HTTP interface.
 * Protected by LIVE_STATUS_WEBHOOK_SECRET — only callable from server actions.
 * 
 * Body: { command: string }
 * Header: X-Admin-Secret must match LIVE_STATUS_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  try {
    // 1. Validate secret
    const headerSecret = req.headers.get('X-Admin-Secret');
    if (!WEBHOOK_SECRET || headerSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse command
    const { command } = await req.json();
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Missing command' }, { status: 400 });
    }

    // 3. Whitelist allowed commands (prevent injection)
    const allowedPrefixes = [
      'radio.',
      'featured.',
      'normal.',
      'music.',
      'broadcast.',
      'request.',
      'help',
    ];

    const isAllowed = allowedPrefixes.some(prefix => command.startsWith(prefix));
    if (!isAllowed) {
      return NextResponse.json({ error: 'Command not allowed' }, { status: 403 });
    }

    // 4. Forward to Liquidsoap via Nginx-proxied HTTP API
    // The Liquidsoap server.harbor exposes commands at:
    //   GET /command_name?arg=value
    // We need to translate our telnet-style command to a URL path.
    // 
    // Telnet commands like "radio.skip" become GET /radio.skip
    // Commands with args like "broadcast.now_playing" become GET /broadcast.now_playing
    
    const parts = command.split(' ');
    const cmdPath = parts[0];
    const cmdArg = parts.slice(1).join(' ');
    
    const url = cmdArg 
      ? `${RADIO_HOST}/api/${cmdPath}?arg=${encodeURIComponent(cmdArg)}`
      : `${RADIO_HOST}/api/${cmdPath}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `Liquidsoap error: ${response.status}`, detail: errorText },
        { status: 502 }
      );
    }

    const result = await response.text();
    return NextResponse.json({ success: true, result: result.trim() });

  } catch (err: any) {
    console.error('[RADIO_CMD] Command proxy error:', err);
    
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return NextResponse.json({ error: 'Radio server timeout' }, { status: 504 });
    }
    
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

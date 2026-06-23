import { NextResponse } from 'next/server';
import net from 'net';

const TELNET_HOST = process.env.RADIO_TELNET_HOST || 'immortal-radio.fly.dev';
const TELNET_PORT = parseInt(process.env.RADIO_TELNET_PORT || '7000', 10);
const WEBHOOK_SECRET = process.env.LIVE_STATUS_WEBHOOK_SECRET;

function executeTelnetCommand(host: string, port: number, command: string, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let dataBuffer = '';
    let resolved = false;

    console.log(`>>> LIQUIDSOAP CMD: ${command}`);

    const timer = setTimeout(() => {
      resolved = true;
      socket.destroy();
      console.error(`<<< TIMEOUT - NO RESPONSE FOR CMD: ${command}`);
      reject(new Error('Timeout waiting for telnet response'));
    }, timeoutMs);

    socket.connect(port, host, () => {
      socket.write(`${command}\n`);
    });

    socket.on('data', (data) => {
      dataBuffer += data.toString();
      
      // Liquidsoap telnet protocol responses always end with "END" followed by newlines
      const trimmed = dataBuffer.trim();
      if (trimmed.endsWith('END')) {
        clearTimeout(timer);
        resolved = true;
        socket.end();

        // Strip the trailing "END" from the response
        let result = dataBuffer.trim();
        if (result.endsWith('END')) {
          result = result.slice(0, -3).trim();
        }
        console.log(`<<< RESPONSE for ${command}: ${result}`);
        resolve(result);
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        console.error(`<<< ERROR FOR CMD ${command}: ${err.message}`);
        reject(err);
      }
    });

    socket.on('close', () => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        const result = dataBuffer.trim();
        console.log(`<<< SOCKET CLOSED FOR CMD ${command}. Buffer: ${result}`);
        resolve(result);
      }
    });
  });
}

/**
 * POST /api/radio/command
 * 
 * Proxies Liquidsoap telnet commands through a raw TCP socket connection.
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

    // 4. Send command via raw TCP socket to Liquidsoap telnet server
    const result = await executeTelnetCommand(TELNET_HOST, TELNET_PORT, command);
    return NextResponse.json({ success: true, result });

  } catch (err: any) {
    console.error('[RADIO_CMD] Command proxy error:', err);
    
    return NextResponse.json(
      { error: 'Radio server communication failed', detail: err.message },
      { status: 502 }
    );
  }
}

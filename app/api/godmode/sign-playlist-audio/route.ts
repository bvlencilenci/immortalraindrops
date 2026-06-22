import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'immortal-assets';

const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID || '',
    secretAccessKey: SECRET_ACCESS_KEY || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify godmode
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { }
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_godmode')
      .eq('id', user.id)
      .single();

    if (!profile?.is_godmode) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Validate request
    const { ext, contentType, fileSize } = await request.json();

    if (!ext || !ALLOWED_AUDIO_TYPES[ext.toLowerCase()]) {
      return NextResponse.json(
        { error: `Invalid format. Allowed: ${Object.keys(ALLOWED_AUDIO_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 3. Generate unique key under playlist/ path
    const trackId = crypto.randomUUID();
    const audioKey = `playlist/${trackId}.${ext.toLowerCase()}`;

    const uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: audioKey,
      ContentType: contentType || ALLOWED_AUDIO_TYPES[ext.toLowerCase()],
    }), { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,
      audioKey,
      trackId,
    });

  } catch (err) {
    console.error('Playlist audio presign error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

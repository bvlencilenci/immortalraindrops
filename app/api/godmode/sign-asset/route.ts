import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'immortal-assets';

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

    const { tileId, audioExt, imageExt, audioType, imageType } = await request.json();

    if (!tileId) return NextResponse.json({ error: 'Missing tileId' }, { status: 400 });

    const audioKey = audioExt ? `${tileId}/audio.${audioExt}` : null;
    const visualKey = imageExt ? `${tileId}/visual.${imageExt}` : null;

    let audioUrl = null;
    let visualUrl = null;

    if (audioKey && audioType) {
      audioUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: audioKey,
        ContentType: audioType,
      }), { expiresIn: 3600 });
    }

    if (visualKey && imageType) {
      visualUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: visualKey,
        ContentType: imageType,
      }), { expiresIn: 3600 });
    }

    return NextResponse.json({
      audioUrl,
      visualUrl,
      audioKey,
      visualKey
    });

  } catch (err) {
    console.error('Godmode sign Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

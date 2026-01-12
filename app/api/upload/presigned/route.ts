import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'immortal-assets';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const audioExt = searchParams.get('audioExt');
    const imageExt = searchParams.get('imageExt');
    const audioType = searchParams.get('audioType');
    const imageType = searchParams.get('imageType');

    if (!audioExt || !imageExt || !audioType || !imageType) {
      return NextResponse.json({ error: 'Missing file metadata' }, { status: 400 });
    }

    // 1. Determine Next Index (Optimistic)
    const { data: lastTrack, error: fetchError } = await supabase
      .from('tracks')
      .select('tile_index')
      .order('tile_index', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database Error:', fetchError);
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
    }

    const nextIndex = (lastTrack?.tile_index || 0) + 1;
    const tileId = `tile-${nextIndex}`;

    // 2. Generate Keys with "Renaming Logic"
    const audioKey = `${tileId}/audio.${audioExt}`;
    const visualKey = `${tileId}/visual.${imageExt}`;

    // 3. Generate Presigned URLs
    const audioUrl = await getSignedUrl(s3Client, new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: audioKey,
      ContentType: audioType,
    }), { expiresIn: 3600 });

    const visualUrl = await getSignedUrl(s3Client, new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: visualKey,
      ContentType: imageType,
    }), { expiresIn: 3600 });

    return NextResponse.json({
      tileId,
      nextIndex,
      audioKey,
      visualKey,
      audioUrl,
      visualUrl
    });

  } catch (err) {
    console.error('Presign Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

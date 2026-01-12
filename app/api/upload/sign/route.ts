import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';

const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
// const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'immortal-assets'; // Not used with public domain endpoint

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_PUBLIC_DOMAIN}`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID || '',
    secretAccessKey: SECRET_ACCESS_KEY || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export async function POST(request: NextRequest) {
  if (!process.env.R2_PUBLIC_DOMAIN) {
    return NextResponse.json({ error: 'R2_PUBLIC_DOMAIN not configured' }, { status: 500 });
  }

  try {
    const { audioExt, imageExt, audioType, imageType } = await request.json();

    if (!audioExt || !imageExt || !audioType || !imageType) {
      return NextResponse.json({ error: 'Missing file metadata' }, { status: 400 });
    }

    // 1. Determine Next Index
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

    // 2. Generate Keys
    const audioKey = `${tileId}/audio.${audioExt}`;
    const visualKey = `${tileId}/visual.${imageExt}`;

    // 3. Generate Presigned URLs
    // Note: We use an empty bucket string because the R2_PUBLIC_DOMAIN endpoint 
    // already points to the correct bucket context for this specific setup.
    const audioUrl = await getSignedUrl(s3Client, new PutObjectCommand({
      Bucket: '',
      Key: audioKey,
      ContentType: audioType,
    }), { expiresIn: 3600 });

    const visualUrl = await getSignedUrl(s3Client, new PutObjectCommand({
      Bucket: '',
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

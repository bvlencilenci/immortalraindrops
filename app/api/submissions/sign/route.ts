import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export async function POST(req: NextRequest) {
  try {
    const { email, artist_name, title, mediaExt, mediaType, imageExt, imageType } = await req.json();
    if (!email || !artist_name || !title || !mediaExt || !mediaType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // 1. Insert DB row (pending)
    const { data: sub, error } = await supabase
      .from('submissions')
      .insert({
        email,
        title,
        artist_name,
        audio_url: mediaType.startsWith('audio') ? `submissions/audio.${mediaExt}` : null,
        video_url: mediaType.startsWith('video') ? `submissions/video.${mediaExt}` : null,
        image_url: imageExt ? `submissions/image.${imageExt}` : null,
        status: 'pending'
      })
      .select('id, status_token')
      .single();

    if (error || !sub) {
      console.error('DB Insert Error:', error);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    const { id, status_token } = sub;

    // We need the ID to build the path safely
    const audioUrlPath = mediaType.startsWith('audio') ? `submissions/${id}/audio.${mediaExt}` : null;
    const videoUrlPath = mediaType.startsWith('video') ? `submissions/${id}/video.${mediaExt}` : null;
    const imageUrlPath = imageExt ? `submissions/${id}/image.${imageExt}` : null;

    await supabase.from('submissions').update({
      audio_url: audioUrlPath,
      video_url: videoUrlPath,
      image_url: imageUrlPath
    }).eq('id', id);

    // 2. Generate Presigned URLs
    let mediaUrl = null;
    let imageUrl = null;
    const BUCKET = process.env.R2_BUCKET_NAME || 'immortal-assets';

    const mediaPath = audioUrlPath || videoUrlPath;
    if (mediaPath) {
      mediaUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: BUCKET,
        Key: mediaPath,
        ContentType: mediaType,
      }), { expiresIn: 3600 });
    }

    if (imageUrlPath && imageType) {
      imageUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: BUCKET,
        Key: imageUrlPath,
        ContentType: imageType,
      }), { expiresIn: 3600 });
    }

    return NextResponse.json({
      status_token,
      mediaUrl,
      imageUrl
    });

  } catch (err) {
    console.error('Submission Sign Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

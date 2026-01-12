'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabase';

// Initialize R2 Client
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

export async function uploadFile(formData: FormData) {
  let createdTrackId: string | null = null;

  try {
    const audioFile = formData.get('audioFile') as File;
    const imageFile = formData.get('imageFile') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;

    if (!audioFile || !imageFile || !title || !artist) {
      return { success: false, error: 'Missing required assets or metadata' };
    }

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error('R2 Credentials Missing');
      return { success: false, error: 'Server misconfiguration: Missing Storage Credentials' };
    }

    console.log(`Processing Dual Upload: "${title}" by "${artist}"`);

    // 1. Determine Next Tile Index & Reserving the Slot (DB First)
    // We fetch the max index to calculate the next one.
    // Note: In a high-concurrency env, we'd want a DB function to do "insert ... returning tile_index" automatically,
    // but for this scale, fetching + sticking it in immediate insert is the standard "Reserve" pattern.

    const { data: lastTrack, error: fetchError } = await supabase
      .from('tracks')
      .select('tile_index')
      .order('tile_index', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase Fetch Error:', fetchError);
      return { success: false, error: 'Database connection failed' };
    }

    const nextIndex = (lastTrack?.tile_index || 0) + 1;
    const tileId = `tile-${nextIndex}`;
    const audioExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
    const imageExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';

    console.log(`Attempting to Reserve Index: ${nextIndex} (${tileId})`);

    // INSERT FIRST: This "locks" the tile_index (assuming unique constraint) or at least claims it logically.
    // If this fails (e.g., race condition), we stop before uploading to R2.
    const { data: insertedData, error: insertError } = await supabase
      .from('tracks')
      .insert({
        title: title,
        artist: artist,
        tile_index: nextIndex,
        tile_id: tileId,
        audio_ext: audioExt,
        image_ext: imageExt,
        created_at: new Date().toISOString(),
      })
      .select('id') // Return ID so we can rollback if needed
      .single();

    if (insertError) {
      console.error('Supabase Insert Error (Reservation Failed):', insertError);
      return { success: false, error: 'Failed to reserve track slot. Please try again.' };
    }

    createdTrackId = insertedData.id;
    console.log(`Reserved Slot Success. Track ID: ${createdTrackId}. Proceeding to Upload...`);

    // 2. Prepare Uploads
    const audioKey = `${tileId}/audio.${audioExt}`;
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const visualKey = `${tileId}/visual.${imageExt}`;
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 3. Upload to R2 (Parallel)
    // If this fails, we must clean up the DB row.
    console.log(`Uploading Assets to R2: ${audioKey} & ${visualKey}`);

    await Promise.all([
      s3Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: audioFile.type,
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: visualKey,
        Body: imageBuffer,
        ContentType: imageFile.type,
      }))
    ]);

    console.log('Upload Sequence Complete.');
    return { success: true, tileId };

  } catch (err) {
    console.error('Upload Action Exception:', err);

    // ROLLBACK: Attempt to delete the reserved row if R2 upload failed
    if (createdTrackId) {
      console.warn(`Rolling back DB entry ${createdTrackId} due to upload failure...`);
      await supabase.from('tracks').delete().eq('id', createdTrackId);
    }

    return { success: false, error: `Upload Failed: ${(err as Error).message}` };
  }
}

'use server';

import { supabase } from '@/lib/supabase';

interface FinalizeUploadParams {
  title: string;
  artist: string;
  tileIndex: number;
  tileId: string;
  audioExt: string;
  imageExt: string;
}

export async function finalizeUpload(params: FinalizeUploadParams) {
  try {
    const { title, artist, tileIndex, tileId, audioExt, imageExt } = params;

    if (!title || !artist || !tileId) {
      return { success: false, error: 'Missing metadata for finalization' };
    }

    console.log(`Finalizing Upload: "${title}" [${tileId}]`);

    // Insert into Supabase
    // Note: We use the index/id provided because the files are already physically at this location in R2.
    // If a race condition occurred and this index is taken, the upload might fail or we double-up.
    // We could check uniqueness here, but for now we proceed with insertion.

    const { error: insertError } = await supabase
      .from('tracks')
      .insert({
        title,
        artist,
        tile_index: tileIndex,
        tile_id: tileId,
        audio_ext: audioExt,
        image_ext: imageExt,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Supabase Finalize Error:', insertError);
      return { success: false, error: 'Failed to register track. Files uploaded to R2, but DB Sync failed.' };
    }

    console.log('Track Registered Successfully.');
    return { success: true, tileId };

  } catch (err) {
    console.error('Finalize Action Exception:', err);
    return { success: false, error: `Internal Server Error: ${(err as Error).message}` };
  }
}

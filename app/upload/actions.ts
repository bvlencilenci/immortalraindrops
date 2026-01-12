'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Initialize Service Role Client to bypass Row Level Security (RLS)
// Use SUPABASE_SERVICE_ROLE_KEY from env.local
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FinalizeUploadParams {
  title: string;
  artist: string;
  tileIndex: number;
  tileId: string;
  audioExt: string;
  imageExt: string;
  mediaType: 'song' | 'dj set' | 'video' | 'image';
  duration?: string;
}

export async function finalizeUpload(params: FinalizeUploadParams) {
  try {
    const { title, artist, tileIndex, tileId, audioExt, imageExt, mediaType } = params;

    if (!title || !artist || !tileId) {
      return { success: false, error: 'Missing metadata for finalization' };
    }

    console.log(`Finalizing Upload: "${title}" [${tileId}] (${mediaType})`);

    // Insert into Supabase
    // Note: We use the index/id provided because the files are already physically at this location in R2.
    // If a race condition occurred and this index is taken, the upload might fail or we double-up.
    // We could check uniqueness here, but for now we proceed with insertion.

    const { error: insertError } = await supabaseAdmin
      .from('tracks')
      .insert({
        title,
        artist,
        tile_index: tileIndex,
        tile_id: tileId,
        audio_ext: audioExt,
        image_ext: imageExt,
        // REQUIRED: Set media_type from selection
        media_type: mediaType,
        release_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Supabase Finalize Error:', insertError);
      // Return specific error details to client for debugging
      return {
        success: false,
        error: `DB Sync Failed: ${insertError.message} (Code: ${insertError.code}) - ${insertError.details || 'No details'}`
      };
    }

    console.log('Track Registered Successfully.');
    return { success: true, tileId };

  } catch (err) {
    console.error('Finalize Action Exception:', err);
    return { success: false, error: `Internal Server Error: ${(err as Error).message}` };
  }
}

'use server';

import { supabase } from '@/lib/supabase';
import { UPLOAD_PASSWORD } from '../../config/admins';
import { revalidatePath } from 'next/cache';

export async function verifyUploadAccess(password: string) {
  // Simple equality check
  if (password === UPLOAD_PASSWORD) {
    return { success: true };
  }
  return { success: false, error: 'Incorrect Password' };
}

interface UploadMetadata {
  title: string;
  artist: string;
  tileIndex: number;
  tileId: string;
  audioExt: string;
  imageExt: string;
  mediaType: 'song' | 'dj set' | 'video' | 'image';
}

export async function finalizeUpload(metadata: UploadMetadata) {
  try {
    const {
      title,
      artist,
      tileIndex,
      tileId,
      audioExt,
      imageExt,
      mediaType,
    } = metadata;

    console.log('[FINALIZE] Inserting into DB:', tileId);

    const { error } = await supabase
      .from('tracks')
      .insert({
        title,
        artist,
        tile_index: tileIndex,
        tile_id: tileId,
        audio_ext: audioExt,
        image_ext: imageExt,
        media_type: mediaType,
        release_date: new Date().getFullYear().toString(), // Default to current year
        duration: null, // Let client calculate or blank
      });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    revalidatePath('/archive');

    return { success: true, tileId };
  } catch (error) {
    console.error('Finalize Upload Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

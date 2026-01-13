'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
  release_date?: string;
}

export async function finalizeUpload(metadata: UploadMetadata) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    // 1. Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Please sign in to upload.");
    }

    const {
      title,
      artist,
      tileIndex,
      tileId,
      audioExt,
      imageExt,
      mediaType,
    } = metadata;

    console.log('[FINALIZE] Inserting into DB:', tileId, 'User:', user.id);

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
        release_date: new Date().toISOString(),
        duration: null,
        user_id: user.id // Link to user
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

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface UploadMetadata {
  title: string;
  artist: string;
  tileIndex: number;
  tileId: string;
  audioExt?: string;
  imageExt: string;
  mediaType: 'song' | 'dj set' | 'video' | 'image';
}

export async function finalizeUpload(data: UploadMetadata) {
  const cookieStore = await cookies();

  // 1. Create Supabase Client
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // 2. Authenticate User
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session) {
    return { success: false, error: 'Unauthorized: No active session found.' };
  }

  const userId = session.user.id;

  // 3. Insert into Database
  try {
    const { error } = await supabase
      .from('tracks')
      .insert({
        tile_id: data.tileId,
        tile_index: data.tileIndex,
        title: data.title,
        artist: data.artist,
        audio_ext: data.audioExt || null,
        image_ext: data.imageExt,
        media_type: data.mediaType,
        created_at: new Date().toISOString(),
        release_date: new Date().toISOString(),
        duration: 0, // Placeholder, eventually could be parsed
        user_id: userId // Link to the authenticated user
      });

    if (error) {
      console.error('Supabase Insert Error:', error);
      return { success: false, error: error.message };
    }

    // 4. Revalidate
    revalidatePath('/archive');
    revalidatePath('/'); // Home might show latest

    return { success: true, tileId: data.tileId };
  } catch (err) {
    console.error('Finalize Upload Error:', err);
    return { success: false, error: 'Internal Server Error' };
  }
}

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function deleteMyTrack(tileId: string, audioExt: string, imageExt: string) {
  try {
    const user = await getAuthenticatedUser();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    // 1. Verify Ownership
    const { data: track, error: fetchError } = await supabase
      .from('tracks')
      .select('user_id')
      .eq('tile_id', tileId)
      .single();

    if (fetchError || !track) throw new Error('Track not found');
    if (track.user_id !== user.id) throw new Error('Ownership verification failed');

    // 2. Delete Assets from R2
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `${tileId}/audio.${audioExt}`,
    }));
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `${tileId}/visual.${imageExt}`,
    }));

    // 3. Delete from DB
    const { error: deleteError } = await supabase
      .from('tracks')
      .delete()
      .eq('tile_id', tileId);

    if (deleteError) throw deleteError;

    revalidatePath('/my-uploads');
    revalidatePath('/archive');
    return { success: true };
  } catch (error) {
    console.error('[MY-UPLOADS] Delete Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateMyTrack(tileId: string, updates: Record<string, any>) {
  try {
    const user = await getAuthenticatedUser();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    // 1. Verify Ownership
    const { data: track, error: fetchError } = await supabase
      .from('tracks')
      .select('user_id')
      .eq('tile_id', tileId)
      .single();

    if (fetchError || !track) throw new Error('Track not found');
    if (track.user_id !== user.id) throw new Error('Ownership verification failed');

    // 2. Update DB
    const { error: updateError } = await supabase
      .from('tracks')
      .update(updates)
      .eq('tile_id', tileId);

    if (updateError) throw updateError;

    revalidatePath('/my-uploads');
    revalidatePath('/archive');
    return { success: true };
  } catch (error) {
    console.error('[MY-UPLOADS] Update Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

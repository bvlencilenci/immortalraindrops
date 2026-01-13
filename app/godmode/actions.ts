'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

// Initialize Service Role Client for Deletion (Bypasses RLS)
// We only use this AFTER verifying the user is an admin.
const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { getAll: () => [], setAll: () => { } } } // Mock cookies for service role client
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

// Helper: Verify Admin Role
async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  // Check Profile Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin Access Required');
  }
}

export async function deleteTile(tileId: string, tileIndex: number, audioExt: string, imageExt: string) {
  try {
    await verifyAdmin();
    console.log(`[GODMODE] Deleting Tile ${tileId}...`);

    // 1. Delete Audio from R2
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${tileId}/audio.${audioExt}`,
      }));
    } catch (e) { console.error(`[GODMODE] R2 Audio Delete Error:`, e); }

    // 2. Delete Visual from R2
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${tileId}/visual.${imageExt}`,
      }));
    } catch (e) { console.error(`[GODMODE] R2 Visual Delete Error:`, e); }

    // 3. Delete from Database (Using Admin Client to bypass any specifics, though Policies might allow it)
    // Actually, we should probably rely on RLS policies now if possible? 
    // But RLS "Admins can delete anything" requires the client to be the authenticated user.
    // 'supabaseAdmin' is a Service Role client, so it bypasses RLS naturally.
    // Since we verified admin above, using Service Role is safe and robust.
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => { } } }
    );

    const { error } = await supabaseService
      .from('tracks')
      .delete()
      .eq('tile_id', tileId);

    if (error) throw new Error(`DB Deletion Failed: ${error.message}`);

    revalidatePath('/archive');
    revalidatePath('/godmode');
    revalidatePath('/');

    return { success: true };

  } catch (error) {
    console.error('[GODMODE] Deletion Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateTile(tileId: string, updates: Record<string, any>) {
  try {
    await verifyAdmin();
    console.log(`[GODMODE] Updating Tile ${tileId}...`, updates);

    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => { } } }
    );

    const { error } = await supabaseService
      .from('tracks')
      .update(updates)
      .eq('tile_id', tileId);

    if (error) throw new Error(`DB Update Failed: ${error.message}`);

    console.log(`[GODMODE] Updated DB: ${tileId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

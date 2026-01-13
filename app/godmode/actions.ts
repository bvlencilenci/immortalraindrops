'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { ADMINS } from '../../config/admins';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

// Initialize Service Role Client for Deletion
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Disable checksums to avoid R2 incompatibility
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export async function verifyLogin(username: string, pass: string) {
  const account = ADMINS.find(a => a.username === username && a.password === pass);
  if (account) {
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
}

export async function deleteTile(tileId: string, tileIndex: number, audioExt: string, imageExt: string) {
  try {
    console.log(`[GODMODE] Deleting Tile ${tileId}...`);

    // 1. Delete Audio from R2
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${tileId}/audio.${audioExt}`,
      }));
      console.log(`[GODMODE] Deleted audio: ${tileId}/audio.${audioExt}`);
    } catch (e) {
      console.error(`[GODMODE] Failed to delete audio (might not exist):`, e);
    }

    // 2. Delete Visual from R2
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${tileId}/visual.${imageExt}`,
      }));
      console.log(`[GODMODE] Deleted visual: ${tileId}/visual.${imageExt}`);
    } catch (e) {
      console.error(`[GODMODE] Failed to delete visual (might not exist):`, e);
    }

    // 3. Delete from Database
    const { error } = await supabaseAdmin
      .from('tracks')
      .delete()
      .eq('tile_id', tileId);

    if (error) {
      throw new Error(`DB Deletion Failed: ${error.message}`);
    }

    console.log(`[GODMODE] Deleted from DB: ${tileId}`);

    // 4. Revalidate
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
    console.log(`[GODMODE] Updating Tile ${tileId}...`, updates);

    const { error } = await supabaseAdmin
      .from('tracks')
      .update(updates)
      .eq('tile_id', tileId);

    if (error) {
      throw new Error(`DB Update Failed: ${error.message}`);
    }

    console.log(`[GODMODE] Updated DB: ${tileId}`);

    revalidatePath('/archive');
    revalidatePath('/godmode');
    revalidatePath('/');

    return { success: true };

  } catch (error) {
    console.error('[GODMODE] Update Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

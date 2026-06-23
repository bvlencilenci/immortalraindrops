'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  // Check Profile Godmode Status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_godmode')
    .eq('id', user.id)
    .single();

  if (!profile?.is_godmode) {
    throw new Error('Forbidden: Godmode Access Required');
  }
}

export async function deleteTile(tileId: string, tileIndex: number, audioExt: string, imageExt: string) {
  try {
    await verifyAdmin();
    if (process.env.NODE_ENV === 'development') console.log(`[GODMODE] Deleting Tile ${tileId}...`);

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
    if (process.env.NODE_ENV === 'development') console.log(`[GODMODE] Updating Tile ${tileId}...`, updates);

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

    if (process.env.NODE_ENV === 'development') console.log(`[GODMODE] Updated DB: ${tileId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
export async function deleteUser(userId: string) {
  try {
    await verifyAdmin();

    // Prevent self-deletion
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      throw new Error('Self-deletion is prohibited.');
    }

    if (process.env.NODE_ENV === 'development') console.log(`[GODMODE] Deleting User ${userId}...`);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    revalidatePath('/godmode');
    return { success: true };
  } catch (error) {
    console.error('[GODMODE] User Deletion Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function finalizeAssetUpdate(tileId: string, updates: { audio_url?: string, visual_url?: string }) {
  try {
    await verifyAdmin();
    if (process.env.NODE_ENV === 'development') console.log(`[GODMODE] Finalizing asset update for ${tileId}...`, updates);

    // 1. Get current track to check for old files
    const { data: currentTrack } = await supabaseAdmin
      .from('tracks')
      .select('audio_url, visual_url')
      .eq('tile_id', tileId)
      .single();

    // 2. Update Database
    const { error: dbError } = await supabaseAdmin
      .from('tracks')
      .update(updates)
      .eq('tile_id', tileId);

    if (dbError) throw new Error(`DB Update Failed: ${dbError.message}`);

    // 3. Cleanup old files from R2 if paths changed
    if (currentTrack) {
      if (updates.audio_url && currentTrack.audio_url !== updates.audio_url) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: currentTrack.audio_url,
          }));
        } catch (e) {
          console.warn(`[GODMODE] Failed to delete old audio:`, e);
        }
      }
      if (updates.visual_url && currentTrack.visual_url !== updates.visual_url) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: currentTrack.visual_url,
          }));
        } catch (e) {
          console.warn(`[GODMODE] Failed to delete old visual:`, e);
        }
      }
    }

    revalidatePath('/archive');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[GODMODE] Asset Finalization Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function requestUploadAccess() {
  try {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required.');

    const { error } = await supabase
      .from('profiles')
      .update({ access_requested: true })
      .eq('id', user.id);

    if (error) throw error;

    // 2. Trigger Notification Webhook if configured
    try {
      const { data: settings } = await supabaseAdmin
        .from('system_settings')
        .select('notification_webhook_url')
        .eq('id', 1)
        .single();

      if (settings?.notification_webhook_url) {
        await fetch(settings.notification_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📡 **UNAUTHORIZED TRANSMISSION REQUEST**\nUser **${user.email}** is requesting upload authorization.\nApprove here: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://immortalraindrops.art'}/godmode`,
            username: 'IMMORTAL_ALERTS',
          }),
        });
      }
    } catch (e) {
      console.warn('[AUTH] Webhook notification failed:', e);
    }

    // 3. Trigger Email Notification via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Immortal Alerts <onboarding@resend.dev>',
          to: 'immortalraindrops@gmail.com',
          subject: '📡 TRANSMISSION_REQUEST: AUTHORIZATION_REQUIRED',
          html: `
            <div style="font-family: monospace; background: #000; color: #ECEEDF; padding: 40px; border: 1px solid #ECEEDF33;">
              <h1 style="border-bottom: 1px solid #ECEEDF33; padding-bottom: 20px; font-size: 20px; letter-spacing: 0.2em;">SYSTEM_ALERT: ACCESS_REQUEST</h1>
              <p style="margin-top: 30px; letter-spacing: 0.1em;">Operator at <strong>${user.email}</strong> is requesting upload authorization.</p>
              <div style="margin-top: 40px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://immortalraindrops.art'}/godmode" 
                   style="display: inline-block; background: #ECEEDF; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 0.2em;">
                  [ ENTER_COMMAND_CENTER ]
                </a>
              </div>
              <p style="margin-top: 40px; color: #ECEEDF55; font-size: 10px; letter-spacing: 0.1em;">ID: ${user.id} // TS: ${new Date().toISOString()}</p>
            </div>
          `
        });
      } catch (e) {
        console.warn('[AUTH] Email notification failed:', e);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH] Access Request Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleAuthorization(userId: string, currentStatus: boolean) {
  try {
    await verifyAdmin();

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_authorized: !currentStatus,
        access_requested: false // Clear request on change
      })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/godmode');
    return { success: true };
  } catch (error) {
    console.error('[GODMODE] Authorization Toggle Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleGodmode(userId: string, currentStatus: boolean) {
  try {
    await verifyAdmin();

    // 1. Check if target is the CEO
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (targetUser?.username === 'immortalraindropsceo') {
      return { success: false, error: 'IMMORTAL CEO CANNOT BE DEMOTED.' };
    }

    // 2. Perform Toggle
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_godmode: !currentStatus })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/godmode');
    return { success: true };
  } catch (error) {
    console.error('[GODMODE] Godmode Toggle Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateSubmissionStatus(id: string, status: string, admin_notes: string) {
  try {
    await verifyAdmin();
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ status, admin_notes, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// ARCHIVE MANAGEMENT
// ==========================================

/** Approve a submission and add it to the public archive (tracks table). */
export async function approveToArchive(submissionId: string) {
  try {
    await verifyAdmin();

    // 1. Fetch the submission
    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    if (fetchErr || !sub) throw new Error(fetchErr?.message || 'Submission not found');

    // 2. Extract file extensions from R2 paths (e.g. "audio/uuid.mp3" → "mp3")
    const audioExt = sub.audio_url
      ? sub.audio_url.split('.').pop()?.toLowerCase() || null
      : null;
    const imageExt = sub.image_url
      ? sub.image_url.split('.').pop()?.toLowerCase() || null
      : null;

    // 3. Use the submission's own id as the tile_id (stable unique identifier)
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('tracks')
      .insert([{
        title: sub.title,
        artist: sub.artist_name || null,
        genre: sub.genre || null,
        media_type: sub.media_type || 'song',
        tile_id: sub.id,          // reuse submission UUID as tile reference
        audio_ext: audioExt,
        image_ext: imageExt,
      }])
      .select()
      .single();
    if (insertErr) throw insertErr;

    // 4. Mark submission as approved
    await supabaseAdmin
      .from('submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);

    revalidatePath('/godmode');
    return { success: true, trackId: inserted?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


/** Delete a track from the archive (tracks table). */
export async function deleteTrackFromArchive(trackId: string) {
  try {
    await verifyAdmin();

    const { error } = await supabaseAdmin
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** List all tracks in the archive. */
export async function getArchiveTracks() {
  try {
    await verifyAdmin();
    const { data, error } = await supabaseAdmin
      .from('tracks')
      .select('id, title, artist, genre, media_type, audio_url, image_url, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, tracks: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, tracks: [] };
  }
}

/** Approve a submission and add it to the radio playlist (playlist_tracks table). */
export async function approveToPlaylist(submissionId: string) {
  try {
    await verifyAdmin();

    // 1. Fetch the submission
    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    if (fetchErr || !sub) throw new Error(fetchErr?.message || 'Submission not found');

    if (!sub.audio_url) throw new Error('Submission has no audio URL');

    // 2. Insert into playlist_tracks table
    const audioUrl = `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/${sub.audio_url}`;
    const { error: insertErr } = await supabaseAdmin
      .from('playlist_tracks')
      .insert([{
        title: sub.title,
        artist_name: sub.artist_name || null,
        audio_url: audioUrl,
        featured: false,
        active: true,
      }]);
    if (insertErr) throw insertErr;

    // 3. Mark submission as approved
    await supabaseAdmin
      .from('submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);

    revalidatePath('/godmode');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


// ==========================================
// BROADCAST CONTROL: Liquidsoap Commands
// ==========================================

const COMMAND_API_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/radio/command`
  : 'https://immortalraindrops.art/api/radio/command';

async function sendRadioCommand(command: string): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const secret = process.env.LIVE_STATUS_WEBHOOK_SECRET;
    if (!secret) throw new Error('LIVE_STATUS_WEBHOOK_SECRET not configured');

    const res = await fetch(COMMAND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret,
      },
      body: JSON.stringify({ command }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true, result: data.result };
  } catch (err: any) {
    console.error('[BROADCAST] Command failed:', err);
    return { success: false, error: err.message };
  }
}

export async function radioSkipTrack() {
  await verifyAdmin();
  return sendRadioCommand('radio.skip');
}

export async function radioSkipFeatured() {
  await verifyAdmin();
  return sendRadioCommand('featured.skip');
}

export async function radioSkipNormal() {
  await verifyAdmin();
  return sendRadioCommand('normal.skip');
}

export async function radioGetStatus() {
  await verifyAdmin();
  return sendRadioCommand('broadcast.status');
}

export async function radioGetNowPlaying() {
  await verifyAdmin();
  return sendRadioCommand('broadcast.now_playing');
}

export async function radioSubmitFeaturedQueue(track: { url: string; title: string; artist: string }) {
  try {
    await verifyAdmin();
    const secret = process.env.LIVE_STATUS_WEBHOOK_SECRET;
    if (!secret) throw new Error('LIVE_STATUS_WEBHOOK_SECRET not configured');

    const submitUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/radio/featured/submit`
      : 'https://immortalraindrops.art/api/radio/featured/submit';

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret,
      },
      body: JSON.stringify(track),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit track');

    return { success: true, queue: data.queue };
  } catch (err: any) {
    console.error('[BROADCAST] Submit to queue failed:', err);
    return { success: false, error: err.message };
  }
}

export async function radioGetFeaturedQueue() {
  try {
    await verifyAdmin();
    const secret = process.env.LIVE_STATUS_WEBHOOK_SECRET;
    if (!secret) throw new Error('LIVE_STATUS_WEBHOOK_SECRET not configured');

    const queueUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/radio/featured/queue`
      : 'https://immortalraindrops.art/api/radio/featured/queue';

    const res = await fetch(queueUrl, {
      method: 'GET',
      headers: {
        'X-Admin-Secret': secret,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get queue');

    return { success: true, queue: data.queue };
  } catch (err: any) {
    console.error('[BROADCAST] Get queue failed:', err);
    return { success: false, error: err.message, queue: [] };
  }
}



'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface PlaylistTrack {
  id?: string;
  title: string;
  artist_name?: string;
  audio_url: string;
  featured?: boolean;
  active?: boolean;
  created_at?: string;
  uploaded_by?: string;
}

// Helper: Verify Godmode
async function verifyGodmode() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_godmode')
    .eq('id', user.id)
    .single();

  if (!profile?.is_godmode) {
    throw new Error('Forbidden: Godmode Access Required');
  }

  return { supabase, user };
}

export async function getPlaylistTracks() {
  try {
    const { supabase } = await verifyGodmode();
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, tracks: data };
  } catch (error: any) {
    return { success: false, error: error.message, tracks: [] };
  }
}

export async function createPlaylistTrack(track: {
  title: string;
  artist_name?: string;
  audio_url: string;
  featured?: boolean;
}) {
  try {
    const { supabase, user } = await verifyGodmode();

    const { error } = await supabase
      .from('playlist_tracks')
      .insert([{
        title: track.title,
        artist_name: track.artist_name || null,
        audio_url: track.audio_url,
        featured: track.featured || false,
        uploaded_by: user.id,
      }]);

    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePlaylistFeatured(trackId: string, currentValue: boolean) {
  try {
    const { supabase } = await verifyGodmode();

    const { error } = await supabase
      .from('playlist_tracks')
      .update({ featured: !currentValue })
      .eq('id', trackId);

    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePlaylistActive(trackId: string, currentValue: boolean) {
  try {
    const { supabase } = await verifyGodmode();

    const { error } = await supabase
      .from('playlist_tracks')
      .update({ active: !currentValue })
      .eq('id', trackId);

    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePlaylistTrack(trackId: string) {
  try {
    const { supabase } = await verifyGodmode();

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('id', trackId);

    if (error) throw error;
    revalidatePath('/godmode');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

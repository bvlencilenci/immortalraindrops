'use server';

import { tracks } from '../data/tracks';
import { Track } from '../types';
import { supabase } from '../lib/supabase';

export async function getTracks(): Promise<Track[]> {
  try {
    // Select specific columns to ensure we get exactly what we need
    const { data, error } = await supabase
      .from('tracks')
      .select('id, created_at, title, artist, genre, media_type, tile_id, audio_ext, image_ext, tile_index, release_date, duration')
      .order('tile_index', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return tracks; // Fallback to static data on error
    }

    if (!data || data.length === 0) {
      console.warn('Supabase returned no content. Using static fallback.');
      return tracks;
    }

    // Map strict schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id.toString(),
      created_at: row.created_at || new Date().toISOString(),
      title: row.title,
      artist: row.artist,
      genre: row.genre,
      media_type: row.media_type,
      tile_id: row.tile_id,
      audio_ext: row.audio_ext,
      image_ext: row.image_ext,
      tile_index: row.tile_index,
      release_date: row.release_date,
      duration: row.duration || '0:00'
    }));
  } catch (error) {
    console.error('Unexpected error fetching tracks:', error);
    return tracks;
  }
}

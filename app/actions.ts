'use server';

import { tracks } from '../data/tracks';
import { Track } from '../types';

export async function getTracks(): Promise<Track[]> {
  const { DB } = process.env as Record<string, any>;

  if (!DB) {
    console.warn('D1 Database binding not found. Using static data.');
    // Simulate async
    return new Promise((resolve) => setTimeout(() => resolve(tracks), 100));
  }

  try {
    // 2. Select strictly and order by tile_index
    const { results } = await DB.prepare(
      `SELECT * FROM tracks ORDER BY tile_index ASC`
    ).all();

    if (!results || results.length === 0) {
      return tracks;
    }

    // Map strict schema
    return results.map((row: any) => ({
      id: row.id.toString(),
      created_at: row.created_at || new Date().toISOString(),
      title: row.title,
      artist: row.artist,
      genre: row.genre,
      media_type: row.media_type,
      audio_key: row.audio_key,
      image_key: row.image_key,
      tile_index: row.tile_index,
      release_date: row.release_date,
      duration: row.duration || '0:00'
    }));
  } catch (error) {
    console.error('Failed to fetch tracks from D1:', error);
    return tracks;
  }
}

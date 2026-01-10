'use server';

import { tracks as staticTracks, Track } from '../data/tracks';

// Simplified D1 Interface for TypeScript
interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement; // eslint-disable-line @typescript-eslint/no-explicit-any
  all: <T = any>() => Promise<D1Result<T>>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  // eslint-disable-line @typescript-eslint/no-explicit-any
  meta: any;
}

export async function getTracks(): Promise<Track[]> {
  try {
    const DB = process.env.DB as unknown as D1Database;

    if (DB && typeof DB.prepare === 'function') {
      const { results } = await DB.prepare(
        `SELECT id, title, artist, genre, media_type, audio_key, image_key, tile_index, duration 
         FROM tracks 
         ORDER BY tile_index ASC`
      ).all();

      if (results && results.length > 0) {
        const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

        // eslint-disable-line @typescript-eslint/no-explicit-any
        const mappedTracks = results.map((row: any) => {
          const audioUrl = row.audio_key
            ? `${r2BaseUrl}/${row.audio_key}`
            : '';

          const imageUrl = row.image_key
            ? `${r2BaseUrl}/${row.image_key}`
            : '/images/placeholder.jpg';

          return {
            id: row.id || `track-${Math.random()}`,
            title: row.title || 'Untitled',
            artist: row.artist || 'Unknown',
            genre: row.genre,
            media_type: row.media_type || 'song', // Default to song
            audio_key: row.audio_key,
            image_key: row.image_key,
            // Map to app state props
            coverImage: imageUrl,
            duration: row.duration || '0:00',
            url: audioUrl,
            tileIndex: row.tile_index
          };
        });

        // Fill in gaps? For now just return what we have. 
        // The user mentioned "If a specific tile_index has no database entry, render a placeholder 'Locked' tile state."
        // This logic is best handled in the UI mapping or by pre-filling the array here to matching standard grid size (e.g. 6).
        return mappedTracks;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch tracks from D1 DB. Falling back to static data.", error);
  }

  return staticTracks;
}

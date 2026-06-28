'use server';

import { Track } from '../types';
import { supabase } from '../lib/supabase';

const AUDIO_MEDIA_TYPES = new Set(['song', 'dj set', 'audio']);

const AUDIO_EXTENSIONS = new Set([
  'aac',
  'aif',
  'aiff',
  'alac',
  'flac',
  'm4a',
  'mp3',
  'ogg',
  'opus',
  'wav',
  'webm',
]);

const formatDuration = (duration: unknown): string | null => {
  if (duration === null || duration === undefined || duration === '') return null;

  if (typeof duration === 'string') {
    if (duration.includes(':')) return duration;
    const parsed = Number(duration);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    duration = parsed;
  }

  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) return null;

  const totalSeconds = Math.round(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const isAudioArchiveRow = (row: { media_type?: string | null; audio_ext?: string | null }) => {
  const mediaType = (row.media_type || '').toLowerCase();
  const audioExt = (row.audio_ext || '').toLowerCase();

  if (mediaType === 'video' || mediaType === 'image') return false;
  if (audioExt && AUDIO_EXTENSIONS.has(audioExt)) return true;
  return AUDIO_MEDIA_TYPES.has(mediaType);
};

export async function getTracks(): Promise<Track[]> {
  try {
    // 1. Try fetching from View (includes vote_count)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fetchResult: { data: any[] | null, error: any } = await supabase
      .from('tracks_with_votes')
      .select('id, created_at, title, artist, genre, media_type, tile_id, audio_ext, image_ext, tile_index, release_date, duration, vote_count')
      .order('tile_index', { ascending: true });

    if (fetchResult.error) {
      console.warn('View tracks_with_votes not found, falling back to raw table...', fetchResult.error.message);
      // 2. Fallback to raw table
      const fallbackRes = await supabase
        .from('tracks')
        .select('id, created_at, title, artist, genre, media_type, tile_id, audio_ext, image_ext, tile_index, release_date, duration')
        .order('tile_index', { ascending: true });

      // Manually map vote_count to 0 to satisfy Type
      fetchResult = {
        data: fallbackRes.data ? fallbackRes.data.map(d => ({ ...d, vote_count: 0 })) : null,
        error: fallbackRes.error
      };
    }

    const { data, error } = fetchResult;

    if (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map strict schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks = data.filter(isAudioArchiveRow).map((row: any) => ({
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
      duration: formatDuration(row.duration)
    }));

    // MOCK: Inject Tile 4 if missing (Requested by USER)
    // Mock data removed to reflect true database state

    return tracks;
  } catch (error) {
    console.error('Unexpected error fetching tracks:', error);
    return [];
  }
}

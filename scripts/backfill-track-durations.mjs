import { createClient } from '@supabase/supabase-js';
import { execFile } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) process.env[key] = value;
  });
}

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

function isAudioTrack(track) {
  const mediaType = (track.media_type || '').toLowerCase();
  const audioExt = (track.audio_ext || '').toLowerCase();

  if (mediaType === 'video' || mediaType === 'image') return false;
  if (audioExt && AUDIO_EXTENSIONS.has(audioExt)) return true;
  return AUDIO_MEDIA_TYPES.has(mediaType);
}

function hasDuration(duration) {
  if (duration === null || duration === undefined || duration === '') return false;
  const numeric = Number(duration);
  return Number.isFinite(numeric) && numeric > 0;
}

function buildAudioUrl(track, r2BaseUrl) {
  const ext = track.audio_ext || 'mp3';
  const isSubmissionTile = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(track.tile_id);

  if (isSubmissionTile) {
    return `${r2BaseUrl}/submissions/${track.tile_id}/audio.${ext}`;
  }

  return `${r2BaseUrl}/${track.tile_id}/audio.${ext}`;
}

async function probeDurationSeconds(url) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    url,
  ], { timeout: 30000 });

  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid duration from ffprobe: ${stdout.trim() || 'empty'}`);
  }

  return Math.round(duration);
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const r2BaseUrl =
  process.env.NEXT_PUBLIC_R2_URL ||
  (process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}` : null);

if (!supabaseUrl || !serviceRoleKey || !r2BaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_R2_URL/NEXT_PUBLIC_R2_PUBLIC_DOMAIN.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data: tracks, error } = await supabase
  .from('tracks')
  .select('id, title, artist, media_type, tile_id, audio_ext, duration')
  .order('tile_index', { ascending: true });

if (error) {
  console.error('Failed to load tracks:', error.message);
  process.exit(1);
}

const candidates = (tracks || [])
  .filter(isAudioTrack)
  .filter((track) => !hasDuration(track.duration));

console.log(`Found ${candidates.length} audio tracks missing duration.`);

let updated = 0;
let failed = 0;

for (const track of candidates) {
  const audioUrl = buildAudioUrl(track, r2BaseUrl);

  try {
    const duration = await probeDurationSeconds(audioUrl);
    const { error: updateError } = await supabase
      .from('tracks')
      .update({ duration })
      .eq('id', track.id);

    if (updateError) throw updateError;

    updated += 1;
    console.log(`✓ ${track.artist || 'UNKNOWN'} - ${track.title || track.id}: ${duration}s`);
  } catch (err) {
    failed += 1;
    console.warn(`✕ ${track.artist || 'UNKNOWN'} - ${track.title || track.id}: ${err.message}`);
  }
}

console.log(`Done. Updated ${updated}; failed ${failed}.`);

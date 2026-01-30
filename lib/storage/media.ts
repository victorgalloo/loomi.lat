import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return _supabase;
}

const supabase = { get client() { return getSupabase(); } };

const MEDIA_BUCKET = 'media';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToStorage(
  path: string,
  data: Buffer | Blob,
  contentType: string
): Promise<string | null> {
  const { error } = await supabase.client.storage
    .from(MEDIA_BUCKET)
    .upload(path, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[Storage] Upload error:', error.message);
    return null;
  }

  return getPublicUrl(path);
}

/**
 * Get the public URL for a file in storage
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.client.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(path: string): Promise<boolean> {
  const { data, error } = await supabase.client.storage
    .from(MEDIA_BUCKET)
    .list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop(),
    });

  if (error) {
    console.error('[Storage] List error:', error.message);
    return false;
  }

  const fileName = path.split('/').pop();
  return data.some(file => file.name === fileName);
}

/**
 * Get cached voice audio URL or null if not cached
 */
export async function getCachedVoice(cacheKey: string): Promise<string | null> {
  const path = `voice-cache/${cacheKey}.mp3`;
  const exists = await fileExists(path);

  if (exists) {
    return getPublicUrl(path);
  }

  return null;
}

/**
 * Cache voice audio in storage
 */
export async function cacheVoice(
  cacheKey: string,
  audioBuffer: Buffer
): Promise<string | null> {
  const path = `voice-cache/${cacheKey}.mp3`;
  return uploadToStorage(path, audioBuffer, 'audio/mpeg');
}

/**
 * Get URL for a demo asset (image, video, etc.)
 */
export function getDemoAssetUrl(filename: string): string {
  return getPublicUrl(`demo/${filename}`);
}

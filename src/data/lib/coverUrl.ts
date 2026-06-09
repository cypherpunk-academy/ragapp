import { config } from './config';

/** Bust RN image cache after re-uploading covers (`yarn upload:covers`). Bump in .env. */
const COVER_CACHE_VERSION =
  process.env.EXPO_PUBLIC_COVER_CACHE_VERSION?.trim() || '4';

export function coverImageUri(sourceId: string): string {
  const base = config.supabase.url;
  if (!base) return '';
  return `${base}/storage/v1/object/public/covers/${sourceId}.png?v=${COVER_CACHE_VERSION}`;
}

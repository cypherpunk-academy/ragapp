/**
 * Bookmarks repository — Supabase for manual bookmarks, AsyncStorage-first for last-read position.
 *
 * Last-read position is local-first: written to AsyncStorage immediately,
 * synced to Supabase when online. On launch the most recent timestamp wins.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '../lib/supabase';

export type BookmarkRow = {
  id: string;
  user_id: string;
  paragraph_id: string;
  source_id: string;
  is_last_read: boolean;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
};

const LAST_READ_PREFIX = '@lastRead:';

function lastReadKey(sourceId: string): string {
  return `${LAST_READ_PREFIX}${sourceId}`;
}

export const BookmarkRepository = {
  // ---------------------------------------------------------------------------
  // Last-read position (local-first)
  // ---------------------------------------------------------------------------

  async getLastRead(sourceId: string): Promise<string | null> {
    // Local always wins for speed; sync reconciles later
    const local = await AsyncStorage.getItem(lastReadKey(sourceId));
    if (local) {
      try {
        return (JSON.parse(local) as { paragraphId: string }).paragraphId;
      } catch { /* ignore */ }
    }
    return null;
  },

  async setLastRead(sourceId: string, paragraphId: string): Promise<void> {
    // Write local immediately
    await AsyncStorage.setItem(
      lastReadKey(sourceId),
      JSON.stringify({ paragraphId, ts: Date.now() }),
    );

    // Best-effort Supabase sync
    try {
      const sb = getSupabase();
      const { data: existing } = await sb
        .from('app_bookmarks')
        .select('id')
        .eq('source_id', sourceId)
        .eq('is_last_read', true)
        .maybeSingle();

      if (existing) {
        await sb
          .from('app_bookmarks')
          .update({ paragraph_id: paragraphId, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await sb.from('app_bookmarks').insert({
          source_id: sourceId,
          paragraph_id: paragraphId,
          is_last_read: true,
          is_manual: false,
        });
      }
    } catch { /* offline — local is authoritative */ }
  },

  // ---------------------------------------------------------------------------
  // Manual bookmarks (online-only)
  // ---------------------------------------------------------------------------

  async listManual(sourceId: string): Promise<BookmarkRow[]> {
    const { data, error } = await getSupabase()
      .from('app_bookmarks')
      .select('*')
      .eq('source_id', sourceId)
      .eq('is_manual', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(sourceId: string, paragraphId: string): Promise<BookmarkRow> {
    const { data, error } = await getSupabase()
      .from('app_bookmarks')
      .insert({
        source_id: sourceId,
        paragraph_id: paragraphId,
        is_last_read: false,
        is_manual: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('app_bookmarks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleManualBookmark(sourceId: string, paragraphId: string): Promise<void> {
    const { data: existing } = await getSupabase()
      .from('app_bookmarks')
      .select('id, is_manual')
      .eq('source_id', sourceId)
      .eq('paragraph_id', paragraphId)
      .eq('is_manual', true)
      .maybeSingle();

    if (existing) {
      await BookmarkRepository.delete(existing.id);
    } else {
      await BookmarkRepository.create(sourceId, paragraphId);
    }
  },
};

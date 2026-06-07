/**
 * WatermelonDB ↔ Supabase synchronisation
 *
 * Uses the WatermelonDB `synchronize()` protocol:
 *   pullChanges  → calls RPC `pull_changes(last_pulled_at, schema_version)`
 *   pushChanges  → calls RPC `push_changes(changes, last_pulled_at)`
 *
 * Read-only tables (rag_*) are returned by pull but never pushed.
 * User-owned tables (app_notes, app_bookmarks) are fully bidirectional.
 */
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db/database';
import { getSupabase } from './supabase';
import { config } from './config';

const SCHEMA_VERSION = 10; // keep in sync with db/schema.ts version

export type SyncResult = {
  ok: true;
  pulledAt: number;
} | {
  ok: false;
  error: string;
};

export async function runSync(): Promise<SyncResult> {
  if (!config.supabase.isConfigured) {
    return { ok: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, error: 'Not authenticated' };
  }

  let pulledAt = 0;

  try {
    await synchronize({
      database,

      pullChanges: async ({ lastPulledAt, schemaVersion }) => {
        const { data, error } = await supabase.rpc('pull_changes', {
          last_pulled_at: lastPulledAt ?? 0,
          schema_version: schemaVersion ?? SCHEMA_VERSION,
        });
        if (error) throw new Error(`pull_changes failed: ${error.message}`);
        pulledAt = data.timestamp as number;
        return { changes: data.changes, timestamp: data.timestamp };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        const { error } = await supabase.rpc('push_changes', {
          changes,
          last_pulled_at: lastPulledAt ?? 0,
        });
        if (error) throw new Error(`push_changes failed: ${error.message}`);
      },

      migrationsEnabledAtVersion: 1,
      sendCreatedAsUpdated: false,
    });

    return { ok: true, pulledAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[sync] failed:', msg);
    return { ok: false, error: msg };
  }
}

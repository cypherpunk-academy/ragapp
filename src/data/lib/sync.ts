/**
 * WatermelonDB ↔ ragrun synchronisation
 *
 * Uses the WatermelonDB `synchronize()` protocol:
 *   pullChanges  → POST /app/sync/pull
 *   pushChanges  → POST /app/sync/push
 *
 * Read-only tables (rag_*) are returned by pull but never pushed.
 * User-owned tables (app_notes, app_bookmarks) are fully bidirectional.
 */
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db/database';
import { ragrunRequest } from './ragrun-client';
import { config } from './config';
import { getAccessToken } from './supabase';

const SCHEMA_VERSION = 16; // keep in sync with db/schema.ts version

type SyncPullResponse = {
  changes: Record<string, unknown>;
  timestamp: number;
};

export type SyncResult = {
  ok: true;
  pulledAt: number;
} | {
  ok: false;
  error: string;
};

export async function runSync(): Promise<SyncResult> {
  if (!config.ragrun.isConfigured) {
    return { ok: false, error: 'ragrun not configured' };
  }

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Not authenticated' };
  }

  let pulledAt = 0;

  try {
    await synchronize({
      database,

      pullChanges: async ({ lastPulledAt, schemaVersion }) => {
        const data = await ragrunRequest<SyncPullResponse>('/app/sync/pull', {
          method: 'POST',
          body: {
            last_pulled_at: lastPulledAt ?? 0,
            schema_version: schemaVersion ?? SCHEMA_VERSION,
          },
        });
        pulledAt = data.timestamp;
        return { changes: data.changes, timestamp: data.timestamp };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        await ragrunRequest<void>('/app/sync/push', {
          method: 'POST',
          body: {
            changes,
            last_pulled_at: lastPulledAt ?? 0,
          },
        });
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

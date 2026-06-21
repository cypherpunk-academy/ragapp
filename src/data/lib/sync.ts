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
import { ragrunRequest, RagrunApiError } from './ragrun-client';
import { config } from './config';
import { getAccessToken } from './supabase';
import { ensureSeeded, seedSnapshotTimestamp, withSynchronizeLock } from './seedLoader';

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

function formatSyncError(e: unknown): string {
  if (e instanceof RagrunApiError) {
    const detail = e.message?.trim();
    if (e.status === 500) {
      return detail && detail !== 'Internal Server Error'
        ? `Serverfehler: ${detail}`
        : 'Serverfehler beim Sync — ragrun neu starten (pip install cryptography).';
    }
    if (e.status === 503 && detail) {
      return detail;
    }
    if (e.status === 0) {
      return detail || 'Sync fehlgeschlagen';
    }
    return detail || `HTTP ${e.status}`;
  }
  return e instanceof Error ? e.message : String(e);
}

/** Never send last_pulled_at=0 when the bundled seed catalog is already local. */
function resolveLastPulledAt(lastPulledAt: number | null | undefined): number {
  if (lastPulledAt && lastPulledAt > 0) return lastPulledAt;
  if (seedSnapshotTimestamp > 0) return seedSnapshotTimestamp;
  return 0;
}

export async function runSync(): Promise<SyncResult> {
  if (!config.ragrun.isConfigured) {
    return { ok: false, error: 'ragrun not configured' };
  }

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Not authenticated' };
  }

  try {
    await ensureSeeded();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[seed] before sync failed:', msg);
    return { ok: false, error: `Seed fehlgeschlagen: ${msg}` };
  }

  const paragraphCount = await database.get('paragraphs').query().fetchCount();
  if (paragraphCount === 0) {
    return { ok: false, error: 'Buchkatalog fehlt — npm run seed:fetch ausführen und App neu bauen.' };
  }

  let pulledAt = 0;

  try {
    await withSynchronizeLock(async () => {
      await synchronize({
        database,

        pullChanges: async ({ lastPulledAt, schemaVersion }) => {
          const effectiveLastPulled = resolveLastPulledAt(lastPulledAt);
          if (effectiveLastPulled === 0) {
            throw new RagrunApiError('Sync-Zeitstempel fehlt.', 0);
          }

          const data = await ragrunRequest<SyncPullResponse>('/app/sync/pull', {
            method: 'POST',
            body: {
              last_pulled_at: effectiveLastPulled,
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
              last_pulled_at: resolveLastPulledAt(lastPulledAt),
            },
          });
        },

        migrationsEnabledAtVersion: 1,
        sendCreatedAsUpdated: false,
      });
    });

    return { ok: true, pulledAt };
  } catch (e) {
    const msg = formatSyncError(e);
    console.warn('[sync] failed:', msg);
    return { ok: false, error: msg };
  }
}

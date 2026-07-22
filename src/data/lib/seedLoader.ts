/**
 * Applies a pre-built Supabase snapshot to WatermelonDB on first install.
 *
 * The snapshot is generated at build time via:
 *   npm run seed:fetch
 *
 * It contains only read-only content (sources, paragraphs).
 * WatermelonDB's synchronize() handles record creation and sets last_pulled_at
 * to the snapshot timestamp, so the first real sync only fetches the delta.
 */
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db/database';
import snapshot from '../../../assets/seed/db-snapshot.json';

export const seedSnapshotTimestamp = snapshot.timestamp;

const UUID_PARAGRAPH_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Bundled snapshot may predate rag_paragraphs UUID ids — never seed composite `source:seg:num` rows. */
function uuidParagraphChangesFromSnapshot(): Record<string, unknown> | undefined {
  const raw = (snapshot.changes as { paragraphs?: { created?: { id?: string }[]; updated?: unknown[]; deleted?: unknown[] } })
    .paragraphs;
  if (!raw) return undefined;
  const created = (raw.created ?? []).filter((p) => p.id && UUID_PARAGRAPH_ID.test(p.id));
  if (created.length === 0) return undefined;
  return { created, updated: raw.updated ?? [], deleted: raw.deleted ?? [] };
}

/** Serialize all WatermelonDB synchronize() calls — they are not re-entrant. */
let synchronizeQueue: Promise<void> = Promise.resolve();

export function withSynchronizeLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = synchronizeQueue.then(() => fn());
  synchronizeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let seedPromise: Promise<void> | null = null;

async function seedIfEmptyInternal(): Promise<void> {
  if (snapshot.timestamp === 0) return;

  const sourceCount = await database.get('sources').query().fetchCount();
  const paragraphCount = await database.get('paragraphs').query().fetchCount();
  if (sourceCount > 0 && paragraphCount > 0) return;

  const paragraphChanges = uuidParagraphChangesFromSnapshot();
  const changes: Record<string, unknown> = {
    sources: (snapshot.changes as { sources: unknown }).sources,
    ...(paragraphChanges ? { paragraphs: paragraphChanges } : {}),
  };

  if (!changes.sources) return;

  await synchronize({
    database,
    pullChanges: async () => ({
      changes,
      timestamp: snapshot.timestamp,
    }),
    pushChanges: async () => {},
    migrationsEnabledAtVersion: 1,
    sendCreatedAsUpdated: false,
  });
}

/** Idempotent; concurrent callers share one in-flight seed. */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = withSynchronizeLock(() => seedIfEmptyInternal()).catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

export async function seedIfEmpty(): Promise<void> {
  return ensureSeeded();
}

export async function seedDemoContributionsIfEmpty(): Promise<void> {
  // No-op — talks/turns/references come from Supabase sync.
}

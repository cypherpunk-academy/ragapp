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

export async function seedIfEmpty(): Promise<void> {
  // snapshot.timestamp === 0 means the snapshot has not been generated yet
  if (snapshot.timestamp === 0) return;

  const count = await database.get('sources').query().fetchCount();
  if (count > 0) return;

  await synchronize({
    database,
    pullChanges: async () => ({
      changes: snapshot.changes as any,
      timestamp: snapshot.timestamp,
    }),
    pushChanges: async () => {},
    migrationsEnabledAtVersion: 1,
    sendCreatedAsUpdated: false,
  });
}

export async function seedDemoContributionsIfEmpty(): Promise<void> {
  // No-op — talks/turns/references come from Supabase sync.
}

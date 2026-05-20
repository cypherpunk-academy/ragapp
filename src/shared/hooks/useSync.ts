/**
 * useSync — triggers WatermelonDB ↔ Supabase sync and exposes status.
 *
 * Usage:
 *   const { syncing, lastSyncedAt, lastError, sync } = useSync();
 */
import { useState, useCallback } from 'react';
import { runSync } from '@/data/lib/sync';

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'done'; pulledAt: number }
  | { state: 'error'; error: string };

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' });

  const sync = useCallback(async () => {
    if (status.state === 'syncing') return;
    setStatus({ state: 'syncing' });
    const result = await runSync();
    if (result.ok) {
      setStatus({ state: 'done', pulledAt: result.pulledAt });
    } else {
      setStatus({ state: 'error', error: result.error });
    }
  }, [status.state]);

  return {
    syncing: status.state === 'syncing',
    lastSyncedAt: status.state === 'done' ? status.pulledAt : null,
    lastError: status.state === 'error' ? status.error : null,
    sync,
  };
}

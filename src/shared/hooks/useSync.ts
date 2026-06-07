/**
 * useSync — triggers WatermelonDB ↔ Supabase sync and exposes status.
 *
 * lastSyncedAt is persisted in AsyncStorage so it survives navigation/unmount.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runSync } from '@/data/lib/sync';

const LAST_SYNCED_KEY = 'sync:lastSyncedAt';

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'done'; pulledAt: number }
  | { state: 'error'; error: string };

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' });

  // Load persisted timestamp on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNCED_KEY).then((val) => {
      if (val) setStatus({ state: 'done', pulledAt: Number(val) });
    });
  }, []);

  const sync = useCallback(async () => {
    if (status.state === 'syncing') return;
    setStatus({ state: 'syncing' });
    const result = await runSync();
    if (result.ok) {
      await AsyncStorage.setItem(LAST_SYNCED_KEY, String(result.pulledAt));
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

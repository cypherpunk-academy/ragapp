import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { checkForUpdate } from '@/data/lib/booksDb';

/**
 * Checks for corpus OTA updates on mount and when the app returns
 * to the foreground. Runs silently — no UI unless the caller
 * observes the optional onUpdated callback.
 */
export function useCorpusUpdate(onUpdated?: (from: number, to: number) => void) {
  const checking = useRef(false);

  useEffect(() => {
    async function check() {
      if (checking.current) return;
      checking.current = true;
      try {
        const result = await checkForUpdate();
        if (result.updated) {
          onUpdated?.(result.from, result.to);
        } else {
          console.log(`[corpus-ota] skip: ${result.reason}`);
        }
      } catch (err) {
        console.warn('[corpus-ota] error:', err);
      } finally {
        checking.current = false;
      }
    }

    // Check on mount
    void check();

    // Check when app comes back to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => sub.remove();
  }, [onUpdated]);
}

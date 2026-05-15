import { useCallback, useEffect, useState } from 'react';
import { RagrunApiError } from '@/lib/ragrun-client';
import { ragrunApi } from '@/services/ragrunApi';

type HealthState = {
  online: boolean;
  loading: boolean;
  error: string | null;
};

export function useRagrunHealth(pollIntervalMs?: number) {
  const [state, setState] = useState<HealthState>({
    online: false,
    loading: true,
    error: null,
  });

  const check = useCallback(async () => {
    if (!ragrunApi.isAvailable()) {
      setState({ online: false, loading: false, error: 'ragrun not configured' });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const health = await ragrunApi.health();
      const online = health.online ?? health.status === 'ok';
      setState({ online, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof RagrunApiError ? err.message : err instanceof Error ? err.message : 'Unknown error';
      setState({ online: false, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    check();
    if (!pollIntervalMs) return;
    const id = setInterval(check, pollIntervalMs);
    return () => clearInterval(id);
  }, [check, pollIntervalMs]);

  return { ...state, refresh: check };
}

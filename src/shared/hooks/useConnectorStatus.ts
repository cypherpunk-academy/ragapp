import { useState, useEffect, useCallback } from 'react';
import { getAccessToken } from '@/data/lib/supabase';
import { config } from '@/data/lib/config';

export type ConnectorStatus = 'not_connected' | 'connected_unused' | 'connected' | 'revoked' | 'loading';

type ConnectorStatusResult = {
  status: ConnectorStatus;
  lastActive?: string;
  refresh: () => void;
};

export function useConnectorStatus(): ConnectorStatusResult {
  const [status, setStatus] = useState<ConnectorStatus>('loading');
  const [lastActive, setLastActive] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const token = await getAccessToken();
      if (!token) { setStatus('not_connected'); return; }

      const res = await fetch(`${config.ragrunUrl}/app/claude-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setStatus('not_connected'); return; }

      const data = await res.json() as { status: ConnectorStatus; last_active?: string };
      setStatus(data.status);
      setLastActive(data.last_active);
    } catch {
      setStatus('not_connected');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { status, lastActive, refresh };
}

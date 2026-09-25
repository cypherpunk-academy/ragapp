import { useState, useCallback, useEffect } from 'react';
import { ProtocolRepository, type ProtocolEntryRow } from '@/data/repositories/ProtocolRepository';

export function useProtocol(sourceId: string | null, segmentSlug: string | null) {
  const [entries, setEntries] = useState<ProtocolEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sourceId || !segmentSlug) { setEntries([]); setLoading(false); return; }
    try {
      const list = await ProtocolRepository.list(sourceId, segmentSlug);
      setEntries(list);
    } catch { /* offline */ }
    setLoading(false);
  }, [sourceId, segmentSlug]);

  useEffect(() => { void refresh(); }, [refresh]);

  const append = useCallback(async (entry: {
    entryType: string;
    content: string;
    paragraphId?: string;
    conversationUrl?: string;
  }) => {
    if (!sourceId || !segmentSlug) return;
    const protocol = await ProtocolRepository.getOrCreate(sourceId, segmentSlug);
    await ProtocolRepository.append(protocol.id, entry);
    await refresh();
  }, [sourceId, segmentSlug, refresh]);

  return { entries, loading, append, refresh };
}

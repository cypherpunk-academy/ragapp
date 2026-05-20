import { useEffect, useState } from 'react';
import { ragrunApi } from '@/data/services/ragrunApi';

/**
 * Zeigt `initialText`, falls vorhanden; sonst optional `GET /app/chunks/{id}` (wenn ragrun konfiguriert).
 */
export function useChunkPreviewBody(chunkId: string, sourceId: string, initialText: string): string {
  const [text, setText] = useState(initialText.trim());

  useEffect(() => {
    setText(initialText.trim());
  }, [chunkId, sourceId, initialText]);

  useEffect(() => {
    if (text || !ragrunApi.isAvailable()) return;
    let cancelled = false;
    void ragrunApi
      .getChunk(chunkId, sourceId)
      .then((r) => {
        if (cancelled) return;
        const t = (r.text ?? r.snippet ?? '').trim();
        if (t) setText(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chunkId, sourceId, text]);

  return text;
}

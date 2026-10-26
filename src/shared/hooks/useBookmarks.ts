import { useState, useCallback, useEffect } from 'react';
import { BookmarkRepository, type BookmarkRow } from '@/data/repositories/BookmarkRepository';

export function useBookmarks(sourceId: string | null) {
  const [lastRead, setLastReadState] = useState<string | null>(null);
  const [manual, setManual] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sourceId) { setLoading(false); return; }
    try {
      const [lr, m] = await Promise.all([
        BookmarkRepository.getLastRead(sourceId),
        BookmarkRepository.listManual(sourceId).catch(() => [] as BookmarkRow[]),
      ]);
      setLastReadState(lr);
      setManual(m);
    } catch { /* offline */ }
    setLoading(false);
  }, [sourceId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const setLastRead = useCallback(async (paragraphId: string) => {
    if (!sourceId) return;
    setLastReadState(paragraphId);
    await BookmarkRepository.setLastRead(sourceId, paragraphId);
  }, [sourceId]);

  const addBookmark = useCallback(async (paragraphId: string) => {
    if (!sourceId) return;
    await BookmarkRepository.create(sourceId, paragraphId);
    await refresh();
  }, [sourceId, refresh]);

  const toggleBookmark = useCallback(async (paragraphId: string) => {
    if (!sourceId) return;
    await BookmarkRepository.toggleManualBookmark(sourceId, paragraphId);
    await refresh();
  }, [sourceId, refresh]);

  return { lastRead, manual, loading, setLastRead, addBookmark, toggleBookmark, refresh };
}

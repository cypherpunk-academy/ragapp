import { useState, useCallback, useEffect } from 'react';
import { NoteRepository, type NoteRow } from '@/data/repositories/NoteRepository';

export type NotesStatus = 'loading' | 'ready' | 'error';

export function useNotes(filter?: { sourceId?: string; segmentSlug?: string; paragraphId?: string }) {
  const [data, setData] = useState<NoteRow[]>([]);
  const [status, setStatus] = useState<NotesStatus>('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const notes = await NoteRepository.list(filter);
      setData(notes);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [filter?.sourceId, filter?.segmentSlug, filter?.paragraphId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, status, refresh };
}

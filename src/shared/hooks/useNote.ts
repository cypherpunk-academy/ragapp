import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NoteRepository, type NoteRow, type SaveResult } from '@/data/repositories/NoteRepository';

export type NoteStatus = 'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'offline';

export type NoteConflict = {
  currentVersion: number;
  currentContent: string;
  currentTitle: string | null;
};

export function useNote(id: string | null) {
  const [data, setData] = useState<NoteRow | null>(null);
  const [status, setStatus] = useState<NoteStatus>('loading');
  const [conflict, setConflict] = useState<NoteConflict | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestVersion = useRef(0);

  const load = useCallback(async () => {
    if (!id) { setData(null); setStatus('ready'); return; }
    setStatus('loading');
    try {
      const note = await NoteRepository.get(id);
      setData(note);
      if (note) latestVersion.current = note.version;
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (
    content: string,
    opts?: { title?: string; status?: string; changedBy?: string },
  ): Promise<SaveResult | null> => {
    if (!id) return null;
    setStatus('saving');
    try {
      const result = await NoteRepository.save(
        id,
        content,
        latestVersion.current,
        opts?.changedBy,
        opts?.title,
        opts?.status,
      );
      if ('ok' in result && result.ok) {
        latestVersion.current = result.new_version;
        setData((prev) => prev ? { ...prev, content, version: result.new_version, title: opts?.title ?? prev.title } : prev);
        setStatus('saved');
      } else if ('conflict' in result && result.conflict) {
        setConflict({
          currentVersion: result.current_version,
          currentContent: result.current_content,
          currentTitle: result.current_title,
        });
        setStatus('ready');
      } else {
        setStatus('error');
      }
      return result;
    } catch {
      setStatus('error');
      return null;
    }
  }, [id]);

  const debouncedSave = useCallback((
    content: string,
    opts?: { title?: string; status?: string; changedBy?: string },
  ) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void save(content, opts); }, 1000);
  }, [save]);

  // Save on app background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        // Fire save with current data
        if (data) void save(data.content);
      }
    });
    return () => sub.remove();
  }, [save, data]);

  const resolveConflict = useCallback((acceptRemote: boolean) => {
    if (!conflict) return;
    if (acceptRemote) {
      latestVersion.current = conflict.currentVersion;
      setData((prev) => prev ? {
        ...prev,
        content: conflict.currentContent,
        title: conflict.currentTitle ?? prev.title,
        version: conflict.currentVersion,
      } : prev);
    }
    setConflict(null);
  }, [conflict]);

  return { data, status, conflict, save, debouncedSave, resolveConflict, reload: load };
}

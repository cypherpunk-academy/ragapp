import { useEffect, useState } from 'react';
import type Note from '@/db/models/Note';
import { NoteRepository } from '@/repositories/NoteRepository';

export function useNotes(paragraphId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paragraphId) {
      const subscription = NoteRepository.observeAll().subscribe({
        next: (items) => {
          setNotes(items);
          setLoading(false);
        },
        error: () => setLoading(false),
      });
      return () => subscription.unsubscribe();
    }

    let active = true;
    NoteRepository.findByParagraph(paragraphId)
      .then((items) => {
        if (active) setNotes(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paragraphId]);

  return {
    notes,
    loading,
    create: NoteRepository.create,
    update: NoteRepository.update,
    remove: NoteRepository.delete,
  };
}

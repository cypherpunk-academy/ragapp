import { NoteRepository } from '@/data/repositories/NoteRepository';
import * as booksDb from '@/data/lib/booksDb';

export type OrphanParagraphRef = {
  kind: 'note';
  id: string;
  paragraphId: string;
};

export type OrphanParagraphRefsResult = {
  orphans: OrphanParagraphRef[];
  hasOrphans: boolean;
};

/**
 * Finds notes pointing at missing or deprecated paragraphs.
 * Bookmarks are server-side (Supabase) and checked there.
 */
export async function findOrphanParagraphRefs(): Promise<OrphanParagraphRefsResult> {
  const sources = await booksDb.getSources();
  const allParagraphIds = new Set<string>();
  for (const s of sources) {
    const paragraphs = await booksDb.getParagraphsBySource(s.id);
    for (const p of paragraphs) allParagraphIds.add(p.id);
  }

  const orphans: OrphanParagraphRef[] = [];

  const notes = await NoteRepository.list();
  for (const n of notes) {
    if (n.paragraph_id && !allParagraphIds.has(n.paragraph_id)) {
      orphans.push({ kind: 'note', id: n.id, paragraphId: n.paragraph_id });
    }
  }

  return { orphans, hasOrphans: orphans.length > 0 };
}

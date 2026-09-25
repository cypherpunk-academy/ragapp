import { database } from '@/data/db/database';
import Bookmark from '@/data/db/models/Bookmark';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import * as booksDb from '@/data/lib/booksDb';

export type OrphanParagraphRef = {
  kind: 'bookmark' | 'note';
  id: string;
  paragraphId: string;
};

export type OrphanParagraphRefsResult = {
  orphans: OrphanParagraphRef[];
  hasOrphans: boolean;
};

/**
 * Finds bookmarks and notes pointing at missing or deprecated paragraphs.
 */
export async function findOrphanParagraphRefs(): Promise<OrphanParagraphRefsResult> {
  const sources = await booksDb.getSources();
  const allParagraphIds = new Set<string>();
  for (const s of sources) {
    const paragraphs = await booksDb.getParagraphsBySource(s.id);
    for (const p of paragraphs) allParagraphIds.add(p.id);
  }

  const orphans: OrphanParagraphRef[] = [];

  const bookmarks = await database.get<Bookmark>('bookmarks').query().fetch();
  for (const b of bookmarks) {
    if (b.paragraphId && !allParagraphIds.has(b.paragraphId)) {
      orphans.push({ kind: 'bookmark', id: b.id, paragraphId: b.paragraphId });
    }
  }

  const notes = await NoteRepository.list();
  for (const n of notes) {
    if (n.paragraph_id && !allParagraphIds.has(n.paragraph_id)) {
      orphans.push({ kind: 'note', id: n.id, paragraphId: n.paragraph_id });
    }
  }

  return { orphans, hasOrphans: orphans.length > 0 };
}

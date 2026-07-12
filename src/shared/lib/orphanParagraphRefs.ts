import { database } from '@/data/db/database';
import Paragraph from '@/data/db/models/Paragraph';
import Bookmark from '@/data/db/models/Bookmark';
import Note from '@/data/db/models/Note';
import Talk from '@/data/db/models/Talk';
import { Q } from '@nozbe/watermelondb';

export type OrphanParagraphRef = {
  kind: 'bookmark' | 'note' | 'talk';
  id: string;
  paragraphId: string;
};

export type OrphanParagraphRefsResult = {
  orphans: OrphanParagraphRef[];
  hasOrphans: boolean;
};

/**
 * Finds bookmarks, notes, and talks pointing at missing or deprecated paragraphs.
 */
export async function findOrphanParagraphRefs(): Promise<OrphanParagraphRefsResult> {
  const paragraphs = await database.get<Paragraph>('paragraphs').query().fetch();
  const activeIds = new Set(paragraphs.map((p) => p.id));

  const orphans: OrphanParagraphRef[] = [];

  const bookmarks = await database.get<Bookmark>('bookmarks').query().fetch();
  for (const b of bookmarks) {
    if (b.paragraphId && !activeIds.has(b.paragraphId)) {
      orphans.push({ kind: 'bookmark', id: b.id, paragraphId: b.paragraphId });
    }
  }

  const notes = await database.get<Note>('notes').query(Q.where('paragraph_id', Q.notEq(null))).fetch();
  for (const n of notes) {
    if (n.paragraphId && !activeIds.has(n.paragraphId)) {
      orphans.push({ kind: 'note', id: n.id, paragraphId: n.paragraphId });
    }
  }

  const talks = await database.get<Talk>('talks').query().fetch();
  for (const t of talks) {
    const pid = t.kontextParagraphId;
    if (pid && !activeIds.has(pid)) {
      orphans.push({ kind: 'talk', id: t.id, paragraphId: pid });
    }
  }

  return { orphans, hasOrphans: orphans.length > 0 };
}

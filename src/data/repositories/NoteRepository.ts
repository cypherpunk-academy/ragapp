import { Q } from '@nozbe/watermelondb';
import { database, Note } from '../db/database';

const collection = database.get<Note>('notes');

export type CreateNoteResult =
  | { ok: true; note: Note }
  | { ok: false; reason: 'paragraph_occupied'; existingNote: Note };

export type AttachContextResult =
  | { ok: true; note: Note }
  | { ok: false; reason: 'paragraph_occupied'; existingNote: Note };

export const NoteRepository = {
  async findByParagraph(paragraphId: string): Promise<Note[]> {
    return collection.query(Q.where('paragraph_id', paragraphId), Q.sortBy('created_at', Q.desc)).fetch();
  },

  observeAll() {
    return collection.query(Q.sortBy('created_at', Q.desc)).observe();
  },

  /** Allgemeine Arbeitstexte: kein source_id, segment_slug oder paragraph_id — sortiert nach Änderungsdatum. */
  observeGeneral() {
    return collection
      .query(
        Q.where('source_id', null),
        Q.where('segment_slug', null),
        Q.where('paragraph_id', null),
        Q.sortBy('updated_at', Q.desc),
      )
      .observe();
  },

  observeBySource(sourceId: string) {
    return collection.query(Q.where('source_id', sourceId), Q.sortBy('created_at', Q.desc)).observe();
  },

  observeByTalk(talkId: string) {
    return collection.query(Q.where('talk_id', talkId), Q.sortBy('created_at', Q.desc)).observe();
  },

  async findBySegment(sourceId: string, segmentSlug: string): Promise<Note[]> {
    return collection
      .query(
        Q.where('source_id', sourceId),
        Q.where('segment_slug', segmentSlug),
        Q.where('paragraph_id', null),
        Q.sortBy('created_at', Q.desc),
      )
      .fetch();
  },

  async findBySourceOnly(sourceId: string): Promise<Note[]> {
    return collection
      .query(
        Q.where('source_id', sourceId),
        Q.where('segment_slug', null),
        Q.where('paragraph_id', null),
        Q.sortBy('created_at', Q.desc),
      )
      .fetch();
  },

  async findById(id: string): Promise<Note | null> {
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  /**
   * Neu anlegen. Bei gesetzter `paragraphId` schlägt Anlegen fehl, wenn der Absatz
   * bereits einen Arbeitstext hat — kein stilles Wiederverwenden oder Überschreiben.
   */
  async create(data: {
    userId: string;
    paragraphId?: string;
    segmentSlug?: string;
    sourceId?: string;
    turnId?: string;
    talkId?: string;
    content: string;
  }): Promise<CreateNoteResult> {
    if (data.paragraphId) {
      const existing = (await NoteRepository.findByParagraph(data.paragraphId))[0];
      if (existing) {
        return { ok: false, reason: 'paragraph_occupied', existingNote: existing };
      }
    }

    const note = await database.write(async () =>
      collection.create((n) => {
        n.userId = data.userId;
        n.paragraphId = data.paragraphId ?? null;
        n.segmentSlug = data.segmentSlug ?? null;
        n.sourceId = data.sourceId ?? null;
        n.turnId = data.turnId ?? null;
        n.talkId = data.talkId ?? null;
        n.content = data.content;
        n.isPublic = false;
      }),
    );

    return { ok: true, note };
  },

  async update(note: Note, content: string): Promise<Note> {
    return database.write(async () => note.update((n) => { n.content = content; }));
  },

  async attachToTalk(note: Note, talkId: string | null): Promise<Note> {
    return database.write(async () => note.update((n) => { n.talkId = talkId; }));
  },

  async attachToContext(
    note: Note,
    context: { talkId?: string | null; paragraphId?: string | null; segmentSlug?: string | null; sourceId?: string | null },
  ): Promise<AttachContextResult> {
    if ('paragraphId' in context && context.paragraphId) {
      const occupied = (await NoteRepository.findByParagraph(context.paragraphId))[0];
      if (occupied && occupied.id !== note.id) {
        return { ok: false, reason: 'paragraph_occupied', existingNote: occupied };
      }
    }

    const updated = await database.write(async () =>
      note.update((n) => {
        if ('talkId' in context) n.talkId = context.talkId ?? null;
        if ('paragraphId' in context) n.paragraphId = context.paragraphId ?? null;
        if ('segmentSlug' in context) n.segmentSlug = context.segmentSlug ?? null;
        if ('sourceId' in context) n.sourceId = context.sourceId ?? null;
      }),
    );
    return { ok: true, note: updated };
  },

  async delete(note: Note): Promise<void> {
    return database.write(async () => note.markAsDeleted());
  },
};

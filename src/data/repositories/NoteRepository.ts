import { Q } from '@nozbe/watermelondb';
import { database, Note } from '../db/database';

const collection = database.get<Note>('notes');

export const NoteRepository = {
  async findByParagraph(paragraphId: string): Promise<Note[]> {
    return collection.query(Q.where('paragraph_id', paragraphId), Q.sortBy('created_at', Q.desc)).fetch();
  },

  observeAll() {
    return collection.query(Q.sortBy('created_at', Q.desc)).observe();
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

  async create(data: {
    userId: string;
    paragraphId?: string;
    segmentSlug?: string;
    sourceId?: string;
    turnId?: string;
    talkId?: string;
    content: string;
  }): Promise<Note> {
    return database.write(async () =>
      collection.create((note) => {
        note.userId = data.userId;
        note.paragraphId = data.paragraphId ?? null;
        note.segmentSlug = data.segmentSlug ?? null;
        note.sourceId = data.sourceId ?? null;
        note.turnId = data.turnId ?? null;
        note.talkId = data.talkId ?? null;
        note.content = data.content;
        note.isPublic = false;
      }),
    );
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
  ): Promise<Note> {
    return database.write(async () =>
      note.update((n) => {
        if ('talkId' in context) n.talkId = context.talkId ?? null;
        if ('paragraphId' in context) n.paragraphId = context.paragraphId ?? null;
        if ('segmentSlug' in context) n.segmentSlug = context.segmentSlug ?? null;
        if ('sourceId' in context) n.sourceId = context.sourceId ?? null;
      }),
    );
  },

  async delete(note: Note): Promise<void> {
    return database.write(async () => note.markAsDeleted());
  },
};

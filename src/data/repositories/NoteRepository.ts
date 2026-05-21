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

  async create(data: { userId: string; paragraphId?: string; sourceId?: string; content: string }): Promise<Note> {
    return database.write(async () =>
      collection.create((note) => {
        note.userId = data.userId;
        note.paragraphId = data.paragraphId ?? null;
        note.sourceId = data.sourceId ?? null;
        note.content = data.content;
        note.isPublic = false;
      }),
    );
  },

  async update(note: Note, content: string): Promise<Note> {
    return database.write(async () => note.update((n) => { n.content = content; }));
  },

  async delete(note: Note): Promise<void> {
    return database.write(async () => note.markAsDeleted());
  },
};

import { Q } from '@nozbe/watermelondb';
import { database, Bookmark } from '../db/database';

const collection = database.get<Bookmark>('bookmarks');

export const BookmarkRepository = {
  async findLastRead(sourceId: string): Promise<Bookmark | null> {
    const results = await collection
      .query(Q.where('source_id', sourceId), Q.where('is_last_read', true))
      .fetch();
    return results[0] ?? null;
  },

  observeBySource(sourceId: string) {
    return collection.query(Q.where('source_id', sourceId)).observe();
  },

  async setLastRead(userId: string, sourceId: string, paragraphId: string): Promise<void> {
    await database.write(async () => {
      // Clear existing last-read for this source
      const existing = await collection
        .query(Q.where('source_id', sourceId), Q.where('is_last_read', true))
        .fetch();
      for (const b of existing) {
        await b.update((bm) => { bm.isLastRead = false; });
      }

      // Upsert current paragraph
      const current = await collection
        .query(Q.where('paragraph_id', paragraphId))
        .fetch();
      if (current[0]) {
        await current[0].update((bm) => { bm.isLastRead = true; });
      } else {
        await collection.create((bm) => {
          bm.userId = userId;
          bm.sourceId = sourceId;
          bm.paragraphId = paragraphId;
          bm.isLastRead = true;
        });
      }
    });
  },

  async toggle(userId: string, sourceId: string, paragraphId: string): Promise<void> {
    await database.write(async () => {
      const existing = await collection.query(Q.where('paragraph_id', paragraphId)).fetch();
      if (existing[0]) {
        await existing[0].markAsDeleted();
      } else {
        await collection.create((bm) => {
          bm.userId = userId;
          bm.sourceId = sourceId;
          bm.paragraphId = paragraphId;
          bm.isLastRead = false;
        });
      }
    });
  },
};

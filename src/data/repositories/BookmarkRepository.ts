import { Q } from '@nozbe/watermelondb';
import { tap } from 'rxjs/operators';
import { database, Bookmark } from '../db/database';

const collection = database.get<Bookmark>('bookmarks');

function logBookmark(tag: string, payload: unknown) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[BookmarkRepository] ${tag}`, payload);
  }
}

export const BookmarkRepository = {
  async findLastRead(sourceId: string): Promise<Bookmark | null> {
    const results = await collection
      .query(Q.where('source_id', sourceId), Q.where('is_last_read', true))
      .fetch();
    const row = results[0] ?? null;
    logBookmark('findLastRead', {
      sourceId,
      row: row
        ? { id: row.id, paragraphId: row.paragraphId, isLastRead: row.isLastRead, updatedAt: row.updatedAt }
        : null,
    });
    return row;
  },

  observeBySource(sourceId: string) {
    return collection.query(Q.where('source_id', sourceId)).observe();
  },

  /** Nur Zeilen mit letzter Lesestelle (schlanker als observeBySource). */
  observeLastRead(sourceId: string) {
    return collection
      .query(Q.where('source_id', sourceId), Q.where('is_last_read', true))
      .observe()
      .pipe(
        tap((rows) => {
          logBookmark('observeLastRead', {
            sourceId,
            count: rows.length,
            rows: rows.map((r) => ({
              id: r.id,
              paragraphId: r.paragraphId,
              isLastRead: r.isLastRead,
              updatedAt: r.updatedAt,
            })),
          });
        }),
      );
  },

  observeManualBookmarks(sourceId: string) {
    return collection
      .query(Q.where('source_id', sourceId), Q.where('is_manual', true))
      .observe();
  },

  async toggleManualBookmark(userId: string, sourceId: string, paragraphId: string): Promise<void> {
    await database.write(async () => {
      const existing = await collection
        .query(Q.where('paragraph_id', paragraphId), Q.where('source_id', sourceId))
        .fetch();
      if (existing[0]) {
        await existing[0].update((bm) => {
          bm.isManual = !bm.isManual;
        });
      } else {
        await collection.create((bm) => {
          bm.userId = userId;
          bm.sourceId = sourceId;
          bm.paragraphId = paragraphId;
          bm.isLastRead = false;
          bm.isManual = true;
        });
      }
    });
  },

  async setLastRead(userId: string, sourceId: string, paragraphId: string): Promise<void> {
    logBookmark('setLastRead (before write)', { userId, sourceId, paragraphId });
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
        await current[0].update((bm) => {
          bm.isLastRead = true;
          bm.sourceId = sourceId;
          bm.userId = userId;
        });
      } else {
        await collection.create((bm) => {
          bm.userId = userId;
          bm.sourceId = sourceId;
          bm.paragraphId = paragraphId;
          bm.isLastRead = true;
        });
      }
    });
    logBookmark('setLastRead (after write)', { sourceId, paragraphId });
  },
};

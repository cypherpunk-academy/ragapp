import { Q } from '@nozbe/watermelondb';
import { database, Talk } from '../db/database';

const collection = database.get<Talk>('talks');

export const TalkRepository = {
  observeByUser(userId: string) {
    return collection.query(Q.where('user_id', userId), Q.sortBy('updated_at', Q.desc)).observe();
  },

  async findById(talkId: string): Promise<Talk | null> {
    const results = await collection.query(Q.where('talk_id', talkId)).fetch();
    return results[0] ?? null;
  },

  async create(data: {
    talkId: string;
    userId: string;
    collection?: string;
    title?: string;
    contextMode?: string;
    contextIds?: Record<string, string>;
  }): Promise<Talk> {
    return database.write(async () =>
      collection.create((talk) => {
        talk.talkId = data.talkId;
        talk.userId = data.userId;
        (talk as any).collection = data.collection ?? null;
        (talk as any).title = data.title ?? null;
        (talk as any).contextMode = data.contextMode ?? 'free';
        (talk as any).contextIds = data.contextIds ?? null;
        talk.publishingStatus = 'private';
      }),
    );
  },
};

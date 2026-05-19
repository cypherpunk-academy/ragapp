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

  async findByParagraph(paragraphId: string): Promise<Talk[]> {
    return collection.query(
      Q.where('context_paragraph_id', paragraphId),
      Q.sortBy('updated_at', Q.desc),
    ).fetch();
  },

  observeByParagraph(paragraphId: string) {
    return collection.query(
      Q.where('context_paragraph_id', paragraphId),
      Q.sortBy('updated_at', Q.desc),
    ).observe();
  },

  async create(data: {
    talkId: string;
    userId: string;
    collection?: string;
    title?: string;
    contextMode?: string;
    contextIds?: Record<string, string>;
    contextParagraphId?: string;
    summary?: string;
  }): Promise<Talk> {
    return database.write(async () =>
      collection.create((talk) => {
        talk.talkId = data.talkId;
        talk.userId = data.userId;
        talk.collectionName = data.collection ?? null;
        talk.title = data.title ?? null;
        talk.summary = data.summary ?? null;
        talk.contextMode = data.contextMode ?? 'free';
        talk.contextIds = data.contextIds ?? null;
        talk.contextParagraphId = data.contextParagraphId ?? null;
        talk.publishingStatus = 'private';
      }),
    );
  },
};

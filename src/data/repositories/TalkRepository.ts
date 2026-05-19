import { Q } from '@nozbe/watermelondb';
import { database, Talk, Turn } from '../db/database';

const collection = database.get<Talk>('talks');
const turnsCollection = database.get<Turn>('turns');

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

  async searchLocal(query: string): Promise<Talk[]> {
    const all = await collection.query(Q.sortBy('updated_at', Q.desc)).fetch();
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.summary?.toLowerCase().includes(q),
    );
  },

  observeAll() {
    return collection.query(Q.sortBy('updated_at', Q.desc)).observe();
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

  /**
   * Kopiert ein Gespräch (inkl. aller Turns bis optional maxTurnIndex) in ein neues Gespräch.
   * Läuft in einer einzigen database.write-Transaktion.
   */
  async copyTalk(
    sourceTalkId: string,
    options?: { maxTurnIndex?: number; titleSuffix?: string },
  ): Promise<Talk> {
    const [sourceTalk, sourceTurns] = await Promise.all([
      TalkRepository.findById(sourceTalkId),
      turnsCollection
        .query(Q.where('talk_id', sourceTalkId), Q.sortBy('turn_index', Q.asc))
        .fetch(),
    ]);

    if (!sourceTalk) throw new Error(`Talk nicht gefunden: ${sourceTalkId}`);

    const filteredTurns =
      options?.maxTurnIndex != null
        ? sourceTurns.filter((t) => t.turnIndex <= options.maxTurnIndex!)
        : sourceTurns;

    const newTalkId = uuid();
    const titleSuffix = options?.titleSuffix ?? '(Kopie)';

    return database.write(async () => {
      const newTalk = await collection.create((talk) => {
        talk.talkId = newTalkId;
        talk.userId = sourceTalk.userId;
        talk.collectionName = sourceTalk.collectionName;
        talk.title = sourceTalk.title ? `${sourceTalk.title} ${titleSuffix}` : null;
        talk.summary = sourceTalk.summary;
        talk.contextMode = sourceTalk.contextMode;
        talk.contextIds = sourceTalk.contextIds;
        talk.contextParagraphId = sourceTalk.contextParagraphId;
        talk.publishingStatus = 'private';
      });

      for (const turn of filteredTurns) {
        await turnsCollection.create((t) => {
          t.talkId = newTalkId;
          t.turnIndex = turn.turnIndex;
          t.userMessage = turn.userMessage;
          t.assistantPersonality = turn.assistantPersonality;
          t.assistantMessage = turn.assistantMessage;
          t.chunkIndexMap = turn.chunkIndexMap;
        });
      }

      return newTalk;
    });
  },
};

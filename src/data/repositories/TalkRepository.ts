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

  /** Talk per WatermelonDB-id (= talk_id) laden. */
  async findById(talkId: string): Promise<Talk | null> {
    try {
      return await collection.find(talkId);
    } catch {
      return null;
    }
  },

  /** Findet Talks deren kontext_paragraph_id der Absatz-ID entspricht. */
  async findByParagraph(paragraphId: string): Promise<Talk[]> {
    return collection.query(
      Q.where('kontext_paragraph_id', paragraphId),
      Q.sortBy('updated_at', Q.desc),
    ).fetch();
  },

  observeByParagraph(paragraphId: string) {
    return collection.query(
      Q.where('kontext_paragraph_id', paragraphId),
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
    id?: string;           // WatermelonDB id = talk_id; auto-generated if omitted
    userId: string;
    collection?: string;
    title?: string;
    summary?: string;
    kontextSourceId?: string;
    kontextParagraphId?: string;
    kontextParagraph?: string;
  }): Promise<Talk> {
    return database.write(async () =>
      collection.create((talk: any) => {
        talk._raw.id = data.id ?? uuid();
        talk.userId = data.userId;
        talk.collectionName = data.collection ?? null;
        talk.title = data.title ?? null;
        talk.summary = data.summary ?? null;
        talk.kontextSourceId = data.kontextSourceId ?? null;
        talk.kontextParagraphId = data.kontextParagraphId ?? null;
        talk.kontextParagraph = data.kontextParagraph ?? null;
        talk.publishingStatus = 'personal';
      }),
    );
  },

  /**
   * Kopiert ein Gespräch (inkl. aller Turns bis optional maxTurnIndex) in ein neues Gespräch.
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
      const newTalk = await collection.create((talk: any) => {
        talk._raw.id = newTalkId;
        talk.userId = sourceTalk.userId;
        talk.collectionName = sourceTalk.collectionName;
        talk.title = sourceTalk.title ? `${sourceTalk.title} ${titleSuffix}` : null;
        talk.summary = sourceTalk.summary;
        talk.kontextSourceId = sourceTalk.kontextSourceId;
        talk.kontextParagraphId = sourceTalk.kontextParagraphId;
        talk.kontextParagraph = sourceTalk.kontextParagraph;
        talk.publishingStatus = 'personal';
      });

      for (const turn of filteredTurns) {
        await turnsCollection.create((t) => {
          t.talkId = newTalk.id;
          t.turnIndex = turn.turnIndex;
          t.userMessage = turn.userMessage;
          t.personality = turn.personality;
          t.assistantMessage = turn.assistantMessage;
          t.chunkIndexMap = turn.chunkIndexMap;
        });
      }

      return newTalk;
    });
  },
};

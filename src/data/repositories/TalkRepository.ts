import { Q } from '@nozbe/watermelondb';
import { database, Talk } from '../db/database';
import { ragrunApi } from '../services/ragrunApi';

const collection = database.get<Talk>('talks');

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

  /** Bumpt `updated_at`, z. B. nach einem neuen Turn, damit die Gespräche-Liste nach Aktivität sortiert bleibt. */
  async touch(talkId: string): Promise<void> {
    const talk = await TalkRepository.findById(talkId);
    if (!talk) return;
    await database.write(async () => talk.update(() => {}));
  },

  /** Setzt `kontext_meta` (JSON), z. B. `{ note_id }` beim Verknüpfen eines Arbeitstexts. */
  async setKontextMeta(talkId: string, meta: Record<string, unknown> | null): Promise<void> {
    const talk = await TalkRepository.findById(talkId);
    if (!talk) return;
    await database.write(async () =>
      talk.update((t: any) => {
        t.kontextMeta = meta ? JSON.stringify(meta) : null;
      }),
    );
  },

  /** Welle 5a — Pin toggeln: Server zuerst, dann WDB (bei API-Fehler kein lokaler Drift). */
  async setPinned(talkId: string, pinned: boolean): Promise<void> {
    await ragrunApi.updateTalkSettings(talkId, { pinned });
    const talk = await TalkRepository.findById(talkId);
    if (talk) {
      await database.write(async () =>
        talk.update((t: any) => {
          t.pinned = pinned;
        }),
      );
    }
  },

  /** Welle 5c — Chat/Nachdenken-Modus: lokal sofort sichtbar + serverseitig persistiert. */
  async setMode(talkId: string, mode: string): Promise<void> {
    const talk = await TalkRepository.findById(talkId);
    if (talk) {
      await database.write(async () =>
        talk.update((t: any) => {
          t.mode = mode;
        }),
      );
    }
    await ragrunApi.updateTalkSettings(talkId, { mode });
  },

  /** Welle 5b — „Verdichten": Server hat komprimiert, lokalen Stand nachziehen. */
  async setCompressedUpToTurnIndex(talkId: string, upToTurnIndex: number): Promise<void> {
    const talk = await TalkRepository.findById(talkId);
    if (!talk) return;
    await database.write(async () =>
      talk.update((t: any) => {
        t.compressedUpToTurnIndex = upToTurnIndex;
      }),
    );
  },
};

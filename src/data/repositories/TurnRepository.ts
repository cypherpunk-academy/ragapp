import { Q } from '@nozbe/watermelondb';
import { database, Turn } from '../db/database';

const collection = database.get<Turn>('turns');

export const TurnRepository = {
  observeByTalk(talkId: string) {
    return collection.query(Q.where('talk_id', talkId), Q.sortBy('turn_index', Q.asc)).observe();
  },

  async findFirstByTalk(talkId: string): Promise<Turn | null> {
    const results = await collection.query(
      Q.where('talk_id', talkId),
      Q.sortBy('turn_index', Q.asc),
    ).fetch();
    return results[0] ?? null;
  },

  async findAllByTalk(talkId: string): Promise<Turn[]> {
    return collection.query(
      Q.where('talk_id', talkId),
      Q.sortBy('turn_index', Q.asc),
    ).fetch();
  },

  async findByTalkAndIndex(talkId: string, turnIndex: number): Promise<Turn | null> {
    const results = await collection.query(
      Q.where('talk_id', talkId),
      Q.where('turn_index', turnIndex),
    ).fetch();
    return results[0] ?? null;
  },

  async create(data: {
    talkId: string;
    turnIndex: number;
    userMessage: string;
    assistantPersonality?: string;
    assistantMessage?: string;
    chunkIndexMap?: Record<string, unknown>;
  }): Promise<Turn> {
    return database.write(async () =>
      collection.create((turn) => {
        turn.talkId = data.talkId;
        turn.turnIndex = data.turnIndex;
        turn.userMessage = data.userMessage;
        (turn as any).assistantPersonality = data.assistantPersonality ?? null;
        (turn as any).assistantMessage = data.assistantMessage ?? null;
        (turn as any).chunkIndexMap = data.chunkIndexMap ?? null;
      }),
    );
  },

  async updateAssistantMessage(turn: Turn, message: string): Promise<Turn> {
    return database.write(async () => turn.update((t) => { t.assistantMessage = message; }));
  },
};

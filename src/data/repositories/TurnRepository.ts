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
    chunkIndexMap?: Record<string, unknown> | null;
  }): Promise<Turn> {
    return database.write(async () =>
      collection.create((turn) => {
        turn.talkId = data.talkId;
        turn.turnIndex = data.turnIndex;
        turn.userMessage = data.userMessage;
        turn.assistantPersonality = data.assistantPersonality ?? null;
        turn.assistantMessage = data.assistantMessage ?? null;
        turn.chunkIndexMap = data.chunkIndexMap ? JSON.stringify(data.chunkIndexMap) : null;
      }),
    );
  },

  async updateAssistantMessage(turn: Turn, message: string): Promise<Turn> {
    return database.write(async () => turn.update((t) => { t.assistantMessage = message; }));
  },

  /**
   * Dupliziert alle Turns eines Gesprächs in ein neues.
   * Wird von TalkRepository.copyTalk intern verwendet (innerhalb einer database.write-Transaktion).
   */
  async copyTurnsFromTalk(
    sourceTalkId: string,
    targetTalkId: string,
    maxTurnIndex?: number,
  ): Promise<void> {
    const sourceTurns = await collection
      .query(
        Q.where('talk_id', sourceTalkId),
        ...(maxTurnIndex != null ? [Q.where('turn_index', Q.lte(maxTurnIndex))] : []),
        Q.sortBy('turn_index', Q.asc),
      )
      .fetch();

    await database.write(async () => {
      for (const turn of sourceTurns) {
        await collection.create((t) => {
          t.talkId = targetTalkId;
          t.turnIndex = turn.turnIndex;
          t.userMessage = turn.userMessage;
          t.assistantPersonality = turn.assistantPersonality;
          t.assistantMessage = turn.assistantMessage;
          t.chunkIndexMap = turn.chunkIndexMap;
        });
      }
    });
  },
};

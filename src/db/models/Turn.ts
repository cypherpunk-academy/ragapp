import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export default class Turn extends Model {
  static table = 'turns';

  @field('talk_id')               talkId!: string;
  @field('turn_index')            turnIndex!: number;
  @field('assistant_personality') assistantPersonality!: string | null;
  @field('user_message')          userMessage!: string;
  @field('assistant_message')     assistantMessage!: string | null;
  @json('chunk_index_map', (v) => v ?? null) chunkIndexMap!: Record<string, unknown> | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

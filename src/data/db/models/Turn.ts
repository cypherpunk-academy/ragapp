import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Turn extends Model {
  static table = 'turns';

  @field('talk_id')               talkId!: string;
  @field('turn_index')            turnIndex!: number | null;
  @field('personality')           personality!: string | null;
  @field('user_message')          userMessage!: string | null;
  @field('assistant_message')     assistantMessage!: string | null;
  @field('usage')                 usage!: string | null;          // JSON
  @field('collection')            collectionName!: string | null; // 'collection' conflicts with Model.collection
  @field('chunk_index_map')       chunkIndexMap!: string | null;  // JSON
  @field('kontext_meta')          kontextMeta!: string | null;    // JSON
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

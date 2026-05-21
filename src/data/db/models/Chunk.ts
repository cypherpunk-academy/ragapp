import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Chunk extends Model {
  static table = 'chunks';

  @field('rag_partition') ragPartition!: string;
  @field('chunk_id')      chunkId!: string;
  @field('source_id')     sourceId!: string;
  @field('chunk_type')    chunkType!: string | null;
  @field('language')      language!: string | null;
  @field('importance')    importance!: number | null;
  @field('content_hash')  contentHash!: string | null;
  @field('text')          text!: string | null;
  @field('metadata')      metadata!: string | null;   // JSON
  @field('scope')         scope!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

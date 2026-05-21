import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Reference extends Model {
  static table = 'references';

  @field('turn_id')       turnId!: string;
  @field('ref_index')     refIndex!: number | null;
  @field('chunk_id')      chunkId!: string | null;
  @field('relevance')     relevance!: number | null;
  @field('source_title')  sourceTitle!: string | null;
  @field('segment_title') segmentTitle!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

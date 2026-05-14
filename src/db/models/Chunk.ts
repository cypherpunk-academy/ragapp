import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Chunk extends Model {
  static table = 'chunks';

  @field('chunk_id')     chunkId!: string;
  @field('collection')   collectionName!: string;   // 'collection' conflicts with Model.collection
  @field('source_id')    sourceId!: string;
  @field('segment_id')   segmentId!: string | null;
  @field('chunk_type')   chunkType!: string;
  @field('text')         text!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

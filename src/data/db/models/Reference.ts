import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export type ReferenceKind = 'begriff' | 'zitat' | 'buch' | 'vortrag';

export default class Reference extends Model {
  static table = 'references';

  @field('ref_id')        refId!: string;
  @field('paragraph_id') paragraphId!: string;
  @field('turn_id')       turnId!: string | null;
  @field('chunk_id')      chunkId!: string | null;
  @field('ref_index')     refIndex!: number;
  @field('ref_kind')      refKind!: string | null;
  @field('relevance')     relevance!: number | null;
  @field('source_title')  sourceTitle!: string | null;
  @field('segment_title') segmentTitle!: string | null;
  @field('snippet')       snippet!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

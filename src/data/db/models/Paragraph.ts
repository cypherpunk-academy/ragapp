import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';
import type { ParagraphAnnotations } from '@/shared/types';

export default class Paragraph extends Model {
  static table = 'paragraphs';

  @field('paragraph_id')   paragraphId!: string;
  @field('source_id')      sourceId!: string;
  @field('language')       language!: string | null;
  @field('segment_index')  segmentIndex!: number;
  @field('segment_title')  segmentTitle!: string;
  @field('paragraph_number') paragraphNumber!: number;
  @field('text_raw')       textRaw!: string;
  @json('annotations', (v) => v ?? null) annotations!: ParagraphAnnotations | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

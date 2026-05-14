import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export default class Talk extends Model {
  static table = 'talks';

  @field('talk_id')           talkId!: string;
  @field('user_id')           userId!: string;
  @field('collection')        collectionName!: string | null;  // 'collection' conflicts with Model.collection
  @field('title')             title!: string | null;
  @field('summary')           summary!: string | null;
  @field('context_mode')      contextMode!: string | null;
  @json('context_ids', (v) => v ?? null) contextIds!: Record<string, string> | null;
  @field('publishing_status') publishingStatus!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

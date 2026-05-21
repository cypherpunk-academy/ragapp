import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Talk extends Model {
  static table = 'talks';

  @field('user_id')            userId!: string;          // = Supabase auth.uid()
  @field('user_name')          userName!: string | null; // = Supabase display name
  @field('collection')         collectionName!: string | null;  // 'collection' conflicts with Model.collection
  @field('slug')               slug!: string | null;
  @field('title')              title!: string | null;
  @field('action_id')          actionId!: string | null;
  @field('summary')            summary!: string | null;
  @field('usage')              usage!: string | null;           // JSON
  @field('kontext_meta')       kontextMeta!: string | null;     // JSON
  @field('publishing_status')  publishingStatus!: string;
  @field('bug_description')    bugDescription!: string | null;
  @field('kontext_source_id')  kontextSourceId!: string | null;
  @field('kontext_segment_id') kontextSegmentId!: string | null;
  @field('kontext_paragraph')  kontextParagraph!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Bookmark extends Model {
  static table = 'bookmarks';

  @field('user_id')      userId!: string;
  @field('paragraph_id') paragraphId!: string;
  @field('source_id')    sourceId!: string;
  @field('is_last_read') isLastRead!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

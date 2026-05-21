import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Note extends Model {
  static table = 'notes';

  @field('user_id')      userId!: string;
  @field('paragraph_id') paragraphId!: string | null;
  @field('source_id')    sourceId!: string | null;
  @field('content')      content!: string;
  @field('is_public')    isPublic!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

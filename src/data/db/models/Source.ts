import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Source extends Model {
  static table = 'sources';

  @field('title')      title!: string;
  @field('author')     author!: string;
  @field('language')   language!: string;
  @field('year')       year!: number;
  @field('book_index') bookIndex!: number;
  @field('is_primary') isPrimary!: boolean;
  @field('sort_order')  sortOrder!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

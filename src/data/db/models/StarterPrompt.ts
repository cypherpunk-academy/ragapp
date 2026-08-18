import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class StarterPrompt extends Model {
  static table = 'starter_prompts';

  @field('prompt')     prompt!: string;
  @field('sort_order') sortOrder!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

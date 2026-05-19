import { Q } from '@nozbe/watermelondb';
import { database, Reference } from '../db/database';

const collection = database.get<Reference>('references');

export const ReferenceRepository = {
  async findByParagraph(paragraphId: string): Promise<Reference[]> {
    return collection.query(
      Q.where('paragraph_id', paragraphId),
      Q.sortBy('ref_index', Q.asc),
    ).fetch();
  },

  observeByParagraph(paragraphId: string) {
    return collection.query(
      Q.where('paragraph_id', paragraphId),
      Q.sortBy('ref_index', Q.asc),
    ).observe();
  },

  observeAll() {
    return collection.query(Q.sortBy('created_at', Q.desc)).observe();
  },
};

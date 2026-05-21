import { Q } from '@nozbe/watermelondb';
import { database, Reference } from '../db/database';

const collection = database.get<Reference>('references');

export const ReferenceRepository = {
  async findByTurn(turnId: string): Promise<Reference[]> {
    return collection.query(
      Q.where('turn_id', turnId),
      Q.sortBy('ref_index', Q.asc),
    ).fetch();
  },

  observeByTurn(turnId: string) {
    return collection.query(
      Q.where('turn_id', turnId),
      Q.sortBy('ref_index', Q.asc),
    ).observe();
  },

  observeAll() {
    return collection.query(Q.sortBy('created_at', Q.desc)).observe();
  },
};

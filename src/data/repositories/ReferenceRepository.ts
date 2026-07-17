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

  async findByTurnIds(turnIds: string[]): Promise<Reference[]> {
    if (turnIds.length === 0) return [];
    return collection.query(
      Q.where('turn_id', Q.oneOf(turnIds)),
      Q.sortBy('ref_index', Q.asc),
    ).fetch();
  },

  observeAll() {
    return collection.query(Q.sortBy('created_at', Q.desc)).observe();
  },
};

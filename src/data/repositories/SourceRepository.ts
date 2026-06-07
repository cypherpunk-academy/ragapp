import { Q } from '@nozbe/watermelondb';
import { database, Source } from '../db/database';

const collection = database.get<Source>('sources');

export const SourceRepository = {
  observePrimary() {
    return collection.query(Q.where('is_primary', true), Q.sortBy('sort_order', Q.asc)).observe();
  },

  observeAll() {
    return collection.query().observe();
  },

  async findById(id: string): Promise<Source | null> {
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },
};

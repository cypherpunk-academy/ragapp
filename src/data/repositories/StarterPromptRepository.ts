import { Q } from '@nozbe/watermelondb';
import { database, StarterPrompt } from '../db/database';

const collection = database.get<StarterPrompt>('starter_prompts');

export const StarterPromptRepository = {
  observeAll() {
    return collection.query(Q.sortBy('sort_order', Q.asc)).observe();
  },

  async findAll(): Promise<StarterPrompt[]> {
    return collection.query(Q.sortBy('sort_order', Q.asc)).fetch();
  },
};

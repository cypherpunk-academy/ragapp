import * as booksDb from '../lib/booksDb';

export type { Source } from '../lib/booksDb';

export const SourceRepository = {
  async findAll(): Promise<booksDb.Source[]> {
    return booksDb.getSources();
  },

  async findPrimary(): Promise<booksDb.Source[]> {
    const all = await booksDb.getSources();
    return all.filter((s) => s.is_primary === 1);
  },

  async findById(id: string): Promise<booksDb.Source | null> {
    const all = await booksDb.getSources();
    return all.find((s) => s.id === id) ?? null;
  },
};

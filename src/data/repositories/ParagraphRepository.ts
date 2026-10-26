import * as booksDb from '../lib/booksDb';

export type { Paragraph } from '../lib/booksDb';

export const ParagraphRepository = {
  async findById(id: string): Promise<booksDb.Paragraph | null> {
    return booksDb.getParagraph(id);
  },

  async findBySource(sourceId: string): Promise<booksDb.Paragraph[]> {
    return booksDb.getParagraphsBySource(sourceId);
  },

  async findBySegment(sourceId: string, segmentIndex: number): Promise<booksDb.Paragraph[]> {
    return booksDb.getParagraphsBySegment(sourceId, segmentIndex);
  },

  async findFirstBySegmentSlug(sourceId: string, segmentSlug: string): Promise<booksDb.Paragraph | null> {
    const all = await booksDb.getParagraphsBySource(sourceId);
    return all.find((p) => p.segment_slug === segmentSlug) ?? null;
  },
};

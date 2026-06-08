import { Q } from '@nozbe/watermelondb';
import { database, Paragraph } from '../db/database';

const collection = database.get<Paragraph>('paragraphs');

export const ParagraphRepository = {
  async findById(id: string): Promise<Paragraph | null> {
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  async findBySource(sourceId: string): Promise<Paragraph[]> {
    return collection
      .query(Q.where('source_id', sourceId), Q.sortBy('segment_index', Q.asc), Q.sortBy('paragraph_number', Q.asc))
      .fetch();
  },

  async findBySegment(sourceId: string, segmentIndex: number): Promise<Paragraph[]> {
    return collection
      .query(
        Q.where('source_id', sourceId),
        Q.where('segment_index', segmentIndex),
        Q.sortBy('paragraph_number', Q.asc),
      )
      .fetch();
  },

  observeBySource(sourceId: string) {
    return collection.query(
      Q.where('source_id', sourceId),
      Q.sortBy('segment_index', Q.asc),
      Q.sortBy('paragraph_number', Q.asc),
    ).observe();
  },
};

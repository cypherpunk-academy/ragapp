import { Q } from '@nozbe/watermelondb';
import { database, Paragraph } from '../db/database';
import { paragraphClausesForSource } from './paragraphQuery';

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
      .query(
        ...paragraphClausesForSource(sourceId),
        Q.sortBy('segment_index', Q.asc),
        Q.sortBy('paragraph_number', Q.asc),
      )
      .fetch();
  },

  async findBySegment(sourceId: string, segmentIndex: number): Promise<Paragraph[]> {
    return collection
      .query(
        ...paragraphClausesForSource(sourceId),
        Q.where('segment_index', segmentIndex),
        Q.sortBy('paragraph_number', Q.asc),
      )
      .fetch();
  },

  observeBySource(sourceId: string) {
    return collection.query(
      ...paragraphClausesForSource(sourceId),
      Q.sortBy('segment_index', Q.asc),
      Q.sortBy('paragraph_number', Q.asc),
    ).observe();
  },

  /** Erster Absatz eines Kapitels/Vortrags anhand `segmentSlug` — für Kapitel-Titel/Navigation ohne bekannten `segmentIndex`. */
  async findFirstBySegmentSlug(sourceId: string, segmentSlug: string): Promise<Paragraph | null> {
    const rows = await collection
      .query(
        ...paragraphClausesForSource(sourceId),
        Q.where('segment_slug', segmentSlug),
        Q.sortBy('paragraph_number', Q.asc),
        Q.take(1),
      )
      .fetch();
    return rows[0] ?? null;
  },
};

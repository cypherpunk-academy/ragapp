import { database } from '../db/database';
import seedData from '../../assets/seed/philosophie-der-freiheit.json';

type SeedParagraph = {
  paragraph_id: string;
  source_id: string;
  segment_type: string;
  segment_index: number;
  segment_title: string;
  paragraph_number: number;
  text_raw: string;
  annotations: Record<string, unknown> | null;
};

export async function seedIfEmpty(): Promise<void> {
  const paragraphCollection = database.get('paragraphs');
  const count = await paragraphCollection.query().fetchCount();
  if (count > 0) return;

  await database.write(async () => {
    for (const p of seedData.paragraphs as SeedParagraph[]) {
      await paragraphCollection.create((record: any) => {
        record.paragraphId    = p.paragraph_id;
        record.sourceId       = p.source_id;
        record.bookId         = seedData.book_id;
        record.language       = seedData.language;
        record.segmentType    = p.segment_type;
        record.segmentIndex   = p.segment_index;
        record.segmentTitle   = p.segment_title;
        record.paragraphNumber= p.paragraph_number;
        record.textRaw        = p.text_raw;
        record.annotations    = p.annotations;
      });
    }
  });
}

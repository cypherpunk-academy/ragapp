import {
  buildParagraphById,
  buildSegmentMap,
  noteParagraphNumber,
  noteSegmentSlug,
} from '@/shared/lib/noteContext';
import type { NoteRow } from '@/data/repositories/NoteRepository';
import type { Paragraph } from '@/data/repositories/ParagraphRepository';

function paragraph(partial: Partial<Paragraph> & Pick<Paragraph, 'id'>): Paragraph {
  return {
    source_id: 'book-uuid',
    segment_index: 0,
    segment_slug: 'chapter-0',
    segment_title: 'Kapitel I',
    paragraph_number: 1,
    text_raw: 'Text',
    language: 'de',
    annotations: null,
    ...partial,
  } as Paragraph;
}

function note(partial: Partial<NoteRow> & Pick<NoteRow, 'id'>): NoteRow {
  return {
    paragraph_id: null,
    segment_slug: null,
    source_id: 'book-uuid',
    content: 'Notiz',
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  } as NoteRow;
}

describe('noteContext', () => {
  it('uses stored segment_slug without parsing paragraph_id', () => {
    const n = note({
      id: 'n1',
      paragraph_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      segment_slug: 'chapter-2',
    });
    expect(noteSegmentSlug(n, new Map())).toBe('chapter-2');
  });

  it('falls back to paragraph lookup for segment_slug', () => {
    const pid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const byId = buildParagraphById([
      paragraph({ id: pid, segment_slug: 'chapter-1', paragraph_number: 3 }),
    ]);
    const n = note({ id: 'n1', paragraph_id: pid });
    expect(noteSegmentSlug(n, byId)).toBe('chapter-1');
    expect(noteParagraphNumber(n, byId)).toBe(3);
  });

  it('builds segment map keyed by slug', () => {
    const map = buildSegmentMap([
      paragraph({ id: 'p1', segment_slug: 'ch-a', segment_index: 1, segment_title: 'A' }),
      paragraph({ id: 'p2', segment_slug: 'ch-a', segment_index: 1, segment_title: 'A' }),
      paragraph({ id: 'p3', segment_slug: 'ch-b', segment_index: 2, segment_title: 'B' }),
    ]);
    expect(map.size).toBe(2);
    expect(map.get('ch-a')?.segmentTitle).toBe('A');
  });
});

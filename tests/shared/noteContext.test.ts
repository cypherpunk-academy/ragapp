import {
  buildParagraphById,
  buildSegmentMap,
  noteParagraphNumber,
  noteSegmentSlug,
} from '@/shared/lib/noteContext';
import type Note from '@/data/db/models/Note';
import type Paragraph from '@/data/db/models/Paragraph';

function paragraph(partial: Partial<Paragraph> & Pick<Paragraph, 'id'>): Paragraph {
  return {
    segmentIndex: 0,
    segmentSlug: 'chapter-0',
    segmentTitle: 'Kapitel I',
    paragraphNumber: 1,
    sourceId: 'book-uuid',
    textRaw: 'Text',
    language: 'de',
    annotations: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Paragraph;
}

function note(partial: Partial<Note> & Pick<Note, 'id'>): Note {
  return {
    userId: 'local',
    paragraphId: null,
    segmentSlug: null,
    sourceId: 'book-uuid',
    content: 'Notiz',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Note;
}

describe('noteContext', () => {
  it('uses stored segment_slug without parsing paragraph_id', () => {
    const n = note({
      id: 'n1',
      paragraphId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      segmentSlug: 'chapter-2',
    });
    expect(noteSegmentSlug(n, new Map())).toBe('chapter-2');
  });

  it('falls back to paragraph lookup for segment_slug', () => {
    const pid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const byId = buildParagraphById([
      paragraph({ id: pid, segmentSlug: 'chapter-1', paragraphNumber: 3 }),
    ]);
    const n = note({ id: 'n1', paragraphId: pid });
    expect(noteSegmentSlug(n, byId)).toBe('chapter-1');
    expect(noteParagraphNumber(n, byId)).toBe(3);
  });

  it('builds segment map keyed by slug', () => {
    const map = buildSegmentMap([
      paragraph({ id: 'p1', segmentSlug: 'ch-a', segmentIndex: 1, segmentTitle: 'A' }),
      paragraph({ id: 'p2', segmentSlug: 'ch-a', segmentIndex: 1, segmentTitle: 'A' }),
      paragraph({ id: 'p3', segmentSlug: 'ch-b', segmentIndex: 2, segmentTitle: 'B' }),
    ]);
    expect(map.size).toBe(2);
    expect(map.get('ch-a')?.segmentTitle).toBe('A');
  });
});

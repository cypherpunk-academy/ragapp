import type { NoteRow } from '@/data/repositories/NoteRepository';
import type { Paragraph } from '@/data/repositories/ParagraphRepository';

/** Stable chapter/lecture key for a note — never parse paragraph_id. */
export function noteSegmentSlug(
  note: NoteRow,
  paragraphById: ReadonlyMap<string, Paragraph>,
): string | null {
  if (note.segment_slug) return note.segment_slug;
  if (!note.paragraph_id) return null;
  return paragraphById.get(note.paragraph_id)?.segment_slug ?? null;
}

export function noteParagraphNumber(
  note: NoteRow,
  paragraphById: ReadonlyMap<string, Paragraph>,
): number | null {
  if (!note.paragraph_id) return null;
  return paragraphById.get(note.paragraph_id)?.paragraph_number ?? null;
}

export type SegmentMeta = {
  segmentSlug: string;
  segmentTitle: string;
  segmentIndex: number;
};

export function buildSegmentMap(paragraphs: Paragraph[]): Map<string, SegmentMeta> {
  const map = new Map<string, SegmentMeta>();
  for (const p of paragraphs) {
    if (!p.segment_slug || map.has(p.segment_slug)) continue;
    map.set(p.segment_slug, {
      segmentSlug: p.segment_slug,
      segmentTitle: p.segment_title ?? '',
      segmentIndex: p.segment_index,
    });
  }
  return map;
}

export function buildParagraphById(paragraphs: Paragraph[]): Map<string, Paragraph> {
  return new Map(paragraphs.map((p) => [p.id, p]));
}

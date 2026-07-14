import type Note from '@/data/db/models/Note';
import type Paragraph from '@/data/db/models/Paragraph';

/** Stable chapter/lecture key for a note — never parse paragraph_id. */
export function noteSegmentSlug(
  note: Note,
  paragraphById: ReadonlyMap<string, Paragraph>,
): string | null {
  if (note.segmentSlug) return note.segmentSlug;
  if (!note.paragraphId) return null;
  return paragraphById.get(note.paragraphId)?.segmentSlug ?? null;
}

export function noteParagraphNumber(
  note: Note,
  paragraphById: ReadonlyMap<string, Paragraph>,
): number | null {
  if (!note.paragraphId) return null;
  return paragraphById.get(note.paragraphId)?.paragraphNumber ?? null;
}

export type SegmentMeta = {
  segmentSlug: string;
  segmentTitle: string;
  segmentIndex: number;
};

export function buildSegmentMap(paragraphs: Paragraph[]): Map<string, SegmentMeta> {
  const map = new Map<string, SegmentMeta>();
  for (const p of paragraphs) {
    if (!p.segmentSlug || map.has(p.segmentSlug)) continue;
    map.set(p.segmentSlug, {
      segmentSlug: p.segmentSlug,
      segmentTitle: p.segmentTitle,
      segmentIndex: p.segmentIndex,
    });
  }
  return map;
}

export function buildParagraphById(paragraphs: Paragraph[]): Map<string, Paragraph> {
  return new Map(paragraphs.map((p) => [p.id, p]));
}

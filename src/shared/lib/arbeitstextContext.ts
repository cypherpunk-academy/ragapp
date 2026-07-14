import type Note from '@/data/db/models/Note';

/**
 * Vier Kontext-Stufen für Arbeitstexte (Filo §5.1, §5.4).
 * Reihenfolge = Sortierpriorität ohne aktiven Filter (1 → 4).
 */
export type ArbeitstextContextTier =
  | 'paragraph' // Stufe 1 — Aktueller Absatz
  | 'segment'   // Stufe 2 — Kapitel/Vortrag
  | 'source'    // Stufe 3 — Buch
  | 'general';  // Stufe 4 — Allgemein

export const ARBEITSTEXT_CONTEXT_TIER_LABELS: Record<ArbeitstextContextTier, string> = {
  paragraph: 'Aktueller Absatz',
  segment: 'Kapitel/Vortrag',
  source: 'Buch',
  general: 'Allgemein',
};

const TIER_ORDER: Record<ArbeitstextContextTier, number> = {
  paragraph: 1,
  segment: 2,
  source: 3,
  general: 4,
};

/** Aktuelle Lese-Position (aus `ReadingContext`), inkl. `segmentSlug` des aktuellen Absatzes. */
export type ArbeitstextReadingSnapshot = {
  sourceId: string;
  segmentSlug: string;
  paragraphId: string;
};

type ArbeitstextNoteContext = {
  sourceId: string | null;
  segmentSlug: string | null;
  paragraphId: string | null;
};

/**
 * Ordnet einen Arbeitstext einer Kontext-Stufe zu.
 * Kein Parsen von `segment_index` aus `paragraph_id` — nur `source_id` + `segment_slug` + `paragraph_id`.
 */
export function classifyArbeitstextContext(
  note: ArbeitstextNoteContext,
  reading: ArbeitstextReadingSnapshot | null,
): ArbeitstextContextTier {
  const isGeneral = !note.sourceId && !note.segmentSlug && !note.paragraphId;
  if (isGeneral) return 'general';

  if (reading) {
    if (note.paragraphId && note.paragraphId === reading.paragraphId) return 'paragraph';
    if (note.sourceId === reading.sourceId && note.segmentSlug && note.segmentSlug === reading.segmentSlug) {
      return 'segment';
    }
  }

  if (note.sourceId) return 'source';
  return 'general';
}

export function filterByContextTier(
  notes: Note[],
  tier: ArbeitstextContextTier,
  reading: ArbeitstextReadingSnapshot | null,
): Note[] {
  return notes.filter((n) => classifyArbeitstextContext(n, reading) === tier);
}

/**
 * Sortierung für die Bibliothek (§5.4): ohne aktiven Filter erst Kontext-Stufe (1→4),
 * innerhalb jeder Stufe `updated_at` absteigend; mit aktivem Filter nur Treffer dieser
 * Stufe, sortiert nach `updated_at`.
 */
export function sortArbeitstexte(
  notes: Note[],
  reading: ArbeitstextReadingSnapshot | null,
  activeTier: ArbeitstextContextTier | null,
): Note[] {
  const byUpdatedDesc = (a: Note, b: Note) => b.updatedAt.getTime() - a.updatedAt.getTime();

  if (activeTier) {
    return filterByContextTier(notes, activeTier, reading).sort(byUpdatedDesc);
  }

  return [...notes].sort((a, b) => {
    const ta = TIER_ORDER[classifyArbeitstextContext(a, reading)];
    const tb = TIER_ORDER[classifyArbeitstextContext(b, reading)];
    return ta !== tb ? ta - tb : byUpdatedDesc(a, b);
  });
}

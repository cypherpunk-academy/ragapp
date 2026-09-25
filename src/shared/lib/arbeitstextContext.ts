import type { NoteRow } from '@/data/repositories/NoteRepository';
import i18n from '@/shared/i18n';

/**
 * Vier Kontext-Stufen für Arbeitstexte (Filo §5.1, §5.4).
 * Reihenfolge = Sortierpriorität ohne aktiven Filter (1 → 4).
 */
export type ArbeitstextContextTier =
  | 'paragraph' // Stufe 1 — Aktueller Absatz
  | 'segment'   // Stufe 2 — Kapitel/Vortrag
  | 'source'    // Stufe 3 — Buch
  | 'general';  // Stufe 4 — Allgemein

/** Labels resolved at call time (do not cache at module init). */
export function getArbeitstextContextTierLabels(): Record<ArbeitstextContextTier, string> {
  return {
    paragraph: i18n.t('arbeitstextContext.paragraph'),
    segment: i18n.t('arbeitstextContext.segment'),
    source: i18n.t('arbeitstextContext.source'),
    general: i18n.t('arbeitstextContext.general'),
  };
}

export function arbeitstextContextTierLabel(tier: ArbeitstextContextTier): string {
  return i18n.t(`arbeitstextContext.${tier}`);
}

/** @deprecated Prefer `getArbeitstextContextTierLabels()` / `arbeitstextContextTierLabel()`. */
export const ARBEITSTEXT_CONTEXT_TIER_LABELS = new Proxy(
  {} as Record<ArbeitstextContextTier, string>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop === 'string' && (prop === 'paragraph' || prop === 'segment' || prop === 'source' || prop === 'general')) {
        return i18n.t(`arbeitstextContext.${prop}`);
      }
      return undefined;
    },
  },
);

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
  source_id: string | null;
  segment_slug: string | null;
  paragraph_id: string | null;
};

/**
 * Ordnet einen Arbeitstext einer Kontext-Stufe zu.
 * Kein Parsen von `segment_index` aus `paragraph_id` — nur `source_id` + `segment_slug` + `paragraph_id`.
 */
export function classifyArbeitstextContext(
  note: ArbeitstextNoteContext,
  reading: ArbeitstextReadingSnapshot | null,
): ArbeitstextContextTier {
  const isGeneral = !note.source_id && !note.segment_slug && !note.paragraph_id;
  if (isGeneral) return 'general';

  if (reading) {
    if (note.paragraph_id && note.paragraph_id === reading.paragraphId) return 'paragraph';
    if (note.source_id === reading.sourceId && note.segment_slug && note.segment_slug === reading.segmentSlug) {
      return 'segment';
    }
  }

  if (note.source_id) return 'source';
  return 'general';
}

/**
 * Kontext-Stufe rein anhand der eigenen Verknüpfungsfelder der Note — unabhängig
 * von der aktuellen Leseposition. Für den Verknüpfungs-Breadcrumb (DocumentPreviewOverlay).
 */
export function classifyOwnContextTier(note: ArbeitstextNoteContext): ArbeitstextContextTier {
  if (note.paragraph_id) return 'paragraph';
  if (note.segment_slug) return 'segment';
  if (note.source_id) return 'source';
  return 'general';
}

/** Erste `count` Worte eines Texts, mit „…" falls gekürzt. */
export function firstWords(text: string, count = 6): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= count) return words.join(' ');
  return `${words.slice(0, count).join(' ')}…`;
}

export function filterByContextTier(
  notes: NoteRow[],
  tier: ArbeitstextContextTier,
  reading: ArbeitstextReadingSnapshot | null,
): NoteRow[] {
  return notes.filter((n) => classifyArbeitstextContext(n, reading) === tier);
}

/**
 * Sortierung für die Bibliothek (§5.4): ohne aktiven Filter erst Kontext-Stufe (1→4),
 * innerhalb jeder Stufe `updated_at` absteigend; mit aktivem Filter nur Treffer dieser
 * Stufe, sortiert nach `updated_at`.
 */
export function sortArbeitstexte(
  notes: NoteRow[],
  reading: ArbeitstextReadingSnapshot | null,
  activeTier: ArbeitstextContextTier | null,
): NoteRow[] {
  const byUpdatedDesc = (a: NoteRow, b: NoteRow) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

  if (activeTier) {
    return filterByContextTier(notes, activeTier, reading).sort(byUpdatedDesc);
  }

  return [...notes].sort((a, b) => {
    const ta = TIER_ORDER[classifyArbeitstextContext(a, reading)];
    const tb = TIER_ORDER[classifyArbeitstextContext(b, reading)];
    return ta !== tb ? ta - tb : byUpdatedDesc(a, b);
  });
}

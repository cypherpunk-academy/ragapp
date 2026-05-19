/** Werk-Detail — Metadaten & Demo-Zusammenfassungen (Figma 99:3). */

export const SOURCE_DETAIL = {
  id: 'philosophie-der-freiheit',
  title: 'Die Philosophie der Freiheit',
  author: 'Rudolf Steiner',
  year: '1918',
} as const;

export function sourceEditionLine(): string {
  const { author, year } = SOURCE_DETAIL;
  return `${author.toUpperCase()} · ${year}`;
}

/** Demo-KI-Zusammenfassungen bis rag_chunks chapter_summary angebunden ist. */
export const SEGMENT_SUMMARY_DEMO: Record<number, string> = {
  0: 'Steiner erläutert, warum er das Buch 1918 unverändert neu herausgibt — die Grundfragen der menschlichen Seele und der Freiheit des Willens bleiben für ihn zentral.',
  1: 'Das Kapitel eröffnet die Frage, ob bewusstes Handeln frei ist oder einer naturgesetzlichen Notwendigkeit unterliegt — und warum diese Frage für Moral und Verantwortung grundlegend ist.',
  2: 'Steiner fragt nach dem Grundtrieb der Wissenschaft: Wie entsteht Erkenntnis, und welche Rolle spielt das individuelle Erleben gegenüber abstrakten Weltbildern?',
};

export function segmentIndexFromNoteIds(
  segmentId: string | null,
  paragraphId: string | null,
): number | null {
  if (segmentId) {
    const m = segmentId.match(/:(\d+)$/);
    if (m) return Number.parseInt(m[1], 10);
  }
  if (paragraphId) {
    const parts = paragraphId.split(':');
    if (parts.length >= 2) return Number.parseInt(parts[1], 10);
  }
  return null;
}

export function continueReadingLabel(segmentTitle: string | null): string {
  if (!segmentTitle) return 'WEITERLESEN';
  const short = segmentTitle.replace(/^\s*[IVXLC]+\.\s*/i, '').trim();
  const label = short.length > 36 ? `${short.slice(0, 33)}…` : short;
  return `WEITERLESEN · ${label.toUpperCase()}`;
}

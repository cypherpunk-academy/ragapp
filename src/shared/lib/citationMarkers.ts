/** Bracket-Zitate wie `[1]`, `[7]`, `[1][3]` im Antworttext. */
const CITATION_INDEX_RE = /\[(\d+)\]/g;

export function extractCitedIndices(text: string): Set<number> {
  const indices = new Set<number>();
  for (const match of text.matchAll(CITATION_INDEX_RE)) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) indices.add(n);
  }
  return indices;
}

export function countUniqueCitations(text: string): number {
  return extractCitedIndices(text).size;
}

export type TextSegment =
  | { kind: 'text'; value: string }
  | { kind: 'citation'; value: string; index: number };

/** Zerlegt Fließtext in Text- und Zitat-Segmente (Reihenfolge erhalten). */
export function splitTextWithCitations(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION_INDEX_RE)) {
    const start = match.index ?? 0;
    if (start > last) {
      segments.push({ kind: 'text', value: text.slice(last, start) });
    }
    const index = Number(match[1]);
    segments.push({ kind: 'citation', value: match[0], index });
    last = start + match[0].length;
  }
  if (last < text.length) {
    segments.push({ kind: 'text', value: text.slice(last) });
  }
  return segments;
}

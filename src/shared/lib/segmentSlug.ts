/** Same algorithm as ragprep `NormalizeStringsService.slugify` (NFKD, strip marks). */
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;

export function slugifySegmentTitle(input: string): string {
  return (input ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Prefer stored `segment_slug`; if missing (stale seed / pre-sync), derive from title
 * so chapter notes key the same way as server `rag_paragraphs.segment_slug`.
 */
export function resolveSegmentSlug(
  segmentSlug: string | null | undefined,
  segmentTitle: string | null | undefined,
  segmentIndex: number,
): string {
  const stored = segmentSlug?.trim();
  if (stored) return stored;
  const derived = slugifySegmentTitle(segmentTitle ?? '');
  if (derived) return derived;
  return `chapter-${segmentIndex}`;
}

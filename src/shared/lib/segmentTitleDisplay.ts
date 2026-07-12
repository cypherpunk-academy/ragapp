import { parseInlineHtml } from '@/shared/lib/parseInlineHtml';

export type SegmentTitlePart = { text: string; italic: boolean };

/** Plain text for single-line headers (AppBar) — strips `<i>`, `<q>`, etc. */
export function stripSegmentTitleHtml(raw: string): string {
  if (!raw.includes('<')) return raw;
  return parseInlineHtml(raw).cleanText;
}

/** Split segment/chapter title into plain and italic parts for nested Text rendering. */
export function buildSegmentTitleParts(raw: string): SegmentTitlePart[] {
  if (!raw.includes('<')) return [{ text: raw, italic: false }];

  const { cleanText, extraRanges } = parseInlineHtml(raw);
  if (extraRanges.length === 0) return [{ text: cleanText, italic: false }];

  const parts: SegmentTitlePart[] = [];
  let cursor = 0;
  const italicRanges = extraRanges
    .filter((r) => r.kind === 'italic')
    .sort((a, b) => a.start - b.start || a.end - b.end);

  for (const { start, end } of italicRanges) {
    const from = Math.max(0, Math.min(start, cleanText.length));
    const to = Math.max(from, Math.min(end, cleanText.length));
    if (cursor < from) parts.push({ text: cleanText.slice(cursor, from), italic: false });
    if (from < to) parts.push({ text: cleanText.slice(from, to), italic: true });
    cursor = Math.max(cursor, to);
  }
  if (cursor < cleanText.length) parts.push({ text: cleanText.slice(cursor), italic: false });
  return parts.length > 0 ? parts : [{ text: cleanText, italic: false }];
}

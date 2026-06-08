import type Paragraph from '@/data/db/models/Paragraph';
import { parseInlineHtml } from './parseInlineHtml';

/** z. B. „¶2 · erste fünf Wörter …“ aus Absatztext. */
export function paragraphAnchorLabel(p: Paragraph): string {
  const { cleanText } = parseInlineHtml(p.textRaw);
  const tokens = cleanText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const firstFive = tokens.slice(0, 5);
  const preview =
    firstFive.length === 0 ? '…' : firstFive.join(' ') + (tokens.length > 5 ? ' …' : '');
  return `¶${p.paragraphNumber} · ${preview}`;
}

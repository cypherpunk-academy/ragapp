import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';

/** Absatztext für Philo-Prompt: eindeutiger Kopf (Nummer · Kapitel · Buch) + Volltext. */
export function formatContextParagraphText(opts: {
  text: string;
  paragraphNumber?: number | null;
  segmentTitle?: string | null;
  bookTitle?: string | null;
}): string {
  const body = opts.text.trim();
  if (!body) return '';
  const headerParts: string[] = [];
  if (opts.paragraphNumber != null) headerParts.push(`Absatz ${opts.paragraphNumber}`);
  if (opts.segmentTitle) headerParts.push(stripSegmentTitleHtml(opts.segmentTitle));
  if (opts.bookTitle) headerParts.push(opts.bookTitle);
  const header = headerParts.join(' · ');
  return header ? `${header}\n\n${body}` : body;
}

/**
 * Clipboard-Text für Zitat-Karten: Zitatwortlaut + Quellenzeile.
 * Autor „—" (Platzhalter der Karte) wird weggelassen.
 */
export function formatQuoteClipboardText(
  quote: string,
  author?: string,
  workTitle?: string,
): string {
  const q = quote.trim();
  if (!q) return '';

  const a = author?.trim();
  const w = workTitle?.trim();
  const authorOk = a && a !== '—' ? a : undefined;
  const sourceParts = [authorOk, w].filter((p): p is string => Boolean(p));
  if (sourceParts.length === 0) return q;

  return `${q}\n\n— ${sourceParts.join(', ')}`;
}

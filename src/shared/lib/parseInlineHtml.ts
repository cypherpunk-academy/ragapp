export type InlineHtmlRangeKind = 'italic' | 'quote';

export type InlineHtmlRange = { start: number; end: number; kind: InlineHtmlRangeKind };

/**
 * Strip inline HTML tags (<i>, <q ...>) from text, returning clean text and
 * derived annotation ranges. Used for books where markup is embedded in text_raw
 * instead of the separate annotations field.
 */
export function parseInlineHtml(rawText: string): { cleanText: string; extraRanges: InlineHtmlRange[] } {
  if (!rawText.includes('<')) return { cleanText: rawText, extraRanges: [] };

  const extraRanges: InlineHtmlRange[] = [];
  let cleanText = '';
  let i = 0;

  while (i < rawText.length) {
    if (rawText[i] === '<') {
      const closeIdx = rawText.indexOf('>', i);
      if (closeIdx === -1) { cleanText += rawText[i++]; continue; }

      const tag = rawText.slice(i + 1, closeIdx);
      const isClosing = tag.startsWith('/');
      const tagName = (isClosing ? tag.slice(1) : tag.split(/[\s>]/)[0]).trim().toLowerCase();

      if (tagName === 'i' || tagName === 'q') {
        if (!isClosing) {
          extraRanges.push({ start: cleanText.length, end: -1, kind: tagName === 'i' ? 'italic' : 'quote' });
        } else {
          const kind: InlineHtmlRangeKind = tagName === 'i' ? 'italic' : 'quote';
          for (let j = extraRanges.length - 1; j >= 0; j--) {
            if (extraRanges[j].kind === kind && extraRanges[j].end === -1) {
              extraRanges[j] = { ...extraRanges[j], end: cleanText.length };
              break;
            }
          }
        }
        i = closeIdx + 1;
      } else if (tagName === 'span' || tagName === 'a') {
        i = closeIdx + 1;
      } else {
        cleanText += rawText[i++];
      }
    } else {
      cleanText += rawText[i++];
    }
  }

  return { cleanText, extraRanges: extraRanges.filter((r) => r.end !== -1) };
}

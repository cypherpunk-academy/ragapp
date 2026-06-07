export function continueReadingLabel(segmentTitle: string | null): string {
  if (!segmentTitle) return 'WEITERLESEN';
  const short = segmentTitle.replace(/^\s*[IVXLC]+\.\s*/i, '').trim();
  const label = short.length > 36 ? `${short.slice(0, 33)}…` : short;
  return `WEITERLESEN · ${label.toUpperCase()}`;
}

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

import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';

export function continueReadingLabel(segmentTitle: string | null): string {
  if (!segmentTitle) return 'WEITERLESEN';
  const short = stripSegmentTitleHtml(segmentTitle).replace(/^\s*[IVXLC]+\.\s*/i, '').trim();
  const label = short.length > 36 ? `${short.slice(0, 33)}…` : short;
  return `WEITERLESEN · ${label.toUpperCase()}`;
}

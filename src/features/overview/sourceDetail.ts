import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';
import i18n from '@/shared/i18n';

export function continueReadingLabel(segmentTitle: string | null): string {
  if (!segmentTitle) return i18n.t('overview.continueReading');
  const short = stripSegmentTitleHtml(segmentTitle).replace(/^\s*[IVXLC]+\.\s*/i, '').trim();
  const label = short.length > 36 ? `${short.slice(0, 33)}…` : short;
  return i18n.t('overview.continueReadingWith', { label: label.toUpperCase() });
}

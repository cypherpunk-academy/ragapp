import { colorWithAlpha } from '@/shared/lib/color';

/**
 * Akzentfarbe für die Arbeitstext-Verknüpfung: dezentes Salbeigrün, sichtbar aber
 * nicht so auffällig wie z. B. die `begriff`-Entity-Farbe (waldgrün).
 * Verwendet im ChatTab-Header-Badge und im DocumentPreviewOverlay-Breadcrumb.
 */
export const NOTE_BADGE_ACCENT = '#3F8F5C';

/**
 * Akzent für Absatz-Bezug im Chat-Header — Theme-tertiary (#745470), violett.
 */
const PARAGRAPH_BADGE_ACCENT = '#745470';

export type NoteBadgeStyle = {
  backgroundColor: string;
  textColor: string;
};

export function getNoteBadgeStyle(isDark = false): NoteBadgeStyle {
  return {
    backgroundColor: colorWithAlpha(NOTE_BADGE_ACCENT, isDark ? 0.22 : 0.10),
    textColor: isDark ? '#8FCB9E' : '#2E5E3B',
  };
}

export function getParagraphBadgeStyle(isDark = false): NoteBadgeStyle {
  return {
    backgroundColor: colorWithAlpha(PARAGRAPH_BADGE_ACCENT, isDark ? 0.28 : 0.14),
    textColor: isDark ? '#E2BBDB' : '#5B3D58',
  };
}

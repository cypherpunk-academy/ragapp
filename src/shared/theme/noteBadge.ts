import { colorWithAlpha } from '@/shared/lib/color';

/**
 * Akzentfarbe für die Arbeitstext-Verknüpfung: dezentes Salbeigrün, sichtbar aber
 * nicht so auffällig wie z. B. die `begriff`-Entity-Farbe (waldgrün).
 * Verwendet im ChatTab-Header-Badge und im DocumentPreviewOverlay-Breadcrumb (Punkt 5/4 des Plans).
 */
const NOTE_BADGE_ACCENT = '#3F8F5C';

export type NoteBadgeStyle = {
  backgroundColor: string;
  textColor: string;
};

export function getNoteBadgeStyle(isDark = false): NoteBadgeStyle {
  return {
    backgroundColor: colorWithAlpha(NOTE_BADGE_ACCENT, isDark ? 0.22 : 0.15),
    textColor: isDark ? '#8FCB9E' : '#2E5E3B',
  };
}

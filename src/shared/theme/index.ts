// Theme barrel — generated tokens, semantic typography, icons.
// Regenerate tokens: npm run build:theme

export {
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  fontWeight,
  lineHeight,
} from './generated';

import { fontSize as rawFontSize } from './generated';
import { FONT_SCALE, scaleSize } from './tabletScale';

/** Token-Schriftgrößen — auf Tablets skaliert (siehe FONT_SCALE). */
export const fontSize = FONT_SCALE === 1
  ? rawFontSize
  : {
      xs: scaleSize(rawFontSize.xs),
      sm: scaleSize(rawFontSize.sm),
      md: scaleSize(rawFontSize.md),
      lg: scaleSize(rawFontSize.lg),
      xl: scaleSize(rawFontSize.xl),
      '2xl': scaleSize(rawFontSize['2xl']),
      '3xl': scaleSize(rawFontSize['3xl']),
    } as typeof rawFontSize;

export { fonts, textStyles, typography } from './semantic';
export {
  isTablet,
  FONT_SCALE,
  READING_TABLET_SCALE,
  READING_TABLET_MAX_MEASURE,
  scaleSize,
} from './tabletScale';

export {
  ICONS,
  ICON_SIZES,
  contributionIcon,
  iconColor,
  type MaterialIconName,
  type IconSizeKey,
  type ContributionKind,
  type IconColorRole,
} from './icons';

export { getNoteBadgeStyle, getParagraphBadgeStyle, NOTE_BADGE_ACCENT, type NoteBadgeStyle } from './noteBadge';
export { READING_ITALIC, readingItalicColor } from './readingAccent';

import { lightColors, darkColors, spacing, borderRadius } from './generated';
import { fonts, textStyles, typography } from './semantic';

export type ColorScheme = typeof lightColors;

export const theme = {
  light: lightColors,
  dark: darkColors,
  spacing,
  fonts,
  textStyles,
  typography,
  borderRadius,
} as const;

export type Theme = typeof theme;

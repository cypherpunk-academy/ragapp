// Theme barrel — generated tokens, semantic typography, icons.
// Regenerate tokens: npm run build:theme

export {
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
} from './generated';

export { fonts, textStyles, typography } from './semantic';

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

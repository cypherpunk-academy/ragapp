// Theme barrel — generated tokens + semantic typography.
// Regenerate tokens: npm run build:theme

export {
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
} from './theme.generated';

export { fonts, textStyles, typography } from './theme.semantic';

import { lightColors, darkColors, spacing, borderRadius } from './theme.generated';
import { fonts, textStyles, typography } from './theme.semantic';

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

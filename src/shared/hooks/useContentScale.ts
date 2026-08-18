import { useSettings, type FontSizeLevel } from '@/shared/contexts/SettingsContext';
import { isTablet } from '@/shared/theme/tabletScale';

const SCALE: Record<FontSizeLevel, number> = {
  small: 0.88,
  medium: 1.0,
  large: 1.15,
  xlarge: 1.32,
  xxlarge: 1.50,
};

const DEVICE_CONTENT_SCALE = isTablet() ? 1.1 : 0.9;

/** Gibt den Schriftgrößen-Multiplikator für Lesetext und Chat-Bubbles zurück. */
export function useContentScale(): number {
  return SCALE[useSettings().fontSizeLevel] * DEVICE_CONTENT_SCALE;
}

/** Skaliert fontSize und lineHeight eines Text-Styles mit dem gegebenen Faktor. */
export function scaleContentStyle<T extends { fontSize?: number; lineHeight?: number }>(
  style: T,
  scale: number,
): T {
  if (scale === 1) return style;
  return {
    ...style,
    ...(typeof style.fontSize === 'number' ? { fontSize: Math.round(style.fontSize * scale) } : {}),
    ...(typeof style.lineHeight === 'number' ? { lineHeight: Math.round(style.lineHeight * scale) } : {}),
  };
}

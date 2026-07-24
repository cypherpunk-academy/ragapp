import { Dimensions, Platform } from 'react-native';

/** iPad bzw. Android-Tablet (kürzeste Kante ≥ 600). */
export function isTablet(): boolean {
  if (Platform.OS === 'ios') return Platform.isPad === true;
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 600;
}

/** Nur Tablets: +30 %, dann nochmals +30 % (1.3² ≈ 1.69). */
export const FONT_SCALE = isTablet() ? 1.69 : 1;

/**
 * Zusätzliche Lesetext-Skalierung nur auf Tablets (+30 %, dann −10 % → 1.17).
 * Betrifft Kapitelüberschrift, Fließtext und Meta/Navigation im Lesen-Tab.
 * Zeilenhöhe bleibt über denselben Faktor proportional.
 */
export const READING_TABLET_SCALE = isTablet() ? 1.17 : 1;

/** Max. Textbreite (pt) im Lesen-Tab auf Tablets — mehr seitlicher Rand. */
export const READING_TABLET_MAX_MEASURE = 640;

export function scaleSize(n: number): number {
  return FONT_SCALE === 1 ? n : Math.round(n * FONT_SCALE);
}

type Sized = { fontSize?: number; lineHeight?: number };

export function scaleTypeStyle<T extends Sized>(style: T): T {
  if (FONT_SCALE === 1) return style;
  return {
    ...style,
    ...(typeof style.fontSize === 'number' ? { fontSize: scaleSize(style.fontSize) } : {}),
    ...(typeof style.lineHeight === 'number' ? { lineHeight: scaleSize(style.lineHeight) } : {}),
  };
}

export function scaleTypeScale<T extends Record<string, Sized>>(scale: T): T {
  if (FONT_SCALE === 1) return scale;
  const out = {} as T;
  for (const key of Object.keys(scale) as (keyof T)[]) {
    out[key] = scaleTypeStyle(scale[key]);
  }
  return out;
}

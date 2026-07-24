/** Figma Lesen/Default — rust italic (#b25738); Darkmode aufgehellt für Kontrast. */
export const READING_ITALIC = {
  light: '#B25738',
  dark: '#E8A07A',
} as const;

export function readingItalicColor(isDark: boolean): string {
  return isDark ? READING_ITALIC.dark : READING_ITALIC.light;
}

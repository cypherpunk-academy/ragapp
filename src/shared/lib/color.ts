/**
 * Konvertiert einen Hex-Farbwert mit einem Alpha-Wert in eine rgba()-CSS-Farbe.
 * @param hex  Hex-Farbe, z. B. '#4B5C92' oder '4B5C92'
 * @param alpha  Deckkraft 0–1
 */
export function colorWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

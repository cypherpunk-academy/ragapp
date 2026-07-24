// Semantic typography — Figma font families & text styles (not in tokens.json).
// Edit manually when design/figma/inventory.md §6 changes.
// Token scales: import from ./generated (npm run build:theme).
// Tablets: fontSize/lineHeight skaliert via tabletScale (FONT_SCALE).

import { fontSize as tokenFontSize } from './generated';
import { scaleTypeScale } from './tabletScale';

/** Figma font/family/* — see design/figma/inventory.md §6 */
export const fonts = {
  display: 'Cinzel_400Regular',
  displayBold: 'Cinzel_700Bold',
  label: 'Marcellus_400Regular',
  source: 'CormorantGaramond_400Regular',
  sourceItalic: 'CormorantGaramond_400Regular_Italic',
  /** User-/KI-generierter Text (Notizen, Chat) — Figma font/family/derived */
  derived: 'Lora_400Regular',
  derivedItalic: 'Lora_400Regular_Italic',
  derivedBold: 'Lora_700Bold',
  derivedBoldItalic: 'Lora_700Bold_Italic',
} as const;

/** Semantic text styles mapped from Figma (Cinzel / Marcellus / Cormorant) */
const textStylesBase = {
  titlePage: {
    fontFamily: fonts.display,
    fontSize: tokenFontSize.xl,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  titleCard: {
    fontFamily: fonts.display,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
  },
  labelTab: {
    fontFamily: fonts.label,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  labelSection: {
    fontFamily: fonts.label,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  titleLastRead: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  sourceMeta: {
    fontFamily: fonts.sourceItalic,
    fontSize: tokenFontSize.sm,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  sourceEdition: {
    fontFamily: fonts.label,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  continueCta: {
    fontFamily: fonts.label,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  chapterTitle: {
    fontFamily: fonts.display,
    fontSize: tokenFontSize.md,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  /** Lesen-Tab: Kapitelüberschrift über dem ersten Absatz (Figma node 3:10) */
  readingChapterTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    letterSpacing: 1.2,
  },
  readingBody: {
    fontFamily: fonts.source,
    fontSize: tokenFontSize.lg,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  readingItalic: {
    fontFamily: fonts.sourceItalic,
    fontSize: tokenFontSize.lg,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  readingParagraphNumber: {
    fontFamily: fonts.sourceItalic,
    fontSize: tokenFontSize.lg,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  /** Übersicht: expandierte Kapitel-Zusammenfassung — Special Elite, leicht unter Kapitelüberschrift (chapterTitle) */
  aiSummary: {
    fontFamily: fonts.derived,
    fontSize: tokenFontSize.md,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  /** Lesen / Beiträge — AppBar-Titel */
  contributionsTitle: {
    fontFamily: fonts.display,
    fontSize: tokenFontSize.xl,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  /** Lesen / Beiträge — Filter-Tabs (Marcellus, Mixed Case) */
  contributionsTab: {
    fontFamily: fonts.label,
    fontSize: tokenFontSize.sm,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  /** Lesen / Beiträge — Breadcrumb-Zeile über der Liste */
  contributionsBreadcrumb: {
    fontFamily: fonts.label,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  /** Notiz-Inhalt (User/KI) */
  noteBody: {
    fontFamily: fonts.derived,
    fontSize: tokenFontSize.md,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  /** Gesprächs-Karte: Nutzerfrage als hervorgehobenes Snippet */
  conversationSnippet: {
    fontFamily: fonts.derived,
    fontSize: tokenFontSize.md,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  /** Notiz-Datum, Meta */
  noteMeta: {
    fontFamily: fonts.label,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
  /** Arbeitstext ##-Abschnittsüberschrift (Lora Bold) */
  noteHeading: {
    fontFamily: fonts.derivedBold,
    fontSize: tokenFontSize.md,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  /** Arbeitstext ###-Unterabschnittsüberschrift (Lora Bold, kleiner) */
  noteSubheading: {
    fontFamily: fonts.derivedBold,
    fontSize: tokenFontSize.sm,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
} as const;

export const textStyles = scaleTypeScale(textStylesBase);

/** Material 3 type scale (sizes only; no custom fontFamily) */
const typographyBase = {
  displayLarge:  { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
  displaySmall:  { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '400' as const },
  headlineMedium:{ fontSize: 28, lineHeight: 36, fontWeight: '400' as const },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '400' as const },
  titleLarge:    { fontSize: tokenFontSize.xl, lineHeight: 28, fontWeight: '400' as const },
  titleMedium:   { fontSize: tokenFontSize.md, lineHeight: 24, fontWeight: '500' as const },
  titleSmall:    { fontSize: tokenFontSize.sm, lineHeight: 20, fontWeight: '500' as const },
  bodyLarge:     { fontSize: tokenFontSize.md, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium:    { fontSize: tokenFontSize.sm, lineHeight: 20, fontWeight: '400' as const },
  bodySmall:     { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  labelLarge:    { fontSize: tokenFontSize.sm, lineHeight: 20, fontWeight: '500' as const },
  labelMedium:   { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSmall:    { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
} as const;

export const typography = scaleTypeScale(typographyBase);

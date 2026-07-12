import React, { useMemo } from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles } from '../theme';
import type { ParagraphAnnotations } from '../types';
import { useReading } from '../contexts/ReadingContext';
import { parseInlineHtml, splitQuoteMarksFromItalicCore } from '../lib/parseInlineHtml';

/** Figma Lesen/Default — rust italic (#b25738) */
const READING_ITALIC_COLOR = '#B25738';
/** Figma Lesen/Default — Fremdzitat, leicht violett (heller als Schemes/Primary) */
const READING_FOREIGN_QUOTE_COLOR = {
  light: '#6B68AD',
  dark: '#D0C6FF',
} as const;

/**
 * ~10px Abstand in Body-Schrift (18px): En (~9px) + Hair (~2px).
 * marginLeft/paddingLeft auf nested Text wird in RN oft ignoriert.
 */
const SUFFIX_ICON_GAP_CHARS = '\u2002\u200A';

/** Seitenverweis-Lupe (🔎/🔍) 30 % kleiner als Fließtext. */
const PAGE_REF_LOUPE_SCALE = 0.7;
const PAGE_REF_LOUPE_RE = /^(\u{1F50D}|\u{1F50E})(\s*)/u;

function splitPageRefLoupe(text: string): { icon: string; rest: string } {
  const match = text.match(PAGE_REF_LOUPE_RE);
  if (!match) return { icon: '', rest: text };
  return { icon: match[1] ?? '', rest: text.slice(match[0].length) };
}

type SegmentKind = 'plain' | 'italic' | 'quote' | 'page_ref' | 'marker';

type Segment = {
  text: string;
  kind: SegmentKind;
  targetParagraphId?: string;
  /** «  should be rendered immediately before this segment (quote range starts here). */
  quoteOpener?: boolean;
  /** » should be rendered immediately after this segment (quote range ends here). */
  quoteCloser?: boolean;
};

type AnnotatedRange = { start: number; end: number; kind: SegmentKind; targetParagraphId?: string };

const LEGACY_INLINE_HTML_RE = /<(i|q|a)\b/i;

function hasLegacyInlineHtml(text: string): boolean {
  return LEGACY_INLINE_HTML_RE.test(text);
}

function buildSegments(rawText: string, annotations: ParagraphAnnotations | null, addGuillemetMarkers: boolean): Segment[] {
  const legacy = hasLegacyInlineHtml(rawText);
  const { cleanText: text, extraRanges } = legacy
    ? parseInlineHtml(rawText)
    : { cleanText: rawText, extraRanges: [] as ReturnType<typeof parseInlineHtml>['extraRanges'] };

  const allRanges: AnnotatedRange[] = [
    ...(legacy ? extraRanges : []),
    ...(annotations?.italics ?? []).map(({ start, end }) => ({ start, end, kind: 'italic' as const })),
    ...(annotations?.foreign_quotes ?? []).map(({ start, end }) => ({ start, end, kind: 'quote' as const })),
    ...(annotations?.page_refs ?? []).map(({ start, end, target_paragraph_id }) => ({
      start,
      end,
      kind: 'page_ref' as const,
      targetParagraphId: target_paragraph_id,
    })),
  ].sort((a, b) => a.start - b.start || a.end - b.end);

  if (allRanges.length === 0) return [{ text, kind: 'plain' }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { start, end, kind, targetParagraphId } of allRanges) {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end, text.length));
    if (cursor < from) segments.push({ text: text.slice(cursor, from), kind: 'plain' });
    const actualFrom = Math.max(from, cursor);
    if (actualFrom < to) segments.push({ text: text.slice(actualFrom, to), kind, targetParagraphId });
    cursor = Math.max(cursor, to);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), kind: 'plain' });

  // Mark quote-range boundaries on segments so guillemets land at the correct position
  // even when the quote range starts with a nested <i> range (which would otherwise clip
  // the quote segment, pushing « to after the italic content).
  if (addGuillemetMarkers) {
    const quoteRanges = allRanges.filter(r => r.kind === 'quote');
    if (quoteRanges.length > 0) {
      let pos = 0;
      const segStarts = segments.map(seg => { const s = pos; pos += seg.text.length; return s; });

      for (const qr of quoteRanges) {
        // opener: first segment that covers qr.start
        for (let si = 0; si < segments.length; si++) {
          const segStart = segStarts[si]!;
          if (segStart <= qr.start && segStart + segments[si]!.text.length > qr.start) {
            segments[si] = { ...segments[si]!, quoteOpener: true };
            break;
          }
          if (segStart >= qr.start) {
            segments[si] = { ...segments[si]!, quoteOpener: true };
            break;
          }
        }
        // closer: last segment that ends at or before qr.end
        for (let si = segments.length - 1; si >= 0; si--) {
          if (segStarts[si]! < qr.end) {
            segments[si] = { ...segments[si]!, quoteCloser: true };
            break;
          }
        }
      }
    }
  }

  return segments;
}

/**
 * Fügt an der Zeichenposition `offset` ein zero-length Marker-Segment ein (roter Punkt).
 * Bewusst getrennt von buildSegments' Overlap-Logik, damit deren Annotation-Ranges unangetastet bleiben.
 */
function insertMarkerSegment(segments: Segment[], offset: number): Segment[] {
  const result: Segment[] = [];
  let cursor = 0;
  let inserted = false;
  for (const seg of segments) {
    const segLen = seg.text.length;
    if (!inserted && offset >= cursor && offset <= cursor + segLen) {
      const local = offset - cursor;
      if (local <= 0) {
        result.push({ text: '', kind: 'marker' });
        result.push(seg);
      } else if (local >= segLen) {
        result.push(seg);
        result.push({ text: '', kind: 'marker' });
      } else {
        result.push({ ...seg, text: seg.text.slice(0, local), quoteCloser: false });
        result.push({ text: '', kind: 'marker' });
        result.push({ ...seg, text: seg.text.slice(local), quoteOpener: false });
      }
      inserted = true;
    } else {
      result.push(seg);
    }
    cursor += segLen;
  }
  if (!inserted) result.push({ text: '', kind: 'marker' });
  return result;
}

function isFullQuoteParagraph(text: string, annotations: ParagraphAnnotations | null): boolean {
  const quotes = annotations?.foreign_quotes ?? [];
  return quotes.some((q) => q.start === 0 && q.end >= text.length);
}

type Props = {
  text: string;
  annotations: ParagraphAnnotations | null;
  style?: object;
  prefix?: React.ReactNode;
  /** Inline am Ende des Absatz-Textes (z. B. Beiträge-Zähler) — nur Text-kompatible Kinder. */
  suffix?: React.ReactNode;
  /** ID des aktuellen Absatzes — wird als Rückkehrpunkt in den Seitenverweis-Verlauf gespeichert. */
  paragraphId?: string;
  /** Zeichen-Offset für den temporären roten Punkt-Marker (Zitat-Sprung aus der Suche). */
  markerOffset?: number | null;
};

export default function ParagraphRenderer({ text, annotations, style, prefix, suffix, paragraphId, markerOffset }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();
  const fullQuote = isFullQuoteParagraph(text, annotations);
  const segments = useMemo(() => buildSegments(text, annotations, !fullQuote), [text, annotations, fullQuote]);
  const segmentsWithMarker = useMemo(
    () => (markerOffset == null ? segments : insertMarkerSegment(segments, markerOffset)),
    [segments, markerOffset],
  );

  const quoteColor = colorScheme === 'dark' ? READING_FOREIGN_QUOTE_COLOR.dark : READING_FOREIGN_QUOTE_COLOR.light;
  const baseColor = fullQuote ? quoteColor : colors.onBackground;

  return (
    <Text style={[textStyles.readingBody, styles.base, { color: baseColor }, style]}>
      {prefix}
      {segmentsWithMarker.map((seg, i) => {
        if (seg.kind === 'italic') {
          const { outerBefore, core, outerAfter } = splitQuoteMarksFromItalicCore(seg.text);
          return (
            <Text key={i}>
              {seg.quoteOpener ? '«' : null}
              {outerBefore ? <Text>{outerBefore}</Text> : null}
              <Text style={[textStyles.readingItalic, { color: READING_ITALIC_COLOR }]}>{core}</Text>
              {outerAfter ? <Text>{outerAfter}</Text> : null}
              {seg.quoteCloser ? '»' : null}
            </Text>
          );
        }
        if (seg.kind === 'quote') {
          return (
            <Text key={i} style={{ color: quoteColor }}>
              {seg.quoteOpener ? '«' : null}
              {seg.text}
              {seg.quoteCloser ? '»' : null}
            </Text>
          );
        }
        if (seg.kind === 'page_ref') {
          const { icon, rest } = splitPageRefLoupe(seg.text);
          const bodyFontSize =
            typeof textStyles.readingBody.fontSize === 'number' ? textStyles.readingBody.fontSize : 18;
          return (
            <Text
              key={i}
              style={[styles.pageRef, { color: colors.tertiary }]}
              onPress={() => navigateToRead({ segmentIndex: null, paragraphId: seg.targetParagraphId ?? null, pushHistory: true, fromParagraphId: paragraphId })}
            >
              {icon ? (
                <Text style={{ fontSize: bodyFontSize * PAGE_REF_LOUPE_SCALE }}>{icon}</Text>
              ) : null}
              {rest}
            </Text>
          );
        }
        if (seg.kind === 'marker') {
          return (
            <Text key={i} style={{ color: colors.error }}>
              {'\u25CF '}
            </Text>
          );
        }
        return <Text key={i}>{seg.text}</Text>;
      })}
      {suffix ? (
        <>
          <Text>{SUFFIX_ICON_GAP_CHARS}</Text>
          <Text style={styles.suffixIcons}>{suffix}</Text>
        </>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'justify',
  },
  pageRef: {
    textDecorationLine: 'underline',
  },
  /** Zeilenhöhe wie Fließtext, damit Icons mit der letzten Zeile bündig sind. */
  suffixIcons: {
    lineHeight: textStyles.readingBody.lineHeight,
  },
});

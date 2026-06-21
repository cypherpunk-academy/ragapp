import React, { useMemo } from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles } from '../theme';
import type { ParagraphAnnotations } from '../types';
import { useReading } from '../contexts/ReadingContext';
import { parseInlineHtml, splitQuoteMarksFromItalicCore } from '../lib/parseInlineHtml';

/** Figma Lesen/Default — rust italic (#b25738) */
const READING_ITALIC_COLOR = '#B25738';

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

type SegmentKind = 'plain' | 'italic' | 'quote' | 'page_ref';

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

function buildSegments(rawText: string, annotations: ParagraphAnnotations | null, addGuillemetMarkers: boolean): Segment[] {
  const { cleanText: text, extraRanges } = parseInlineHtml(rawText);

  const allRanges: AnnotatedRange[] = [
    ...extraRanges,
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
};

export default function ParagraphRenderer({ text, annotations, style, prefix, suffix, paragraphId }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();
  const fullQuote = isFullQuoteParagraph(text, annotations);
  const segments = useMemo(() => buildSegments(text, annotations, !fullQuote), [text, annotations, fullQuote]);

  const baseColor = fullQuote ? colors.primary : colors.onBackground;

  return (
    <Text style={[textStyles.readingBody, styles.base, { color: baseColor }, style]}>
      {prefix}
      {segments.map((seg, i) => {
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
            <Text key={i} style={{ color: colors.primary }}>
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

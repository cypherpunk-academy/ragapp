import React, { useMemo } from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles } from '../theme';
import type { ParagraphAnnotations } from '../types';
import { useReading } from '../contexts/ReadingContext';

/** Figma Lesen/Default — rust italic (#b25738) */
const READING_ITALIC_COLOR = '#B25738';

/**
 * ~10px Abstand in Body-Schrift (18px): En (~9px) + Hair (~2px).
 * marginLeft/paddingLeft auf nested Text wird in RN oft ignoriert.
 */
const SUFFIX_ICON_GAP_CHARS = '\u2002\u200A';

type SegmentKind = 'plain' | 'italic' | 'quote' | 'page_ref';

type Segment = { text: string; kind: SegmentKind; targetParagraphId?: string };

type AnnotatedRange = { start: number; end: number; kind: SegmentKind; targetParagraphId?: string };

function buildSegments(text: string, annotations: ParagraphAnnotations | null): Segment[] {
  const ranges: AnnotatedRange[] = [
    ...(annotations?.italics ?? []).map(({ start, end }) => ({ start, end, kind: 'italic' as const })),
    ...(annotations?.foreign_quotes ?? []).map(({ start, end }) => ({ start, end, kind: 'quote' as const })),
    ...(annotations?.page_refs ?? []).map(({ start, end, target_paragraph_id }) => ({
      start,
      end,
      kind: 'page_ref' as const,
      targetParagraphId: target_paragraph_id,
    })),
  ].sort((a, b) => a.start - b.start || a.end - b.end);

  if (ranges.length === 0) return [{ text, kind: 'plain' }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { start, end, kind, targetParagraphId } of ranges) {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end, text.length));
    if (cursor < from) segments.push({ text: text.slice(cursor, from), kind: 'plain' });
    if (from < to) segments.push({ text: text.slice(from, to), kind, targetParagraphId });
    cursor = Math.max(cursor, to);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), kind: 'plain' });

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
};

export default function ParagraphRenderer({ text, annotations, style, prefix, suffix }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();
  const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);
  const fullQuote = isFullQuoteParagraph(text, annotations);

  const baseColor = fullQuote ? colors.primary : colors.onBackground;

  return (
    <Text style={[textStyles.readingBody, styles.base, { color: baseColor }, style]}>
      {prefix}
      {segments.map((seg, i) => {
        if (seg.kind === 'italic') {
          return (
            <Text key={i} style={[textStyles.readingItalic, { color: READING_ITALIC_COLOR }]}>
              {seg.text}
            </Text>
          );
        }
        if (seg.kind === 'quote') {
          const quoted = fullQuote ? seg.text : `«${seg.text}»`;
          return (
            <Text key={i} style={{ color: colors.primary }}>
              {quoted}
            </Text>
          );
        }
        if (seg.kind === 'page_ref') {
          return (
            <Text
              key={i}
              style={[styles.pageRef, { color: colors.tertiary }]}
              onPress={() => navigateToRead({ segmentIndex: null, paragraphId: seg.targetParagraphId ?? null })}
            >
              {seg.text}
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
